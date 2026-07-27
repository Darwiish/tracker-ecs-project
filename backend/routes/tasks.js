const express = require("express");
const pool = require("../db");

const router = express.Router();

// GET /tasks
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tasks ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /tasks
router.post("/", async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Task name is required" });
  }
  try {
    await pool.query("INSERT INTO tasks (name) VALUES ($1)", [name]);
    res.json({ message: "Task added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /tasks/:id
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Task name is required" });
  }

  try {
    const result = await pool.query(
      "UPDATE tasks SET name = $1 WHERE id = $2",
      [name, id],
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
