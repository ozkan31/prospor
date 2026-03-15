import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Breadcrumb from "../components/Breadcrumb";
import ProductGridSection from "../components/ProductGridSection";
import RatingStars from "../components/RatingStars";
import Toast from "../components/Toast";
import { useStore } from "../context/StoreContext";
import { fetchProductById } from "../lib/api";
import { useSEO } from "../hooks/useSEO";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleFavorite, favorites, products, user } = useStore();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeImg, setActiveImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [toast, setToast] = useState("");
  const [addedToCart, setAddedToCart] = useState(false);
  const touchStartX = useRef(0);

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    const loadProduct = async () => {
      setLoading(true);
      setLoadError("");
      setActiveImg(0);
      setSelectedSize(null);
      setSelectedColor(null);

      try {
        const nextProduct = await fetchProductById(id, { signal: controller.signal });
        if (!ignore) {
          setProduct(nextProduct);
        }
      } catch (error) {
        if (!ignore && error.name !== "AbortError") {
          setProduct(null);
          setLoadError(error.message || "Urun alinamadi.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadProduct();
    return () => {
      ignore = true;
      controller.abort();
    };
  }, [id]);

  const similar = useMemo(
    () => products.filter((item) => item.id !== id && item.category.some((c) => product?.category.includes(c))).slice(0, 4),
    [id, product, products]
  );

  useSEO({
    title: product ? product.name : "Urun",
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

  if (loading) {
    return (
      <div className="container page-pad">
        <h1>Urun yukleniyor...</h1>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container page-pad">
        <h1>Urun bulunamadi</h1>
        {loadError && <p className="form-error">{loadError}</p>}
        <Link to="/urunler" className="primary-btn">Urunlere Don</Link>
      </div>
    );
  }

  const hasVariantSelection = Boolean(selectedSize && selectedColor);

  const addWithToast = async () => {
    if (!hasVariantSelection) {
      setToast("Lutfen renk ve numara secin");
      return false;
    }

    try {
      const added = await addToCart(product.id, 1, selectedSize, selectedColor);
      if (!added) {
        setToast("Urun sepete eklenemedi");
        return false;
      }

      setToast("Urun sepete eklendi");
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 1300);
      return true;
    } catch (error) {
      setToast(error.message || "Urun sepete eklenemedi");
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
      <Breadcrumb items={[{ label: "Anasayfa", to: "/" }, { label: "Urunler", to: "/urunler" }, { label: product.name }]} />

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
                <button type="button" className="pdp-image-nav prev" onClick={prevImage} aria-label="Onceki fotograf">{"\u2039"}</button>
                <button type="button" className="pdp-image-nav next" onClick={nextImage} aria-label="Sonraki fotograf">{"\u203A"}</button>
              </>
            )}
          </div>
          {product.gallery.length > 1 && (
            <div className="pdp-dots" aria-label="Urun gorselleri">
              {product.gallery.map((_, idx) => (
                <button
                  key={`dot-${idx}`}
                  type="button"
                  className={`pdp-dot ${idx === activeImg ? "active" : ""}`}
                  onClick={() => setActiveImg(idx)}
                  aria-label={`Fotograf ${idx + 1}`}
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
          <div className="rating-row"><RatingStars value={product.rating} /><span>{product.reviews} degerlendirme</span></div>

          <div className="price-row large">
            <strong>{product.price.toLocaleString("tr-TR")} TL</strong>
            {product.oldPrice && <span>{product.oldPrice.toLocaleString("tr-TR")} TL</span>}
          </div>
          <p className="stock">Stok: {product.stock > 0 ? "Mevcut" : "Tukendi"}</p>

          <div className="option-block">
            <h4>Renk</h4>
            <div className="option-row">
              {product.colors.map((color) => (
                <button key={color} className={selectedColor === color ? "active" : ""} onClick={() => setSelectedColor(color)}>{color}</button>
              ))}
            </div>
          </div>

          <div className="option-block">
            <h4>Numara</h4>
            <div className="option-row">
              {product.sizes.map((size) => (
                <button key={size} className={selectedSize === size ? "active" : ""} onClick={() => setSelectedSize(size)}>{size}</button>
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
                if (!ok) setToast("Favori icin giris yapin");
              }}
            >
              {favorites.includes(product.id) ? "\u2665" : "\u2661"}
            </button>
          </div>

          <div className="pdp-meta">
            <p><strong>Urun Aciklamasi:</strong> {product.description}</p>
            <p><strong>Teknik Ozellikler:</strong> {product.specs.join(", ")}</p>
            <p><strong>Kullanim Alani:</strong> {product.usage}</p>
            <p><strong>Kargo:</strong> {product.shipping}</p>
            <p><strong>Iade:</strong> {product.returns}</p>
            <p><strong>Taksit:</strong> Pesin fiyatina 3 taksit ve anlasmali bankalarda 6 taksit.</p>
          </div>
        </aside>
      </section>

      <ProductGridSection title="Benzer Urunler" products={similar} gridClassName="grid-2" />
      <ProductGridSection title="Birlikte Alinan Urunler" products={[...similar].reverse()} gridClassName="grid-2" />

      <Toast message={toast} />
    </div>
  );
}



