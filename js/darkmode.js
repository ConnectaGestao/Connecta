// js/darkmode.js
function initDarkMode() {
    // Check if user previously saved preference
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
        document.documentElement.classList.add('dark');
    } else if (saved === 'light') {
        document.documentElement.classList.remove('dark');
    } else {
        // OS preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
        }
    }
    updateDarkIcon();
}

function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateDarkIcon();
}

function updateDarkIcon() {
    const isDark = document.documentElement.classList.contains('dark');
    const icons = document.querySelectorAll('.dark-mode-icon');
    icons.forEach(icon => {
        if (typeof lucide !== 'undefined') {
            icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
            lucide.createIcons();
        }
    });
}

// Inicializa imediatamente
initDarkMode();
