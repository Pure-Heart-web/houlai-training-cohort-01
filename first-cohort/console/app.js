/* 模拟训练交互台；所有内容仅保存在当前浏览器，无付费 API。 */
(function(){
'use strict';
const S=TrainingSubmission,FIELDS=S.FIELDS,KEY='houlai_training_cohort01_v2';
const DAYS=[
 ['场景与初始认识','先独立阅读，再核对原文。','30 分钟个人记录片段',1800],
 ['Prompt Map 与比较','自行设计地图并核验至少两份观点。','30 分钟比较片段',1800],
 ['理解与行动','关 AI 写理解包，执行行动卡。','30 分钟行动片段',1800],
 ['岗位分支实操','选择技术、实施或交付任务。','45 分钟岗位片段',2700],
 ['限时岗位实操','60 分钟公开限时练习；获得 AI 帮助如实记录。','60 分钟岗位实操',3600],
 ['模拟交付与复核','交接、接收反馈和个人方法复盘。','30 分钟复核片段',1800],
 ['独立考核与答辩','未见题 60 分钟、信息判断 20 分钟；按仓库全天日程组织。','60 分钟独立实操（需导师发题）',3600]
];
const STAGES=['独立思考','Prompt Map','独立理解','行动与复盘'];
const el=id=>document.getElementById(id);let data={version:2,days:{}},day=0,stage=0,seconds=1800,running=false,interval=null,remaining={},storageBlocked=false;
const empty=()=>Object.fromEntries([...FIELDS.map(k=>[k,'']),['aiLevel','未记录'],['learner',''],['role','未选择'],['mode','练习'],['aiHelpDetails',''],['initialRecordedAt',''],['initialSnapshot',''],['initialFactsSnapshot',''],['promptMapRecordedAt',''],['lastEdited','']]);
const current=()=>data.days[day]||(data.days[day]=empty());
function status(message){el('status').textContent=message;}
function load(){
 try{const raw=localStorage.getItem(KEY);if(!raw)return;const x=JSON.parse(raw);if(!x||x.version!==2||!x.days||Array.isArray(x.days)||typeof x.days!=='object')throw Error('草稿结构错误');
 const days={};for(const [k,d] of Object.entries(x.days)){if(!/^[0-6]$/.test(k))throw Error('草稿日期错误');if(Object.keys(d).length===0)continue;days[k]=S.validateSubmission(d);}data={version:2,days};
 }catch(e){storageBlocked=true;el('savedTxt').textContent='旧草稿无法读取，未覆盖；请先备份浏览器存储。';status(e.message);}
}
function save(){
 if(storageBlocked){status('旧草稿异常：自动保存已停止，请导出当前填写内容。');return false;}
 try{localStorage.setItem(KEY,JSON.stringify(data));el('savedTxt').textContent='已保存 · '+new Date().toLocaleTimeString('zh-CN');return true;}
 catch(e){el('savedTxt').textContent='无法保存，请立即导出 JSON';status('浏览器存储不可用，当前输入仍可导出。');return false;}
}
function capture(){
 const d=current();document.querySelectorAll('[data-key]').forEach(x=>d[x.dataset.key]=x.value);
 for(const k of ['aiLevel','learner','role','mode','aiHelpDetails'])d[k]=el(k).value;
 if(d.questions.trim()&&!d.promptMapRecordedAt)d.promptMapRecordedAt=new Date().toISOString();
 d.lastEdited=new Date().toISOString();save();progress();
}
function progress(){const n=FIELDS.filter(k=>current()[k].trim()).length;el('progressTxt').textContent=`表单填写 ${n}/10 项 · 不代表成果合格`;el('progressBar').style.width=(n*10)+'%';}
function snapshot(){
 capture();const d=current();if(d.initialRecordedAt)return;
 if(!d.initial.trim()||!d.facts.trim()){status('先写初始认识及已知/未知，再保存快照。');return;}
 d.initialSnapshot=d.initial;d.initialFactsSnapshot=d.facts;d.initialRecordedAt=new Date().toISOString();save();render();status('初始快照已保存；后续修正写在我的判断中。');
}
function renderStage(){
 document.querySelectorAll('.stage').forEach(x=>x.classList.toggle('active',+x.dataset.stage===stage));
 const holder=el('steps');holder.replaceChildren();STAGES.forEach((name,i)=>{const b=document.createElement('button');b.className='step'+(i===stage?' active':'');b.textContent=`${i+1}. ${name}`;b.onclick=()=>goTo(i);holder.appendChild(b);});
 el('phasePill').textContent=`第${stage+1}/4关`;el('prevStage').disabled=stage===0;el('nextStage').textContent=stage===3?'保存本日记录':'下一关 →';progress();
}
function goTo(i){capture();if(i>0&&!current().initialRecordedAt){status('请先保存原始认识快照，再进入后续阶段。');return;}stage=Math.min(3,Math.max(0,i));renderStage();}
function render(){
 el('dayTitle').textContent=`Day ${day+1} · ${DAYS[day][0]}`;el('dayIntro').textContent=DAYS[day][1];el('taskMeta').textContent=DAYS[day][2];
 const nav=el('days');nav.replaceChildren();DAYS.forEach((x,i)=>{const b=document.createElement('button');b.className='day'+(i===day?' active':'');b.textContent=`Day ${i+1} · ${x[0]}`;b.onclick=()=>selectDay(i);nav.appendChild(b);});
 document.querySelectorAll('[data-key]').forEach(x=>x.value=current()[x.dataset.key]);
 for(const k of ['aiLevel','learner','role','mode','aiHelpDetails'])el(k).value=current()[k];
 const locked=!!current().initialRecordedAt;
 document.querySelector('[data-key="initial"]').readOnly=locked;document.querySelector('[data-key="facts"]').readOnly=locked;el('snapshotBtn').disabled=locked;
 el('snapshotStatus').textContent=locked?'快照时间：'+current().initialRecordedAt+'；此记录不是可信监考证明。':'快照仅保存本人的最初认识。后续修正保留在判断中。';
 const aiSources=el('aiSources');if(aiSources){aiSources.disabled=!locked;if(!locked&&aiSources.classList.contains('active'))el('srcTabs').firstChild.click();}
 renderStage();clock();
}
function selectDay(i){capture();pause();day=i;stage=0;seconds=remaining[day]??DAYS[day][3];render();status('');}
function clock(){el('clock').textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;el('timerToggle').textContent=running?'暂停':'开始';}
function pause(){running=false;clearInterval(interval);interval=null;clock();}
function toggle(){if(running){pause();return;}running=true;clock();interval=setInterval(()=>{seconds=Math.max(0,seconds-1);remaining[day]=seconds;clock();if(!seconds){pause();status('时间到，请导出当前成果。');}},1000);}
function download(ext,content,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=`houlai-cohort01-day${day+1}-${new Date().toISOString().slice(0,10)}.${ext}`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
function exported(){capture();return S.envelope(day+1,`Day ${day+1} · ${DAYS[day][0]}`,current());}
function exportFile(ext){try{const e=exported();const content=ext==='json'?JSON.stringify(e,null,2):S.markdown(e);if(new TextEncoder().encode(content).length>S.LIMIT)throw Error('导出超过 1 MiB');download(ext,content,ext==='json'?'application/json;charset=utf-8':'text/markdown;charset=utf-8');status('已导出；格式通过不代表验收通过。');}catch(e){status('无法导出：'+e.message);}}
async function importFile(file){
 try{if(file.size>S.LIMIT)throw Error('文件超过 1 MiB');const e=S.parse(await file.text());
 if(!confirm(`导入 Day ${e.day}，将替换该日草稿。请先导出备份。继续？`))return;
 capture();pause();data.days[e.day-1]=e.submission;day=e.day-1;stage=0;seconds=remaining[day]??DAYS[day][3];save();render();status('导入完成；未导入监考或验收证明。');
 }catch(e){status('无法导入，草稿未替换：'+e.message);}
}
async function sources(){
 const tabs=el('srcTabs');tabs.replaceChildren();
 for(const [title,path,kind] of [['原始邮件/技术资料/练习卡','inputs/模拟资料.md','raw'],['历史 Excel','inputs/历史Excel.csv','csv'],['模拟 AI 观点（快照后）','inputs/模拟资料.md','ai']]){
 const b=document.createElement('button');b.className='srcBtn';b.textContent=title;if(kind==='ai'){b.id='aiSources';b.disabled=!current().initialRecordedAt;}b.onclick=async()=>{try{if(kind==='ai'&&!current().initialRecordedAt)return;const r=await fetch('../'+path);if(!r.ok)throw Error('HTTP '+r.status);let text=await r.text();if(kind!=='csv'){const a=text.indexOf('## 四份模拟 AI 答案'),c=text.indexOf('## 公开练习卡');if(a<0||c<0)throw Error('原始资料段落无法识别');text=kind==='ai'?text.slice(a,c):text.slice(0,a)+text.slice(c);}el('source').textContent=text;tabs.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));}catch(e){el('source').textContent='资料读取失败，请打开资料链接：'+e.message;}};tabs.appendChild(b);
 }tabs.firstChild.click();
}
el('snapshotBtn').onclick=snapshot;el('nextStage').onclick=()=>stage===3?(capture(),status('已记录；请导出提交，不代表验收通过。')):goTo(stage+1);el('prevStage').onclick=()=>goTo(stage-1);el('saveBtn').onclick=()=>{capture();status(storageBlocked?'请导出当前记录。':'已尝试保存，查看草稿状态。');};el('exportJson').onclick=()=>exportFile('json');el('exportMd').onclick=()=>exportFile('md');el('timerToggle').onclick=toggle;
el('timerReset').onclick=()=>{if(confirm('重置本日计时？内容保留。')){pause();seconds=DAYS[day][3];remaining[day]=seconds;clock();}};
el('clearBtn').onclick=()=>{if(confirm('清空本日内容及快照？请先导出备份。')){pause();data.days[day]=empty();save();stage=0;render();status('本日已清空。');}};
el('importBtn').onclick=()=>el('importFile').click();el('importFile').onchange=e=>{const f=e.target.files[0];if(f)importFile(f);e.target.value='';};
document.querySelectorAll('[data-key]').forEach(x=>{x.maxLength=20000;x.addEventListener('input',capture);});for(const k of ['learner','role','mode','aiLevel','aiHelpDetails'])el(k).addEventListener(k==='learner'||k==='aiHelpDetails'?'input':'change',capture);
el('copyPrompt').onclick=async()=>{try{await navigator.clipboard.writeText(current().questions);status('已复制自己的 Prompt Map。');}catch(e){status('无法复制，请手动复制 Prompt Map。');}};
window.addEventListener('beforeunload',capture);load();render();sources();
})();
