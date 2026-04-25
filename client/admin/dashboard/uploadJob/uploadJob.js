import {API_BASE_URL} from "../../../constants/constant.js";

(function () {
    var COMPANY_STORAGE_KEY = "naukriCampusCompanyProfile";
    var currentStep = 1;
    var totalSteps = 3;
    var sections = Array.from(document.querySelectorAll(".form-section"));
    var stepItems = Array.from(document.querySelectorAll(".step-item"));
    var formControls = Array.from(document.querySelectorAll(".form-control"));
    var postingAsPills = Array.from(document.querySelectorAll("[data-posting-as]"));
    var backButton = document.getElementById("btnBack");
    var nextButton = document.getElementById("btnNext");
    var successOverlay = document.getElementById("successOverlay");
    var postAnotherJobButton = document.getElementById("postAnotherJobButton");
    var applicationDeadlineInput = document.getElementById("applicationDeadline");
    var profileMenuButton = document.getElementById("profileMenuButton");
    var companyDrawerOverlay = document.getElementById("companyDrawerOverlay");
    var companyDrawerClose = document.getElementById("companyDrawerClose");
    var logoutButton = document.getElementById("logoutBtn");
    var headerProfileAvatar = document.getElementById("headerProfileAvatar");
    var drawerCompanyLogo = document.getElementById("drawerCompanyLogo");
    var drawerCompanyName = document.getElementById("drawerCompanyName");
    var drawerCompanyLocation = document.getElementById("drawerCompanyLocation");
    var drawerViewProfile = document.getElementById("drawerViewProfile");
    var lastProfileMenuFocusedElement = null;
    var companyData = loadCompanyData();
    var tagFields = {
        location: createTagFieldConfig("locationTagContainer", "locationInput", "location", "location-chip"),
        skills: createTagFieldConfig("requiredSkillsTagContainer", "requiredSkillsInput", "requiredSkills", "tag-chip"),
        qualifications: createTagFieldConfig("qualificationsTagContainer", "qualificationsInput", "qualifications", "tag-chip")
    };

    function $(id) {
        return document.getElementById(id);
    }

    function getPostingAs() {
        var activePill = postingAsPills.find(function (pill) {
            return pill.classList.contains("active");
        });
        return activePill ? activePill.getAttribute("data-posting-as") : "";
    }

    function parseCommaSeparated(value) {
        return value.split(",").map(function (item) {
            return item.trim();
        }).filter(Boolean);
    }

    function setError(groupId) {
        var group = $(groupId);
        if (group) {
            group.classList.add("has-error");
        }
    }

    function clearErrorForField(field) {
        var group = field.closest(".form-group");
        if (group) {
            group.classList.remove("has-error");
        }
    }

    function createTagFieldConfig(containerId, inputId, hiddenInputId, chipClassName) {
        return {
            container: document.getElementById(containerId),
            input: document.getElementById(inputId),
            hiddenInput: document.getElementById(hiddenInputId),
            chipClassName: chipClassName,
            values: []
        };
    }

    function getTagFieldValues(fieldKey) {
        var field = tagFields[fieldKey];
        return field ? field.values.slice() : [];
    }

    function syncTagFieldValue(fieldKey) {
        var field = tagFields[fieldKey];
        if (field && field.hiddenInput) {
            field.hiddenInput.value = field.values.join(", ");
        }
    }

    function renderTagField(fieldKey) {
        var field = tagFields[fieldKey];
        if (!field || !field.container || !field.input) return;

        Array.from(field.container.querySelectorAll(".tag-chip, .location-chip")).forEach(function (chip) {
            chip.remove();
        });

        field.values.forEach(function (value, index) {
            var chip = document.createElement("span");
            chip.className = field.chipClassName;

            var label = document.createElement("span");
            label.textContent = value;

            var removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "chip-remove-button";
            removeButton.setAttribute("aria-label", "Remove " + value);
            removeButton.textContent = "x";
            removeButton.addEventListener("click", function () {
                removeTagFieldValueAt(fieldKey, index);
                field.input.focus();
            });

            chip.appendChild(label);
            chip.appendChild(removeButton);
            field.container.insertBefore(chip, field.input);
        });

        syncTagFieldValue(fieldKey);
    }

    function addTagFieldValue(fieldKey, value) {
        var field = tagFields[fieldKey];
        if (!field) return;

        var normalizedValue = String(value || "").trim().replace(/,+$/, "");
        if (!normalizedValue) return;

        var exists = field.values.some(function (entry) {
            return entry.toLowerCase() === normalizedValue.toLowerCase();
        });

        if (exists) {
            if (field.input) {
                field.input.value = "";
                field.input.focus();
            }
            return;
        }

        field.values.push(normalizedValue);
        renderTagField(fieldKey);
        clearErrorForField(field.input);

        if (field.input) {
            field.input.value = "";
            field.input.focus();
        }
    }

    function removeTagFieldValueAt(fieldKey, index) {
        var field = tagFields[fieldKey];
        if (!field || index < 0 || index >= field.values.length) return;
        field.values.splice(index, 1);
        renderTagField(fieldKey);
    }

    function initializeTagField(fieldKey) {
        var field = tagFields[fieldKey];
        if (!field || !field.hiddenInput) return;

        field.values = parseCommaSeparated(field.hiddenInput.value || "");
        renderTagField(fieldKey);

        if (!field.input) return;

        field.input.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                addTagFieldValue(fieldKey, field.input.value);
                return;
            }

            if (event.key === "Backspace" && !field.input.value.trim() && field.values.length) {
                removeTagFieldValueAt(fieldKey, field.values.length - 1);
                clearErrorForField(field.input);
            }
        });

        field.input.addEventListener("blur", function () {
            addTagFieldValue(fieldKey, field.input.value);
        });

        field.input.addEventListener("input", function () {
            clearErrorForField(field.input);
        });
    }

    function validateStep(step) {
        var isValid = true;
        var expMin, expMax, salaryMin, salaryMax;

        if (step === 1) {
            if (!$("title").value.trim()) { setError("group-title"); isValid = false; }
            if (!$("jobType").value) { setError("group-jobType"); isValid = false; }
            if (!$("workMode").value) { setError("group-workMode"); isValid = false; }
            if (!getTagFieldValues("location").length) { setError("group-location"); isValid = false; }
            if (!$("vacancies").value || Number($("vacancies").value) < 1) { setError("group-vacancies"); isValid = false; }

        } else if (step === 2) {
            expMin = Number($("expMin").value);
            expMax = Number($("expMax").value);
            if (!$("expMin").value || !$("expMax").value || expMin > expMax) { setError("group-experience"); isValid = false; }
            if (!getTagFieldValues("skills").length) { setError("group-skills"); isValid = false; }
            if (!getTagFieldValues("qualifications").length) { setError("group-qualifications"); isValid = false; }

        } else if (step === 3) {
            salaryMin = Number($("salaryMin").value);
            salaryMax = Number($("salaryMax").value);
            if (!$("salaryMin").value || !$("salaryMax").value || salaryMin > salaryMax) { setError("group-salary"); isValid = false; }
            if (!$("applicationDeadline").value) { setError("group-deadline"); isValid = false; }
            if (!$("description").value.trim()) { setError("group-description"); isValid = false; }
        }

        return isValid;
    }

    function updateStepUI() {
        sections.forEach(function (section, index) {
            section.classList.toggle("active", index + 1 === currentStep);
        });

        stepItems.forEach(function (item, index) {
            item.classList.toggle("active", index + 1 === currentStep);
            item.classList.toggle("completed", index + 1 < currentStep);
        });

        if (backButton) {
            backButton.style.display = currentStep > 1 ? "block" : "none";
        }

        if (nextButton) {
            nextButton.textContent = currentStep === totalSteps ? "Post Job" : "Next";
        }
    }

    function setSubmitting(isSubmitting) {
        if (!nextButton) return;
        nextButton.disabled = isSubmitting;
        nextButton.textContent = isSubmitting ? "Posting..." : "Post Job";
    }

    function showApiError(message) {
        var existing = document.getElementById("api-error-toast");
        if (existing) existing.remove();

        var toast = document.createElement("div");
        toast.id = "api-error-toast";
        toast.style.cssText = [
            "position: fixed",
            "bottom: 80px",
            "left: 50%",
            "transform: translateX(-50%)",
            "background: #dc2626",
            "color: #fff",
            "padding: 12px 24px",
            "border-radius: 8px",
            "font-size: 14px",
            "z-index: 9999",
            "box-shadow: 0 4px 12px rgba(0,0,0,0.2)",
            "max-width: 90vw",
            "text-align: center"
        ].join(";");
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(function () {
            if (toast.parentNode) toast.remove();
        }, 5000);
    }

    function loadCompanyData() {
        try {
            return JSON.parse(localStorage.getItem(COMPANY_STORAGE_KEY) || "{}");
        } catch (error) {
            console.error("Unable to read saved company profile", error);
            return {};
        }
    }

    function getInitials(name) {
        var parts = String(name || "").trim().split(/\s+/).filter(Boolean).slice(0, 2);
        if (!parts.length) return "NC";
        return parts.map(function (part) { return part.charAt(0); }).join("").toUpperCase();
    }

    function createInitialsAvatarDataUrl(text) {
        var initials = (text || "NC").slice(0, 2);
        var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" rx="40" fill="#eef3ff"/><text x="50%" y="53%" dominant-baseline="middle" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="700" fill="#2e5bff">' + initials + "</text></svg>";
        return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
    }

    function applyMediaState(element, imageUrl, fallbackText) {
        if (!element) return;
        element.classList.remove("has-photo");
        element.style.backgroundImage = "";
        element.textContent = fallbackText;

        if (imageUrl) {
            element.classList.add("has-photo");
            element.style.backgroundImage = 'url("' + imageUrl + '")';
        }
    }

    function setProfileAvatar(element, imageUrl, fallbackText) {
        if (!element) return;
        element.src = imageUrl || createInitialsAvatarDataUrl(fallbackText);
        element.alt = companyData.name ? companyData.name + " logo" : "Company Logo";
    }

    function getCompanyLocationLabel() {
        var locationFields = [
            companyData.city,
            companyData.state,
            companyData.headquartersCity,
            companyData.headquartersState
        ].map(function (value) {
            return String(value || "").trim();
        }).filter(Boolean);

        if (locationFields.length) {
            return Array.from(new Set(locationFields)).join(", ");
        }

        var savedLocation = String(companyData.location || "").trim();
        return savedLocation || "Location not added";
    }

    function renderCompanyDrawer() {
        var initials = getInitials(companyData.name);
        var location = getCompanyLocationLabel();

        applyMediaState(drawerCompanyLogo, companyData.logoDataUrl, initials);
        setProfileAvatar(headerProfileAvatar, companyData.logoDataUrl, initials);

        if (drawerCompanyName) drawerCompanyName.textContent = companyData.name || "Company Name";
        if (drawerCompanyLocation) drawerCompanyLocation.textContent = location;
    }

    function isCompanyDrawerOpen() {
        return Boolean(companyDrawerOverlay && !companyDrawerOverlay.hidden);
    }

    function openCompanyDrawer() {
        if (!companyDrawerOverlay || !profileMenuButton) return;
        lastProfileMenuFocusedElement = profileMenuButton;
        companyDrawerOverlay.hidden = false;
        document.body.classList.add("modal-open");
        profileMenuButton.setAttribute("aria-expanded", "true");
        window.requestAnimationFrame(function () {
            companyDrawerOverlay.classList.add("open");
            if (companyDrawerClose) companyDrawerClose.focus();
        });
    }

    function closeCompanyDrawer() {
        if (!companyDrawerOverlay || !profileMenuButton || companyDrawerOverlay.hidden) return;
        companyDrawerOverlay.classList.remove("open");
        profileMenuButton.setAttribute("aria-expanded", "false");

        setTimeout(function () {
            companyDrawerOverlay.hidden = true;
            document.body.classList.remove("modal-open");
            if (lastProfileMenuFocusedElement && typeof lastProfileMenuFocusedElement.focus === "function") {
                lastProfileMenuFocusedElement.focus();
            }
        }, 200);
    }

    function toggleCompanyDrawer() {
        if (isCompanyDrawerOpen()) { closeCompanyDrawer(); return; }
        openCompanyDrawer();
    }

    function goNext() {
        if (!validateStep(currentStep)) return;

        if (currentStep < totalSteps) {
            currentStep += 1;
            updateStepUI();
            return;
        }

        submitForm();
    }

    function goBack() {
        if (currentStep <= 1) return;
        currentStep -= 1;
        updateStepUI();
    }

    function submitForm() {
        var jobData = {
            title: $("title").value.trim(),
            description: $("description").value.trim(),
            location: getTagFieldValues("location"),
            salaryRange: $("salaryMin").value + "-" + $("salaryMax").value,
            jobType: $("jobType").value,
            qualifications: getTagFieldValues("qualifications").map(function(q) {
                return { degree: q };
            }),
            experiences: {
                min: Number($("expMin").value),
                max: Number($("expMax").value)
            },
            applicationDeadline: $("applicationDeadline").value,
            workMode: $("workMode").value,
            requiredSkills: getTagFieldValues("skills"),
            vacancies: Number($("vacancies").value)
        };

        if ($("ageLimit").value) {
            jobData.ageLimit = Number($("ageLimit").value);
        }

        console.log("=== PAYLOAD READY FOR API ===");
        console.log(JSON.stringify(jobData, null, 2));

        setSubmitting(true);

        fetch(API_BASE_URL + "/jobs/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(jobData)
        })
        .then(function (response) {
            return response.json().then(function (data) {
                return { status: response.status, ok: response.ok, data: data };
            });
        })
        .then(function (result) {
            setSubmitting(false);

            if (!result.ok) {
                var message = (result.data && result.data.message)
                    ? result.data.message
                    : "Something went wrong. Please try again.";
                showApiError(message);
                return;
            }

            console.log("Job created:", result.data);

            if (successOverlay) {
                successOverlay.hidden = false;
                successOverlay.classList.add("is-visible");
            }
        })
        .catch(function (error) {
            setSubmitting(false);
            console.error("Network error:", error);
            showApiError("Network error — could not reach the server. Make sure the backend is running on port 8000.");
        });
    }


    postingAsPills.forEach(function (pill) {
        pill.addEventListener("click", function () {
            postingAsPills.forEach(function (item) {
                item.classList.remove("active");
                item.setAttribute("aria-pressed", "false");
            });
            pill.classList.add("active");
            pill.setAttribute("aria-pressed", "true");
        });
    });

    formControls.forEach(function (field) {
        field.addEventListener("input", function () { clearErrorForField(field); });
        field.addEventListener("change", function () { clearErrorForField(field); });
    });

    initializeTagField("location");
    initializeTagField("skills");
    initializeTagField("qualifications");

    if (applicationDeadlineInput) {
        applicationDeadlineInput.min = new Date().toISOString().split("T")[0];
    }

    if (backButton) { backButton.addEventListener("click", goBack); }
    if (nextButton) { nextButton.addEventListener("click", goNext); }

    if (postAnotherJobButton) {
        postAnotherJobButton.addEventListener("click", function () {
            window.location.reload();
        });
    }

    renderCompanyDrawer();

    if (profileMenuButton) {
        profileMenuButton.addEventListener("click", function (event) {
            event.stopPropagation();
            toggleCompanyDrawer();
        });
    }

    if (companyDrawerOverlay) {
        companyDrawerOverlay.addEventListener("click", function (event) {
            if (event.target === companyDrawerOverlay) {
                closeCompanyDrawer();
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            console.log("Logout requested");
            closeCompanyDrawer();
        });
    }

    if (drawerViewProfile) {
        drawerViewProfile.addEventListener("click", function () {
            window.location.href = "../../profile/profile.html";
        });
    }

    if (companyDrawerClose) {
        companyDrawerClose.addEventListener("click", function () {
            closeCompanyDrawer();
        });
    }

    document.addEventListener("click", function (event) {
        if (!isCompanyDrawerOpen()) return;
        if (profileMenuButton && profileMenuButton.contains(event.target)) return;
        if (companyDrawerOverlay && companyDrawerOverlay.contains(event.target)) return;
        closeCompanyDrawer();
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && isCompanyDrawerOpen()) {
            event.preventDefault();
            closeCompanyDrawer();
        }
    });

    updateStepUI();
}());
