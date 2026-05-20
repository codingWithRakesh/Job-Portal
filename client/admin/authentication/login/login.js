import { API_BASE_URL } from "../../../constants/constant.js";

const isLocal = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";

function initRoleSwitcher() {
  const switcher = document.querySelector(".auth-role-switcher");
  const link = switcher?.querySelector(".auth-role-switch");
  const question = switcher?.querySelector(".auth-role-switch-question");
  const label = switcher?.querySelector(".auth-role-switch-label");

  if (!switcher || !link || !question || !label) return;

  const isAdminPage = window.location.pathname.toLowerCase().includes("admin");
  const targetPath = isAdminPage ? switcher.dataset.candidateLogin : switcher.dataset.adminLogin;

  question.textContent = isAdminPage ? "Are you a candidate?" : "Are you an admin?";
  label.textContent = isAdminPage ? "Candidate Login" : "Admin Login";
  link.href = targetPath;
  link.setAttribute("aria-label", isAdminPage ? "Switch to candidate login" : "Switch to admin login");
}

initRoleSwitcher();

// ─── Navigation ───────────────────────────────────────────────────────────────

function navigate(fromId, toId) {
  document.getElementById(fromId).classList.remove("active");
  document.getElementById(toId).classList.add("active");
}

// ─── Show/Hide error messages ─────────────────────────────────────────────────

function showError(elementId, message) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = message;
    el.style.display = "block";
  }
}

function hideError(elementId) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = "";
    el.style.display = "none";
  }
}

// ─── Global Enter Key Listener ───────────────────────────────────────────────

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    // Find the active step and click its primary button
    const activeStep = document.querySelector(".step.active");
    if (activeStep) {
      const primaryBtn = activeStep.querySelector(".btn-primary");
      if (primaryBtn) primaryBtn.click();
    }
  }
});

// ─── Clear Error Outlines on Input ────────────────────────────────────────────

// Feature: Automatically remove the red outline when the user starts typing
document.addEventListener("input", (e) => {
  if (e.target.tagName === "INPUT") {
    e.target.classList.remove("input-error");
  }
});

// ─── Password Visibility Toggle ───────────────────────────────────────────────

// Fix: Logic for Step 1 Sign-in Show Password checkbox
const toggleSignInPassword = document.getElementById("toggle-password-checkbox");
if (toggleSignInPassword) {
  toggleSignInPassword.addEventListener("change", function () {
    const type = this.checked ? "text" : "password";
    document.getElementById("signin-password").type = type;
  });
}

// Step 3 Create Password Show Password checkbox
const toggleCreatePassword = document.getElementById("show-password-toggle");
if (toggleCreatePassword) {
  toggleCreatePassword.addEventListener("change", function () {
    const type = this.checked ? "text" : "password";
    document.getElementById("new-password").type = type;
    document.getElementById("confirm-password").type = type;
  });
}

// ─── Navigation Buttons ───────────────────────────────────────────────────────

document.getElementById("go-to-create").addEventListener("click", () => {
  navigate("step-signin", "step-create-account");
});

document.getElementById("back-to-signin").addEventListener("click", () => {
  navigate("step-create-account", "step-signin");
});

document.getElementById("go-to-password").addEventListener("click", () => {
  const nameInput = document.getElementById("register-name");
  const emailInput = document.getElementById("register-email");
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();

  let hasError = false;
  hideError("create-account-error");

  // Feature: Apply red outlines if empty
  if (!name) { nameInput.classList.add("input-error"); hasError = true; }
  if (!email) { emailInput.classList.add("input-error"); hasError = true; }

  if (hasError) {
    showError("create-account-error", "Please fill in all fields.");
    return;
  }

  navigate("step-create-account", "step-password");
});

document.getElementById("back-to-create").addEventListener("click", () => {
  navigate("step-password", "step-create-account");
});

// ─── Login ────────────────────────────────────────────────────────────────────

document.getElementById("signin-btn").addEventListener("click", async () => {
  hideError("signin-error");

  const emailInput = document.getElementById("signin-email");
  const passwordInput = document.getElementById("signin-password");
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  let hasError = false;

  // Feature: Apply red outlines if empty
  if (!email) { emailInput.classList.add("input-error"); hasError = true; }
  if (!password) { passwordInput.classList.add("input-error"); hasError = true; }

  if (hasError) {
    showError("signin-error", "Please enter both email and password.");
    return; 
  }

  const btn = document.getElementById("signin-btn");
  btn.disabled = true;
  btn.textContent = "Signing in...";

  try {
    const response = await fetch(`${API_BASE_URL}/companies/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      showError("signin-error", data.message || "Login failed. Please try again.");
      return;
    }

    window.location.href = isLocal ? "../../dashboard/controlJob/controlJob.html" : "/admin/dashboard/controlJob/controlJob";

  } catch (err) {
    showError("signin-error", "Network error. Please try again.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Next";
  }
});

// ─── Register ─────────────────────────────────────────────────────────────────

document.getElementById("register-btn").addEventListener("click", async () => {
  hideError("register-error");

  const name = document.getElementById("register-name").value.trim();
  const email = document.getElementById("register-email").value.trim();
  
  const passInput = document.getElementById("new-password");
  const confirmPassInput = document.getElementById("confirm-password");
  const password = passInput.value;
  const confirmPassword = confirmPassInput.value;

  let hasError = false;

  // Feature: Apply red outlines if empty
  if (!password) { passInput.classList.add("input-error"); hasError = true; }
  if (!confirmPassword) { confirmPassInput.classList.add("input-error"); hasError = true; }

  if (hasError) {
    showError("register-error", "Please fill in both password fields.");
    return;
  }

  if (password !== confirmPassword) {
    passInput.classList.add("input-error");
    confirmPassInput.classList.add("input-error");
    showError("register-error", "Passwords do not match.");
    return;
  }

  const btn = document.getElementById("register-btn");
  btn.disabled = true;
  btn.textContent = "Creating account...";

  try {
    const response = await fetch(`${API_BASE_URL}/companies/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      showError("register-error", data.message || "Registration failed.");
      return;
    }

    alert("Account created successfully! Please sign in.");
    navigate("step-password", "step-signin");

    // Clear fields
    document.getElementById("register-name").value = "";
    document.getElementById("register-email").value = "";
    passInput.value = "";
    confirmPassInput.value = "";

  } catch (err) {
    showError("register-error", "Network error. Please try again.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Next";
  }
});