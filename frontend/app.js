const API_URL = "http://localhost:5000/tasks";
const STATUSES = ["Todo", "In Progress", "Done"];

async function fetchTasks(search = "") {
  const url = search
    ? `${API_URL}?search=${encodeURIComponent(search)}`
    : API_URL;
  const res = await fetch(url);
  const tasks = await res.json();
  renderTasks(tasks);
}

function renderTasks(tasks) {
  const list = document.getElementById("taskList");
  list.innerHTML = "";

  tasks.forEach((task) => {
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
    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.onclick = () => editTask(task);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = () => deleteTask(task.id);

    actionsTd.appendChild(editBtn);
    actionsTd.appendChild(deleteBtn);

    tr.appendChild(nameTd);
    tr.appendChild(dueTd);
    tr.appendChild(statusTd);
    tr.appendChild(actionsTd);

    list.appendChild(tr);
  });
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
  await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, due_date }),
  });
  fetchTasks(document.getElementById("searchInput").value);
}

async function updateStatus(id, status) {
  await fetch(`${API_URL}/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  fetchTasks(document.getElementById("searchInput").value);
}

async function deleteTask(id) {
  await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  fetchTasks(document.getElementById("searchInput").value);
}

async function addTask() {
  const input = document.getElementById("taskInput");
  const dueDateInput = document.getElementById("dueDateInput");
  const name = input.value.trim();
  if (!name) return;

  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, due_date: dueDateInput.value || null }),
  });

  input.value = "";
  dueDateInput.value = "";
  fetchTasks(document.getElementById("searchInput").value);
}

document.getElementById("addTaskBtn").addEventListener("click", addTask);
document.getElementById("searchInput").addEventListener("input", (e) => {
  fetchTasks(e.target.value);
});

fetchTasks();
