import express from "express";
import { pool } from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

const mapCartRow = (row) => ({
  id: Number(row.id),
  productId: row.productId,
  qty: Number(row.qty),
  size: row.size_value,
  color: row.color
});

router.use(authRequired);

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, product_id AS productId, qty, size_value, color
       FROM cart_items
       WHERE user_id = ?
       ORDER BY id DESC`,
      [req.user.id]
    );

    return res.json({ cart: rows.map(mapCartRow) });
  } catch (error) {
    return res.status(500).json({ message: "Sepet alınamadı.", error: error.message });
  }
});

router.post("/items", async (req, res) => {
  const productId = String(req.body.productId || "").trim();
  const qty = Math.max(1, Number(req.body.qty || 1));
  const size = String(req.body.size || "").trim();
  const color = String(req.body.color || "").trim();

  if (!productId || !size || !color) {
    return res.status(400).json({ message: "Ürün, numara ve renk zorunlu." });
  }

  try {
    await pool.query("SELECT id FROM products WHERE id =  LIMIT 1", [productId]);

    await pool.query(
      `INSERT INTO cart_items (user_id, product_id, qty, size_value, color)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE qty = qty + VALUES(qty), updated_at = CURRENT_TIMESTAMP`,
      [req.user.id, productId, qty, size, color]
    );

    const [rows] = await pool.query(
      `SELECT id, product_id AS productId, qty, size_value, color
       FROM cart_items
       WHERE user_id = ?
       ORDER BY id DESC`,
      [req.user.id]
    );

    return res.status(201).json({ cart: rows.map(mapCartRow) });
  } catch (error) {
    return res.status(500).json({ message: "Sepete eklenemedi.", error: error.message });
  }
});

router.patch("/items/:id", async (req, res) => {
  const id = Number(req.params.id);
  const qty = Math.max(1, Number(req.body.qty || 1));

  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Geçersiz sepet satırı." });
  }

  try {
    await pool.query("UPDATE cart_items SET qty =  WHERE id =  AND user_id = ?", [qty, id, req.user.id]);

    const [rows] = await pool.query(
      `SELECT id, product_id AS productId, qty, size_value, color
       FROM cart_items
       WHERE user_id = ?
       ORDER BY id DESC`,
      [req.user.id]
    );

    return res.json({ cart: rows.map(mapCartRow) });
  } catch (error) {
    return res.status(500).json({ message: "Sepet güncellenemedi.", error: error.message });
  }
});

router.delete("/items/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Geçersiz sepet satırı." });
  }

  try {
    await pool.query("DELETE FROM cart_items WHERE id =  AND user_id = ?", [id, req.user.id]);

    const [rows] = await pool.query(
      `SELECT id, product_id AS productId, qty, size_value, color
       FROM cart_items
       WHERE user_id = ?
       ORDER BY id DESC`,
      [req.user.id]
    );

    return res.json({ cart: rows.map(mapCartRow) });
  } catch (error) {
    return res.status(500).json({ message: "Sepet satırı silinemedi.", error: error.message });
  }
});

router.delete("/clear", async (req, res) => {
  try {
    await pool.query("DELETE FROM cart_items WHERE user_id = ?", [req.user.id]);
    return res.json({ cart: [] });
  } catch (error) {
    return res.status(500).json({ message: "Sepet temizlenemedi.", error: error.message });
  }
});

export default router;
