import express from "express";
import { pool } from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.use(authRequired);

const mapAddressRow = (row) => {
  if (!row) return null;

  return {
    firstName: row.first_name || "",
    lastName: row.last_name || "",
    phone: row.phone || "",
    cityId: row.city_id || "",
    cityName: row.city_name || "",
    districtId: row.district_id || "",
    districtName: row.district_name || "",
    neighborhoodId: row.neighborhood_id || "",
    neighborhoodName: row.neighborhood_name || "",
    line: row.address_line || "",
    title: row.title || ""
  };
};

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT address_type, first_name, last_name, phone, city_id, city_name, district_id,
              district_name, neighborhood_id, neighborhood_name, address_line, title
       FROM user_addresses
       WHERE user_id = ?`,
      [req.user.id]
    );

    const result = { home: null, secondary: null };
    for (const row of rows) {
      result[row.address_type] = mapAddressRow(row);
    }

    return res.json({ addresses: result });
  } catch (error) {
    return res.status(500).json({ message: "Adresler alınamadı.", error: error.message });
  }
});

router.put("/:type", async (req, res) => {
  const type = req.params.type;
  if (!["home", "secondary"].includes(type)) {
    return res.status(400).json({ message: "Adres tipi geçersiz." });
  }

  const payload = {
    firstName: String(req.body.firstName || "").trim(),
    lastName: String(req.body.lastName || "").trim(),
    phone: String(req.body.phone || "").trim(),
    cityId: String(req.body.cityId || "").trim(),
    cityName: String(req.body.cityName || "").trim(),
    districtId: String(req.body.districtId || "").trim(),
    districtName: String(req.body.districtName || "").trim(),
    neighborhoodId: String(req.body.neighborhoodId || "").trim(),
    neighborhoodName: String(req.body.neighborhoodName || "").trim(),
    line: String(req.body.line || "").trim(),
    title: String(req.body.title || "").trim()
  };

  if (!payload.firstName || !payload.lastName || !payload.phone || !payload.cityId || !payload.districtId || !payload.neighborhoodId || !payload.line || !payload.title) {
    return res.status(400).json({ message: "Adres alanları eksik." });
  }

  try {
    await pool.query(
      `INSERT INTO user_addresses (
         user_id, address_type, first_name, last_name, phone, city_id, city_name,
         district_id, district_name, neighborhood_id, neighborhood_name, address_line, title
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         first_name = VALUES(first_name),
         last_name = VALUES(last_name),
         phone = VALUES(phone),
         city_id = VALUES(city_id),
         city_name = VALUES(city_name),
         district_id = VALUES(district_id),
         district_name = VALUES(district_name),
         neighborhood_id = VALUES(neighborhood_id),
         neighborhood_name = VALUES(neighborhood_name),
         address_line = VALUES(address_line),
         title = VALUES(title),
         updated_at = CURRENT_TIMESTAMP`,
      [
        req.user.id,
        type,
        payload.firstName,
        payload.lastName,
        payload.phone,
        payload.cityId,
        payload.cityName,
        payload.districtId,
        payload.districtName,
        payload.neighborhoodId,
        payload.neighborhoodName,
        payload.line,
        payload.title
      ]
    );

    return res.json({ address: payload });
  } catch (error) {
    return res.status(500).json({ message: "Adres kaydedilemedi.", error: error.message });
  }
});

export default router;
