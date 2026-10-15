/* script2.js — Login & Registration (tabs, messages, Auth calls) */
document.addEventListener("DOMContentLoaded", async () => {

  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const messageBox = document.getElementById("message");

  function showMessage(text, isError = true) {
    if (!messageBox) return;
    messageBox.textContent = text;
    messageBox.className = `message ${isError ? "error" : "success"}`;
    messageBox.style.display = "block";
  }

  // Tab switching setup
  const loginTab = document.getElementById("loginTab");
  const signupTab = document.getElementById("signupTab");
  if (loginTab && signupTab) {
    loginTab.addEventListener("click", () => {
      loginTab.classList.add("active");
      signupTab.classList.remove("active");
      loginForm.classList.remove("hidden");
      signupForm.classList.add("hidden");
    });
    signupTab.addEventListener("click", () => {
      signupTab.classList.add("active");
      loginTab.classList.remove("active");
      signupForm.classList.remove("hidden");
      loginForm.classList.add("hidden");
    });
    document.getElementById("toSignup")?.addEventListener("click", () => signupTab.click());
    document.getElementById("toLogin")?.addEventListener("click", () => loginTab.click());
  }

  // Load the database, then send already-logged-in users to their page
  try {
    await DB.init();
    const already = Auth.current();
    if (already) { location.replace(already.role === "student" ? PAGES.student : PAGES.staff); return; }
  } catch (err) { showMessage(err.message); }

  // Login handler
  if (loginForm) {
    loginForm.addEventListener("submit", async e => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value;
      const password = document.getElementById("loginPassword").value;
      try {
        const user = await Auth.login(email, password);
        if (!user) throw new Error("Invalid email or password.");
        showMessage("Login successful! Redirecting...", false);
        setTimeout(() => {
          location.replace(user.role === "student" ? (PAGES.student || "main.html") : (PAGES.staff || "console.html"));
        }, 500);
      } catch (err) {
        showMessage(err.message);
      }
    });
  }

  // Signup handler (Strictly Students)
  if (signupForm) {
    signupForm.addEventListener("submit", async e => {
      e.preventDefault();
      const name = document.getElementById("fullName").value;
      const email = document.getElementById("signupEmail").value;
      const password = document.getElementById("signupPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      if (password !== confirmPassword) {
        showMessage("Passwords do not match.");
        return;
      }

      try {
        const r = await Auth.register({ name, email, role: document.getElementById("role").value, password, class: "JSS 1" });
        showMessage(r.status === "pending" ? "Account created. An administrator must approve it before you can log in." : "Account created successfully! Please log in.", false);
        signupForm.reset();
        setTimeout(() => loginTab.click(), 1200);
      } catch (err) {
        showMessage(err.message);
      }
    });
  }
});
