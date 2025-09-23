// View readiness and back transition
function readyUp() {
  document.body.classList.remove("preload");
  document.body.classList.add("ready");
}
window.addEventListener("DOMContentLoaded", readyUp);
window.addEventListener("pageshow", readyUp, { once:false });
document.getElementById("back-home").addEventListener("click", (e) => {
  e.preventDefault();
  document.body.classList.remove("ready");
  document.body.classList.add("preload");
  setTimeout(() => history.back(), 220);
});

// API base: localhost:8081 in dev, current origin in prod
const API_BASE = (() => {
  const local = 'http://localhost:8081';
  try {
    const { origin, hostname } = window.location;
    return (hostname === 'localhost' || hostname === '127.0.0.1') ? local : origin;
  } catch { return local; }
})();
const API = `${API_BASE}/api/v1`;

// Token helpers
const getToken = () =>
  sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken') || '';
const setAuthHeader = () => {
  const t = getToken();
  return t ? { 'Authorization': `Bearer ${t}` } : {};
};

// UI refs
const nameInput = document.getElementById("name-input");
const emailInput = document.getElementById("email-input");
const bioInput = document.getElementById("bio-input");
const pName = document.getElementById("p-name");
const pEmail = document.getElementById("p-email");
const avatarImg = document.getElementById("avatar-img");
const memberSinceEl = document.getElementById("member-since");
const totalEl = document.getElementById("prof-total");
const themeSeg = document.getElementById("theme-seg");
const avatarChooser = document.getElementById("avatar-chooser");
const chooseAvatarBtn = document.getElementById("choose-avatar");
const randomAvatarBtn = document.getElementById("random-avatar");

// Toast
function showToast(msg, type = "info") {
  const c = document.getElementById("toast-container");
  const t = document.createElement("div");
  t.className = `toast show ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}

// Avatars
const AVATAR_LIST = [
  'Images/profile/avatar1.png',
  'Images/profile/avatar2.png',
  'Images/profile/avatar3.png',
  'Images/profile/avatar4.png',
  'Images/profile/avatar5.png'
];

// Theme helpers
const DEFAULT_THEME = 'light';
const systemPref = () => (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';

function applyTheme(theme, { persist = true } = {}) {
  let t = theme || DEFAULT_THEME;
  if (t === 'system') t = systemPref();
  document.documentElement.setAttribute('data-theme', t);
  if (persist && theme) localStorage.setItem('theme', theme);
}

function setThemeButtons(active) {
  [...themeSeg.querySelectorAll('.seg-btn')].forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === active);
  });
}

function bindThemeButtons(initialTheme) {
  setThemeButtons(initialTheme);
  [...themeSeg.querySelectorAll('.seg-btn')].forEach(btn => {
    btn.onclick = () => {
      const chosen = btn.dataset.theme;
      setThemeButtons(chosen);
      applyTheme(chosen);
      currentTheme = chosen;
    };
  });
}

// State
let currentTheme = DEFAULT_THEME;
let currentLang = 'en';
let currentAvatar = 'Images/profile/avatar.png';

// Build avatar chooser
function renderAvatarChooser(selected) {
  avatarChooser.innerHTML = '';
  AVATAR_LIST.forEach(src => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = 'Avatar';
    if (src === selected) img.style.outline = '2px solid #2196f3';
    img.addEventListener('click', () => {
      currentAvatar = src;
      avatarImg.src = src;
      avatarChooser.classList.remove('open');
    });
    avatarChooser.appendChild(img);
  });
}
chooseAvatarBtn.addEventListener('click', () => {
  avatarChooser.classList.toggle('open');
  if (avatarChooser.classList.contains('open')) renderAvatarChooser(currentAvatar);
});
randomAvatarBtn.addEventListener('click', () => {
  const pick = AVATAR_LIST[Math.floor(Math.random() * AVATAR_LIST.length)];
  currentAvatar = pick;
  avatarImg.src = pick;
  showToast('Avatar updated', 'success');
});

// Fetch profile on load
async function fetchProfile() {
  const token = getToken();
  if (!token) {
    showToast("Not authenticated", "error");
    return setTimeout(() => (window.location.href = '/login.html'), 600);
  }
  try {
    const res = await fetch(`${API}/profile`, { headers: { ...setAuthHeader() } });
    if (res.status === 401) {
      showToast('Session expired', 'error');
      return setTimeout(() => (window.location.href = '/login.html'), 700);
    }
    if (!res.ok) throw new Error('Failed to fetch profile');
    const data = await res.json();

    // Identity
    const displayName = data.displayName || 'User';
    const email = data.email || '';
    const avatarUrl = data.avatarUrl || currentAvatar;

    nameInput.value = displayName;
    emailInput.value = email;
    pName.textContent = displayName;
    pEmail.textContent = email || '—';
    avatarImg.src = avatarUrl;
    currentAvatar = avatarUrl;

    // Prefs
    currentLang = data.language || 'en';
    document.getElementById('lang-input').value = currentLang;

    // Theme from server (fallback to saved/default), but default stays light
    const savedTheme = localStorage.getItem('theme') || DEFAULT_THEME;
    currentTheme = data.theme || savedTheme;
    bindThemeButtons(currentTheme);
    applyTheme(currentTheme, { persist: false });

    // Bio
    bioInput.value = data.bio || '';

    // Stats
    const joined = data.joinedAt ? new Date(data.joinedAt) : null;
    memberSinceEl.textContent = joined ? joined.getFullYear() : '—';
    totalEl.textContent = typeof data.totalTransactions === 'number' ? data.totalTransactions : '—';
  } catch (err) {
    console.error(err);
    showToast("Failed to load profile", "error");
  }
}

// Update profile
async function updateProfile() {
  const token = getToken();
  if (!token) {
    showToast("Not authenticated", "error");
    return setTimeout(() => (window.location.href = '/login.html'), 600);
  }
  try {
    const payload = {
      displayName: nameInput.value?.trim(),
      bio: bioInput.value?.trim() || '',
      language: document.getElementById('lang-input').value,
      theme: currentTheme,
      avatarUrl: currentAvatar
    };
    const res = await fetch(`${API}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...setAuthHeader() },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      showToast('Session expired', 'error');
      return setTimeout(() => (window.location.href = '/login.html'), 700);
    }
    if (!res.ok) throw new Error(data.message || 'Failed to update profile');

    // Reflect UI
    pName.textContent = payload.displayName || 'User';
    showToast('Profile saved', 'success');
    // Persist theme choice locally for next load
    if (payload.theme) localStorage.setItem('theme', payload.theme);
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Update failed', 'error');
  }
}

// Logout
document.getElementById('logout-btn').onclick = () => {
  sessionStorage.removeItem('accessToken');
  localStorage.removeItem('accessToken');
  window.location.href = '/login.html';
};

// Initialize
window.addEventListener('DOMContentLoaded', () => {
  // Apply saved/default theme before fetching to avoid flash, default is light
  const initialTheme = localStorage.getItem('theme') || DEFAULT_THEME;
  applyTheme(initialTheme, { persist: false });
  bindThemeButtons(initialTheme);
  fetchProfile();
});
