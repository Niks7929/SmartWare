/**
 * SMARTWARE - Intelligent Warehouse Management System
 * Production Client Application Controller
 */

// Global State
let currentUser = null;
let currentRole = 'Admin';
let activeView = 'dashboard';
let driftMultiplier = 1.0;

let allProducts = [];
let allWarehouses = [];
let allLocations = [];
let allSuppliers = [];
let allCustomers = [];

// Chart.js Instances
let chartCategory = null;
let chartHealth = null;
let chartRackUtilization = null;
let lastDashboardAnalytics = null;

// Inventory Density Heatmap State
let currentHeatmapData = null;
let currentHeatmapMode = 'pct'; // 'pct' or 'units'
let currentHeatmapFilter = 'ALL';
let isHotspotsOnly = false;
let selectedHeatmapCell = null;

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', async () => {
    initThemeToggle();
    initNavigation();
    initDriftSlider();
    initSearch();
    initGlobalButtons();
    initModalsAndForms();
    initInventoryHeatmap();

    // Check saved authentication session
    await checkAuthSession();

    // Initial master data load
    await loadMasterLookupData();

    // Project opens directly on Home page with sidebars hidden
    switchView('home');
});

// ==========================================================
// 0. USER-FRIENDLY THEME MANAGEMENT (PERSISTED VIA LOCALSTORAGE)
// ==========================================================

function initThemeToggle() {
    const themeBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeToggleIcon');

    function applyTheme(theme, save = true) {
        document.documentElement.setAttribute('data-bs-theme', theme);
        if (save) {
            try {
                localStorage.setItem('smartware_theme', theme);
            } catch (err) {
                console.warn('localStorage theme save error:', err);
            }
        }

        if (themeBtn && themeIcon) {
            if (theme === 'dark') {
                themeBtn.setAttribute('title', 'Switch to Light Mode');
                themeBtn.setAttribute('aria-label', 'Switch to Light Mode');
                themeIcon.className = 'bi bi-sun-fill fs-6 text-warning';
            } else {
                themeBtn.setAttribute('title', 'Switch to Dark Mode');
                themeBtn.setAttribute('aria-label', 'Switch to Dark Mode');
                themeIcon.className = 'bi bi-moon-stars fs-6 text-secondary';
            }
        }

        // Dynamically update dashboard charts if rendered
        if (lastDashboardAnalytics) {
            renderCategoryDoughnut(lastDashboardAnalytics.category_summary);
            renderStockHealthBar(lastDashboardAnalytics);
        }
        if (currentHeatmapData && activeView === 'warehouses') {
            renderRackUtilizationChart(currentHeatmapData.racks_ranked || []);
            renderD3HeatmapSvg(currentHeatmapData);
        }
    }

    // Determine initial theme: localStorage -> system preference -> default 'light'
    let initialTheme = 'light';
    try {
        const saved = localStorage.getItem('smartware_theme');
        if (saved === 'dark' || saved === 'light') {
            initialTheme = saved;
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            initialTheme = 'dark';
        }
    } catch (e) {
        initialTheme = 'light';
    }

    applyTheme(initialTheme, false);

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'dark' : 'light';
            const next = current === 'dark' ? 'light' : 'dark';
            applyTheme(next, true);
            showToast(`Switched to ${next === 'dark' ? 'Dark' : 'Light'} Mode`, 'info');
        });
    }

    // React to system color scheme changes if user hasn't set an explicit preference
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            try {
                if (!localStorage.getItem('smartware_theme')) {
                    applyTheme(e.matches ? 'dark' : 'light', false);
                }
            } catch (err) {}
        });
    }
}

// ==========================================================
// 1. AUTHENTICATION & SECURITY MANAGEMENT
// ==========================================================

let isLoggingOut = false;
let lastActivityTimestamp = Date.now();
let inactivityIntervalId = null;
let tabHiddenTimestamp = null;
let isWarningModalShown = false;

// Security Policy: 10 minutes inactivity timeout; 60 seconds warning countdown
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;
const INACTIVITY_WARNING_MS = 60 * 1000;
const SESSION_REFRESH_INTERVAL_MS = 2 * 60 * 1000; // Heartbeat ping every 2 minutes
let lastServerPingTimestamp = Date.now();

function getStoredToken() {
    return sessionStorage.getItem('smartware_token') || null;
}

function getStoredUser() {
    try {
        const u = sessionStorage.getItem('smartware_user');
        return u ? JSON.parse(u) : null;
    } catch (e) {
        return null;
    }
}

async function checkAuthSession() {
    // Purge legacy persistent localStorage auth items for true session-bound security
    try {
        localStorage.removeItem('smartware_token');
        localStorage.removeItem('smartware_user');
    } catch (e) {}

    try {
        const token = getStoredToken();
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch('/api/auth/me', { headers });
        const data = await res.json();
        if (data.authenticated && data.user) {
            setUserSession(data.user, token);
            return;
        }
    } catch (err) {
        console.warn("Session check fallback:", err);
    }

    // Secondary fallback to sessionStorage state
    const savedUser = getStoredUser();
    if (savedUser && savedUser.full_name) {
        setUserSession(savedUser, getStoredToken());
        return;
    }

    clearUserSession();
}

function updateHomePageAuthState(user) {
    const guestActions = document.getElementById('homeGuestActions');
    const userActions = document.getElementById('homeUserActions');
    const authCard = document.getElementById('homeAuthCard');
    const userCard = document.getElementById('homeUserCard');
    const cardUserName = document.getElementById('homeCardUserName');
    const cardUserRole = document.getElementById('homeCardUserRole');
    const cardAvatar = document.getElementById('homeCardAvatar');

    if (user) {
        if (guestActions) guestActions.classList.add('d-none');
        if (userActions) {
            userActions.classList.remove('d-none');
            userActions.classList.add('d-flex');
        }
        if (authCard) authCard.classList.add('d-none');
        if (userCard) userCard.classList.remove('d-none');

        if (cardUserName) cardUserName.textContent = user.full_name;
        if (cardUserRole) cardUserRole.textContent = (user.role || 'STAFF').toUpperCase();
        const isNikita = user.email === 'nik@gmail.com' || (user.full_name && user.full_name.toLowerCase().includes('nikita'));
        if (cardAvatar) {
            const initials = isNikita ? 'NC' : user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            cardAvatar.textContent = initials || 'SW';
            if (isNikita) {
                cardAvatar.style.background = 'linear-gradient(135deg, #ec4899, #8b5cf6)';
            } else {
                cardAvatar.style.background = '';
            }
        }
    } else {
        if (guestActions) guestActions.classList.remove('d-none');
        if (userActions) {
            userActions.classList.add('d-none');
            userActions.classList.remove('d-flex');
        }
        if (authCard) authCard.classList.remove('d-none');
        if (userCard) userCard.classList.add('d-none');
    }
}

function setUserSession(user, token = null) {
    currentUser = user;
    currentRole = user.role;

    try {
        sessionStorage.setItem('smartware_user', JSON.stringify(user));
        if (token) {
            sessionStorage.setItem('smartware_token', token);
        }
    } catch (e) {}

    // Reset and start inactivity tracker
    resetUserActivity();
    startInactivityTracker();

    // Update UI elements
    const fullNameEl = document.getElementById('userFullName');
    const roleBadgeEl = document.getElementById('userRoleBadge');
    const headerUserName = document.getElementById('headerUserName');
    const dropdownRoleHeader = document.getElementById('dropdownRoleHeader');
    const userAvatar = document.getElementById('userAvatar');
    const headerUserAvatar = document.getElementById('headerUserAvatar');
    const dropdownUserName = document.getElementById('dropdownUserName');
    const dropdownUserEmail = document.getElementById('dropdownUserEmail');

    const isNikita = user.email === 'nik@gmail.com' || (user.full_name && user.full_name.toLowerCase().includes('nikita'));

    if (fullNameEl) fullNameEl.textContent = user.full_name;
    if (roleBadgeEl) roleBadgeEl.textContent = (user.role || 'STAFF').toUpperCase();
    if (headerUserName) headerUserName.textContent = user.full_name.split(' ')[0];
    if (dropdownRoleHeader) dropdownRoleHeader.textContent = isNikita ? 'Signed in as Founder & Admin' : `Signed in as ${user.role}`;
    if (dropdownUserName) dropdownUserName.textContent = user.full_name;
    if (dropdownUserEmail) dropdownUserEmail.textContent = user.email;

    if (userAvatar) {
        const initials = isNikita ? 'NC' : user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        userAvatar.textContent = initials || 'SW';
        if (isNikita) {
            userAvatar.style.background = 'linear-gradient(135deg, #ec4899, #8b5cf6)';
        } else {
            userAvatar.style.background = '';
        }
    }

    if (headerUserAvatar) {
        const initials = isNikita ? 'NC' : user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        headerUserAvatar.textContent = initials;
        if (isNikita) {
            headerUserAvatar.style.background = 'linear-gradient(135deg, #ec4899, #8b5cf6)';
        } else {
            headerUserAvatar.style.background = '';
        }
    }

    // Toggle Header & Sidebar Auth elements
    const userProfileDropdown = document.getElementById('userProfileDropdown');
    const loginRegisterBtns = document.getElementById('loginRegisterBtns');
    const sidebarUserBox = document.getElementById('sidebarUserBox');
    const sidebarGuestBox = document.getElementById('sidebarGuestBox');

    if (userProfileDropdown) userProfileDropdown.classList.remove('d-none');
    if (loginRegisterBtns) loginRegisterBtns.classList.add('d-none');
    if (sidebarUserBox) {
        sidebarUserBox.classList.remove('d-none');
        sidebarUserBox.classList.add('d-flex');
    }
    if (sidebarGuestBox) {
        sidebarGuestBox.classList.add('d-none');
        sidebarGuestBox.classList.remove('d-flex');
    }

    // Update Home page state
    updateHomePageAuthState(user);
}

function clearUserSession() {
    currentUser = null;
    currentRole = null;

    stopInactivityTracker();
    hideInactivityWarningModal();

    try {
        sessionStorage.removeItem('smartware_user');
        sessionStorage.removeItem('smartware_token');
        localStorage.removeItem('smartware_user');
        localStorage.removeItem('smartware_token');
    } catch (e) {}

    const userProfileDropdown = document.getElementById('userProfileDropdown');
    const loginRegisterBtns = document.getElementById('loginRegisterBtns');
    const sidebarUserBox = document.getElementById('sidebarUserBox');
    const sidebarGuestBox = document.getElementById('sidebarGuestBox');

    if (userProfileDropdown) userProfileDropdown.classList.add('d-none');
    if (loginRegisterBtns) {
        if (typeof activeView !== 'undefined' && activeView === 'home') {
            loginRegisterBtns.classList.add('d-none');
        } else {
            loginRegisterBtns.classList.remove('d-none');
        }
    }
    if (sidebarUserBox) {
        sidebarUserBox.classList.add('d-none');
        sidebarUserBox.classList.remove('d-flex');
    }
    if (sidebarGuestBox) {
        sidebarGuestBox.classList.remove('d-none');
        sidebarGuestBox.classList.add('d-flex');
    }

    // Update Home page state
    updateHomePageAuthState(null);
}

// -------------------------------------------------------------
// INACTIVITY & AUTO-LOGOUT ENGINE
// -------------------------------------------------------------

function resetUserActivity() {
    lastActivityTimestamp = Date.now();
    if (isWarningModalShown) {
        hideInactivityWarningModal();
    }

    // Heartbeat ping to keep server sliding session refreshed
    if (currentUser && (Date.now() - lastServerPingTimestamp > SESSION_REFRESH_INTERVAL_MS)) {
        lastServerPingTimestamp = Date.now();
        pingSessionRefresh();
    }
}

async function pingSessionRefresh() {
    const token = getStoredToken();
    if (!token) return;
    try {
        await fetch('/api/auth/refresh_session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ token })
        });
    } catch (err) {
        console.warn("Heartbeat refresh ping notice:", err);
    }
}

function startInactivityTracker() {
    if (inactivityIntervalId) clearInterval(inactivityIntervalId);

    lastActivityTimestamp = Date.now();
    isWarningModalShown = false;

    // Attach user interaction listeners (throttled)
    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    let throttleTimeout = null;

    const handleUserInteraction = () => {
        if (!currentUser) return;
        if (!throttleTimeout) {
            throttleTimeout = setTimeout(() => {
                throttleTimeout = null;
                resetUserActivity();
            }, 1000);
        }
    };

    activityEvents.forEach(evt => {
        window.addEventListener(evt, handleUserInteraction, { passive: true });
    });

    // Check inactivity every 1 second
    inactivityIntervalId = setInterval(() => {
        if (!currentUser) return;

        const now = Date.now();
        const elapsed = now - lastActivityTimestamp;
        const remaining = INACTIVITY_TIMEOUT_MS - elapsed;

        // Update Security Center modal's countdown badge if open
        const badge = document.getElementById('securityInactivityRemainingBadge');
        if (badge) {
            const mins = Math.max(0, Math.floor(remaining / 60000));
            const secs = Math.max(0, Math.floor((remaining % 60000) / 1000));
            badge.textContent = `${mins}m ${secs}s active`;
        }

        // Warning phase: within final 60 seconds
        if (remaining <= INACTIVITY_WARNING_MS && remaining > 0) {
            const countdownSecs = Math.ceil(remaining / 1000);
            showInactivityWarningModal(countdownSecs);
        } else if (remaining <= 0) {
            // Auto logout triggered!
            handleAutoLogout('inactivity');
        } else {
            if (isWarningModalShown) {
                hideInactivityWarningModal();
            }
        }
    }, 1000);
}

function stopInactivityTracker() {
    if (inactivityIntervalId) {
        clearInterval(inactivityIntervalId);
        inactivityIntervalId = null;
    }
}

function showInactivityWarningModal(countdownSecs) {
    const modalEl = document.getElementById('inactivityWarningModal');
    if (!modalEl) return;

    isWarningModalShown = true;
    const countdownEl = document.getElementById('inactivityCountdownDisplay');
    const progressBar = document.getElementById('inactivityProgressBar');

    if (countdownEl) countdownEl.textContent = `${countdownSecs}s`;
    if (progressBar) {
        const pct = Math.max(0, Math.min(100, (countdownSecs / 60) * 100));
        progressBar.style.width = `${pct}%`;
    }

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
}

function hideInactivityWarningModal() {
    isWarningModalShown = false;
    const modalEl = document.getElementById('inactivityWarningModal');
    if (!modalEl) return;
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
}

async function handleAutoLogout(reason = 'inactivity') {
    if (isLoggingOut) return;
    isLoggingOut = true;

    stopInactivityTracker();
    hideInactivityWarningModal();

    // Dismiss any other open modals
    document.querySelectorAll('.modal.show').forEach(m => {
        const inst = bootstrap.Modal.getInstance(m);
        if (inst) inst.hide();
    });

    const token = getStoredToken();
    try {
        if (token) {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ token, reason })
            });
        }
    } catch (e) {
        console.warn("Auto-logout notification warning:", e);
    }

    clearUserSession();
    isLoggingOut = false;

    // Switch to Home view
    switchView('home');

    // Display prominent security notification on Home page
    const alertBox = document.getElementById('homeAutoLogoutAlert');
    const reasonText = document.getElementById('autoLogoutReasonText');
    if (alertBox) {
        if (reasonText) {
            if (reason === 'inactivity') {
                reasonText.textContent = "Your session was automatically logged out due to 10 minutes of inactivity. Please sign in again.";
            } else if (reason === 'background_tab') {
                reasonText.textContent = "Your session was safely expired due to prolonged background inactivity.";
            } else {
                reasonText.textContent = "For your security, your session has been safely logged out.";
            }
        }
        alertBox.classList.remove('d-none');
        alertBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    showToast('Auto-logged out for security.', 'warning');
}

// -------------------------------------------------------------
// TAB LEAVE & VISIBILITY DETECTION ("baher alo tr automatically logout zal pahije")
// -------------------------------------------------------------

// 1. When window/tab is closed or navigated away:
window.addEventListener('pagehide', () => {
    if (!currentUser) return;
    const token = getStoredToken();
    if (token && navigator.sendBeacon) {
        navigator.sendBeacon('/api/auth/logout', JSON.stringify({ token, reason: 'page_exit' }));
    }
});

window.addEventListener('beforeunload', () => {
    if (!currentUser) return;
    const token = getStoredToken();
    if (token && navigator.sendBeacon) {
        navigator.sendBeacon('/api/auth/logout', JSON.stringify({ token, reason: 'page_exit' }));
    }
});

// 2. When switching away from tab:
document.addEventListener('visibilitychange', () => {
    if (!currentUser) return;
    if (document.visibilityState === 'hidden') {
        tabHiddenTimestamp = Date.now();
    } else if (document.visibilityState === 'visible') {
        if (tabHiddenTimestamp) {
            const hiddenDuration = Date.now() - tabHiddenTimestamp;
            tabHiddenTimestamp = null;
            // If tab was left hidden outside for more than 10 mins, auto-logout immediately
            if (hiddenDuration >= INACTIVITY_TIMEOUT_MS) {
                handleAutoLogout('background_tab');
            } else {
                resetUserActivity();
            }
        }
    }
});

function openAuthModal(tab = 'signin') {
    const modalEl = document.getElementById('loginModal');
    if (!modalEl) return;
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    if (tab === 'register') {
        const regTabBtn = document.getElementById('tab-register-btn');
        if (regTabBtn) {
            bootstrap.Tab.getOrCreateInstance(regTabBtn).show();
        }
    } else {
        const signinTabBtn = document.getElementById('tab-signin-btn');
        if (signinTabBtn) {
            bootstrap.Tab.getOrCreateInstance(signinTabBtn).show();
        }
    }
    modal.show();
}

async function loginUser(identifier, password) {
    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: identifier, password: password })
        });
        const data = await res.json();

        if (data.success) {
            if (data.token) {
                sessionStorage.setItem('smartware_token', data.token);
            }
            setUserSession(data.user, data.token);
            
            const loginModalEl = document.getElementById('loginModal');
            if (loginModalEl) {
                const loginModal = bootstrap.Modal.getInstance(loginModalEl);
                if (loginModal) loginModal.hide();
            }

            const alertBox = document.getElementById('loginAlertBox');
            if (alertBox) alertBox.style.display = 'none';

            // Dismiss previous auto-logout alert if present
            const homeAutoAlert = document.getElementById('homeAutoLogoutAlert');
            if (homeAutoAlert) homeAutoAlert.classList.add('d-none');

            showToast(data.message || `Welcome back, ${data.user.full_name}!`, 'success');
            switchView('dashboard');
        } else {
            const msg = data.message || 'Login failed. Please check your credentials.';
            const alertBox = document.getElementById('loginAlertBox');
            if (alertBox) {
                alertBox.textContent = msg;
                alertBox.style.display = 'block';
            }
            showToast(msg, res.status === 429 ? 'danger' : 'warning');
        }
    } catch (err) {
        showToast('Login request error. Please try again.', 'danger');
    }
}

async function registerUser(userData) {
    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        const data = await res.json();
        if (data.success) {
            if (data.token) {
                sessionStorage.setItem('smartware_token', data.token);
            }
            setUserSession(data.user, data.token);

            const authModalEl = document.getElementById('loginModal');
            if (authModalEl) {
                const authModal = bootstrap.Modal.getInstance(authModalEl);
                if (authModal) authModal.hide();
            }

            const alertBox = document.getElementById('registerAlertBox');
            if (alertBox) alertBox.style.display = 'none';

            const homeAutoAlert = document.getElementById('homeAutoLogoutAlert');
            if (homeAutoAlert) homeAutoAlert.classList.add('d-none');

            showToast(data.message || `Welcome, ${data.user.full_name}!`, 'success');
            switchView('dashboard');
        } else {
            const msg = data.message || 'Registration failed. Please check form values.';
            const alertBox = document.getElementById('registerAlertBox');
            if (alertBox) {
                alertBox.textContent = msg;
                alertBox.style.display = 'block';
            }
            showToast(msg, 'warning');
        }
    } catch (err) {
        showToast('Registration error. Please try again.', 'danger');
    }
}

async function logoutUser(notify = true, reason = 'user_initiated') {
    if (isLoggingOut) return;
    isLoggingOut = true;

    stopInactivityTracker();
    hideInactivityWarningModal();

    try {
        const token = getStoredToken();
        const headers = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
        await fetch('/api/auth/logout', { method: 'POST', headers, body: JSON.stringify({ token, reason }) });
    } catch (err) {
        console.warn("Logout error:", err);
    }
    clearUserSession();
    isLoggingOut = false;

    if (notify) {
        showToast('Signed out successfully.', 'info');
    }
    if (activeView !== 'home') {
        switchView('home');
    }
}

// ==========================================================
// 2. VIEW NAVIGATION & ROUTING
// ==========================================================

function initNavigation() {
    document.querySelectorAll('.sidebar .nav-link, [data-view]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = link.getAttribute('data-view');
            if (view) {
                switchView(view);
                // Close mobile sidebar drawer if open
                const mainSidebar = document.getElementById('mainSidebar');
                if (mainSidebar) {
                    mainSidebar.classList.remove('show-mobile');
                }
            }
        });
    });

    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
    const mainSidebar = document.getElementById('mainSidebar');

    if (sidebarToggleBtn && mainSidebar) {
        sidebarToggleBtn.addEventListener('click', () => {
            mainSidebar.classList.toggle('show-mobile');
        });
    }
    if (sidebarCloseBtn && mainSidebar) {
        sidebarCloseBtn.addEventListener('click', () => {
            mainSidebar.classList.remove('show-mobile');
        });
    }
}

function updateLayoutMode(viewName) {
    const mainSidebar = document.getElementById('mainSidebar');
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    const headerBrandLogo = document.getElementById('headerBrandLogo');
    const headerSearch = document.getElementById('headerSearchWrapper');
    const headerSurge = document.getElementById('headerSurgeWrapper');
    const headerRefresh = document.getElementById('refreshAllBtn');
    const headerLastUpdated = document.getElementById('lastUpdatedBadge');
    const headerNotif = document.getElementById('headerNotifWrapper');
    const loginRegisterBtns = document.getElementById('loginRegisterBtns');

    if (viewName === 'home') {
        // HOME VIEW: Clean home page without any sidebar and single Sign In button in hero
        if (loginRegisterBtns) {
            loginRegisterBtns.classList.add('d-none');
        }
        if (mainSidebar) {
            mainSidebar.classList.add('d-none');
            mainSidebar.classList.remove('d-flex', 'show-mobile');
        }
        if (sidebarToggleBtn) {
            sidebarToggleBtn.classList.add('d-none');
        }
        if (headerBrandLogo) {
            headerBrandLogo.classList.remove('d-none');
            headerBrandLogo.classList.add('d-flex');
        }
        if (headerSearch) {
            headerSearch.classList.add('d-none');
            headerSearch.classList.remove('d-lg-flex');
        }
        if (headerSurge) {
            headerSurge.classList.add('d-none');
            headerSurge.classList.remove('d-xl-flex');
        }
        if (headerRefresh) {
            headerRefresh.classList.add('d-none');
            headerRefresh.classList.remove('d-flex');
        }
        if (headerLastUpdated) {
            headerLastUpdated.classList.add('d-none');
            headerLastUpdated.classList.remove('d-sm-inline-block');
        }
        if (headerNotif) {
            headerNotif.classList.add('d-none');
        }
    } else {
        // OPERATIONAL MODULE VIEWS (after login / registration):
        // Show sidebars!
        if (mainSidebar) {
            mainSidebar.classList.remove('d-none');
            mainSidebar.classList.add('d-flex');
            mainSidebar.classList.remove('show-mobile');
        }
        if (sidebarToggleBtn) {
            sidebarToggleBtn.classList.remove('d-none');
        }
        if (headerBrandLogo) {
            // Hide header brand on desktop to avoid duplicate logo with sidebar
            headerBrandLogo.classList.add('d-none');
            headerBrandLogo.classList.remove('d-flex');
        }
        if (headerSearch) {
            headerSearch.classList.remove('d-none');
            headerSearch.classList.add('d-lg-flex');
        }
        if (headerSurge) {
            headerSurge.classList.remove('d-none');
            headerSurge.classList.add('d-xl-flex');
        }
        if (headerRefresh) {
            headerRefresh.classList.remove('d-none');
            headerRefresh.classList.add('d-flex');
        }
        if (headerLastUpdated) {
            headerLastUpdated.classList.remove('d-none');
            headerLastUpdated.classList.add('d-sm-inline-block');
        }
        if (headerNotif) {
            headerNotif.classList.remove('d-none');
        }
    }
}

function switchView(viewName) {
    // Protected views require authentication (Home is public)
    if (viewName !== 'home') {
        if (!currentUser) {
            showToast('Please sign in to access warehouse operations.', 'warning');
            openAuthModal('signin');
            return; // Block navigation
        }
    }

    activeView = viewName;

    // Update layout mode (hide sidebar on home, show sidebar on operational views)
    updateLayoutMode(viewName);

    // Update active nav links
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        if (link.getAttribute('data-view') === viewName) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Hide all views
    document.querySelectorAll('.app-view').forEach(view => {
        view.classList.add('d-none');
    });

    // Show target view
    const target = document.getElementById(`view-${viewName}`);
    if (target) {
        target.classList.remove('d-none');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Refresh view-specific data
    if (viewName === 'dashboard') loadDashboardData();
    else if (viewName === 'products') loadProductsData();
    else if (viewName === 'movements') loadMovementsData();
    else if (viewName === 'warehouses') loadWarehousesData();
    else if (viewName === 'transfers') loadTransfersData();
    else if (viewName === 'purchasing') loadPurchasesData();
    else if (viewName === 'sales') loadSalesData();
    else if (viewName === 'returns') loadReturnsData();
    else if (viewName === 'ai') loadAiData();
    else if (viewName === 'audit') loadAuditLogsData();
    else if (viewName === 'notifications') loadNotificationsData();
}

// ==========================================================
// 3. LOOKUPS & CORE MASTER DATA
// ==========================================================

async function loadMasterLookupData() {
    try {
        const [whRes, supRes, custRes, prodRes] = await Promise.all([
            fetch('/api/warehouses'),
            fetch('/api/suppliers'),
            fetch('/api/customers'),
            fetch('/api/products')
        ]);

        const whData = await whRes.json();
        allWarehouses = whData.warehouses || [];
        allLocations = whData.locations || [];

        const supData = await supRes.json();
        allSuppliers = supData.suppliers || [];

        const custData = await custRes.json();
        allCustomers = custData.customers || [];

        const prodData = await prodRes.json();
        allProducts = prodData.products || [];

        populateDropdowns();
    } catch (err) {
        console.error("Master lookup load error:", err);
    }
}

function populateDropdowns() {
    // Populate Warehouse dropdowns
    const whSelects = ['filterWarehouseSelect', 'addWarehouseSelect', 'poWarehouseSelect', 'soWarehouseSelect', 'trfSourceSelect', 'trfDestSelect', 'retWarehouseSelect'];
    whSelects.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const currentVal = el.value;
        el.innerHTML = id.startsWith('filter') ? '<option value="">All Warehouses</option>' : '';
        allWarehouses.forEach(w => {
            const opt = document.createElement('option');
            opt.value = w.id;
            opt.textContent = `${w.name} (${w.city})`;
            el.appendChild(opt);
        });
        if (currentVal) el.value = currentVal;
    });

    // Populate Supplier dropdowns
    const supSelects = ['addSupplierSelect', 'poSupplierSelect'];
    supSelects.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = '';
        allSuppliers.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = `${s.name} (${s.country})`;
            el.appendChild(opt);
        });
    });

    // Populate Customer dropdowns
    const custSelect = document.getElementById('soCustomerSelect');
    if (custSelect) {
        custSelect.innerHTML = '';
        allCustomers.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = `${c.name} (${c.city})`;
            custSelect.appendChild(opt);
        });
    }

    // Populate Product dropdowns for orders and transfers
    const prodSelects = ['poProductSelect', 'soProductSelect', 'trfProductSelect', 'retProductSelect'];
    prodSelects.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = '';
        allProducts.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = `${p.sku} - ${p.name} (Stock: ${p.quantity})`;
            opt.dataset.price = p.purchase_price;
            opt.dataset.sell = p.selling_price;
            opt.dataset.qty = p.quantity;
            el.appendChild(opt);
        });
    });

    // Category filter dropdown
    const catSelect = document.getElementById('filterCategorySelect');
    if (catSelect) {
        const categories = [...new Set(allProducts.map(p => p.category))];
        catSelect.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c;
            catSelect.appendChild(opt);
        });
    }
}

// ==========================================================
// 4. EXECUTIVE DASHBOARD DATA & CHARTS
// ==========================================================

async function loadDashboardData() {
    try {
        const res = await fetch(`/api/dashboard?drift=${driftMultiplier}`);
        const data = await res.json();
        const a = data.analytics;
        lastDashboardAnalytics = a;

        // KPI metrics
        setText('kpiTotalSkus', a.total_skus);
        setText('kpiTotalUnits', (a.total_units || 0).toLocaleString());
        setText('kpiTotalValuation', formatCurrency(a.total_valuation));
        setText('kpiPotentialRevenue', formatCurrency(a.total_potential_revenue));
        setText('kpiGrossMargin', `${a.gross_margin_percent}%`);
        setText('kpiLowStockCount', a.low_stock_count);
        setText('kpiCriticalCount', a.critical_stock_count);
        setText('kpiPendingPos', data.pending_pos_count);
        setText('kpiSalesDispatched', formatCurrency(data.total_sales_value));
        setText('kpiAvgHealth', `${a.average_health_score} / 100`);

        // Badges in sidebar
        setText('pendingPoBadge', data.pending_pos_count);
        setText('pendingSoBadge', data.pending_sos_count);

        // Low stock reorders table
        renderDashboardLowStock(a.reorder_recommendations);

        // Recent movements
        renderRecentMovements(data.recent_movements);

        // Charts
        renderCategoryDoughnut(a.category_summary);
        renderStockHealthBar(a);

        // Notifications count
        updateUnreadNotificationsCount(data.unread_notifications_count);
    } catch (err) {
        console.error("Error loading dashboard:", err);
    }
}

function renderDashboardLowStock(reorders) {
    const tbody = document.getElementById('lowStockTableBody');
    if (!tbody) return;

    if (!reorders || reorders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-success"><i class="bi bi-check-circle-fill me-1"></i>All inventory items are currently at or above healthy safety thresholds!</td></tr>`;
        return;
    }

    tbody.innerHTML = reorders.map(item => `
        <tr>
            <td class="fw-bold">${escapeHtml(item.name)}</td>
            <td><code class="text-primary fw-semibold">${escapeHtml(item.sku)}</code></td>
            <td><span class="badge bg-light text-dark border">${escapeHtml(item.warehouse_name)}</span></td>
            <td><span class="fw-bold ${item.current_stock <= item.min_stock ? 'text-danger' : 'text-warning'}">${item.current_stock}</span></td>
            <td>${item.min_stock}</td>
            <td class="fw-bold text-primary">+${item.suggested_reorder_qty} units</td>
            <td>
                <span class="${item.shortage_risk === 'CRITICAL' ? 'badge-critical' : 'badge-low-stock'}">
                    ${item.shortage_risk}
                </span>
            </td>
            <td class="text-end">
                ${item.has_pending_po 
                    ? `<span class="badge bg-secondary">PO in Progress</span>`
                    : `<button class="btn btn-sm btn-outline-primary fw-semibold quick-po-btn" data-pid="${item.product_id}" data-qty="${item.suggested_reorder_qty}" data-sup="${item.supplier_id}">
                         <i class="bi bi-cart-plus me-1"></i>Order Now
                       </button>`
                }
            </td>
        </tr>
    `).join('');

    // Attach quick PO button handlers
    tbody.querySelectorAll('.quick-po-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const pId = btn.dataset.pid;
            const qty = parseInt(btn.dataset.qty);
            const supId = btn.dataset.sup;

            const product = allProducts.find(p => p.id === pId);
            const poData = {
                supplier_id: supId || (allSuppliers[0] ? allSuppliers[0].id : 'default'),
                warehouse_id: product ? product.warehouse_id : (allWarehouses[0] ? allWarehouses[0].id : 'wh-central'),
                total_amount: qty * (product ? product.purchase_price : 100),
                expected_delivery: getFutureDate(7),
                items: [{
                    product_id: pId,
                    quantity: qty,
                    unit_cost: product ? product.purchase_price : 100
                }]
            };

            btn.disabled = true;
            btn.innerHTML = `<span class="spin-icon">↻</span> Generating...`;

            try {
                const res = await fetch('/api/purchase_orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(poData)
                });
                const d = await res.json();
                if (d.success) {
                    showToast(`Created Purchase Order ${d.po_number}!`, 'success');
                    loadDashboardData();
                }
            } catch (e) {
                showToast('Failed to create quick PO', 'danger');
            }
        });
    });
}

function renderRecentMovements(movements) {
    const tbody = document.getElementById('dashboardRecentMovementsBody');
    if (!tbody) return;

    if (!movements || movements.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-3 text-muted">No stock movements recorded yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = movements.slice(0, 10).map(m => {
        const isPositive = m.quantity > 0;
        return `
            <tr>
                <td class="text-muted small">${formatDateTime(m.created_at)}</td>
                <td><code class="fw-semibold text-primary">${escapeHtml(m.product_sku)}</code></td>
                <td><span class="badge ${getMovementBadgeClass(m.movement_type)}">${m.movement_type}</span></td>
                <td class="fw-bold ${isPositive ? 'text-success' : 'text-danger'}">${isPositive ? '+' : ''}${m.quantity}</td>
                <td class="fw-semibold">${m.new_quantity}</td>
                <td><span class="badge bg-light text-dark border">${escapeHtml(m.warehouse_code || 'HUB')}</span></td>
                <td class="text-truncate" style="max-width: 180px;" title="${escapeHtml(m.reason || m.reference || '')}">
                    ${escapeHtml(m.reason || m.reference || 'Stock update')}
                </td>
                <td class="small text-muted">${escapeHtml(m.user_id || 'System')}</td>
            </tr>
        `;
    }).join('');
}

function renderCategoryDoughnut(categorySummary) {
    const canvas = document.getElementById('chartCategoryDoughnut');
    if (!canvas) return;

    const labels = Object.keys(categorySummary || {});
    const values = labels.map(k => categorySummary[k].valuation);

    if (chartCategory) {
        chartCategory.destroy();
    }

    const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
    const doughnutBorderColor = isDark ? '#0f172a' : '#ffffff';
    const legendTextColor = isDark ? '#cbd5e1' : '#475569';
    const colors = ['#2563eb', '#10b981', '#f59e0b', '#7c3aed', '#0284c7', '#ec4899'];

    chartCategory = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: doughnutBorderColor
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { 
                        boxWidth: 12, 
                        color: legendTextColor,
                        font: { family: 'Plus Jakarta Sans', size: 11 } 
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => ` ₹${Number(ctx.raw).toLocaleString(undefined, {minimumFractionDigits: 2})}`
                    }
                }
            },
            cutout: '65%'
        }
    });
}

function renderStockHealthBar(analytics) {
    const canvas = document.getElementById('chartStockHealthBar');
    if (!canvas) return;

    if (chartHealth) {
        chartHealth.destroy();
    }

    const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
    const gridColor = isDark ? '#1e293b' : '#f1f5f9';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    const healthy = analytics.healthy_stock_count || 0;
    const low = analytics.low_stock_count || 0;
    const critical = analytics.critical_stock_count || 0;
    const outOfStock = analytics.out_of_stock_count || 0;

    chartHealth = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: ['Healthy (>Reorder)', 'Low Stock', 'Critical Stock', 'Out of Stock'],
            datasets: [{
                label: 'SKU Count',
                data: [healthy, low, critical, outOfStock],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#64748b'],
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { 
                        stepSize: 1, 
                        color: textColor,
                        font: { family: 'Plus Jakarta Sans' } 
                    },
                    grid: { color: gridColor }
                },
                x: {
                    grid: { display: false },
                    ticks: { 
                        color: textColor,
                        font: { family: 'Plus Jakarta Sans', size: 11 } 
                    }
                }
            }
        }
    });
}

// ==========================================================
// 5. MASTER PRODUCTS CATALOG
// ==========================================================

async function loadProductsData() {
    try {
        const res = await fetch('/api/products');
        const data = await res.json();
        allProducts = data.products || [];
        renderProductsTable();
    } catch (err) {
        console.error("Error loading products:", err);
    }
}

function renderProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    const searchVal = (document.getElementById('filterProductSearch')?.value || '').toLowerCase().trim();
    const catVal = document.getElementById('filterCategorySelect')?.value || '';
    const whVal = document.getElementById('filterWarehouseSelect')?.value || '';
    const statusVal = document.getElementById('filterStockStatusSelect')?.value || '';

    const filtered = allProducts.filter(p => {
        const matchSearch = !searchVal || 
            p.sku.toLowerCase().includes(searchVal) || 
            p.name.toLowerCase().includes(searchVal) || 
            (p.barcode && p.barcode.toLowerCase().includes(searchVal));
        const matchCat = !catVal || p.category === catVal;
        const matchWh = !whVal || p.warehouse_id === whVal;

        let status = 'HEALTHY';
        if (p.quantity === 0) status = 'OUT_OF_STOCK';
        else if (p.quantity <= p.min_stock_level) status = 'CRITICAL';
        else if (p.quantity <= p.reorder_point) status = 'LOW_STOCK';

        const matchStatus = !statusVal || status === statusVal;

        return matchSearch && matchCat && matchWh && matchStatus;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">No products match current filters.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(p => {
        let statusBadge = `<span class="badge-healthy">Healthy</span>`;
        if (p.quantity === 0) {
            statusBadge = `<span class="badge-out-of-stock">Out of Stock</span>`;
        } else if (p.quantity <= p.min_stock_level) {
            statusBadge = `<span class="badge-critical">Critical</span>`;
        } else if (p.quantity <= p.reorder_point) {
            statusBadge = `<span class="badge-low-stock">Low Stock</span>`;
        }

        const binDisplay = p.location_code || `${p.warehouse_name || 'HUB'} - ${p.rack || 'R01'}-${p.shelf || 'S01'}-${p.bin || 'B01'}`;

        return `
            <tr>
                <td><code class="fw-bold text-primary">${escapeHtml(p.sku)}</code></td>
                <td>
                    <div class="fw-bold text-dark">${escapeHtml(p.name)}</div>
                    <small class="text-muted font-mono" style="font-size: 0.72rem;">Bar: ${escapeHtml(p.barcode || p.sku)}</small>
                </td>
                <td><span class="badge bg-light text-secondary border">${escapeHtml(p.category)}</span></td>
                <td>
                    <div class="small fw-semibold text-dark">${escapeHtml(p.warehouse_name || 'Central Hub')}</div>
                    <code class="text-muted" style="font-size: 0.72rem;">${escapeHtml(binDisplay)}</code>
                </td>
                <td>
                    <span class="fs-6 fw-bold ${p.quantity <= p.min_stock_level ? 'text-danger' : 'text-dark'}">${p.quantity}</span>
                    <small class="text-muted">${p.unit || 'pcs'}</small>
                </td>
                <td>${statusBadge}</td>
                <td>₹${Number(p.purchase_price).toFixed(2)}</td>
                <td class="fw-bold text-dark">₹${Number(p.selling_price).toFixed(2)}</td>
                <td class="text-end">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary adjust-stock-btn" data-id="${p.id}" data-name="${escapeHtml(p.name)}" data-sku="${p.sku}" data-qty="${p.quantity}" title="Stock Adjustment (+/-)">
                            <i class="bi bi-sliders"></i>
                        </button>
                        <button class="btn btn-outline-secondary print-badge-btn" data-id="${p.id}" title="Print Thermal Label & QR Badge">
                            <i class="bi bi-printer"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Attach event listeners to buttons
    tbody.querySelectorAll('.adjust-stock-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            openStockAdjustModal(btn.dataset.id, btn.dataset.name, btn.dataset.sku, btn.dataset.qty);
        });
    });

    tbody.querySelectorAll('.print-badge-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const product = allProducts.find(p => p.id === btn.dataset.id);
            if (product) openThermalBadgeModal(product);
        });
    });
}

// ==========================================================
// 6. STOCK ADJUSTMENTS & THERMAL LABELS
// ==========================================================

function openStockAdjustModal(id, name, sku, qty) {
    document.getElementById('adjustProductId').value = id;
    document.getElementById('adjustProductName').textContent = name;
    document.getElementById('adjustProductSku').textContent = `SKU: ${sku}`;
    document.getElementById('adjustCurrentStock').textContent = qty;
    document.getElementById('adjustQtyChange').value = '';
    document.getElementById('adjustNotesInput').value = '';
    document.getElementById('adjustAlertBox').style.display = 'none';

    const modal = new bootstrap.Modal(document.getElementById('stockAdjustModal'));
    modal.show();
}

function openThermalBadgeModal(p) {
    document.getElementById('badgeProductName').textContent = p.name;
    document.getElementById('badgeSku').textContent = `SKU: ${p.sku}`;
    document.getElementById('badgeBarcodeText').textContent = p.barcode || p.sku;
    document.getElementById('badgeCategory').textContent = p.category;
    document.getElementById('badgePrice').textContent = `₹${Number(p.selling_price).toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    
    const loc = p.location_code || `${p.warehouse_name || 'CENTRAL'}-R01-S02-B04`;
    document.getElementById('badgeLocation').textContent = loc;

    // Render Clean SVG QR Representation
    const qrBox = document.getElementById('badgeQrContainer');
    qrBox.innerHTML = `
        <svg viewBox="0 0 100 100" width="100" height="100">
            <rect width="100" height="100" fill="#ffffff" />
            <!-- Corner Position Markers -->
            <rect x="10" y="10" width="24" height="24" fill="#000000" />
            <rect x="14" y="14" width="16" height="16" fill="#ffffff" />
            <rect x="18" y="18" width="8" height="8" fill="#000000" />

            <rect x="66" y="10" width="24" height="24" fill="#000000" />
            <rect x="70" y="14" width="16" height="16" fill="#ffffff" />
            <rect x="74" y="18" width="8" height="8" fill="#000000" />

            <rect x="10" y="66" width="24" height="24" fill="#000000" />
            <rect x="14" y="70" width="16" height="16" fill="#ffffff" />
            <rect x="18" y="74" width="8" height="8" fill="#000000" />

            <!-- Dynamic QR Matrix Pattern Simulation -->
            <rect x="42" y="12" width="6" height="12" fill="#000000" />
            <rect x="52" y="18" width="8" height="6" fill="#000000" />
            <rect x="42" y="32" width="16" height="6" fill="#000000" />
            <rect x="12" y="42" width="8" height="14" fill="#000000" />
            <rect x="28" y="44" width="6" height="12" fill="#000000" />
            <rect x="42" y="44" width="16" height="16" fill="#000000" />
            <rect x="66" y="42" width="12" height="8" fill="#000000" />
            <rect x="82" y="44" width="8" height="14" fill="#000000" />
            <rect x="44" y="68" width="14" height="6" fill="#000000" />
            <rect x="64" y="66" width="8" height="14" fill="#000000" />
            <rect x="78" y="72" width="12" height="10" fill="#000000" />
        </svg>
    `;

    const modal = new bootstrap.Modal(document.getElementById('thermalPrintBadgeModal'));
    modal.show();
}

// ==========================================================
// 7. STOCK MOVEMENTS LEDGER
// ==========================================================

async function loadMovementsData() {
    try {
        const res = await fetch('/api/movements');
        const data = await res.json();
        const movements = data.movements || [];

        const tbody = document.getElementById('movementsTableBody');
        if (!tbody) return;

        if (movements.length === 0) {
            tbody.innerHTML = `<tr><td colspan="10" class="text-center py-4 text-muted">No stock movement entries recorded yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = movements.map(m => {
            const isPos = m.quantity > 0;
            return `
                <tr>
                    <td class="text-muted small">${formatDateTime(m.created_at)}</td>
                    <td>
                        <div class="fw-bold text-dark">${escapeHtml(m.product_name || '')}</div>
                        <code class="text-primary">${escapeHtml(m.product_sku)}</code>
                    </td>
                    <td><span class="badge bg-light text-dark border">${escapeHtml(m.warehouse_code || 'HUB')}</span></td>
                    <td><span class="badge ${getMovementBadgeClass(m.movement_type)}">${m.movement_type}</span></td>
                    <td class="fw-bold ${isPos ? 'text-success' : 'text-danger'}">${isPos ? '+' : ''}${m.quantity}</td>
                    <td>${m.previous_quantity}</td>
                    <td class="fw-bold text-dark">${m.new_quantity}</td>
                    <td><span class="small text-muted font-mono">${escapeHtml(m.reference || '--')}</span></td>
                    <td>${escapeHtml(m.reason || '')}</td>
                    <td class="small text-muted">${escapeHtml(m.user_id || 'System')}</td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.error("Error loading movements:", err);
    }
}

// ==========================================================
// 8. WAREHOUSES & LOCATIONS
// ==========================================================

async function loadWarehousesData() {
    try {
        const res = await fetch('/api/warehouses');
        const data = await res.json();
        const warehouses = data.warehouses || [];
        const locations = data.locations || [];
        allWarehouses = warehouses;
        allLocations = locations;

        // 1. Render Facility Hub Cards
        const cardContainer = document.getElementById('warehousesCardsContainer');
        if (cardContainer) {
            cardContainer.innerHTML = warehouses.map(w => {
                const usedPct = Math.min(100, Math.round((w.used_sqft / Math.max(1, w.capacity_sqft)) * 100));
                return `
                    <div class="col-md-6 col-xl-3">
                        <div class="card border-0 shadow-sm rounded-4 p-3 h-100">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <h6 class="fw-bold mb-0">${escapeHtml(w.name)}</h6>
                                    <small class="text-muted"><i class="bi bi-geo-alt me-1"></i>${escapeHtml(w.city)}</small>
                                </div>
                                <span class="badge bg-primary-subtle text-primary fw-bold font-mono">${escapeHtml(w.code)}</span>
                            </div>
                            <div class="my-3">
                                <div class="d-flex justify-content-between small mb-1">
                                    <span class="text-muted">Storage Utilization</span>
                                    <span class="fw-bold">${usedPct}%</span>
                                </div>
                                <div class="progress" style="height: 6px;">
                                    <div class="progress-bar ${usedPct > 80 ? 'bg-danger' : (usedPct > 60 ? 'bg-warning' : 'bg-primary')}" style="width: ${usedPct}%"></div>
                                </div>
                            </div>
                            <div class="small text-secondary mt-auto">
                                <div>Manager: <strong class="text-dark">${escapeHtml(w.manager_name || 'N/A')}</strong></div>
                                <div>Capacity: <strong>${(w.capacity_sqft || 0).toLocaleString()} sq.ft.</strong></div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // 2. Render Inventory Density Heatmap (D3.js & Chart.js)
        if (data.density) {
            renderInventoryDensityHeatmap(data.density);
        } else {
            await reloadHeatmapData();
        }

        // 3. Render Locations Table with utilization columns
        renderLocationsTable(locations);
    } catch (err) {
        console.error("Error loading warehouses:", err);
    }
}

// -------------------------------------------------------------
// INVENTORY DENSITY HEATMAP CONTROLLERS (D3.js & Chart.js)
// -------------------------------------------------------------

function initInventoryHeatmap() {
    const filterSelect = document.getElementById('heatmapWarehouseFilter');
    const modePctBtn = document.getElementById('heatmapModePctBtn');
    const modeUnitsBtn = document.getElementById('heatmapModeUnitsBtn');
    const hotspotBtn = document.getElementById('heatmapHighlightHotspotsBtn');
    const resetFilterBtn = document.getElementById('resetBinsFilterBtn');

    if (filterSelect) {
        filterSelect.addEventListener('change', async (e) => {
            currentHeatmapFilter = e.target.value;
            await reloadHeatmapData();
        });
    }

    if (modePctBtn && modeUnitsBtn) {
        modePctBtn.addEventListener('click', () => {
            currentHeatmapMode = 'pct';
            modePctBtn.classList.add('active');
            modeUnitsBtn.classList.remove('active');
            if (currentHeatmapData) renderD3HeatmapSvg(currentHeatmapData);
        });
        modeUnitsBtn.addEventListener('click', () => {
            currentHeatmapMode = 'units';
            modeUnitsBtn.classList.add('active');
            modePctBtn.classList.remove('active');
            if (currentHeatmapData) renderD3HeatmapSvg(currentHeatmapData);
        });
    }

    if (hotspotBtn) {
        hotspotBtn.addEventListener('click', () => {
            isHotspotsOnly = !isHotspotsOnly;
            if (isHotspotsOnly) {
                hotspotBtn.classList.remove('btn-outline-danger');
                hotspotBtn.classList.add('btn-danger', 'text-white');
                hotspotBtn.innerHTML = `<i class="bi bi-x-circle me-1"></i>Clear Hotspot Filter`;
            } else {
                hotspotBtn.classList.remove('btn-danger', 'text-white');
                hotspotBtn.classList.add('btn-outline-danger');
                hotspotBtn.innerHTML = `<i class="bi bi-lightning-charge me-1"></i>Filter Hotspots (&gt;75%)`;
            }
            if (currentHeatmapData) renderD3HeatmapSvg(currentHeatmapData);
        });
    }

    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', () => {
            clearBinSelectionFilter();
        });
    }

    window.addEventListener('resize', () => {
        if (activeView === 'warehouses' && currentHeatmapData) {
            renderD3HeatmapSvg(currentHeatmapData);
        }
    });
}

async function reloadHeatmapData() {
    try {
        const url = currentHeatmapFilter && currentHeatmapFilter !== 'ALL'
            ? `/api/inventory/density?warehouse_id=${encodeURIComponent(currentHeatmapFilter)}`
            : '/api/inventory/density';
        const res = await fetch(url);
        const data = await res.json();
        renderInventoryDensityHeatmap(data);
    } catch (err) {
        console.error("Error reloading heatmap data:", err);
    }
}

function getDensityColor(pct) {
    if (pct <= 0) return '#f1f5f9';
    if (pct < 25) return '#10b981'; // Mint / Low
    if (pct < 50) return '#06b6d4'; // Cyan
    if (pct < 70) return '#3b82f6'; // Royal Blue
    if (pct < 85) return '#f59e0b'; // Amber / High
    return '#ef4444'; // Red / Critical Peak Hotspot
}

function getDensityTextColor(pct) {
    if (pct <= 0) return '#64748b';
    return '#ffffff';
}

function renderInventoryDensityHeatmap(densityData) {
    if (!densityData) return;
    currentHeatmapData = densityData;

    // 1. Populate Warehouse Filter if empty or has 1 option
    const filterSelect = document.getElementById('heatmapWarehouseFilter');
    if (filterSelect && filterSelect.options.length <= 1 && allWarehouses.length > 0) {
        allWarehouses.forEach(w => {
            const opt = document.createElement('option');
            opt.value = w.id;
            opt.textContent = `${w.name} (${w.code})`;
            filterSelect.appendChild(opt);
        });
    }

    // 2. Update KPI metrics
    const peakRackEl = document.getElementById('densityPeakRack');
    const peakRackDetailEl = document.getElementById('densityPeakRackDetail');
    if (peakRackEl && densityData.peak_rack) {
        const pr = densityData.peak_rack;
        peakRackEl.textContent = `${pr.warehouse_code || 'HUB'} ${pr.rack}`;
        if (peakRackDetailEl) {
            peakRackDetailEl.textContent = `${pr.utilization_pct}% utilized (${pr.total_units} / ${pr.total_capacity} units)`;
        }
    } else if (peakRackEl) {
        peakRackEl.textContent = 'N/A';
    }

    const avgEl = document.getElementById('densityAvgUtilization');
    const avgDetailEl = document.getElementById('densityAvgDetail');
    if (avgEl) {
        avgEl.textContent = `${densityData.avg_utilization_pct || 0}%`;
        if (avgDetailEl) {
            avgDetailEl.textContent = `${(densityData.total_stored_units || 0).toLocaleString()} of ${(densityData.total_capacity || 0).toLocaleString()} units stored`;
        }
    }

    const hotspotEl = document.getElementById('densityHotspotCount');
    const hotspotDetailEl = document.getElementById('densityHotspotDetail');
    if (hotspotEl) {
        const count = densityData.hotspots_count || (densityData.hotspots ? densityData.hotspots.length : 0);
        hotspotEl.textContent = count;
        if (hotspotDetailEl) {
            hotspotDetailEl.textContent = count > 0 ? `${count} bin racks require load rebalancing` : 'Optimal storage load across bins';
        }
    }

    const totalUnitsEl = document.getElementById('densityTotalUnits');
    const availSpaceEl = document.getElementById('densityAvailableSpace');
    if (totalUnitsEl) {
        totalUnitsEl.textContent = `${(densityData.total_stored_units || 0).toLocaleString()} / ${(densityData.total_capacity || 0).toLocaleString()}`;
        if (availSpaceEl) {
            availSpaceEl.textContent = `Available: ${(densityData.available_capacity || 0).toLocaleString()} units`;
        }
    }

    // 3. Render D3 2D Heatmap SVG
    renderD3HeatmapSvg(densityData);

    // 4. Render Chart.js Rack Utilization Leaderboard
    renderRackUtilizationChart(densityData.racks_ranked || []);
}

function renderD3HeatmapSvg(densityData) {
    const container = document.getElementById('d3InventoryHeatmapContainer');
    if (!container || typeof d3 === 'undefined') return;

    // Clear previous SVG
    d3.select(container).selectAll('*').remove();

    let locations = densityData.locations || [];
    if (isHotspotsOnly) {
        locations = locations.filter(l => l.utilization_pct >= 75);
    }

    if (locations.length === 0) {
        container.innerHTML = `
            <div class="d-flex flex-column align-items-center justify-content-center p-5 text-muted">
                <i class="bi bi-inbox fs-1 mb-2"></i>
                <div class="fw-semibold">No storage bins match current filter</div>
                <small>Try selecting "All Warehouses" or clearing the hotspot filter.</small>
            </div>
        `;
        return;
    }

    const warehouseCodes = Array.from(new Set(locations.map(l => l.warehouse_code || 'HUB'))).sort();
    const racks = Array.from(new Set(locations.map(l => l.rack))).sort();
    const shelves = Array.from(new Set(locations.map(l => l.shelf))).sort();

    const locMap = new Map();
    locations.forEach(l => {
        const key = `${l.warehouse_code || 'HUB'}::${l.rack}::${l.shelf}`;
        if (!locMap.has(key)) {
            locMap.set(key, []);
        }
        locMap.get(key).push(l);
    });

    const isMultiWarehouse = warehouseCodes.length > 1;
    const containerWidth = Math.max(620, container.clientWidth || 700);
    const margin = { top: 48, right: 30, bottom: 35, left: 80 };

    const columns = [];
    if (isMultiWarehouse) {
        warehouseCodes.forEach(wh => {
            const whRacks = Array.from(new Set(locations.filter(l => l.warehouse_code === wh).map(l => l.rack))).sort();
            whRacks.forEach(r => {
                columns.push({ warehouseCode: wh, rack: r, label: `${wh.replace('WH-', '')} ${r}`, fullLabel: `${wh} Rack ${r}` });
            });
        });
    } else {
        const wh = warehouseCodes[0] || 'HUB';
        racks.forEach(r => {
            columns.push({ warehouseCode: wh, rack: r, label: `Rack ${r}`, fullLabel: `${wh} Rack ${r}` });
        });
    }

    const cellWidth = Math.max(85, Math.floor((containerWidth - margin.left - margin.right) / Math.max(1, columns.length)));
    const cellHeight = 65;
    const width = margin.left + margin.right + columns.length * cellWidth;
    const height = margin.top + margin.bottom + shelves.length * cellHeight;

    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('display', 'block')
        .style('overflow', 'visible');

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Column Headers (Racks)
    const colLabels = g.append('g').attr('class', 'col-headers');
    columns.forEach((col, i) => {
        const x = i * cellWidth + cellWidth / 2;
        colLabels.append('text')
            .attr('x', x)
            .attr('y', -20)
            .attr('text-anchor', 'middle')
            .attr('font-size', '11px')
            .attr('font-weight', '700')
            .attr('fill', '#334155')
            .text(col.label);

        colLabels.append('text')
            .attr('x', x)
            .attr('y', -6)
            .attr('text-anchor', 'middle')
            .attr('font-size', '9px')
            .attr('font-weight', '600')
            .attr('fill', '#94a3b8')
            .text('RACK');
    });

    // Row Headers (Shelves)
    const rowLabels = g.append('g').attr('class', 'row-headers');
    shelves.forEach((s, j) => {
        const y = j * cellHeight + cellHeight / 2;
        rowLabels.append('text')
            .attr('x', -12)
            .attr('y', y + 4)
            .attr('text-anchor', 'end')
            .attr('font-size', '11px')
            .attr('font-weight', '600')
            .attr('fill', '#475569')
            .text(`Shelf ${s}`);
    });

    // Heatmap Grid Cells
    columns.forEach((col, i) => {
        shelves.forEach((shelf, j) => {
            const x = i * cellWidth;
            const y = j * cellHeight;
            const key = `${col.warehouseCode}::${col.rack}::${shelf}`;
            const matchedBins = locMap.get(key) || [];

            if (matchedBins.length === 0) {
                // Empty shelf slot
                g.append('rect')
                    .attr('x', x + 3)
                    .attr('y', y + 3)
                    .attr('width', cellWidth - 6)
                    .attr('height', cellHeight - 6)
                    .attr('rx', 8)
                    .attr('ry', 8)
                    .attr('fill', '#f8fafc')
                    .attr('stroke', '#e2e8f0')
                    .attr('stroke-dasharray', '3 3');

                g.append('text')
                    .attr('x', x + cellWidth / 2)
                    .attr('y', y + cellHeight / 2 + 3)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', '10px')
                    .attr('fill', '#cbd5e1')
                    .text('--');
                return;
            }

            const primary = matchedBins[0];
            const avgPct = primary.utilization_pct;
            const isHotspot = avgPct >= 75;
            const isCritical = avgPct >= 90;
            const isSelected = selectedHeatmapCell && selectedHeatmapCell.location_code === primary.location_code;

            const cellGroup = g.append('g')
                .attr('class', 'heatmap-cell')
                .style('cursor', 'pointer');

            const cellRect = cellGroup.append('rect')
                .attr('x', x + 3)
                .attr('y', y + 3)
                .attr('width', cellWidth - 6)
                .attr('height', cellHeight - 6)
                .attr('rx', 8)
                .attr('ry', 8)
                .attr('fill', getDensityColor(avgPct))
                .attr('stroke', isSelected ? '#1e293b' : (isCritical ? '#dc2626' : (isHotspot ? '#ea580c' : '#ffffff')))
                .attr('stroke-width', isSelected ? 3 : (isHotspot ? 2 : 1))
                .style('transition', 'all 0.18s ease-in-out');

            if (isCritical) {
                cellRect.style('filter', 'drop-shadow(0 2px 4px rgba(220, 38, 38, 0.35))');
            }

            // Bin Code
            cellGroup.append('text')
                .attr('x', x + cellWidth / 2)
                .attr('y', y + 24)
                .attr('text-anchor', 'middle')
                .attr('font-size', '11px')
                .attr('font-weight', '700')
                .attr('fill', getDensityTextColor(avgPct))
                .text(`Bin ${primary.bin}`);

            // Metric Value
            const metricText = currentHeatmapMode === 'units'
                ? `${primary.stored_units}/${primary.capacity}`
                : `${avgPct}%`;

            cellGroup.append('text')
                .attr('x', x + cellWidth / 2)
                .attr('y', y + 42)
                .attr('text-anchor', 'middle')
                .attr('font-size', '10px')
                .attr('font-weight', '600')
                .attr('fill', getDensityTextColor(avgPct))
                .text(metricText);

            if (isHotspot) {
                cellGroup.append('text')
                    .attr('x', x + cellWidth - 14)
                    .attr('y', y + 16)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', '10px')
                    .text('🔥');
            }

            cellGroup.on('mouseenter', (event) => {
                cellRect.attr('stroke-width', 3).attr('stroke', '#0f172a');
                showHeatmapTooltip(event, primary, matchedBins);
            });

            cellGroup.on('mousemove', (event) => {
                moveHeatmapTooltip(event);
            });

            cellGroup.on('mouseleave', () => {
                cellRect.attr('stroke-width', isSelected ? 3 : (isHotspot ? 2 : 1))
                         .attr('stroke', isSelected ? '#1e293b' : (isCritical ? '#dc2626' : (isHotspot ? '#ea580c' : '#ffffff')));
                hideHeatmapTooltip();
            });

            cellGroup.on('click', () => {
                selectHeatmapCell(primary);
            });
        });
    });
}

function showHeatmapTooltip(event, loc, allMatchedBins) {
    const tooltip = document.getElementById('d3HeatmapTooltip');
    if (!tooltip) return;

    const prods = loc.products || [];
    const prodsListHtml = prods.length > 0
        ? prods.slice(0, 3).map(p => `<div>&bull; <strong class="text-white">${escapeHtml(p.sku)}</strong>: ${escapeHtml(p.name)} <span class="text-info">(${p.quantity} pcs)</span></div>`).join('') + (prods.length > 3 ? `<div class="text-muted">+${prods.length - 3} more SKUs</div>` : '')
        : '<div class="text-muted fst-italic">No SKUs stationed</div>';

    const tierBadge = loc.utilization_pct >= 90
        ? '<span class="badge bg-danger text-white">Critical Hotspot (&gt;90%)</span>'
        : (loc.utilization_pct >= 75 ? '<span class="badge bg-warning text-dark">High Density (&gt;75%)</span>' : '<span class="badge bg-success text-white">Optimal Space</span>');

    tooltip.innerHTML = `
        <div class="d-flex justify-content-between align-items-start mb-2 border-bottom pb-1">
            <div>
                <strong class="font-mono text-warning">${escapeHtml(loc.location_code)}</strong>
                <div class="small text-white-50">${escapeHtml(loc.warehouse_name)} (${escapeHtml(loc.warehouse_code)})</div>
            </div>
            ${tierBadge}
        </div>
        <div class="small mb-2">
            <div>Hierarchy: <strong>Rack ${escapeHtml(loc.rack)} &rarr; Shelf ${escapeHtml(loc.shelf)} &rarr; Bin ${escapeHtml(loc.bin)}</strong></div>
            <div>Storage Load: <strong>${loc.stored_units} / ${loc.capacity} units</strong> (<span class="text-warning fw-bold">${loc.utilization_pct}%</span>)</div>
            <div>Available Headroom: <strong>${loc.available_units} units</strong></div>
        </div>
        <div class="border-top pt-1 small">
            <span class="text-white-50">Stored SKUs (${prods.length}):</span>
            ${prodsListHtml}
        </div>
        <div class="mt-2 text-info text-end" style="font-size: 0.68rem;">Click cell to filter table &amp; inspect</div>
    `;

    tooltip.classList.remove('d-none');
    moveHeatmapTooltip(event);
}

function moveHeatmapTooltip(event) {
    const tooltip = document.getElementById('d3HeatmapTooltip');
    if (!tooltip) return;

    const container = document.getElementById('d3InventoryHeatmapContainer');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left + 15;
    const y = event.clientY - rect.top + 15;

    tooltip.style.left = `${Math.min(x, rect.width - 320)}px`;
    tooltip.style.top = `${y}px`;
}

function hideHeatmapTooltip() {
    const tooltip = document.getElementById('d3HeatmapTooltip');
    if (tooltip) {
        tooltip.classList.add('d-none');
    }
}

function selectHeatmapCell(loc) {
    selectedHeatmapCell = loc;

    const infoSpan = document.getElementById('selectedCellInfo');
    if (infoSpan) {
        infoSpan.textContent = `Selected: ${loc.location_code} (${loc.utilization_pct}% utilized - ${loc.stored_units}/${loc.capacity} units)`;
    }

    const card = document.getElementById('heatmapSelectedBinCard');
    if (card) {
        document.getElementById('selBinCode').textContent = loc.location_code;
        document.getElementById('selBinWarehouse').textContent = loc.warehouse_name;
        document.getElementById('selBinRackShelf').textContent = `Rack ${loc.rack} / Shelf ${loc.shelf} / Bin ${loc.bin}`;
        document.getElementById('selBinCapacity').textContent = `${loc.capacity} units`;
        document.getElementById('selBinStored').textContent = `${loc.stored_units} units`;

        const badge = document.getElementById('selBinDensityBadge');
        if (badge) {
            badge.textContent = `${loc.utilization_pct}% Full`;
            badge.className = `badge ${loc.utilization_pct >= 90 ? 'bg-danger' : (loc.utilization_pct >= 75 ? 'bg-warning text-dark' : 'bg-primary')}`;
        }

        const prodsList = document.getElementById('selBinProductsList');
        if (prodsList) {
            const prods = loc.products || [];
            if (prods.length === 0) {
                prodsList.innerHTML = `<span class="fst-italic text-muted">No products stored in this bin. Available for new deliveries.</span>`;
            } else {
                prodsList.innerHTML = prods.map(p => `
                    <div class="d-flex justify-content-between align-items-center py-1 border-bottom">
                        <div>
                            <code class="text-primary">${escapeHtml(p.sku)}</code>
                            <span class="ms-1 text-dark fw-semibold">${escapeHtml(p.name)}</span>
                        </div>
                        <span class="badge bg-light text-dark border">${p.quantity} pcs</span>
                    </div>
                `).join('');
            }
        }
        card.classList.remove('d-none');
    }

    filterLocationsTableByCode(loc.location_code);

    if (currentHeatmapData) {
        renderD3HeatmapSvg(currentHeatmapData);
    }
}

function filterLocationsTableByCode(locationCode) {
    const badge = document.getElementById('binsFilterBadge');
    const resetBtn = document.getElementById('resetBinsFilterBtn');

    if (badge && resetBtn) {
        badge.textContent = `Filtered by: ${locationCode}`;
        badge.classList.remove('d-none');
        resetBtn.classList.remove('d-none');
    }

    const filtered = allLocations.filter(l => l.location_code === locationCode || (selectedHeatmapCell && l.rack === selectedHeatmapCell.rack && l.warehouse_id === selectedHeatmapCell.warehouse_id));
    renderLocationsTable(filtered);
}

function clearBinSelectionFilter() {
    selectedHeatmapCell = null;
    const badge = document.getElementById('binsFilterBadge');
    const resetBtn = document.getElementById('resetBinsFilterBtn');
    const infoSpan = document.getElementById('selectedCellInfo');
    const card = document.getElementById('heatmapSelectedBinCard');

    if (badge) badge.classList.add('d-none');
    if (resetBtn) resetBtn.classList.add('d-none');
    if (infoSpan) infoSpan.textContent = '';
    if (card) card.classList.add('d-none');

    renderLocationsTable(allLocations);
    if (currentHeatmapData) renderD3HeatmapSvg(currentHeatmapData);
}

function renderRackUtilizationChart(racksRanked) {
    const canvas = document.getElementById('chartRackUtilization');
    if (!canvas || typeof Chart === 'undefined') return;

    if (chartRackUtilization) {
        chartRackUtilization.destroy();
        chartRackUtilization = null;
    }

    const topRacks = (racksRanked || []).slice(0, 8);
    if (topRacks.length === 0) return;

    const labels = topRacks.map(r => `${r.warehouse_code ? r.warehouse_code.replace('WH-', '') : 'HUB'} Rack ${r.rack}`);
    const dataValues = topRacks.map(r => r.utilization_pct);
    const bgColors = topRacks.map(r => getDensityColor(r.utilization_pct));

    const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

    chartRackUtilization = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Storage Utilization (%)',
                data: dataValues,
                backgroundColor: bgColors,
                borderRadius: 6,
                borderSkipped: false,
                barThickness: 16
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const rack = topRacks[ctx.dataIndex];
                            return [
                                ` Utilization: ${ctx.parsed.x}%`,
                                ` Load: ${rack.total_units} / ${rack.total_capacity} units`,
                                ` Bins: ${rack.bin_count}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    min: 0,
                    max: 100,
                    grid: { color: gridColor },
                    ticks: {
                        color: textColor,
                        callback: (v) => `${v}%`
                    }
                },
                y: {
                    grid: { display: false },
                    ticks: {
                        color: textColor,
                        font: { size: 10, weight: '600' }
                    }
                }
            }
        }
    });
}

function renderLocationsTable(locations) {
    const locBody = document.getElementById('locationsTableBody');
    if (!locBody) return;

    if (!locations || locations.length === 0) {
        locBody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">No bin locations found.</td></tr>`;
        return;
    }

    locBody.innerHTML = locations.map(l => {
        const cap = l.capacity || l.max_capacity || 500;
        const stored = l.stored_units || 0;
        const utilPct = l.utilization_pct !== undefined ? l.utilization_pct : Math.round((stored / Math.max(1, cap)) * 100);

        let badgeClass = 'bg-secondary-subtle text-secondary';
        let statusText = l.density_status || 'Empty';
        if (utilPct >= 90) {
            badgeClass = 'bg-danger text-white';
            statusText = 'Critical Hotspot';
        } else if (utilPct >= 75) {
            badgeClass = 'bg-warning text-dark';
            statusText = 'High Density';
        } else if (utilPct >= 40) {
            badgeClass = 'bg-primary-subtle text-primary';
            statusText = 'Optimal Load';
        } else if (utilPct > 0) {
            badgeClass = 'bg-success-subtle text-success';
            statusText = 'Low Density';
        }

        return `
            <tr>
                <td><code class="fw-bold text-primary font-mono">${escapeHtml(l.location_code)}</code></td>
                <td class="fw-semibold text-dark">${escapeHtml(l.warehouse_name || l.warehouse_id)}</td>
                <td><span class="badge bg-light text-dark border">Rack ${escapeHtml(l.rack)}</span></td>
                <td><span class="badge bg-light text-dark border">Shelf ${escapeHtml(l.shelf)}</span></td>
                <td><span class="badge bg-light text-dark border">Bin ${escapeHtml(l.bin)}</span></td>
                <td>${cap} units</td>
                <td class="fw-bold text-dark">${stored} units</td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <span class="fw-bold small" style="min-width: 38px;">${utilPct}%</span>
                        <div class="progress flex-grow-1" style="height: 6px; min-width: 60px;">
                            <div class="progress-bar ${utilPct >= 90 ? 'bg-danger' : (utilPct >= 75 ? 'bg-warning' : (utilPct >= 40 ? 'bg-primary' : 'bg-success'))}" style="width: ${Math.min(100, utilPct)}%"></div>
                        </div>
                    </div>
                </td>
                <td><span class="badge ${badgeClass}">${statusText}</span></td>
            </tr>
        `;
    }).join('');
}

// ==========================================================
// 9. PURCHASING & DOCK RECEIVING
// ==========================================================

async function loadPurchasesData() {
    try {
        const res = await fetch('/api/purchase_orders');
        const data = await res.json();
        const pos = data.purchase_orders || [];

        const tbody = document.getElementById('purchaseOrdersTableBody');
        if (!tbody) return;

        if (pos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No purchase orders found.</td></tr>`;
            return;
        }

        tbody.innerHTML = pos.map(p => {
            const isReceived = p.status === 'RECEIVED';
            return `
                <tr>
                    <td><code class="fw-bold text-primary">${escapeHtml(p.po_number)}</code></td>
                    <td class="fw-semibold text-dark">${escapeHtml(p.supplier_name || 'Supplier')}</td>
                    <td><span class="badge bg-light text-dark border">${escapeHtml(p.warehouse_name || 'Central')}</span></td>
                    <td class="fw-bold text-dark">₹${Number(p.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    <td>
                        <span class="badge ${isReceived ? 'bg-success' : 'bg-warning text-dark'}">
                            ${p.status}
                        </span>
                    </td>
                    <td class="small text-muted">${p.expected_delivery || 'Scheduled'}</td>
                    <td class="small text-muted">${escapeHtml(p.created_by || 'Staff')}</td>
                    <td class="text-end">
                        ${isReceived 
                            ? `<span class="badge bg-light text-success border"><i class="bi bi-check2-all me-1"></i>Stock In</span>` 
                            : `<button class="btn btn-sm btn-success fw-bold receive-po-btn" data-id="${p.id}">
                                 <i class="bi bi-box-arrow-in-down me-1"></i>Receive & Restock
                               </button>`
                        }
                    </td>
                </tr>
            `;
        }).join('');

        // Attach 1-click receive & restock event
        tbody.querySelectorAll('.receive-po-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                btn.disabled = true;
                btn.innerHTML = `<span class="spin-icon">↻</span> Receiving...`;

                try {
                    const res = await fetch('/api/purchase_orders/receive', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ po_id: btn.dataset.id })
                    });
                    const d = await res.json();
                    if (d.success) {
                        showToast(d.message, 'success');
                        await loadMasterLookupData();
                        loadPurchasesData();
                    } else {
                        showToast(d.message || 'Receive failed', 'danger');
                    }
                } catch (e) {
                    showToast('Error receiving order', 'danger');
                }
            });
        });
    } catch (err) {
        console.error("Error loading POs:", err);
    }
}

// ==========================================================
// 10. SALES ORDERS & DISPATCH WITH STRICT STOCK VALIDATION
// ==========================================================

async function loadSalesData() {
    try {
        const res = await fetch('/api/sales_orders');
        const data = await res.json();
        const sos = data.sales_orders || [];

        const tbody = document.getElementById('salesOrdersTableBody');
        if (!tbody) return;

        if (sos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No sales orders found.</td></tr>`;
            return;
        }

        tbody.innerHTML = sos.map(s => {
            const isDispatched = s.status === 'DISPATCHED' || s.status === 'COMPLETED';
            return `
                <tr>
                    <td><code class="fw-bold text-primary">${escapeHtml(s.so_number)}</code></td>
                    <td class="fw-semibold text-dark">${escapeHtml(s.customer_name || 'Client')}</td>
                    <td><span class="badge bg-light text-dark border">${escapeHtml(s.warehouse_name || 'Hub')}</span></td>
                    <td class="fw-bold text-dark">₹${Number(s.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    <td>
                        <span class="badge ${isDispatched ? 'bg-success' : 'bg-primary'}">
                            ${s.status}
                        </span>
                    </td>
                    <td class="small text-muted">${formatDateTime(s.created_at)}</td>
                    <td class="text-end">
                        ${isDispatched
                            ? `<span class="badge bg-light text-success border"><i class="bi bi-truck me-1"></i>Fulfilled</span>`
                            : `<button class="btn btn-sm btn-primary fw-bold dispatch-so-btn" data-id="${s.id}">
                                 <i class="bi bi-box-arrow-right me-1"></i>Dispatch Order
                               </button>`
                        }
                    </td>
                </tr>
            `;
        }).join('');

        // Attach Dispatch Order Handler
        tbody.querySelectorAll('.dispatch-so-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                btn.disabled = true;
                btn.innerHTML = `<span class="spin-icon">↻</span> Validating & Dispatching...`;

                try {
                    const res = await fetch('/api/sales_orders/dispatch', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ so_id: btn.dataset.id })
                    });
                    const d = await res.json();

                    if (d.success) {
                        showToast(d.message, 'success');
                        await loadMasterLookupData();
                        loadSalesData();
                    } else {
                        // Strict validation message (e.g. INSUFFICIENT STOCK)
                        showToast(d.message || 'Dispatch failed', 'danger');
                        btn.disabled = false;
                        btn.innerHTML = `<i class="bi bi-exclamation-triangle me-1"></i>Retry Dispatch`;
                    }
                } catch (e) {
                    showToast('Dispatch network error', 'danger');
                    btn.disabled = false;
                    btn.innerHTML = `Dispatch Order`;
                }
            });
        });
    } catch (err) {
        console.error("Error loading SOs:", err);
    }
}

// ==========================================================
// 11. INTER-WAREHOUSE TRANSFERS
// ==========================================================

async function loadTransfersData() {
    try {
        const res = await fetch('/api/transfers');
        const data = await res.json();
        const transfers = data.transfers || [];

        const tbody = document.getElementById('transfersTableBody');
        if (!tbody) return;

        const inTransitCount = transfers.filter(t => t.status === 'IN_TRANSIT').length;
        setText('transfersBadge', inTransitCount);

        if (transfers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No inter-warehouse transfers recorded.</td></tr>`;
            return;
        }

        tbody.innerHTML = transfers.map(t => {
            const isCompleted = t.status === 'RECEIVED' || t.status === 'COMPLETED';
            return `
                <tr>
                    <td><code class="fw-bold text-primary">${escapeHtml(t.transfer_number)}</code></td>
                    <td>
                        <div class="fw-bold text-dark">${escapeHtml(t.product_name || '')}</div>
                        <code class="text-muted" style="font-size: 0.72rem;">${escapeHtml(t.product_sku || '')}</code>
                    </td>
                    <td class="fw-bold text-dark">${t.quantity} units</td>
                    <td><span class="badge bg-light text-secondary border">${escapeHtml(t.source_warehouse_name || 'Source')}</span></td>
                    <td><span class="badge bg-light text-primary border">${escapeHtml(t.dest_warehouse_name || 'Dest')}</span></td>
                    <td>
                        <span class="badge ${isCompleted ? 'bg-success' : 'bg-warning text-dark'}">
                            ${t.status}
                        </span>
                    </td>
                    <td class="small text-muted">${formatDateTime(t.created_at)}</td>
                    <td class="text-end">
                        ${isCompleted
                            ? `<span class="badge bg-light text-success border"><i class="bi bi-check2-circle me-1"></i>Completed</span>`
                            : `<button class="btn btn-sm btn-outline-success fw-bold complete-trf-btn" data-id="${t.id}">
                                 <i class="bi bi-check-lg me-1"></i>Confirm Receipt
                               </button>`
                        }
                    </td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('.complete-trf-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                btn.disabled = true;
                try {
                    const res = await fetch('/api/transfers/complete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ transfer_id: btn.dataset.id })
                    });
                    const d = await res.json();
                    if (d.success) {
                        showToast(d.message, 'success');
                        await loadMasterLookupData();
                        loadTransfersData();
                    } else {
                        showToast(d.message || 'Complete failed', 'danger');
                    }
                } catch (e) {
                    showToast('Transfer complete error', 'danger');
                }
            });
        });
    } catch (err) {
        console.error("Error loading transfers:", err);
    }
}

// ==========================================================
// 12. RETURNS & QUARANTINE INSPECTION BAY
// ==========================================================

async function loadReturnsData() {
    try {
        const res = await fetch('/api/returns');
        const data = await res.json();
        const returns = data.returns || [];

        const tbody = document.getElementById('returnsTableBody');
        if (!tbody) return;

        if (returns.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No returns currently in quarantine.</td></tr>`;
            return;
        }

        tbody.innerHTML = returns.map(r => {
            const isResolved = r.action_taken && r.action_taken !== 'PENDING_INSPECTION';
            return `
                <tr>
                    <td><code class="fw-bold text-primary">${escapeHtml(r.return_number)}</code></td>
                    <td class="fw-semibold text-dark">${escapeHtml(r.customer_name || 'Client')}</td>
                    <td>
                        <div class="fw-bold text-dark">${escapeHtml(r.product_name || '')}</div>
                        <code class="text-muted" style="font-size: 0.72rem;">${escapeHtml(r.product_sku || '')}</code>
                    </td>
                    <td class="fw-bold text-dark">${r.quantity} units</td>
                    <td class="small text-muted" style="max-width: 160px;">${escapeHtml(r.reason || '')}</td>
                    <td><span class="badge bg-light text-dark border">${escapeHtml(r.condition || 'Uninspected')}</span></td>
                    <td>
                        <span class="badge ${isResolved ? 'bg-info' : 'bg-warning text-dark'}">
                            ${r.action_taken || 'PENDING_INSPECTION'}
                        </span>
                    </td>
                    <td class="text-end">
                        ${isResolved
                            ? `<span class="badge bg-light text-secondary border">Resolved</span>`
                            : `<div class="btn-group btn-group-sm">
                                 <button class="btn btn-outline-success resolve-ret-btn" data-id="${r.id}" data-action="RESTOCK" title="Restock to inventory">Restock</button>
                                 <button class="btn btn-outline-danger resolve-ret-btn" data-id="${r.id}" data-action="DAMAGED" title="Mark as damaged scrap">Scrap</button>
                               </div>`
                        }
                    </td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('.resolve-ret-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const retId = btn.dataset.id;
                const action = btn.dataset.action;

                try {
                    const res = await fetch('/api/returns/resolve', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            return_id: retId,
                            action: action,
                            notes: `Quarantine bay inspection completed by ${currentRole}`
                        })
                    });
                    const d = await res.json();
                    if (d.success) {
                        showToast(d.message, 'success');
                        await loadMasterLookupData();
                        loadReturnsData();
                    } else {
                        showToast(d.message || 'Resolve failed', 'danger');
                    }
                } catch (e) {
                    showToast('Resolution error', 'danger');
                }
            });
        });
    } catch (err) {
        console.error("Error loading returns:", err);
    }
}

// ==========================================================
// 13. AI DEMAND FORECAST & DEMAND SURGE SIMULATOR
// ==========================================================

function initDriftSlider() {
    const slider = document.getElementById('demandSurgeSlider');
    const display = document.getElementById('surgeValueDisplay');
    const headerDisplay = document.getElementById('headerSurgeVal');
    const resetBtn = document.getElementById('resetSurgeBtn');

    if (slider) {
        slider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            driftMultiplier = val / 100.0;
            if (display) display.textContent = `${val}%`;
            if (headerDisplay) headerDisplay.textContent = `${val}%`;

            if (activeView === 'dashboard') loadDashboardData();
            if (activeView === 'ai') loadAiData();
        });
    }

    if (resetBtn && slider) {
        resetBtn.addEventListener('click', () => {
            slider.value = 100;
            driftMultiplier = 1.0;
            if (display) display.textContent = `100%`;
            if (headerDisplay) headerDisplay.textContent = `100%`;
            if (activeView === 'dashboard') loadDashboardData();
            if (activeView === 'ai') loadAiData();
        });
    }
}

async function loadAiData() {
    try {
        const res = await fetch(`/api/analytics?drift=${driftMultiplier}`);
        const data = await res.json();
        const forecasts = data.demand_forecasts || [];

        const tbody = document.getElementById('aiForecastTableBody');
        if (!tbody) return;

        if (forecasts.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">No forecasts available.</td></tr>`;
            return;
        }

        tbody.innerHTML = forecasts.map(f => {
            let riskBadge = `<span class="badge bg-success-subtle text-success">Low Risk</span>`;
            if (f.shortage_risk === 'CRITICAL') {
                riskBadge = `<span class="badge-critical">CRITICAL</span>`;
            } else if (f.shortage_risk === 'HIGH') {
                riskBadge = `<span class="badge-low-stock">HIGH RISK</span>`;
            } else if (f.shortage_risk === 'MEDIUM') {
                riskBadge = `<span class="badge bg-warning-subtle text-warning">MEDIUM</span>`;
            }

            return `
                <tr>
                    <td><code class="fw-bold text-primary">${escapeHtml(f.sku)}</code></td>
                    <td class="fw-semibold text-dark">${escapeHtml(f.name)}</td>
                    <td class="fw-bold">${f.current_quantity}</td>
                    <td>${f.daily_velocity} / day</td>
                    <td class="fw-semibold">${f.forecast_7d} units</td>
                    <td class="fw-semibold">${f.forecast_30d} units</td>
                    <td><span class="badge bg-light text-dark border">${f.days_of_supply} days</span></td>
                    <td>${riskBadge}</td>
                    <td class="fw-bold text-primary">${f.recommended_purchase_qty > 0 ? `+${f.recommended_purchase_qty} units` : 'Adequate'}</td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.error("Error loading AI analytics:", err);
    }
}

// ==========================================================
// 14. AUDIT LOGS & SYSTEM COMPLIANCE
// ==========================================================

async function loadAuditLogsData() {
    try {
        const res = await fetch('/api/audit_logs');
        const data = await res.json();
        const logs = data.audit_logs || [];

        const tbody = document.getElementById('auditLogsTableBody');
        if (!tbody) return;

        if (logs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">No audit logs recorded yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = logs.map(l => `
            <tr>
                <td class="text-muted small">${formatDateTime(l.created_at)}</td>
                <td><span class="badge-role">${escapeHtml(l.user_role || 'SYSTEM')}</span></td>
                <td><span class="badge bg-light text-secondary border">${escapeHtml(l.module || 'SYS')}</span></td>
                <td class="fw-bold text-dark">${escapeHtml(l.action)}</td>
                <td><code class="text-muted" style="font-size: 0.72rem;">${escapeHtml(l.record_id || '--')}</code></td>
                <td class="text-muted small">${escapeHtml(l.old_value || '--')}</td>
                <td class="fw-semibold text-dark small">${escapeHtml(l.new_value || '--')}</td>
                <td class="small" style="max-width: 250px;">${escapeHtml(l.details || '')}</td>
                <td class="text-muted small font-mono">${escapeHtml(l.ip_address || '127.0.0.1')}</td>
            </tr>
        `).join('');
    } catch (err) {
        console.error("Error loading audit logs:", err);
    }
}

// ==========================================================
// 15. NOTIFICATIONS SYSTEM
// ==========================================================

async function loadNotificationsData() {
    try {
        const res = await fetch('/api/notifications');
        const data = await res.json();
        const notifs = data.notifications || [];

        const container = document.getElementById('notifListContainer');
        if (!container) return;

        if (notifs.length === 0) {
            container.innerHTML = `<li class="p-3 text-center text-muted small">No notifications at this time.</li>`;
            return;
        }

        container.innerHTML = notifs.map(n => `
            <li class="p-2 border-bottom ${n.is_read ? 'opacity-75' : 'bg-light'}">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="fw-bold small text-dark">${escapeHtml(n.title)}</span>
                    <span class="text-muted" style="font-size: 0.65rem;">${formatDateTime(n.created_at)}</span>
                </div>
                <div class="small text-secondary">${escapeHtml(n.message)}</div>
            </li>
        `).join('');
    } catch (err) {
        console.error("Notifications error:", err);
    }
}

function updateUnreadNotificationsCount(count) {
    const badge = document.getElementById('unreadNotifCount');
    if (!badge) return;
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

// ==========================================================
// 17. GLOBAL SEARCH & QUICK BUTTONS
// ==========================================================

function initSearch() {
    const searchInput = document.getElementById('globalSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const q = e.target.value.trim();
            if (activeView !== 'products') {
                switchView('products');
            }
            const productSearch = document.getElementById('filterProductSearch');
            if (productSearch) {
                productSearch.value = q;
                renderProductsTable();
            }
        });
    }

    // Filter controls in products view
    ['filterProductSearch', 'filterCategorySelect', 'filterWarehouseSelect', 'filterStockStatusSelect'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', renderProductsTable);
    });
}

function initGlobalButtons() {
    // 1. Refresh All
    const refreshBtn = document.getElementById('refreshAllBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            const icon = refreshBtn.querySelector('i');
            if (icon) icon.classList.add('spin-icon');
            refreshBtn.disabled = true;

            try {
                const res = await fetch('/api/refresh_all', { method: 'POST' });
                const data = await res.json();
                await loadMasterLookupData();
                await loadDashboardData();

                const badge = document.getElementById('lastUpdatedBadge');
                if (badge && data.timestamp) {
                    badge.innerHTML = `<i class="bi bi-clock-history me-1 text-primary"></i> Synced: ${data.timestamp}`;
                }
                showToast(data.message, 'success');
            } catch (e) {
                showToast('Refresh failed', 'danger');
            } finally {
                if (icon) icon.classList.remove('spin-icon');
                refreshBtn.disabled = false;
            }
        });
    }

    // 2. Mark all notifications read
    const markReadLink = document.getElementById('markAllReadLink');
    if (markReadLink) {
        markReadLink.addEventListener('click', async (e) => {
            e.preventDefault();
            await fetch('/api/notifications/read_all', { method: 'POST' });
            updateUnreadNotificationsCount(0);
            loadNotificationsData();
        });
    }

    // 3. Operational Module Navigation Cards
    document.querySelectorAll('.operational-module-card').forEach(card => {
        card.addEventListener('click', () => {
            const view = card.dataset.view;
            if (view) switchView(view);
        });
    });

    // 4. Hero Launch Buttons
    document.querySelectorAll('.launch-dashboard-btn').forEach(btn => {
        btn.addEventListener('click', () => switchView('dashboard'));
    });

    // 5. View All AI Reorders
    const viewAllAiBtn = document.getElementById('viewAllAiReordersBtn');
    if (viewAllAiBtn) viewAllAiBtn.addEventListener('click', () => switchView('ai'));

    // 6. Auto Generate POs for all low stock (with DUPLICATE PO PROTECTION)
    const autoPoButtons = ['dashGenerateAutoPoBtn', 'aiAutoGenerateAllPoBtn'];
    autoPoButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', async () => {
                btn.disabled = true;
                btn.innerHTML = `<span class="spin-icon">↻</span> Analyzing & Ordering...`;

                try {
                    const res = await fetch('/api/purchase_orders/auto_generate', { method: 'POST' });
                    const data = await res.json();
                    showToast(data.message, 'success');
                    await loadMasterLookupData();
                    await loadDashboardData();
                } catch (e) {
                    showToast('Auto PO generation error', 'danger');
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = `<i class="bi bi-magic me-1"></i>1-Click AI Auto Reorder`;
                }
            });
        }
    });

    // 7. Auth Action (Unified Entry Point)
    const topSignIn = document.getElementById('topNavSignInBtn');
    const homeSignIn = document.getElementById('homeSignInBtn');

    [topSignIn, homeSignIn].forEach(b => {
        if (b) b.addEventListener('click', () => {
            openAuthModal('signin');
        });
    });

    const switchRegLink = document.getElementById('switchRegisterModalLink');
    if (switchRegLink) {
        switchRegLink.addEventListener('click', (e) => {
            e.preventDefault();
            openAuthModal('register');
        });
    }

    const switchLoginLink = document.getElementById('switchLoginModalLink');
    if (switchLoginLink) {
        switchLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            openAuthModal('signin');
        });
    }

    // Logout buttons (Explicit user action only)
    const headerLogout = document.getElementById('headerLogoutBtn');
    const sidebarLogout = document.getElementById('sidebarLogoutBtn');
    const homeCardSignOut = document.getElementById('homeCardSignOutBtn');
    [headerLogout, sidebarLogout, homeCardSignOut].forEach(b => {
        if (b) b.addEventListener('click', (e) => {
            e.preventDefault();
            logoutUser();
        });
    });

    // 8. Creator Profile Modal Trigger (Nikita Chaudhari / Women in Tech)
    window.openAboutCreatorModal = function() {
        const modalEl = document.getElementById('aboutCreatorModal');
        if (modalEl) {
            const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
            modal.show();
        }
    };

    const creatorBtn = document.getElementById('aboutCreatorBtn');
    if (creatorBtn) {
        creatorBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.openAboutCreatorModal();
        });
    }

    // 8b. Security Center Modal Trigger
    const securityBtn = document.getElementById('securityStatusBtn');
    if (securityBtn) {
        securityBtn.addEventListener('click', () => {
            const modalEl = document.getElementById('securityCenterModal');
            if (modalEl) {
                const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
                modal.show();
            }
        });
    }

    // 9. Keep Session Active Button (from Inactivity Modal)
    const keepSessionBtn = document.getElementById('keepSessionAliveBtn');
    if (keepSessionBtn) {
        keepSessionBtn.addEventListener('click', () => {
            resetUserActivity();
            pingSessionRefresh();
            showToast('Session refreshed successfully.', 'success');
        });
    }

    // 10. Logout Now Button (from Inactivity Modal)
    const inactivityLogoutBtn = document.getElementById('inactivityLogoutNowBtn');
    if (inactivityLogoutBtn) {
        inactivityLogoutBtn.addEventListener('click', () => {
            logoutUser(true, 'user_prompted');
        });
    }
}

// ==========================================================
// 18. MODALS & SUBMIT HANDLERS
// ==========================================================

function initModalsAndForms() {
    // 1. Modal Login Form Submit
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('loginIdentifier').value.trim();
            const pass = document.getElementById('loginPassword').value;
            loginUser(id, pass);
        });
    }

    // 2. Modal Register Form Submit
    const regForm = document.getElementById('registerForm');
    if (regForm) {
        regForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const fullName = document.getElementById('regFullName')?.value.trim() || '';
            const email = document.getElementById('regEmail')?.value.trim() || '';
            const password = document.getElementById('regPassword')?.value || '';
            const roleEl = document.getElementById('regRole');
            const role = roleEl ? roleEl.value : 'Warehouse Staff';
            const usernameEl = document.getElementById('regUsername');
            const username = (usernameEl && usernameEl.value.trim()) || email.split('@')[0].toLowerCase();
            const deptEl = document.getElementById('regDept');
            const department = (deptEl && deptEl.value.trim()) || 'Warehouse Operations';

            const userData = {
                full_name: fullName,
                username: username,
                email: email,
                role: role,
                department: department,
                password: password
            };
            registerUser(userData);
        });
    }

    // 3. Stock Adjustment Form
    const adjustForm = document.getElementById('stockAdjustForm');
    if (adjustForm) {
        adjustForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const pid = document.getElementById('adjustProductId').value;
            const change = parseInt(document.getElementById('adjustQtyChange').value);
            const reason = document.getElementById('adjustReasonSelect').value;
            const notes = document.getElementById('adjustNotesInput').value.trim();

            try {
                const res = await fetch('/api/products/stock', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        product_id: pid,
                        quantity_change: change,
                        reason: reason,
                        notes: notes,
                        movement_type: change > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
                        user_role: currentRole
                    })
                });
                const d = await res.json();
                if (d.success) {
                    showToast(d.message, 'success');
                    bootstrap.Modal.getInstance(document.getElementById('stockAdjustModal'))?.hide();
                    await loadMasterLookupData();
                    if (activeView === 'products') renderProductsTable();
                    if (activeView === 'dashboard') loadDashboardData();
                } else {
                    const alertBox = document.getElementById('adjustAlertBox');
                    alertBox.textContent = d.message || 'Adjustment failed.';
                    alertBox.style.display = 'block';
                }
            } catch (err) {
                showToast('Error adjusting stock', 'danger');
            }
        });
    }

    // 4. Add Product Form
    const openAddProd = document.getElementById('openAddProductModalBtn');
    if (openAddProd) {
        openAddProd.addEventListener('click', () => {
            new bootstrap.Modal(document.getElementById('addProductModal')).show();
        });
    }
    const addProdForm = document.getElementById('addProductForm');
    if (addProdForm) {
        addProdForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const productData = {
                sku: document.getElementById('addSku').value.trim(),
                barcode: document.getElementById('addBarcode').value.trim(),
                name: document.getElementById('addName').value.trim(),
                category: document.getElementById('addCategory').value,
                purchase_price: parseFloat(document.getElementById('addPurchasePrice').value),
                selling_price: parseFloat(document.getElementById('addSellingPrice').value),
                quantity: parseInt(document.getElementById('addQuantity').value),
                reorder_point: parseInt(document.getElementById('addReorderPoint').value),
                warehouse_id: document.getElementById('addWarehouseSelect').value,
                rack: document.getElementById('addRack').value.trim(),
                shelf: document.getElementById('addShelf').value.trim(),
                bin: document.getElementById('addBin').value.trim(),
                supplier_id: document.getElementById('addSupplierSelect').value
            };

            try {
                const res = await fetch('/api/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productData)
                });
                const d = await res.json();
                if (d.success) {
                    showToast(d.message, 'success');
                    bootstrap.Modal.getInstance(document.getElementById('addProductModal'))?.hide();
                    await loadMasterLookupData();
                    if (activeView === 'products') renderProductsTable();
                } else {
                    const alertBox = document.getElementById('addProductAlert');
                    alertBox.textContent = d.message || 'Failed to add product.';
                    alertBox.style.display = 'block';
                }
            } catch (err) {
                showToast('Add product error', 'danger');
            }
        });
    }

    // 5. Create Purchase Order Modal & Submit
    const openPoBtn = document.getElementById('openCreatePoModalBtn');
    const dashOpenPo = document.getElementById('dashOpenNewPoBtn');
    [openPoBtn, dashOpenPo].forEach(b => {
        if (b) b.addEventListener('click', () => {
            document.getElementById('poDeliveryDate').value = getFutureDate(7);
            new bootstrap.Modal(document.getElementById('createPoModal')).show();
        });
    });

    const poProductSelect = document.getElementById('poProductSelect');
    if (poProductSelect) {
        poProductSelect.addEventListener('change', () => {
            const opt = poProductSelect.selectedOptions[0];
            if (opt && opt.dataset.price) {
                document.getElementById('poUnitCostInput').value = opt.dataset.price;
            }
        });
    }

    const createPoForm = document.getElementById('createPoForm');
    if (createPoForm) {
        createPoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const pId = document.getElementById('poProductSelect').value;
            const qty = parseInt(document.getElementById('poQuantityInput').value);
            const cost = parseFloat(document.getElementById('poUnitCostInput').value);

            const poData = {
                supplier_id: document.getElementById('poSupplierSelect').value,
                warehouse_id: document.getElementById('poWarehouseSelect').value,
                total_amount: qty * cost,
                expected_delivery: document.getElementById('poDeliveryDate').value,
                items: [{ product_id: pId, quantity: qty, unit_cost: cost }]
            };

            try {
                const res = await fetch('/api/purchase_orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(poData)
                });
                const d = await res.json();
                if (d.success) {
                    showToast(d.message, 'success');
                    bootstrap.Modal.getInstance(document.getElementById('createPoModal'))?.hide();
                    loadPurchasesData();
                }
            } catch (err) {
                showToast('Error creating PO', 'danger');
            }
        });
    }

    // 6. Create Sales Order Modal & Submit
    const openSoBtn = document.getElementById('openCreateSoModalBtn');
    if (openSoBtn) {
        openSoBtn.addEventListener('click', () => {
            new bootstrap.Modal(document.getElementById('createSoModal')).show();
        });
    }

    const soProductSelect = document.getElementById('soProductSelect');
    if (soProductSelect) {
        soProductSelect.addEventListener('change', () => {
            const opt = soProductSelect.selectedOptions[0];
            if (opt) {
                document.getElementById('soUnitPriceInput').value = opt.dataset.sell || '100.00';
                document.getElementById('soStockAvailableInfo').textContent = `Available in Stock: ${opt.dataset.qty || 0} units`;
            }
        });
    }

    const createSoForm = document.getElementById('createSoForm');
    if (createSoForm) {
        createSoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const pId = document.getElementById('soProductSelect').value;
            const qty = parseInt(document.getElementById('soQuantityInput').value);
            const price = parseFloat(document.getElementById('soUnitPriceInput').value);

            const soData = {
                customer_id: document.getElementById('soCustomerSelect').value,
                warehouse_id: document.getElementById('soWarehouseSelect').value,
                total_amount: qty * price,
                items: [{ product_id: pId, quantity: qty, unit_price: price }]
            };

            try {
                const res = await fetch('/api/sales_orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(soData)
                });
                const d = await res.json();
                if (d.success) {
                    showToast(d.message, 'success');
                    bootstrap.Modal.getInstance(document.getElementById('createSoModal'))?.hide();
                    loadSalesData();
                }
            } catch (err) {
                showToast('Error booking SO', 'danger');
            }
        });
    }

    // 7. Initiate Transfer Modal & Submit
    const openTrfBtn = document.getElementById('openNewTransferModalBtn');
    if (openTrfBtn) {
        openTrfBtn.addEventListener('click', () => {
            new bootstrap.Modal(document.getElementById('createTransferModal')).show();
        });
    }

    const trfProductSelect = document.getElementById('trfProductSelect');
    if (trfProductSelect) {
        trfProductSelect.addEventListener('change', () => {
            const opt = trfProductSelect.selectedOptions[0];
            if (opt) {
                document.getElementById('trfAvailableStockInfo').textContent = `Stock in Source Hub: ${opt.dataset.qty || 0} units`;
            }
        });
    }

    const createTransferForm = document.getElementById('createTransferForm');
    if (createTransferForm) {
        createTransferForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const trfData = {
                product_id: document.getElementById('trfProductSelect').value,
                source_warehouse_id: document.getElementById('trfSourceSelect').value,
                dest_warehouse_id: document.getElementById('trfDestSelect').value,
                quantity: parseInt(document.getElementById('trfQuantityInput').value)
            };

            try {
                const res = await fetch('/api/transfers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(trfData)
                });
                const d = await res.json();
                if (d.success) {
                    showToast(d.message, 'success');
                    bootstrap.Modal.getInstance(document.getElementById('createTransferModal'))?.hide();
                    await loadMasterLookupData();
                    loadTransfersData();
                } else {
                    const alertBox = document.getElementById('trfAlertBox');
                    alertBox.textContent = d.message || 'Transfer failed.';
                    alertBox.style.display = 'block';
                }
            } catch (err) {
                showToast('Error initiating transfer', 'danger');
            }
        });
    }

    // 8. Log Customer Return Modal & Submit
    const openRetBtn = document.getElementById('openLogReturnModalBtn');
    if (openRetBtn) {
        openRetBtn.addEventListener('click', () => {
            new bootstrap.Modal(document.getElementById('createReturnModal')).show();
        });
    }
    const createReturnForm = document.getElementById('createReturnForm');
    if (createReturnForm) {
        createReturnForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const retData = {
                customer_name: document.getElementById('retCustomerName').value.trim(),
                product_id: document.getElementById('retProductSelect').value,
                warehouse_id: document.getElementById('retWarehouseSelect').value,
                quantity: parseInt(document.getElementById('retQuantity').value),
                reason: document.getElementById('retReason').value.trim()
            };

            try {
                const res = await fetch('/api/returns', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(retData)
                });
                const d = await res.json();
                if (d.success) {
                    showToast(d.message, 'success');
                    bootstrap.Modal.getInstance(document.getElementById('createReturnModal'))?.hide();
                    loadReturnsData();
                }
            } catch (err) {
                showToast('Error registering return', 'danger');
            }
        });
    }
}

// ==========================================================
// 19. UTILITIES & HELPERS
// ==========================================================

function formatCurrency(num) {
    return '₹' + Number(num || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDateTime(str) {
    if (!str) return '--';
    try {
        const d = new Date(str);
        if (isNaN(d.getTime())) return str;
        return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
        return str;
    }
}

function getFutureDate(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}

function setText(id, txt) {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getMovementBadgeClass(type) {
    switch (type) {
        case 'PURCHASE_RECEIPT': return 'bg-success';
        case 'SALE_DISPATCH': return 'bg-primary';
        case 'TRANSFER_OUT': return 'bg-warning text-dark';
        case 'TRANSFER_IN': return 'bg-info text-white';
        case 'ADJUSTMENT_IN': return 'bg-success-subtle text-success';
        case 'ADJUSTMENT_OUT': return 'bg-danger-subtle text-danger';
        case 'RETURN': return 'bg-purple text-white';
        case 'QUARANTINE': return 'bg-dark text-white';
        default: return 'bg-secondary';
    }
}

function showToast(message, type = 'primary') {
    const toastEl = document.getElementById('liveToast');
    const msgEl = document.getElementById('toastMessage');
    if (!toastEl || !msgEl) return;

    toastEl.className = `toast align-items-center text-white bg-${type} border-0 shadow-lg rounded-3`;
    msgEl.textContent = message;

    const toast = new bootstrap.Toast(toastEl, { delay: 3500 });
    toast.show();
}
