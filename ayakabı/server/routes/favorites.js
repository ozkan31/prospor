import express from "express";
import { pool } from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.use(authRequired);

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT product_id AS productId FROM favorite_items WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );

    return res.json({ favorites: rows.map((row) => row.productId) });
  } catch (error) {
    return res.status(500).json({ message: "Favoriler alınamadı.", error: error.message });
  }
});

router.post("/:productId", async (req, res) => {
  const { productId } = req.params;

  try {
    const [exists] = await pool.query(
      "SELECT 1 FROM favorite_items WHERE user_id = ? AND product_id = ? LIMIT 1",
      [req.user.id, productId]
    );

    if (exists.length) {
      await pool.query("DELETE FROM favorite_items WHERE user_id = ? AND product_id = ?", [req.user.id, productId]);
    } else {
      await pool.query("INSERT INTO favorite_items (user_id, product_id) VALUES (?, ?)", [req.user.id, productId]);
    }

    const [rows] = await pool.query(
      "SELECT product_id AS productId FROM favorite_items WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );

    return res.json({ favorites: rows.map((row) => row.productId) });
  } catch (error) {
    return res.status(500).json({ message: "Favori güncellenemedi.", error: error.message });
  }
});

export default router;
