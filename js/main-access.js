// Clean initialization flow
(async () => {
  try {
    // 1. Initialize DB once
    await DB.init();

    // 2. Authenticate user
    const me = Auth.current();
    if (!me) return location.replace(PAGES.login);

    // 3. Set up global state & curriculum data
    window.curriculum = Curriculum.forStudent(me);
    if (window.state) {
      window.state.className = me.class || "JSS 1";
    }

    // 4. Reveal the app shell smoothly (removes any hidden state without flash)
    const shell = document.getElementById("shell") || document.querySelector(".app-shell");
    if (shell) shell.classList.remove("hidden");

    // 5. Single render call
    if (typeof render === "function") {
      render();
    } else if (typeof go === "function" && typeof NAV !== "undefined") {
      go(NAV[me.role][0][0]);
    }
  } catch (err) {
    console.error("Boot error:", err);
  }
})();