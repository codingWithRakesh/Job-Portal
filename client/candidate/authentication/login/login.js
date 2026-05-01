import { API_BASE_URL } from "../../../constants/constant.js";

const BASE_URL = `${API_BASE_URL}/users`;

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

async function redirectBasedOnProfile() {
  const profileRes = await fetch(`${API_BASE_URL}/users/profile-completion`, {
    method: "GET",
    credentials: "include"
  });

  const profileData = await profileRes.json();
  const percentage = profileData?.data?.profileCompletePercentage ?? profileData?.profileCompletePercentage;

  if (percentage >= 50) {
    // window.location.href = "../../../index.html";
    window.location.href = isLocal ? "../../../home/index.html" : "/home/index";
  } else {
    // window.location.href = "../../profile/profile.html";
    window.location.href = isLocal ? "../../profile/profile.html" : "/candidate/profile/profile";
  }
}

function navigate(fromId, toId) {
  const fromPage = document.getElementById(fromId);
  const toPage = document.getElementById(toId);

  if (fromPage && toPage) {
    fromPage.classList.remove('active');
    toPage.classList.add('active');
  }
}

let registerData = {};

document.addEventListener("DOMContentLoaded", () => {

  //check is user is already logged in
  (async () => {
    try {
      const authRes = await fetch(`${API_BASE_URL}/users/current`, {
        method: "GET",
        credentials: "include"
      });

      if (authRes.ok) {
        await redirectBasedOnProfile();
      }
    } catch (err) {
      console.error(err);
    }
  })();

  //login logic
  const loginBtn = document.getElementById("btn-login-submit");
  const goToRegisterBtn = document.getElementById("btn-go-to-register");

  if (goToRegisterBtn) {
    goToRegisterBtn.addEventListener("click", () => navigate('page1', 'page2'));
  }

  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
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

  //registration logic (name/email)
  const page2Next = document.getElementById("btn-register-step1-next");
  const backToLogin = document.getElementById("btn-back-to-login");

  if (backToLogin) {
    backToLogin.addEventListener("click", () => navigate('page2', 'page1'));
  }

  if (page2Next) {
    page2Next.addEventListener("click", () => {
      const inputs = document.querySelectorAll("#page2 input");
      registerData.name = inputs[0].value;
      registerData.email = inputs[1].value;
      navigate('page2', 'page3');
    });
  }

  // registration logic (DOB/Gender)
  const page3Next = document.getElementById("btn-register-step2-next");
  const backToRegister1 = document.getElementById("btn-back-to-register-step1");

  if (backToRegister1) {
    backToRegister1.addEventListener("click", () => navigate('page3', 'page2'));
  }

  if (page3Next) {
    page3Next.addEventListener("click", () => {
      const selects = document.querySelectorAll("#page3 select");
      const month = selects[0].value;
      const day = selects[1].value;
      const year = selects[2].value;
      const gender = selects[3].value;

      registerData.DOB = `${year}-${month}-${day}`;
      registerData.gender = gender;
      navigate('page3', 'page4');
    });
  }

  // registration logic (password)
  const page4Submit = document.getElementById("btn-register-final-submit");
  const backToRegister2 = document.getElementById("btn-back-to-register-step2");
  const toggleCheckbox = document.getElementById("toggle-password-checkbox");

  if (backToRegister2) {
    backToRegister2.addEventListener("click", () => navigate('page4', 'page3'));
  }

  // Password visibility toggle logic
  if (toggleCheckbox) {
    toggleCheckbox.addEventListener("change", (e) => {
      const passInput = document.getElementById('new-password');
      const confirmInput = document.getElementById('confirm-password');
      const type = e.target.checked ? 'text' : 'password';
      if (passInput) passInput.type = type;
      if (confirmInput) confirmInput.type = type;
    });
  }

  if (page4Submit) {
    page4Submit.addEventListener("click", async () => {
      const password = document.getElementById("new-password").value;
      const confirmPassword = document.getElementById("confirm-password").value;

      if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
      }

      registerData.password = password;

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
        console.log(data);
        showPage(0);
      } catch (err) {
        console.error(err);
        alert("Something went wrong");
      }
    });
  }
});
// ==========================================
// 1. Page Navigation & State Management
// ==========================================
const pages = [
  document.getElementById('page1'),
  document.getElementById('page2'),
  document.getElementById('page3'),
  document.getElementById('page4')
];

let currentPageIndex = 0;

function showPage(index) {
  pages.forEach((page, i) => {
    if (page) {
      // Toggle the active class based on the current index
      if (i === index) {
        page.classList.add('active');
        page.style.display = 'block'; // Ensure visibility
      } else {
        page.classList.remove('active');
        page.style.display = 'none'; // Hide other pages
      }
    }
  });
  currentPageIndex = index;
}

// Initialize pages (hide all but the first)
showPage(0);

// ==========================================
// 2. Validation System (Warning on empty inputs)
// ==========================================
function validateCurrentPage(pageIndex) {
  const currentPage = pages[pageIndex];
  const inputs = currentPage.querySelectorAll('input[required], select');
  let isValid = true;

  // Clear previous warnings
  currentPage.querySelectorAll('.warning-msg').forEach(msg => msg.remove());
  currentPage.querySelectorAll('.error-border').forEach(el => el.classList.remove('error-border'));

  inputs.forEach(input => {
    // Check if input is empty or a select is unselected
    if (!input.value.trim()) {
      isValid = false;
      
      // Apply visual red border (you can define .error-border in your CSS)
      input.style.border = '1px solid red';
      input.classList.add('error-border');

      // Create and inject warning text
      const warning = document.createElement('div');
      warning.className = 'warning-msg';
      warning.style.color = '#d93025'; // Google-style red
      warning.style.fontSize = '12px';
      warning.style.marginTop = '4px';
      warning.innerText = 'This field is required.';
      
      // Append right after the input
      input.parentNode.appendChild(warning);
    } else {
      input.style.border = ''; // Reset border if valid
    }
  });

  // Password matching validation on Page 4
  if (pageIndex === 3) {
    const pass = document.getElementById('new-password');
    const confirmPass = document.getElementById('confirm-password');
    
    if (pass.value && confirmPass.value && pass.value !== confirmPass.value) {
      isValid = false;
      confirmPass.style.border = '1px solid red';
      const warning = document.createElement('div');
      warning.className = 'warning-msg';
      warning.style.color = '#d93025';
      warning.style.fontSize = '12px';
      warning.style.marginTop = '4px';
      warning.innerText = 'Passwords do not match.';
      confirmPass.parentNode.appendChild(warning);
    }
  }

  return isValid;
}

// Clear warnings when user starts typing/selecting
document.addEventListener('input', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
    e.target.style.border = '';
    const warning = e.target.parentNode.querySelector('.warning-msg');
    if (warning) warning.remove();
  }
});

// ==========================================
// 3. Dynamic Calendar Logic (Leap Year Support)
// ==========================================
const monthSelect = document.querySelector('select[aria-label="Month"]');
const daySelect = document.querySelector('select[aria-label="Day"]');
const yearSelect = document.querySelector('select[aria-label="Year"]');

// Populate Year Dropdown (e.g., from current year down to 1900)
function populateYears() {
  const currentYear = new Date().getFullYear();
  yearSelect.innerHTML = '<option value="" disabled selected>Year</option>';
  for (let i = currentYear; i >= 1900; i--) {
    yearSelect.innerHTML += `<option value="${i}">${i}</option>`;
  }
}

// Update Days based on Month and Year
function updateDays() {
  const month = parseInt(monthSelect.value);
  const year = parseInt(yearSelect.value);
  let daysInMonth = 31; // Default to 31

  if (month) {
    // If year is selected, calculate exact days (handles leap years perfectly).
    // Note: passing 0 as the day returns the last day of the PREVIOUS month.
    // Because HTML values are 1-12, passing month as the month parameter perfectly aligns with the requested month's last day.
    if (year) {
      daysInMonth = new Date(year, month, 0).getDate(); 
    } 
    // If only month is selected, default to a leap year (2024) so Feb has 29 days available just in case.
    else {
      daysInMonth = new Date(2024, month, 0).getDate();
    }
  }

  // Save the currently selected day so we don't clear it unnecessarily
  const currentSelectedDay = daySelect.value;

  // Re-populate days
  daySelect.innerHTML = '<option value="" disabled selected>Day</option>';
  for (let i = 1; i <= daysInMonth; i++) {
    daySelect.innerHTML += `<option value="${i}">${i}</option>`;
  }

  // Restore the selected day if it still exists in the new month (e.g., switching from Jan 31 to Feb, it will clear because Feb doesn't have 31)
  if (currentSelectedDay && currentSelectedDay <= daysInMonth) {
    daySelect.value = currentSelectedDay;
  }
}

if (monthSelect && daySelect && yearSelect) {
  populateYears();
  monthSelect.addEventListener('change', updateDays);
  yearSelect.addEventListener('change', updateDays);
  updateDays(); // Run once on load
}

// ==========================================
// 4. Enter Key Integration
// ==========================================
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault(); // Prevent default form submission behaviors
    
    // Find the active page and click its primary "Next" button
    const activePage = pages[currentPageIndex];
    if (activePage) {
      const nextButton = activePage.querySelector('.btn-primary');
      if (nextButton) {
        nextButton.click();
      }
    }
  }
});

// ==========================================
// 5. Button Event Listeners & Flow Logic
// ==========================================

// Page 1: Login
document.getElementById('btn-login-submit')?.addEventListener('click', () => {
  if (validateCurrentPage(0)) {
    console.log("Login processed!"); // Replace with real login logic
  }
});

document.getElementById('btn-go-to-register')?.addEventListener('click', () => {
  showPage(1); // Go to Page 2
});

// Page 2: Register Step 1
document.getElementById('btn-back-to-login')?.addEventListener('click', () => {
  showPage(0);
});

document.getElementById('btn-register-step1-next')?.addEventListener('click', () => {
  if (validateCurrentPage(1)) showPage(2);
});

// Page 3: Register Step 2
document.getElementById('btn-back-to-register-step1')?.addEventListener('click', () => {
  showPage(1);
});

document.getElementById('btn-register-step2-next')?.addEventListener('click', () => {
  if (validateCurrentPage(2)) showPage(3);
});

// Page 4: Final Password Step
document.getElementById('btn-back-to-register-step2')?.addEventListener('click', () => {
  showPage(2);
});

// Password Toggle Logic
document.getElementById('toggle-password-checkbox')?.addEventListener('change', (e) => {
  const type = e.target.checked ? 'text' : 'password';
  document.getElementById('new-password').type = type;
  document.getElementById('confirm-password').type = type;
});
