
const loginForm = document.getElementById("loginForm");
const password = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const formMessage = document.getElementById("formMessage");

document.getElementById("year").textContent =
  new Date().getFullYear();

// Show or hide the password.
togglePassword.addEventListener("click", () => {
  const isHidden = password.type === "password";

  password.type = isHidden ? "text" : "password";
  togglePassword.textContent = isHidden ? "Hide" : "Show";
  togglePassword.setAttribute(
    "aria-label",
    isHidden ? "Hide password" : "Show password"
  );
});

// Display a message to the user.
function showFormMessage(text, type) {
  formMessage.textContent = text;
  formMessage.className = `form-message ${type}`;
}

// Demonstration login form.
loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const enteredPassword = password.value;

  if (!email || !enteredPassword) {
    showFormMessage(
      "Please enter your email and password.",
      "error"
    );
    return;
  }

  if (enteredPassword.length < 8) {
    showFormMessage(
      "Your password must contain at least 8 characters.",
      "error"
    );
    return;
  }

  showFormMessage(
    "The form is valid, but login is not connected to an account system yet.",
    "success"
  );
});

// Demo forgot-password action.
document.getElementById("forgotPassword")
  .addEventListener("click", (event) => {
    event.preventDefault();

    showFormMessage(
      "Password recovery will be available when an account backend is connected.",
      "error"
    );
  });
