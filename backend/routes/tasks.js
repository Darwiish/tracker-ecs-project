const express = require("express");
const pool = require("../db"); // PostgreSQL connection pool

const router = express.Router();

// GET /tasks
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tasks ORDER BY id ASC");
    res.json(result.rows); // Returns array of tasks
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

module.exports = router;
