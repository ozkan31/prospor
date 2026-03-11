import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { config } from "../config.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email }, config.jwtSecret, {
    expiresIn: "7d"
  });

router.post("/register", async (req, res) => {
  const firstName = String(req.body.firstName || "").trim();
  const lastName = String(req.body.lastName || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!firstName || !lastName || !email || password.length < 6) {
    return res.status(400).json({ message: "Geçersiz kayıt bilgileri." });
  }

  try {
    const [exists] = await pool.query("SELECT id FROM users WHERE email =  LIMIT 1", [email]);
    if (exists.length) {
      return res.status(409).json({ message: "Bu e-posta zaten kayıtlı." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [insertResult] = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password_hash)
       VALUES (?, ?, ?, ?)`,
      [firstName, lastName, email, passwordHash]
    );

    const user = {
      id: insertResult.insertId,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      email,
      phone: ""
    };

    return res.status(201).json({ token: signToken(user), user });
  } catch (error) {
    return res.status(500).json({ message: "Kayıt sırasında hata oluştu.", error: error.message });
  }
});

router.post("/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !password) {
    return res.status(400).json({ message: "E-posta ve şifre zorunlu." });
  }

  try {
    const [rows] = await pool.query(
      `SELECT id, first_name, last_name, email, phone, password_hash
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email]
    );

    const found = rows[0];
    if (!found) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    const ok = await bcrypt.compare(password, found.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "Şifre hatalı." });
    }

    const user = {
      id: found.id,
      firstName: found.first_name,
      lastName: found.last_name,
      name: `${found.first_name} ${found.last_name}`,
      email: found.email,
      phone: found.phone || ""
    };

    return res.json({ token: signToken(user), user });
  } catch (error) {
    return res.status(500).json({ message: "Giriş sırasında hata oluştu.", error: error.message });
  }
});

router.get("/me", authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, first_name, last_name, email, phone
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [req.user.id]
    );

    const found = rows[0];
    if (!found) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    return res.json({
      user: {
        id: found.id,
        firstName: found.first_name,
        lastName: found.last_name,
        name: `${found.first_name} ${found.last_name}`,
        email: found.email,
        phone: found.phone || ""
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Kullanıcı bilgisi alınamadı.", error: error.message });
  }
});

export default router;
