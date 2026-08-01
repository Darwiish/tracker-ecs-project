// --- Global State ---
let tasks = [];
let currentFilter = "All";
let currentView = "table"; // "table" or "board"
let currentSortColumn = null;
let currentSortDirection = "asc";
let isRegisterMode = false;
let sortableInstances = [];

const API_BASE = "/tasks"; // Backend API endpoint base

// --- DOM Elements ---
const authSection = document.getElementById("authSection");
const appSection = document.getElementById("appSection");
const authTitle = document.getElementById("authTitle");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const authToggleText = document.getElementById("authToggleText");
const authToggleLink = document.getElementById("authToggleLink");
const authError = document.getElementById("authError");
const userEmailDisplay = document.getElementById("userEmailDisplay");
const logoutBtn = document.getElementById("logoutBtn");

const darkModeToggle = document.getElementById("darkModeToggle");
const toastBar = document.getElementById("toastBar");
const progressBar = document.getElementById("progressBar");
const statsBar = document.getElementById("statsBar");

const filterBtns = document.querySelectorAll(".filter-btn");
const tableViewBtn = document.getElementById("tableViewBtn");
const boardViewBtn = document.getElementById("boardViewBtn");
const taskTable = document.getElementById("taskTable");
const boardView = document.getElementById("boardView");

const addTaskBtn = document.getElementById("addTaskBtn");
const searchInput = document.getElementById("searchInput");
const taskList = document.getElementById("taskList");

// Modal Elements
const editModal = document.getElementById("editModal");
const editTaskForm = document.getElementById("editTaskForm");
const editTaskId = document.getElementById("editTaskId");
const editTaskName = document.getElementById("editTaskName");
const editDueDate = document.getElementById("editDueDate");
const editPriority = document.getElementById("editPriority");
const editCategory = document.getElementById("editCategory");
const closeModalBtn = document.getElementById("closeModalBtn");

// --- Toast Notification Helper ---
function showToast(message, type = "success") {
  if (!toastBar) return;
  toastBar.textContent = message;
  toastBar.className = `show ${type}`;
  setTimeout(() => {
    toastBar.className = "";
  }, 3000);
}

// --- Auth Toggle (Login / Register) ---
if (authToggleLink) {
  authToggleLink.addEventListener("click", (e) => {
    e.preventDefault();
    isRegisterMode = !isRegisterMode;
    if (authError) authError.textContent = "";

    if (isRegisterMode) {
      if (authTitle) authTitle.textContent = "Register";
      if (authSubmitBtn) authSubmitBtn.textContent = "Register Account";
      if (authToggleText)
        authToggleText.textContent = "Already have an account?";
      authToggleLink.textContent = "Login";
    } else {
      if (authTitle) authTitle.textContent = "Login";
      if (authSubmitBtn) authSubmitBtn.textContent = "Login";
      if (authToggleText) authToggleText.textContent = "Don't have an account?";
      authToggleLink.textContent = "Register";
    }
  });
}

// --- Authentication Handler ---
if (authSubmitBtn) {
  authSubmitBtn.addEventListener("click", async () => {
    const email = authEmail ? authEmail.value.trim() : "";
    const password = authPassword ? authPassword.value.trim() : "";

    if (!email || !password) {
      if (authError)
        authError.textContent = "Please provide both email and password.";
      return;
    }

    if (authError) authError.textContent = "";
    const endpoint = isRegisterMode ? "/api/register" : "/api/login";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (authError)
          authError.textContent = data.message || "Authentication failed.";
        return;
      }

      if (data.token) localStorage.setItem("token", data.token);
      localStorage.setItem("userEmail", email);

      showToast(
        isRegisterMode ? "Account registered successfully!" : "Logged in!",
      );
      checkAuth();
    } catch (err) {
      // Local fallback mode when API is unavailable
      console.warn("Backend API offline. Authenticating locally.");
      localStorage.setItem("token", "demo-token");
      localStorage.setItem("userEmail", email);
      checkAuth();
    }
  });
}

// --- Check Session Status ---
function checkAuth() {
  const token = localStorage.getItem("token");
  const userEmail = localStorage.getItem("userEmail");

  if (token && userEmail) {
    if (authSection) authSection.style.display = "none";
    if (appSection) appSection.style.display = "block";
    if (userEmailDisplay) userEmailDisplay.textContent = userEmail;
    document.querySelector(".container")?.classList.remove("auth-mode");
    fetchTasks();
  } else {
    if (authSection) authSection.style.display = "block";
    if (appSection) appSection.style.display = "none";
    document.querySelector(".container")?.classList.add("auth-mode");
  }
}

// --- Logout ---
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    tasks = [];
    checkAuth();
    showToast("Logged out successfully");
  });
}

// --- Dark Mode ---
if (darkModeToggle) {
  darkModeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    darkModeToggle.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
  });
}

// --- Task Data Operations ---
async function fetchTasks() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(API_BASE, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      tasks = await res.json();
    } else {
      tasks = JSON.parse(localStorage.getItem("local_tasks") || "[]");
    }
  } catch (err) {
    tasks = JSON.parse(localStorage.getItem("local_tasks") || "[]");
  }
  render();
}

async function saveTask(taskData) {
  taskData.id = taskData.id || Date.now();
  taskData.status = taskData.status || "Todo";

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(taskData),
    });
    if (res.ok) {
      const savedTask = await res.json();
      tasks.push(savedTask);
    } else {
      tasks.push(taskData);
    }
  } catch (err) {
    tasks.push(taskData);
  }

  localStorage.setItem("local_tasks", JSON.stringify(tasks));
  render();
}

async function updateTaskStatus(id, newStatus) {
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.status = newStatus;
    localStorage.setItem("local_tasks", JSON.stringify(tasks));
    render();
  }
}

async function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  localStorage.setItem("local_tasks", JSON.stringify(tasks));
  render();
  showToast("Task deleted", "error");
}

// --- Add Task Handler (Fixes input detection & Docker tag) ---
if (addTaskBtn) {
  addTaskBtn.addEventListener("click", (e) => {
    e.preventDefault();

    // Fetch elements directly on click to get exact current value
    const taskInput = document.getElementById("taskInput");
    const dueDateInput = document.getElementById("dueDateInput");
    const priorityInput = document.getElementById("priorityInput");
    const categoryInput = document.getElementById("categoryInput");

    const name = taskInput ? taskInput.value.trim() : "";

    if (!name) {
      showToast("Task name is required", "error");
      return;
    }

    const newTask = {
      id: Date.now(),
      name: name,
      due_date: dueDateInput ? dueDateInput.value || null : null,
      priority: priorityInput ? priorityInput.value : "Medium",
      category: categoryInput ? categoryInput.value : "General",
      status: "Todo",
    };

    saveTask(newTask);

    // Reset Form inputs
    if (taskInput) taskInput.value = "";
    if (dueDateInput) dueDateInput.value = "";

    showToast("Task added successfully!");
  });
}

// --- UI Renderers ---
function render() {
  let filtered = filterTasks();
  filtered = sortTasks(filtered);

  renderStats(tasks);
  renderProgressBar(tasks);

  if (currentView === "table") {
    renderTable(filtered);
  } else {
    renderBoardView(filtered);
  }
}

function filterTasks() {
  const query = searchInput ? searchInput.value.toLowerCase() : "";
  return tasks.filter((task) => {
    const matchesFilter =
      currentFilter === "All" || task.status === currentFilter;
    const matchesSearch =
      (task.name && task.name.toLowerCase().includes(query)) ||
      (task.category && task.category.toLowerCase().includes(query));
    return matchesFilter && matchesSearch;
  });
}

function renderProgressBar(taskListData) {
  if (!progressBar) return;
  if (!taskListData.length) {
    progressBar.style.width = "0%";
    return;
  }
  const done = taskListData.filter((t) => t.status === "Done").length;
  const percent = Math.round((done / taskListData.length) * 100);
  progressBar.style.width = `${percent}%`;
}

function renderStats(taskListData) {
  if (!statsBar) return;
  const total = taskListData.length;
  const todo = taskListData.filter((t) => t.status === "Todo").length;
  const inProgress = taskListData.filter(
    (t) => t.status === "In Progress",
  ).length;
  const done = taskListData.filter((t) => t.status === "Done").length;

  statsBar.innerHTML = `
    <span>Total: ${total}</span>
    <span>Todo: ${todo}</span>
    <span>In Progress: ${inProgress}</span>
    <span>Done: ${done}</span>
  `;
}

function getDueDateStatusClass(dueDateStr, status) {
  if (!dueDateStr || status === "Done") return "";
  const now = new Date();
  const due = new Date(dueDateStr);
  const diffHours = (due - now) / (1000 * 60 * 60);

  if (diffHours < 0) return "overdue";
  if (diffHours <= 48) return "due-soon";
  return "";
}

// --- Table View Render ---
function renderTable(taskListData) {
  if (!taskList) return;
  taskList.innerHTML = "";

  taskListData.forEach((task) => {
    const tr = document.createElement("tr");
    const warningClass = getDueDateStatusClass(task.due_date, task.status);
    if (warningClass) tr.classList.add(warningClass);

    tr.innerHTML = `
      <td><strong>${task.name}</strong></td>
      <td><span class="tag">${task.category}</span></td>
      <td><span class="badge badge-${(task.priority || "low").toLowerCase()}">${task.priority}</span></td>
      <td>${task.due_date || "—"}</td>
      <td>
        <select onchange="updateTaskStatus(${task.id}, this.value)">
          <option value="Todo" ${task.status === "Todo" ? "selected" : ""}>Todo</option>
          <option value="In Progress" ${task.status === "In Progress" ? "selected" : ""}>In Progress</option>
          <option value="Done" ${task.status === "Done" ? "selected" : ""}>Done</option>
        </select>
      </td>
      <td>
        <button class="icon-btn edit-icon-btn" onclick="openEditModal(${task.id})">✏️</button>
        <button class="icon-btn delete-icon-btn" onclick="deleteTask(${task.id})">🗑️</button>
      </td>
    `;
    taskList.appendChild(tr);
  });
}

// --- Kanban View Render ---
function renderBoardView(taskListData) {
  const cardsTodo = document.getElementById("cardsTodo");
  const cardsInProgress = document.getElementById("cardsInProgress");
  const cardsDone = document.getElementById("cardsDone");

  if (!cardsTodo || !cardsInProgress || !cardsDone) return;

  cardsTodo.innerHTML = "";
  cardsInProgress.innerHTML = "";
  cardsDone.innerHTML = "";

  const counts = { Todo: 0, "In Progress": 0, Done: 0 };

  taskListData.forEach((task) => {
    counts[task.status] = (counts[task.status] || 0) + 1;

    const card = document.createElement("div");
    card.className = `task-card ${getDueDateStatusClass(task.due_date, task.status)}`;
    card.setAttribute("data-id", task.id);

    card.innerHTML = `
      <div class="card-name">${task.name}</div>
      <div class="card-due">📅 ${task.due_date || "No due date"}</div>
      <div style="margin-bottom: 8px;">
        <span class="tag">${task.category}</span>
        <span class="badge badge-${(task.priority || "low").toLowerCase()}">${task.priority}</span>
      </div>
      <div class="card-actions">
        <button class="icon-btn edit-icon-btn" onclick="openEditModal(${task.id})">✏️ Edit</button>
        <button class="icon-btn delete-icon-btn" onclick="deleteTask(${task.id})">🗑️</button>
      </div>
    `;

    if (task.status === "Todo") cardsTodo.appendChild(card);
    else if (task.status === "In Progress") cardsInProgress.appendChild(card);
    else if (task.status === "Done") cardsDone.appendChild(card);
  });

  const cTodo = document.getElementById("countTodo");
  const cProg = document.getElementById("countInProgress");
  const cDone = document.getElementById("countDone");

  if (cTodo) cTodo.textContent = counts["Todo"];
  if (cProg) cProg.textContent = counts["In Progress"];
  if (cDone) cDone.textContent = counts["Done"];

  initDragAndDrop();
}

function initDragAndDrop() {
  sortableInstances.forEach((inst) => inst.destroy());
  sortableInstances = [];

  const columns = ["cardsTodo", "cardsInProgress", "cardsDone"];
  columns.forEach((colId) => {
    const el = document.getElementById(colId);
    if (!el || typeof Sortable === "undefined") return;

    const sortable = new Sortable(el, {
      group: "kanban",
      animation: 150,
      onEnd: function (evt) {
        const taskId = Number(evt.item.getAttribute("data-id"));
        const targetColumn = evt.to.parentElement.getAttribute("data-status");
        if (taskId && targetColumn) {
          updateTaskStatus(taskId, targetColumn);
        }
      },
    });
    sortableInstances.push(sortable);
  });
}

// --- Table Header Sorting ---
document.querySelectorAll("th.sortable").forEach((header) => {
  header.addEventListener("click", () => {
    const column = header.getAttribute("data-sort");
    if (currentSortColumn === column) {
      currentSortDirection = currentSortDirection === "asc" ? "desc" : "asc";
    } else {
      currentSortColumn = column;
      currentSortDirection = "asc";
    }
    render();
  });
});

function sortTasks(taskListData) {
  if (!currentSortColumn) return taskListData;

  return [...taskListData].sort((a, b) => {
    let valA = a[currentSortColumn] || "";
    let valB = b[currentSortColumn] || "";

    if (currentSortColumn === "priority") {
      const pMap = { High: 3, Medium: 2, Low: 1 };
      valA = pMap[valA] || 0;
      valB = pMap[valB] || 0;
    }

    if (valA < valB) return currentSortDirection === "asc" ? -1 : 1;
    if (valA > valB) return currentSortDirection === "asc" ? 1 : -1;
    return 0;
  });
}

// --- Views & Filters ---
filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.getAttribute("data-filter");
    render();
  });
});

if (tableViewBtn) {
  tableViewBtn.addEventListener("click", () => {
    currentView = "table";
    tableViewBtn.classList.add("active");
    if (boardViewBtn) boardViewBtn.classList.remove("active");
    if (taskTable) taskTable.style.display = "table";
    if (boardView) boardView.style.display = "none";
    render();
  });
}

if (boardViewBtn) {
  boardViewBtn.addEventListener("click", () => {
    currentView = "board";
    boardViewBtn.classList.add("active");
    if (tableViewBtn) tableViewBtn.classList.remove("active");
    if (taskTable) taskTable.style.display = "none";
    if (boardView) boardView.style.display = "flex";
    render();
  });
}

if (searchInput) searchInput.addEventListener("input", render);

// --- Edit Modal Handlers ---
window.openEditModal = function (id) {
  const task = tasks.find((t) => t.id === id);
  if (!task || !editModal) return;

  editTaskId.value = task.id;
  editTaskName.value = task.name;
  editDueDate.value = task.due_date || "";
  editPriority.value = task.priority;
  editCategory.value = task.category;

  editModal.classList.add("show");
};

if (closeModalBtn) {
  closeModalBtn.addEventListener("click", () => {
    if (editModal) editModal.classList.remove("show");
  });
}

if (editTaskForm) {
  editTaskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = Number(editTaskId.value);
    const task = tasks.find((t) => t.id === id);

    if (task) {
      task.name = editTaskName.value.trim();
      task.due_date = editDueDate.value || null;
      task.priority = editPriority.value;
      task.category = editCategory.value;

      localStorage.setItem("local_tasks", JSON.stringify(tasks));
      if (editModal) editModal.classList.remove("show");
      render();
      showToast("Task updated!");
    }
  });
}

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
});
