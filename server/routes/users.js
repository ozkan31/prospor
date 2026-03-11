import express from "express";
import { pool } from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.patch("/me", authRequired, async (req, res) => {
  const firstName = String(req.body.firstName || "").trim();
  const lastName = String(req.body.lastName || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const phone = String(req.body.phone || "").trim();

  if (!firstName || !lastName || !email) {
    return res.status(400).json({ message: "Ad, soyad ve e-posta zorunludur." });
  }

  try {
    const [emailOwner] = await pool.query("SELECT id FROM users WHERE email =  AND id <>  LIMIT 1", [email, req.user.id]);
    if (emailOwner.length) {
      return res.status(409).json({ message: "Bu e-posta başka bir kullanıcıya ait." });
    }

    await pool.query(
      `UPDATE users
       SET first_name = ?, last_name = ?, email = ?, phone = ?
       WHERE id = ?`,
      [firstName, lastName, email, phone || null, req.user.id]
    );

    return res.json({
      user: {
        id: req.user.id,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        email,
        phone
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Profil güncellenemedi.", error: error.message });
  }
});

export default router;
