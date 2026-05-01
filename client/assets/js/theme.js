(function () {
    const storageKey = "theme";
    const darkClass = "theme-dark";
    const root = document.documentElement;

    const readTheme = () => {
        try {
            return localStorage.getItem(storageKey) === "dark" ? "dark" : "light";
        } catch (error) {
            return "light";
        }
    };

    const writeTheme = (theme) => {
        try {
            localStorage.setItem(storageKey, theme);
        } catch (error) {
            return;
        }
    };

    const updateToggle = (toggle, theme) => {
        const isDark = theme === "dark";
        toggle.setAttribute("aria-pressed", String(isDark));
        toggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
        toggle.title = isDark ? "Switch to light mode" : "Switch to dark mode";
    };

    const syncToggles = (theme) => {
        document.querySelectorAll("[data-theme-toggle]").forEach((toggle) => {
            updateToggle(toggle, theme);
        });
    };

    const applyTheme = (theme, persist) => {
        const isDark = theme === "dark";
        root.classList.toggle(darkClass, isDark);

        if (document.body) {
            document.body.classList.toggle(darkClass, isDark);
        }

        if (persist) {
            writeTheme(theme);
        }

        syncToggles(theme);
    };

    const init = () => {
        applyTheme(readTheme(), false);

        document.querySelectorAll("[data-theme-toggle]").forEach((toggle) => {
            toggle.addEventListener("click", () => {
                const nextTheme = root.classList.contains(darkClass) ? "light" : "dark";
                applyTheme(nextTheme, true);
            });
        });
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }

    window.addEventListener("storage", (event) => {
        if (event.key === storageKey) {
            applyTheme(event.newValue === "dark" ? "dark" : "light", false);
        }
    });
})();
