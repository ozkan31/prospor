export const parseJsonArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const normalizeProduct = (row) => ({
  id: row.id,
  name: row.name,
  brand: row.brand,
  price: Number(row.price),
  oldPrice: row.old_price !== null ? Number(row.old_price) : null,
  rating: Number(row.rating),
  reviews: Number(row.reviews),
  gender: row.gender,
  category: parseJsonArray(row.category_json),
  colors: parseJsonArray(row.colors_json),
  sizes: parseJsonArray(row.sizes_json),
  stock: Number(row.stock),
  image: row.image,
  gallery: parseJsonArray(row.gallery_json),
  description: row.description,
  specs: parseJsonArray(row.specs_json),
  usage: row.usage_text,
  shipping: row.shipping_text,
  returns: row.returns_text
});
