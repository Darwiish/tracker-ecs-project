const express = require("express");
const pool = require("../db");

const router = express.Router();

const VALID_STATUSES = ["Todo", "In Progress", "Done"];

// GET /tasks?search=term
router.get("/", async (req, res) => {
  const { search } = req.query;
  try {
    let result;
    if (search) {
      result = await pool.query(
        "SELECT id, name, status, TO_CHAR(due_date, 'YYYY-MM-DD') AS due_date FROM tasks WHERE name ILIKE $1 ORDER BY id ASC",
        [`%${search}%`],
      );
    } else {
      result = await pool.query(
        "SELECT id, name, status, TO_CHAR(due_date, 'YYYY-MM-DD') AS due_date FROM tasks ORDER BY id ASC",
      );
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /tasks
router.post("/", async (req, res) => {
  const { name, due_date } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Task name is required" });
  }
  try {
    await pool.query(
      "INSERT INTO tasks (name, status, due_date) VALUES ($1, $2, $3)",
      [name, "Todo", due_date || null],
    );
    res.json({ message: "Task added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /tasks/:id  (update name and/or due date)
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, due_date } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Task name is required" });
  }

  try {
    const result = await pool.query(
      "UPDATE tasks SET name = $1, due_date = $2 WHERE id = $3",
      [name, due_date || null, id],
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json({ message: "Task updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /tasks/:id/status
router.patch("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const result = await pool.query(
      "UPDATE tasks SET status = $1 WHERE id = $2",
      [status, id],
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json({ message: "Status updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /tasks/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json({ message: "Task deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
