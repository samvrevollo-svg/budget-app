let appData = JSON.parse(localStorage.getItem("budgetApp")) || {};

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

    div.onclick = () => {
      openDayPopup(i);
    };

    calendar.appendChild(div);
  }
}

/* TOTAL INCOME */
function getTotalIncome() {
  let data = getMonthData();
  return Object.values(data.income).reduce((a, b) => a + b, 0);
}

/* CATEGORY ADD/EDIT */
function addCategory() {
  let name = document.getElementById("catName").value;
  let type = document.getElementById("catType").value;
  let value = Number(document.getElementById("catValue").value);

  if (!name || !value) return;

  let data = getMonthData();

  if (window.editingIndex !== undefined) {
    data.categories[window.editingIndex] = { name, type, value };
    window.editingIndex = undefined;
  } else {
    data.categories.push({ name, type, value });
  }

  saveData();
  closePopup();
  init();
}

/* DELETE CATEGORY */
function deleteCategory(index) {
  let data = getMonthData();
  data.categories.splice(index, 1);

  saveData();
  init();
}

/* EDIT CATEGORY */
function editCategory(index) {
  let data = getMonthData();
  let cat = data.categories[index];

  document.getElementById("catName").value = cat.name;
  document.getElementById("catType").value = cat.type;
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
  if (name.includes("dad")) return "👨";
  return "💸";
}

/* RENDER CATEGORIES */
function renderCategories() {
  let container = document.getElementById("categories");
  container.innerHTML = "";

  let data = getMonthData();
  let totalIncome = getTotalIncome();

  let totalAllocated = 0;

  data.categories.forEach((cat, index) => {
    let amount = cat.type === "percent"
      ? (totalIncome * cat.value) / 100
      : cat.value;

    totalAllocated += amount;

    let percent = (amount / totalIncome) * 100 || 0;

    let div = document.createElement("div");
    div.classList.add("category");

    div.innerHTML = `
      <div class="category-header">
        <span>${getIcon(cat.name)} ${cat.name}</span>
        <span>$${amount.toFixed(0)}</span>
      </div>

      <div class="progress-bar">
        <div class="progress-fill" style="width:${percent}%"></div>
      </div>

      <div style="margin-top:5px;">
        <button onclick="editCategory(${index})">✏️</button>
        <button onclick="deleteCategory(${index})">🗑️</button>
      </div>
    `;

    container.appendChild(div);
  });

  let remaining = totalIncome - totalAllocated;

  let remainingDiv = document.createElement("div");
  remainingDiv.classList.add("category", "remaining");

  if (remaining < 0) {
    remainingDiv.classList.add("negative");
  }

  remainingDiv.innerHTML = `
    Remaining: $${remaining.toFixed(2)}
  `;

  container.appendChild(remainingDiv);
}

/* PAYDAY */
function updatePayday() {
  let today = new Date();
  let nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  let diff = nextMonth - today;
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

  let totalIncome = getTotalIncome();
  document.getElementById("income").innerText = totalIncome.toFixed(2);
}

/* START APP */
init();