// Page fade and back fix
function readyUp(){ document.body.classList.remove("preload"); document.body.classList.add("ready"); }
window.addEventListener("DOMContentLoaded", readyUp);
window.addEventListener("pageshow", readyUp, { once:false });

const API = 'http://localhost:8080/api/v1';
const type = document.body.dataset.view || 'income';

// Build type-specific slider content with pause after table (when out of view)
const sliderTrack = document.querySelector(".slider-track");
const imageMap = {
  income: ["Images/income/salary.jpg","Images/income/wallet.jpg","Images/income/bonus.jpg","Images/income/savings.jpg"],
  expense:["Images/expense/food.jpg","Images/expense/travel.jpg","Images/expense/shopping.jpg","Images/expense/bills.jpg"],
  budget: ["Images/budget/piggy.jpg","Images/budget/plan.jpg","Images/budget/targets.jpg","Images/budget/checklist.jpg"]
};
if (sliderTrack) {
  const list = (imageMap[type] || []).concat(imageMap[type] || []);
  list.forEach(src => {
    const d = document.createElement("div"); d.className = "slider-item";
    const img = document.createElement("img"); img.src = src; img.alt = "FINQ";
    img.onerror = () => { d.classList.add("ph"); d.innerHTML = ""; };
    d.appendChild(img); sliderTrack.appendChild(d);
  });
  const io = new IntersectionObserver(
    entries => entries.forEach(e => sliderTrack.classList.toggle("paused", !e.isIntersecting)),
    { root: null, threshold: 0.2 }
  );
  io.observe(document.querySelector(".slider-wrap"));
}

function formatINR(n){ return `₹${(n??0).toLocaleString("en-IN")}`; }
function toRelative(t){ const d = new Date(t||Date.now()); const s=(Date.now()-d.getTime())/1000|0;
  if(s<60) return `${s}s ago`; const m=s/60|0; if(m<60) return `${m}m ago`; const h=m/60|0; if(h<24) return `${h}h ago`; const dy=h/24|0; return `${dy}d ago`; }
const IST = 'Asia/Kolkata';
function formatIST(dt) {
  return new Date(dt).toLocaleString("en-IN", { timeZone: IST, year:"numeric", month:"short", day:"2-digit", hour:"2-digit", minute:"2-digit", hour12:true });
}

async function fetchAll() {
  const [txRes, budRes] = await Promise.all([ fetch(`${API}/transactions`), fetch(`${API}/budget`) ]);
  const tx = await txRes.json().then(a => a||[]);
  const bud = await budRes.json().catch(()=>({})) || {};
  return { tx, budget: bud.budget ?? 10000 };
}

function renderBudgetProgress(budget, spent) {
  const fill = document.querySelector(".progress-fill");
  const pct = budget>0 ? Math.min(100, Math.round(spent*100/budget)) : 0;
  if (fill) { fill.style.width = "0%"; requestAnimationFrame(()=> fill.style.width = `${pct}%`); }
  const lbl = document.getElementById("budget-label");
  if (lbl) lbl.textContent = `${pct}% of ${formatINR(budget)} used`;
}

function renderTable(list, filter) {
  const wrap = document.querySelector(".table-wrap");
  const tbody = document.querySelector("tbody");
  const count = document.querySelector(".table-meta span");
  tbody.innerHTML = "";
  const filtered = list.filter(filter);
  count.textContent = `${filtered.length} ${filtered.length===1?"item":"items"}`;

  if (filtered.length === 0) {
    const tr = document.createElement("tr"); const td = document.createElement("td");
    td.colSpan = 7; td.textContent = "No records yet — add your first one from the dashboard.";
    tr.appendChild(td); tbody.appendChild(tr);
  } else {
    filtered.forEach(tx => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${formatINR(tx.amount)}</strong></td>
        <td><span class="badge ${tx.type}">${tx.type}</span></td>
        <td>${tx.category || "-"}</td>
        <td>${tx.mode || "-"}</td>
        <td>${tx.notes ? tx.notes : "-"}</td>
        <td title="${toRelative(tx.createdAt)}">${formatIST(tx.createdAt)}</td>
        <td></td>`;
      tbody.appendChild(tr);
    });
  }

  // Smooth row dim on scroll
  wrap.addEventListener("scroll", () => {
    const rows = Array.from(tbody.querySelectorAll("tr"));
    const rect = wrap.getBoundingClientRect();
    const mid = rect.top + rect.height/2;
    rows.forEach(r => {
      const rb = r.getBoundingClientRect();
      const center = rb.top + rb.height/2;
      const ratio = Math.min(1, Math.abs(center - mid) / (rect.height/2));
      if (ratio > 0.6) r.classList.add("dim"); else r.classList.remove("dim");
    });
  }, { passive:true });
}

async function init() {
  const { tx, budget } = await fetchAll();
  let income = 0, expense = 0;
  tx.forEach(t => (t.type === "income" ? income += Number(t.amount)||0 : expense += Number(t.amount)||0));

  document.getElementById("sum-income")?.append(document.createTextNode(formatINR(income)));
  document.getElementById("sum-expense")?.append(document.createTextNode(formatINR(expense)));
  document.getElementById("sum-remaining")?.append(document.createTextNode(formatINR(Math.max(0, budget - expense))));

  if (type === "income") {
    renderTable(tx, t => t.type === "income");
  } else if (type === "expense") {
    renderTable(tx, t => t.type === "expense");
    renderBudgetProgress(budget, expense);
  } else if (type === "budget") {
    renderTable(tx, _ => true);
    renderBudgetProgress(budget, expense);
  }
}
document.getElementById("back-home")?.addEventListener("click", (e) => {
  e.preventDefault();
  document.body.classList.remove("ready");
  document.body.classList.add("preload");
  setTimeout(() => history.back(), 220);
});
init().catch(()=>{});
