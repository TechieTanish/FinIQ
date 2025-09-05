// Page fade fix for back/forward cache
function readyUp() {
document.body.classList.remove("preload");
document.body.classList.add("ready");
}
window.addEventListener("DOMContentLoaded", readyUp);
window.addEventListener("pageshow", readyUp, { once: false });

// JSON fetch helper with JWT auth
async function fetchJSON(url, { method = 'GET', body, auth = false, headers = {} } = {}) {
const token = sessionStorage.getItem('accessToken');
const res = await fetch(url, {
method,
headers: {
'Content-Type': 'application/json',
...(auth && token ? { 'Authorization': `Bearer ${token}` } : {}),
...headers,
},
body: body ? JSON.stringify(body) : undefined,
});
let data = null;
try { data = await res.json(); } catch {}
if (!res.ok) {
if (res.status === 401) {
// Token expired or invalid, redirect to login
sessionStorage.removeItem('accessToken');
window.location.href = 'login.html';
return;
}
throw new Error(data?.message || `Request failed (${res.status})`);
}
return data;
}

// Check if user is logged in on page load
window.addEventListener('load', () => {
const token = sessionStorage.getItem('accessToken');
if (!token) {
window.location.href = 'login.html';
return;
}
// Load user profile
loadUserProfile();
setDefaultDates();
applySmoothScrollEffect();
loadBudget().catch(() => {});
loadTransactions().catch(() => {});
});

// Load user profile (protected route)
async function loadUserProfile() {
try {
const data = await fetchJSON('/api/v1/profile', { auth: true });
// Update UI with user info if needed
console.log('User profile:', data);
} catch (err) {
console.error('Failed to load profile:', err);
}
}

// Theme Toggle
const themeBtn = document.getElementById("theme-toggle");
themeBtn.addEventListener("click", () => {
document.body.classList.toggle("dark");
themeBtn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
});

// Animated Logo
const finqText = document.querySelector(".logo-text");
let colors = ["#ff9933", "#ffffff", "#138808"];
let idx = 0;
setInterval(() => { finqText.style.color = colors[idx]; idx = (idx + 1) % colors.length; }, 1500);

// Navigate buttons
document.getElementById("profile-btn").addEventListener("click", () => navigateWithFade("profile.html"));

// API BASE
const API = '/api/v1';

// App State
let transactions = [];
let budget = 10000;
let activeChip = "all";
let dateFrom = null, dateTo = null;

// DOM Elements
const txTableBody = document.getElementById("tx-tbody");
const txCount = document.getElementById("tx-count");
const emptyTable = document.getElementById("empty-table");
const incomeMonthEl = document.getElementById("income-month");
const expenseMonthEl = document.getElementById("expense-month");
const budgetRemainingEl = document.getElementById("budget-remaining");
const progressFill = document.getElementById("progress-fill");
const progressLabel = document.getElementById("progress-label");
const nudgeEl = document.getElementById("nudge");

// Categories
const categories = {
income: [
{ value: "salary", text: "💼 Salary" },
{ value: "business", text: "🏢 Business" },
{ value: "gift", text: "🎁 Gift" },
{ value: "others", text: "📦 Other Income" }
],
expense: [
{ value: "food", text: "🍔 Food" },
{ value: "travel", text: "🚖 Travel" },
{ value: "rent", text: "🏠 Rent" },
{ value: "others", text: "📦 Others" }
]
};

// Utils (IST)
const IST = 'Asia/Kolkata';
function isThisMonth(d) {
const dt = new Date(d), now = new Date();
return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
}
function toRelative(time) {
const t = new Date(time).getTime();
const diff = Math.max(0, Date.now() - t);
const sec = Math.floor(diff / 1000);
if (sec < 60) return `${sec}s ago`;
const min = Math.floor(sec / 60);
if (min < 60) return `${min}m ago`;
const hr = Math.floor(min / 60);
if (hr < 24) return `${hr}h ago`;
const day = Math.floor(hr / 24);
if (day < 30) return `${day}d ago`;
const mo = Math.floor(day / 30);
return `${mo}mo ago`;
}
function formatINR(n) { return `₹${(n ?? 0).toLocaleString("en-IN")}`; }
function formatIST(dt) {
return new Date(dt).toLocaleString("en-IN", { timeZone: IST, year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: true });
}
function inRangeIST(dt) {
if (!dateFrom && !dateTo) return true;
const t = new Date(new Date(dt).toLocaleString("en-US", { timeZone: IST })).getTime();
if (dateFrom && t < dateFrom.getTime()) return false;
if (dateTo && t > dateTo.getTime() + 86399999) return false;
return true;
}

// Toasts with click sound
const toastContainer = document.getElementById("toast-container");
const audioCtx = window.AudioContext ? new AudioContext() : null;
function clickSound() {
if (!audioCtx) return;
const o = audioCtx.createOscillator();
const g = audioCtx.createGain();
o.type = "square"; o.frequency.value = 880;
g.gain.value = 0.05;
o.connect(g); g.connect(audioCtx.destination);
o.start(); setTimeout(() => { o.stop(); }, 80);
}
function showToast(message, type = "info") {
const t = document.createElement("div");
t.className = `toast ${type}`;
t.textContent = message;
toastContainer.appendChild(t);
requestAnimationFrame(() => t.classList.add("show"));
clickSound();
setTimeout(() => {
t.classList.remove("show");
setTimeout(() => t.remove(), 300);
}, 2200);
}

// API Helpers (now with auth)
async function loadTransactions() {
try {
const data = await fetchJSON(`${API}/transactions`, { auth: true });
transactions = (data || []).map(tx => ({ createdAt: tx.createdAt ?? new Date().toISOString(), ...tx }));
render();
} catch (err) {
showToast('Failed to load transactions', 'error');
}
}

async function createTransaction({ amount, type, category, mode, notes }) {
const payload = { amount, type, category, mode, notes, createdAt: new Date().toISOString() };
const data = await fetchJSON(`${API}/transactions`, {
method: 'POST',
body: payload,
auth: true
});
return data;
}

async function updateTransaction(id, data) {
return await fetchJSON(`${API}/transactions/${id}`, {
method: 'PUT',
body: data,
auth: true
});
}

async function deleteTransactionById(id) {
return await fetchJSON(`${API}/transactions/${id}`, {
method: 'DELETE',
auth: true
});
}

async function loadBudget() {
try {
const data = await fetchJSON(`${API}/budget`, { auth: true });
budget = data.budget ?? 10000;
render();
} catch (err) {
// Budget endpoint might not exist yet, use default
console.warn('Budget endpoint not available:', err);
}
}

async function saveBudget(newB) {
await fetchJSON(`${API}/budget`, {
method: 'POST',
body: { budget: newB },
auth: true
});
await loadBudget();
showToast(`Budget set to ${formatINR(newB)}`, "success");
}

// Rendering functions
function computeMonthlyStats() {
let inc = 0, exp = 0;
for (const tx of transactions) {
if (!isThisMonth(tx.createdAt)) continue;
if (tx.type === "income") inc += Number(tx.amount) || 0;
else if (tx.type === "expense") exp += Number(tx.amount) || 0;
}
return { inc, exp };
}

function applySmoothScrollEffect() {
const wrap = document.querySelector(".table-wrap");
if (!wrap) return;
wrap.addEventListener("scroll", () => {
const rows = Array.from(document.querySelectorAll("#tx-tbody tr"));
const rect = wrap.getBoundingClientRect();
const mid = rect.top + rect.height / 2;
rows.forEach(r => {
const rb = r.getBoundingClientRect();
const center = rb.top + rb.height / 2;
const ratio = Math.min(1, Math.abs(center - mid) / (rect.height / 2));
if (ratio > 0.6) r.classList.add("dim"); else r.classList.remove("dim");
});
}, { passive: true });
}

function renderTable() {
txTableBody.innerHTML = "";
const filtered = transactions.filter(tx => {
if (!inRangeIST(tx.createdAt)) return false;
if (activeChip === "all") return true;
if (activeChip === "income" || activeChip === "expense") return tx.type === activeChip;
return tx.category === activeChip;
});

if (filtered.length === 0) {
emptyTable.classList.remove("hidden");
txCount.textContent = "0 items";
return;
}
emptyTable.classList.add("hidden");

filtered.forEach(tx => {
const tr = document.createElement("tr");
tr.dataset.type = tx.type;
tr.dataset.category = tx.category;
tr.innerHTML = `
<td><strong>${formatINR(tx.amount)}</strong></td>
<td><span class="badge ${tx.type}">${tx.type}</span></td>
<td>${tx.category || "-"}</td>
<td>${tx.mode || "-"}</td>
<td>${tx.notes ? tx.notes : "-"}</td>
<td title="${toRelative(tx.createdAt)}">${formatIST(tx.createdAt)}</td>
<td>
<button class="icon-btn" data-act="edit" title="Edit">✏️</button>
<button class="icon-btn" data-act="del" title="Delete">🗑</button>
</td>
`;
tr.querySelector('[data-act="edit"]').addEventListener("click", () => startEdit(tx.id));
tr.querySelector('[data-act="del"]').addEventListener("click", () => handleDelete(tx.id));
txTableBody.appendChild(tr);
});

txCount.textContent = `${filtered.length} ${filtered.length === 1 ? "item" : "items"}`;
}

function updateNudge(pct) {
let msg = "";
if (pct <= 20) msg = "Warm-up stage: log a few expenses to unlock meaningful insights.";
else if (pct <= 40) msg = "Good pace—keep tracking and watch trends form.";
else if (pct <= 60) msg = "Midway through the budget—plan the remaining days mindfully.";
else if (pct <= 80) msg = "Heads-up: usage is rising—prioritize essentials first.";
else msg = "Critical zone: budget nearly used—pause non-urgent spends.";
nudgeEl.textContent = msg;
}

function renderCardsAndProgress() {
const { inc, exp } = computeMonthlyStats();
incomeMonthEl.textContent = formatINR(inc);
expenseMonthEl.textContent = formatINR(exp);
const remaining = Math.max(0, (budget || 0) - exp);
budgetRemainingEl.textContent = formatINR(remaining);

const usedPct = budget > 0 ? Math.min(100, Math.round((exp / budget) * 100)) : 0;
progressLabel.textContent = `${usedPct}% of ${formatINR(budget)} used`;
progressFill.style.width = "0%";
requestAnimationFrame(() => { progressFill.style.width = `${usedPct}%`; });
updateNudge(usedPct);
}

function render() {
renderCardsAndProgress();
renderTable();
}

// Popup flow
const popup = document.getElementById("transaction-popup");
const errorMsg = document.getElementById("error-msg");
let currentType = "income";
document.getElementById("add-income").addEventListener("click", () => openPopup("income"));
document.getElementById("add-expense").addEventListener("click", () => openPopup("expense"));

function openPopup(type) {
currentType = type; loadCategories(type);
popup.classList.add("open"); 
popup.setAttribute("aria-hidden", "false"); 
errorMsg.textContent = "";
}

document.getElementById("close-popup").addEventListener("click", () => { 
popup.classList.remove("open"); 
popup.setAttribute("aria-hidden", "true"); 
});

function loadCategories(type) {
const catSelect = document.getElementById("category"); 
catSelect.innerHTML = "";
(categories[type] || []).forEach(c => { 
const opt = document.createElement("option"); 
opt.value = c.value; 
opt.textContent = c.text; 
catSelect.appendChild(opt); 
});
}

// Save transaction
document.getElementById("save-transaction").addEventListener("click", onSaveClick);
async function onSaveClick() {
const amount = parseInt(document.getElementById("amount").value);
const category = document.getElementById("category").value;
const mode = document.getElementById("mode").value;
const notes = document.getElementById("notes").value;
if (!amount) { errorMsg.textContent = "⚠️ Please enter amount"; return; }
try {
await createTransaction({ amount, type: currentType, category, mode, notes });
await loadTransactions();
popup.classList.remove("open"); 
popup.setAttribute("aria-hidden", "true");
document.getElementById("amount").value = ""; 
document.getElementById("notes").value = "";
showToast("Transaction saved", "success");
} catch (e) { 
errorMsg.textContent = e.message || "Failed to save"; 
showToast("Save failed", "error"); 
}
}

// Delete transaction
async function handleDelete(id) { 
try { 
await deleteTransactionById(id); 
await loadTransactions(); 
showToast("Transaction deleted", "success"); 
} catch (e) { 
showToast(e.message || "Failed to delete", "error"); 
} 
}

// Edit transaction
function startEdit(id) {
const tx = transactions.find(t => t.id === id); 
if (!tx) return;
currentType = tx.type; 
loadCategories(tx.type);
document.getElementById("amount").value = tx.amount; 
document.getElementById("category").value = tx.category; 
document.getElementById("mode").value = tx.mode; 
document.getElementById("notes").value = tx.notes || "";
popup.classList.add("open"); 
popup.setAttribute("aria-hidden", "false");
const saveBtn = document.getElementById("save-transaction");
saveBtn.removeEventListener("click", onSaveClick);
saveBtn.onclick = async () => {
const amt = parseInt(document.getElementById("amount").value);
if (!amt) { errorMsg.textContent = "⚠️ Please enter amount"; return; }
try {
await updateTransaction(id, { 
amount: amt, 
type: currentType, 
category: document.getElementById("category").value, 
mode: document.getElementById("mode").value, 
notes: document.getElementById("notes").value 
});
await loadTransactions();
popup.classList.remove("open"); 
popup.setAttribute("aria-hidden", "true"); 
resetSaveBtn(); 
showToast("Transaction updated", "success");
} catch (e) { 
errorMsg.textContent = e.message || "Failed to update"; 
showToast("Update failed", "error"); 
}
};
}

function resetSaveBtn() { 
const saveBtn = document.getElementById("save-transaction"); 
saveBtn.onclick = null; 
saveBtn.addEventListener("click", onSaveClick, { once: false }); 
}
resetSaveBtn();

// Date inputs
const fromInput = document.getElementById("from-date");
const toInput = document.getElementById("to-date");
const resetBtn = document.getElementById("reset-dates");

function setDefaultDates() {
const now = new Date(); 
const first = new Date(now.getFullYear(), now.getMonth(), 1);
fromInput.valueAsDate = first; 
toInput.valueAsDate = now; 
dateFrom = new Date(first); 
dateTo = new Date(now);
}

fromInput.addEventListener("change", () => { 
dateFrom = fromInput.value ? new Date(fromInput.value) : null; 
renderTable(); 
});
toInput.addEventListener("change", () => { 
dateTo = toInput.value ? new Date(toInput.value) : null; 
renderTable(); 
});
resetBtn.addEventListener("click", () => { 
setDefaultDates(); 
renderTable(); 
});

// Filters (chips)
document.querySelectorAll(".filter").forEach(btn => {
btn.addEventListener("click", () => {
document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
btn.classList.add("active");
activeChip = btn.dataset.type;
renderTable();
});
});

// Overview card navigation with fade-out
function navigateWithFade(href) {
document.body.classList.remove("ready");
document.body.classList.add("preload");
setTimeout(() => { window.location.href = href; }, 220);
}

document.getElementById("card-income").addEventListener("click", () => navigateWithFade("income.html"));
document.getElementById("card-expense").addEventListener("click", () => navigateWithFade("expense.html"));
document.getElementById("card-budget").addEventListener("click", () => navigateWithFade("budget.html"));
