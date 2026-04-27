import { API_BASE_URL as API_URL } from "../../constants/constant.js";

const API_BASE_URL = `${API_URL}/users`;
const PROGRESS_RING_START_ANGLE = 225;

(async () => {
    try {
        const authRes = await fetch(`${API_BASE_URL}/current`, {
            method: "GET",
            credentials: "include"
        });

        if (!authRes.ok) {
            // window.location.href = "../authentication/login/login.html";
            window.location.href = "/candidate/authentication/login";
        }
    } catch (err) {
        console.error(err);
    }
})();

let userData = JSON.parse(localStorage.getItem("userData") || "{}");
let tempTags = { skills: [], tech: [], langs: [], achieve: [] };

document.addEventListener("DOMContentLoaded", () => {
    fetchCurrentUser();
    setupScrollSpy();
    bindEvents();
});

function bindEvents() {
    // Topbar: notification bell
    document.querySelector(".icon-button").addEventListener("click", () => openDrawer("notificationsOverlay"));

    // Topbar: profile menu
    document.querySelector(".profile-menu").addEventListener("click", () => openDrawer("profileDrawerOverlay"));

    // Avatar upload trigger
    document.querySelector(".avatar-trigger").addEventListener("click", () => document.getElementById("profilePicInput").click());
    document.getElementById("profilePicInput").addEventListener("change", handleProfilePicUpload);

    // Resume upload trigger
    document.getElementById("resumeInput").addEventListener("change", handleResumeUpload);
    document.querySelector(".outline-button").addEventListener("click", () => document.getElementById("resumeInput").click());

    // Edit icon next to name (opens detailsModal)
    document.querySelector(".edit-link").addEventListener("click", () => openModal("detailsModal"));

    // Quick link "Edit" / "Add" buttons in each section
    document.querySelector("#update-summary .text-link").addEventListener("click", () => openModal("summaryModal"));
    document.querySelector("#update-details .text-link").addEventListener("click", () => openModal("detailsModal"));
    document.querySelector("#update-address .text-link").addEventListener("click", () => openModal("addressModal"));
    document.querySelector("#update-languages .text-link").addEventListener("click", () => openModal("languagesModal"));
    document.querySelector("#update-qualifications .text-link").addEventListener("click", () => openModal("qualificationsModal"));
    document.querySelector("#update-achievements .text-link").addEventListener("click", () => openModal("achievementsModal"));
    document.querySelector("#update-skills .text-link").addEventListener("click", () => openModal("skillsModal"));
    document.querySelector("#update-experience .text-link").addEventListener("click", () => openModal("experienceModal"));
    document.querySelector("#update-projects .text-link").addEventListener("click", () => openModal("projectsModal"));

    // Tabs
    document.querySelectorAll(".tab-button").forEach(btn => {
        btn.addEventListener("click", () => {
            const target = btn.getAttribute("data-tab");
            switchTab(target, btn);
        });
    });

    // Drawer close buttons
    document.querySelector(".drawer-close").addEventListener("click", () => closeDrawer("profileDrawerOverlay"));
    document.querySelector(".notifications-close").addEventListener("click", () => closeDrawer("notificationsOverlay"));
    document.querySelector(".notifications-cta").addEventListener("click", () => closeDrawer("notificationsOverlay"));

    // Drawer "View & Update Profile" link
    document.querySelector(".profile-link").addEventListener("click", () => closeDrawer("profileDrawerOverlay"));

    // Modal close X buttons
    document.querySelector("#detailsModal .modal-close").addEventListener("click", () => closeModal("detailsModal"));
    document.querySelector("#addressModal .modal-close").addEventListener("click", () => closeModal("addressModal"));
    document.querySelector("#qualificationsModal .modal-close").addEventListener("click", () => closeModal("qualificationsModal"));
    document.querySelector("#experienceModal .modal-close").addEventListener("click", () => closeModal("experienceModal"));
    document.querySelector("#skillsModal .modal-close").addEventListener("click", () => closeModal("skillsModal"));
    document.querySelector("#projectsModal .modal-close").addEventListener("click", () => closeModal("projectsModal"));
    document.querySelector("#languagesModal .modal-close").addEventListener("click", () => closeModal("languagesModal"));
    document.querySelector("#summaryModal .modal-close").addEventListener("click", () => closeModal("summaryModal"));
    document.querySelector("#achievementsModal .modal-close").addEventListener("click", () => closeModal("achievementsModal"));

    // Modal cancel buttons
    document.querySelector("#detailsModal .btn-cancel").addEventListener("click", () => closeModal("detailsModal"));
    document.querySelector("#addressModal .btn-cancel").addEventListener("click", () => closeModal("addressModal"));
    document.querySelector("#qualificationsModal .btn-cancel").addEventListener("click", () => closeModal("qualificationsModal"));
    document.querySelector("#experienceModal .btn-cancel").addEventListener("click", () => closeModal("experienceModal"));
    document.querySelector("#skillsModal .btn-cancel").addEventListener("click", () => closeModal("skillsModal"));
    document.querySelector("#projectsModal .btn-cancel").addEventListener("click", () => closeModal("projectsModal"));
    document.querySelector("#languagesModal .btn-cancel").addEventListener("click", () => closeModal("languagesModal"));
    document.querySelector("#summaryModal .btn-cancel").addEventListener("click", () => closeModal("summaryModal"));
    document.querySelector("#achievementsModal .btn-cancel").addEventListener("click", () => closeModal("achievementsModal"));

    // Modal form submits
    document.querySelector("#detailsModal .modal-form").addEventListener("submit", submitDetails);
    document.querySelector("#addressModal .modal-form").addEventListener("submit", submitAddress);
    document.querySelector("#qualificationsModal .modal-form").addEventListener("submit", submitQualification);
    document.querySelector("#experienceModal .modal-form").addEventListener("submit", submitExperience);
    document.querySelector("#skillsModal .modal-form").addEventListener("submit", submitSkills);
    document.querySelector("#projectsModal .modal-form").addEventListener("submit", submitProject);
    document.querySelector("#languagesModal .modal-form").addEventListener("submit", (e) => submitArrayUpdate(e, "languages"));
    document.querySelector("#summaryModal .modal-form").addEventListener("submit", submitSummary);
    document.querySelector("#achievementsModal .modal-form").addEventListener("submit", (e) => submitArrayUpdate(e, "achievements"));

    // Tag inputs
    document.getElementById("inpSkillTag").addEventListener("keydown", (e) => handleTagInput(e, "skills"));
    document.getElementById("inpTechTag").addEventListener("keydown", (e) => handleTagInput(e, "tech"));
    document.getElementById("inpLangTag").addEventListener("keydown", (e) => handleTagInput(e, "langs"));
    document.getElementById("inpAchieveTag").addEventListener("keydown", (e) => handleTagInput(e, "achieve"));

    document.getElementById("qualificationsList").addEventListener("click", handleQualificationDelete);
    document.getElementById("experienceList").addEventListener("click", handleExperienceDelete);
    document.getElementById("projectsList").addEventListener("click", handleProjectDelete);
}

//current user fetch
async function fetchCurrentUser() {
    try {
        const res = await fetch(`${API_BASE_URL}/current`, {
            method: "GET",
            credentials: "include"
        });
        const json = await res.json();
        if (json.success) {
            userData = json.data;
            localStorage.setItem("userData", JSON.stringify(userData));
            renderUI();
            fetchProfileCompletion();
        }
    } catch (err) {
        console.error("Error fetching user", err);
        if (userData && userData.name) renderUI();
    }
}

//profile completion fetch
async function fetchProfileCompletion() {
    try {
        const res = await fetch(`${API_BASE_URL}/profile-completion`, {
            method: "GET",
            credentials: "include"
        });
        const json = await res.json();
        if (json.success) {
            updateProgressRing(json.data.profileCompletePercentage);
        }
    } catch (err) {
        console.error("Error fetching completion", err);
    }
}

// UI Rendering
function renderUI() {
    document.getElementById("displayName").textContent = userData.name || "Name";
    document.getElementById("displayEmail").textContent = userData.email || "-";
    document.getElementById("displayPhone").textContent = userData.phoneNumber || "-";
    document.getElementById("displayGender").textContent = userData.gender || "-";
    document.getElementById("displayLocation").textContent = userData.address?.city ? `${userData.address.city}, ${userData.address.state}` : "-";

    document.getElementById("drawerProfileName").textContent = userData.name || "Name";

    if (userData.DOB) {
        document.getElementById("displayDOB").textContent = new Date(userData.DOB).toLocaleDateString();
    } else {
        document.getElementById("displayDOB").textContent = "-";
    }

    if (userData.qualifications?.length > 0) {
        document.getElementById("displayTopDegree").textContent = userData.qualifications[0].degree + " - " + userData.qualifications[0].department;
        document.getElementById("displayTopSchool").textContent = userData.qualifications[0].institution;
        document.getElementById("drawerProfileSubtitle").textContent = userData.qualifications[0].degree + " - " + userData.qualifications[0].department + " at " + userData.qualifications[0].institution;
    } else {
        document.getElementById("displayTopDegree").textContent = "Degree not added";
        document.getElementById("displayTopSchool").textContent = "";
        document.getElementById("drawerProfileSubtitle").textContent = "Update Profile to stand out";
    }

    document.getElementById("cdName").textContent = userData.name || "-";
    document.getElementById("cdCategory").textContent = userData.category || "-";
    document.getElementById("cdPhone").textContent = userData.phoneNumber || "-";
    document.getElementById("cdGender").textContent = userData.gender || "-";
    document.getElementById("cdDOB").textContent = userData.DOB ? new Date(userData.DOB).toLocaleDateString() : "-";

    document.getElementById("cdStreet").textContent = userData.address?.street || "-";
    document.getElementById("cdCity").textContent = userData.address?.city || "-";
    document.getElementById("cdState").textContent = userData.address?.state || "-";
    document.getElementById("cdCountry").textContent = userData.address?.country || "-";
    document.getElementById("cdZip").textContent = userData.address?.zip || "-";

    document.getElementById("summaryText").textContent = userData.summary || "-";

    renderList("qualificationsList", userData.qualifications, (q, index) => `
        <article class="record-item record-item--detail">
            <div class="record-item-head">
                <div>
                    <p class="record-title">${q.degree} - ${q.department}</p>
                    <p class="record-meta">${q.institution}</p>
                </div>
                <button type="button" class="item-delete-button" data-action="delete-qualification" data-index="${index}" aria-label="Delete education entry">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M4 7h16"></path>
                        <path d="M10 11v6"></path>
                        <path d="M14 11v6"></path>
                        <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"></path>
                        <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                    </svg>
                </button>
            </div>
            <p class="record-year">Passing year: ${q.year}</p>
        </article>
    `, "No education added yet");

    renderList("experienceList", userData.experiences, (e, index) => `
        <article class="record-item record-item--detail">
            <div class="record-item-head">
                <div>
                    <p class="record-title">${e.position}</p>
                    <p class="record-meta">${e.company}</p>
                </div>
                <button type="button" class="delete-btn experience-delete" data-action="delete-experience" data-index="${index}" aria-label="Delete experience">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M4 7h16"></path>
                        <path d="M10 11v6"></path>
                        <path d="M14 11v6"></path>
                        <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"></path>
                        <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                    </svg>
                </button>
            </div>
            <p class="record-year">${new Date(e.startDate).toLocaleDateString(undefined, { month: "short", year: "numeric" })} - ${new Date(e.endDate).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</p>
        </article>
    `, "No experience added yet");

    renderList("projectsList", userData.projects, (p, index) => `
        <article class="record-item record-item--detail">
            <div class="record-item-head">
                <div>
                    <p class="record-title">${p.title}</p>
                    <p class="record-meta">${p.technologies.join(", ")}</p>
                </div>
                <button type="button" class="delete-btn project-delete" data-action="delete-project" data-index="${index}" aria-label="Delete project">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M4 7h16"></path>
                        <path d="M10 11v6"></path>
                        <path d="M14 11v6"></path>
                        <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"></path>
                        <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                    </svg>
                </button>
            </div>
            <p class="helper-copy" style="margin: 8px 0;">${p.description}</p>
            ${p.link ? `<a href="${p.link}" target="_blank" class="text-link" style="font-size:0.85rem;">View Project</a>` : ""}
        </article>
    `, "No projects added yet");

    renderList("achievementsList", userData.achievements, a => `
        <article class="record-item record-item--detail">
            <p class="record-title" style="font-weight:500;">${a}</p>
        </article>
    `);

    document.getElementById("skillsList").innerHTML = (userData.skills || []).length
        ? (userData.skills || []).map(s => `<span class="skill-pill">${s}</span>`).join("")
        : '<span class="empty-value">Not added yet</span>';
    document.getElementById("languagesList").innerHTML = (userData.languages || []).map(l => `<span class="lang-pill">${l}</span>`).join("");

    const profileAvatar = document.getElementById("profileAvatar");
    const headerProfileAvatar = document.getElementById("headerProfileAvatar");
    const drawerAvatarInner = document.querySelector(".profile-avatar-inner");
    const drawerAvatarHead = document.querySelector(".profile-avatar-head");
    const drawerAvatarBody = document.querySelector(".profile-avatar-body");

    if (userData.profilePicture?.url) {
        profileAvatar.style.backgroundImage = `url(${userData.profilePicture.url})`;
        profileAvatar.classList.add("has-photo");

        headerProfileAvatar.style.backgroundImage = `url(${userData.profilePicture.url})`;
        headerProfileAvatar.classList.add("has-photo");

        if (drawerAvatarInner) {
            drawerAvatarInner.style.backgroundImage = `url(${userData.profilePicture.url})`;
            drawerAvatarInner.style.backgroundPosition = "center";
            drawerAvatarInner.style.backgroundRepeat = "no-repeat";
            drawerAvatarInner.style.backgroundSize = "cover";
        }
        if (drawerAvatarHead) drawerAvatarHead.style.display = "none";
        if (drawerAvatarBody) drawerAvatarBody.style.display = "none";
    } else {
        profileAvatar.style.backgroundImage = "";
        profileAvatar.classList.remove("has-photo");

        headerProfileAvatar.style.backgroundImage = "";
        headerProfileAvatar.classList.remove("has-photo");

        if (drawerAvatarInner) drawerAvatarInner.style.backgroundImage = "";
        if (drawerAvatarHead) drawerAvatarHead.style.display = "";
        if (drawerAvatarBody) drawerAvatarBody.style.display = "";
    }

    const rDisp = document.getElementById("resumeDisplay");
    if (userData.resume?.url) {
        rDisp.innerHTML = `
            <div class="record-item">
                <div class="experience-record-main" style="align-items:center;">
                    <div>
                        <p class="record-title">Uploaded Resume</p>
                        <a href="${userData.resume.url}" target="_blank" class="text-link" style="font-size:0.85rem;">View File</a>
                    </div>
                </div>
                <button class="experience-remove-button" id="deleteResumeBtn">
                    <svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"></path></svg>
                </button>
            </div>
        `;
        document.getElementById("deleteResumeBtn").addEventListener("click", deleteResume);
    } else {
        rDisp.innerHTML = "";
    }
}

function renderList(elementId, arr, templateFn, emptyMessage = "Not added yet") {
    const el = document.getElementById(elementId);
    if (!arr || arr.length === 0) { el.innerHTML = `<span class="empty-value">${emptyMessage}</span>`; return; }
    el.innerHTML = arr.map((item, index) => templateFn(item, index)).join("");
}

//tab switching
function switchTab(targetId, btnElement) {
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
    document.getElementById(targetId).classList.add("active");
    btnElement.classList.add("active");
}

//progress ring update
function updateProgressRing(percentage) {
    const circle = document.getElementById("progressFill");
    const text = document.getElementById("progressText");
    const drawerText = document.getElementById("drawerPercentage");
    const drawerRing = document.getElementById("drawerRing");

    const radius = circle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    let color = "#ef4444";
    if (percentage > 25 && percentage <= 50) color = "#f97316";
    else if (percentage > 50 && percentage <= 75) color = "#eab308";
    else if (percentage > 75) color = "#2abf68";

    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.stroke = color;
    if (percentage === 0) {
        circle.style.strokeDashoffset = circumference;
        circle.style.opacity = "0";
    } else {
        circle.style.opacity = "1";
        circle.style.strokeDashoffset = offset;
    }
    text.textContent = `${percentage}%`;
    text.style.color = color;

    if (drawerText && drawerRing) {
        drawerText.textContent = `${percentage}%`;
        drawerText.style.color = color;
        drawerRing.style.background = `conic-gradient(from ${PROGRESS_RING_START_ANGLE}deg, ${color} 0 ${percentage}%, #e4e8f2 ${percentage}% 100%)`;
    }
}

//drawers
function openDrawer(id) {
    document.body.classList.add("modal-open");
    const drawer = document.getElementById(id);
    drawer.hidden = false;
    setTimeout(() => { drawer.classList.add("open"); }, 10);
}

function closeDrawer(id) {
    document.body.classList.remove("modal-open");
    const drawer = document.getElementById(id);
    drawer.classList.remove("open");
    setTimeout(() => { drawer.hidden = true; }, 250);
}

//modals
function openModal(id) {
    document.body.classList.add("modal-open");
    const modal = document.getElementById(id);
    modal.hidden = false;
    setTimeout(() => modal.classList.add("open"), 10);

    if (id === "detailsModal") {
        document.getElementById("inpName").value = userData.name || "";
        document.getElementById("inpPhone").value = userData.phoneNumber || "";
        if (userData.DOB) document.getElementById("inpDOB").value = userData.DOB.split("T")[0];
        if (userData.gender) {
            const el = document.querySelector(`input[name="inpGender"][value="${userData.gender}"]`);
            if (el) el.checked = true;
        }
        if (userData.category) {
            const el = document.querySelector(`input[name="inpCategory"][value="${userData.category}"]`);
            if (el) el.checked = true;
        }
    } else if (id === "addressModal") {
        document.getElementById("inpStreet").value = userData.address?.street || "";
        document.getElementById("inpCity").value = userData.address?.city || "";
        document.getElementById("inpState").value = userData.address?.state || "";
        document.getElementById("inpZip").value = userData.address?.zip || "";
        document.getElementById("inpCountry").value = userData.address?.country || "";
    } else if (id === "summaryModal") {
        document.getElementById("inpSummary").value = userData.summary || "";
    } else if (id === "skillsModal") {
        tempTags.skills = [...(userData.skills || [])];
        renderTags("skills");
    } else if (id === "languagesModal") {
        tempTags.langs = [...(userData.languages || [])];
        renderTags("langs");
    } else if (id === "achievementsModal") {
        tempTags.achieve = [...(userData.achievements || [])];
        renderTags("achieve");
    } else if (id === "projectsModal") {
        tempTags.tech = [];
        renderTags("tech");
    }
}

function closeModal(id) {
    document.body.classList.remove("modal-open");
    const modal = document.getElementById(id);
    modal.classList.remove("open");
    setTimeout(() => modal.hidden = true, 200);
}

function persistUserData() {
    localStorage.setItem("userData", JSON.stringify(userData));
}

function handleQualificationDelete(event) {
    const deleteButton = event.target.closest('[data-action="delete-qualification"]');
    if (!deleteButton) return;

    const qualificationIndex = Number(deleteButton.dataset.index);
    if (!Number.isInteger(qualificationIndex) || !Array.isArray(userData.qualifications)) return;

    const shouldDelete = window.confirm("Are you sure you want to delete this education entry?");
    if (!shouldDelete) return;

    userData.qualifications = userData.qualifications.filter((_, index) => index !== qualificationIndex);
    persistUserData();
    renderUI();
}

function handleExperienceDelete(event) {
    const deleteButton = event.target.closest('[data-action="delete-experience"]');
    if (!deleteButton) return;

    const experienceIndex = Number(deleteButton.dataset.index);
    if (!Number.isInteger(experienceIndex) || !Array.isArray(userData.experiences)) return;

    const shouldDelete = window.confirm("Are you sure you want to delete this experience?");
    if (!shouldDelete) return;

    userData.experiences = userData.experiences.filter((_, index) => index !== experienceIndex);
    persistUserData();
    renderUI();
}

function handleProjectDelete(event) {
    const deleteButton = event.target.closest('[data-action="delete-project"]');
    if (!deleteButton) return;

    const projectIndex = Number(deleteButton.dataset.index);
    if (!Number.isInteger(projectIndex) || !Array.isArray(userData.projects)) return;

    const shouldDelete = window.confirm("Delete this project?");
    if (!shouldDelete) return;

    userData.projects = userData.projects.filter((_, index) => index !== projectIndex);
    persistUserData();
    renderUI();
}

//form submissions

async function submitDetails(e) {
    e.preventDefault();
    const name = document.getElementById("inpName").value;
    const phone = document.getElementById("inpPhone").value;
    const dob = document.getElementById("inpDOB").value;
    const genderNode = document.querySelector("input[name=\"inpGender\"]:checked");
    const catNode = document.querySelector("input[name=\"inpCategory\"]:checked");

    const payload = {
        name,
        phoneNumber: phone,
        DOB: dob ? new Date(dob).toISOString() : null,
        gender: genderNode ? genderNode.value : userData.gender,
        category: catNode ? catNode.value : userData.category,
        summary: userData.summary,
        languages: userData.languages || [],
        achievements: userData.achievements || []
    };

    try {
        const res = await fetch(`${API_BASE_URL}/update-details`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
            userData = json.data;
            localStorage.setItem("userData", JSON.stringify(userData));
            renderUI();
            fetchProfileCompletion();
        } else {
            alert(json.message || "Failed to update details");
        }
    } catch (err) { alert(err.message); }
    closeModal("detailsModal");
}

async function submitAddress(e) {
    e.preventDefault();
    const payload = {
        street: document.getElementById("inpStreet").value,
        city: document.getElementById("inpCity").value,
        state: document.getElementById("inpState").value,
        zipCode: document.getElementById("inpZip").value,
        country: document.getElementById("inpCountry").value
    };

    try {
        const res = await fetch(`${API_BASE_URL}/update-address`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
            userData = json.data;
            localStorage.setItem("userData", JSON.stringify(userData));
            renderUI();
            fetchProfileCompletion();
        } else {
            alert(json.message || "Failed to update address");
        }
    } catch (err) { alert(err.message); }
    closeModal("addressModal");
}

async function submitQualification(e) {
    e.preventDefault();
    const payload = {
        degree: document.getElementById("inpDegree").value,
        department: document.getElementById("inpDept").value,
        institution: document.getElementById("inpInst").value,
        yearOfPassing: parseInt(document.getElementById("inpYear").value)
    };

    try {
        const res = await fetch(`${API_BASE_URL}/update-qualifications`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
            userData = json.data;
            localStorage.setItem("userData", JSON.stringify(userData));
            renderUI();
            fetchProfileCompletion();
        } else {
            alert(json.message || "Failed to add qualification");
        }
    } catch (err) { alert(err.message); }
    closeModal("qualificationsModal");
    e.target.reset();
}

async function submitExperience(e) {
    e.preventDefault();
    const payload = {
        company: document.getElementById("inpCompany").value,
        position: document.getElementById("inpPosition").value,
        startDate: new Date(document.getElementById("inpExpStart").value).toISOString(),
        endDate: new Date(document.getElementById("inpExpEnd").value).toISOString()
    };

    try {
        const res = await fetch(`${API_BASE_URL}/update-experience`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
            userData = json.data;
            localStorage.setItem("userData", JSON.stringify(userData));
            renderUI();
            fetchProfileCompletion();
        } else {
            alert(json.message || "Failed to add experience");
        }
    } catch (err) { alert(err.message); }
    closeModal("experienceModal");
    e.target.reset();
}

async function submitProject(e) {
    e.preventDefault();
    const payload = {
        title: document.getElementById("inpProjTitle").value,
        link: document.getElementById("inpProjLink").value,
        description: document.getElementById("inpProjDesc").value,
        technologies: tempTags.tech
    };

    try {
        const res = await fetch(`${API_BASE_URL}/update-projects`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
            userData = json.data;
            localStorage.setItem("userData", JSON.stringify(userData));
            renderUI();
            fetchProfileCompletion();
        } else {
            alert(json.message || "Failed to add project");
        }
    } catch (err) { alert(err.message); }
    closeModal("projectsModal");
    e.target.reset();
}

async function submitSkills(e) {
    e.preventDefault();
    try {
        const res = await fetch(`${API_BASE_URL}/update-skills`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ skills: tempTags.skills })
        });
        const json = await res.json();
        if (json.success) {
            userData = json.data;
            localStorage.setItem("userData", JSON.stringify(userData));
            renderUI();
            fetchProfileCompletion();
        } else {
            alert(json.message || "Failed to update skills");
        }
    } catch (err) { alert(err.message); }
    closeModal("skillsModal");
}

async function submitSummary(e) {
    e.preventDefault();
    const payload = {
        name: userData.name,
        phoneNumber: userData.phoneNumber,
        DOB: userData.DOB,
        gender: userData.gender,
        category: userData.category || "Fresher",
        languages: userData.languages || [],
        achievements: userData.achievements || [],
        summary: document.getElementById("inpSummary").value
    };

    try {
        const res = await fetch(`${API_BASE_URL}/update-details`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
            userData = json.data;
            localStorage.setItem("userData", JSON.stringify(userData));
            renderUI();
            fetchProfileCompletion();
        } else {
            alert(json.message || "Failed to update summary");
        }
    } catch (err) { alert(err.message); }
    closeModal("summaryModal");
}

async function submitArrayUpdate(e, type) {
    e.preventDefault();
    const payload = {
        name: userData.name,
        phoneNumber: userData.phoneNumber,
        DOB: userData.DOB,
        gender: userData.gender,
        summary: userData.summary,
        category: userData.category || "Fresher",
        languages: type === "languages" ? tempTags.langs : (userData.languages || []),
        achievements: type === "achievements" ? tempTags.achieve : (userData.achievements || [])
    };

    try {
        const res = await fetch(`${API_BASE_URL}/update-details`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
            userData = json.data;
            localStorage.setItem("userData", JSON.stringify(userData));
            renderUI();
            fetchProfileCompletion();
        } else {
            alert(json.message || "Failed to update");
        }
    } catch (err) { alert(err.message); }
    closeModal(`${type}Modal`);
}

//tag handling
function handleTagInput(e, type) {
    if (e.key === "Enter") {
        e.preventDefault();
        const val = e.target.value.trim();
        if (val && !tempTags[type].includes(val)) {
            tempTags[type].push(val);
            renderTags(type);
            e.target.value = "";
        }
    }
}

function removeTag(type, index) {
    tempTags[type].splice(index, 1);
    renderTags(type);
}

function renderTags(type) {
    const containerMap = { skills: "skillsTagContainer", tech: "techTagContainer", langs: "langsTagContainer", achieve: "achieveTagContainer" };
    const inputMap = { skills: "inpSkillTag", tech: "inpTechTag", langs: "inpLangTag", achieve: "inpAchieveTag" };

    const cont = document.getElementById(containerMap[type]);
    const inputEl = document.getElementById(inputMap[type]);

    Array.from(cont.querySelectorAll(".tag")).forEach(t => t.remove());

    tempTags[type].forEach((t, i) => {
        const tag = document.createElement("div");
        tag.className = "tag";
        tag.innerHTML = `${t} <span data-type="${type}" data-index="${i}">&times;</span>`;
        cont.insertBefore(tag, inputEl);
    });

    // Bind remove clicks
    cont.querySelectorAll(".tag span").forEach(span => {
        span.addEventListener("click", () => {
            removeTag(span.dataset.type, parseInt(span.dataset.index));
        });
    });
}

//file uploads
async function handleProfilePicUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("profilePicture", file);

    try {
        const res = await fetch(`${API_BASE_URL}/upload-profile-picture`, {
            method: "POST",
            credentials: "include",
            body: fd
        });
        const json = await res.json();
        if (json.success) {
            userData = json.data;
            localStorage.setItem("userData", JSON.stringify(userData));
            renderUI();
            fetchProfileCompletion();
        } else {
            alert(json.message || "Failed to upload profile picture");
        }
    } catch (err) { alert(err.message); }
}

async function handleResumeUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("resume", file);

    try {
        const res = await fetch(`${API_BASE_URL}/upload-resume`, {
            method: "POST",
            credentials: "include",
            body: fd
        });
        const json = await res.json();
        if (json.success) {
            userData = json.data;
            localStorage.setItem("userData", JSON.stringify(userData));
            renderUI();
            fetchProfileCompletion();
        } else {
            alert(json.message || "Failed to upload resume");
        }
    } catch (err) { alert(err.message); }
}

async function deleteResume() {
    try {
        const res = await fetch(`${API_BASE_URL}/delete-resume`, {
            method: "DELETE",
            credentials: "include"
        });
        const json = await res.json();
        if (json.success) {
            userData = json.data;
            localStorage.setItem("userData", JSON.stringify(userData));
            renderUI();
            fetchProfileCompletion();
        } else {
            alert(json.message || "Failed to delete resume");
        }
    } catch (err) { alert(err.message); }
}

//scroll spy for quick nav
function setupScrollSpy() {
    const sections = document.querySelectorAll(".content-card");
    const navLinks = document.querySelectorAll(".quick-nav-link");

    const observer = new IntersectionObserver((entries) => {
        let currentId = "";
        entries.forEach(entry => {
            if (entry.isIntersecting) { currentId = entry.target.id; }
        });
        if (currentId) {
            navLinks.forEach(link => {
                link.classList.remove("active");
                if (link.getAttribute("href") === `#${currentId}`) { link.classList.add("active"); }
            });
        }
    }, { rootMargin: "-30% 0px -70% 0px" });

    sections.forEach(sec => observer.observe(sec));
}

//logout
const logoutBtn = document.getElementById("logoutBtn");
logoutBtn.addEventListener("click", async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/logout`, {
            method: "POST",
            credentials: "include"
        });
        const json = await res.json();
        if (json.success) {
            localStorage.removeItem("userData");
            // window.location.href = "../authentication/login/login.html";
            window.location.href = "/candidate/authentication/login";
        } else {
            alert(json.message || "Failed to logout");
        }
    } catch (err) {
        alert(err.message);
    }
});
