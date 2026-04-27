import { API_BASE_URL } from "../../constants/constant.js";

const icons = {
    location: '<svg class="icon" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
    salary: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-currency-rupee" viewBox="0 0 16 16">
  <path d="M4 3.06h2.726c1.22 0 2.12.575 2.325 1.724H4v1.051h5.051C8.855 7.001 8 7.558 6.788 7.558H4v1.317L8.437 14h2.11L6.095 8.884h.855c2.316-.018 3.465-1.476 3.688-3.049H12V4.784h-1.345c-.08-.778-.357-1.335-.793-1.732H12V2H4z"/>
</svg>`,
    briefcase: '<svg class="icon" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>',
    clock: '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
    calendar: '<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
    info: '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
    check: '<svg class="icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    x: '<svg class="icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    pending: '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 15 15"></polyline></svg>'
};

const isLocal = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";

(async () => {
    try {
        const authRes = await fetch(`${API_BASE_URL}/users/current`, {
            method: "GET",
            credentials: "include"
        });

        if (!authRes.ok) {
            // window.location.href = "../authentication/login/login.html";
            window.location.href = isLocal ? "../authentication/login/login.html" : "/candidate/authentication/login/login";
        }
    } catch (err) {
        console.error(err);
    }
})();

let currentUser = null;
let myApplications = [];

async function fetchMyApplications() {
    const res = await fetch(`${API_BASE_URL}/applyed-jobs/my-applications`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    return data.data;
}

function normaliseApplication(app) {
    const job = Array.isArray(app.job) ? app.job[0] : app.job;
    const company = job
        ? (Array.isArray(job.company) ? job.company[0] : job.company)
        : null;

    return {
        _id: app._id,
        status: app.status,
        createdAt: new Date(app.createdAt),
        job: job || null,
        company: company || null
    };
}

async function initDashboard() {
    bindDrawerEvents();

    try {
        // fetch current user
        const userRes = await fetch(`${API_BASE_URL}/users/current`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        const userData = await userRes.json();
        if (!userRes.ok) throw new Error(userData.message || `HTTP ${userRes.status}`);

        // fetch profile completion percentage
        const completionRes = await fetch(`${API_BASE_URL}/users/profile-completion`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        const completionData = await completionRes.json();
        if (!completionRes.ok) throw new Error(completionData.message || `HTTP ${completionRes.status}`);

        // fetch applications
        const rawApps = await fetchMyApplications();
        myApplications = rawApps.map(normaliseApplication);

        // attach completion onto user object
        currentUser = { ...userData.data, profileCompletePercentage: completionData.data.profileCompletePercentage };

        renderApplicantProfile();
        updateStatistics();
        renderApplicationList();
    } catch (err) {
        console.error('Dashboard init failed:', err);
        document.getElementById('application-list-container').innerHTML =
            `<div class="empty-state">Failed to load applications. ${err.message}</div>`;
    }
}


function renderApplicantProfile() {
    const user = currentUser;

    const headerAvatar = document.getElementById('headerProfileAvatar');
    const drawerName = document.getElementById('drawerProfileName');
    const drawerSubtitle = document.getElementById('drawerProfileSubtitle');
    const drawerPercentage = document.getElementById('drawerPercentage');
    const drawerRing = document.getElementById('drawerRing');
    const drawerAvatarInner = document.querySelector('.profile-avatar-inner');
    const performanceValues = document.querySelectorAll('.performance-value');

    if (!user) return;

    const topQualification = user.qualifications?.[0];
    const completion = user.profileCompletePercentage || 0;
    const completionColor = getCompletionColor(completion);

    if (headerAvatar && user.profilePicture?.url) {
        headerAvatar.style.backgroundImage = `url("${user.profilePicture.url}")`;
        headerAvatar.classList.add('has-photo');
    }

    if (drawerAvatarInner && user.profilePicture?.url) {
        drawerAvatarInner.style.backgroundImage = `url("${user.profilePicture.url}")`;
        drawerAvatarInner.style.backgroundPosition = 'center';
        drawerAvatarInner.style.backgroundSize = 'cover';
        drawerAvatarInner.querySelectorAll('span').forEach(part => {
            part.style.display = 'none';
        });
    }

    if (drawerName) drawerName.textContent = user.name || 'User';

    if (drawerSubtitle) {
        drawerSubtitle.textContent = topQualification
            ? `${topQualification.degree} - ${topQualification.department} at ${topQualification.institution}`
            : (user.email || '');
    }

    if (drawerPercentage) {
        drawerPercentage.textContent = `${completion}%`;
        drawerPercentage.style.color = completionColor;
    }

    if (drawerRing) {
        drawerRing.style.background =
            `conic-gradient(from 220deg, ${completionColor} 0 ${completion}%, #e4e8f2 ${completion}% 100%)`;
    }

    if (performanceValues.length >= 2) {
        performanceValues[0].textContent = user.searchAppearances || 0;
        performanceValues[1].textContent = user.recruiterActions || 0;
    }
}

function getCompletionColor(percentage) {
    if (percentage > 75) return '#2abf68';
    if (percentage > 50) return '#eab308';
    if (percentage > 25) return '#f97316';
    return '#ef4444';
}


function updateStatistics() {
    const totalApplied = myApplications.length;
    const shortlisted = myApplications.filter(a => a.status === 'Shortlisted').length;
    const rejected = myApplications.filter(a => a.status === 'Rejected').length;

    document.getElementById('stat-applied').innerText = totalApplied;
    document.getElementById('stat-selected').innerText = shortlisted;
    document.getElementById('stat-rejected').innerText = rejected;
}


function toggleAccordion(appId) {
    const card = document.getElementById(`app-card-${appId}`);
    card.classList.toggle('expanded');
}

window.toggleAccordion = toggleAccordion;


function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
}


function renderApplicationList() {
    const container = document.getElementById('application-list-container');
    container.innerHTML = '';

    if (myApplications.length === 0) {
        container.innerHTML = `<div class="empty-state">You haven't applied to any jobs yet.</div>`;
        return;
    }

    const sorted = [...myApplications].sort((a, b) => b.createdAt - a.createdAt);

    sorted.forEach(application => {
        const job = application.job;
        const company = application.company;

        if (!job) return;

        let statusIcon = icons.pending;
        if (application.status === 'Shortlisted') statusIcon = icons.check;
        if (application.status === 'Rejected') statusIcon = icons.x;

        const companyLogo = company?.logo?.url || company?.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(company?.name || 'Co')}&background=random&size=48`;
        const companyName = company?.name || 'Company';

        const appCard = document.createElement('div');
        appCard.className = 'app-card';
        appCard.id = `app-card-${application._id}`;

        const appSummary = document.createElement('div');
        appSummary.className = 'app-summary';
        appSummary.onclick = () => toggleAccordion(application._id);

        appSummary.innerHTML = `
            <div class="app-header-top">
                <div class="company-info">
                    <img src="${companyLogo}" alt="${companyName} logo" class="company-logo">
                    <div class="job-title-group">
                        <h3>${job.title || 'Untitled Role'}</h3>
                        <div class="company-name">${companyName}</div>
                    </div>
                </div>
                <div class="status-badge status-${application.status}">
                    ${statusIcon} ${application.status}
                </div>
            </div>

            <div class="quick-info">
                <div class="info-item" title="Location & Work Mode">
                    ${icons.location}
                    <span>${(job.location || [])[0] || 'N/A'} (${job.workMode || 'N/A'})</span>
                </div>
                <div class="info-item" title="Salary">
                    ${icons.salary}
                    <span>${job.salaryRange || 'Not specified'}</span>
                </div>
                <div class="info-item" title="Applied On">
                    ${icons.calendar}
                    <span>Applied: ${formatDate(application.createdAt)}</span>
                </div>
                <div class="expand-hint">
                    View Details
                    <svg class="icon expand-icon" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
            </div>
        `;

        const appDetails = document.createElement('div');
        appDetails.className = 'app-details';

        const skillsHtml = (job.requiredSkills || [])
            .map(s => `<span class="skill-tag">${s}</span>`)
            .join('');

        const expYears = job.experiences?.years ?? job.experiences?.min ?? 0;

        appDetails.innerHTML = `
            <div class="details-section">
                <h4>${icons.info} Job Description</h4>
                <p>${job.description || 'No description provided.'}</p>
            </div>

            <div class="details-section">
                <h4>Required Skills</h4>
                <div class="skills-container">
                    ${skillsHtml || '<span>Not specified</span>'}
                </div>
            </div>

            <div class="meta-grid">
                <div class="meta-box">
                    <span class="meta-box-label">Experience Req.</span>
                    <span class="meta-box-value">${expYears}+ Years</span>
                </div>
                <div class="meta-box">
                    <span class="meta-box-label">Job Type</span>
                    <span class="meta-box-value">${job.jobType || 'N/A'}</span>
                </div>
                <div class="meta-box">
                    <span class="meta-box-label">Min Qualification</span>
                    <span class="meta-box-value">${job.qualifications?.[0]?.degree || 'Not specified'}</span>
                </div>
                <div class="meta-box">
                    <span class="meta-box-label">App Deadline</span>
                    <span class="meta-box-value">${job.applicationDeadline ? formatDate(job.applicationDeadline) : 'N/A'}</span>
                </div>
            </div>
        `;

        appCard.appendChild(appSummary);
        appCard.appendChild(appDetails);
        container.appendChild(appCard);
    });
}

function bindDrawerEvents() {
    const profileButton = document.querySelector('.profile-menu');
    const notificationButton = document.querySelector('.icon-button');
    const profileOverlay = document.getElementById('profileDrawerOverlay');
    const notificationsOverlay = document.getElementById('notificationsOverlay');
    const profileClose = document.querySelector('.drawer-close');
    const notificationsClose = document.querySelector('.notifications-close');
    const notificationsCta = document.querySelector('.notifications-cta');
    const profileLink = document.querySelector('.profile-link');
    const logoutButton = document.getElementById('logoutBtn');

    profileButton?.addEventListener('click', () => openDrawer(profileOverlay));
    notificationButton?.addEventListener('click', () => openDrawer(notificationsOverlay));
    profileClose?.addEventListener('click', () => closeDrawer(profileOverlay));
    notificationsClose?.addEventListener('click', () => closeDrawer(notificationsOverlay));
    notificationsCta?.addEventListener('click', () => closeDrawer(notificationsOverlay));

    profileOverlay?.addEventListener('click', event => {
        if (event.target === profileOverlay) closeDrawer(profileOverlay);
    });

    notificationsOverlay?.addEventListener('click', event => {
        if (event.target === notificationsOverlay) closeDrawer(notificationsOverlay);
    });

    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        closeDrawer(profileOverlay);
        closeDrawer(notificationsOverlay);
    });

    profileLink?.addEventListener('click', event => {
        event.preventDefault();
        // window.location.href = '../profile/profile.html';
        window.location.href = isLocal ? '../profile/profile.html' : '/candidate/profile/profile';
    });

    // logout
    logoutButton?.addEventListener('click', async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/users/logout`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!res.ok) {
                const data = await res.json();
                console.warn('Logout API error:', data.message);
            }
        } catch (err) {
            console.warn('Logout request failed (proceeding anyway):', err.message);
        } finally {
            localStorage.removeItem('userData');
            // window.location.href = '../authentication/login/login.html';
            window.location.href = isLocal ? '../authentication/login/login.html' : '/candidate/authentication/login/login';
        }
    });
}

function openDrawer(drawer) {
    if (!drawer) return;
    document.body.classList.add('modal-open');
    drawer.hidden = false;
    requestAnimationFrame(() => drawer.classList.add('open'));
}

function closeDrawer(drawer) {
    if (!drawer || drawer.hidden) return;
    drawer.classList.remove('open');
    setTimeout(() => {
        drawer.hidden = true;
        const hasOpen = document.querySelector('.profile-overlay.open, .notifications-overlay.open');
        if (!hasOpen) document.body.classList.remove('modal-open');
    }, 250);
}

document.addEventListener('DOMContentLoaded', initDashboard);