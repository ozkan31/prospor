import { useRef } from "react";
import { brands, categories } from "../data/products";

export default function FilterSidebar({ filters, setFilters, onApply, onReset }) {
  const applyRef = useRef(null);
  const sectionRefs = useRef({});
  const order = ["maxPrice", "brands", "categories", "genders", "colors", "sizes", "inStock", "saleOnly"];

  const scrollToNext = (field) => {
    const idx = order.indexOf(field);
    if (idx < 0) return;
    const nextField = order[idx + 1];
    const nextRef = sectionRefs.current[nextField];
    if (nextRef) {
      nextRef.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    applyRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  const updateFilters = (updater, fieldForScroll) => {
    setFilters(updater);
    if (fieldForScroll) {
      setTimeout(() => scrollToNext(fieldForScroll), 80);
    }
  };

  const onToggle = (field, value) => {
    updateFilters((prev) => {
      const list = prev[field];
      return {
        ...prev,
        [field]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
      };
    }, field);
  };

  return (
    <aside className="filter-sidebar">
      <h3>Filtreler</h3>

      <div className="filter-group" ref={(el) => { sectionRefs.current.maxPrice = el; }}>
        <h4>Fiyat</h4>
        <input
          type="range"
          min="2000"
          max="9000"
          step="100"
          value={filters.maxPrice}
          onChange={(e) => updateFilters((prev) => ({ ...prev, maxPrice: Number(e.target.value) }), "maxPrice")}
        />
        <p>0 - {filters.maxPrice.toLocaleString("tr-TR")} TL</p>
      </div>

      <div className="filter-group" ref={(el) => { sectionRefs.current.brands = el; }}>
        <h4>Marka</h4>
        {brands.map((brand) => (
          <label key={brand}>
            <input type="checkbox" checked={filters.brands.includes(brand)} onChange={() => onToggle("brands", brand)} /> {brand}
          </label>
        ))}
      </div>

      <div className="filter-group" ref={(el) => { sectionRefs.current.categories = el; }}>
        <h4>Kategori</h4>
        {categories.map((cat) => (
          <label key={cat.key}>
            <input type="checkbox" checked={filters.categories.includes(cat.key)} onChange={() => onToggle("categories", cat.key)} /> {cat.name}
          </label>
        ))}
      </div>

      <div className="filter-group" ref={(el) => { sectionRefs.current.genders = el; }}>
        <h4>Cinsiyet</h4>
        {["Erkek", "Kadın", "Çocuk"].map((gender) => (
          <label key={gender}>
            <input type="checkbox" checked={filters.genders.includes(gender)} onChange={() => onToggle("genders", gender)} /> {gender}
          </label>
        ))}
      </div>

      <div className="filter-group" ref={(el) => { sectionRefs.current.colors = el; }}>
        <h4>Renk</h4>
        {["Siyah", "Beyaz", "Gri", "Kırmızı", "Elektrik Mavi", "Antrasit", "Mavi", "Karışık"].map((color) => (
          <label key={color}>
            <input type="checkbox" checked={filters.colors.includes(color)} onChange={() => onToggle("colors", color)} /> {color}
          </label>
        ))}
      </div>

      <div className="filter-group" ref={(el) => { sectionRefs.current.sizes = el; }}>
        <h4>Numara</h4>
        {[30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 45.5].map((size) => (
          <label key={size}>
            <input type="checkbox" checked={filters.sizes.includes(size)} onChange={() => onToggle("sizes", size)} /> {size}
          </label>
        ))}
      </div>

      <label className="switch-row" ref={(el) => { sectionRefs.current.inStock = el; }}>
        <input type="checkbox" checked={filters.inStock} onChange={(e) => updateFilters((prev) => ({ ...prev, inStock: e.target.checked }), "inStock")} />
        Stokta olanlar
      </label>

      <label className="switch-row" ref={(el) => { sectionRefs.current.saleOnly = el; }}>
        <input type="checkbox" checked={filters.saleOnly} onChange={(e) => updateFilters((prev) => ({ ...prev, saleOnly: e.target.checked }), "saleOnly")} />
        İndirimdekiler
      </label>

      <div className="filter-actions" ref={applyRef}>
        <button className="primary-btn block" onClick={onApply}>Uygula</button>
        <button className="secondary-btn block" onClick={onReset}>Temizle</button>
      </div>
    </aside>
  );
}
