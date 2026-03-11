import express from "express";
import cors from "cors";
import path from "node:path";
import { config } from "./config.js";
import { pool } from "./db.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import productRoutes from "./routes/products.js";
import cartRoutes from "./routes/cart.js";
import favoritesRoutes from "./routes/favorites.js";
import ordersRoutes from "./routes/orders.js";
import addressesRoutes from "./routes/addresses.js";
import adminRoutes from "./routes/admin.js";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/addresses", addressesRoutes);
app.use("/api/admin", adminRoutes);

app.use((_req, res) => {
  return res.status(404).json({ message: "Endpoint bulunamadı." });
});

const server = app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`API server running on http://localhost:${config.port}`);
});

server.on("error", (error) => {
  if (error?.code === "EADDRINUSE") {
    // eslint-disable-next-line no-console
    console.log(`API server already running on port ${config.port}, skipping duplicate start.`);
    process.exit(0);
  }

  // eslint-disable-next-line no-console
  console.error("Server start error:", error);
  process.exit(1);
});
