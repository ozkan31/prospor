import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import crypto from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import { pool } from "../db.js";
import { config } from "../config.js";
import { authRequired } from "../middleware/auth.js";
import { isMailConfigured, sendMail } from "../mailer.js";

const router = express.Router();

const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email }, config.jwtSecret, {
    expiresIn: "7d"
  });

const googleClient = config.googleClientIds?.length ? new OAuth2Client() : null;

router.post("/register", async (req, res) => {
  const firstName = String(req.body.firstName || "").trim();
  const lastName = String(req.body.lastName || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!firstName || !lastName || !email || password.length < 6) {
    return res.status(400).json({ message: "Geçersiz kayıt bilgileri." });
  }

  try {
    const [exists] = await pool.query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
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

router.post("/google", async (req, res) => {
  const credential = String(req.body.credential || "").trim();
  if (!credential) {
    return res.status(400).json({ message: "Google kimlik doğrulama bilgisi gerekli." });
  }

  if (!googleClient || !config.googleClientIds?.length) {
    return res.status(500).json({ message: "Google giriş yapılandırması eksik." });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: config.googleClientIds
    });

    const payload = ticket.getPayload();
    const email = String(payload?.email || "").trim().toLowerCase();
    const emailVerified = Boolean(payload?.email_verified);
    const firstName = String(payload?.given_name || payload?.name || "").trim() || "Google";
    const lastName = String(payload?.family_name || "").trim() || "Kullanıcı";

    if (!email || !emailVerified) {
      return res.status(400).json({ message: "Google hesabı doğrulanamadı." });
    }

    const [rows] = await pool.query(
      `SELECT id, first_name, last_name, email, phone
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email]
    );

    let user = rows[0];
    if (!user) {
      const pseudoPasswordHash = await bcrypt.hash(randomUUID(), 10);
      const [insertResult] = await pool.query(
        `INSERT INTO users (first_name, last_name, email, password_hash)
         VALUES (?, ?, ?, ?)`,
        [firstName, lastName, email, pseudoPasswordHash]
      );

      user = {
        id: insertResult.insertId,
        first_name: firstName,
        last_name: lastName,
        email,
        phone: ""
      };
    }

    const resultUser = {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      name: `${user.first_name} ${user.last_name}`.trim(),
      email: user.email,
      phone: user.phone || ""
    };

    return res.json({ token: signToken(resultUser), user: resultUser });
  } catch (error) {
    const reason = String(error?.message || "");
    const hint =
      reason.includes("Wrong recipient") || reason.includes("audience")
        ? "Google Client ID eşleşmiyor. Google Console'daki Web Client ID ve Authorized JavaScript origins ayarlarını kontrol edin."
        : reason.includes("Token used too late") || reason.includes("Token used too early")
          ? "Sunucu saatini ve tarihini kontrol edin."
          : "";

    return res.status(401).json({
      message: hint || "Google girişi doğrulanamadı.",
      error: reason || "unknown_error"
    });
  }
});

router.post("/forgot-password", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();

  if (!email) {
    return res.status(400).json({ message: "E-posta alanı zorunlu." });
  }

  try {
    const [rows] = await pool.query("SELECT id, first_name FROM users WHERE email = ? LIMIT 1", [email]);
    const found = rows[0];

    if (!found) {
      return res.status(404).json({ message: "Bu e-posta ile kayıtlı hesap bulunamadı." });
    }

    if (!isMailConfigured()) {
      return res.status(500).json({ message: "Şifre yenileme servisi şu an kullanılamıyor." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const ttlMinutes = Math.max(5, Number(config.resetTokenTtlMinutes || 30));

    await pool.query(
      `UPDATE password_reset_tokens
       SET used_at = NOW()
       WHERE user_id = ? AND used_at IS NULL`,
      [found.id]
    );

    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
      [found.id, tokenHash, ttlMinutes]
    );

    const resetLink = `${config.resetPasswordUrl}${config.resetPasswordUrl.includes("?") ? "&" : "?"}resetToken=${token}`;
    const name = found.first_name || "ProSpor müşterisi";

    await sendMail({
      to: email,
      subject: "ProSpor Şifre Sıfırlama",
      text: `Merhaba ${name}, şifrenizi yenilemek için bağlantıyı açın: ${resetLink}\nBu bağlantı ${ttlMinutes} dakika geçerlidir.`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
          <h2>ProSpor Şifre Sıfırlama</h2>
          <p>Merhaba ${name},</p>
          <p>Şifrenizi yenilemek için aşağıdaki butona tıklayın:</p>
          <p style="margin:20px 0">
            <a
              href="${resetLink}"
              style="display:inline-block;padding:12px 18px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-weight:700"
            >
              Şifremi Yenile
            </a>
          </p>
          <p>Bu bağlantı <strong>${ttlMinutes} dakika</strong> geçerlidir.</p>
          <p>Eğer bu talebi siz oluşturmadıysanız e-postayı dikkate almayabilirsiniz.</p>
        </div>
      `
    });

    return res.status(200).json({ message: "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi." });
  } catch (error) {
    return res.status(500).json({ message: "Şifre sıfırlama e-postası gönderilemedi.", error: error.message });
  }
});

router.post("/reset-password", async (req, res) => {
  const token = String(req.body.token || "").trim();
  const password = String(req.body.password || "");

  if (!token || password.length < 6) {
    return res.status(400).json({ message: "Geçersiz token veya şifre." });
  }

  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const [rows] = await pool.query(
      `SELECT id, user_id
       FROM password_reset_tokens
       WHERE token_hash = ?
         AND used_at IS NULL
         AND expires_at > NOW()
       LIMIT 1`,
      [tokenHash]
    );

    const resetRow = rows[0];
    if (!resetRow) {
      return res.status(400).json({ message: "Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [passwordHash, resetRow.user_id]);
    await pool.query("UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?", [resetRow.id]);
    await pool.query(
      "UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL",
      [resetRow.user_id]
    );

    return res.json({ message: "Şifreniz başarıyla yenilendi." });
  } catch (error) {
    return res.status(500).json({ message: "Şifre yenilenemedi.", error: error.message });
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
