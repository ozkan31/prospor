import dotenv from "dotenv";

dotenv.config();

const toBool = (value, fallback = false) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return fallback;
  return ["1", "true", "yes", "on", "ssl", "tls", "ssl/tls"].includes(normalized);
};

export const config = {
  port: Number(process.env.SERVER_PORT || 3001),
  jwtSecret: process.env.JWT_SECRET || "change-this-secret",
  googleClientId: String(process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || "").trim(),
  googleClientIds: String(
    process.env.GOOGLE_CLIENT_IDS ||
      [process.env.GOOGLE_CLIENT_ID, process.env.VITE_GOOGLE_CLIENT_ID].filter(Boolean).join(",")
  )
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean),
  resetPasswordUrl: String(process.env.RESET_PASSWORD_URL || "https://prospor07.com/giris-kayit").trim(),
  resetTokenTtlMinutes: Number(process.env.RESET_TOKEN_TTL_MINUTES || 30),
  smtp: {
    host: String(process.env.SMTP_HOST || "").trim(),
    port: Number(process.env.SMTP_PORT || 587),
    secure: toBool(process.env.SMTP_SECURE, false),
    user: String(process.env.SMTP_USER || "").trim(),
    pass: String(process.env.SMTP_PASS || ""),
    fromName: String(process.env.SMTP_FROM_NAME || "ProSpor").trim(),
    fromEmail: String(process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "").trim()
  },
  paytr: {
    merchantId: String(process.env.PAYTR_MERCHANT_ID || "").trim(),
    merchantKey: String(process.env.PAYTR_MERCHANT_KEY || "").trim(),
    merchantSalt: String(process.env.PAYTR_MERCHANT_SALT || "").trim(),
    testMode: Number(process.env.PAYTR_TEST_MODE || 1),
    debugOn: Number(process.env.PAYTR_DEBUG_ON || 1),
    noInstallment: Number(process.env.PAYTR_NO_INSTALLMENT || 0),
    maxInstallment: Number(process.env.PAYTR_MAX_INSTALLMENT || 0),
    timeoutLimit: Number(process.env.PAYTR_TIMEOUT_LIMIT || 30),
    currency: String(process.env.PAYTR_CURRENCY || "TL").trim(),
    lang: String(process.env.PAYTR_LANG || "tr").trim(),
    callbackUrl: String(process.env.PAYTR_CALLBACK_URL || "").trim(),
    okUrl: String(process.env.PAYTR_OK_URL || "https://prospor07.com/odeme?paytr=ok").trim(),
    failUrl: String(process.env.PAYTR_FAIL_URL || "https://prospor07.com/odeme?paytr=fail").trim()
  },
  adminEmail: String(process.env.ADMIN_EMAIL || "").trim().toLowerCase(),
  adminPassword: String(process.env.ADMIN_PASSWORD || ""),
  db: {
    host: process.env.DB_HOST || process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306),
    user: process.env.DB_USER || process.env.MYSQL_USER || "root",
    password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || "",
    database: process.env.DB_NAME || process.env.MYSQL_DATABASE || "prospor",
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10)
  }
};
