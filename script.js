// Theme Toggle
const themeBtn = document.getElementById("theme-toggle");
themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  themeBtn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
});

// Sidebar
const sidebar = document.getElementById("profile-sidebar");
document.getElementById("profile-btn").addEventListener("click", () => sidebar.classList.add("open"));
document.getElementById("close-sidebar").addEventListener("click", () => sidebar.classList.remove("open"));

// Font size control
document.getElementById("font-size").addEventListener("change", (e) => {
  document.body.style.fontSize = e.target.value === "small" ? "14px" :
                                e.target.value === "large" ? "18px" : "16px";
});

// Navbar FINQ color cycle
const finqText = document.querySelector(".logo-text");
let colors = ["#ff9933","#ffffff","#138808"];
let idx = 0;
setInterval(() => {
  finqText.style.color = colors[idx];
  idx = (idx + 1) % colors.length;
}, 1500);

// Expense Popup
const popup = document.getElementById("expense-popup");
document.getElementById("add-expense").addEventListener("click", () => popup.classList.add("open"));
document.getElementById("close-popup").addEventListener("click", () => popup.classList.remove("open"));

// Expense Logic
const saveBtn = document.getElementById("save-expense");
const transactionList = document.getElementById("transaction-list");
let expense = 0, budget = 10000;

saveBtn.addEventListener("click", () => {
  const amount = parseInt(document.getElementById("amount").value);
  const category = document.getElementById("category").value;
  const mode = document.getElementById("mode").value;
  const notes = document.getElementById("notes").value;

  if (!amount) return alert("Enter amount!");

  // Remove empty message
  const emptyMsg = document.querySelector(".empty-msg");
  if(emptyMsg) emptyMsg.remove();

  transactionList.classList.remove("empty");
  transactionList.innerHTML += `<li data-category="${category}">₹${amount} - ${category} (${mode}) ${notes}</li>`;

  expense += amount;
  document.getElementById("expense-amount").textContent = `₹${expense}`;
  document.getElementById("budget-amount").textContent = `₹${budget - expense}`;

  let percent = Math.min((expense / budget) * 100, 100);
  document.getElementById("progress-fill").style.width = percent + "%";

  const nudge = document.getElementById("nudge");
  if (percent < 50) nudge.textContent = langSwitch.value==="hi"?"✅ खर्च नियंत्रित है।":"✅ You're managing expenses very well.";
  else if (percent < 80) nudge.textContent = langSwitch.value==="hi"?"⚡ खर्च बढ़ रहा है।":"⚡ Keep an eye, spending is rising.";
  else nudge.textContent = langSwitch.value==="hi"?"🚨 बजट लगभग खत्म!":"🚨 Budget almost finished!";

  popup.classList.remove("open");
  document.getElementById("amount").value = "";
  document.getElementById("notes").value = "";
});

// Budget Add Button
document.getElementById("add-budget").addEventListener("click", () => {
  const newBudget = parseInt(document.querySelector("#budget-label input").value);
  if(newBudget && newBudget>0) {
    budget = newBudget;
    document.getElementById("budget-amount").textContent = `₹${budget - expense}`;
    const percent = Math.min((expense / budget) * 100, 100);
    document.getElementById("progress-fill").style.width = percent + "%";
  }
});

// Filters
document.querySelectorAll(".filter").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const type = btn.getAttribute("data-type");
    document.querySelectorAll("#transaction-list li").forEach(item => {
      if (type === "all" || item.dataset.category === type) item.style.display = "block";
      else item.style.display = "none";
    });
  });
});

// Language Switch
const langSwitch = document.getElementById("language-switch");
langSwitch.addEventListener("change", () => {
  const lang = langSwitch.value;
  if(lang==="hi"){
    document.getElementById("overview-title").textContent = "📌 अवलोकन";
    document.getElementById("income-title").textContent = "💰 आय";
    document.getElementById("expense-title").textContent = "💸 खर्च";
    document.getElementById("budget-title").textContent = "🎯 शेष बजट";
    document.getElementById("progress-title").textContent = "📈 बजट उपयोग";
    document.getElementById("transaction-title").textContent = "💬 लेन-देन";
    document.getElementById("add-expense-title").textContent = "➕ खर्च जोड़ें";
    document.getElementById("profile-name").innerHTML = "नाम: <strong>आप</strong>";
    document.getElementById("budget-label").innerHTML = "मासिक बजट: <input type='number' placeholder='₹10000'>";
    const emptyMsg = document.querySelector(".empty-msg");
    if(emptyMsg) emptyMsg.textContent = "👋 FINQ में आपका स्वागत है! पहला खर्च जोड़ें ➕";
  } else {
    document.getElementById("overview-title").textContent = "📌 Overview";
    document.getElementById("income-title").textContent = "💰 Income";
    document.getElementById("expense-title").textContent = "💸 Expense";
    document.getElementById("budget-title").textContent = "🎯 Budget Left";
    document.getElementById("progress-title").textContent = "📈 Budget Usage";
    document.getElementById("transaction-title").textContent = "💬 Transactions";
    document.getElementById("add-expense-title").textContent = "➕ Add Expense";
    document.getElementById("profile-name").innerHTML = "Name: <strong>You</strong>";
    document.getElementById("budget-label").innerHTML = "Monthly Budget: <input type='number' placeholder='₹10000'>";
    const emptyMsg = document.querySelector(".empty-msg");
    if(emptyMsg) emptyMsg.textContent = "👋 Welcome to FINQ! Start by adding your first expense ➕";
  }
});
