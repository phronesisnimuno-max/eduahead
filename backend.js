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
 async seed(){const r=await fetch("data/db.json?"+Date.now());if(!r.ok)throw new Error("data/db.json not found ("+r.status+"). Check the folder layout.");
  const s=await r.json();
  if(s.subjectFiles)s.subjects=await Promise.all(s.subjectFiles.map(async f=>{const x=await fetch(f+"?v="+s.meta.rev);if(!x.ok)throw new Error(f+" not found ("+x.status+")");return x.json()}));   // one file per subject
  return s},
 async _init(){
  let d=Store.load();
  const seed=await DB.seed().catch(e=>{if(!d||!d.users||!d.users.length)throw e;return null});
  if(!d||!d.users||!d.users.length)d=seed;                  // first run (or an earlier failed run left an empty DB)
  else if(seed&&(d.meta||{}).rev!==seed.meta.rev){d.subjects=seed.subjects;d.subjectFiles=seed.subjectFiles;d.meta=seed.meta}   // bump meta.rev in db.json to publish curriculum changes
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
 exportCurriculum(){const rev=Date.now();db.meta.rev=rev;DB.save();   // downloads one file per subject plus db.json; upload them to your host (data/ and data/subjects/)
  const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""),files=db.subjects.map(s=>["data/subjects/"+slug(s.name)+".json",s]);
  const seed={meta:{...db.meta,rev},users:db.users.filter(x=>x.role!=="student"&&x.role!=="parent"&&x.status==="active"),subjectFiles:files.map(f=>f[0]),progress:[],attempts:[],reports:[],audit:[]};
  [["db.json",seed],...files.map(([f,s])=>[f.split("/").pop(),s])].forEach(([n,o],i)=>setTimeout(()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(o,null,1)],{type:"application/json"}));a.download=n;a.click()},i*500))},
 log(u,action,detail=""){if(!db)return;db.audit.unshift({at:new Date().toISOString(),user:u.name,action,detail});db.audit=db.audit.slice(0,100);DB.save()},
 get d(){return db}
};

const Auth={
 async login(email,pw){ready();const u=db.users.find(x=>x.email===(email||"").trim().toLowerCase());
  if(!u||!u.hash||await sha(u.salt+pw)!==u.hash)return null;
  if(u.status==="pending")throw new Error("Your account is awaiting approval by the school.");
  if(u.status==="disabled")throw new Error("This account has been disabled. Contact the school.");
  sessionStorage.setItem("sid",u.id);DB.log(u,"login");return u},
 async register(d){ready();const email=(d.email||"").trim().toLowerCase(),nm=(d.name||"").trim();
  if(nm.length<3)throw new Error("Please enter your full name.");
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))throw new Error("Enter a valid email address.");
  if(db.users.some(x=>x.email===email))throw new Error("That email is already registered. Try logging in.");
  const pw=d.password||"";if(!strongPw(pw))throw new Error("Password needs 8+ characters with letters and numbers.");
  const role=d.role==="administrator"?"admin":d.role;if(!["student","teacher","admin","parent"].includes(role))throw new Error("Invalid account type");
  const noAdmin=!db.users.some(x=>x.role==="admin"&&x.status==="active");          // first admin on a brand-new system is active at once
  const n={id:uid("u"),name:nm,email,role,password:pw,status:role==="student"||(role==="admin"&&noAdmin)?"active":"pending"};
  if(role==="student"){if(!LEVELS.includes(d.class))throw new Error("Please choose your class.");n.class=d.class}
  if(role==="parent"){const c=db.users.find(x=>x.role==="student"&&x.email===(d.childEmail||"").trim().toLowerCase());
   if(!c)throw new Error("No student found with that email. Your child must register first.");n.children=[c.id]}
  if(role==="teacher"){n.subjects=[];n.classes=[]}                                   // an admin assigns subjects and classes on approval
  await secure(n);db.users.push(n);DB.log(n,"register",role);DB.save();return{email,status:n.status,role}},
 current(){if(!db)return null;const id=sessionStorage.getItem("sid"),u=db.users.find(x=>x.id===id);if(id&&!u)sessionStorage.removeItem("sid");return u||null},
 logout(){sessionStorage.removeItem("sid");location.replace(PAGES.login)},
 async changePassword(u,old,pw){if(await sha(u.salt+old)!==u.hash)throw new Error("Current password is wrong.");if(!strongPw(pw))throw new Error("New password needs 8+ characters with letters and numbers.");u.password=pw;await secure(u);DB.log(u,"password.change");DB.save()}
};
const strongPw=p=>(p||"").length>=8&&/[A-Za-z]/.test(p)&&/\d/.test(p);

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
 approve(u,id){need(u,"user.manage");const x=db.users.find(v=>v.id===id);if(!x)throw new Error("User not found");x.status="active";DB.log(u,"user.approve",x.email);DB.save()},
 update(u,id,p){need(u,"user.manage");const x=db.users.find(v=>v.id===id);if(!x)throw new Error("User not found");
  if(x.role==="student"&&p.class){if(!LEVELS.includes(p.class))throw new Error("Invalid class");x.class=p.class}
  if(x.role==="teacher"){if(p.subjects)x.subjects=p.subjects.filter(s=>db.subjects.some(b=>b.id===s));if(p.classes)x.classes=p.classes.filter(c=>LEVELS.includes(c))}
  if(x.role==="parent"&&p.childEmails){const ids=p.childEmails.map(e=>db.users.find(s=>s.role==="student"&&s.email===e.toLowerCase())).filter(Boolean).map(s=>s.id);if(!ids.length)throw new Error("No student found with that email");x.children=ids}
  DB.log(u,"user.update",x.email);DB.save()},
 async resetPassword(u,id,pw){need(u,"user.manage");if(!strongPw(pw))throw new Error("Password needs 8+ characters with letters and numbers.");const x=db.users.find(v=>v.id===id);if(!x)throw new Error("User not found");x.password=pw;await secure(x);DB.log(u,"password.reset",x.email);DB.save()},
 setStatus(u,id,s){need(u,"user.manage");const x=db.users.find(v=>v.id===id);if(!x||x.id===u.id)throw new Error("Not allowed");x.status=s;DB.log(u,"user."+s,x.email);DB.save()}};

const Curriculum={
 forStudent(u){ready();const i=Math.max(0,LEVELS.indexOf(u.class));   // every class is open: lower classes = revision, higher classes = learn ahead
  return db.subjects.map(s=>({...s,topics:s.topics.map(t=>({...t,status:LEVELS.indexOf(t.level)>i?"ahead":"upcoming"}))})).filter(s=>s.topics.length)},
 list(u){need(u,"curriculum.read");const lv=students(u).map(s=>s.class);
  return db.subjects.filter(s=>u.role!=="teacher"||(u.subjects||[]).includes(s.id)).flatMap(s=>s.topics.filter(t=>u.role==="admin"||(u.role==="teacher"?(u.classes||[]).includes(t.level):lv.includes(t.level))).map(t=>({...t,subject:s.name,icon:s.icon})))},
 _own(u,s,level){need(u,"curriculum.write");if(u.role==="teacher"&&(!(u.subjects||[]).includes(s.id)||!(u.classes||[]).includes(level)))throw new Error("You can only edit your own subjects and classes")},
 _find(id){for(const s of db.subjects){const t=s.topics.find(x=>x.id===id);if(t)return{s,t}}throw new Error("Topic not found")},
 update(u,id,p){const{s,t}=Curriculum._find(id);Curriculum._own(u,s,t.level);if(p.level)Curriculum._own(u,s,p.level);
  if(p.title!==undefined&&!p.title.trim())throw new Error("Title is required");
  if((p.questions||[]).some(q=>!q.q||q.options.length<2||q.answer<0||q.answer>=q.options.length))throw new Error("Each quiz line needs: question | options separated by ; | number of the correct option");
  Object.assign(t,p);DB.log(u,"topic.update",t.title);DB.save();return t},
 remove(u,id){const{s,t}=Curriculum._find(id);Curriculum._own(u,s,t.level);s.topics=s.topics.filter(x=>x.id!==id);DB.log(u,"topic.delete",t.title);DB.save()},
 addSubject(u,nm){need(u,"curriculum.write");if(u.role!=="admin")throw new Error("Only admins can add subjects");nm=(nm||"").trim();if(!nm)throw new Error("Enter a subject name");
  const id=nm.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");if(db.subjects.some(s=>s.id===id))throw new Error("That subject already exists");
  db.subjects.push({id,name:nm,icon:"📘",color:"",description:"",topics:[]});DB.log(u,"subject.add",nm);DB.save()},
 add(u,subjectId,t){need(u,"curriculum.write");const s=db.subjects.find(x=>x.id===subjectId);
  if(!s)throw new Error("Subject not found");Curriculum._own(u,s,t.level);
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

/* make the services reachable from page scripts and the browser console */
Object.assign(window,{DB,Auth,Users,Curriculum,Results,Reports,can,need,students,LEVELS});
