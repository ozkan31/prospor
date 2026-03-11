import { Link } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { useSEO } from "../hooks/useSEO";

export default function CheckoutSuccessPage() {
  const { lastOrder } = useStore();

  useSEO({ title: "Sipariş Başarılı", description: "Siparişiniz başarıyla alınmıştır." });

  return (
    <div className="container page-pad center-page">
      <h1>Siparişiniz Başarıyla Alındı</h1>
      <p>
        Sipariş numaranız: <strong>{lastOrder?.id || "PS-2026-10123"}</strong>. E-posta ile bilgilendirildiniz.
      </p>

      {Array.isArray(lastOrder?.items) && lastOrder.items.length > 0 && (
        <div className="success-order-items">
          {lastOrder.items.map((item, i) => (
            <Link key={`${item.id || "item"}-${i}`} to={`/urun/${item.id}`} className="success-order-item">
              <img src={item.image} alt={item.name} loading="lazy" />
              <small>{item.qty}x</small>
            </Link>
          ))}
        </div>
      )}

      <div className="inline-actions">
        <Link to="/hesabim?tab=siparis" className="secondary-btn">Siparişlerim</Link>
        <Link to="/urunler" className="primary-btn">Alışverişe Devam Et</Link>
      </div>
    </div>
  );
}
