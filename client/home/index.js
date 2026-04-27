import { API_BASE_URL } from "../constants/constant.js";

//icons
const icons = {
    location: '<svg class="icon" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
    salary: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-currency-rupee" viewBox="0 0 16 16"><path d="M4 3.06h2.726c1.22 0 2.12.575 2.325 1.724H4v1.051h5.051C8.855 7.001 8 7.558 6.788 7.558H4v1.317L8.437 14h2.11L6.095 8.884h.855c2.316-.018 3.465-1.476 3.688-3.049H12V4.784h-1.345c-.08-.778-.357-1.335-.793-1.732H12V2H4z"/></svg>`,
    briefcase: '<svg class="icon" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>',
    clock: '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
    send: '<svg class="icon" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>',
    check: '<svg class="icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    users: '<svg class="icon" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
    fileText: '<svg class="icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>'
};

let currentUser = null;
let profileCompletion = 0;

const isLocal = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";

(async () => {
    try {
        // auth check + current user
        const userRes = await fetch(`${API_BASE_URL}/users/current`, {
            method: "GET",
            credentials: "include"
        });

        if (!userRes.ok) {
            // window.location.href = "candidate/authentication/login/login.html";
            window.location.href = isLocal ? "candidate/authentication/login/login.html" : "/candidate/authentication/login/login";
            return;
        }

        const userData = await userRes.json();
        currentUser = userData.data;

        // profile completion percentage
        const completionRes = await fetch(`${API_BASE_URL}/users/profile-completion`, {
            method: "GET",
            credentials: "include"
        });

        if (completionRes.ok) {
            const completionData = await completionRes.json();
            profileCompletion = completionData.data.profileCompletePercentage || 0;
        }

        // now that we have real data, sync the profile card and drawer
        syncProfileDrawer();

    } catch (err) {
        console.error("Init error:", err);
        // window.location.href = "candidate/authentication/login/login.html";
        window.location.href = isLocal ? "candidate/authentication/login/login.html" : "/candidate/authentication/login/login";
    }
})();


//core logics
function toggleJobAccordion(jobId) {
    const card = document.getElementById(`job-card-${jobId}`);
    card.classList.toggle('expanded');
}

async function handleApply(buttonElement, jobId, event) {
    event.stopPropagation();

    if (buttonElement.disabled) return;
    buttonElement.disabled = true;
    buttonElement.innerHTML = `Applying...`;

    try {
        const response = await fetch(`${API_BASE_URL}/applyed-jobs/apply/${jobId}`, {
            method: "GET",
            credentials: "include"
        });

        const data = await response.json();

        if (response.ok) {
            buttonElement.innerHTML = `${icons.check} Applied Successfully`;
            buttonElement.classList.add('applied');
        } else {
            if (response.status === 400 && data?.message?.toLowerCase().includes("already applied")) {
                buttonElement.innerHTML = `${icons.check} Already Applied`;
                buttonElement.classList.add('applied');
            } else {
                buttonElement.innerHTML = `Apply Now ${icons.send}`;
                buttonElement.disabled = false;
                alert(data?.message || "Failed to apply. Please try again.");
            }
        }
    } catch (error) {
        console.error("Apply request failed:", error);
        buttonElement.innerHTML = `Apply Now ${icons.send}`;
        buttonElement.disabled = false;
        alert("Network error. Please check your connection and try again.");
    }
}

function getPostedDays(createdAt) {
    if (!createdAt) return 0;
    const posted = new Date(createdAt);
    const now = new Date();
    return Math.floor((now - posted) / (1000 * 60 * 60 * 24));
}

function formatPostedAt(createdAt) {
    const days = getPostedDays(createdAt);
    if (days === 0) return "Today";
    if (days === 1) return "1d ago";
    return `${days}d ago`;
}

function getPostedBadgeClass(createdAt) {
    const days = getPostedDays(createdAt);
    if (days >= 0 && days <= 10) return "posted-at--green";
    if (days >= 11 && days <= 20) return "posted-at--yellow";
    return "posted-at--red";
}

function normalizeJob(job) {
    return {
        _id: job._id,
        title: job.title,
        company: job.company?.name || job.company || "Unknown Company",
        logo: job.company?.logo || "",
        location: Array.isArray(job.location) ? job.location : [job.location || "N/A"],
        salaryRange: job.salaryRange || "Not disclosed",
        jobType: job.jobType || "N/A",
        workMode: job.workMode || "N/A",
        experience: job.experiences
            ? `${job.experiences.min}-${job.experiences.max} Years`
            : (job.experience || "N/A"),
        vacancies: job.vacancies || 0,
        createdAt: job.createdAt,
        ageRange: job.ageLimit
            ? `18-${job.ageLimit} years`
            : (job.ageRange || "N/A"),
        qualifications: Array.isArray(job.qualifications)
            ? job.qualifications.map(q => q.degree || q).join(", ")
            : (job.qualifications || "N/A"),
        description: job.description || "",
        requiredSkills: job.requiredSkills || []
    };
}

function renderJobCard(job) {
    const jobCard = document.createElement('div');
    jobCard.className = 'job-card';
    jobCard.id = `job-card-${job._id}`;

    const skillsHtml = job.requiredSkills.map(skill => `<span class="skill-chip">${skill}</span>`).join('');
    const postedBadgeClass = getPostedBadgeClass(job.createdAt);
    const postedLabel = formatPostedAt(job.createdAt);

    jobCard.innerHTML = `
        <div class="job-summary" onclick="toggleJobAccordion('${job._id}')">
            <div class="posted-at ${postedBadgeClass}">
                ${icons.clock}
                <span>Posted: ${postedLabel}</span>
            </div>
            <div class="job-header-top">
                <img src="${job?.logo?.url}" alt="${job.company} logo" class="company-logo">
                <div class="job-title-group">
                    <h3 class="job-title">${job.title}</h3>
                    <div class="company-name">${job.company}</div>
                </div>
            </div>

            <div class="job-quick-info">
                <div class="info-tag" title="Experience">
                    ${icons.briefcase} ${job.experience}
                </div>
                <div class="info-tag" title="Job Type">
                    ${icons.fileText} ${job.jobType}
                </div>
                <div class="info-tag" title="Salary">
                    ${icons.salary} ${job.salaryRange}
                </div>
                <div class="info-tag" title="Location">
                    ${icons.location} ${job.location[0]} (${job.workMode})
                </div>
                <div class="info-tag" title="Vacancies">
                    ${icons.users} ${job.vacancies} Vacancies
                </div>
            </div>

            <div class="expand-hint">
                View Full Details 
                <svg class="icon expand-icon" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
        </div>

        <div class="job-details">
            <div class="detail-section">
                <h4>Job Description</h4>
                <p>${job.description}</p>
            </div>

            <div class="detail-section">
                <h4>Qualifications</h4>
                <p>${job.qualifications}</p>
            </div>

            <div class="detail-section">
                <h4>Age Range</h4>
                <p>(${job.ageRange})</p>
            </div>

            <div class="detail-section">
                <h4>Skills Required</h4>
                <div class="skills-container">
                    ${skillsHtml}
                </div>
            </div>

            <div class="action-area">
                <button class="btn-apply" onclick="handleApply(this, '${job._id}', event)">
                    Apply Now ${icons.send}
                </button>
            </div>
        </div>
    `;

    return jobCard;
}

async function renderJobFeed() {
    const container = document.getElementById('job-feed-container');
    container.innerHTML = '<p style="text-align:center; padding: 2rem; color: var(--text-secondary);">Loading jobs...</p>';

    try {
        const response = await fetch(`${API_BASE_URL}/jobs/all`, {
            method: "GET",
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data?.message || "Failed to fetch jobs");
        }

        const jobs = data?.data?.jobs || data?.data || [];

        container.innerHTML = '';

        if (!jobs.length) {
            container.innerHTML = '<div class="empty-state">No jobs available at the moment. Check back soon!</div>';
            return;
        }

        jobs.forEach(rawJob => {
            const job = normalizeJob(rawJob);
            container.appendChild(renderJobCard(job));
        });

    } catch (error) {
        console.error("Failed to load jobs:", error);
        container.innerHTML = `<p style="text-align:center; padding: 2rem; color: #ef4444;">Failed to load jobs. Please refresh the page or try again later.</p>`;
    }
}

//profile drawer
function getProgressColor(percentage) {
    if (percentage > 75) return "#2abf68";
    if (percentage > 50) return "#eab308";
    if (percentage > 25) return "#f97316";
    return "#ef4444";
}

function syncProfileDrawer() {
    if (!currentUser) return;

    const completion = profileCompletion;
    const color = getProgressColor(completion);

    const topQualification = currentUser.qualifications?.[0];
    const subtitle = topQualification
        ? `${topQualification.degree}${topQualification.department ? ` - ${topQualification.department}` : ""} at ${topQualification.institution}`
        : (currentUser.email || "Update Profile to stand out");

    const imageUrl = currentUser.profilePicture?.url || "";

    //left side profile card
    const profileName = document.querySelector(".profile-card .profile-name");
    const profileTitle = document.querySelector(".profile-card .profile-title");
    const profilePic = document.querySelector(".profile-card .profile-pic");
    const profileBadge = document.querySelector(".profile-card .profile-progress-badge");
    const profilePicContainer = document.querySelector(".profile-pic-container");

    if (profileName) profileName.textContent = currentUser.name || "User";
    if (profileTitle) profileTitle.textContent = subtitle;
    if (profilePic && imageUrl) profilePic.src = imageUrl;
    if (profileBadge) {
        profileBadge.textContent = `${completion}%`;
        profileBadge.style.color = color;
    }
    if (profilePicContainer) {
        profilePicContainer.style.setProperty("--profile-progress", `${completion}%`);
        profilePicContainer.style.setProperty("--profile-ring-color", color);
    }

    //header avatar
    const headerAvatar = document.getElementById("headerProfileAvatar");
    if (headerAvatar && imageUrl) {
        headerAvatar.style.backgroundImage = `url("${imageUrl}")`;
        headerAvatar.classList.add("has-photo");
    }

    //drawer
    const drawerName = document.getElementById("drawerProfileName");
    const drawerSubtitle = document.getElementById("drawerProfileSubtitle");
    const drawerPercentage = document.getElementById("drawerPercentage");
    const drawerRing = document.getElementById("drawerRing");
    const drawerAvatarInner = document.querySelector(".profile-avatar-inner");
    const performanceValues = document.querySelectorAll(".performance-value");

    if (drawerName) drawerName.textContent = currentUser.name || "User";
    if (drawerSubtitle) drawerSubtitle.textContent = subtitle;
    if (drawerPercentage) {
        drawerPercentage.textContent = `${completion}%`;
        drawerPercentage.style.color = color;
    }
    if (drawerRing) {
        drawerRing.style.background = `conic-gradient(from 180deg, ${color} 0 ${completion}%, #e4e8f2 ${completion}% 100%)`;
    }
    if (drawerAvatarInner && imageUrl) {
        drawerAvatarInner.style.backgroundImage = `url("${imageUrl}")`;
        drawerAvatarInner.style.backgroundPosition = "center";
        drawerAvatarInner.style.backgroundSize = "cover";
        drawerAvatarInner.querySelectorAll("span").forEach(part => {
            part.style.display = "none";
        });
    }
    if (performanceValues[0]) performanceValues[0].textContent = currentUser.searchAppearances || 0;
    if (performanceValues[1]) performanceValues[1].textContent = currentUser.recruiterActions || 0;
}

//drawer open/close logic
function hasOpenDrawer() {
    return Boolean(document.querySelector(".profile-overlay.open, .notifications-overlay.open"));
}

function openDrawer(id) {
    const drawer = document.getElementById(id);
    if (!drawer) return;

    if (id === "profileDrawerOverlay") {
        closeDrawer("notificationsOverlay");
    } else if (id === "notificationsOverlay") {
        closeDrawer("profileDrawerOverlay");
    }

    drawer.hidden = false;
    document.body.classList.add("modal-open");
    requestAnimationFrame(() => drawer.classList.add("open"));
}

function closeDrawer(id) {
    const drawer = document.getElementById(id);
    if (!drawer || drawer.hidden) return;

    drawer.classList.remove("open");
    setTimeout(() => {
        drawer.hidden = true;
        if (!hasOpenDrawer()) {
            document.body.classList.remove("modal-open");
        }
    }, 250);
}

function closeAllDrawers() {
    closeDrawer("profileDrawerOverlay");
    closeDrawer("notificationsOverlay");
}

async function handleLogout() {
    try {
        await fetch(`${API_BASE_URL}/users/logout`, {
            method: "POST",
            credentials: "include"
        });
    } catch (error) {
        console.warn("Logout request failed.", error);
    } finally {
        // window.location.href = "candidate/authentication/login/login.html";
        window.location.href = isLocal ? "candidate/authentication/login/login.html" : "/candidate/authentication/login/login";
    }
}

function bindDrawerEvents() {
    document.querySelector(".icon-button")?.addEventListener("click", () => openDrawer("notificationsOverlay"));
    document.querySelector(".profile-menu")?.addEventListener("click", () => openDrawer("profileDrawerOverlay"));
    document.querySelector(".drawer-close")?.addEventListener("click", () => closeDrawer("profileDrawerOverlay"));
    document.querySelector(".notifications-close")?.addEventListener("click", () => closeDrawer("notificationsOverlay"));
    document.querySelector(".notifications-cta")?.addEventListener("click", () => {
        closeDrawer("notificationsOverlay");
        document.getElementById("job-feed-container")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    document.querySelector(".profile-link")?.addEventListener("click", (event) => {
        event.preventDefault();
        // window.location.href = "candidate/profile/profile.html";
        window.location.href = isLocal ? "candidate/profile/profile.html" : "/candidate/profile/profile";
    });
    document.getElementById("logoutBtn")?.addEventListener("click", handleLogout);

    document.querySelectorAll(".profile-overlay, .notifications-overlay").forEach(overlay => {
        overlay.addEventListener("click", event => {
            if (event.target === overlay) {
                closeDrawer(overlay.id);
            }
        });
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeAllDrawers();
        }
    });
}

function initializeHomePage() {
    renderJobFeed();
    bindDrawerEvents();
}

// Expose functions used in inline onclick attributes to the global scope.
window.toggleJobAccordion = toggleJobAccordion;
window.handleApply = handleApply;

document.addEventListener("DOMContentLoaded", initializeHomePage);
