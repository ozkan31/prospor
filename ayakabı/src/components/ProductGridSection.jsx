import ProductCard from "./ProductCard";

export default function ProductGridSection({ title, subtitle, products, onQuickView, gridClassName = "" }) {
  return (
    <section className="section-block">
      <div className="section-head">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className={`product-grid ${gridClassName}`.trim()}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onQuickView={onQuickView} />
        ))}
      </div>
    </section>
  );
}
