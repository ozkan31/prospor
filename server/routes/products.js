import express from "express";
import { pool } from "../db.js";
import { normalizeProduct } from "../utils.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM products ORDER BY created_at DESC");
    return res.json({ products: rows.map(normalizeProduct) });
  } catch (error) {
    return res.status(500).json({ message: "Ürünler alınamadı.", error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM products WHERE id = ? LIMIT 1", [req.params.id]);
    const product = rows[0];
    if (!product) {
      return res.status(404).json({ message: "Ürün bulunamadı." });
    }

    return res.json({ product: normalizeProduct(product) });
  } catch (error) {
    return res.status(500).json({ message: "Ürün alınamadı.", error: error.message });
  }
});

export default router;
