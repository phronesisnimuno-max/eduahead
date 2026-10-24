# EduAhead

EduAhead is a browser-based learning platform for students, teachers, parents, and administrators. The app combines a modern landing page, role-based access controls, a student dashboard, a staff console, and a learning analytics area for strengths and weaknesses.

## Project flow

The app now has two main public entry points:

- `index.html` = student-facing landing page / home page
- `auth.html` = login and sign-up page
- `main.html` = student dashboard after login
- `console.html` = staff/admin dashboard after login

The route configuration is centralized in `js/config.js` so login redirects always use the correct authentication page.

---

## Folder structure

```text
eduahead/
├── index.html          Landing page / home page
├── auth.html           Login and sign-up page
├── main.html           Student dashboard
├── console.html        Staff console
├── home.html           Optional copy of the landing page
├── styles.css          Student and staff application styling
├── index2.css          Authentication page styling
├── script2.js          Login / signup interaction logic
├── far.css             Landing page styling
├── far.js              Landing page interactions
├── ai-teacher.css      AI teacher popover styling
├── ai-teacher.js       AI teacher demo interactions
├── data/
│   └── db.json         Initial database with users, subjects, topics, and sample progress
├── js/
│   ├── config.js       Page route configuration
│   ├── backend.js      Database, auth logic, RBAC, curriculum rules
│   ├── guard.js        Redirects unauthenticated users
│   ├── app.js          Staff console logic
│   ├── auth-page.js   Authentication page helper logic
│   ├── insight-view.js Strengths/weaknesses diagnostic UI
│   └── main-access.js  Student access and curriculum setup
├── images/             Brand and media assets
├── tools/
│   ├── make-admin.js   Helper for creating admin users
│   └── migrate.js      Migration helper
├── README.md
└── package.json        Optional local server scripts if used
```

---

## How the app works

### 1. Landing page

The root `index.html` is the public landing page. It introduces EduAhead, highlights key benefits, and gives the user a clear call to action:

- Log in
- Sign up
- Explore the product

The CTA links open the authentication page at `auth.html` with a query parameter such as:

- `auth.html?mode=login`
- `auth.html?mode=signup`

### 2. Authentication page

The login/signup page is `auth.html`. It contains:

- login form
- registration form
- password show/hide toggles
- role selection
- student class selection
- redirect logic back to the right dashboard after login

When a student logs in, the app redirects to `main.html`. When a teacher, parent, or admin logs in, it redirects to `console.html`.

### 3. Student dashboard

`main.html` loads the student dashboard, topic curriculum, quizzes, and progress tracking. Students can:

- browse curriculum for their class
- open learning topics
- take practice quizzes
- review progress and completion
- view strengths and weaknesses by subject and topic

### 4. Staff console

`console.html` loads the console app for non-student roles. It handles:

- teacher/student views
- reports generation
- user approval
- curriculum management
- activity logs

---

## Roles and permissions

EduAhead uses role-based access control.

| Role | Access |
|---|---|
| Student | Own profile, own curriculum, own progress, own reports |
| Teacher | Students in assigned classes, reports, curriculum access |
| Parent | Assigned child reports |
| Admin | Full system management and approval tools |

The rules are enforced mainly in `js/backend.js` and `js/guard.js`.

---

## Data and storage

The app stores its working data in the browser using `localStorage` and `sessionStorage`.

- `eduahead-db-v2` = app database
- `eduahead-progress-v1:<userId>` = student progress data
- `sid` = current logged-in user ID in session storage

The base seed data comes from `data/db.json`.

---

## Authentication and login flow

The app flow is:

1. User opens `index.html` or `auth.html`
2. User logs in or creates an account
3. `script2.js` validates the form
4. `Auth.login()` or `Auth.register()` runs from `js/backend.js`
5. The system stores the session and redirects to the correct page
6. `guard.js` prevents access to protected routes without a valid session

---

## Sample accounts

Use these demo accounts when running the app locally:

| Role | Email | Password |
|---|---|---|
| Admin | admin@school.ng | admin123 |
| Teacher | teacher@school.ng | teach123 |
| Student | student@school.ng | learn123 |
| Parent | parent@school.ng | parent123 |

---

## Running the project locally

Open the project folder in VS Code and run a local web server using either:

- Live Server extension, or
- `npx serve .`

Then open the project in the browser.

Important:

- Start from the project root so the app can load local assets correctly.
- Do not open the project by double-clicking the files directly if browser file access causes issues.
- For the app flow, the main entry is `index.html` and the auth route is `auth.html`.

---

## Known behavior

- Student accounts can select their class on sign-up.
- The dashboard only shows curriculum relevant to that class.
- Password visibility toggles are available on auth inputs.
- Staff accounts may need admin approval before they can sign in.
- The landing page and auth page are intentionally separate to give the product a stronger first impression and more professional flow.

---

## Notes for developers

If you need to update the route names, edit `js/config.js`.

If you want to rename pages or add more roles, update:

- `js/config.js`
- the redirects in the relevant pages
- any auth links that open `auth.html`

---

## Future improvements

- connect this front-end to a real backend API
- add real database persistence on a server
- add admin dashboards for analytics and user management
- expand subject content for more classes and terms
- add teacher editing of curriculum content
- add charts for student growth over time