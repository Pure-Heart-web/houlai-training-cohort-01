/* 模拟训练：公开格式校验，不含答案。浏览器和 Node 共用。 */
(function(root, factory){
  const api=factory();
  if(typeof module==='object' && module.exports) module.exports=api;
  else root.TrainingSubmission=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const FIELDS=['initial','facts','questions','modelComparisons','myJudgment','points','actions','artifact','verification','reflection'];
  const TITLES=['初始认识','已知事实与未知','Prompt Map','AI 观点筛选','我的判断','Minimum Understanding Package','Minimum Action Card','实际产物与交付索引','验证证据及未决项','个人方法复盘'];
  const LEVELS=['未记录','H0','H1','H2','H3'];
  const ROLES=['未选择','技术','实施','交付'];
  const LIMIT=1024*1024;
  const extra=['aiLevel','learner','role','mode','aiHelpDetails','initialRecordedAt','initialSnapshot','initialFactsSnapshot','promptMapRecordedAt','lastEdited'];
  function object(x){return x!==null && typeof x==='object' && !Array.isArray(x)}
  function date(x){return typeof x==='string' && /^\d{4}-\d{2}-\d{2}T/.test(x) && Number.isFinite(Date.parse(x))}
  function validateSubmission(raw){
    if(!object(raw)) throw Error('submission 必须是对象');
    for(const k of Object.keys(raw)) if(!FIELDS.includes(k) && !extra.includes(k)) throw Error('未知提交字段：'+k);
    const d={};
    for(const k of FIELDS){
      if(typeof raw[k]!=='string' || raw[k].length>20000) throw Error(k+' 必须是最多 20000 字符的文本');
      d[k]=raw[k];
    }
    for(const k of extra){if(raw[k]!==undefined && typeof raw[k]!=='string') throw Error(k+' 必须是文本');d[k]=raw[k]||'';}
    if(!LEVELS.includes(d.aiLevel)) throw Error('AI 帮助等级不合法');
    d.role=d.role||'未选择';d.mode=d.mode||'练习';
    if(!ROLES.includes(d.role)||!['练习','独立考核'].includes(d.mode)) throw Error('岗位或任务性质不合法');
    if(d.learner.length>100||d.aiHelpDetails.length>20000) throw Error('身份或帮助记录过长');
    for(const k of ['initialSnapshot','initialFactsSnapshot']) if(d[k].length>20000) throw Error('快照过长');
    for(const k of ['initialRecordedAt','promptMapRecordedAt','lastEdited']) if(d[k]&&!date(d[k])) throw Error(k+' 时间格式不合法');
    if(d.initialRecordedAt && (!d.initialSnapshot.trim() || !d.initialFactsSnapshot.trim())) throw Error('初始快照不完整');
    return d;
  }
  function validateEnvelope(raw){
    if(!object(raw)||raw.format!=='houlai-training-submission-v2') throw Error('不是 V2 作业 JSON');
    if(raw.schemaVersion!==undefined && raw.schemaVersion!==2) throw Error('不支持此 schemaVersion');
    const allowed=['format','schemaVersion','day','dayTitle','exportedAt','submission'];
    for(const k of Object.keys(raw)) if(!allowed.includes(k)) throw Error('未知顶层字段：'+k);
    if(!Number.isInteger(raw.day)||raw.day<1||raw.day>7) throw Error('day 必须为 1–7 的整数');
    if(typeof raw.dayTitle!=='string'||raw.dayTitle.length>200||!date(raw.exportedAt)) throw Error('标题或导出时间不合法');
    return {...raw,submission:validateSubmission(raw.submission)};
  }
  function parse(text){if(typeof text!=='string'||new TextEncoder().encode(text).length>LIMIT) throw Error('JSON 不能超过 1 MiB');return validateEnvelope(JSON.parse(text));}
  function envelope(day,title,d){return validateEnvelope({format:'houlai-training-submission-v2',schemaVersion:2,day,dayTitle:title,exportedAt:new Date().toISOString(),submission:d});}
  function markdown(e){
    const d=e.submission;
    let s=`# 猴来训练记录 · ${e.dayTitle}\n\n模拟训练｜学员：${d.learner||'未填写'}｜岗位：${d.role}｜性质：${d.mode}\n\n最高帮助：${d.aiLevel}；具体帮助：${d.aiHelpDetails||'未填写'}\n\n导出：${e.exportedAt}；记录不代表导师验收。\n\n`;
    s+=`## 原始独立认识快照\n\n记录时间：${d.initialRecordedAt||'未记录'}（浏览器自报时间，非监考证明）\n\n${d.initialSnapshot||'未记录'}\n\n${d.initialFactsSnapshot||'未记录'}\n\n`;
    FIELDS.forEach((k,i)=>s+=`## ${TITLES[i]}\n\n${d[k]||'（未填写）'}\n\n`);
    return s;
  }
  return {FIELDS,TITLES,LEVELS,ROLES,LIMIT,parse,validateSubmission,validateEnvelope,envelope,markdown};
});
