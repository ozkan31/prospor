import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import ProductGridSection from "../components/ProductGridSection";
import { brands } from "../data/products";
import { useStore } from "../context/StoreContext";
import { fetchProducts } from "../lib/api";
import { useSEO } from "../hooks/useSEO";

const filterProducts = (list, filters) => {
  if (!filters) return [];
  const selectedColors = (filters.colors || []).filter((color) => color !== "Kar\u0131\u015f\u0131k");
  const wantsMixed = (filters.colors || []).includes("Kar\u0131\u015f\u0131k");

  return list
    .filter((product) => product.price <= (filters.maxPrice || 9000))
    .filter((product) => ((filters.brands || []).length ? filters.brands.includes(product.brand) : true))
    .filter((product) => ((filters.categories || []).length ? filters.categories.some((category) => product.category.includes(category)) : true))
    .filter((product) => ((filters.genders || []).length ? filters.genders.includes(product.gender) : true))
    .filter((product) => {
      if (!(filters.colors || []).length) return true;
      const hasSelectedColor = selectedColors.length ? selectedColors.some((color) => product.colors.includes(color)) : false;
      const isMixed = wantsMixed ? product.colors.length > 1 : false;
      return hasSelectedColor || isMixed;
    })
    .filter((product) => ((filters.sizes || []).length ? filters.sizes.some((size) => product.sizes.includes(size)) : true))
    .filter((product) => (filters.inStock ? product.stock > 0 : true))
    .filter((product) => (filters.saleOnly ? product.oldPrice > product.price : true));
};

function DeferredSection({ minHeight = 420, children }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (visible) return undefined;

    const target = ref.current;
    if (!target) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px 0px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div ref={ref} style={visible ? undefined : { minHeight }}>
      {visible ? children : null}
    </div>
  );
}

export default function HomePage() {
  const { user } = useStore();
  const [homeProducts, setHomeProducts] = useState([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [homeLoading, setHomeLoading] = useState(true);
  const [homeFilters, setHomeFilters] = useState(() => {
    try {
      const raw = localStorage.getItem("prospor_home_filters");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useSEO({
    title: "Yeni ve Populer Spor Ayakkabilar",
    description: "ProSpor: premium spor ayakkabi deneyimi. Yeni sezon, populer modeller, performans koleksiyonlari."
  });

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    const loadHomeProducts = async () => {
      try {
        const list = await fetchProducts({ limit: 24, signal: controller.signal });
        if (!ignore) {
          setHomeProducts(list);
        }
      } catch {
        if (!ignore) {
          setHomeProducts([]);
        }
      } finally {
        if (!ignore) {
          setHomeLoading(false);
        }
      }
    };

    loadHomeProducts();
    return () => {
      ignore = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!homeProducts.length) {
      setVisibleCount(0);
      return undefined;
    }

    setVisibleCount(1);
    const intervalId = window.setInterval(() => {
      setVisibleCount((current) => {
        if (current >= homeProducts.length) {
          window.clearInterval(intervalId);
          return current;
        }
        return current + 1;
      });
    }, 90);

    return () => window.clearInterval(intervalId);
  }, [homeProducts]);

  const visibleProducts = useMemo(() => homeProducts.slice(0, visibleCount), [homeProducts, visibleCount]);
  const popular = useMemo(() => [...visibleProducts].sort((a, b) => b.reviews - a.reviews).slice(0, 4), [visibleProducts]);
  const newest = useMemo(() => {
    const list = visibleProducts.filter((product) => product.category.includes("new"));
    return (list.length ? list : visibleProducts).slice(0, 4);
  }, [visibleProducts]);
  const running = useMemo(() => {
    const list = visibleProducts.filter((product) => product.category.includes("running") || product.category.includes("sport"));
    return (list.length ? list : visibleProducts).slice(0, 4);
  }, [visibleProducts]);
  const topTickerProducts = useMemo(() => visibleProducts.slice(0, 4), [visibleProducts]);
  const filteredFromHome = useMemo(() => filterProducts(visibleProducts, homeFilters).slice(0, 8), [homeFilters, visibleProducts]);

  return (
    <div>
      <section className="nike-hero">
        <div className="hero-product-bg" aria-label="One cikan urunler">
          <div className="hero-product-bg-lane">
            <div className="hero-product-bg-track">
              {[...topTickerProducts, ...topTickerProducts].map((product, idx) => (
                <Link key={`${product.id}-bg-${idx}`} to={`/urun/${product.id}`} className="hero-product-bg-item">
                  <img src={product.image} alt="" loading="lazy" decoding="async" fetchPriority="low" />
                  <div>
                    <p>{product.name}</p>
                    <strong>{product.price.toLocaleString("tr-TR")} TL</strong>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="nike-hero-content container">
          <h1>Daha iyi hareket et. Daha guclu gorun.</h1>
          <p>Performans odakli sneaker koleksiyonu. Kosu, antrenman ve gunluk stil tek noktada.</p>
          <div className="hero-actions">
            <Link to={user?.email ? "/urunler" : "/giris-kayit"} className="primary-btn">Alisverise Basla</Link>
            <Link to="/kategori/yeni-gelenler" className="secondary-btn">Yeni Gelenler</Link>
          </div>
        </div>
      </section>

      {homeFilters && (
        <section className="section-block container">
          <div className="section-head">
            <h2>Sectigin Filtreye Gore Urunler</h2>
            <button
              className="link-btn"
              onClick={() => {
                localStorage.removeItem("prospor_home_filters");
                setHomeFilters(null);
              }}
            >
              Filtreyi Kaldir
            </button>
          </div>
          {filteredFromHome.length ? (
            <div className="product-grid home-product-grid">
              {filteredFromHome.map((product, idx) => (
                <ProductCard key={product.id} product={product} priority={idx < 4} />
              ))}
            </div>
          ) : (
            <p className="muted">Secilen filtreye uygun urun bulunamadi.</p>
          )}
        </section>
      )}

      {homeLoading && (
        <section className="section-block container">
          <p className="muted">Urunler hizli liste akisi ile yukleniyor...</p>
        </section>
      )}

      <DeferredSection minHeight={640}>
        <ProductGridSection title="En Populer" subtitle="Topluluk tarafindan en cok tercih edilen modeller" products={popular} gridClassName="home-product-grid" priorityCount={4} />
      </DeferredSection>

      <DeferredSection minHeight={540}>
        <section className="container campaign-split">
          <article>
            <img src="https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=1400&auto=format&fit=crop" alt="Kosu" loading="lazy" decoding="async" fetchPriority="low" />
            <div>
              <p className="eyebrow">KOSU KOLEKSIYONU</p>
              <h2>Her adimda daha fazla enerji geri donusu</h2>
              <Link to="/kategori/kosu-ayakkabisi" className="primary-btn">Kosu Modelleri</Link>
            </div>
          </article>
          <article>
            <img src="https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=1400&auto=format&fit=crop" alt="Sport" loading="lazy" decoding="async" fetchPriority="low" />
            <div>
              <p className="eyebrow">SPORT STYLE</p>
              <h2>Sokak stilini performansla birlestir</h2>
              <Link to="/kategori/spor-ayakkabi" className="primary-btn">Spor Ayakkabilar</Link>
            </div>
          </article>
        </section>
      </DeferredSection>

      <DeferredSection minHeight={640}>
        <ProductGridSection title="Yeni Gelenler" subtitle="Bu haftanin yeni eklenen modelleri" products={newest} gridClassName="home-product-grid" priorityCount={0} />
      </DeferredSection>
      <DeferredSection minHeight={640}>
        <ProductGridSection title="Kosu ve Antrenman" subtitle="Yuksek performans serisi" products={running} gridClassName="home-product-grid" priorityCount={0} />
      </DeferredSection>

      <DeferredSection minHeight={300}>
        <section className="section-block container">
          <div className="section-head"><h2>Markalar</h2></div>
          <div className="brand-grid">
            {brands.map((brand) => <div key={brand} className="brand-card">{brand}</div>)}
          </div>
        </section>
      </DeferredSection>

      <DeferredSection minHeight={220}>
        <section className="pro-banner">
          <div className="container pro-banner-inner">
            <h2>ProSpor Membership</h2>
            <p>Uyelere ozel erken erisim, ekstra indirim ve yeni koleksiyon bildirimleri.</p>
            <Link to="/giris-kayit" className="secondary-btn">Uye Ol</Link>
          </div>
        </section>
      </DeferredSection>
    </div>
  );
}

