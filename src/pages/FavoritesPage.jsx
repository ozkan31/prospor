import { Link } from "react-router-dom";
import Breadcrumb from "../components/Breadcrumb";
import { EmptyState } from "../components/States";
import { useStore } from "../context/StoreContext";
import { useSEO } from "../hooks/useSEO";

export default function FavoritesPage() {
  const { favorites, toggleFavorite, products, user } = useStore();

  useSEO({ title: "Favoriler", description: "Beğendiğiniz ürünler tek ekranda." });

  const list = products.filter((p) => favorites.includes(p.id));

  return (
    <div className="container page-pad">
      <Breadcrumb items={[{ label: "Anasayfa", to: "/" }, { label: "Favoriler" }]} />
      <h1>Favorilerim</h1>

      {!user?.email ? (
        <EmptyState title="Favoriler için giriş yapın" text="Favori listenizi hesabınıza kaydetmek için oturum açın." />
      ) : list.length === 0 ? (
        <EmptyState title="Henüz favori ürün yok" text="Ürünleri kalp ikonuyla favorilerine ekleyebilirsin." />
      ) : (
        <section className="favorites-list" aria-label="Favori ürünler">
          {list.map((p) => (
            <article key={p.id} className="favorite-item">
              <Link to={`/urun/${p.id}`} className="favorite-thumb" aria-label={p.name}>
                <img src={p.image} alt={p.name} loading="lazy" />
              </Link>

              <div className="favorite-main">
                <p className="favorite-brand">{p.brand}</p>
                <Link to={`/urun/${p.id}`} className="favorite-title">{p.name}</Link>
                <p className="favorite-meta">{p.gender} • {p.category[0]}</p>
              </div>

              <div className="favorite-side">
                <strong>{p.price.toLocaleString("tr-TR")} TL</strong>
                <div className="favorite-actions">
                  <Link to={`/urun/${p.id}`} className="secondary-btn">Ürüne Git</Link>
                  <button className="link-btn" onClick={() => toggleFavorite(p.id)}>Kaldır</button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
