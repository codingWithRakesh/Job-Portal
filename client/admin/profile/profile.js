import { API_BASE_URL } from "../../constants/constant.js";

const COMPANY_STORAGE_KEY = "naukriCampusCompanyProfile";
const tagInputs = new Map();

let companyData = loadCompanyData();
let lastProfileMenuFocusedElement = null;

document.addEventListener("DOMContentLoaded", async () => {
    bindEvents();
    await fetchAndSyncCompanyData();
    renderUI();
});

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function apiFetch(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        credentials: "include",
        ...options,
        headers: {
            ...(options.headers || {})
        }
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || `Request failed: ${response.status}`);
    }

    return response.json();
}

async function fetchAndSyncCompanyData() {
    try {
        const result = await apiFetch("/companies/current");
        const s = result.data;

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
            logoDataUrl: s.logo?.url || ""
        };

        persistCompanyData();
    } catch (error) {
        console.warn("Could not load profile from server, using cached data.", error.message);
    }
}

// ---------------------------------------------------------------------------
// Event binding
// ---------------------------------------------------------------------------

function bindEvents() {
    const profileMenuButton = document.getElementById("profileMenuButton");
    const companyDrawerOverlay = document.getElementById("companyDrawerOverlay");

    document.getElementById("companyLogoTrigger")?.addEventListener("click", () => {
        document.getElementById("companyLogoInput")?.click();
    });
    document.getElementById("companyLogoInput")?.addEventListener("change", handleLogoUpload);

    document.getElementById("editCompanySummary")?.addEventListener("click", () => openModal("detailsModal"));
    document.querySelectorAll("[data-open-modal]").forEach((button) => {
        button.addEventListener("click", () => openModal(button.dataset.openModal));
    });

    if (profileMenuButton) {
        profileMenuButton.addEventListener("click", (event) => {
            event.stopPropagation();
            toggleCompanyDrawer();
        });
    }

    companyDrawerOverlay?.addEventListener("click", (event) => {
        if (event.target === companyDrawerOverlay) {
            closeCompanyDrawer();
        }
    });

    document.getElementById("companyDrawerClose")?.addEventListener("click", () => closeCompanyDrawer());
    document.getElementById("drawerViewProfile")?.addEventListener("click", () => {
        window.location.href = "profile.html";
    });

    document.querySelectorAll(".modal-overlay").forEach((modal) => {
        modal.querySelector(".modal-close")?.addEventListener("click", () => closeModal(modal.id));
        modal.querySelector(".btn-cancel")?.addEventListener("click", () => closeModal(modal.id));
        modal.addEventListener("click", (event) => {
            if (event.target === modal) closeModal(modal.id);
        });
    });

    document.querySelector("#detailsModal .modal-form")?.addEventListener("submit", submitCompanyDetails);
    document.querySelector("#overviewModal .modal-form")?.addEventListener("submit", submitOverview);
    document.querySelector("#hiringModal .modal-form")?.addEventListener("submit", submitHiringPreferences);
    document.querySelector("#cultureModal .modal-form")?.addEventListener("submit", submitCompanyCulture);
    document.getElementById("logoutBtn")?.addEventListener("click", logoutCompany);

    setupTagInput("rolesTagContainer", "inpRoleTag");
    setupTagInput("locationsTagContainer", "inpHiringLocationTag");
    setupTagInput("valuesTagContainer", "inpValueTag");

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;

        if (isCompanyDrawerOpen()) {
            event.preventDefault();
            closeCompanyDrawer();
            return;
        }

        const openModalElement = document.querySelector(".modal-overlay.open");
        if (openModalElement) {
            event.preventDefault();
            closeModal(openModalElement.id);
        }
    });
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

function createDefaultCompanyData() {
    return {
        name: "",
        industry: "",
        location: "",
        email: "",
        website: "",
        size: "",
        description: "",
        createdAt: "",
        logoDataUrl: "",
        preferredRoles: [],
        hiringMode: "",
        workType: "",
        hiringLocations: [],
        coreValues: [],
        teamStyle: "",
        workEnvironment: ""
    };
}

function loadCompanyData() {
    const defaultData = createDefaultCompanyData();

    try {
        const storedData = JSON.parse(localStorage.getItem(COMPANY_STORAGE_KEY) || "{}");
        return {
            ...defaultData,
            ...storedData,
            preferredRoles: sanitizeStringArray(storedData.preferredRoles),
            hiringLocations: sanitizeStringArray(storedData.hiringLocations),
            coreValues: sanitizeStringArray(storedData.coreValues)
        };
    } catch (error) {
        console.error("Unable to read saved company profile", error);
        return defaultData;
    }
}

function persistCompanyData() {
    localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(companyData));
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

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
        companyData.description ||
        "Add a strong company overview to help candidates understand your mission, scale, and hiring story."
    );

    setText("orgIndustry", industry);
    setText("orgSize", size);
    setText("orgLocation", location);
    setWebsiteText("orgWebsite", websiteText, websiteLink);

    setText("contactEmail", email);
    setWebsiteText("contactWebsite", websiteText, websiteLink);
    setText("contactHeadquarters", location);
    setText("contactCompanySize", size);

    setText("companyHiringMode", companyData.hiringMode || "Not added yet");
    setText("companyWorkType", companyData.workType || "Not added yet");
    setText("companyHiringSummary", getHiringSummary());
    renderChipCloud("companyRolesList", companyData.preferredRoles, "No preferred roles added yet");
    renderChipCloud("companyHiringLocationsList", companyData.hiringLocations, "No hiring locations added yet");

    renderChipCloud("companyValuesList", companyData.coreValues, "No core values added yet");
    setText(
        "companyTeamStyleText",
        companyData.teamStyle || "Describe how your teams collaborate, make decisions, and support new hires."
    );
    setText(
        "companyWorkEnvironmentText",
        companyData.workEnvironment || "Share what candidates can expect from the day-to-day work environment and culture."
    );

    renderAccountInfoSection();
    renderCompanyDrawer();

    applyMediaState(document.getElementById("companyLogo"), companyData.logoDataUrl, initials);
    setProfileAvatar(document.getElementById("headerProfileAvatar"), companyData.logoDataUrl, initials);
}

function renderAccountInfoSection() {
    setText("accountCreatedOn", formatAccountCreatedDate(companyData.createdAt));
    setText("accountRegisteredEmail", companyData.email || "Not available");
}

function renderCompanyDrawer() {
    const initials = getInitials(companyData.name);
    const location = getCompanyLocationLabel();

    applyMediaState(document.getElementById("drawerCompanyLogo"), companyData.logoDataUrl, initials);
    setText("drawerCompanyName", companyData.name || "Company Name");
    setText("drawerCompanyLocation", location);
}

// ---------------------------------------------------------------------------
// Modal population
// ---------------------------------------------------------------------------

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

    if (id === "hiringModal") {
        setTagInputValues("rolesTagContainer", companyData.preferredRoles);
        document.getElementById("inpHiringMode").value = companyData.hiringMode || "";
        document.getElementById("inpWorkType").value = companyData.workType || "";
        setTagInputValues("locationsTagContainer", companyData.hiringLocations);
        return;
    }

    if (id === "cultureModal") {
        setTagInputValues("valuesTagContainer", companyData.coreValues);
        document.getElementById("inpTeamStyle").value = companyData.teamStyle || "";
        document.getElementById("inpWorkEnvironment").value = companyData.workEnvironment || "";
    }
}

// ---------------------------------------------------------------------------
// Submit handlers
// ---------------------------------------------------------------------------

async function submitCompanyDetails(event) {
    event.preventDefault();

    const payload = {
        name: document.getElementById("inpCompanyName").value.trim() || companyData.name,
        industry: document.getElementById("inpIndustry").value,
        location: document.getElementById("inpLocation").value.trim(),
        website: document.getElementById("inpWebsite").value.trim(),
        size: document.getElementById("inpSize").value
    };

    try {
        const result = await apiFetch("/companies/update-details", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const s = result.data;
        companyData = {
            ...companyData,
            name: s.name || companyData.name,
            industry: s.industry || companyData.industry,
            location: s.location || companyData.location,
            website: s.website !== undefined ? s.website : companyData.website,
            size: s.size || companyData.size
        };

        saveAndRender("detailsModal");
    } catch (error) {
        console.error("Failed to update company details:", error.message);
        alert(`Could not save details: ${error.message}`);
    }
}

async function submitOverview(event) {
    event.preventDefault();

    const description = document.getElementById("inpOverview").value.trim();

    try {
        const result = await apiFetch("/companies/update-details", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description })
        });

        const s = result.data;
        companyData = {
            ...companyData,
            description: s.description !== undefined ? s.description : companyData.description
        };

        saveAndRender("overviewModal");
    } catch (error) {
        console.error("Failed to update overview:", error.message);
        alert(`Could not save overview: ${error.message}`);
    }
}

function submitHiringPreferences(event) {
    event.preventDefault();

    companyData = {
        ...companyData,
        preferredRoles: getTagInputValues("rolesTagContainer"),
        hiringMode: document.getElementById("inpHiringMode").value,
        workType: document.getElementById("inpWorkType").value,
        hiringLocations: getTagInputValues("locationsTagContainer")
    };

    saveAndRender("hiringModal");
}

function submitCompanyCulture(event) {
    event.preventDefault();

    companyData = {
        ...companyData,
        coreValues: getTagInputValues("valuesTagContainer"),
        teamStyle: document.getElementById("inpTeamStyle").value.trim(),
        workEnvironment: document.getElementById("inpWorkEnvironment").value.trim()
    };

    saveAndRender("cultureModal");
}

async function handleLogoUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("logo", file);

    try {
        const result = await apiFetch("/companies/upload-logo", {
            method: "POST",
            body: formData
        });

        companyData = {
            ...companyData,
            logoDataUrl: result.data?.logoUrl || companyData.logoDataUrl
        };
        persistCompanyData();
        renderUI();
    } catch (error) {
        console.error("Logo upload failed:", error.message);
        alert(`Logo upload failed: ${error.message}`);
    } finally {
        event.target.value = "";
    }
}

async function logoutCompany() {
    closeCompanyDrawer({ restoreFocus: false });
    localStorage.removeItem(COMPANY_STORAGE_KEY);
    companyData = createDefaultCompanyData();
    renderUI();
    // window.location.href = "/login";
}

// ---------------------------------------------------------------------------
// Shared save helper
// ---------------------------------------------------------------------------

function saveAndRender(modalId) {
    persistCompanyData();
    renderUI();
    closeModal(modalId);
}

// ---------------------------------------------------------------------------
// Modal helpers
// ---------------------------------------------------------------------------

function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;

    populateModal(id);
    document.body.classList.add("modal-open");
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
    const hasOpenLayer = document.querySelector(".modal-overlay.open, .company-overlay.open");
    document.body.classList.toggle("modal-open", Boolean(hasOpenLayer));
}

// ---------------------------------------------------------------------------
// Company drawer helpers
// ---------------------------------------------------------------------------

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
        syncBodyScrollState();

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

// ---------------------------------------------------------------------------
// Tag input helpers
// ---------------------------------------------------------------------------

function setupTagInput(containerId, inputId) {
    const container = document.getElementById(containerId);
    const input = document.getElementById(inputId);

    if (!container || !input) return;

    tagInputs.set(containerId, { container, input, tags: [] });

    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            addTagToInput(containerId, input.value);
            return;
        }

        if (event.key === "Backspace" && !input.value.trim()) {
            removeTagAtIndex(containerId, tagInputs.get(containerId)?.tags.length - 1);
        }
    });

    input.addEventListener("blur", () => addTagToInput(containerId, input.value));
    renderTagInput(containerId);
}

function setTagInputValues(containerId, values) {
    const binding = tagInputs.get(containerId);
    if (!binding) return;

    binding.tags = sanitizeStringArray(values);
    binding.input.value = "";
    renderTagInput(containerId);
}

function getTagInputValues(containerId) {
    const binding = tagInputs.get(containerId);
    return binding ? [...binding.tags] : [];
}

function addTagToInput(containerId, value) {
    const binding = tagInputs.get(containerId);
    if (!binding) return;

    const nextTag = String(value || "").trim().replace(/,+$/, "");
    if (!nextTag) {
        binding.input.value = "";
        return;
    }

    const alreadyExists = binding.tags.some((tag) => tag.toLowerCase() === nextTag.toLowerCase());
    if (!alreadyExists) {
        binding.tags.push(nextTag);
    }

    binding.input.value = "";
    renderTagInput(containerId);
}

function removeTagAtIndex(containerId, index) {
    const binding = tagInputs.get(containerId);
    if (!binding || index < 0) return;

    binding.tags.splice(index, 1);
    renderTagInput(containerId);
}

function renderTagInput(containerId) {
    const binding = tagInputs.get(containerId);
    if (!binding) return;

    binding.container.querySelectorAll(".tag").forEach((tag) => tag.remove());

    binding.tags.forEach((value, index) => {
        const tag = document.createElement("span");
        tag.className = "tag";

        const label = document.createElement("span");
        label.textContent = value;

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.setAttribute("aria-label", `Remove ${value}`);
        removeButton.textContent = "x";
        removeButton.addEventListener("click", () => removeTagAtIndex(containerId, index));

        tag.append(label, removeButton);
        binding.container.insertBefore(tag, binding.input);
    });
}

function renderChipCloud(containerId, items, emptyLabel) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";

    const safeItems = sanitizeStringArray(items);
    if (!safeItems.length) {
        const emptyState = document.createElement("span");
        emptyState.className = "empty-chip";
        emptyState.textContent = emptyLabel;
        container.append(emptyState);
        return;
    }

    safeItems.forEach((item) => {
        const chip = document.createElement("span");
        chip.className = "tag";
        chip.textContent = item;
        container.append(chip);
    });
}

// ---------------------------------------------------------------------------
// DOM and media utilities
// ---------------------------------------------------------------------------

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
    if (element) element.textContent = value || "-";
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

// ---------------------------------------------------------------------------
// String and date utilities
// ---------------------------------------------------------------------------

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

    const savedLocation = String(companyData.location || "").trim();
    return savedLocation || "Location not added";
}

function getHiringSummary() {
    const hasRoles = companyData.preferredRoles.length > 0;
    const hasLocations = companyData.hiringLocations.length > 0;
    const hasMeta = companyData.hiringMode || companyData.workType;

    if (!hasRoles && !hasLocations && !hasMeta) {
        return "Add hiring preferences to tell candidates what roles, locations, and work model your team is hiring for.";
    }

    const summaryParts = [];

    if (hasRoles) {
        summaryParts.push(`Hiring for ${companyData.preferredRoles.slice(0, 2).join(", ")}`);
    }

    if (companyData.workType) {
        summaryParts.push(companyData.workType);
    }

    if (hasLocations) {
        summaryParts.push(
            companyData.hiringLocations.length === 1
                ? `based in ${companyData.hiringLocations[0]}`
                : `${companyData.hiringLocations.length} hiring locations`
        );
    }

    if (companyData.hiringMode) {
        summaryParts.push(`${companyData.hiringMode.toLowerCase()} hiring`);
    }

    return summaryParts.join(" | ");
}

function getHiringFocus() {
    if (companyData.preferredRoles.length) {
        const [firstRole, ...restRoles] = companyData.preferredRoles;
        return restRoles.length ? `${firstRole} +${restRoles.length} more` : firstRole;
    }

    if (companyData.hiringMode) {
        return companyData.hiringMode;
    }

    return "Add hiring preferences";
}

function normalizeWebsite(value) {
    if (!value) return "";
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function formatAccountCreatedDate(value) {
    if (!value) return "Not available";
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return "Not available";

    return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
    }).format(parsedDate);
}

function truncateText(value = "", maxLength = 128) {
    const cleanValue = String(value).trim();
    if (cleanValue.length <= maxLength) return cleanValue;
    return `${cleanValue.slice(0, maxLength - 1).trimEnd()}...`;
}

function sanitizeStringArray(value) {
    if (!Array.isArray(value)) return [];

    return value
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .filter((item, index, items) => items.findIndex((entry) => entry.toLowerCase() === item.toLowerCase()) === index);
}

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#39;");
}

function escapeAttribute(value = "") {
    return escapeHtml(value);
}
