const API_BASE = "http://localhost:5000";
const STATUSES = ["Todo", "In Progress", "Done"];
const PAGE_SIZE = 10;

let isRegisterMode = false;
let currentFilter = "All";
let allTasks = [];
let currentPage = 1;
let currentView = "table";
let sortableInstances = [];

// --- Icon helpers ---
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
  btn.onclick = () => editTask(task);
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

// --- Toast helper ---
let toastTimeout;
function showToast(message, type = "error") {
  const toast = document.getElementById("toastBar");
  toast.textContent = message;
  toast.className = `show ${type}`;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.className = "";
  }, 3000);
}

// --- Auth state helpers ---
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

// --- Auth actions ---
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

// --- Task actions ---
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

async function fetchTasks(search = "") {
  const url = search
    ? `${API_BASE}/tasks?search=${encodeURIComponent(search)}`
    : `${API_BASE}/tasks`;
  try {
    const res = await authFetch(url);
    if (!res.ok) throw new Error("Failed to load tasks");
    allTasks = await res.json();
    currentPage = 1;
    renderStats(allTasks);
    renderTasks(applyFilter(allTasks));
  } catch (err) {
    if (err.message !== "Session expired") {
      showToast("Could not load tasks. Please try again.");
    }
  }
}

function applyFilter(tasks) {
  if (currentFilter === "All") return tasks;
  return tasks.filter((t) => t.status === currentFilter);
}

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

function renderTasks(tasks) {
  const list = document.getElementById("taskList");
  list.innerHTML = "";

  const totalPages = Math.max(1, Math.ceil(tasks.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageTasks = tasks.slice(start, start + PAGE_SIZE);

  pageTasks.forEach((task) => {
    const tr = document.createElement("tr");

    const nameTd = document.createElement("td");
    nameTd.textContent = task.name;
    nameTd.setAttribute("data-label", "Task");

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
    tr.appendChild(dueTd);
    tr.appendChild(statusTd);
    tr.appendChild(actionsTd);

    list.appendChild(tr);
  });

  renderPagination(tasks.length, totalPages);

  if (currentView === "board") {
    renderBoard(tasks);
  }
}

function renderPagination(totalItems, totalPages) {
  const bar = document.getElementById("paginationBar");
  bar.innerHTML = "";

  if (totalItems <= PAGE_SIZE) return;

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "Previous";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => {
    currentPage--;
    renderTasks(applyFilter(allTasks));
  };

  const pageLabel = document.createElement("span");
  pageLabel.textContent = `Page ${currentPage} of ${totalPages}`;

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => {
    currentPage++;
    renderTasks(applyFilter(allTasks));
  };

  bar.appendChild(prevBtn);
  bar.appendChild(pageLabel);
  bar.appendChild(nextBtn);
}

// --- Kanban board view ---
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
    card.dataset.taskId = task.id;

    const nameEl = document.createElement("div");
    nameEl.className = "card-name";
    nameEl.textContent = task.name;

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
    renderTasks(applyFilter(allTasks));
  } else {
    tableEl.style.display = "none";
    boardEl.style.display = "flex";
    paginationEl.style.display = "none";
    document.getElementById("tableViewBtn").classList.remove("active");
    document.getElementById("boardViewBtn").classList.add("active");
    renderBoard(applyFilter(allTasks));
  }
}

// --- Edit / Update / Delete / Add ---
function editTask(task) {
  const newName = prompt("Edit task name:", task.name);
  if (newName === null || newName.trim() === "") return;

  const newDueDate = prompt(
    "Edit due date (YYYY-MM-DD, leave blank for none):",
    task.due_date || "",
  );
  if (newDueDate === null) return;

  updateTask(task.id, newName.trim(), newDueDate.trim());
}

async function updateTask(id, name, due_date) {
  try {
    const res = await authFetch(`${API_BASE}/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, due_date }),
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

async function addTask() {
  const input = document.getElementById("taskInput");
  const dueDateInput = document.getElementById("dueDateInput");
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
      body: JSON.stringify({ name, due_date: dueDateInput.value || null }),
    });
    if (!res.ok) throw new Error();

    input.value = "";
    dueDateInput.value = "";
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

// --- Event listeners ---
document.getElementById("addTaskBtn").addEventListener("click", addTask);
document.getElementById("searchInput").addEventListener("input", (e) => {
  fetchTasks(e.target.value);
});
document
  .getElementById("authSubmitBtn")
  .addEventListener("click", handleAuthSubmit);
document.getElementById("logoutBtn").addEventListener("click", logout);
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
    if (currentView === "board") {
      renderBoard(applyFilter(allTasks));
    } else {
      renderTasks(applyFilter(allTasks));
    }
  });
});

document
  .getElementById("tableViewBtn")
  .addEventListener("click", () => switchView("table"));
document
  .getElementById("boardViewBtn")
  .addEventListener("click", () => switchView("board"));

// --- Init ---
if (getToken()) {
  showApp();
} else {
  showAuth();
}
