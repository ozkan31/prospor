import crypto from "node:crypto";
import express from "express";
import { pool } from "../db.js";
import { config } from "../config.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

const getClientIp = (req) => {
  const xfwd = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  if (xfwd) return xfwd;
  return req.socket?.remoteAddress || "127.0.0.1";
};

const toKurus = (amount) => Math.round(Number(amount || 0) * 100);

const mapBasket = (cartRows) =>
  cartRows.map((row) => [
    String(row.name || "Urun"),
    Number(row.price || 0).toFixed(2),
    Number(row.qty || 1)
  ]);

const ensurePaytrConfig = () => {
  const p = config.paytr;
  return Boolean(p.merchantId && p.merchantKey && p.merchantSalt && p.callbackUrl);
};

const generateMerchantOid = () => `PAYTR${Date.now()}${Math.floor(Math.random() * 1e6)}`;
const withOid = (url, merchantOid) => `${url}${url.includes("?") ? "&" : "?"}oid=${encodeURIComponent(merchantOid)}`;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const getPublicBaseUrl = (req) => {
  const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0].trim() || "https";
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "prospor07.com").split(",")[0].trim() || "prospor07.com";
  return `${proto}://${host}`;
};

const fetchPaytrTokenWithRetry = async (formBody) => {
  const maxAttempts = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const paytrRes = await fetch("https://www.paytr.com/odeme/api/get-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formBody,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const raw = await paytrRes.text();
      let json = {};
      try {
        json = raw ? JSON.parse(raw) : {};
      } catch {
        json = { status: "failed", reason: "invalid_json_response" };
      }

      if (!paytrRes.ok) {
        const err = new Error(`HTTP_${paytrRes.status}`);
        err.response = json;
        throw err;
      }

      return json;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;
      if (attempt < maxAttempts) {
        await wait(400 * attempt);
      }
    }
  }

  throw lastError || new Error("PAYTR_CONNECTION_ERROR");
};

router.post("/token", authRequired, async (req, res) => {
  if (!ensurePaytrConfig()) {
    return res.status(500).json({ message: "PAYTR yapilandirmasi eksik." });
  }

  const address = req.body.address || null;
  if (!address || typeof address !== "object") {
    return res.status(400).json({ message: "Teslimat adresi zorunlu." });
  }

  try {
    const [cartRows] = await pool.query(
      `SELECT c.qty, p.name, p.price
       FROM cart_items c
       INNER JOIN products p ON p.id = c.product_id
       WHERE c.user_id = ?`,
      [req.user.id]
    );

    if (!cartRows.length) {
      return res.status(400).json({ message: "Sepet bos." });
    }

    const subtotal = cartRows.reduce((sum, row) => sum + Number(row.price) * Number(row.qty), 0);
    const shipping = subtotal > 2999 ? 0 : 149;
    const total = subtotal + shipping;
    const paymentAmount = toKurus(total);
    const basket = mapBasket(cartRows);

    const p = config.paytr;
    const merchantOid = generateMerchantOid();
    const userName = `${address.firstName || ""} ${address.lastName || ""}`.trim() || req.user.email;
    const userAddress =
      `${address.cityName || ""} ${address.districtName || ""} ${address.neighborhoodName || ""} ${address.line || ""}`
        .trim()
        .slice(0, 250);
    const userPhone = String(address.phone || "").replace(/\D/g, "");
    const userBasket = Buffer.from(JSON.stringify(basket)).toString("base64");
    const userIp = getClientIp(req);
    const publicBaseUrl = getPublicBaseUrl(req);
    const okUrl = `${publicBaseUrl}/odeme?paytr=ok`;
    const failUrl = `${publicBaseUrl}/odeme?paytr=fail`;

    const hashStr = `${p.merchantId}${userIp}${merchantOid}${req.user.email}${paymentAmount}${userBasket}${p.noInstallment}${p.maxInstallment}${p.currency}${p.testMode}`;
    const paytrToken = crypto
      .createHmac("sha256", p.merchantKey)
      .update(`${hashStr}${p.merchantSalt}`)
      .digest("base64");

    const form = new URLSearchParams({
      merchant_id: p.merchantId,
      user_ip: userIp,
      merchant_oid: merchantOid,
      email: req.user.email,
      payment_amount: String(paymentAmount),
      paytr_token: paytrToken,
      user_basket: userBasket,
      debug_on: String(p.debugOn),
      no_installment: String(p.noInstallment),
      max_installment: String(p.maxInstallment),
      user_name: userName,
      user_address: userAddress,
      user_phone: userPhone,
      merchant_ok_url: withOid(okUrl, merchantOid),
      merchant_fail_url: withOid(failUrl, merchantOid),
      timeout_limit: String(p.timeoutLimit),
      currency: p.currency,
      test_mode: String(p.testMode),
      lang: p.lang
    });

    const paytrJson = await fetchPaytrTokenWithRetry(form.toString());
    if (paytrJson.status !== "success" || !paytrJson.token) {
      return res.status(400).json({
        message: "PAYTR token alinamadi.",
        error: paytrJson.reason || "unknown"
      });
    }

    await pool.query(
      `INSERT INTO paytr_transactions
       (merchant_oid, user_id, email, total_amount, payment_amount, status, address_json)
       VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
      [merchantOid, req.user.id, req.user.email, total, paymentAmount, JSON.stringify(address)]
    );

    return res.json({
      token: paytrJson.token,
      merchantOid,
      iframeUrl: `https://www.paytr.com/odeme/guvenli/${paytrJson.token}`
    });
  } catch (error) {
    const netCode = error?.cause?.code || error?.code || "";
    const detail = [error?.message, netCode].filter(Boolean).join(" | ");
    return res.status(500).json({ message: "PAYTR token islemi basarisiz.", error: detail || "network_error" });
  }
});

router.post("/callback", async (req, res) => {
  if (!ensurePaytrConfig()) {
    return res.status(500).send("PAYTR config error");
  }

  const { merchant_oid: merchantOid, status, total_amount: totalAmount, hash } = req.body || {};
  if (!merchantOid || !status || !totalAmount || !hash) {
    return res.status(400).send("bad_request");
  }

  const p = config.paytr;
  const calcHash = crypto
    .createHmac("sha256", p.merchantKey)
    .update(`${merchantOid}${p.merchantSalt}${status}${totalAmount}`)
    .digest("base64");

  if (calcHash !== hash) {
    return res.status(400).send("bad_hash");
  }

  try {
    if (status === "success") {
      await pool.query(
        `UPDATE paytr_transactions
         SET status = 'paid', paid_at = NOW(), callback_payload = ?, last_error = NULL
         WHERE merchant_oid = ?`,
        [JSON.stringify(req.body || {}), merchantOid]
      );
    } else {
      await pool.query(
        `UPDATE paytr_transactions
         SET status = 'failed', callback_payload = ?, last_error = ?
         WHERE merchant_oid = ?`,
        [JSON.stringify(req.body || {}), String(req.body.failed_reason_msg || req.body.failed_reason_code || "payment_failed"), merchantOid]
      );
    }

    return res.send("OK");
  } catch {
    return res.status(500).send("db_error");
  }
});

router.get("/status/:merchantOid", authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT merchant_oid, status, total_amount, payment_amount, paid_at, last_error
       FROM paytr_transactions
       WHERE merchant_oid = ? AND user_id = ?
       LIMIT 1`,
      [req.params.merchantOid, req.user.id]
    );

    const row = rows[0];
    if (!row) return res.status(404).json({ message: "Odeme kaydi bulunamadi." });

    return res.json({
      merchantOid: row.merchant_oid,
      status: row.status,
      totalAmount: Number(row.total_amount || 0),
      paymentAmount: Number(row.payment_amount || 0),
      paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : null,
      error: row.last_error || ""
    });
  } catch (error) {
    return res.status(500).json({ message: "Odeme durumu alinamadi.", error: error.message });
  }
});

export default router;
