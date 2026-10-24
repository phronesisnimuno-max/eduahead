/* js/insight-view.js — Strengths & weaknesses per subject and per topic (used by main.html AND console.html).
   Bands: Strong 70%+, Developing 50-69%, Needs work below 50%. Topics not yet tried are NOT counted as weaknesses. */
const Insights={
 analyze(sid){const d=typeof DB!=="undefined"?DB.d:null,st=d&&d.users.find(u=>u.id===sid);
  if(!st)return{subjects:[],focus:[],strengths:[],upNext:[],overall:null};
  const i=Math.max(0,LEVELS.indexOf(st.class)),win=LEVELS.slice(Math.max(0,i-1),i+2);   // previous, current and next class
  let sc={};try{sc=(JSON.parse(localStorage.getItem("eduahead-progress-v1:"+sid))||{}).scores||{}}catch(e){}
  const band=n=>n==null?"Not attempted":n>=70?"Strong":n>=50?"Developing":"Needs work";
  const subjects=[],focus=[],strengths=[],upNext=[];
  d.subjects.forEach(sub=>{
   const topics=sub.topics.map(t=>{const s=sc[`${t.level}::${sub.id}::${t.title}`];return{id:t.id,subjectId:sub.id,subject:sub.name,title:t.title,level:t.level,term:t.term,score:s==null?null:s,band:band(s)}}).filter(t=>t.score!=null||win.includes(t.level));   // attempted topics from any class, plus unattempted ones near the student's class
   if(!topics.length)return;
   const done=topics.filter(t=>t.score!=null),avg=done.length?Math.round(done.reduce((a,t)=>a+t.score,0)/done.length):null;
   done.forEach(t=>(t.score>=70?strengths:focus).push(t));
   topics.filter(t=>t.score==null&&t.level===st.class).slice(0,3).forEach(t=>upNext.push(t));
   subjects.push({id:sub.id,name:sub.name,icon:sub.icon,avg,band:band(avg),done:done.length,total:topics.length,topics});
  });
  focus.sort((a,b)=>a.score-b.score);strengths.sort((a,b)=>b.score-a.score);
  const av=subjects.filter(s=>s.avg!=null);
  return{student:st.name,class:st.class,overall:av.length?Math.round(av.reduce((a,s)=>a+s.avg,0)/av.length):null,subjects,focus,strengths,upNext}},
 render(sid,o={}){const a=this.analyze(sid),revise=o.revise??(typeof openTopic==="function");
  const e=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const cls=b=>b==="Strong"?"completed":b==="Developing"?"ahead":"upcoming";
  const pill=t=>`<span class="status ${cls(t.band)}">${t.score==null?"Not attempted":t.score+"% · "+t.band}</span>`;
  const act=t=>revise?`<button class="btn btn-small" data-action="topic:${e(t.subjectId)}:${encodeURIComponent(t.id)}">${t.score==null?"Start":"Revise"} →</button>`:"";
  const line=(t,ic,st)=>`<div class="topic-row"><div class="topic-number" style="${st}">${ic}</div><div class="topic-info"><strong>${e(t.title)}</strong><small>${e(t.subject)} · ${e(t.level)} · ${e(t.term)}</small></div>${pill(t)}${act(t)}</div>`;
  const list=(arr,ic,st,empty)=>arr.length?arr.slice(0,8).map(t=>line(t,ic,st)).join(""):`<p class="muted">${empty}</p>`;
  const card=(l,v,c="")=>`<div class="stat-card"><div class="stat-icon ${c}">●</div><div><div class="stat-label">${l}</div><div class="stat-value">${v}</div></div></div>`;
  const colour=n=>n>=70?"var(--green)":n>=50?"var(--purple)":"var(--orange)";
  const subj=a.subjects.map(s=>`<div class="panel" style="margin-bottom:16px"><div class="panel-heading"><h2>${e(s.icon)} ${e(s.name)}</h2><span class="status ${cls(s.band)}">${s.avg==null?"No quiz data":"Average "+s.avg+"% · "+s.band}</span></div><div class="progress-track"><div class="progress-fill" style="width:${s.avg||0}%"></div></div><p class="small-note">${s.done} of ${s.total} topics practised</p><div class="topic-list">${s.topics.filter(t=>t.score!=null).sort((x,y)=>x.score-y.score).map(t=>`<div class="topic-row"><div class="topic-info"><strong>${e(t.title)}</strong><small>${e(t.level)} · ${e(t.term)}</small><div class="progress-track" style="margin:8px 0 0"><div class="progress-fill" style="width:${t.score}%;background:${colour(t.score)}"></div></div></div>${pill(t)}${act(t)}</div>`).join("")||'<p class="muted">No quizzes taken in this subject yet.</p>'}</div></div>`).join("");
  return (o.header===false?"":`<div class="page-header"><div><div class="eyebrow">DIAGNOSTIC ANALYTICS</div><h1>My Specific Strengths and Weaknesses</h1><p>Worked out from your quiz scores, topic by topic.</p></div></div>`)+
  `<div class="stats-grid">${card("Overall average",a.overall==null?"–":a.overall+"%")}${card("Strong topics",a.strengths.length,"green")}${card("Topics to improve",a.focus.length,"orange")}</div>
  <div class="two-col" style="margin-bottom:24px"><div class="panel"><div class="panel-heading"><h2>🎯 Focus areas</h2></div><div class="topic-list">${list(a.focus,"⚡","background:var(--orange-pale);color:var(--orange)","Nothing below 70% yet. Great work!")}</div></div>
  <div class="panel"><div class="panel-heading"><h2>🚀 Strengths</h2></div><div class="topic-list">${list(a.strengths,"✓","background:var(--green-pale);color:var(--green)","Strengths appear when a quiz score reaches 70% or more.")}</div></div></div>
  ${a.upNext.length?`<div class="panel" style="margin-bottom:24px"><div class="panel-heading"><h2>📘 Up next (not tried yet)</h2></div><div class="topic-list">${list(a.upNext,"→","","")}</div></div>`:""}
  <div class="section-head"><h2>Subject breakdown</h2></div>${subj||'<div class="panel empty-state"><h3>No topics available</h3></div>'}`}
};
window.Insights=Insights;
