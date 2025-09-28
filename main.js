const express = require("express");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de nuestra base de datos en PostgreSQL
const pool = new Pool({
  user: "u0_a258",
  host: "localhost",
  database: "jcstudiojkanime",
  password: "tu_contraseña",
  port: 5432
});

// 🔹 Middleware para parsear JSON
app.use(express.json());

// ========================
// Endpoints
// ========================

// Listar animes con paginación
app.get("/animes", async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;

  try {
    const result = await pool.query(
      "SELECT * FROM animes_list ORDER BY id LIMIT $1 OFFSET $2",
      [limit, offset]
    );
    res.json({
      total: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Buscar anime por slug
app.get("/anime/:slug", async (req, res) => {
  const slug = req.params.slug.trim();
  try {
    const result = await pool.query(
      "SELECT * FROM animes_list WHERE slug = $1",
      [slug]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Anime no encontrado" });
    } else {
      res.json(result.rows[0]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Aquí realizamos filtro por genero
app.get("/genero/:nombre", async (req, res) => {
  const genero = req.params.nombre.trim();
  try {
    const result = await pool.query(
      "SELECT * FROM animes_list WHERE genres ILIKE $1",
      [`%${genero}%`]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ message: "No se encontraron animes con ese género" });
    } else {
      res.json({
        total: result.rows.length,
        data: result.rows
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Buscar por texto en título o sinopsis
app.get("/buscar", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) {
    return res.status(400).json({ error: "Debes enviar un parámetro ?q=" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM animes_list WHERE title ILIKE $1 OR synopsis ILIKE $1",
      [`%${q}%`]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ message: "No se encontraron resultados" });
    } else {
      res.json({
        total: result.rows.length,
        data: result.rows
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================
// Iniciar servidor
// ========================
app.listen(PORT, () => {
  console.log('API corriendo en http://localhost:${PORT}`);
});
