import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import Breadcrumb from "../components/Breadcrumb";
import { useStore } from "../context/StoreContext";
import { useSEO } from "../hooks/useSEO";

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const { orders, getOrderById, isLoggedIn } = useStore();
  const [order, setOrder] = useState(() => orders.find((o) => o.id === orderId) || null);

  useSEO({ title: `Sipariş ${orderId}`, description: "Sipariş detayları" });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (order) return;
      try {
        const fetched = await getOrderById(orderId);
        if (!cancelled) setOrder(fetched);
      } catch {
        if (!cancelled) setOrder(null);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [orderId, getOrderById, order]);

  if (!isLoggedIn) {
    return <Navigate to="/giris-kayit" replace />;
  }

  if (!order) return <div className="container page-pad"><h1>Sipariş bulunamadı</h1></div>;

  return (
    <div className="container page-pad">
      <Breadcrumb items={[{ label: "Anasayfa", to: "/" }, { label: "Hesabım", to: "/hesabim" }, { label: order.id }]} />
      <h1>Sipariş Detayı: {order.id}</h1>
      <p>Tarih: {order.date}</p>
      <p>Durum: {order.status}</p>
      <p>Tutar: {order.total.toLocaleString("tr-TR")} TL</p>

      <h3>Ürünler</h3>
      <div className="favorites-list">
        {order.items.map((item, i) => (
          <article key={`${item.id || item.name}-${i}`} className="favorite-item">
            <Link className="favorite-thumb" to={item.id ? `/urun/${item.id}` : `/hesabim/siparis/${order.id}`}>
              {item.image ? (
                <img src={item.image} alt={item.name} loading="lazy" />
              ) : (
                <img src="https://via.placeholder.com/72x72?text=Urun" alt={item.name} loading="lazy" />
              )}
            </Link>
            <div className="favorite-main">
              <Link className="favorite-title" to={item.id ? `/urun/${item.id}` : `/hesabim/siparis/${order.id}`}>
                {item.name}
              </Link>
              <p className="favorite-meta">Adet: {item.qty}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="order-detail-actions">
        <Link to="/hesabim?tab=siparis" className="secondary-btn">Siparişlere Dön</Link>
      </div>
    </div>
  );
}
