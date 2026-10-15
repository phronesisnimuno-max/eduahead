# EduAhead: Student Guide to How the Project Works

*Read this first. You do not need to be an expert. By the end you should be able to explain the project to your class, your teacher or a visitor.*

---

## 1. What is EduAhead?

EduAhead is a **mini school system that runs in a web browser**. It helps students study ahead, practise with quizzes and see how they are doing. It also lets teachers, parents and the school admin follow that progress.

| Person | What they can do |
|---|---|
| **Student** | Read lessons, take quizzes, track progress, see strengths and weaknesses |
| **Teacher** | Add lessons, see their students, create report slips |
| **Parent** | See their child's reports |
| **Admin** | Approve new staff, create accounts, manage everything, see the activity log |

**Big idea:** the *same data* (lessons, users, scores) is shown differently to each person, and each person can only do what their role allows.

---

## 2. The restaurant idea (easiest way to explain it)

| In a restaurant | In EduAhead |
|---|---|
| The menu on the table | The pages you see (`index.html`, `main.html`, `console.html`) |
| The waiter | The page scripts (`script2.js`, `app.js`) that take your clicks |
| The kitchen | `backend.js`: the "brain" that follows the rules |
| The storage room | The database (`db.json`, then saved in your browser) |
| The security guard | `guard.js`: stops people without a ticket from walking in |

You never walk into the kitchen. You tell the waiter, the waiter asks the kitchen, and the kitchen checks the rules. This is how real apps are built.

---

## 3. The files and what each one is for

```
eduahead/
├── index.html        Login / Sign-up page
├── main.html         Student dashboard
├── console.html      Staff & parent page (admin, teacher, parent)
├── styles.css        Design for main + console pages
├── index2.css        Design for the login page
├── script2.js        Login & sign-up logic
├── ai-teacher.css/js The AI Teacher chat button and window
├── data/
│   └── db.json       The starting data (users, subjects, topics)
└── js/
    ├── config.js        Names of the pages (one place to rename)
    ├── backend.js       The brain: database, login, rules, results
    ├── guard.js         Blocks pages if you are not logged in
    ├── insight-view.js  Builds the "strengths & weaknesses" page
    └── app.js           Controls the staff/parent console
```

**Three kinds of files (remember this):**
- **HTML** = the *structure* (what is on the page)
- **CSS** = the *look* (colours, spacing, fonts)
- **JavaScript** = the *behaviour* (what happens when you click)
- **JSON** = just *data*, written in a tidy list format

---

## 4. How the files connect (the order matters)

Each page loads scripts **in this order**: `config.js`, then `backend.js`, then the page's own script. The page script uses things made by the files before it, so the order must stay the same.

```
Login page (index.html)        Student page (main.html)        Staff page (console.html)
 config.js                      config.js                       config.js
 backend.js                     backend.js                      backend.js
 script2.js                     guard.js                        app.js
                                insight-view.js
```

**A journey through the app:**
1. You open `index.html` and log in.
2. `script2.js` asks `backend.js`: "Is this email and password correct?"
3. If yes, the browser remembers who you are, then sends you to `main.html` (student) or `console.html` (everyone else).
4. The new page loads and `backend.js` is asked: "Who is logged in? Which lessons can they see?"
5. The page draws the right content for that person.
6. When a student finishes a quiz, the score is saved, and teachers and parents can later see it in reports.

---

## 5. What each important function does

### `backend.js` (the brain)

| Name | In plain words |
|---|---|
| `Store` | Saves and loads data from the browser's memory (called *localStorage*) |
| `DB.init()` | Starts the database. First time it copies `db.json`; after that it uses the saved copy |
| `DB.save()` | Saves the database after any change |
| `DB.log()` | Writes an entry in the **audit log** ("Ada approved a teacher") |
| `DB.reset()` | Wipes everything and starts fresh (for testing) |
| `DB.export()` | Downloads a backup file of all data |
| `secure()` | Scrambles a password so the real one is never stored (see *hash* below) |
| `Auth.login()` | Checks email and password; remembers the person if correct |
| `Auth.register()` | Creates a new account (staff accounts wait for approval) |
| `Auth.current()` | Answers "Who is logged in right now?" |
| `Auth.logout()` | Forgets the person and goes back to the login page |
| `PERMS` | A list of what each role is *allowed* to do |
| `can()` / `need()` | `can` asks "allowed?" (yes/no). `need` stops the action with an error if not allowed |
| `students()` | Decides *which students* you may see (teacher: own classes, parent: own children) |
| `Users.create()` / `approve()` | Admin makes accounts or approves pending ones |
| `Curriculum.forStudent()` | Gives a student their lessons: last class (revise), current class, next class (learn ahead) |
| `Curriculum.list()` | Lessons for staff, limited by role |
| `Curriculum.add()` | Adds a new topic (admin or the right teacher) |
| `Results.compute()` | Works out each subject's average and overall grade from quiz scores |
| `Reports.generate()` | Makes a report slip: subjects, grades and a teacher remark |
| `Reports.list()` | Shows only the reports you are allowed to see |

### Other files

| File | Job |
|---|---|
| `script2.js` | Switches between Login and Create account tabs, shows messages, sends the forms to `backend.js` |
| `guard.js` | If you are not logged in, sends you to the login page. Also keeps **each student's progress separate** |
| `app.js` | Builds the staff pages (dashboard, curriculum, users, students, reports, audit log) and handles their buttons |
| `insight-view.js` | Looks at a student's scores and builds the **Strengths and Weaknesses** page |
| `main.html` (inside) | Shows subjects, lessons, quizzes and progress; saves what the student completes |

---

## 6. How results and strengths/weaknesses are worked out

1. A student finishes a quiz. The page calculates a **score %** and keeps the **best score** for each topic.
2. **Subject average** = the average of the best scores in that subject.
3. **Overall** = the average across subjects.
4. **Grades:** A = 70+, B = 60+, C = 50+, D = 45+, E = 40+, F = below 40.
5. **Strengths** are topics with 70% or more. **Weaknesses / revision areas** are topics below 70% or not tried yet.
6. A teacher presses *Generate report* and the system saves a snapshot, so the report stays the same even if scores change later.

---

## 7. Where is the data stored?

| What | Where | Lasts |
|---|---|---|
| Starting data | `data/db.json` | Always (it is a file) |
| Working database | Browser `localStorage` (`eduahead-db-v2`) | Until you clear the browser |
| Each student's progress | `localStorage` (`eduahead-progress-v1:<id>`) | Until cleared |
| "Who is logged in" | `sessionStorage` (`sid`) | Until the tab is closed |

**Important:** all the data lives in *your own browser*, not on the internet. That is why teachers and students must use the same browser to see each other's results in this demo. A real school system would store this on a server.

---

## 8. Words you should know

| Word | Meaning |
|---|---|
| **Frontend** | The part you see and click (HTML, CSS, page scripts) |
| **Backend** | The part that stores data and follows rules (`backend.js`) |
| **Database** | An organised store of information |
| **JSON** | A text format for data: `{"name": "Tola", "class": "JSS 1"}` |
| **Authentication** | Proving who you are (logging in) |
| **Authorization / permissions** | What you are *allowed* to do after logging in |
| **Role** | Your type of user: student, teacher, parent, admin |
| **RBAC** | Role-Based Access Control: permissions depend on your role |
| **Hash** | A one-way scramble of a password. You can check it, but not un-scramble it |
| **Salt** | A random extra piece added before hashing so two equal passwords look different |
| **Session** | The period you stay logged in |
| **localStorage / sessionStorage** | Small storage areas inside the browser |
| **Audit log** | A diary of important actions in the system |
| **Curriculum / scheme of work** | The planned list of topics for each class and term |
| **Redirect** | Automatically sending you to another page |
| **Pending** | Waiting for approval (staff sign-ups) |

---

## 9. Try it yourself (demo steps)

**Start:** open the `eduahead` folder in VS Code and run **Live Server** on `index.html`, or run `npx serve .` in the folder. Opening the file by double-clicking will **not** work.

| Role | Email | Password |
|---|---|---|
| Admin | admin@school.ng | admin123 |
| Teacher | teacher@school.ng | teach123 |
| Student | student@school.ng | learn123 |
| Parent | parent@school.ng | parent123 |

1. **Student:** log in, open a topic, take a quiz, then open *My Specific Strengths and Weaknesses*.
2. **Teacher:** log in, open *Students*, press *Generate Report Slip*, then open *Reports*.
3. **Parent:** log in and see only the child's report.
4. **Admin:** sign up a new Teacher on the login page. It will say "awaiting approval". Log in as admin, open *Users*, press *Approve*. The teacher can now log in.
5. **Access control:** log in as a student and try opening `console.html`. You are sent back to your own page.

**If something goes wrong:** blank page or 404 means the folder layout is wrong, or you are not using a server. Weird old data: press **F12**, type `DB.reset()` in the Console, then hard refresh (**Ctrl + Shift + R**).

---

## 10. A 5-minute presentation outline

1. **The problem (30s):** students need to study ahead and schools need to track progress.
2. **The idea (30s):** one app with four roles: student, teacher, parent, admin.
3. **Show it (2 min):** do demo steps 1, 2 and 4 above.
4. **How it works (1 min):** show the restaurant picture. Pages are the menu, scripts are the waiter, `backend.js` is the kitchen, `db.json` is the storage room.
5. **Safety (30s):** passwords are hashed, roles limit access, staff need approval, every action is logged.
6. **Honest limits and next steps (30s):** data is stored in the browser, so a real version needs a server. Next steps are teachers editing quizzes and growth charts over time.

**Questions you may get:**
- *Why can't a student open the teacher page?* The guard checks the role and sends them back.
- *Are passwords safe?* They are hashed, not stored as typed. But this is a practice project, so a real system needs a server.
- *Where is the data?* In the browser, starting from `db.json`.
- *How do you add a new subject?* Add it to `db.json`, raise `meta.rev` by one so browsers reload it, then refresh.

---

## 11. Honest limits (good to say out loud)

- Anyone who knows the browser tools could edit the saved data. Real systems keep rules on a **server**.
- Only some subjects and topics have full lessons and quizzes. Others are outlines for teachers to fill in.
- The topic list follows the revised national curriculum structure, but a school should check it against its own approved scheme of work.

## 12. Ideas to extend it
1. Let teachers edit lessons and quiz questions in the console.
2. Show a growth chart of a student's scores over time.
3. Add attendance and show it on the report slip.
4. Add more subjects (Physics, Chemistry, Nigerian History, Digital Literacy).
5. Let parents switch between several children.
