
(async () => {
  try {
    // 1. Initialize the database
    await DB.init();

    // 2. Get the authenticated user
    const me = Auth.current();

    if (!me) {
      location.replace(PAGES.login);
      return;
    }

    // 3. Set the student's class
    if (window.state) {
      window.state.className = me.class || "SSS 1";
    }

    // 4. Load the curriculum
    const loadedCurriculum = Curriculum.forStudent(me);

    if (!Array.isArray(loadedCurriculum)) {
      throw new Error("Curriculum must return an array.");
    }

    window.curriculum = loadedCurriculum;

    // 5. Check the loaded data
    const topicCount = loadedCurriculum.reduce(
      (total, subject) =>
        total +
        (Array.isArray(subject.topics)
          ? subject.topics.length
          : 0),
      0
    );

    console.log("Student class:", me.class);
    console.log("Subjects loaded:", loadedCurriculum.length);
    console.log("Topics loaded:", topicCount);
    console.log("Curriculum data:", loadedCurriculum);

    // 6. Reveal the application
    const shell =
      document.getElementById("shell") ||
      document.querySelector(".app-shell");

    if (shell) {
      shell.classList.remove("hidden");
    }

    // 7. Render the application
    if (typeof render === "function") {
      render();
    } else {
      console.error("The render() function was not found.");
    }
  } catch (err) {
    console.error("EduAhead initialization failed:", err);
  }
})();
