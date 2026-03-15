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

export const createProductImageUrl = (productId, index = 0, size = "") => {`r`n  const query = size ? `?size=${encodeURIComponent(size)}` : "";`r`n  return `/api/products/${encodeURIComponent(productId)}/image/${index}${query}`;`r`n};

export const normalizeProductList = (row) => ({
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
  image: createProductImageUrl(row.id, 0, "card"),
  description: row.description,
  isNew: row.is_new !== undefined ? Boolean(row.is_new) : parseJsonArray(row.category_json).includes("new"),
  isBestseller: row.is_bestseller !== undefined ? Boolean(row.is_bestseller) : parseJsonArray(row.category_json).includes("best")
});

export const normalizeProduct = (row) => {
  const gallery = parseJsonArray(row.gallery_json);
  const resolvedGallery = gallery.length ? gallery : row.image ? [row.image] : [];

  return {
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
    image: createProductImageUrl(row.id, 0, "card"),
    gallery: resolvedGallery.map((_item, imageIndex) => createProductImageUrl(row.id, imageIndex)),
    description: row.description,
    specs: parseJsonArray(row.specs_json),
    usage: row.usage_text,
    shipping: row.shipping_text,
    returns: row.returns_text
  };
};

