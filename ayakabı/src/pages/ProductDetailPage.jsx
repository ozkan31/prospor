import { useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Breadcrumb from "../components/Breadcrumb";
import ProductGridSection from "../components/ProductGridSection";
import RatingStars from "../components/RatingStars";
import Toast from "../components/Toast";
import { useStore } from "../context/StoreContext";
import { useSEO } from "../hooks/useSEO";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleFavorite, favorites, products, user } = useStore();
  const [activeImg, setActiveImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [toast, setToast] = useState("");
  const [addedToCart, setAddedToCart] = useState(false);
  const touchStartX = useRef(0);

  const product = products.find((p) => p.id === id);
  const similar = useMemo(
    () => products.filter((p) => p.id !== id && p.category.some((c) => product?.category.includes(c))).slice(0, 4),
    [id, product, products]
  );

  useSEO({
    title: product ? product.name : "Ürün",
    description: product?.description,
    schema: product
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          brand: { "@type": "Brand", name: product.brand },
          offers: { "@type": "Offer", priceCurrency: "TRY", price: product.price, availability: "https://schema.org/InStock" }
        }
      : undefined
  });

  if (!product) {
    return (
      <div className="container page-pad">
        <h1>Ürün bulunamadı</h1>
        <Link to="/urunler" className="primary-btn">Ürünlere Dön</Link>
      </div>
    );
  }

  const hasVariantSelection = Boolean(selectedSize && selectedColor);

  const addWithToast = async () => {
    if (!hasVariantSelection) {
      setToast("Lütfen renk ve numara seçin");
      return false;
    }

    try {
      const added = await addToCart(product.id, 1, selectedSize, selectedColor);
      if (!added) {
        setToast("Ürün sepete eklenemedi");
        return false;
      }

      setToast("Ürün sepete eklendi");
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 1300);
      return true;
    } catch (error) {
      setToast(error.message || "Ürün sepete eklenemedi");
      return false;
    }
  };

  const buyNow = async () => {
    if (await addWithToast()) {
      navigate("/odeme");
    }
  };

  const prevImage = () => {
    setActiveImg((prev) => (prev === 0 ? product.gallery.length - 1 : prev - 1));
  };

  const nextImage = () => {
    setActiveImg((prev) => (prev === product.gallery.length - 1 ? 0 : prev + 1));
  };

  const onTouchStartImage = (event) => {
    touchStartX.current = event.changedTouches[0]?.clientX || 0;
  };

  const onTouchEndImage = (event) => {
    const endX = event.changedTouches[0]?.clientX || 0;
    const diff = endX - touchStartX.current;
    if (Math.abs(diff) < 40) return;
    if (diff > 0) prevImage();
    else nextImage();
  };

  return (
    <div className="container page-pad">
      <Breadcrumb items={[{ label: "Anasayfa", to: "/" }, { label: "Ürünler", to: "/urunler" }, { label: product.name }]} />

      <section className="pdp-layout">
        <div className="pdp-media">
          <div className="pdp-main-image-wrap">
            <img
              src={product.gallery[activeImg]}
              alt={product.name}
              className="pdp-main-image"
              onTouchStart={onTouchStartImage}
              onTouchEnd={onTouchEndImage}
            />
            {product.gallery.length > 1 && (
              <>
                <button type="button" className="pdp-image-nav prev" onClick={prevImage} aria-label="Önceki fotoğraf">‹</button>
                <button type="button" className="pdp-image-nav next" onClick={nextImage} aria-label="Sonraki fotoğraf">›</button>
              </>
            )}
          </div>
          {product.gallery.length > 1 && (
            <div className="pdp-dots" aria-label="Ürün görselleri">
              {product.gallery.map((_, idx) => (
                <button
                  key={`dot-${idx}`}
                  type="button"
                  className={`pdp-dot ${idx === activeImg ? "active" : ""}`}
                  onClick={() => setActiveImg(idx)}
                  aria-label={`Fotoğraf ${idx + 1}`}
                />
              ))}
            </div>
          )}
          <div className="pdp-thumb-row">
            {product.gallery.map((img, idx) => (
              <button key={img} className={idx === activeImg ? "active" : ""} onClick={() => setActiveImg(idx)}>
                <img src={img} alt={`${product.name} ${idx + 1}`} loading="lazy" />
              </button>
            ))}
          </div>
        </div>

        <aside className="pdp-buybox">
          <p className="brand">{product.brand}</p>
          <h1>{product.name}</h1>
          <div className="rating-row"><RatingStars value={product.rating} /><span>{product.reviews} değerlendirme</span></div>

          <div className="price-row large">
            <strong>{product.price.toLocaleString("tr-TR")} TL</strong>
            {product.oldPrice && <span>{product.oldPrice.toLocaleString("tr-TR")} TL</span>}
          </div>
          <p className="stock">Stok: {product.stock > 0 ? "Mevcut" : "Tükendi"}</p>

          <div className="option-block">
            <h4>Renk</h4>
            <div className="option-row">
              {product.colors.map((c) => (
                <button key={c} className={selectedColor === c ? "active" : ""} onClick={() => setSelectedColor(c)}>{c}</button>
              ))}
            </div>
          </div>

          <div className="option-block">
            <h4>Numara</h4>
            <div className="option-row">
              {product.sizes.map((s) => (
                <button key={s} className={selectedSize === s ? "active" : ""} onClick={() => setSelectedSize(s)}>{s}</button>
              ))}
            </div>
          </div>

          <div className="detail-actions pdp-actions">
            <button className={`primary-btn ${addedToCart ? "add-cart-success" : ""}`} onClick={addWithToast}>
              {addedToCart ? "Sepete Eklendi" : "Sepete Ekle"}
            </button>
            <button className="secondary-btn" onClick={buyNow}>Hemen Al</button>
            <button
              className="icon-btn"
              onClick={async () => {
                if (!user?.email) {
                  navigate("/giris-kayit");
                  return;
                }
                const ok = await toggleFavorite(product.id);
                if (!ok) setToast("Favori için giriş yapın");
              }}
            >
              {favorites.includes(product.id) ? "♥" : "♡"}
            </button>
          </div>

          <div className="pdp-meta">
            <p><strong>Ürün Açıklaması:</strong> {product.description}</p>
            <p><strong>Teknik Özellikler:</strong> {product.specs.join(", ")}</p>
            <p><strong>Kullanım Alanı:</strong> {product.usage}</p>
            <p><strong>Kargo:</strong> {product.shipping}</p>
            <p><strong>İade:</strong> {product.returns}</p>
            <p><strong>Taksit:</strong> Peşin fiyatına 3 taksit ve anlaşmalı bankalarda 6 taksit.</p>
          </div>
        </aside>
      </section>

      <ProductGridSection title="Benzer Ürünler" products={similar} gridClassName="grid-2" />
      <ProductGridSection title="Birlikte Alınan Ürünler" products={[...similar].reverse()} gridClassName="grid-2" />

      <Toast message={toast} />
    </div>
  );
}
