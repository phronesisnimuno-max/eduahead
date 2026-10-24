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
function getTeacherAssignments() {
  try {
    const all = JSON.parse(
      localStorage.getItem("eduahead-teacher-assignments-v1") || "[]"
    );

    return all.filter(item => item.teacherId === me.id);
  } catch {
    return [];
  }
}

function saveTeacherAssignments(items) {
  const all = JSON.parse(
    localStorage.getItem("eduahead-teacher-assignments-v1") || "[]"
  );

  const others = all.filter(item => item.teacherId !== me.id);

  localStorage.setItem(
    "eduahead-teacher-assignments-v1",
    JSON.stringify([...others, ...items])
  );
}

const createAssignment = safe(async event => {
  event.preventDefault();

  const title = $("#assignmentTitle").value.trim();
  const subject = $("#assignmentSubject").value;
  const level = $("#assignmentClass").value;
  const due = $("#assignmentDue").value;
  const instructions = $("#assignmentInstructions").value.trim();

  if (!title || !due) {
    throw new Error("Enter an assignment title and due date.");
  }

  if (due < new Date().toISOString().slice(0, 10)) {
    throw new Error("Choose today or a future due date.");
  }

  const items = getTeacherAssignments();

  items.unshift({
    id: "assignment_" + crypto.randomUUID(),
    teacherId: me.id,
    title,
    subject,
    level,
    due,
    instructions,
    status: "Pending",
    createdAt: new Date().toISOString()
  });

  saveTeacherAssignments(items);
  toast("Assignment created.");
  go("assignments");
});

const toggleAssignment = safe(id => {
  const items = getTeacherAssignments();
  const item = items.find(assignment => assignment.id === id);

  if (!item) throw new Error("Assignment not found.");

  item.status = item.status === "Completed" ? "Pending" : "Completed";

  saveTeacherAssignments(items);
  go("assignments");
});
const VIEWS = {  assignments() {
    return `
      <h1>Assignments</h1>

      <div class="panel">
        <h2>Create an Assignment</h2>

        <form onsubmit="createAssignment(event)">
          <input
            id="assignmentTitle"
            class="search-input"
            placeholder="Assignment title"
            required
          >

          <input
            id="assignmentDue"
            class="search-input"
            type="date"
            required
          >

          <button class="btn" type="submit">
            Create Assignment
          </button>
        </form>
      </div>
    `;
  }

  
  ,planner() {
  const topics = DB.d.subjects.flatMap(subject =>
    subject.topics.map(topic => ({
      ...topic,
      subjectName: subject.name
    }))
  );

  const lessonRows = topics.map(topic => `
    <div class="topic-row">
      <div class="topic-number">📖</div>
      <div class="topic-info">
        <strong>${esc(topic.title)}</strong>
        <small>
          ${esc(topic.subjectName)} · ${esc(topic.level)} ·
          ${esc(topic.term)} · ${Number(topic.minutes || 15)} mins
        </small>
      </div>
      ${b("View Curriculum", "go('curr')")}
    </div>
  `).join("");

  return `
    <h1>Lesson Planner</h1>
    <p class="muted" style="margin-bottom:20px">
      Browse available lesson topics and organise your teaching sequence.
    </p>

    <div class="panel">
      <h2>Curriculum Planning</h2>
      <p class="muted" style="margin:8px 0 14px">
        Use the subject, class, term, and lesson duration to prepare your
        teaching schedule.
      </p>

      <div class="topic-list">
        ${lessonRows || `
          <p class="muted">
            No curriculum topics are available yet.
          </p>
        `}
      </div>
    </div>
  `;
},
insights() {
  const myStudents = students(me);

  const rows = myStudents.map(student => {
    const result = Results.compute(student.id);
    const score = result.overall;
    const valid = score !== null &&
      score !== undefined &&
      Number.isFinite(Number(score));

    const label = !valid
      ? "No result"
      : Number(score) < 50
        ? "Needs review"
        : Number(score) < 70
          ? "Developing"
          : "Progressing well";

    return row(
      student.name?.[0] || "S",
      student.name,
      `Class: ${student.class || "Not specified"} · Overall: ${
        valid ? `${score}%` : "Not available"
      }`,
      label
    );
  }).join("");

  return `
    <h1>Performance Insights</h1>
    <p class="muted" style="margin-bottom:20px">
      Review available student results to identify useful revision priorities.
    </p>

    <div class="panel">
      <h2>Student Progress Review</h2>
      <div class="topic-list" style="margin-top:12px">
        ${rows || `
          <p class="muted">
            No student records are available for this account.
          </p>
        `}
      </div>
    </div>

    <div class="callout" style="margin-top:16px">
      📌 These labels are simple indicators based on overall scores,
      not a complete assessment of a student's ability. Check subject-level
      results and the school's grading policy before making decisions.
    </div>
  `;
},

  dash() {
  const myStudents = students(me);
  const totalTopics = DB.d.subjects.reduce(
    (total, subject) => total + subject.topics.length, 0
  );
  const totalReports = Reports.list(me).length;

  const averages = myStudents
    .map(student => Results.compute(student.id).overall)
    .filter(score => Number.isFinite(Number(score)))
    .map(Number);

  const classAverage = averages.length
    ? Math.round(averages.reduce((a, score) => a + score, 0) / averages.length)
    : null;

  const needsSupport = myStudents.filter(student => {
    const score = Results.compute(student.id).overall;
    return score !== null &&
      score !== undefined &&
      Number.isFinite(Number(score)) &&
      Number(score) < 50;
  }).length;

  return `
    <h1>Welcome back, ${esc(me.name)} 👋</h1>
    <p class="muted" style="margin-bottom:20px">
      Your teaching workspace · ${esc(me.role.toUpperCase())}
    </p>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div>
          <div class="stat-label">My Students</div>
          <div class="stat-value">${myStudents.length}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon green">📚</div>
        <div>
          <div class="stat-label">Curriculum Topics</div>
          <div class="stat-value">${totalTopics}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon orange">📈</div>
        <div>
          <div class="stat-label">Class Average</div>
          <div class="stat-value">
            ${classAverage === null ? "—" : `${classAverage}%`}
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">📝</div>
        <div>
          <div class="stat-label">Generated Reports</div>
          <div class="stat-value">${totalReports}</div>
        </div>
      </div>
    </div>

    <div class="panel" style="margin-top:20px">
      <h2>Teaching Shortcuts</h2>
      <p class="muted" style="margin:8px 0 16px">
        Jump directly to the tools you need.
      </p>
      <div class="filters">
        ${b("👥 View My Students", "go('students')", "btn")}
        ${b("📝 Create Assignment", "go('assignments')", "btn")}
        ${b("📅 Plan a Lesson", "go('planner')", "btn")}
        ${b("📊 View Insights", "go('insights')", "btn")}
        ${b("📄 View Reports", "go('reports')", "btn")}
      </div>
    </div>

    <div class="panel" style="margin-top:20px">
      <h2>Student Support Overview</h2>
      <p class="muted" style="margin-top:8px">
        ${needsSupport} student(s) have an available overall result below 50%.
        Review their subject results before deciding what support they need.
      </p>
      ${b("Review Student Performance", "go('insights')", "btn btn-small")}
    </div>

    <div class="callout" style="margin-top:16px">
      💡 Use the performance insights to guide revision and individual support.
      Confirm grading thresholds with your school's assessment policy.
    </div>
    
  
  
    `;
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