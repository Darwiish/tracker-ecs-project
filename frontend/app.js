// ===============================
// Config
// ===============================

const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "/api";
const STATUSES = ["Todo", "In Progress", "Done"];
const PAGE_SIZE = 10;
const PRIORITY_WEIGHT = { High: 3, Medium: 2, Low: 1 };

// ===============================
// Global State
// ===============================

let isRegisterMode = false;
let currentFilter = "All";
let allTasks = [];
let currentPage = 1;
let currentView = "table";
let sortableInstances = [];
let toastTimeout;
let currentSortColumn = null;
let currentSortDirection = "asc";
let editingTaskId = null;

// ===============================
// Icons (pen / bin / restore)
// ===============================

const PEN_ICON_SVG = `
<svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const BIN_ICON_SVG = `
<svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 6h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>`;

const RESTORE_ICON_SVG = `
<svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 11a9 9 0 1 1 2.6 6.3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M3 5v6h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

function createEditButton(task) {
  const btn = document.createElement("button");
  btn.className = "icon-btn edit-icon-btn";
  btn.innerHTML = PEN_ICON_SVG;
  btn.title = "Edit task";
  btn.setAttribute("aria-label", "Edit task");
  btn.onclick = () => openEditModal(task);
  return btn;
}

function createDeleteButton(id, name) {
  const btn = document.createElement("button");
  btn.className = "icon-btn delete-icon-btn";
  btn.innerHTML = BIN_ICON_SVG;
  btn.title = "Delete task";
  btn.setAttribute("aria-label", "Delete task");
  btn.onclick = () => deleteTask(id, name);
  return btn;
}

function createRestoreButton(id) {
  const btn = document.createElement("button");
  btn.className = "icon-btn restore-icon-btn";
  btn.innerHTML = RESTORE_ICON_SVG;
  btn.title = "Restore to In Progress";
  btn.setAttribute("aria-label", "Restore to In Progress");
  btn.onclick = () => updateStatus(id, "In Progress");
  return btn;
}

// ===============================
// Badge / Tag Helpers
// ===============================

function createPriorityBadge(priority) {
  const span = document.createElement("span");
  const level = (priority || "Medium").toLowerCase();
  span.className = `badge badge-${level}`;
  span.textContent = priority || "Medium";
  return span;
}

function getCategoryTagClass(category) {
  const clean = (category || "general").toLowerCase().replace(/[^a-z0-9]/g, "");
  return `tag tag-${clean}`;
}

function createCategoryTag(category) {
  const span = document.createElement("span");
  span.className = getCategoryTagClass(category);
  span.textContent = category || "General";
  return span;
}

// ===============================
// Due Date Helpers (overdue / due soon)
// ===============================

function getDueDateClass(task) {
  if (!task.due_date || task.status === "Done") return "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.due_date + "T00:00:00");

  const diffMs = due - today;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return "overdue";
  if (diffDays <= 2) return "due-soon";
  return "";
}

// ===============================
// Toast
// ===============================

function showToast(message, type = "error") {
  const toast = document.getElementById("toastBar");
  toast.textContent = message;
  toast.className = `show ${type}`;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.className = "";
  }, 3000);
}

// ===============================
// Dark Mode
// ===============================

function initDarkMode() {
  const enabled = localStorage.getItem("darkMode") === "true";
  document.body.classList.toggle("dark-mode", enabled);
  updateDarkModeButton();
}

function toggleDarkMode() {
  const enabled = document.body.classList.toggle("dark-mode");
  localStorage.setItem("darkMode", enabled ? "true" : "false");
  updateDarkModeButton();
}

function updateDarkModeButton() {
  const btn = document.getElementById("darkModeToggle");
  if (!btn) return;
  btn.textContent = document.body.classList.contains("dark-mode")
    ? "☀️ Light Mode"
    : "🌙 Dark Mode";
}

// ===============================
// Auth State Helpers
// ===============================

function getToken() {
  return localStorage.getItem("token");
}

function getEmail() {
  return localStorage.getItem("email");
}

function setSession(token, email) {
  localStorage.setItem("token", token);
  localStorage.setItem("email", email);
}

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("email");
}

function showApp() {
  document.querySelector(".container").classList.remove("auth-mode");
  document.getElementById("authSection").style.display = "none";
  document.getElementById("appSection").style.display = "block";
  document.getElementById("userEmailDisplay").textContent = getEmail();
  fetchTasks();
}

function showAuth() {
  document.querySelector(".container").classList.add("auth-mode");
  document.getElementById("authSection").style.display = "block";
  document.getElementById("appSection").style.display = "none";
}

// ===============================
// Login / Register
// ===============================

async function handleAuthSubmit() {
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;
  const errorEl = document.getElementById("authError");
  const submitBtn = document.getElementById("authSubmitBtn");
  errorEl.textContent = "";

  if (!email || !password) {
    errorEl.textContent = "Email and password are required";
    return;
  }

  const endpoint = isRegisterMode ? "/auth/register" : "/auth/login";
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Please wait...";

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.message || "Something went wrong";
      return;
    }

    if (isRegisterMode) {
      isRegisterMode = false;
      updateAuthUI();
      errorEl.style.color = "#166534";
      errorEl.textContent = "Registered! Please log in.";
    } else {
      setSession(data.token, email);
      showApp();
    }
  } catch (err) {
    console.error(err);
    errorEl.textContent = "Could not reach server";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

function updateAuthUI() {
  document.getElementById("authTitle").textContent = isRegisterMode
    ? "Register"
    : "Login";
  document.getElementById("authSubmitBtn").textContent = isRegisterMode
    ? "Register"
    : "Login";
  document.getElementById("authToggleText").textContent = isRegisterMode
    ? "Already have an account?"
    : "Don't have an account?";
  document.getElementById("authToggleLink").textContent = isRegisterMode
    ? "Login"
    : "Register";
  document.getElementById("authError").style.color = "#b91c1c";
  document.getElementById("authError").textContent = "";
}

function logout() {
  clearSession();
  showAuth();
}

// ===============================
// Authenticated Fetch Wrapper
// ===============================

async function authFetch(url, options = {}) {
  const token = getToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401 || res.status === 403) {
    logout();
    throw new Error("Session expired");
  }

  return res;
}

// ===============================
// Load Tasks
// ===============================

async function fetchTasks(search = "") {
  const url = search
    ? `${API_BASE}/tasks?search=${encodeURIComponent(search)}`
    : `${API_BASE}/tasks`;
  try {
    const res = await authFetch(url);
    if (!res.ok) throw new Error("Failed to load tasks");
    allTasks = await res.json();
    currentPage = 1;
    render();
  } catch (err) {
    if (err.message !== "Session expired") {
      showToast("Could not load tasks. Please try again.");
    }
  }
}

// ===============================
// Filtering / Sorting
// ===============================

function applyFilter(tasks) {
  if (currentFilter === "All") return tasks;
  return tasks.filter((t) => t.status === currentFilter);
}

function sortTasks(tasks) {
  if (!currentSortColumn) return tasks;

  return [...tasks].sort((a, b) => {
    let A = a[currentSortColumn] ?? "";
    let B = b[currentSortColumn] ?? "";

    if (currentSortColumn === "priority") {
      A = PRIORITY_WEIGHT[A] || 0;
      B = PRIORITY_WEIGHT[B] || 0;
    } else if (typeof A === "string") {
      A = A.toLowerCase();
      B = B.toLowerCase();
    }

    if (A < B) return currentSortDirection === "asc" ? -1 : 1;
    if (A > B) return currentSortDirection === "asc" ? 1 : -1;
    return 0;
  });
}

function getVisibleTasks() {
  return sortTasks(applyFilter(allTasks));
}

// ===============================
// Render Orchestration
// ===============================

function render() {
  renderStats(allTasks);
  renderProgressBar(allTasks);

  const visible = getVisibleTasks();
  if (currentView === "board") {
    renderBoard(visible);
  } else {
    renderTasks(visible);
  }
}

// ===============================
// Stats
// ===============================

function renderStats(tasks) {
  const total = tasks.length;
  const todo = tasks.filter((t) => t.status === "Todo").length;
  const inProgress = tasks.filter((t) => t.status === "In Progress").length;
  const done = tasks.filter((t) => t.status === "Done").length;

  document.getElementById("statsBar").innerHTML = `
        <span>Total: ${total}</span>
        <span>Todo: ${todo}</span>
        <span>In Progress: ${inProgress}</span>
        <span>Done: ${done}</span>
    `;
}

// ===============================
// Progress Bar
// ===============================

function renderProgressBar(tasks) {
  const bar = document.getElementById("progressBar");
  if (!bar) return;

  if (tasks.length === 0) {
    bar.style.width = "0%";
    return;
  }

  const done = tasks.filter((t) => t.status === "Done").length;
  const percent = Math.round((done / tasks.length) * 100);
  bar.style.width = `${percent}%`;
}

// ===============================
// Table View
// ===============================

function renderTasks(tasks) {
  const list = document.getElementById("taskList");
  list.innerHTML = "";

  const totalPages = Math.max(1, Math.ceil(tasks.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageTasks = tasks.slice(start, start + PAGE_SIZE);

  pageTasks.forEach((task) => {
    const tr = document.createElement("tr");
    const dueClass = getDueDateClass(task);
    if (dueClass) tr.classList.add(dueClass);

    const nameTd = document.createElement("td");
    nameTd.textContent = task.name;
    nameTd.setAttribute("data-label", "Task");

    const categoryTd = document.createElement("td");
    categoryTd.setAttribute("data-label", "Category");
    categoryTd.appendChild(createCategoryTag(task.category));

    const priorityTd = document.createElement("td");
    priorityTd.setAttribute("data-label", "Priority");
    priorityTd.appendChild(createPriorityBadge(task.priority));

    const dueTd = document.createElement("td");
    dueTd.textContent = task.due_date || "—";
    dueTd.setAttribute("data-label", "Due Date");

    const statusTd = document.createElement("td");
    statusTd.setAttribute("data-label", "Status");
    const statusSelect = document.createElement("select");
    STATUSES.forEach((s) => {
      const option = document.createElement("option");
      option.value = s;
      option.textContent = s;
      if (s === task.status) option.selected = true;
      statusSelect.appendChild(option);
    });
    statusSelect.onchange = () => updateStatus(task.id, statusSelect.value);
    statusTd.appendChild(statusSelect);

    const actionsTd = document.createElement("td");
    actionsTd.setAttribute("data-label", "Actions");

    if (task.status === "Done") {
      actionsTd.appendChild(createRestoreButton(task.id));
    }

    actionsTd.appendChild(createEditButton(task));
    actionsTd.appendChild(createDeleteButton(task.id, task.name));

    tr.appendChild(nameTd);
    tr.appendChild(categoryTd);
    tr.appendChild(priorityTd);
    tr.appendChild(dueTd);
    tr.appendChild(statusTd);
    tr.appendChild(actionsTd);

    list.appendChild(tr);
  });

  renderPagination(tasks.length, totalPages);
  updateSortIcons();
}

// ===============================
// Sortable Column Headers
// ===============================

function updateSortIcons() {
  document.querySelectorAll("th.sortable").forEach((th) => {
    const icon = th.querySelector(".sort-icon");
    if (!icon) return;
    if (th.dataset.sort === currentSortColumn) {
      icon.textContent = currentSortDirection === "asc" ? "↑" : "↓";
    } else {
      icon.textContent = "↕";
    }
  });
}

function initSortableHeaders() {
  document.querySelectorAll("th.sortable").forEach((header) => {
    header.addEventListener("click", () => {
      const column = header.dataset.sort;
      if (currentSortColumn === column) {
        currentSortDirection = currentSortDirection === "asc" ? "desc" : "asc";
      } else {
        currentSortColumn = column;
        currentSortDirection = "asc";
      }
      render();
    });
  });
}

// ===============================
// Pagination
// ===============================

function renderPagination(totalItems, totalPages) {
  const bar = document.getElementById("paginationBar");
  bar.innerHTML = "";

  if (totalItems <= PAGE_SIZE) return;

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "Previous";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => {
    currentPage--;
    renderTasks(getVisibleTasks());
  };

  const pageLabel = document.createElement("span");
  pageLabel.textContent = `Page ${currentPage} of ${totalPages}`;

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => {
    currentPage++;
    renderTasks(getVisibleTasks());
  };

  bar.appendChild(prevBtn);
  bar.appendChild(pageLabel);
  bar.appendChild(nextBtn);
}

// ===============================
// Kanban Board View
// ===============================

function renderBoard(tasks) {
  const columns = {
    Todo: document.getElementById("cardsTodo"),
    "In Progress": document.getElementById("cardsInProgress"),
    Done: document.getElementById("cardsDone"),
  };

  Object.values(columns).forEach((col) => (col.innerHTML = ""));

  const counts = { Todo: 0, "In Progress": 0, Done: 0 };

  tasks.forEach((task) => {
    counts[task.status]++;

    const card = document.createElement("div");
    card.className = "task-card";
    const dueClass = getDueDateClass(task);
    if (dueClass) card.classList.add(dueClass);
    card.dataset.taskId = task.id;

    const nameEl = document.createElement("div");
    nameEl.className = "card-name";
    nameEl.textContent = task.name;

    const tagsEl = document.createElement("div");
    tagsEl.className = "card-tags";
    tagsEl.appendChild(createCategoryTag(task.category));
    tagsEl.appendChild(createPriorityBadge(task.priority));

    const dueEl = document.createElement("div");
    dueEl.className = "card-due";
    dueEl.textContent = task.due_date ? `Due: ${task.due_date}` : "No due date";

    const actionsEl = document.createElement("div");
    actionsEl.className = "card-actions";
    if (task.status === "Done") {
      actionsEl.appendChild(createRestoreButton(task.id));
    }
    actionsEl.appendChild(createEditButton(task));
    actionsEl.appendChild(createDeleteButton(task.id, task.name));

    card.appendChild(nameEl);
    card.appendChild(tagsEl);
    card.appendChild(dueEl);
    card.appendChild(actionsEl);

    columns[task.status].appendChild(card);
  });

  document.getElementById("countTodo").textContent = counts["Todo"];
  document.getElementById("countInProgress").textContent =
    counts["In Progress"];
  document.getElementById("countDone").textContent = counts["Done"];

  setupDragAndDrop();
}

// ===============================
// Drag And Drop (SortableJS)
// ===============================

function setupDragAndDrop() {
  sortableInstances.forEach((s) => s.destroy());
  sortableInstances = [];

  document.querySelectorAll(".column-cards").forEach((columnEl) => {
    const sortable = Sortable.create(columnEl, {
      group: "tasks",
      animation: 150,
      forceFallback: true,
      fallbackTolerance: 3,
      onAdd: (evt) => {
        const taskId = evt.item.dataset.taskId;
        const newStatus = evt.to.closest(".board-column").dataset.status;
        updateStatus(taskId, newStatus);
      },
    });
    sortableInstances.push(sortable);
  });
}

// ===============================
// View Switching (Table / Board)
// ===============================

function switchView(view) {
  currentView = view;
  const tableEl = document.getElementById("taskTable");
  const boardEl = document.getElementById("boardView");
  const paginationEl = document.getElementById("paginationBar");

  if (view === "table") {
    tableEl.style.display = "table";
    boardEl.style.display = "none";
    paginationEl.style.display = "flex";
    document.getElementById("tableViewBtn").classList.add("active");
    document.getElementById("boardViewBtn").classList.remove("active");
  } else {
    tableEl.style.display = "none";
    boardEl.style.display = "flex";
    paginationEl.style.display = "none";
    document.getElementById("tableViewBtn").classList.remove("active");
    document.getElementById("boardViewBtn").classList.add("active");
  }

  render();
}

// ===============================
// Edit Modal
// ===============================

function openEditModal(task) {
  editingTaskId = task.id;
  document.getElementById("editTaskId").value = task.id;
  document.getElementById("editTaskName").value = task.name;
  document.getElementById("editDueDate").value = task.due_date || "";
  document.getElementById("editPriority").value = task.priority || "Medium";
  document.getElementById("editCategory").value = task.category || "General";
  document.getElementById("editDescription").value = task.description || "";
  document.getElementById("editModal").classList.add("show");
}

function closeEditModal() {
  document.getElementById("editModal").classList.remove("show");
  editingTaskId = null;
}

async function handleEditFormSubmit(e) {
  e.preventDefault();

  const name = document.getElementById("editTaskName").value.trim();
  const due_date = document.getElementById("editDueDate").value || null;
  const priority = document.getElementById("editPriority").value;
  const category = document.getElementById("editCategory").value;
  const description = document.getElementById("editDescription").value.trim();

  if (!name) return;

  await updateTask(
    editingTaskId,
    name,
    due_date,
    priority,
    category,
    description,
  );
  closeEditModal();
}

// ===============================
// Update Task
// ===============================

async function updateTask(id, name, due_date, priority, category, description) {
  try {
    const res = await authFetch(`${API_BASE}/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, due_date, priority, category, description }),
    });
    if (!res.ok) throw new Error();
    showToast("Task updated", "success");
    fetchTasks(document.getElementById("searchInput").value);
  } catch (err) {
    if (err.message !== "Session expired") {
      showToast("Failed to update task. Please try again.");
    }
  }
}

// ===============================
// Update Status
// ===============================

async function updateStatus(id, status) {
  try {
    const res = await authFetch(`${API_BASE}/tasks/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error();
    fetchTasks(document.getElementById("searchInput").value);
  } catch (err) {
    if (err.message !== "Session expired") {
      showToast("Failed to update status. Please try again.");
    }
  }
}

// ===============================
// Delete Task
// ===============================

async function deleteTask(id, name) {
  const confirmed = confirm(`Delete "${name}"? This cannot be undone.`);
  if (!confirmed) return;

  try {
    const res = await authFetch(`${API_BASE}/tasks/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error();
    showToast("Task deleted", "success");
    fetchTasks(document.getElementById("searchInput").value);
  } catch (err) {
    if (err.message !== "Session expired") {
      showToast("Failed to delete task. Please try again.");
    }
  }
}

// ===============================
// Add Task
// ===============================

async function addTask() {
  const input = document.getElementById("taskInput");
  const dueDateInput = document.getElementById("dueDateInput");
  const priorityInput = document.getElementById("priorityInput");
  const categoryInput = document.getElementById("categoryInput");
  const addBtn = document.getElementById("addTaskBtn");
  const name = input.value.trim();
  if (!name) return;

  const originalText = addBtn.textContent;
  addBtn.disabled = true;
  addBtn.textContent = "Adding...";

  try {
    const res = await authFetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        due_date: dueDateInput.value || null,
        priority: priorityInput ? priorityInput.value : "Medium",
        category: categoryInput ? categoryInput.value : "General",
      }),
    });
    if (!res.ok) throw new Error();

    input.value = "";
    dueDateInput.value = "";
    if (priorityInput) priorityInput.value = "Medium";
    if (categoryInput) categoryInput.value = "General";
    showToast("Task added", "success");
    fetchTasks(document.getElementById("searchInput").value);
  } catch (err) {
    if (err.message !== "Session expired") {
      showToast("Failed to add task. Please try again.");
    }
  } finally {
    addBtn.disabled = false;
    addBtn.textContent = originalText;
  }
}

// ===============================
// Event Listeners
// ===============================

document.getElementById("addTaskBtn").addEventListener("click", addTask);
document.getElementById("searchInput").addEventListener("input", (e) => {
  fetchTasks(e.target.value);
});
document
  .getElementById("authSubmitBtn")
  .addEventListener("click", handleAuthSubmit);
document.getElementById("logoutBtn").addEventListener("click", logout);
document
  .getElementById("darkModeToggle")
  .addEventListener("click", toggleDarkMode);
document.getElementById("authToggleLink").addEventListener("click", (e) => {
  e.preventDefault();
  isRegisterMode = !isRegisterMode;
  updateAuthUI();
});

document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter;
    currentPage = 1;
    document
      .querySelectorAll(".filter-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    render();
  });
});

document
  .getElementById("tableViewBtn")
  .addEventListener("click", () => switchView("table"));
document
  .getElementById("boardViewBtn")
  .addEventListener("click", () => switchView("board"));

document
  .getElementById("editTaskForm")
  .addEventListener("submit", handleEditFormSubmit);
document
  .getElementById("closeModalBtn")
  .addEventListener("click", closeEditModal);
document.getElementById("editModal").addEventListener("click", (e) => {
  if (e.target.id === "editModal") closeEditModal();
});

initSortableHeaders();

// ===============================
// Start Application
// ===============================

initDarkMode();

if (getToken()) {
  showApp();
} else {
  showAuth();
}
