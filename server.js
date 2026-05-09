const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to PostgreSQL using Railway’s environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// --- API Endpoints ---

// GET /api/db – returns the full database state
app.get("/api/db", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM app_data ORDER BY key");
    const data = {};
    for (const row of result.rows) {
      data[row.key] = row.value;
    }
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

// POST /api/db – saves the entire database state (upsert)
app.post("/api/db", async (req, res) => {
  const payload = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const [key, value] of Object.entries(payload)) {
      await client.query(
        `INSERT INTO app_data (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE
         SET value = EXCLUDED.value, updated_at = NOW()`,
        [key, JSON.stringify(value)]
      );
    }
    await client.query("COMMIT");
    res.json({ status: "ok" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Database write failed" });
  } finally {
    client.release();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`B-NART API running on port ${PORT}`);
});