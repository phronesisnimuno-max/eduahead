/* Login/Signup wiring. Capture-phase listeners run BEFORE any older handlers in script2.js,
   so your tabs, show-password and design keep working untouched. */
(async()=>{
 await DB.init();
 const $=id=>document.getElementById(id);
 const msg=(t,type="error")=>{const m=$("message");m.textContent=t;m.classList.remove("error","success");m.classList.add("show",type);m.style.display="block"};
 const route=u=>location.replace(u.role==="student"?PAGES.student:PAGES.staff);
 const cur=Auth.current();if(cur)return route(cur);
 const take=(e,f)=>{e.preventDefault();e.stopImmediatePropagation();f()};
 document.addEventListener("submit",e=>{
  if(e.target.id==="loginForm")take(e,async()=>{try{
   const u=await Auth.login($("loginEmail").value,$("loginPassword").value);
   if(!u){msg("Wrong email or password.");$("loginPassword").focus();return}
   msg(`Welcome back, ${u.name}!`,"success");route(u)}catch(err){msg(err.message)}});
  if(e.target.id==="signupForm")take(e,async()=>{try{
   const p=$("signupPassword").value;
   if(p!==$("confirmPassword").value){msg("Passwords do not match.");$("confirmPassword").focus();return}
   const r=await Auth.register({name:$("fullName").value,email:$("signupEmail").value,role:$("role").value,password:p});
   e.target.reset();$("toLogin").click();$("loginEmail").value=r.email;
   msg(r.status==="pending"?"Account created. An administrator must approve it before you can log in.":"Account created! You can log in now.","success")}
   catch(err){msg(err.message)}});
 },true);
 $("forgotPassword").addEventListener("click",()=>msg("Please ask your school administrator to reset your password.","success"));
})().catch(()=>document.getElementById("message").textContent="Start a local server (see README) so data/db.json can load.");