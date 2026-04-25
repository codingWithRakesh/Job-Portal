import { API_BASE_URL } from "../../../constants/constant.js";

// ─── Navigation ───────────────────────────────────────────────────────────────

function navigate(fromId, toId) {
  document.getElementById(fromId).classList.remove("active");
  document.getElementById(toId).classList.add("active");
}

// ─── Show/Hide error messages ─────────────────────────────────────────────────

function showError(elementId, message) {
  const el = document.getElementById(elementId);
  el.textContent = message;
  el.style.display = "block";
}

function hideError(elementId) {
  const el = document.getElementById(elementId);
  el.textContent = "";
  el.style.display = "none";
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

// ─── Password Visibility Toggle ───────────────────────────────────────────────

document.getElementById("show-password-toggle").addEventListener("change", function () {
  const type = this.checked ? "text" : "password";
  document.getElementById("new-password").type = type;
  document.getElementById("confirm-password").type = type;
});

// ─── Navigation Buttons ───────────────────────────────────────────────────────

document.getElementById("go-to-create").addEventListener("click", () => {
  navigate("step-signin", "step-create-account");
});

document.getElementById("back-to-signin").addEventListener("click", () => {
  navigate("step-create-account", "step-signin");
});

document.getElementById("go-to-password").addEventListener("click", () => {
  const name = document.getElementById("register-name").value.trim();
  const email = document.getElementById("register-email").value.trim();

  // Updated Warning System for Step 2
  if (!name || !email) {
    alert("Please fill in all fields."); // Or use a div-based error if preferred
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

  const email = document.getElementById("signin-email").value.trim();
  const password = document.getElementById("signin-password").value;

  // Warning System: If empty, show error and stop execution (stays on page)
  if (!email || !password) {
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

    window.location.href = "../../dashboard/controlJob/controlJob.html";

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
  const password = document.getElementById("new-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;

  // Warning System for Registration
  if (!password || !confirmPassword) {
    showError("register-error", "Please fill in both password fields.");
    return;
  }

  if (password !== confirmPassword) {
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
    document.getElementById("new-password").value = "";
    document.getElementById("confirm-password").value = "";

  } catch (err) {
    showError("register-error", "Network error. Please try again.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Next";
  }
});