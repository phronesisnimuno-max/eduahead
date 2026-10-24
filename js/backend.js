/* js/backend.js — Storage, DB, Auth, RBAC & Services (browser-only training backend) */
const Store={k:"eduahead-db-v2",load(){try{return JSON.parse(localStorage.getItem(this.k))}catch(e){return null}},save(d){localStorage.setItem(this.k,JSON.stringify(d))}};
let db=null;
const uid=p=>(p||"id_")+Math.random().toString(36).slice(2,8);
const sha=async t=>[...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(t)))].map(x=>x.toString(16).padStart(2,"0")).join("");
async function secure(u){u.salt=uid("s");u.hash=await sha(u.salt+u.password);delete u.password}   // salted hash; plain text is never stored
const ready=()=>{if(!db)throw new Error("Database not loaded. Start a local server in the eduahead folder and refresh.")};
const LEVELS=["JSS 1","JSS 2","JSS 3","SSS 1","SSS 2","SSS 3"];

const DB={
 init(){return DB._p||(DB._p=DB._init())},                // safe to call from many scripts: runs once
 async seed(){const r=await fetch("data/db.json?"+Date.now());if(!r.ok)throw new Error("data/db.json not found ("+r.status+"). Check the folder layout.");return r.json()},
 async _init(){
  let d=Store.load();
  const seed=await DB.seed().catch(e=>{if(!d||!d.users||!d.users.length)throw e;return null});
  if(!d||!d.users||!d.users.length)d=seed;                  // first run (or an earlier failed run left an empty DB)
  else if(seed&&(d.meta||{}).rev!==seed.meta.rev){d.subjects=seed.subjects;d.meta=seed.meta}   // bump meta.rev in db.json to publish curriculum changes
  db=d;DB.normalize();
  for(const u of db.users)if(u.password)await secure(u);
  DB.save();return db},
 normalize(){db.subjects=db.subjects||[];db.users=db.users||[];db.attempts=db.attempts||[];db.reports=db.reports||[];db.audit=db.audit||[];
  for(const s of db.subjects){s.color=s.color||"";s.description=s.description||"";s.topics=s.topics||[];
   for(const t of s.topics){t.questions=t.questions||[];t.objectives=t.objectives||[];t.example=t.example||"";t.summary=t.summary||"";t.minutes=t.minutes||15}}
  for(const u of db.users)u.status=u.status||"active"},
 save(){if(db)Store.save(db)},
 reset(){localStorage.clear();sessionStorage.clear();location.replace(PAGES.login)},
 export(){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(db,null,2)],{type:"application/json"}));a.download="eduahead-backup.json";a.click()},
 log(u,action,detail=""){if(!db)return;db.audit.unshift({at:new Date().toISOString(),user:u.name,action,detail});db.audit=db.audit.slice(0,100);DB.save()},
 get d(){return db}
};

const Auth={
 async login(email,pw){ready();const u=db.users.find(x=>x.email===(email||"").trim().toLowerCase());
  if(!u||!u.hash||await sha(u.salt+pw)!==u.hash)return null;
  if(u.status==="pending")throw new Error("Your account is awaiting administrator approval.");
  sessionStorage.setItem("sid",u.id);DB.log(u,"login");return u},
 async register(d){ready();const email=(d.email||"").trim().toLowerCase();
  if(db.users.some(x=>x.email===email))throw new Error("Email already registered");
  if((d.password||"").length<8)throw new Error("Password must be at least 8 characters");
  const role=d.role==="administrator"?"admin":d.role;if(!["student","teacher","admin"].includes(role))throw new Error("Invalid account type");
  const n={id:uid("u"),name:(d.name||"").trim(),email,role,password:d.password,status:role==="student"?"active":"pending"};   // staff accounts wait for admin approval
  if(role==="student")n.class=d.class||"JSS 1";
  if(role==="teacher"){n.subjects=db.subjects.map(s=>s.id);n.classes=["JSS 1"]}
  await secure(n);db.users.push(n);DB.log(n,"register",role);DB.save();return{email,status:n.status}},
 current(){if(!db)return null;const id=sessionStorage.getItem("sid"),u=db.users.find(x=>x.id===id);if(id&&!u)sessionStorage.removeItem("sid");return u||null},
 logout(){sessionStorage.removeItem("sid");location.replace(PAGES.login)}
};

/* RBAC: PERMS = what you may do; students(u) = whose data you may see */
const PERMS={
 admin:["user.manage","curriculum.read","curriculum.write","report.generate","report.read","audit.read"],
 teacher:["curriculum.read","curriculum.write","report.generate","report.read"],
 student:["curriculum.read","progress.self","quiz.take","report.read"],
 parent:["curriculum.read","report.read"]};
const can=(u,a)=>!!(PERMS[u.role]&&PERMS[u.role].includes(a));
const need=(u,a)=>{if(!can(u,a))throw new Error("Access denied: "+a)};
const students=u=>{if(!db)return[];const s=db.users.filter(x=>x.role==="student");
 return u.role==="admin"?s:u.role==="teacher"?s.filter(x=>(u.classes||[]).includes(x.class)):u.role==="parent"?s.filter(x=>(u.children||[]).includes(x.id)):s.filter(x=>x.id===u.id)};

const Users={
 async create(u,d){need(u,"user.manage");if(!d.name||!d.email||!d.password)throw new Error("Name, email, password required");
  const email=d.email.trim().toLowerCase();if(db.users.some(x=>x.email===email))throw new Error("Email already exists");
  const role=d.role==="administrator"?"admin":d.role,n={id:uid("u"),name:d.name.trim(),email,role,password:d.password,status:"active"};
  if(role==="student")n.class=d.class||"JSS 1";
  if(role==="teacher"){n.subjects=db.subjects.map(s=>s.id);n.classes=[d.class||"JSS 1"]}
  if(role==="parent"){const c=db.users.find(x=>x.email===(d.childEmail||"").trim().toLowerCase()&&x.role==="student");if(!c)throw new Error("Child email not found");n.children=[c.id]}
  await secure(n);db.users.push(n);DB.log(u,"user.create",email);DB.save()},
 approve(u,id){need(u,"user.manage");const x=db.users.find(v=>v.id===id);if(!x)throw new Error("User not found");x.status="active";DB.log(u,"user.approve",x.email);DB.save()}};

const Curriculum={
 forStudent(u){ready();const i=Math.max(0,LEVELS.indexOf(u.class)),ok=LEVELS.slice(Math.max(0,i-1),i+2);   // previous (revise), current, next (learn ahead)
  return db.subjects.map(s=>({...s,topics:s.topics.filter(t=>ok.includes(t.level)).map(t=>({...t,status:LEVELS.indexOf(t.level)>i?"ahead":"upcoming"}))})).filter(s=>s.topics.length)},
 list(u){need(u,"curriculum.read");const lv=students(u).map(s=>s.class);
  return db.subjects.filter(s=>u.role!=="teacher"||(u.subjects||[]).includes(s.id)).flatMap(s=>s.topics.filter(t=>["admin","teacher"].includes(u.role)||lv.includes(t.level)).map(t=>({...t,subject:s.name,icon:s.icon})))},
 add(u,subjectId,t){need(u,"curriculum.write");const s=db.subjects.find(x=>x.id===subjectId);
  if(!s||(u.role==="teacher"&&!(u.subjects||[]).includes(subjectId)))throw new Error("Not your subject");
  if(!t.title)throw new Error("Title required");
  s.topics.push({id:subjectId+"-"+uid(""),minutes:15,summary:"",example:"",objectives:[],questions:[],...t});DB.log(u,"topic.add",t.title);DB.save()}};

/* Results come from each student's progress blob (main.html writes it). Key = level::subjectId::title */
const grade=n=>n==null?"–":n>=70?"A":n>=60?"B":n>=50?"C":n>=45?"D":n>=40?"E":"F";
const blob=sid=>{try{return JSON.parse(localStorage.getItem("eduahead-progress-v1:"+sid))||{}}catch(e){return{}}};
const Results={compute(sid,term){const st=db.users.find(x=>x.id===sid),sc=blob(sid).scores||{};
 const rows=db.subjects.map(sub=>{const ts=sub.topics.filter(t=>t.level===st.class&&(!term||t.term===term));
  const got=ts.map(t=>sc[`${t.level}::${sub.id}::${t.title}`]).filter(x=>x!=null);
  const avg=got.length?Math.round(got.reduce((a,b)=>a+b)/got.length):null;
  return{subject:sub.name,topics:ts.length,attempted:got.length,avg,grade:grade(avg)}}).filter(r=>r.topics);
 const av=rows.filter(r=>r.avg!=null),overall=av.length?Math.round(av.reduce((a,r)=>a+r.avg,0)/av.length):null;
 return{rows,overall,grade:grade(overall)}}};
const Reports={
 generate(u,sid,term){need(u,"report.generate");if(!students(u).some(s=>s.id===sid))throw new Error("Not your student");
  const r=Results.compute(sid,term),done=(blob(sid).completed||[]).length;
  const remark=r.overall==null?"No quizzes attempted yet.":r.overall>=70?"Excellent performance. Keep leading.":r.overall>=50?"Good progress. Revise weaker topics.":"Needs support. Schedule extra practice.";
  const rep={id:uid("r"),studentId:sid,term,by:u.name,at:new Date().toISOString(),done,remark,...r};
  db.reports.unshift(rep);DB.log(u,"report.generate",sid);DB.save();return rep},
 list(u){need(u,"report.read");const ids=students(u).map(s=>s.id);return db.reports.filter(r=>ids.includes(r.studentId))}};