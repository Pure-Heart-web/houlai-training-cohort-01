#!/usr/bin/env python3
"""Public structure/link/data and optional submission format checks, never grading."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit, parse_qs
import argparse
import csv
import json
import re
import sys

REQUIRED = ['README.md','learner/任务书.md','learner/七日安排.md','learner/帮助等级.md',
 'learner/漫画分镜.md','inputs/模拟资料.md','inputs/历史Excel.csv','templates/工作模板.md',
 'roles/岗位任务.md','roles/技术线.md','roles/实施线.md','roles/交付线.md',
 'technical-lab/ISSUE.md','technical-lab/checker.py','technical-lab/test_checker.py',
 'assessment/公开评价.md','assessment/导师评分记录.md','methods/方法收录模板.md','开营与验收.md',
 'operations/Day1与Day5流程.md','operations/导师公开操作.md','operations/私有资料接入.md',
 'console/index.html','console/app.js','console/submission.js','console/viewer.html',
 'tools/start_training.sh','tools/serve_training.py']
FIELDS = ['initial','facts','questions','modelComparisons','myJudgment','points','actions','artifact','verification','reflection']
EXTRA = ['aiLevel','learner','role','mode','aiHelpDetails','initialRecordedAt','initialSnapshot','initialFactsSnapshot','promptMapRecordedAt','lastEdited']
class Links(HTMLParser):
    def __init__(self):
        super().__init__(); self.links=[]
    def handle_starttag(self,tag,attrs):
        for k,v in attrs:
            if k in ('src','href') and v: self.links.append(v)
def validate_submission(path):
    if path.stat().st_size > 1024*1024: raise ValueError('JSON 超过 1 MiB')
    x=json.loads(path.read_text(encoding='utf-8'))
    if not isinstance(x,dict) or x.get('format')!='houlai-training-submission-v2': raise ValueError('format 不合法')
    if set(x)-{'format','schemaVersion','day','dayTitle','exportedAt','submission'}: raise ValueError('未知顶层字段')
    if type(x.get('schemaVersion',2)) is not int or x.get('schemaVersion',2)!=2: raise ValueError('schemaVersion 不合法')
    if type(x.get('day')) is not int or not 1<=x['day']<=7: raise ValueError('day 不合法')
    if not isinstance(x.get('dayTitle'),str) or len(x['dayTitle'])>200: raise ValueError('dayTitle 不合法')
    from datetime import datetime
    def is_date(value):
        if not isinstance(value,str) or not re.match(r'^\d{4}-\d{2}-\d{2}T',value): return False
        try: datetime.fromisoformat(value.replace('Z','+00:00')); return True
        except ValueError: return False
    if not is_date(x.get('exportedAt')): raise ValueError('exportedAt 不合法')
    d=x.get('submission')
    if not isinstance(d,dict) or set(d)-set(FIELDS+EXTRA): raise ValueError('submission 结构不合法')
    for k in FIELDS:
        if not isinstance(d.get(k),str) or len(d[k])>20000: raise ValueError(k+' 不合法')
    for k in EXTRA:
        if k in d and not isinstance(d[k],str): raise ValueError(k+' 必须为文本')
    if d.get('aiLevel') not in ['未记录','H0','H1','H2','H3']: raise ValueError('帮助等级不合法')
    if d.get('role','未选择') not in ['未选择','技术','实施','交付']: raise ValueError('岗位不合法')
    if d.get('mode','练习') not in ['练习','独立考核']: raise ValueError('性质不合法')
    for k,limit in [('learner',100),('aiHelpDetails',20000),('initialSnapshot',20000),('initialFactsSnapshot',20000)]:
        if len(d.get(k,''))>limit: raise ValueError(k+' 过长')
    for k in ['initialRecordedAt','promptMapRecordedAt','lastEdited']:
        if d.get(k) and not is_date(d[k]): raise ValueError(k+' 时间不合法')
    if d.get('initialRecordedAt') and not all(d.get(k,'').strip() for k in ['initialSnapshot','initialFactsSnapshot']): raise ValueError('原始快照不完整')
    return x

def inspect(root):
    errors=[]; count=0
    for rel in REQUIRED:
        f=root/rel
        if not f.is_file() or not f.stat().st_size: errors.append('缺失/空文件：'+rel)
    for f in root.rglob('*'):
        if f.is_symlink(): errors.append('不允许分发符号链接：'+str(f.relative_to(root))); continue
        if not f.is_file(): continue
        if f.stat().st_size==0: errors.append('空文件：'+str(f.relative_to(root)))
        name=f.name.lower()
        if re.search(r'^(导师手册|独立考核题与参考|标准答案)|^(hidden[-_]?test|reference[-_]?solution|answer[-_]?key)',name): errors.append('疑似私有文件：'+str(f.relative_to(root)))
        if f.suffix not in ['.md','.html']: continue
        text=f.read_text(encoding='utf-8')
        if f.suffix=='.md': links=re.findall(r'\[[^\]]*\]\(([^\s)]+)\)',text)
        else:
            parser=Links(); parser.feed(text); links=parser.links
        for link in links:
            url=urlsplit(link)
            if url.scheme or url.netloc or not url.path: continue
            target=(f.parent/unquote(url.path)).resolve()
            # Package must be independently distributable.
            if not target.is_relative_to(root): errors.append(f'{f.relative_to(root)} 包外链接：{link}');continue
            if not target.exists(): errors.append(f'{f.relative_to(root)} 失效链接：{link}')
            if target.name=='viewer.html' and 'file' in parse_qs(url.query):
                doc=(root/parse_qs(url.query)['file'][0]).resolve()
                if not doc.is_relative_to(root) or not doc.is_file(): errors.append('查看器目标无效：'+link)
            count+=1
    try:
        with (root/'inputs/历史Excel.csv').open(encoding='utf-8-sig',newline='') as f: rows=list(csv.DictReader(f))
        if [(r['记录ID'],r['历史估算值'],r['单位']) for r in rows] != [('X-01','30','m³/h'),('X-02','32','m'),('X-03','20','%'),('X-04','50','℃')]: errors.append('历史表与本期数据不符')
    except (OSError,ValueError,KeyError,csv.Error) as e: errors.append('CSV 错误：'+str(e))
    try:
        source=(root/'inputs/模拟资料.md').read_text(encoding='utf-8')
        # Public source values, not mentor judgments.
        for marker, values in [('## T-A',['30 m³/h','28 m','15%','40 ℃']),('## T-B',['32 m³/h','28 m','15%','45 ℃'])]:
            section=source.split(marker,1)[1].split('\n## ',1)[0]
            if not all(v in section for v in values): errors.append(marker+' 公开原始参数不符')
        if '530 L/min' not in source or 'E-01' not in source: errors.append('邮件原始数据缺失')
        rubric=(root/'assessment/公开评价.md').read_text(encoding='utf-8')
        points=[int(v) for v in re.findall(r'^\|[^|]+\|\s*(\d+)\s*\|',rubric,re.M)]
        html=(root/'console/index.html').read_text(encoding='utf-8').split('class="publicRubric"',1)[1].split('</table>',1)[0]
        ui_points=[int(v) for v in re.findall(r'<td>(\d+)</td>',html)]
        if points!=[20,25,10,25,10,10] or ui_points!=points: errors.append('训练台与公开评分权重不一致')
        schedule=(root/'learner/七日安排.md').read_text(encoding='utf-8')
        daily=[]
        for line in schedule.splitlines():
            if re.match(r'^\| [1-7] \|',line):
                nums=[int(n) for n in re.findall(r'\d+',line.split('|')[2])]
                daily.append(sum(nums))
        if daily!=[150]*7: errors.append('七日时间总和不为每天 150 分钟')
    except (OSError,IndexError,ValueError) as e: errors.append('公开数据/评分/时间检查失败：'+str(e))
    print(f'检查 {len(REQUIRED)} 个必需文件、{count} 个本地链接；公开参数/CSV、评分权重与七日时间。')
    return errors

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('root',nargs='?',default=str(Path(__file__).resolve().parents[1]));parser.add_argument('--submission',type=Path)
    args=parser.parse_args();root=Path(args.root).resolve();errors=inspect(root)
    if args.submission:
        try: validate_submission(args.submission);print('提交 JSON 基本格式通过（允许未填字段，不代表达标）。')
        except (OSError,ValueError,TypeError) as e: errors.append('提交格式：'+str(e))
    for e in errors: print('FAIL',e)
    if not errors: print('PASS 静态检查通过；私有内容扫描仅为文件名启发式，仍须人工审阅；未验证独立能力或跨账户权限。')
    return bool(errors)
if __name__=='__main__': sys.exit(main())
