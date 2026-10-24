// EduAhead interactions: mobile navigation, course filters, AI tutor demo, testimonials and signup.
document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");

  function closeMenu() {
    navLinks.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    document.body.classList.remove("menu-open");
  }
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
    navLinks.classList.toggle("open", !isOpen);
    document.body.classList.toggle("menu-open", !isOpen);
  });
  navLinks.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
  window.addEventListener("resize", () => { if (window.innerWidth > 780) closeMenu(); });

  // Reveal sections only when they enter the viewport.
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -25px 0px" });
    revealEls.forEach(el => observer.observe(el));
  } else revealEls.forEach(el => el.classList.add("is-visible"));

  // Course category filtering.
  const filterButtons = document.querySelectorAll(".filter-btn");
  const courseCards = document.querySelectorAll(".course-card");
  const noResults = document.getElementById("noResults");
  filterButtons.forEach(button => {
    button.addEventListener("click", () => {
      filterButtons.forEach(item => item.classList.toggle("active", item === button));
      const category = button.dataset.filter;
      let visible = 0;
      courseCards.forEach(card => {
        const show = category === "all" || card.dataset.category === category;
        card.hidden = !show;
        if (show) visible++;
      });
      noResults.hidden = visible > 0;
    });
  });

  // A browser-only demo tutor. Connect a real AI API on a secure backend for production.
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const chatContent = document.getElementById("chatContent");
  const openTutor = document.getElementById("openTutor");
  const chatDemo = document.getElementById("chatDemo");
  const suggestionBox = chatContent.querySelector(".suggestions");

  openTutor.addEventListener("click", () => {
    chatDemo.scrollIntoView({ behavior: "smooth", block: "center" });
    chatDemo.classList.add("chat-highlight");
    chatInput.focus({ preventScroll: true });
    window.setTimeout(() => chatDemo.classList.remove("chat-highlight"), 1500);
  });

  function addMessage(text, type) {
    const message = document.createElement("div");
    message.className = `message ${type === "user" ? "user-message" : "bot-message"}`;
    if (type === "bot") {
      const avatar = document.createElement("span");
      avatar.className = "message-avatar";
      avatar.textContent = "✦";
      message.appendChild(avatar);
    }
    const bubble = document.createElement("div");
    bubble.textContent = text;
    message.appendChild(bubble);
    chatContent.insertBefore(message, suggestionBox || null);
    chatContent.scrollTop = chatContent.scrollHeight;
  }

  function tutorReply(question) {
    const q = question.toLowerCase();
    if (q.includes("photosynthesis")) {
      return "Photosynthesis is how plants make their own food. They use sunlight, water, and carbon dioxide to make sugar, and they release oxygen. Think of a leaf as a tiny solar-powered kitchen! Quick check: what supplies the energy for this process?";
    }
    if (q.includes("study plan") || q.includes("plan")) {
      return "Let's make a simple plan: 1) Pick one clear goal. 2) Study for 25 minutes. 3) Take a 5-minute break. 4) Explain the main idea in your own words. 5) Finish with three practice questions. What subject are you focusing on?";
    }
    if (q.includes("math") || q.includes("quiz") || q.includes("equation")) {
      return "Let's try one! If 3x + 2 = 14, what is x? Hint: first subtract 2 from both sides, then divide by 3. Send your answer and I'll help you check your steps.";
    }
    if (q.includes("html") || q.includes("website") || q.includes("code")) {
      return "Great topic! HTML gives a webpage its structure, CSS controls its appearance, and JavaScript adds interactions. Try changing one heading in your HTML, then use CSS to change its color. Which part would you like to explore first?";
    }
    if (q.includes("hello") || q.includes("hi")) {
      return "Hi there! 👋 What subject are you working on today? I can help break a topic into smaller steps or give you a practice question.";
    }
    return "Good question! A useful way to tackle a new topic is to break it into smaller pieces, connect it to something you already know, and test yourself with an example. Tell me your subject or share a specific example, and we'll work through it step by step.";
  }

  function sendPrompt(prompt) {
    const clean = prompt.trim();
    if (!clean) return;
    addMessage(clean, "user");
    if (suggestionBox) suggestionBox.hidden = true;
    chatInput.value = "";
    const typing = document.createElement("div");
    typing.className = "message bot-message";
    typing.innerHTML = '<span class="message-avatar">✦</span><div>Thinking through it<span class="typing-dots"> ···</span></div>';
    chatContent.appendChild(typing);
    chatContent.scrollTop = chatContent.scrollHeight;
    window.setTimeout(() => {
      typing.remove();
      addMessage(tutorReply(clean), "bot");
    }, 550);
  }

  chatForm.addEventListener("submit", event => {
    event.preventDefault();
    sendPrompt(chatInput.value);
  });
  chatContent.querySelectorAll(".suggestions button").forEach(button => {
    button.addEventListener("click", () => sendPrompt(button.dataset.prompt));
  });

  // Testimonial carousel.
  const testimonials = [
    { quote: "I used to think coding was too complicated to start. The small lessons helped me get moving, and now I'm building my own little projects.", name: "Chidi James", role: "New developer · Learner", initials: "CJ", color: "#d5e9ce" },
    { quote: "I like that I can learn in short sessions. It feels easier to stay consistent when the next step is clear and achievable.", name: "Zainab Yusuf", role: "Creative learner", initials: "ZY", color: "#f3d3e1" },
    { quote: "The practice questions help me notice what I understand and what I need to revisit. Learning feels much less intimidating now.", name: "David Eze", role: "Lifelong learner", initials: "DE", color: "#d6d8ff" }
  ];
  let currentTestimonial = 0;
  const quoteText = document.getElementById("quoteText");
  const quoteName = document.getElementById("quoteName");
  const quoteRole = document.getElementById("quoteRole");
  const quoteAvatar = document.getElementById("quoteAvatar");
  const quoteCount = document.getElementById("quoteCount");
  function showTestimonial(index) {
    currentTestimonial = (index + testimonials.length) % testimonials.length;
    const item = testimonials[currentTestimonial];
    quoteText.textContent = item.quote;
    quoteName.textContent = item.name;
    quoteRole.textContent = item.role;
    quoteAvatar.textContent = item.initials;
    quoteAvatar.style.background = item.color;
    quoteCount.innerHTML = `0${currentTestimonial + 1} <span>/ 03</span>`;
  }
  document.getElementById("prevTestimonial").addEventListener("click", () => showTestimonial(currentTestimonial - 1));
  document.getElementById("nextTestimonial").addEventListener("click", () => showTestimonial(currentTestimonial + 1));

  // Demo signup: validates email but does not submit/store it anywhere.
  const signupForm = document.getElementById("signupForm");
  const signupMessage = document.getElementById("signupMessage");
  signupForm.addEventListener("submit", event => {
    event.preventDefault();
    if (!signupForm.reportValidity()) return;
    signupMessage.textContent = "Redirecting you to create your account...";
    signupForm.reset();
    window.location.href = "auth.html?mode=signup";
  });

  document.getElementById("year").textContent = new Date().getFullYear();
});