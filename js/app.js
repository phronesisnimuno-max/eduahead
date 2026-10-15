/* app.js — Complete Staff Console & Management Controller */
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const $ = s => document.querySelector(s); 
let me, view;

const NAV = {
  admin: [["dash", "Dashboard"], ["curr", "Curriculum"], ["users", "Users Management"], ["students", "Students"], ["reports", "Reports"], ["audit", "Audit Log"]],
  teacher: [["dash", "Dashboard"], ["curr", "Curriculum"], ["students", "My Students"], ["reports", "Reports"]],
  parent: [["students", "My Children"], ["reports", "Term Reports"]]
};

const toast = m => { const t = $("#toast"); if(!t) return; t.textContent = m; t.classList.add("show"); setTimeout(() => t.classList.remove("show"), 2600); };
const safe = f => async (...a) => { try { await f(...a); } catch (e) { toast(e.message); } };
const row = (icon, t, small, status, btnHtml = "") => `<div class="topic-row"><div class="topic-number">${esc(icon)}</div><div class="topic-info"><strong>${esc(t)}</strong><small>${esc(small)}</small></div>${status ? `<span class="status">${esc(status)}</span>` : ""}${btnHtml}</div>`;
const b = (l, js, c = "btn btn-small") => `<button class="${c}" onclick="${js}">${l}</button>`;
const panel = (h, body) => `<h1>${h}</h1><div class="panel"><div class="topic-list">${body || '<p class="muted">No records found.</p>'}</div></div>`;
const name = id => DB.d.users.find(u => u.id === id)?.name || id;

function go(v, a) {
  view = v;
  [...document.querySelectorAll(".nav-item")].forEach(n => n.classList.toggle("active", n.dataset.v === v));
  const appEl = $("#app");
  if (appEl) appEl.innerHTML = safe2(() => VIEWS[v](a));
}
const safe2 = f => { try { return f(); } catch (e) { return `<div class="callout">⚠ ${esc(e.message)}</div>`; } };

const VIEWS = {
  dash() {
    const totalStudents = students(me).length;
    const totalTopics = DB.d.subjects.reduce((acc, s) => acc + s.topics.length, 0);
    const totalReports = Reports.list(me).length;
    return `<h1>Welcome back, ${esc(me.name)}</h1>
      <p class="muted" style="margin-bottom:20px">Role: <strong>${esc(me.role.toUpperCase())}</strong> · School Management Portal</p>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-icon">👥</div><div><div class="stat-label">Managed Students</div><div class="stat-value">${totalStudents}</div></div></div>
        <div class="stat-card"><div class="stat-icon green">📚</div><div><div class="stat-label">Curriculum Topics</div><div class="stat-value">${totalTopics}</div></div></div>
        <div class="stat-card"><div class="stat-icon orange">📊</div><div><div class="stat-label">Generated Reports</div><div class="stat-value">${totalReports}</div></div></div>
      </div>
      <div class="panel"><h2>Quick Actions</h2><p class="muted" style="font-size:12px;margin-top:8px">Use the sidebar navigation to manage curriculum contents, approve user sign-ups, or generate termly academic performance reports.</p></div>`;
  },
  curr() {
    const addForm = can(me, "curriculum.write") ? `
      <div class="panel" style="margin-bottom:20px">
        <h2>Add New Curriculum Topic</h2>
        <div class="filters" style="margin-top:12px">
          <select id="ts" class="search-input">${DB.d.subjects.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join("")}</select>
          <input id="tt" class="search-input" placeholder="Topic Title (e.g. Algebra)">
          <select id="tl" class="search-input"><option>JSS 1</option><option>JSS 2</option><option>JSS 3</option><option>SSS 1</option><option>SSS 2</option><option>SSS 3</option></select>
          <select id="tm" class="search-input"><option>First Term</option><option>Second Term</option><option>Third Term</option></select>
        </div>
        <textarea id="tx" class="search-input" style="height:75px;width:100%;padding:10px;margin-top:10px" placeholder="Comprehensive lesson notes and explanation..."></textarea>
        <div style="margin-top:12px">${b("Publish Topic to DB", "addTopic()", "btn")}</div>
      </div>` : "";
    
    const topicsList = DB.d.subjects.flatMap(s => s.topics.map(t => ({ ...t, subjectName: s.name, subjectIcon: s.icon })))
      .map(t => row(t.subjectIcon || '📖', t.title, `${t.subjectName} · ${t.level} · ${t.term}`, `${t.minutes || 15} mins`)).join("");
    
    return addForm + panel("Approved Curriculum Scheme of Work", topicsList);
  },
  students() {
    const sel = `<select id="term" class="search-input"><option>First Term</option><option>Second Term</option><option>Third Term</option></select>`;
    const studentRows = students(me).map(s => {
      const r = Results.compute(s.id);
      return row(s.name[0], s.name, `Class: ${s.class} · Term Average: ${r.overall ?? "–"}% (${r.grade})`, "", can(me, "report.generate") ? b("Generate Report Slip", `gen('${s.id}')`) : "");
    }).join("");
    return `<div class="filters" style="margin-bottom:16px">${sel}</div>` + panel("Student Directory & Performance", studentRows);
  },
  reports() {
    const list = Reports.list(me);
    const html = list.length ? list.map(r => `
      <div class="quiz-question" style="margin-bottom:15px">
        <h3>${esc(name(r.studentId))} · ${esc(r.term)}</h3>
        <p class="small-note">Generated by ${esc(r.by)} on ${new Date(r.at).toLocaleString()}</p>
        <table style="width:100%;font-size:12px;margin:10px 0;border-collapse:collapse">
          ${r.rows.map(x => `<tr style="border-bottom:1px solid var(--line)"><td style="padding:6px 0">${esc(x.subject)}</td><td style="padding:6px 0">${x.avg ?? "–"}%</td><td style="padding:6px 0">Grade: <strong>${x.grade}</strong></td></tr>`).join("")}
        </table>
        <p><strong>Overall Average: ${r.overall ?? "–"}% (${r.grade})</strong> · Completed Topics: ${r.done}</p>
        <p class="muted" style="margin-top:6px"><em>Teacher Remark:</em> ${esc(r.remark)}</p>
      </div>`).join("") : '<p class="muted">No term reports generated yet.</p>';
    return panel("Termly Result Reports", html);
  },
  users() {
    if (me.role !== "admin") return `<div class="callout">⚠ Access restricted to Administrators only.</div>`;
    const createUserBox = `
      <div class="panel" style="margin-bottom:20px">
        <h2>Create Staff or Student Account</h2>
        <div class="filters" style="margin-top:12px">
          <input id="un" class="search-input" placeholder="Full Name">
          <input id="ue" class="search-input" placeholder="Email Address">
          <input id="up" class="search-input" type="password" placeholder="Temporary Password">
          <select id="ur" class="search-input"><option value="student">Student</option><option value="teacher">Teacher</option><option value="admin">Administrator</option></select>
          <input id="uc" class="search-input" placeholder="Class (e.g. JSS 1) or Child Email">
        </div>
        <div style="margin-top:12px">${b("Create Account", "mkUser()", "btn")}</div>
      </div>`;

    const userRows = DB.d.users.map(u => row(u.name[0], u.name, `${u.email} · Role: ${u.role.toUpperCase()}`, u.status === "pending" ? "PENDING APPROVAL" : "ACTIVE", u.status === "pending" ? b("Approve", `approve('${u.id}')`, "btn btn-small") : "")).join("");
    return createUserBox + panel("System User Directory", userRows);
  },
  audit() {
    if (me.role !== "admin") return `<div class="callout">⚠ Administrator privileges required.</div>`;
    const logs = DB.d.audit.map(a => row("•", a.action, `${a.user} · ${new Date(a.at).toLocaleString()} — ${a.detail}`)).join("");
    return panel("System Audit Trail", logs);
  }
};

const approve = safe(id => { Users.approve(me, id); toast("User approved successfully"); go("users"); });
const addTopic = safe(() => {
  Curriculum.add(me, $("#ts").value, { title: $("#tt").value, level: $("#tl").value, term: $("#tm").value, lesson: $("#tx").value });
  toast("Curriculum topic added successfully");
  go("curr");
});
const gen = safe(id => { Reports.generate(me, id, $("#term").value); toast("Result report generated"); go("reports"); });
const mkUser = safe(async () => {
  await Users.create(me, { name: $("#un").value, email: $("#ue").value, password: $("#up").value, role: $("#ur").value, class: $("#uc").value, childEmail: $("#uc").value });
  toast("Account created successfully");
  go("users");
});

function boot(u) {
  me = u; 
  const shell = $("#shell");
  if(shell) shell.classList.remove("hidden");
  const who = $("#who");
  if(who) who.textContent = `${u.name} · ${u.role.toUpperCase()}`;
  
  const nav = $("#nav");
  if(nav && NAV[u.role]) {
    nav.innerHTML = NAV[u.role].map(([v, l]) => `<button class="nav-item ${v === NAV[u.role][0][0] ? 'active' : ''}" data-v="${v}" onclick="go('${v}')">${l}</button>`).join("");
    go(NAV[u.role][0][0]);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await DB.init();
    const u = Auth.current();
    if (!u) {
      location.replace(PAGES.login || "auth.html");
      return;
    }
    if (u.role === "student") {
      location.replace(PAGES.student || "main.html");
      return;
    }
    boot(u);
  } catch (err) {
    console.error("Staff console initialization error:", err);
    toast("Failed to load backend database.");
  }
});