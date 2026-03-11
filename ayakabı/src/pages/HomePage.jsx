import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import ProductGridSection from "../components/ProductGridSection";
import { brands } from "../data/products";
import { useStore } from "../context/StoreContext";
import { useSEO } from "../hooks/useSEO";

const filterProducts = (list, filters) => {
  if (!filters) return [];
  const selectedColors = (filters.colors || []).filter((c) => c !== "Karışık");
  const wantsMixed = (filters.colors || []).includes("Karışık");

  return list
    .filter((p) => p.price <= (filters.maxPrice || 9000))
    .filter((p) => ((filters.brands || []).length ? filters.brands.includes(p.brand) : true))
    .filter((p) => ((filters.categories || []).length ? filters.categories.some((c) => p.category.includes(c)) : true))
    .filter((p) => ((filters.genders || []).length ? filters.genders.includes(p.gender) : true))
    .filter((p) => {
      if (!(filters.colors || []).length) return true;
      const hasSelectedColor = selectedColors.length ? selectedColors.some((c) => p.colors.includes(c)) : false;
      const isMixed = wantsMixed ? p.colors.length > 1 : false;
      return hasSelectedColor || isMixed;
    })
    .filter((p) => ((filters.sizes || []).length ? filters.sizes.some((s) => p.sizes.includes(s)) : true))
    .filter((p) => (filters.inStock ? p.stock > 0 : true))
    .filter((p) => (filters.saleOnly ? p.oldPrice > p.price : true));
};

export default function HomePage() {
  const { products, user } = useStore();
  const [homeFilters, setHomeFilters] = useState(() => {
    try {
      const raw = localStorage.getItem("prospor_home_filters");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useSEO({
    title: "Yeni ve Popüler Spor Ayakkabılar",
    description: "ProSpor: premium spor ayakkabı deneyimi. Yeni sezon, popüler modeller, performans koleksiyonları."
  });

  const popular = [...products].sort((a, b) => b.reviews - a.reviews).slice(0, 4);
  const newest = products.filter((p) => p.category.includes("new")).slice(0, 4);
  const running = products.filter((p) => p.category.includes("running") || p.category.includes("sport")).slice(0, 4);
  const topTickerProducts = products.slice(0, 8);
  const filteredFromHome = useMemo(() => filterProducts(products, homeFilters).slice(0, 8), [homeFilters, products]);

  return (
    <div>
      <section className="nike-hero">
        <div className="hero-product-bg" aria-label="Öne çıkan ürünler">
          <div className="hero-product-bg-lane">
            <div className="hero-product-bg-track">
              {[...topTickerProducts, ...topTickerProducts, ...topTickerProducts].map((p, idx) => (
                <Link key={`${p.id}-bg-${idx}`} to={`/urun/${p.id}`} className="hero-product-bg-item">
                  <img src={p.image} alt="" loading="lazy" />
                  <div>
                    <p>{p.name}</p>
                    <strong>{p.price.toLocaleString("tr-TR")} TL</strong>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="nike-hero-content container">
          <h1>Daha iyi hareket et. Daha güçlü görün.</h1>
          <p>Performans odaklı sneaker koleksiyonu. Koşu, antrenman ve günlük stil tek noktada.</p>
          <div className="hero-actions">
            <Link to={user?.email ? "/urunler" : "/giris-kayit"} className="primary-btn">Alışverişe Başla</Link>
            <Link to="/kategori/yeni-gelenler" className="secondary-btn">Yeni Gelenler</Link>
          </div>
        </div>
      </section>

      {homeFilters && (
        <section className="section-block container">
          <div className="section-head">
            <h2>Seçtiğin Filtreye Göre Ürünler</h2>
            <button
              className="link-btn"
              onClick={() => {
                localStorage.removeItem("prospor_home_filters");
                setHomeFilters(null);
              }}
            >
              Filtreyi Kaldır
            </button>
          </div>
          {filteredFromHome.length ? (
            <div className="product-grid">
              {filteredFromHome.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <p className="muted">Seçilen filtreye uygun ürün bulunamadı.</p>
          )}
        </section>
      )}

      <ProductGridSection title="En Popüler" subtitle="Topluluk tarafından en çok tercih edilen modeller" products={popular} />

      <section className="container campaign-split">
        <article>
          <img src="https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=1400&auto=format&fit=crop" alt="Koşu" />
          <div>
            <p className="eyebrow">KOŞU KOLEKSİYONU</p>
            <h2>Her adımda daha fazla enerji geri dönüşü</h2>
            <Link to="/kategori/kosu-ayakkabisi" className="primary-btn">Koşu Modelleri</Link>
          </div>
        </article>
        <article>
          <img src="https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=1400&auto=format&fit=crop" alt="Sport" />
          <div>
            <p className="eyebrow">SPORT STYLE</p>
            <h2>Sokak stilini performansla birleştir</h2>
            <Link to="/kategori/spor-ayakkabi" className="primary-btn">Spor Ayakkabılar</Link>
          </div>
        </article>
      </section>

      <ProductGridSection title="Yeni Gelenler" subtitle="Bu haftanın yeni eklenen modelleri" products={newest} />
      <ProductGridSection title="Koşu ve Antrenman" subtitle="Yüksek performans serisi" products={running} />

      <section className="section-block container">
        <div className="section-head"><h2>Markalar</h2></div>
        <div className="brand-grid">
          {brands.map((brand) => <div key={brand} className="brand-card">{brand}</div>)}
        </div>
      </section>

      <section className="pro-banner">
        <div className="container pro-banner-inner">
          <h2>ProSpor Membership</h2>
          <p>Üyelere özel erken erişim, ekstra indirim ve yeni koleksiyon bildirimleri.</p>
          <Link to="/giris-kayit" className="secondary-btn">Üye Ol</Link>
        </div>
      </section>
    </div>
  );
}
