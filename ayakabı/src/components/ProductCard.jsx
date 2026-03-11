import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import RatingStars from "./RatingStars";
import { useStore } from "../context/StoreContext";

export default function ProductCard({ product, onQuickView }) {
  const navigate = useNavigate();
  const { favorites, toggleFavorite, user, addToCart } = useStore();
  const [addedToCart, setAddedToCart] = useState(false);
  const isFav = favorites.includes(product.id);
  const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;

  return (
    <article
      className="product-card"
      onClick={() => navigate(`/urun/${product.id}`)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") navigate(`/urun/${product.id}`);
      }}
    >
      <Link to={`/urun/${product.id}`} className="product-image-wrap" aria-label={product.name}>
        <button
          className="icon-btn favorite-float-btn"
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!user?.email) {
              navigate("/giris-kayit");
              return;
            }
            await toggleFavorite(product.id);
          }}
          aria-label={isFav ? "Favorilerden çıkar" : "Favorilere ekle"}
        >
          {isFav ? "♥" : "♡"}
        </button>
        <img src={product.image} alt={product.name} loading="lazy" className="product-image" />
        {discount > 0 && <span className="badge">%{discount}</span>}
      </Link>

      <div className="product-content">
        <p className="brand">{product.brand}</p>
        <Link to={`/urun/${product.id}`} className="product-title">
          {product.name}
        </Link>
        <div className="rating-row">
          <RatingStars value={product.rating} />
          <span>{product.reviews}</span>
        </div>

        <p className="stock">{product.stock > 0 ? `Stokta (${product.stock})` : "Tükendi"}</p>

        <div className="price-row">
          <strong>{product.price.toLocaleString("tr-TR")} TL</strong>
          {product.oldPrice && <span>{product.oldPrice.toLocaleString("tr-TR")} TL</span>}
        </div>

        <div className="card-actions">
          <button
            className="secondary-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (onQuickView) onQuickView(product);
              else navigate(`/urun/${product.id}`);
            }}
          >
            Hızlı İncele
          </button>
          <button
            className={`primary-btn ${addedToCart ? "add-cart-success" : ""}`}
            onClick={async (e) => {
              e.stopPropagation();
              const defaultSize = product?.sizes?.[0];
              const defaultColor = product?.colors?.[0];
              if (!defaultSize || !defaultColor) {
                navigate(`/urun/${product.id}`);
                return;
              }
              const ok = await addToCart(product.id, 1, defaultSize, defaultColor);
              if (ok) {
                setAddedToCart(true);
                setTimeout(() => setAddedToCart(false), 1300);
              }
            }}
          >
            {addedToCart ? "Sepete Eklendi" : "Sepete Ekle"}
          </button>
        </div>
      </div>
    </article>
  );
}
