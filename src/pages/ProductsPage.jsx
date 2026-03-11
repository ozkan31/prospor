import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Breadcrumb from "../components/Breadcrumb";
import FilterSidebar from "../components/FilterSidebar";
import ProductCard from "../components/ProductCard";
import { EmptyState, LoadingSkeleton } from "../components/States";
import { useStore } from "../context/StoreContext";
import { useSEO } from "../hooks/useSEO";

const sorters = {
  pop: (a, b) => b.reviews - a.reviews,
  new: (a, b) => (b.category.includes("new") ? 1 : -1),
  pa: (a, b) => a.price - b.price,
  pd: (a, b) => b.price - a.price,
  best: (a, b) => (b.category.includes("best") ? 1 : -1),
  rating: (a, b) => b.rating - a.rating
};

const createInitialFilters = (prefilter) => ({
  brands: [],
  categories: prefilter ? [prefilter] : [],
  genders: [],
  colors: [],
  inStock: false,
  saleOnly: false
});

export function filterProducts(list, filters) {
  const selectedColors = filters.colors.filter((c) => c !== "Karışık");
  const wantsMixed = filters.colors.includes("Karışık");

  return list
    .filter((p) => (filters.brands.length ? filters.brands.includes(p.brand) : true))
    .filter((p) => (filters.categories.length ? filters.categories.some((c) => p.category.includes(c)) : true))
    .filter((p) => (filters.genders.length ? filters.genders.includes(p.gender) : true))
    .filter((p) => {
      if (!filters.colors.length) return true;
      const hasSelectedColor = selectedColors.length ? selectedColors.some((c) => p.colors.includes(c)) : false;
      const isMixed = wantsMixed ? p.colors.length > 1 : false;
      return hasSelectedColor || isMixed;
    })
    .filter((p) => (filters.inStock ? p.stock > 0 : true))
    .filter((p) => (filters.saleOnly ? p.oldPrice > p.price : true));
}

export default function ProductsPage({ prefilter, pageTitle = "Tüm Ürünler" }) {
  const navigate = useNavigate();
  const { user, products } = useStore();
  const [loading] = useState(false);
  const [sortBy, setSortBy] = useState("pop");
  const [showFilters, setShowFilters] = useState(false);

  const [appliedFilters, setAppliedFilters] = useState(createInitialFilters(prefilter));
  const [draftFilters, setDraftFilters] = useState(createInitialFilters(prefilter));

  useSEO({
    title: pageTitle,
    description: "Erkek, kadın, çocuk, koşu, günlük ve spor ayakkabı kategorilerinde premium modeller."
  });

  const filtered = useMemo(() => filterProducts(products, appliedFilters).sort(sorters[sortBy]), [appliedFilters, sortBy, products]);

  const activeFilterCount = useMemo(() => {
    return (
      draftFilters.brands.length +
      draftFilters.categories.length +
      draftFilters.genders.length +
      draftFilters.colors.length +
      (draftFilters.inStock ? 1 : 0) +
      (draftFilters.saleOnly ? 1 : 0)
    );
  }, [draftFilters]);

  const resetFilters = () => {
    const reset = createInitialFilters(prefilter);
    setDraftFilters(reset);
    setAppliedFilters(reset);
  };

  const applyFilters = () => {
    setAppliedFilters(draftFilters);
    setShowFilters(false);
    localStorage.setItem("prospor_home_filters", JSON.stringify(draftFilters));
    navigate("/");
  };

  return (
    <div className="container page-pad">
      <Breadcrumb items={[{ label: "Anasayfa", to: "/" }, { label: pageTitle }]} />

      <section className="plp-hero">
        <div>
          <p className="eyebrow">YENİ VE POPÜLER</p>
          <h1>{pageTitle}</h1>
          <p>Performans, stil ve konforu bir araya getiren premium ayakkabı seçimi.</p>
        </div>
        {!user?.email ? (
          <Link to="/giris-kayit" className="secondary-btn">Üye Olarak Alışveriş Yap</Link>
        ) : (
          <Link to="/hesabim" className="secondary-btn">Hesabım</Link>
        )}
      </section>

      <div className="page-title-row">
        <p><strong>{filtered.length}</strong> ürün bulundu</p>
        <div className="plp-controls">
          <button className="secondary-btn filter-toggle" onClick={() => setShowFilters((s) => !s)}>
            Filtreler {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}
          </button>
          <button className="link-btn" onClick={resetFilters}>Filtreleri Temizle</button>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="pop">En popüler</option>
            <option value="new">En yeni</option>
            <option value="pa">Fiyat artan</option>
            <option value="pd">Fiyat azalan</option>
            <option value="best">En çok satan</option>
            <option value="rating">En yüksek puan</option>
          </select>
        </div>
      </div>

      <div className="catalog-layout nike-catalog">
        <div className={`plp-sidebar ${showFilters ? "open" : ""}`}>
          <FilterSidebar filters={draftFilters} setFilters={setDraftFilters} onApply={applyFilters} onReset={resetFilters} />
        </div>

        <section>
          {loading && <LoadingSkeleton />}
          {!loading && filtered.length === 0 && (
            <EmptyState title="Ürün bulunamadı" text="Filtreleri gevşeterek daha fazla ürün görebilirsiniz." />
          )}
          <div className="product-grid nike-product-grid">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
