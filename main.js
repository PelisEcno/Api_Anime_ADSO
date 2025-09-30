const express = require("express");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(express.json());

// 🔹 Utilidad para contar total de registros
const getTotalCount = async () => {
  const result = await pool.query("SELECT COUNT(*) FROM animes_list");
  return parseInt(result.rows[0].count);
};

// ========================
// Endpoints
// ========================

// 🔸 Listar animes con paginación y count
app.get("/animes", async (req, res) => {
  const count = parseInt(req.query.count) || 50;
  const offset = parseInt(req.query.offset) || 0;

  try {
    const total = await getTotalCount();
    const result = await pool.query(
      "SELECT * FROM animes_list ORDER BY id LIMIT $1 OFFSET $2",
      [count, offset]
    );
    res.json({
      total,
      count: result.rows.length,
      offset,
      data: result.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔸 Buscar anime por slug
app.get("/anime/:slug", async (req, res) => {
  const slug = req.params.slug.trim();
  try {
    const result = await pool.query(
      "SELECT * FROM animes_list WHERE slug = $1",
      [slug]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Anime no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔸 Filtro por género
app.get("/genero/:nombre", async (req, res) => {
  const genero = req.params.nombre.trim();
  const count = parseInt(req.query.count) || 50;
  const offset = parseInt(req.query.offset) || 0;

  try {
    const result = await pool.query(
      "SELECT * FROM animes_list WHERE genres ILIKE $1 ORDER BY id LIMIT $2 OFFSET $3",
      [`%${genero}%`, count, offset]
    );
    res.json({
      total: result.rows.length,
      count,
      offset,
      data: result.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔸 Búsqueda por texto en título o sinopsis
app.get("/buscar", async (req, res) => {
  const q = (req.query.q || "").trim();
  const count = parseInt(req.query.count) || 50;
  const offset = parseInt(req.query.offset) || 0;

  if (!q) return res.status(400).json({ error: "Debes enviar un parámetro ?q=" });

  try {
    const result = await pool.query(
      "SELECT * FROM animes_list WHERE title ILIKE $1 OR synopsis ILIKE $1 ORDER BY id LIMIT $2 OFFSET $3",
      [`%${q}%`, count, offset]
    );
    res.json({
      total: result.rows.length,
      count,
      offset,
      data: result.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔸 Endpoint flexible tipo /animes?jcstudio=slug&value=Naruto
app.get("/animes/filtro", async (req, res) => {
  const field = req.query.jcstudio;
  const value = req.query.value;
  const count = parseInt(req.query.count) || 50;
  const offset = parseInt(req.query.offset) || 0;

  if (!field || !value) {
    return res.status(400).json({ error: "Debes enviar jcstudio y value como parámetros" });
  }

  try {
    const query = `SELECT * FROM animes_list WHERE ${field} ILIKE $1 ORDER BY id LIMIT $2 OFFSET $3`;
    const result = await pool.query(query, [`%${value}%`, count, offset]);
    res.json({
      total: result.rows.length,
      count,
      offset,
      data: result.rows
    });
  } catch (err) {
    res.status(500).json({ error: "Campo inválido o error interno" });
  }
});

// ========================
// Iniciar servidor
// ========================
app.listen(PORT, () => {
  console.log(`✅ API corriendo en http://localhost:${PORT}`);
});