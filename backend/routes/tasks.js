const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

const VALID_STATUSES = ["Todo", "In Progress", "Done"];
const VALID_PRIORITIES = ["Low", "Medium", "High"];

router.use(authenticateToken);

// GET /tasks?search=term
router.get("/", async (req, res) => {
  const { search } = req.query;
  const userId = req.user.id;

  try {
    let query = `
      SELECT id, name, status, priority, category, TO_CHAR(due_date, 'YYYY-MM-DD') AS due_date 
      FROM tasks 
      WHERE user_id = $1
    `;
    const params = [userId];

    if (search) {
      query += ` AND name ILIKE $2`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY due_date ASC NULLS LAST, id ASC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /tasks
router.post("/", async (req, res) => {
  const { name, due_date, priority, category } = req.body;
  const userId = req.user.id;

  if (!name) {
    return res.status(400).json({ message: "Task name is required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO tasks (name, status, due_date, priority, category, user_id) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, name, status, priority, category, TO_CHAR(due_date, 'YYYY-MM-DD') AS due_date`,
      [
        name,
        "Todo",
        due_date || null,
        priority || "Medium",
        category || "General",
        userId,
      ],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /tasks/:id (Full Update - Modal Edit)
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, due_date, priority, category } = req.body;
  const userId = req.user.id;

  if (!name) {
    return res.status(400).json({ message: "Task name is required" });
  }

  try {
    const result = await pool.query(
      `UPDATE tasks 
       SET name = $1, due_date = $2, priority = $3, category = $4 
       WHERE id = $5 AND user_id = $6 
       RETURNING id, name, status, priority, category, TO_CHAR(due_date, 'YYYY-MM-DD') AS due_date`,
      [
        name,
        due_date || null,
        priority || "Medium",
        category || "General",
        id,
        userId,
      ],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json({ message: "Task updated", task: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /tasks/:id/status (Status Dropdown / Drag & Drop)
router.patch("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user.id;

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const result = await pool.query(
      "UPDATE tasks SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *",
      [status, id, userId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json({ message: "Status updated", task: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /tasks/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId],
    );

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
