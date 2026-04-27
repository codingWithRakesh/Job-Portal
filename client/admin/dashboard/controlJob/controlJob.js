import { API_BASE_URL } from "../../../constants/constant.js";

const COMPANY_STORAGE_KEY = "naukriCampusCompanyProfile";

const icons = {
    location: '<svg class="icon" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
    salary: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-currency-rupee" viewBox="0 0 16 16">
            <path d="M4 3.06h2.726c1.22 0 2.12.575 2.325 1.724H4v1.051h5.051C8.855 7.001 8 7.558 6.788 7.558H4v1.317L8.437 14h2.11L6.095 8.884h.855c2.316-.018 3.465-1.476 3.688-3.049H12V4.784h-1.345c-.08-.778-.357-1.335-.793-1.732H12V2H4z"/>
            </svg>`,
    briefcase: '<svg class="icon" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>',
    graduation: '<svg class="icon" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>',
    clock: '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
    users: '<svg class="icon" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
    check: '<svg class="icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    x: '<svg class="icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    trash: '<svg class="icon" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>'
};

let jobsState = [];
let companyData = loadCompanyData();
let lastProfileMenuFocusedElement = null;

document.addEventListener("DOMContentLoaded", initDashboard);

async function initDashboard() {
    initializeNavbarDrawer();
    bindDrawerEvents();
    await fetchAndSyncCompanyData();
    renderCompanyDrawer();
    await loadJobs();
}

async function apiFetch(url, options = {}) {
    const res = await fetch(url, {
        credentials: "include",
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
        ...options
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.message || `HTTP ${res.status}`);
    }

    return data;
}

async function fetchCompanyJobs() {
    const response = await apiFetch(`${API_BASE_URL}/jobs/company`);
    return response.data;
}

async function fetchApplicantsForJob(jobId) {
    const response = await apiFetch(`${API_BASE_URL}/applyed-jobs/applicants/${jobId}`);
    return response.data.applicants;
}

async function apiDeleteJob(jobId) {
    await apiFetch(`${API_BASE_URL}/jobs/delete/${jobId}`, { method: "DELETE" });
}

async function apiUpdateStatus(applicationId, status) {
    const response = await apiFetch(`${API_BASE_URL}/applyed-jobs/update-status/${applicationId}`, {
        method: "PUT",
        body: JSON.stringify({ status })
    });
    return response.data;
}

async function fetchAndSyncCompanyData() {
    try {
        const result = await apiFetch(`${API_BASE_URL}/companies/current`, {
            method: "GET",
            headers: {}
        });
        const s = result.data || {};

        companyData = {
            ...createDefaultCompanyData(),
            ...companyData,
            name: s.name || "",
            email: s.email || "",
            industry: s.industry || "",
            location: s.location || "",
            website: s.website || "",
            size: s.size || "",
            description: s.description || "",
            createdAt: s.createdAt || "",
            city: s.city || "",
            state: s.state || "",
            headquartersCity: s.headquartersCity || "",
            headquartersState: s.headquartersState || "",
            logoDataUrl: s.logo?.url || ""
        };

        persistCompanyData();
    } catch (err) {
        console.error("Failed to load company profile:", err);
        window.location.href = "../../authentication/login/login.html";
    }
}

function initializeNavbarDrawer() {
    const profileMenuButton = document.getElementById("profileMenuButton");
    if (!profileMenuButton) return;

    profileMenuButton.setAttribute("aria-haspopup", "dialog");
    profileMenuButton.setAttribute("aria-expanded", "false");
    profileMenuButton.setAttribute("aria-controls", "companyDrawerOverlay");

    if (!profileMenuButton.querySelector(".menu-lines")) {
        const menuLines = document.createElement("span");
        menuLines.className = "menu-lines";
        menuLines.setAttribute("aria-hidden", "true");
        menuLines.innerHTML = "<span></span>";
        profileMenuButton.prepend(menuLines);
    }

    let avatar = profileMenuButton.querySelector("img");
    if (!avatar) {
        avatar = document.createElement("img");
        profileMenuButton.append(avatar);
    }
    avatar.id = "headerProfileAvatar";

    document.getElementById("profilePopup")?.remove();

    if (!document.getElementById("companyDrawerOverlay")) {
        document.body.insertAdjacentHTML("beforeend", `
            <div class="company-overlay" id="companyDrawerOverlay" hidden>
                <aside class="company-sidebar" role="dialog" aria-modal="true" aria-labelledby="drawerCompanyName">
                    <button class="company-sidebar-close" id="companyDrawerClose" type="button" aria-label="Close company panel">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M6 6 18 18"></path>
                            <path d="M18 6 6 18"></path>
                        </svg>
                    </button>

                    <div class="company-sidebar-shell">
                        <header class="company-sidebar-header">
                            <div class="company-sidebar-logo" id="drawerCompanyLogo">NC</div>
                            <div class="company-sidebar-copy">
                                <h2 class="company-sidebar-name" id="drawerCompanyName">Company Name</h2>
                                <p class="company-sidebar-location" id="drawerCompanyLocation">Location not added</p>
                            </div>
                        </header>

                        <nav class="company-sidebar-menu" aria-label="Company account actions">
                            <button class="company-menu-item company-menu-item--primary" id="drawerViewProfile" type="button">
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                    <path d="M6.5 17A2.5 2.5 0 0 0 4 14.5V5a2 2 0 0 1 2-2h14v14"></path>
                                    <path d="M8 7h8"></path>
                                    <path d="M8 11h6"></path>
                                </svg>
                                <span>View &amp; Update Profile</span>
                            </button>
                            <button class="company-menu-item" id="drawerSearchAppearance" type="button">
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <circle cx="11" cy="11" r="6"></circle>
                                    <path d="m20 20-4.2-4.2"></path>
                                </svg>
                                <span>Search Appearance</span>
                            </button>
                            <button class="company-menu-item" id="drawerSettings" type="button">
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <circle cx="12" cy="12" r="3"></circle>
                                    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.4 1z"></path>
                                </svg>
                                <span>Settings</span>
                            </button>
                            <button class="company-menu-item" id="drawerFaq" type="button">
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M9.1 9a3 3 0 1 1 5.8 1c-.4 1.2-1.5 1.8-2.2 2.3-.7.4-1.1.9-1.1 1.7"></path>
                                    <circle cx="12" cy="17.2" r=".8" fill="currentColor" stroke="none"></circle>
                                    <circle cx="12" cy="12" r="9"></circle>
                                </svg>
                                <span>FAQ</span>
                            </button>
                        </nav>

                        <div class="company-sidebar-footer">
                            <button id="logoutBtn" class="company-menu-item company-menu-item--logout" type="button">
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M10 17 15 12 10 7"></path>
                                    <path d="M15 12H4"></path>
                                    <path d="M12 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5"></path>
                                </svg>
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </aside>
            </div>
        `);
    }
}

function bindDrawerEvents() {
    const profileMenuButton = document.getElementById("profileMenuButton");
    const companyDrawerOverlay = document.getElementById("companyDrawerOverlay");

    profileMenuButton?.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleCompanyDrawer();
    });

    companyDrawerOverlay?.addEventListener("click", (event) => {
        if (event.target === companyDrawerOverlay) {
            closeCompanyDrawer();
        }
    });

    document.getElementById("companyDrawerClose")?.addEventListener("click", () => closeCompanyDrawer());
    document.getElementById("drawerViewProfile")?.addEventListener("click", () => {
        window.location.href = "../../profile/profile.html";
    });
    document.getElementById("drawerSearchAppearance")?.addEventListener("click", () => {
        closeCompanyDrawer();
        window.location.href = "../../profile/profile.html#company-overview";
    });
    document.getElementById("drawerSettings")?.addEventListener("click", () => {
        closeCompanyDrawer();
        window.location.href = "../../profile/profile.html#account-information";
    });
    document.getElementById("drawerFaq")?.addEventListener("click", () => {
        closeCompanyDrawer();
        window.location.href = "../../profile/profile.html";
    });
    document.getElementById("logoutBtn")?.addEventListener("click", logoutCompany);

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && isCompanyDrawerOpen()) {
            event.preventDefault();
            closeCompanyDrawer();
        }
    });
}

function createDefaultCompanyData() {
    return {
        name: "",
        email: "",
        industry: "",
        location: "",
        website: "",
        size: "",
        description: "",
        createdAt: "",
        city: "",
        state: "",
        headquartersCity: "",
        headquartersState: "",
        logoDataUrl: ""
    };
}

function loadCompanyData() {
    try {
        const storedData = JSON.parse(localStorage.getItem(COMPANY_STORAGE_KEY) || "{}");
        return { ...createDefaultCompanyData(), ...storedData };
    } catch (error) {
        console.error("Unable to read saved company profile", error);
        return createDefaultCompanyData();
    }
}

function persistCompanyData() {
    localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(companyData));
}

function renderCompanyDrawer() {
    const initials = getInitials(companyData.name);
    const avatar = document.getElementById("headerProfileAvatar");

    applyMediaState(document.getElementById("drawerCompanyLogo"), companyData.logoDataUrl, initials);
    setText("drawerCompanyName", companyData.name || "Company Name");
    setText("drawerCompanyLocation", getCompanyLocationLabel());
    setProfileAvatar(avatar, companyData.logoDataUrl, initials);
}

function isCompanyDrawerOpen() {
    const companyDrawerOverlay = document.getElementById("companyDrawerOverlay");
    return Boolean(companyDrawerOverlay && !companyDrawerOverlay.hidden);
}

function openCompanyDrawer() {
    const companyDrawerOverlay = document.getElementById("companyDrawerOverlay");
    const profileMenuButton = document.getElementById("profileMenuButton");
    const closeButton = document.getElementById("companyDrawerClose");

    if (!companyDrawerOverlay || !profileMenuButton) return;

    lastProfileMenuFocusedElement = profileMenuButton;
    companyDrawerOverlay.hidden = false;
    document.body.classList.add("modal-open");
    profileMenuButton.setAttribute("aria-expanded", "true");

    window.requestAnimationFrame(() => {
        companyDrawerOverlay.classList.add("open");
        closeButton?.focus();
    });
}

function closeCompanyDrawer(options = {}) {
    const { restoreFocus = true } = options;
    const companyDrawerOverlay = document.getElementById("companyDrawerOverlay");
    const profileMenuButton = document.getElementById("profileMenuButton");

    if (!companyDrawerOverlay || !profileMenuButton || companyDrawerOverlay.hidden) return;

    companyDrawerOverlay.classList.remove("open");
    profileMenuButton.setAttribute("aria-expanded", "false");

    setTimeout(() => {
        companyDrawerOverlay.hidden = true;
        document.body.classList.remove("modal-open");

        if (
            restoreFocus &&
            lastProfileMenuFocusedElement &&
            typeof lastProfileMenuFocusedElement.focus === "function"
        ) {
            lastProfileMenuFocusedElement.focus();
        }
    }, 200);
}

function toggleCompanyDrawer() {
    if (isCompanyDrawerOpen()) {
        closeCompanyDrawer();
        return;
    }

    openCompanyDrawer();
}

async function logoutCompany() {
    try {
        const response = await fetch(`${API_BASE_URL}/companies/logout`, {
            method: "POST",
            credentials: "include"
        });

        if (response.ok) {
            closeCompanyDrawer({ restoreFocus: false });
            localStorage.removeItem(COMPANY_STORAGE_KEY);
            window.location.href = "../../authentication/login/login.html";
        }
    } catch (error) {
        console.error("Logout failed:", error.message);
    }
}

async function loadJobs() {
    try {
        const jobs = await fetchCompanyJobs();
        jobsState = jobs.map((job) => {
            const existing = jobsState.find((entry) => entry._id === job._id);
            return { ...job, applicants: existing ? existing.applicants : null };
        });
        updateStatistics();
        renderJobList();
    } catch (err) {
        console.error("Failed to load jobs:", err);
        document.getElementById("job-list-container").innerHTML =
            `<div class="empty-state">Failed to load jobs. ${err.message}</div>`;
    }
}

function updateStatistics() {
    const totalJobs = jobsState.length;
    const totalApps = jobsState.reduce((sum, job) => sum + (job.totalApplications || 0), 0);

    let shortlisted = 0;
    jobsState.forEach((job) => {
        if (job.applicants) {
            shortlisted += job.applicants.filter((applicant) => applicant.status === "Shortlisted").length;
        }
    });

    document.getElementById("stat-total-jobs").innerText = totalJobs;
    document.getElementById("stat-total-apps").innerText = totalApps;
    document.getElementById("stat-shortlisted").innerText = shortlisted;
}

async function toggleJobAccordion(jobId) {
    const card = document.getElementById(`job-card-${jobId}`);
    const isExpanded = card.classList.contains("expanded");

    if (isExpanded) {
        card.classList.remove("expanded");
        return;
    }

    const jobEntry = jobsState.find((job) => job._id === jobId);
    if (jobEntry && jobEntry.applicants === null) {
        try {
            const applicants = await fetchApplicantsForJob(jobId);
            jobEntry.applicants = applicants;
            updateStatistics();
            renderApplicantsForCard(jobId);
        } catch (err) {
            console.error(`Failed to fetch applicants for job ${jobId}:`, err);
            const list = card.querySelector(".applicant-list");
            if (list) {
                list.innerHTML = `<div class="empty-state">Failed to load applicants. ${err.message}</div>`;
            }
        }
    }

    card.classList.add("expanded");
}

async function updateApplicationStatus(appId, newStatus, event) {
    if (event) event.stopPropagation();

    try {
        await apiUpdateStatus(appId, newStatus);

        jobsState.forEach((job) => {
            if (!job.applicants) return;
            const app = job.applicants.find((entry) => entry.applicationId?.toString() === appId || entry._id?.toString() === appId);
            if (app) app.status = newStatus;
        });

        updateStatistics();

        const ownerJob = jobsState.find((job) =>
            job.applicants?.some((entry) => (entry.applicationId || entry._id)?.toString() === appId)
        );

        renderJobList();

        if (ownerJob) {
            const card = document.getElementById(`job-card-${ownerJob._id}`);
            if (card) card.classList.add("expanded");
        }
    } catch (err) {
        console.error("Failed to update status:", err);
        alert(`Could not update status: ${err.message}`);
    }
}

async function deletePostJob(jobId, event) {
    if (event) event.stopPropagation();

    try {
        await apiDeleteJob(jobId);
        jobsState = jobsState.filter((job) => job._id !== jobId);
        updateStatistics();
        renderJobList();
    } catch (err) {
        console.error("Failed to delete job:", err);
        alert(`Could not delete job: ${err.message}`);
    }
}

function formatDate(date) {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function renderApplicantsForCard(jobId) {
    const card = document.getElementById(`job-card-${jobId}`);
    if (!card) return;

    const list = card.querySelector(".applicant-list");
    if (!list) return;

    const jobEntry = jobsState.find((job) => job._id === jobId);
    if (!jobEntry || !jobEntry.applicants) return;

    renderApplicantList(list, jobEntry.applicants);
}

function renderApplicantList(listEl, applicants) {
    listEl.innerHTML = "";

    if (applicants.length === 0) {
        listEl.innerHTML = `<div class="empty-state">No applications received yet. Keep sharing your job post!</div>`;
        return;
    }

    applicants.forEach((app) => {
        const user = app.applicant || {};
        const appId = app.applicationId || app._id;
        const isPending = app.status === "Pending";
        const matchPercentage = app.matchScore !== undefined ? app.matchScore : "--";

        let badgeHtml = "";
        if (app.status === "Shortlisted") {
            badgeHtml = `<span class="status-badge status-shortlisted">${icons.check} Shortlisted</span>`;
        } else if (app.status === "Rejected") {
            badgeHtml = `<span class="status-badge status-rejected">${icons.x} Rejected</span>`;
        }

        const profilePic = user.profilePicture?.url || `https://i.pravatar.cc/150?u=${appId}`;

        const appItem = document.createElement("div");
        appItem.className = "applicant-item";
        appItem.innerHTML = `
            <div class="applicant-profile">
                <img src="${profilePic}" alt="${user.name || "Applicant"}" class="applicant-img">
                <div class="applicant-details">
                    <h4>${user.name || "Unknown"}</h4>
                    <p>${user.email || ""}</p>
                </div>
            </div>
            <div class="applicant-actions">
                <p>Matched</p>
                <div class="match-ring" style="--match: ${matchPercentage};" aria-label="${matchPercentage}% profile match">
                    <span>${matchPercentage}%</span>
                </div>
                ${!isPending ? badgeHtml : `
                    <button class="btn btn-select" onclick="updateApplicationStatus('${appId}', 'Shortlisted', event)">Select</button>
                    <button class="btn btn-reject" onclick="updateApplicationStatus('${appId}', 'Rejected', event)">Reject</button>
                `}
            </div>
        `;
        listEl.appendChild(appItem);
    });
}

function renderJobList() {
    const container = document.getElementById("job-list-container");
    container.innerHTML = "";

    if (jobsState.length === 0) {
        container.innerHTML = `<div class="empty-state">No posted jobs yet. Post a new role to start receiving applications.</div>`;
        return;
    }

    jobsState.forEach((job) => {
        const skillsHtml = (job.requiredSkills || []).map((skill) => `<span class="skill-tag">${skill}</span>`).join("");
        const deadlineText = job.applicationDeadline ? formatDate(job.applicationDeadline) : "N/A";
        const totalApps = job.totalApplications ?? (job.applicants?.length ?? 0);

        const jobCard = document.createElement("div");
        jobCard.className = "job-card";
        jobCard.id = `job-card-${job._id}`;

        const jobSummary = document.createElement("div");
        jobSummary.className = "job-summary";
        jobSummary.onclick = () => toggleJobAccordion(job._id);

        jobSummary.innerHTML = `
            <div class="job-header-top">
                <div class="job-title-group">
                    <h3>${job.title}</h3>
                </div>
                <div class="job-header-actions">
                    <div class="deadline-badge">
                        ${icons.clock} Ends: ${deadlineText}
                    </div>
                    <button class="delete-job-btn" type="button" aria-label="Delete ${job.title}" onclick="deletePostJob('${job._id}', event)">
                        ${icons.trash}
                    </button>
                </div>
            </div>

            <div class="job-data-grid">
                <div class="data-item" title="Location & Mode">
                    ${icons.location}
                    <span>${(job.location || [])[0] || "N/A"} (${job.workMode || "N/A"})</span>
                </div>
                <div class="data-item" title="Salary Range">
                    ${icons.salary}
                    <span>${job.salaryRange || "Not specified"}</span>
                </div>
                <div class="data-item" title="Experience & Type">
                    ${icons.briefcase}
                    <span>${job.experiences?.years ?? job.experiences?.min ?? 0}+ Years | ${job.jobType || "N/A"}</span>
                </div>
                <div class="data-item" title="Qualification">
                    ${icons.graduation}
                    <span>${job.qualifications?.[0]?.degree || "Any Degree"}</span>
                </div>
            </div>

            <div class="job-skills">
                ${skillsHtml}
            </div>

            <div class="job-expand-footer">
                <div class="applicant-count">
                    ${icons.users}
                    Applicants <span>${totalApps} / ${job.vacancies ?? "?"} needed</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    View Details
                    <svg class="icon expand-icon" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
            </div>
        `;

        const applicantsContainer = document.createElement("div");
        applicantsContainer.className = "applicants-container";

        const applicantList = document.createElement("div");
        applicantList.className = "applicant-list";

        if (job.applicants === null) {
            applicantList.innerHTML = `<div class="empty-state">Click to load applicants...</div>`;
        } else {
            renderApplicantList(applicantList, job.applicants);
        }

        applicantsContainer.appendChild(applicantList);
        jobCard.appendChild(jobSummary);
        jobCard.appendChild(applicantsContainer);
        container.appendChild(jobCard);
    });
}

function applyMediaState(element, imageUrl, fallbackText) {
    if (!element) return;

    element.classList.remove("has-photo");
    element.style.backgroundImage = "";
    element.textContent = fallbackText;

    if (imageUrl) {
        element.classList.add("has-photo");
        element.style.backgroundImage = `url("${imageUrl}")`;
    }
}

function setProfileAvatar(element, imageUrl, fallbackText) {
    if (!element) return;

    element.src = imageUrl || createInitialsAvatarDataUrl(fallbackText);
    element.alt = companyData.name ? `${companyData.name} logo` : "Company Logo";
}

function createInitialsAvatarDataUrl(text) {
    const initials = escapeHtml((text || "TC").slice(0, 2));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" rx="40" fill="#eef3ff"/><text x="50%" y="53%" dominant-baseline="middle" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="700" fill="#2e5bff">${initials}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function setText(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) element.textContent = value || "-";
}

function getInitials(name = "") {
    const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
    if (!parts.length) return "NC";
    return parts.map((part) => part[0]).join("").toUpperCase();
}

function getCompanyLocationLabel() {
    const locationFields = [
        companyData.city,
        companyData.state,
        companyData.headquartersCity,
        companyData.headquartersState
    ]
        .map((value) => String(value || "").trim())
        .filter(Boolean);

    if (locationFields.length) {
        return Array.from(new Set(locationFields)).join(", ");
    }

    return String(companyData.location || "").trim() || "Location not added";
}

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

window.deletePostJob = deletePostJob;
window.updateApplicationStatus = updateApplicationStatus;
