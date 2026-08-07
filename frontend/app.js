// ===============================
// Global State
// ===============================

let tasks = [];
let currentFilter = "All";
let currentView = "table";
let currentSortColumn = null;
let currentSortDirection = "asc";
let isRegisterMode = false;
let sortableInstances = [];

const API_BASE = "/api/tasks";

// ===============================
// DOM Elements
// ===============================

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

const toastBar = document.getElementById("toastBar");
const darkModeToggle = document.getElementById("darkModeToggle");

const progressBar = document.getElementById("progressBar");
const statsBar = document.getElementById("statsBar");

const filterBtns = document.querySelectorAll(".filter-btn");

const tableViewBtn = document.getElementById("tableViewBtn");
const boardViewBtn = document.getElementById("boardViewBtn");

const taskTable = document.getElementById("taskTable");
const boardView = document.getElementById("boardView");

const taskList = document.getElementById("taskList");

const addTaskBtn = document.getElementById("addTaskBtn");
const searchInput = document.getElementById("searchInput");

// Modal

const editModal = document.getElementById("editModal");
const editTaskForm = document.getElementById("editTaskForm");

const editTaskId = document.getElementById("editTaskId");
const editTaskName = document.getElementById("editTaskName");
const editDueDate = document.getElementById("editDueDate");
const editPriority = document.getElementById("editPriority");
const editCategory = document.getElementById("editCategory");

const closeModalBtn = document.getElementById("closeModalBtn");

// ===============================
// Toast
// ===============================

function showToast(message, type = "success") {
  if (!toastBar) return;

  toastBar.textContent = message;
  toastBar.className = `show ${type}`;

  setTimeout(() => {
    toastBar.className = "";
  }, 3000);
}

// ===============================
// Category CSS Tags
// ===============================

function getCategoryTagClass(category) {
  const clean = (category || "general").toLowerCase().replace(/[^a-z0-9]/g, "");

  return `tag tag-${clean}`;
}

// ===============================
// Authentication Toggle
// ===============================

authToggleLink?.addEventListener("click", (e) => {
  e.preventDefault();

  isRegisterMode = !isRegisterMode;

  authError.textContent = "";

  if (isRegisterMode) {
    authTitle.textContent = "Register";

    authSubmitBtn.textContent = "Register Account";

    authToggleText.textContent = "Already have an account?";

    authToggleLink.textContent = "Login";
  } else {
    authTitle.textContent = "Login";

    authSubmitBtn.textContent = "Login";

    authToggleText.textContent = "Don't have an account?";

    authToggleLink.textContent = "Register";
  }
});

// ===============================
// Login / Register
// ===============================

authSubmitBtn?.addEventListener("click", async () => {
  const email = authEmail.value.trim();

  const password = authPassword.value.trim();

  if (!email || !password) {
    authError.textContent = "Email and password required";

    return;
  }

  const endpoint = isRegisterMode ? "/api/auth/register" : "/api/auth/login";

  try {
    const res = await fetch(endpoint, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      authError.textContent = data.message || "Authentication failed";

      return;
    }

    if (data.token) {
      localStorage.setItem("token", data.token);

      localStorage.setItem("userEmail", email);
    }

    showToast(isRegisterMode ? "Account created" : "Login successful");

    checkAuth();
  } catch (err) {
    console.error(err);

    showToast("Authentication failed", "error");
  }
});

// ===============================
// Session Check
// ===============================

function checkAuth() {
  const token = localStorage.getItem("token");

  const email = localStorage.getItem("userEmail");

  if (token && email) {
    authSection.style.display = "none";

    appSection.style.display = "block";

    userEmailDisplay.textContent = email;

    fetchTasks();
  } else {
    authSection.style.display = "block";

    appSection.style.display = "none";
  }
}

// ===============================
// Logout
// ===============================

logoutBtn?.addEventListener("click", () => {
  localStorage.removeItem("token");

  localStorage.removeItem("userEmail");

  tasks = [];

  checkAuth();

  showToast("Logged out");
});

// ===============================
// Load Tasks From ECS Backend
// ===============================

async function fetchTasks() {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(API_BASE, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error("Unable to load tasks");
    }

    tasks = await res.json();

    render();
  } catch (err) {
    console.error("FETCH ERROR:", err);

    showToast("Could not load tasks", "error");
  }
}
// ===============================
// Add Task
// ===============================

addTaskBtn?.addEventListener("click", async (e) => {
  e.preventDefault();

  const name = document.getElementById("taskInput").value.trim();

  const due_date = document.getElementById("dueDateInput").value || null;

  const priority = document.getElementById("priorityInput").value;

  const category = document.getElementById("categoryInput").value;

  if (!name) {
    showToast("Task name required", "error");

    return;
  }

  try {
    const token = localStorage.getItem("token");

    const res = await fetch(API_BASE, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        name,

        due_date,

        priority,

        category,
      }),
    });

    if (!res.ok) {
      throw new Error("Create failed");
    }

    await fetchTasks();

    document.getElementById("taskInput").value = "";

    document.getElementById("dueDateInput").value = "";

    showToast("Task created");
  } catch (err) {
    console.error(err);

    showToast("Create failed", "error");
  }
});

// ===============================
// Delete Task
// ===============================

async function deleteTask(id) {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(`/api/tasks/${id}`, {
      method: "DELETE",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || "Delete failed", "error");

      return;
    }

    await fetchTasks();

    showToast("Task deleted");
  } catch (err) {
    console.error(err);

    showToast("Delete failed", "error");
  }
}

// ===============================
// Update Status
// ===============================

async function updateTaskStatus(id, status) {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(`/api/tasks/${id}/status`, {
      method: "PATCH",

      headers: {
        "Content-Type": "application/json",

        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        status,
      }),
    });

    if (!res.ok) {
      throw new Error("Status update failed");
    }

    await fetchTasks();

    showToast("Status updated");
  } catch (err) {
    console.error(err);

    showToast("Status update failed", "error");
  }
}

// ===============================
// Edit Task Save
// ===============================

editTaskForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = Number(editTaskId.value);

  try {
    const token = localStorage.getItem("token");

    const res = await fetch(`/api/tasks/${id}`, {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",

        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        name: editTaskName.value.trim(),

        due_date: editDueDate.value || null,

        priority: editPriority.value,

        category: editCategory.value,
      }),
    });

    if (!res.ok) {
      throw new Error("Update failed");
    }

    await fetchTasks();

    editModal.classList.remove("show");

    showToast("Task updated");
  } catch (err) {
    console.error(err);

    showToast("Update failed", "error");
  }
});

// ===============================
// Open Edit Modal
// ===============================

window.openEditModal = function (id) {
  const task = tasks.find((t) => t.id === id);

  if (!task) return;

  editTaskId.value = task.id;

  editTaskName.value = task.name;

  editDueDate.value = task.due_date || "";

  editPriority.value = task.priority;

  editCategory.value = task.category;

  editModal.classList.add("show");
};

closeModalBtn?.addEventListener("click", () => {
  editModal.classList.remove("show");
});
// ===============================
// Render
// ===============================

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

// ===============================
// Filter
// ===============================

function filterTasks() {
  const query = searchInput ? searchInput.value.toLowerCase() : "";

  return tasks.filter((task) => {
    const statusMatch =
      currentFilter === "All" || task.status === currentFilter;

    const searchMatch =
      task.name?.toLowerCase().includes(query) ||
      task.category?.toLowerCase().includes(query);

    return statusMatch && searchMatch;
  });
}

// ===============================
// Stats
// ===============================

function renderStats(data) {
  if (!statsBar) return;

  statsBar.innerHTML = `

    <span>Total: ${data.length}</span>

    <span>
    Todo:
    ${data.filter((t) => t.status === "Todo").length}
    </span>


    <span>
    In Progress:
    ${data.filter((t) => t.status === "In Progress").length}
    </span>


    <span>
    Done:
    ${data.filter((t) => t.status === "Done").length}
    </span>

    `;
}

// ===============================
// Progress
// ===============================

function renderProgressBar(data) {
  if (!progressBar) return;

  if (data.length === 0) {
    progressBar.style.width = "0%";

    return;
  }

  const done = data.filter((t) => t.status === "Done").length;

  const percent = Math.round((done / data.length) * 100);

  progressBar.style.width = `${percent}%`;
}

// ===============================
// Table
// ===============================

function renderTable(data) {
  taskList.innerHTML = "";

  data.forEach((task) => {
    const row = document.createElement("tr");

    row.innerHTML = `

        <td>
        <strong>${task.name}</strong>
        </td>


        <td>
        <span class="${getCategoryTagClass(task.category)}">
        ${task.category}
        </span>
        </td>


        <td>
        <span class="badge badge-${task.priority.toLowerCase()}">
        ${task.priority}
        </span>
        </td>


        <td>
        ${task.due_date || "—"}
        </td>


        <td>


        <select onchange="updateTaskStatus(${task.id},this.value)">


        <option ${task.status === "Todo" ? "selected" : ""}>
        Todo
        </option>


        <option ${task.status === "In Progress" ? "selected" : ""}>
        In Progress
        </option>


        <option ${task.status === "Done" ? "selected" : ""}>
        Done
        </option>


        </select>


        </td>



        <td>


        <button onclick="openEditModal(${task.id})">
        ✏️
        </button>


        <button onclick="deleteTask(${task.id})">
        🗑️
        </button>


        </td>


        `;

    taskList.appendChild(row);
  });
}

// ===============================
// Board View
// ===============================

function renderBoardView(data) {
  const todo = document.getElementById("cardsTodo");

  const progress = document.getElementById("cardsInProgress");

  const done = document.getElementById("cardsDone");

  todo.innerHTML = "";

  progress.innerHTML = "";

  done.innerHTML = "";

  data.forEach((task) => {
    const card = document.createElement("div");

    card.className = "task-card";

    card.dataset.id = task.id;

    card.innerHTML = `

<div>
<strong>${task.name}</strong>
</div>


<div>
${task.category}
</div>


<div>
${task.priority}
</div>


<button onclick="openEditModal(${task.id})">
✏️
</button>


<button onclick="deleteTask(${task.id})">
🗑️
</button>


`;

    if (task.status === "Todo") todo.appendChild(card);

    if (task.status === "In Progress") progress.appendChild(card);

    if (task.status === "Done") done.appendChild(card);
  });

  initDragAndDrop();
}

// ===============================
// Drag Drop
// ===============================

function initDragAndDrop() {
  sortableInstances.forEach((s) => s.destroy());

  sortableInstances = [];

  ["cardsTodo", "cardsInProgress", "cardsDone"].forEach((id) => {
    const el = document.getElementById(id);

    if (!el) return;

    const sortable = new Sortable(el, {
      group: "kanban",

      animation: 150,

      onEnd(evt) {
        const taskId = Number(evt.item.dataset.id);

        const status = evt.to.parentElement.dataset.status;

        updateTaskStatus(taskId, status);
      },
    });

    sortableInstances.push(sortable);
  });
}

// ===============================
// Sorting
// ===============================

document.querySelectorAll(".sortable").forEach((header) => {
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

function sortTasks(data) {
  if (!currentSortColumn) return data;

  return [...data].sort((a, b) => {
    let A = a[currentSortColumn] || "";

    let B = b[currentSortColumn] || "";

    if (currentSortColumn === "priority") {
      const map = {
        High: 3,
        Medium: 2,
        Low: 1,
      };

      A = map[A];

      B = map[B];
    }

    if (A < B) return currentSortDirection === "asc" ? -1 : 1;

    if (A > B) return currentSortDirection === "asc" ? 1 : -1;

    return 0;
  });
}

// ===============================
// Filters
// ===============================

filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterBtns.forEach((b) => b.classList.remove("active"));

    btn.classList.add("active");

    currentFilter = btn.dataset.filter;

    render();
  });
});

// ===============================
// Search
// ===============================

searchInput?.addEventListener("input", render);

// ===============================
// Views
// ===============================

tableViewBtn?.addEventListener("click", () => {
  currentView = "table";

  tableViewBtn.classList.add("active");

  boardViewBtn.classList.remove("active");

  taskTable.style.display = "table";

  boardView.style.display = "none";

  render();
});

boardViewBtn?.addEventListener("click", () => {
  currentView = "board";

  boardViewBtn.classList.add("active");

  tableViewBtn.classList.remove("active");

  taskTable.style.display = "none";

  boardView.style.display = "flex";

  render();
});

// ===============================
// Dark Mode
// ===============================

darkModeToggle?.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

// ===============================
// Start Application
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
});
