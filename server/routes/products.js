import fs from "node:fs";
import path from "node:path";
import express from "express";
import { pool } from "../db.js";
import { createProductImageUrl, normalizeProduct, normalizeProductList, parseJsonArray } from "../utils.js";

const router = express.Router();
const imageCache = new Map();
const uploadsRoot = path.resolve(process.cwd(), "uploads");

const toPositiveInt = (value, fallback = 0, max = 120) => {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
};

const getProductMediaPaths = (row) => {
  const gallery = parseJsonArray(row.gallery_json);
  const merged = [];

  if (row.image) merged.push(row.image);
  for (const item of gallery) {
    if (item && !merged.includes(item)) merged.push(item);
  }

  return merged;
};

const rememberProductImages = (rows) => {
  for (const row of rows) {
    imageCache.set(row.id, getProductMediaPaths(row));
  }
};

const listSelect = `
  SELECT
    id,
    name,
    brand,
    price,
    old_price,
    rating,
    reviews,
    gender,
    category_json,
    colors_json,
    sizes_json,
    stock,
    image,
    description,
    gallery_json,
    created_at
  FROM products
`;

router.get("/", async (req, res) => {
  const view = req.query.view === "full" ? "full" : "list";
  const limit = toPositiveInt(req.query.limit, 0, 120);

  try {
    const sql = `${view === "full" ? "SELECT * FROM products" : listSelect} ORDER BY created_at DESC${limit ? ` LIMIT ${limit}` : ""}`;
    const [rows] = await pool.query(sql);
    rememberProductImages(rows);
    const mapper = view === "full" ? normalizeProduct : normalizeProductList;
    return res.json({ products: rows.map(mapper) });
  } catch (error) {
    return res.status(500).json({ message: "Urunler alinamadi.", error: error.message });
  }
});

router.get("/:id/image/:index", async (req, res) => {
  try {
    const index = Math.max(0, Number.parseInt(req.params.index, 10) || 0);
    let mediaPaths = imageCache.get(req.params.id);

    if (!mediaPaths) {
      const [rows] = await pool.query("SELECT id, image, gallery_json FROM products WHERE id = ? LIMIT 1", [req.params.id]);
      const product = rows[0];
      if (!product) {
        return res.status(404).json({ message: "Urun bulunamadi." });
      }
      mediaPaths = getProductMediaPaths(product);
      imageCache.set(req.params.id, mediaPaths);
    }

    const relativeImagePath = mediaPaths[index] || mediaPaths[0];
    if (!relativeImagePath) {
      return res.status(404).json({ message: "Gorsel bulunamadi." });
    }

    const normalized = String(relativeImagePath).replace(/^\/+/, "");
    const absolutePath = path.resolve(process.cwd(), normalized);
    if (!absolutePath.startsWith(uploadsRoot) || !fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: "Gorsel bulunamadi." });
    }

    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.sendFile(absolutePath);
  } catch (error) {
    return res.status(500).json({ message: "Gorsel alinamadi.", error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM products WHERE id = ? LIMIT 1", [req.params.id]);
    const product = rows[0];
    if (!product) {
      return res.status(404).json({ message: "Urun bulunamadi." });
    }

    imageCache.set(product.id, getProductMediaPaths(product));
    return res.json({ product: normalizeProduct(product) });
  } catch (error) {
    return res.status(500).json({ message: "Urun alinamadi.", error: error.message });
  }
});

export default router;
