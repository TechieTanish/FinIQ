// Fade ready and back
function readyUp(){ document.body.classList.remove("preload"); document.body.classList.add("ready"); }
window.addEventListener("DOMContentLoaded", readyUp);
window.addEventListener("pageshow", readyUp, { once:false });

document.getElementById("back-home").addEventListener("click", (e) => {
  e.preventDefault();
  document.body.classList.remove("ready");
  document.body.classList.add("preload");
  setTimeout(() => history.back(), 220);
});

// Basic interactions (local only demo)
const nameInput = document.getElementById("name-input");
const langInput = document.getElementById("lang-input");
const budgetInput = document.getElementById("budget-input-prof");
const themeBtns = document.querySelectorAll(".seg-btn");

function showToast(msg) {
  const c = document.getElementById("toast-container");
  const t = document.createElement("div");
  t.className = "toast show";
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(()=>t.remove(),1800);
}

document.getElementById("save-prof").addEventListener("click", () => {
  document.getElementById("p-name").textContent = nameInput.value || "Tanish";
  const theme = Array.from(themeBtns).find(b=>b.classList.contains("active"))?.dataset.theme || "light";
  if (theme === "dark") document.body.classList.add("dark"); else document.body.classList.remove("dark");
  showToast("Profile saved");
});

themeBtns.forEach(b => b.addEventListener("click", () => {
  themeBtns.forEach(x=>x.classList.remove("active"));
  b.classList.add("active");
}));

// Slider images for profile
const sliderTrack = document.querySelector(".slider-track");
["Images/income/wallet.jpg","Images/expense/food.jpg","Images/budget/plan.jpg","Images/profile/avatar.png"].concat(["Images/income/wallet.jpg","Images/expense/food.jpg","Images/budget/plan.jpg","Images/profile/avatar.png"]).forEach(src=>{
  const d=document.createElement("div"); d.className="slider-item"; const i=document.createElement("img"); i.src=src; i.onerror=()=>{d.classList.add("ph"); d.innerHTML="";}; d.appendChild(i); sliderTrack.appendChild(d);
});
const io = new IntersectionObserver(e => e.forEach(x => sliderTrack.classList.toggle("paused", !x.isIntersecting)), { threshold:0.2 });
io.observe(document.querySelector(".slider-wrap"));
