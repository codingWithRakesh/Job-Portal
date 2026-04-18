const COMPANY_STORAGE_KEY = "naukriCampusCompanyProfile";

let companyData = loadCompanyData();
let lastProfileMenuFocusedElement = null;

document.addEventListener("DOMContentLoaded", () => {
    bindEvents();
    renderUI();
});

function bindEvents() {
    const profileMenuButton = document.getElementById("profileMenuButton");
    const profilePopup = document.getElementById("profilePopup");

    document.getElementById("companyLogoTrigger")?.addEventListener("click", () => {
        document.getElementById("companyLogoInput").click();
    });
    document.getElementById("companyLogoInput")?.addEventListener("change", handleLogoUpload);

    document.getElementById("editCompanySummary")?.addEventListener("click", () => openModal("detailsModal"));
    document.querySelectorAll("[data-open-modal]").forEach((button) => {
        button.addEventListener("click", () => openModal(button.dataset.openModal));
    });

    if (profileMenuButton) {
        profileMenuButton.addEventListener("click", (event) => {
            event.stopPropagation();
            toggleProfilePopup();
        });
    }

    if (profilePopup) {
        profilePopup.addEventListener("click", (event) => {
            event.stopPropagation();
        });
    }

    document.querySelectorAll(".modal-overlay").forEach((modal) => {
        modal.querySelector(".modal-close")?.addEventListener("click", () => closeModal(modal.id));
        modal.querySelector(".btn-cancel")?.addEventListener("click", () => closeModal(modal.id));
        modal.addEventListener("click", (event) => {
            if (event.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    document.querySelector("#detailsModal .modal-form")?.addEventListener("submit", submitCompanyDetails);
    document.querySelector("#overviewModal .modal-form")?.addEventListener("submit", submitOverview);
    document.getElementById("logoutBtn")?.addEventListener("click", logoutCompany);

    document.addEventListener("click", (event) => {
        if (!isProfilePopupOpen()) {
            return;
        }

        if (profileMenuButton && profileMenuButton.contains(event.target)) {
            return;
        }

        if (profilePopup && profilePopup.contains(event.target)) {
            return;
        }

        closeProfilePopup();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && isProfilePopupOpen()) {
            event.preventDefault();
            closeProfilePopup();
        }
    });
}

function createDefaultCompanyData() {
    return {
        name: "Naukri Campus Hiring Studio",
        industry: "Technology",
        location: "Noida, Uttar Pradesh",
        email: "talent@naukricampus.example",
        contactPhone: "+91 98765 43210",
        website: "",
        size: "",
        description: "",
        createdAt: "2025-01-15T00:00:00.000Z",
        logoDataUrl: ""
    };
}

function loadCompanyData() {
    const defaultData = createDefaultCompanyData();

    try {
        const storedData = JSON.parse(localStorage.getItem(COMPANY_STORAGE_KEY) || "{}");
        return normalizeCompanyData(storedData, defaultData);
    } catch (error) {
        console.error("Unable to read saved company profile", error);
        return defaultData;
    }
}

function normalizeCompanyData(storedData, defaultData) {
    return {
        ...defaultData,
        ...storedData,
        name: storedData.name || defaultData.name,
        industry: storedData.industry || defaultData.industry,
        location: storedData.location || defaultData.location,
        email: storedData.email || defaultData.email,
        contactPhone: storedData.contactPhone || defaultData.contactPhone,
        website: storedData.website || "",
        size: storedData.size || "",
        description: storedData.description || "",
        createdAt: storedData.createdAt || defaultData.createdAt,
        logoDataUrl: storedData.logoDataUrl || storedData.logo?.url || ""
    };
}

function persistCompanyData() {
    localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(companyData));
}

function renderUI() {
    const initials = getInitials(companyData.name);
    const industry = companyData.industry || "Industry not added";
    const location = companyData.location || "Location not added";
    const email = companyData.email || "Email not added";
    const size = companyData.size || "Not added yet";
    const websiteText = companyData.website || "Not added yet";
    const websiteLink = normalizeWebsite(companyData.website);
    setText("displayCompanyName", companyData.name || "Company Name");
    setText("displayIndustry", industry);
    setText("displayLocation", location);
    setText("displayEmail", email);
    setWebsiteText("displayWebsite", websiteText, websiteLink);
    setText("displaySize", size);

    setText(
        "companyOverviewText",
        companyData.description || "Add a strong company overview to help candidates understand your mission, scale, and hiring story."
    );

    setText("orgIndustry", industry);
    setText("orgSize", companyData.size || "Not added yet");
    setText("orgLocation", location);
    setWebsiteText("orgWebsite", websiteText, websiteLink);

    applyMediaState(document.getElementById("companyLogo"), companyData.logoDataUrl, initials);
    setProfileAvatar(document.getElementById("headerProfileAvatar"), companyData.logoDataUrl, initials);
    setText("profilePopupTitle", `Hello ${companyData.name || "TechCorp"}`);
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

function setText(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value || "-";
    }
}

function setWebsiteText(elementId, label, href) {
    const element = document.getElementById(elementId);
    if (!element) return;

    if (!href) {
        element.textContent = label;
        return;
    }

    element.innerHTML = `<a href="${escapeAttribute(href)}" target="_blank" rel="noopener noreferrer" class="text-link">${escapeHtml(label)}</a>`;
}

function isProfilePopupOpen() {
    const profilePopup = document.getElementById("profilePopup");
    return Boolean(profilePopup && !profilePopup.hidden);
}

function openProfilePopup() {
    const profilePopup = document.getElementById("profilePopup");
    const profileMenuButton = document.getElementById("profileMenuButton");
    const logoutButton = document.getElementById("logoutBtn");

    if (!profilePopup || !profileMenuButton) {
        return;
    }

    lastProfileMenuFocusedElement = profileMenuButton;
    profilePopup.hidden = false;
    profilePopup.classList.add("open");
    profileMenuButton.setAttribute("aria-expanded", "true");

    window.requestAnimationFrame(() => {
        logoutButton?.focus();
    });
}

function closeProfilePopup() {
    const profilePopup = document.getElementById("profilePopup");
    const profileMenuButton = document.getElementById("profileMenuButton");

    if (!profilePopup || !profileMenuButton || profilePopup.hidden) {
        return;
    }

    profilePopup.hidden = true;
    profilePopup.classList.remove("open");
    profileMenuButton.setAttribute("aria-expanded", "false");

    if (lastProfileMenuFocusedElement && typeof lastProfileMenuFocusedElement.focus === "function") {
        lastProfileMenuFocusedElement.focus();
    }
}

function toggleProfilePopup() {
    if (isProfilePopupOpen()) {
        closeProfilePopup();
        return;
    }

    openProfilePopup();
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

function openModal(id) {
    populateModal(id);
    document.body.classList.add("modal-open");

    const modal = document.getElementById(id);
    if (!modal) return;

    modal.hidden = false;
    setTimeout(() => modal.classList.add("open"), 10);
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;

    modal.classList.remove("open");
    setTimeout(() => {
        modal.hidden = true;
        syncBodyScrollState();
    }, 200);
}

function syncBodyScrollState() {
    const hasOpenLayer = document.querySelector(".modal-overlay.open");

    document.body.classList.toggle("modal-open", Boolean(hasOpenLayer));
}

function populateModal(id) {
    if (id === "detailsModal") {
        document.getElementById("inpCompanyName").value = companyData.name || "";
        document.getElementById("inpIndustry").value = companyData.industry || "";
        document.getElementById("inpLocation").value = companyData.location || "";
        document.getElementById("inpWebsite").value = companyData.website || "";
        document.getElementById("inpSize").value = companyData.size || "";
        return;
    }

    if (id === "overviewModal") {
        document.getElementById("inpOverview").value = companyData.description || "";
        return;
    }

}

function submitCompanyDetails(event) {
    event.preventDefault();

    companyData = {
        ...companyData,
        name: document.getElementById("inpCompanyName").value.trim() || companyData.name,
        industry: document.getElementById("inpIndustry").value,
        location: document.getElementById("inpLocation").value.trim(),
        website: document.getElementById("inpWebsite").value.trim(),
        size: document.getElementById("inpSize").value
    };

    saveAndRender("detailsModal");
}

function submitOverview(event) {
    event.preventDefault();

    companyData = {
        ...companyData,
        description: document.getElementById("inpOverview").value.trim()
    };

    saveAndRender("overviewModal");
}

function saveAndRender(modalId) {
    persistCompanyData();
    renderUI();
    closeModal(modalId);
}

function handleLogoUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
        companyData = {
            ...companyData,
            logoDataUrl: reader.result
        };
        persistCompanyData();
        renderUI();
    };

    reader.onerror = () => {
        alert("Failed to read the selected logo");
    };

    reader.readAsDataURL(file);
    event.target.value = "";
}

function logoutCompany() {
    closeProfilePopup();
    localStorage.removeItem(COMPANY_STORAGE_KEY);
    companyData = createDefaultCompanyData();
    renderUI();
}

function getInitials(name = "") {
    const parts = name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2);

    if (!parts.length) return "NC";
    return parts.map((part) => part[0]).join("").toUpperCase();
}

function normalizeWebsite(value) {
    if (!value) return "";
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function escapeAttribute(value = "") {
    return escapeHtml(value);
}
