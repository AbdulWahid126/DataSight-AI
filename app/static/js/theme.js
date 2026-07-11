/**
 * ThemeManager — Light/Dark theme system with localStorage persistence.
 * Runs immediately on load (before DOMContentLoaded) to prevent flash.
 */
(function () {
    const STORAGE_KEY = 'dataSightTheme';
    const root = document.documentElement;

    function getTheme() {
        return localStorage.getItem(STORAGE_KEY) || 'dark';
    }

    function applyTheme(theme) {
        if (theme === 'light') {
            root.classList.remove('dark');
            root.classList.add('light');
        } else {
            root.classList.remove('light');
            root.classList.add('dark');
        }
        localStorage.setItem(STORAGE_KEY, theme);
        updateIcons(theme);
    }

    function updateIcons(theme) {
        // Update all theme toggle icons on the page
        const icons = document.querySelectorAll('.theme-icon, #theme-toggle-icon, #theme-toggle-icon-mobile');
        icons.forEach(icon => {
            if (theme === 'light') {
                icon.className = icon.className.replace('ph-sun', 'ph-moon');
                icon.classList.add('ph-moon');
                icon.classList.remove('ph-sun');
            } else {
                icon.className = icon.className.replace('ph-moon', 'ph-sun');
                icon.classList.add('ph-sun');
                icon.classList.remove('ph-moon');
            }
        });

        // Update settings toggle if it exists
        const settingsToggle = document.getElementById('setting-theme');
        if (settingsToggle) {
            settingsToggle.checked = theme === 'light';
        }
    }

    function toggleTheme() {
        const current = getTheme();
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        // Show toast if UI is available
        if (typeof UI !== 'undefined') {
            UI.showAlert(`${next.charAt(0).toUpperCase() + next.slice(1)} mode enabled.`, 'info');
        }
    }

    // Apply theme immediately to prevent flash
    applyTheme(getTheme());

    // Attach toggle buttons after DOM is ready
    document.addEventListener('DOMContentLoaded', function () {
        // Update icons to match current theme
        updateIcons(getTheme());

        const btnDesktop = document.getElementById('theme-toggle-btn');
        const btnMobile = document.getElementById('theme-toggle-btn-mobile');
        const btnSettings = document.getElementById('setting-theme');

        if (btnDesktop) btnDesktop.addEventListener('click', toggleTheme);
        if (btnMobile) btnMobile.addEventListener('click', toggleTheme);
        if (btnSettings) {
            btnSettings.addEventListener('change', function () {
                applyTheme(this.checked ? 'light' : 'dark');
                if (typeof UI !== 'undefined') {
                    UI.showAlert(`${this.checked ? 'Light' : 'Dark'} mode enabled.`, 'info');
                }
            });
        }
    });

    // Expose globally
    window.ThemeManager = { toggle: toggleTheme, apply: applyTheme, get: getTheme };
})();
