/* One-time tool:  node tools/migrate.js main.html
   1) copies your existing curriculum arrays from the HTML into data/db.json (kept, de-duplicated)
   2) removes the hard-coded data from the HTML (backup saved as main.html.bak) and adds the script tags. */
const fs=require("fs"),vm=require("vm"),f=process.argv[2]||"main.html";
let h=fs.readFileSync(f,"utf8");
const a=h.indexOf("const first"),m="const curriculum = [...first, ...second, ...third];",b=h.indexOf(m);
if(a>=0&&b>a){
 const data=vm.runInNewContext(h.slice(a,b)+"\n[...first,...second,...third]");
 const dbp="data/db.json",db=JSON.parse(fs.readFileSync(dbp,"utf8"));
 const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""),seen=new Set(),fix=s=>typeof s==="string"?s.replace(/Vocalbulary/g,"Vocabulary"):s;
 let n=0;
 for(const s of data){let sub=db.subjects.find(x=>x.id===s.id);
  if(!sub)db.subjects.push(sub={id:s.id,name:s.name,icon:s.icon,color:s.color||"",description:s.description||"",topics:[]});
  for(const t0 of s.topics){const t={...t0,title:fix(t0.title),lesson:fix(t0.lesson)},k=[s.id,t.level,t.title].join("|");
   if(seen.has(k))continue;seen.add(k);
   const ex=sub.topics.find(x=>x.level===t.level&&x.title===t.title);
   if(ex)Object.assign(ex,t,{id:ex.id});else sub.topics.push({...t,id:`${s.id}-${slug(t.title)}-${slug(t.level)}`});n++}}
 db.meta.rev=Date.now();fs.writeFileSync(dbp,JSON.stringify(db,null,1));
 fs.writeFileSync(f+".bak",h);
 h=h.slice(0,a)+"const curriculum = [];  // filled from data/db.json by js/main-access.js"+h.slice(b+m.length);
 const r=h.lastIndexOf("render();");if(r>a)h=h.slice(0,r)+"// first render is done by js/main-access.js"+h.slice(r+9);
 console.log(`Imported ${n} unique topics into ${dbp}; backup: ${f}.bak`);
}else console.log("Data block not found (already migrated?) — only checking script tags.");
h=h.replace(/<\/head>\s*<\/head>/,"</head>");
h=h.replace(/(<link rel="stylesheet" href="styles.css" \/>)([\s\S]*?)\1/,"$1$2");
if(!h.includes("js/guard.js"))h=h.replace("</head>",'  <script src="js/config.js"></script>\n  <script src="js/guard.js"></script>\n</head>');
for(const s of["backend","insight-view","main-access"])if(!h.includes(`js/${s}.js`))h=h.replace("</body>",`  <script src="js/${s}.js"></script>\n</body>`);
fs.writeFileSync(f,h);console.log("Updated",f);