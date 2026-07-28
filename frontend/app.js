const API_BASE = "http://localhost:5000";
const STATUSES = ["Todo", "In Progress", "Done"];
const PAGE_SIZE = 10;

let isRegisterMode = false;
let currentFilter = "All";
let allTasks = [];
let currentPage = 1;

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

    // Restore button only shows for Done tasks
    if (task.status === "Done") {
      const restoreBtn = document.createElement("button");
      restoreBtn.textContent = "Restore";
      restoreBtn.onclick = () => updateStatus(task.id, "In Progress");
      actionsTd.appendChild(restoreBtn);
    }

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.onclick = () => editTask(task);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = () => deleteTask(task.id, task.name);

    actionsTd.appendChild(editBtn);
    actionsTd.appendChild(deleteBtn);

    tr.appendChild(nameTd);
    tr.appendChild(dueTd);
    tr.appendChild(statusTd);
    tr.appendChild(actionsTd);

    list.appendChild(tr);
  });

  renderPagination(tasks.length, totalPages);
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
    renderTasks(applyFilter(allTasks));
  });
});

// --- Init ---
if (getToken()) {
  showApp();
} else {
  showAuth();
}
