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

// Font Size
document.getElementById("font-size").addEventListener("change", (e) => {
  document.body.style.fontSize = e.target.value === "small" ? "14px" :
                                 e.target.value === "large" ? "18px" : "16px";
});

// Animated Logo
const finqText = document.querySelector(".logo-text");
let colors = ["#ff9933","#ffffff","#138808"];
let idx = 0;
setInterval(() => { finqText.style.color = colors[idx]; idx = (idx+1)%colors.length; }, 1500);

// Transactions Data
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let budget = parseInt(localStorage.getItem("budget")) || 10000;

// DOM Elements
const transactionList = document.getElementById("transaction-list");
const incomeEl = document.getElementById("income-amount");
const expenseEl = document.getElementById("expense-amount");
const balanceEl = document.getElementById("budget-amount");
const progressFill = document.getElementById("progress-fill");

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

// Render Transactions
function renderTransactions(){
  transactionList.innerHTML = "";
  if(transactions.length===0){
    transactionList.innerHTML = "<li class='empty-msg'>👋 Welcome to FINQ! Add a transaction ➕</li>";
    incomeEl.textContent="₹0"; expenseEl.textContent="₹0"; balanceEl.textContent="₹0";
    progressFill.style.width="0%"; return;
  }
  let income=0, expense=0;
  transactions.forEach((tx,i)=>{
    const li=document.createElement("li");
    li.style.color=tx.type==="income"?"green":"red";
    li.innerHTML=`₹${tx.amount} - ${tx.type} (${tx.category}, ${tx.mode}) ${tx.notes||""}
      <button onclick="editTransaction(${i})">✏️</button>
      <button onclick="deleteTransaction(${i})">🗑</button>`;
    li.dataset.type=tx.type; li.dataset.category=tx.category;
    transactionList.appendChild(li);
    if(tx.type==="income") income += tx.amount; else expense+=tx.amount;
  });
  incomeEl.textContent=`₹${income}`; expenseEl.textContent=`₹${expense}`;
  balanceEl.textContent=`₹${income-expense}`;
  progressFill.style.width=Math.min((expense/budget)*100,100)+"%";
}
renderTransactions();

// Popup
const popup=document.getElementById("transaction-popup");
const errorMsg=document.getElementById("error-msg");
let currentType="income";

// Open Add Income / Expense
document.getElementById("add-income").addEventListener("click",()=>openPopup("income"));
document.getElementById("add-expense").addEventListener("click",()=>openPopup("expense"));

function openPopup(type){
  currentType=type;
  loadCategories(type);
  popup.classList.add("open"); errorMsg.textContent="";
}
document.getElementById("close-popup").addEventListener("click",()=>popup.classList.remove("open"));

// Load categories dynamically
function loadCategories(type){
  const catSelect=document.getElementById("category");
  catSelect.innerHTML="";
  categories[type].forEach(c=>{
    const opt=document.createElement("option");
    opt.value=c.value; opt.textContent=c.text;
    catSelect.appendChild(opt);
  });
}

// Save Transaction
document.getElementById("save-transaction").addEventListener("click",()=>{
  const amount=parseInt(document.getElementById("amount").value);
  const category=document.getElementById("category").value;
  const mode=document.getElementById("mode").value;
  const notes=document.getElementById("notes").value;
  if(!amount){ errorMsg.textContent="⚠️ Please enter amount"; return;}
  transactions.push({amount,type:currentType,category,mode,notes,date:new Date().toLocaleString()});
  localStorage.setItem("transactions",JSON.stringify(transactions));
  renderTransactions(); popup.classList.remove("open");
  document.getElementById("amount").value=""; document.getElementById("notes").value="";
});

// Delete
function deleteTransaction(i){ transactions.splice(i,1); localStorage.setItem("transactions",JSON.stringify(transactions)); renderTransactions(); }

// Edit
function editTransaction(i){
  const tx=transactions[i]; currentType=tx.type;
  loadCategories(tx.type);
  document.getElementById("amount").value=tx.amount;
  document.getElementById("category").value=tx.category;
  document.getElementById("mode").value=tx.mode;
  document.getElementById("notes").value=tx.notes;
  popup.classList.add("open");
  document.getElementById("save-transaction").onclick=()=>{
    const amt=parseInt(document.getElementById("amount").value);
    if(!amt){ errorMsg.textContent="⚠️ Please enter amount"; return;}
    transactions[i]={amount:amt,type:currentType,category:document.getElementById("category").value,
      mode:document.getElementById("mode").value,notes:document.getElementById("notes").value,
      date:new Date().toLocaleString()};
    localStorage.setItem("transactions",JSON.stringify(transactions));
    renderTransactions(); popup.classList.remove("open");
    resetSaveBtn(); 
  };
}
function resetSaveBtn(){ document.getElementById("save-transaction").onclick=()=>{ // reset to default save
  const amount=parseInt(document.getElementById("amount").value);
  if(!amount){ errorMsg.textContent="⚠️ Please enter amount"; return;}
  transactions.push({amount,type:currentType,category:document.getElementById("category").value,
    mode:document.getElementById("mode").value,notes:document.getElementById("notes").value,
    date:new Date().toLocaleString()});
  localStorage.setItem("transactions",JSON.stringify(transactions));
  renderTransactions(); popup.classList.remove("open"); document.getElementById("amount").value="";
  document.getElementById("notes").value="";};
}
resetSaveBtn();

// Budget Save
document.getElementById("add-budget").addEventListener("click",()=>{
  const newB=parseInt(document.getElementById("budget-input").value);
  if(newB && newB>0){budget=newB;localStorage.setItem("budget",budget);renderTransactions();}
});

// Welcome popup with countdown and close button
const welcomePopup = document.getElementById("welcome-popup");
const countdownTimer = document.getElementById("countdown-timer");
const closeWelcomeBtn = document.getElementById("close-welcome");

let countdownValue = 15;
let countdownInterval;

function startWelcomePopup() {
  countdownValue = 15;
  countdownTimer.textContent = countdownValue;
  welcomePopup.classList.add("show");
  document.body.classList.add("popup-open");
  countdownInterval = setInterval(() => {
    countdownValue--;
    countdownTimer.textContent = countdownValue;
    if (countdownValue <= 0) {
      hideWelcomePopup();
    }
  }, 1000);
}

function hideWelcomePopup() {
  welcomePopup.classList.remove("show");
  document.body.classList.remove("popup-open");
  clearInterval(countdownInterval);
}

closeWelcomeBtn.addEventListener("click", hideWelcomePopup);

// Automatically show popup on page load with smooth animation
window.addEventListener("load", () => {
  setTimeout(() => startWelcomePopup(), 500); // delay for smooth UX
});

const marqueeContainer = document.getElementById("marquee-container");
const closeMarqueeBtn = document.getElementById("close-marquee");

closeMarqueeBtn.addEventListener("click", () => {
  marqueeContainer.style.display = "none";
});

// Auto hide marquee after 30 seconds
setTimeout(() => {
  marqueeContainer.style.display = "none";
}, 30000);


// Filters
document.querySelectorAll(".filter").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".filter").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    const type=btn.dataset.type;
    document.querySelectorAll("#transaction-list li").forEach(it=>{
      if(type==="all"|| it.dataset.type===type|| it.dataset.category===type) it.style.display="block";
      else it.style.display="none";
    });
  });
});
