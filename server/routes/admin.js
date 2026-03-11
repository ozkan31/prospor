import fs from "node:fs";
import path from "node:path";
import express from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import { config } from "../config.js";
import { pool } from "../db.js";
import { normalizeProduct } from "../utils.js";

const router = express.Router();

const uploadsDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext) ? ext : ".jpg";
    cb(null, `prd-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 12 }
});

const signAdminToken = () =>
  jwt.sign({ scope: "admin", email: config.adminEmail }, config.jwtSecret, {
    expiresIn: "12h"
  });

const adminAuthRequired = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return res.status(401).json({ message: "Admin girişi gerekli." });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (payload?.scope !== "admin") {
      return res.status(403).json({ message: "Admin yetkisi gerekli." });
    }

    req.admin = payload;
    return next();
  } catch {
    return res.status(401).json({ message: "Geçersiz admin oturumu." });
  }
};

const parseList = (value, mapper = (item) => item) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => mapper(String(item).trim()))
      .filter(Boolean);
  }

  return String(value)
    .split(/[\n,]/g)
    .map((item) => mapper(item.trim()))
    .filter(Boolean);
};

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const toInt = (value, fallback = 0) => {
  const num = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(num) ? num : fallback;
};

const parseAddressJson = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const createProductId = (name) => {
  const slug = String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);

  return `${slug || "urun"}-${Date.now()}`;
};

const buildProductPayload = (req, fallbackProduct = null) => {
  const name = String(req.body.name || "").trim();
  const brand = String(req.body.brand || "").trim();
  const gender = String(req.body.gender || "").trim() || fallbackProduct?.gender || "Unisex";
  const description = String(req.body.description || "").trim();
  const usage = String(req.body.usage || "").trim();
  const shipping = String(req.body.shipping || "").trim();
  const returns = String(req.body.returns || "").trim();

  const price = toNumber(req.body.price, 0);
  const oldPriceRaw = String(req.body.oldPrice ?? "").trim();
  const oldPrice = oldPriceRaw ? toNumber(oldPriceRaw, price) : null;
  const rating = toNumber(req.body.rating, 0);
  const reviews = toInt(req.body.reviews, 0);
  const stock = toInt(req.body.stock, 0);

  const categories = parseList(req.body.category);
  const colors = parseList(req.body.colors);
  const sizes = parseList(req.body.sizes, (item) => Number(item));
  const specs = parseList(req.body.specs);
  const manualGallery = parseList(req.body.gallery);
  const uploadedUrls = (req.files || []).map((file) => {
    const base = `${req.protocol}://${req.get("host")}`;
    return `${base}/uploads/${file.filename}`;
  });

  const gallery = [...uploadedUrls, ...manualGallery];
  const fallbackGallery = fallbackProduct ? JSON.parse(fallbackProduct.gallery_json || "[]") : [];
  const nextGallery = gallery.length ? gallery : fallbackGallery;

  return {
    name,
    brand,
    gender,
    description,
    usage,
    shipping,
    returns,
    price,
    oldPrice,
    rating,
    reviews,
    stock,
    categories,
    colors,
    sizes: sizes.filter((s) => Number.isFinite(s)),
    specs,
    gallery: nextGallery,
    image: nextGallery[0] || ""
  };
};

router.post("/login", (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!config.adminEmail || !config.adminPassword) {
    return res.status(500).json({ message: "Admin bilgileri .env içinde tanımlı değil." });
  }

  if (!email || !password) {
    return res.status(400).json({ message: "E-posta ve şifre zorunlu." });
  }

  if (email !== config.adminEmail || password !== config.adminPassword) {
    return res.status(401).json({ message: "Admin e-posta veya şifre hatalı." });
  }

  return res.json({
    token: signAdminToken(),
    admin: { email: config.adminEmail }
  });
});

router.get("/me", adminAuthRequired, (req, res) => {
  return res.json({ admin: { email: req.admin.email } });
});

router.get("/products", adminAuthRequired, async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM products ORDER BY created_at DESC");
    return res.json({ products: rows.map(normalizeProduct) });
  } catch (error) {
    return res.status(500).json({ message: "Ürünler alınamadı.", error: error.message });
  }
});

router.get("/orders", adminAuthRequired, async (_req, res) => {
  try {
    const [ordersRows] = await pool.query(
      `SELECT
         o.id,
         o.order_no,
         o.status,
         o.total,
         o.shipping,
         o.address_json,
         o.created_at,
         u.id AS user_id,
         u.first_name,
         u.last_name,
         u.email,
         u.phone
       FROM orders o
       INNER JOIN users u ON u.id = o.user_id
       ORDER BY o.created_at DESC`
    );

    if (!ordersRows.length) {
      return res.json({ orders: [] });
    }

    const [itemsRows] = await pool.query(
      `SELECT order_id, product_id, name, image, qty, price, size_value, color
       FROM order_items
       WHERE order_id IN (?)
       ORDER BY id ASC`,
      [ordersRows.map((row) => row.id)]
    );

    const itemsByOrderId = new Map();
    for (const item of itemsRows) {
      if (!itemsByOrderId.has(item.order_id)) {
        itemsByOrderId.set(item.order_id, []);
      }

      itemsByOrderId.get(item.order_id).push({
        productId: item.product_id,
        name: item.name,
        image: item.image,
        qty: Number(item.qty),
        price: Number(item.price),
        size: item.size_value,
        color: item.color
      });
    }

    return res.json({
      orders: ordersRows.map((order) => ({
        id: order.order_no,
        date: new Date(order.created_at).toISOString(),
        status: order.status,
        total: Number(order.total),
        shipping: Number(order.shipping),
        address: parseAddressJson(order.address_json),
        user: {
          id: Number(order.user_id),
          firstName: order.first_name,
          lastName: order.last_name,
          name: `${order.first_name} ${order.last_name}`.trim(),
          email: order.email,
          phone: order.phone || ""
        },
        items: itemsByOrderId.get(order.id) || []
      }))
    });
  } catch (error) {
    return res.status(500).json({ message: "Siparişler alınamadı.", error: error.message });
  }
});

router.get("/users", adminAuthRequired, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, first_name, last_name, email, phone, created_at
       FROM users
       ORDER BY created_at DESC`
    );

    return res.json({
      users: rows.map((row) => ({
        id: Number(row.id),
        firstName: row.first_name,
        lastName: row.last_name,
        name: `${row.first_name} ${row.last_name}`.trim(),
        email: row.email,
        phone: row.phone || "",
        createdAt: new Date(row.created_at).toISOString()
      }))
    });
  } catch (error) {
    return res.status(500).json({ message: "Üyeler alınamadı.", error: error.message });
  }
});

router.post("/products", adminAuthRequired, upload.array("images", 12), async (req, res) => {
  const { name, brand, gender, description, usage, shipping, returns, price, oldPrice, rating, reviews, stock, categories, colors, sizes, specs, gallery, image } = buildProductPayload(req);
  const id = String(req.body.id || "").trim() || createProductId(name);

  if (!name || !brand || !price || !image) {
    return res.status(400).json({
      message: "Ürün adı, marka, fiyat ve en az bir görsel zorunlu."
    });
  }

  try {
    const [exists] = await pool.query("SELECT id FROM products WHERE id = ? LIMIT 1", [id]);
    if (exists.length) {
      return res.status(409).json({ message: "Aynı ürün kimliği zaten var." });
    }

    await pool.query(
      `INSERT INTO products
       (id, name, brand, price, old_price, rating, reviews, gender, category_json, colors_json, sizes_json, stock, image, gallery_json, description, specs_json, usage_text, shipping_text, returns_text)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name,
        brand,
        price,
        oldPrice,
        rating,
        reviews,
        gender,
        JSON.stringify(categories),
        JSON.stringify(colors),
        JSON.stringify(sizes.filter((s) => Number.isFinite(s))),
        stock,
        image,
        JSON.stringify(gallery),
        description || null,
        JSON.stringify(specs),
        usage || null,
        shipping || null,
        returns || null
      ]
    );

    const [rows] = await pool.query("SELECT * FROM products WHERE id = ? LIMIT 1", [id]);
    return res.status(201).json({ product: normalizeProduct(rows[0]) });
  } catch (error) {
    return res.status(500).json({ message: "Ürün oluşturulamadı.", error: error.message });
  }
});

router.put("/products/:id", adminAuthRequired, upload.array("images", 12), async (req, res) => {
  const id = String(req.params.id || "").trim();

  try {
    const [rows] = await pool.query("SELECT * FROM products WHERE id = ? LIMIT 1", [id]);
    const existing = rows[0];
    if (!existing) {
      return res.status(404).json({ message: "Ürün bulunamadı." });
    }

    const { name, brand, gender, description, usage, shipping, returns, price, oldPrice, rating, reviews, stock, categories, colors, sizes, specs, gallery, image } =
      buildProductPayload(req, existing);

    if (!name || !brand || !price || !image) {
      return res.status(400).json({ message: "Ürün adı, marka, fiyat ve en az bir görsel zorunlu." });
    }

    await pool.query(
      `UPDATE products
       SET name = ?, brand = ?, price = ?, old_price = ?, rating = ?, reviews = ?, gender = ?,
           category_json = ?, colors_json = ?, sizes_json = ?, stock = ?, image = ?, gallery_json = ?,
           description = ?, specs_json = ?, usage_text = ?, shipping_text = ?, returns_text = ?
       WHERE id = ?`,
      [
        name,
        brand,
        price,
        oldPrice,
        rating,
        reviews,
        gender,
        JSON.stringify(categories),
        JSON.stringify(colors),
        JSON.stringify(sizes),
        stock,
        image,
        JSON.stringify(gallery),
        description || null,
        JSON.stringify(specs),
        usage || null,
        shipping || null,
        returns || null,
        id
      ]
    );

    const [updatedRows] = await pool.query("SELECT * FROM products WHERE id = ? LIMIT 1", [id]);
    return res.json({ product: normalizeProduct(updatedRows[0]) });
  } catch (error) {
    return res.status(500).json({ message: "Ürün güncellenemedi.", error: error.message });
  }
});

export default router;
