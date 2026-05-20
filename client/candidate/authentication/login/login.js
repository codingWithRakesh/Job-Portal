import { API_BASE_URL } from "../../../constants/constant.js";

const BASE_URL = `${API_BASE_URL}/users`;
const isLocal = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";

// ==========================================
// 1. State Management
// ==========================================
let registerData = {};
let pages = [];
let currentPageIndex = 0;

// Shared DOM Elements
let monthSelect, daySelect, yearSelect, genderSelect;

// ==========================================
// 2. Initialization Flow
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // Cache page elements
  pages = [
    document.getElementById('page1'),
    document.getElementById('page2'),
    document.getElementById('page3'),
    document.getElementById('page4')
  ];

  // Cache calendar elements
  monthSelect = document.querySelector('select[aria-label="Month"]');
  daySelect = document.querySelector('select[aria-label="Day"]');
  yearSelect = document.querySelector('select[aria-label="Year"]');
  genderSelect = document.querySelector('select[aria-label="Gender"]');

  // Initialize UI Features
  initRoleSwitcher();
  initCalendar();
  showPage(0); // Show login by default

  // Setup interactions & check session
  setupEventListeners();
  checkExistingSession();
});

// ==========================================
// 3. Authentication & Session Logic
// ==========================================
async function checkExistingSession() {
  try {
    const authRes = await fetch(`${BASE_URL}/current`, {
      method: "GET",
      credentials: "include"
    });

    if (authRes.ok) {
      await redirectBasedOnProfile();
    }
  } catch (err) {
    console.error("Session check failed:", err);
  }
}

async function redirectBasedOnProfile() {
  try {
    const profileRes = await fetch(`${BASE_URL}/profile-completion`, {
      method: "GET",
      credentials: "include"
    });

    const profileData = await profileRes.json();
    const percentage = profileData?.data?.profileCompletePercentage ?? profileData?.profileCompletePercentage;

    if (percentage >= 50) {
      window.location.href = isLocal ? "../../../home/index.html" : "/home/index";
    } else {
      window.location.href = isLocal ? "../../profile/profile.html" : "/candidate/profile/profile";
    }
  } catch (err) {
    console.error("Redirection check failed:", err);
  }
}

// ==========================================
// 4. UI Navigation & Validation
// ==========================================
function initRoleSwitcher() {
  const switcher = document.querySelector(".auth-role-switcher");
  if (!switcher) return;

  const link = switcher.querySelector(".auth-role-switch");
  const question = switcher.querySelector(".auth-role-switch-question");
  const label = switcher.querySelector(".auth-role-switch-label");
  
  if (!link || !question || !label) return;

  const isAdminPage = window.location.pathname.toLowerCase().includes("admin");
  const targetPath = isAdminPage ? switcher.dataset.candidateLogin : switcher.dataset.adminLogin;

  question.textContent = isAdminPage ? "Are you a candidate?" : "Are you an admin?";
  label.textContent = isAdminPage ? "Candidate Login" : "Admin Login";
  link.href = targetPath;
  link.setAttribute("aria-label", isAdminPage ? "Switch to candidate login" : "Switch to admin login");
}

function showPage(index) {
  pages.forEach((page, i) => {
    if (!page) return;
    if (i === index) {
      page.classList.add('active');
      page.style.display = 'block';
    } else {
      page.classList.remove('active');
      page.style.display = 'none';
    }
  });
  currentPageIndex = index;
}

function navigate(fromId, toId) {
  const targetIndex = pages.findIndex((page) => page?.id === toId);
  if (targetIndex !== -1) {
    showPage(targetIndex);
  }
}

function validateCurrentPage(pageIndex) {
  const currentPage = pages[pageIndex];
  if (!currentPage) return false;

  let isValid = true;
  const inputsToValidate = currentPage.querySelectorAll('input[required], select');

  // Clear previous warnings
  currentPage.querySelectorAll('.warning-msg').forEach(msg => msg.remove());
  currentPage.querySelectorAll('.error-border').forEach(el => el.classList.remove('error-border'));

  inputsToValidate.forEach(input => {
    if (!input.value.trim()) {
      isValid = false;
      showError(input, 'This field is required.');
    }
  });

  // Specific password matching validation on Page 4
  if (pageIndex === 3) {
    const pass = document.getElementById('new-password');
    const confirmPass = document.getElementById('confirm-password');
    
    if (pass?.value && confirmPass?.value && pass.value !== confirmPass.value) {
      isValid = false;
      showError(confirmPass, 'Passwords do not match.');
    }
  }

  return isValid;
}

function showError(element, message) {
  // Prevent duplicate warning messages from stacking
  if (element.parentNode.querySelector('.warning-msg')) return;

  element.classList.add('error-border');

  const warning = document.createElement('div');
  warning.className = 'warning-msg';
  warning.style.color = '#d93025';
  warning.style.fontSize = '12px';
  warning.style.marginTop = '4px';
  warning.innerText = message;
  
  element.parentNode.appendChild(warning);
}

function clearWarning(e) {
  const target = e.target;
  if (target.tagName === 'INPUT' || target.tagName === 'SELECT') {
    target.classList.remove('error-border');
    target.style.border = ''; // fallback clear
    const warning = target.parentNode.querySelector('.warning-msg');
    if (warning) warning.remove();
  }
}

// ==========================================
// 5. Dynamic Calendar Logic
// ==========================================
function initCalendar() {
  if (!monthSelect || !daySelect || !yearSelect) return;
  populateYears();
  updateDays();
}

function populateYears() {
  const currentYear = new Date().getFullYear();
  yearSelect.innerHTML = '<option value="" disabled selected>Year</option>';
  for (let i = currentYear; i >= 1900; i--) {
    yearSelect.innerHTML += `<option value="${i}">${i}</option>`;
  }
}

function updateDays() {
  const month = parseInt(monthSelect.value);
  const year = parseInt(yearSelect.value);
  let daysInMonth = 31; // Default

  if (month) {
    if (year) {
      daysInMonth = new Date(year, month, 0).getDate(); 
    } else {
      daysInMonth = new Date(2024, month, 0).getDate(); // Leap year default
    }
  }

  const currentSelectedDay = daySelect.value;
  daySelect.innerHTML = '<option value="" disabled selected>Day</option>';
  
  for (let i = 1; i <= daysInMonth; i++) {
    daySelect.innerHTML += `<option value="${i}">${i}</option>`;
  }

  if (currentSelectedDay && currentSelectedDay <= daysInMonth) {
    daySelect.value = currentSelectedDay;
  }
}

// ==========================================
// 6. Event Listeners Setup
// ==========================================
function setupEventListeners() {
  
  // Real-time Validation: Clear warnings dynamically on type/select
  document.addEventListener('input', clearWarning);
  document.addEventListener('change', (e) => {
    if (e.target.tagName === 'SELECT') clearWarning(e);
  });

  // Real-time Validation: Show error when user leaves a required field empty
  document.addEventListener('focusout', (e) => {
    const target = e.target;
    if ((target.tagName === 'INPUT' || target.tagName === 'SELECT') && target.hasAttribute('required')) {
      if (!target.value.trim()) {
        showError(target, 'This field is required.');
      }
    }
  });

  // Calendar listeners
  if (monthSelect) monthSelect.addEventListener('change', updateDays);
  if (yearSelect) yearSelect.addEventListener('change', updateDays);

  // Global Enter Key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); 
      const activePage = pages[currentPageIndex];
      if (activePage) {
        const nextButton = activePage.querySelector('.btn-primary');
        if (nextButton) nextButton.click();
      }
    }
  });

  // Page 1: Login
  const loginBtn = document.getElementById("btn-login-submit");
  const goToRegisterBtn = document.getElementById("btn-go-to-register");

  if (goToRegisterBtn) goToRegisterBtn.addEventListener("click", () => navigate('page1', 'page2'));

  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      
      // NEW: Run the validation check for the login page!
      if (!validateCurrentPage(0)) return; 

      const inputs = document.querySelectorAll("#page1 input");
      const email = inputs[0].value;
      const password = inputs[1].value;

      loginBtn.disabled = true;
      loginBtn.textContent = "Signing in...";

      try {
        const res = await fetch(`${BASE_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (!res.ok) {
          alert(data.message || "Login failed");
          return;
        }

        alert("Login successful ✅");
        await redirectBasedOnProfile();
      } catch (err) {
        console.error(err);
        alert("Something went wrong");
      } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = "Next";
      }
    });
  }

  // Page 2: Registration Step 1
  const page2Next = document.getElementById("btn-register-step1-next");
  const backToLogin = document.getElementById("btn-back-to-login");

  if (backToLogin) backToLogin.addEventListener("click", () => navigate('page2', 'page1'));

  if (page2Next) {
    page2Next.addEventListener("click", () => {
      if (!validateCurrentPage(1)) return;
      const inputs = document.querySelectorAll("#page2 input");
      registerData.name = inputs[0].value;
      registerData.email = inputs[1].value;
      showPage(2);
    });
  }

  // Page 3: Registration Step 2
  const page3Next = document.getElementById("btn-register-step2-next");
  const backToRegister1 = document.getElementById("btn-back-to-register-step1");

  if (backToRegister1) backToRegister1.addEventListener("click", () => navigate('page3', 'page2'));

  if (page3Next) {
    page3Next.addEventListener("click", (event) => {
      event.preventDefault();
      if (!validateCurrentPage(2)) return;

      const month = monthSelect?.value ?? "";
      const day = daySelect?.value ?? "";
      const year = yearSelect?.value ?? "";
      const gender = genderSelect?.value ?? "";

      registerData.DOB = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      registerData.gender = gender;
      showPage(3);
    });
  }

  // Page 4: Registration Step 3
  const page4Submit = document.getElementById("btn-register-final-submit");
  const backToRegister2 = document.getElementById("btn-back-to-register-step2");

  if (backToRegister2) backToRegister2.addEventListener("click", () => navigate('page4', 'page3'));

  // Password Visibility Toggles
  const toggleCheckboxes = document.querySelectorAll("#toggle-password-checkbox");
  toggleCheckboxes.forEach(checkbox => {
    checkbox.addEventListener("change", (e) => {
      const type = e.target.checked ? 'text' : 'password';
      const parentPage = e.target.closest('.step');
      
      if (parentPage) {
        const passInputs = parentPage.querySelectorAll('input[placeholder*="Password"], input[type="password"]');
        passInputs.forEach(input => input.type = type);
      }
    });
  });

  if (page4Submit) {
    page4Submit.addEventListener("click", async (event) => {
      event.preventDefault();
      if (!validateCurrentPage(3)) return;

      registerData.password = document.getElementById("new-password").value;

      page4Submit.disabled = true;
      page4Submit.textContent = "Creating...";

      try {
        const res = await fetch(`${BASE_URL}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(registerData)
        });
        const data = await res.json();

        if (!res.ok) {
          alert(data.message || "Registration failed");
          return;
        }

        alert("Registered successfully 🎉");
        registerData = {}; 
        
        document.querySelectorAll('input').forEach(input => {
          if (input.type !== 'checkbox') input.value = '';
        });
        
        showPage(0);
      } catch (err) {
        console.error(err);
        alert("Something went wrong");
      } finally {
        page4Submit.disabled = false;
        page4Submit.textContent = "Next";
      }
    });
  }
}