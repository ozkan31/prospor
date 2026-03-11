import express from "express";
import { pool } from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.use(authRequired);

const mapOrderRows = (ordersRows, itemsRows) => {
  const itemsByOrderId = new Map();
  for (const item of itemsRows) {
    if (!itemsByOrderId.has(item.order_id)) {
      itemsByOrderId.set(item.order_id, []);
    }

    itemsByOrderId.get(item.order_id).push({
      id: item.product_id,
      name: item.name,
      image: item.image,
      qty: Number(item.qty),
      price: Number(item.price),
      size: item.size_value,
      color: item.color
    });
  }

  return ordersRows.map((order) => ({
    id: order.order_no,
    date: new Date(order.created_at).toISOString().slice(0, 10),
    status: order.status,
    total: Number(order.total),
    shipping: Number(order.shipping),
    address: (() => {
      try {
        return order.address_json ? JSON.parse(order.address_json) : null;
      } catch {
        return null;
      }
    })(),
    items: itemsByOrderId.get(order.id) || []
  }));
};

const generateOrderNo = () => `PS-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

router.get("/", async (req, res) => {
  try {
    const [ordersRows] = await pool.query(
      `SELECT id, order_no, status, total, shipping, address_json, created_at
       FROM orders
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
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

    return res.json({ orders: mapOrderRows(ordersRows, itemsRows) });
  } catch (error) {
    return res.status(500).json({ message: "Siparişler alınamadı.", error: error.message });
  }
});

router.get("/:orderNo", async (req, res) => {
  try {
    const [ordersRows] = await pool.query(
      `SELECT id, order_no, status, total, shipping, address_json, created_at
       FROM orders
       WHERE user_id = ? AND order_no = ?
       LIMIT 1`,
      [req.user.id, req.params.orderNo]
    );

    const order = ordersRows[0];
    if (!order) {
      return res.status(404).json({ message: "Sipariş bulunamadı." });
    }

    const [itemsRows] = await pool.query(
      `SELECT order_id, product_id, name, image, qty, price, size_value, color
       FROM order_items
       WHERE order_id = ?
       ORDER BY id ASC`,
      [order.id]
    );

    return res.json({ order: mapOrderRows([order], itemsRows)[0] });
  } catch (error) {
    return res.status(500).json({ message: "Sipariş detayı alınamadı.", error: error.message });
  }
});

router.post("/", async (req, res) => {
  const address = req.body.address || null;

  if (!address || typeof address !== "object") {
    return res.status(400).json({ message: "Teslimat adresi zorunlu." });
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [cartRows] = await conn.query(
      `SELECT c.id, c.product_id, c.qty, c.size_value, c.color,
              p.name, p.image, p.price, p.stock
       FROM cart_items c
       INNER JOIN products p ON p.id = c.product_id
       WHERE c.user_id = ?
       FOR UPDATE`,
      [req.user.id]
    );

    if (!cartRows.length) {
      await conn.rollback();
      return res.status(400).json({ message: "Sepet boş." });
    }

    const subtotal = cartRows.reduce((sum, row) => sum + Number(row.price) * Number(row.qty), 0);
    const shipping = subtotal > 2999 ? 0 : 149;
    const total = subtotal + shipping;

    let orderNo = generateOrderNo();
    for (let i = 0; i < 5; i += 1) {
      const [exists] = await conn.query("SELECT id FROM orders WHERE order_no = ? LIMIT 1", [orderNo]);
      if (!exists.length) break;
      orderNo = generateOrderNo();
    }

    const [orderInsert] = await conn.query(
      `INSERT INTO orders (order_no, user_id, status, total, shipping, address_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [orderNo, req.user.id, "Sipariş Alındı", total, shipping, JSON.stringify(address)]
    );

    const orderId = orderInsert.insertId;

    for (const row of cartRows) {
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, name, image, qty, price, size_value, color)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderId, row.product_id, row.name, row.image, row.qty, row.price, row.size_value, row.color]
      );

      await conn.query("UPDATE products SET stock = GREATEST(stock - ?, 0) WHERE id = ?", [row.qty, row.product_id]);
    }

    await conn.query("DELETE FROM cart_items WHERE user_id = ?", [req.user.id]);

    await conn.commit();

    return res.status(201).json({
      order: {
        id: orderNo,
        date: new Date().toISOString().slice(0, 10),
        status: "Sipariş Alındı",
        total,
        shipping,
        address,
        items: cartRows.map((row) => ({
          id: row.product_id,
          name: row.name,
          image: row.image,
          qty: Number(row.qty),
          price: Number(row.price),
          size: row.size_value,
          color: row.color
        }))
      },
      cart: []
    });
  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ message: "Sipariş oluşturulamadı.", error: error.message });
  } finally {
    conn.release();
  }
});

export default router;
