import { Link } from "react-router-dom";
import Breadcrumb from "../components/Breadcrumb";
import { useStore } from "../context/StoreContext";
import { useSEO } from "../hooks/useSEO";

export default function CartPage() {
  const { cartItems, subtotal, updateQty, removeFromCart } = useStore();
  useSEO({ title: "Sepet", description: "Sepetinizdeki ürünleri yönetip ödeme adımına geçin." });

  const shipping = subtotal > 2999 ? 0 : 149;
  const total = subtotal + shipping;

  return (
    <div className="container page-pad">
      <Breadcrumb items={[{ label: "Anasayfa", to: "/" }, { label: "Sepet" }]} />
      <h1>Sepetim</h1>

      <div className="cart-layout">
        <section>
          {cartItems.length === 0 && <p>Sepetiniz boş. <Link to="/urunler">Alışverişe başla</Link>.</p>}

          {cartItems.map((line, index) => (
            <article className="cart-line" key={`${line.productId}-${index}`}>
              <Link to={`/urun/${line.product?.id || ""}`}>
                <img src={line.product?.image} alt={line.product?.name} loading="lazy" />
              </Link>
              <div>
                <h4>
                  <Link to={`/urun/${line.product?.id || ""}`}>{line.product?.name}</Link>
                </h4>
                <p>{line.color} / {line.size}</p>
                <strong>{line.product?.price.toLocaleString("tr-TR")} TL</strong>
              </div>
              <div className="qty-row">
                <button onClick={() => updateQty(index, line.qty - 1)}>-</button>
                <span>{line.qty}</span>
                <button onClick={() => updateQty(index, line.qty + 1)}>+</button>
              </div>
              <button className="danger-btn" onClick={() => removeFromCart(index)}>Kaldır</button>
            </article>
          ))}
        </section>

        {cartItems.length > 0 && (
          <aside className="summary-box">
            <h3>Sepet Özeti</h3>
            <p>Ara Toplam <strong>{subtotal.toLocaleString("tr-TR")} TL</strong></p>
            <p>Kargo <strong>{shipping === 0 ? "Ücretsiz" : `${shipping} TL`}</strong></p>
            <p className="summary-total">Toplam <strong>{total.toLocaleString("tr-TR")} TL</strong></p>
            <Link className="primary-btn block" to="/odeme">Sepeti Onayla</Link>
          </aside>
        )}
      </div>
    </div>
  );
}
