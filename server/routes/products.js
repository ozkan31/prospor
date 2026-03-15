import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import express from "express";
import { pool } from "../db.js";
import { normalizeProduct, normalizeProductList, parseJsonArray } from "../utils.js";

const router = express.Router();
const imageCache = new Map();
const uploadsRoot = path.resolve(process.cwd(), "uploads");
const imageCacheRoot = path.join(uploadsRoot, ".thumb-cache");
const imagePresets = {
  card: { width: 520, height: 520, fit: "cover", quality: 72 },
  detail: { width: 1280, height: 1280, fit: "inside", quality: 82 },
  ticker: { width: 320, height: 320, fit: "cover", quality: 68 }
};

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

const toSafeCacheKey = (value) => String(value || "file").replace(/[^a-z0-9_-]/gi, "_");
const getImagePreset = (size) => imagePresets[String(size || "").trim()] || null;

const ensureThumbFile = async (sourcePath, productId, index, size) => {
  const preset = getImagePreset(size);
  if (!preset) return sourcePath;

  await fs.promises.mkdir(imageCacheRoot, { recursive: true });
  const thumbPath = path.join(imageCacheRoot, `${toSafeCacheKey(productId)}-${index}-${size}.webp`);

  const [sourceStat, thumbStat] = await Promise.allSettled([
    fs.promises.stat(sourcePath),
    fs.promises.stat(thumbPath)
  ]);

  const sourceMtime = sourceStat.status === "fulfilled" ? sourceStat.value.mtimeMs : 0;
  const thumbMtime = thumbStat.status === "fulfilled" ? thumbStat.value.mtimeMs : 0;

  if (thumbMtime >= sourceMtime && thumbMtime > 0) {
    return thumbPath;
  }

  await sharp(sourcePath)
    .rotate()
    .resize({ width: preset.width, height: preset.height, fit: preset.fit, withoutEnlargement: true })
    .webp({ quality: preset.quality })
    .toFile(thumbPath);

  return thumbPath;
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
    const requestedSize = String(req.query.size || "").trim();
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

    const fileToSend = await ensureThumbFile(absolutePath, req.params.id, index, requestedSize);
    res.setHeader("Cache-Control", "public, max-age=2592000, immutable");
    return res.sendFile(fileToSend);
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
