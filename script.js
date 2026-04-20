let completedCategories = new Set();
let appData = JSON.parse(localStorage.getItem("budgetApp")) || {};
let needs = [];

let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

/* STORAGE */
function getMonthKey() {
  return `${currentYear}-${currentMonth}`;
}

function getMonthData() {
  let key = getMonthKey();
  if (!appData[key]) {
    appData[key] = {
      income: {},
      categories: []
    };
  }
  return appData[key];
}

function saveData() {
  localStorage.setItem("budgetApp", JSON.stringify(appData));
}

/* MONTH SWITCH */
function changeMonth(direction) {
  currentMonth += direction;

  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }

  init();
}

/* MONTH LABEL */
function updateMonthLabel() {
  let months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  document.getElementById("monthLabel").innerText =
    months[currentMonth] + " " + currentYear;
}

/* QUIZ */
function nextStep(step) {
  document.querySelectorAll(".quiz-step").forEach(s => s.classList.add("hidden"));
  document.getElementById("step" + step).classList.remove("hidden");
}

function addNeed() {
  let input = document.getElementById("qNeedInput");
  let value = input.value;

  if (!value) return;

  needs.push(value);
  input.value = "";

  renderNeeds();
}

function finishQuiz() {
  let name = document.getElementById("qName").value;
  let payday = Number(document.getElementById("qPayday").value);

  localStorage.setItem("userName", name);
  localStorage.setItem("payday", payday);
  localStorage.setItem("quizDone", "true");

  let data = getMonthData();
  data.categories = [];

  needs.forEach(n => {
    data.categories.push({
      name: n,
      type: "fixed",
      value: 1000
    });
  });

  saveData();

  document.getElementById("quiz").classList.add("hidden");

  init();
}

function renderNeeds() {
  let container = document.getElementById("needsList");
  container.innerHTML = "";

  needs.forEach(n => {
    let div = document.createElement("div");
    div.classList.add("need-item");
    div.innerText = n;
    container.appendChild(div);
  });
}

/* GREETING */
function updateGreeting() {
  let name = localStorage.getItem("userName") || "";
  document.getElementById("greeting").innerText =
    name ? `Hey ${name} 👋` : "Monthly Budgeting";
}

/* CALENDAR */
function generateCalendar() {
  let calendar = document.getElementById("calendar");
  calendar.innerHTML = "";

  let data = getMonthData();
  let daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let i = 1; i <= daysInMonth; i++) {
    let div = document.createElement("div");
    div.classList.add("day");

    let income = data.income[i] || 0;

    div.innerHTML = `
      <strong>${i}</strong>
      <div>$${income}</div>
    `;

    div.onclick = () => openDayPopup(i);

    calendar.appendChild(div);
  }
}

/* TOTAL INCOME */
function getTotalIncome() {
  let data = getMonthData();
  return Object.values(data.income).reduce((a, b) => a + b, 0);
}

/* ADD INCOME (FIXED) */
function addIncome() {
  let input = document.getElementById("incomeInput");
  let value = Number(input.value);

  if (!value) return;

  let data = getMonthData();
  let today = new Date().getDate();

  data.income[today] = (data.income[today] || 0) + value;

  saveData();
  input.value = "";
  init();
}

/* CATEGORY */
function addCategory() {
  let name = document.getElementById("catName").value;
  let value = Number(document.getElementById("catValue").value);
  let type = document.getElementById("catType").value;

  if (!name || !value) return;

  let data = getMonthData();

  data.categories.push({
    name,
    type,
    value
  });

  saveData();
  closePopup();
  init();
}

function deleteCategory(index) {
  let data = getMonthData();
  data.categories.splice(index, 1);

  saveData();
  init();
}

function editCategory(index) {
  let data = getMonthData();
  let cat = data.categories[index];

  document.getElementById("catName").value = cat.name;
  document.getElementById("catValue").value = cat.value;

  window.editingIndex = index;
  openPopup();
}

/* ICONS */
function getIcon(name) {
  name = name.toLowerCase();
  if (name.includes("rent")) return "🏠";
  if (name.includes("car")) return "🚗";
  if (name.includes("save")) return "💰";
  if (name.includes("food")) return "🍔";
  return "💸";
}

/* RENDER CATEGORIES (FIXED) */
function renderCategories() {
  let container = document.getElementById("categories");
  container.innerHTML = "";

  let data = getMonthData();
  let totalIncome = getTotalIncome();

  data.categories.forEach((cat, index) => {

    let amount = 0;
    let percent = 0;

    if (totalIncome > 0) {
      if (cat.type === "percent") {
        amount = (totalIncome * cat.value) / 100;
        percent = cat.value;
      } else {
        amount = totalIncome;
        percent = (cat.value / totalIncome) * 100;
      }
     percent = totalIncome > 0
  ? (totalIncome / cat.value) * 100
  : 0;
    }

    percent = Math.min(percent, 100);

    let div = document.createElement("div");
    div.classList.add("category");

    div.innerHTML = `
      <div class="category-main" onclick="toggleCategory(${index})">
        <div class="category-header">
          <span>${getIcon(cat.name)} ${cat.name}</span>
          <span>$${totalIncome.toFixed(0)} / $${cat.value}</span>
        </div>

        <div class="progress-bar">
          <div class="progress-fill" style="width:${percent}%"></div>
        </div>
      </div>

      <div class="category-actions hidden" id="actions-${index}">
        <button onclick="editCategory(${index})">✏️ Edit</button>
        <button onclick="deleteCategory(${index})">🗑️ Delete</button>
      </div>
    `;

    container.appendChild(div);
  });

  let messageDiv = document.createElement("div");
  messageDiv.classList.add("remaining");

  if (totalIncome === 0) {
    messageDiv.innerText = "Add income to start 💰";
  } else {
    messageDiv.innerText = "Income distributed ✅";
  }

  container.appendChild(messageDiv);
}

function toggleCategory(index) {
  let el = document.getElementById(`actions-${index}`);
  el.classList.toggle("hidden");
}

/* PAYDAY */
function updatePayday() {
  let today = new Date();
  let payday = Number(localStorage.getItem("payday")) || 1;

  let nextPayday = new Date(today.getFullYear(), today.getMonth(), payday);

  if (today.getDate() >= payday) {
    nextPayday = new Date(today.getFullYear(), today.getMonth() + 1, payday);
  }

  let diff = nextPayday - today;
  let days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  document.getElementById("days").innerText = days;
}

/* DAY POPUP */
let selectedDay = null;

function openDayPopup(day) {
  selectedDay = day;

  let data = getMonthData();
  let current = data.income[day] || "";

  document.getElementById("dayAmount").value = current;
  document.getElementById("dayPopup").classList.remove("hidden");
}

function closeDayPopup() {
  document.getElementById("dayPopup").classList.add("hidden");
}

function saveDayIncome() {
  let value = Number(document.getElementById("dayAmount").value);

  let data = getMonthData();
  data.income[selectedDay] = value;

  saveData();
  closeDayPopup();
  init();
}

function deleteDayIncome() {
  let data = getMonthData();
  delete data.income[selectedDay];

  saveData();
  closeDayPopup();
  init();
}

/* POPUP */
function openPopup() {
  document.getElementById("popup").classList.remove("hidden");
}

function closePopup() {
  document.getElementById("popup").classList.add("hidden");
}

/* INIT */
function init() {
  updateMonthLabel();
  generateCalendar();
  renderCategories();
  updatePayday();
  updateGreeting();

  let totalIncome = getTotalIncome();
  document.getElementById("income").innerText = totalIncome.toFixed(2);

  if (!localStorage.getItem("quizDone")) {
    document.getElementById("quiz").classList.remove("hidden");
  }
}

/* START */
init();
