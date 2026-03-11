import { pool } from "../db.js";
import { products } from "../../src/data/products.js";

const seed = async () => {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    for (const p of products) {
      await conn.query(
        `INSERT INTO products (
          id, name, brand, price, old_price, rating, reviews, gender,
          category_json, colors_json, sizes_json, stock, image, gallery_json,
          description, specs_json, usage_text, shipping_text, returns_text
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          brand = VALUES(brand),
          price = VALUES(price),
          old_price = VALUES(old_price),
          rating = VALUES(rating),
          reviews = VALUES(reviews),
          gender = VALUES(gender),
          category_json = VALUES(category_json),
          colors_json = VALUES(colors_json),
          sizes_json = VALUES(sizes_json),
          stock = VALUES(stock),
          image = VALUES(image),
          gallery_json = VALUES(gallery_json),
          description = VALUES(description),
          specs_json = VALUES(specs_json),
          usage_text = VALUES(usage_text),
          shipping_text = VALUES(shipping_text),
          returns_text = VALUES(returns_text),
          updated_at = CURRENT_TIMESTAMP`,
        [
          p.id,
          p.name,
          p.brand,
          p.price,
          p.oldPrice  null,
          p.rating  0,
          p.reviews  0,
          p.gender,
          JSON.stringify(p.category || []),
          JSON.stringify(p.colors || []),
          JSON.stringify(p.sizes || []),
          p.stock  0,
          p.image || "",
          JSON.stringify(p.gallery || []),
          p.description || "",
          JSON.stringify(p.specs || []),
          p.usage || "",
          p.shipping || "",
          p.returns || ""
        ]
      );
    }

    await conn.commit();
    // eslint-disable-next-line no-console
    console.log(`Seed tamamlandı. Ürün sayısı: ${products.length}`);
  } catch (error) {
    await conn.rollback();
    // eslint-disable-next-line no-console
    console.error("Seed hatası:", error.message);
    process.exitCode = 1;
  } finally {
    conn.release();
    await pool.end();
  }
};

seed();
