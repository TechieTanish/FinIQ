const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => root.querySelectorAll(sel);

// Mobile menu toggle
const hamburger = $('.hamburger');
const mobilePanel = $('#mobile-panel');
if (hamburger) {
  hamburger.addEventListener('click', () => {
    mobilePanel.classList.toggle('open');
  });
}

// Theme handling
const THEME_KEY = 'finq-theme';

function applyTheme(theme) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
}

// Init theme
(function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'light';
  applyTheme(saved);
})();

// Theme buttons
$$('.theme-option').forEach(btn => {
  btn.addEventListener('click', () => {
    applyTheme(btn.dataset.theme);
  });
});

// Footer year
$('#year').textContent = new Date().getFullYear();
