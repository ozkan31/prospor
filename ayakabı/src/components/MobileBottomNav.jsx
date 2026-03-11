import { Link, useLocation } from "react-router-dom";
import { useStore } from "../context/StoreContext";

function MobileNavIcon({ name }) {
  if (name === "home") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 10.5 12 3l9 7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.5 9.5V20h13V9.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === "products") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="4" width="17" height="16" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3.5 10.5h17M9 4v16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "cart") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 4h2l2 11h10l2-8H6.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="10" cy="19" r="1.5" fill="currentColor" />
        <circle cx="17" cy="19" r="1.5" fill="currentColor" />
      </svg>
    );
  }

  if (name === "favorites") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 20s-6.7-4.3-8.7-7.8C1.8 9.7 3.1 6 7 6c2 0 3.3 1.1 5 3 1.7-1.9 3-3 5-3 3.9 0 5.2 3.7 3.7 6.2C18.7 15.7 12 20 12 20Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 20c.8-3.2 3.4-5 7-5s6.2 1.8 7 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function MobileBottomNav() {
  const { pathname } = useLocation();
  const { cartItems, user } = useStore();
  const cartQty = cartItems.reduce((sum, line) => sum + line.qty, 0);

  const items = [
    { to: "/", label: "Anasayfa", icon: "home" },
    { to: "/urunler", label: "Ürünler", icon: "products" },
    { to: "/sepet", label: "Sepet", icon: "cart", isCenter: true },
    { to: "/favoriler", label: "Favoriler", icon: "favorites" },
    { to: user?.email ? "/hesabim" : "/giris-kayit", label: "Profil", icon: "profile" }
  ];

  return (
    <nav className="mobile-bottom-nav">
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={`${pathname === item.to ? "active" : ""} ${item.isCenter ? "center-link" : ""}`.trim()}
        >
          <span className="mobile-nav-icon"><MobileNavIcon name={item.icon} /></span>
          {item.to === "/sepet" && cartQty > 0 && <em className="cart-badge">{cartQty}</em>}
          <small>{item.label}</small>
        </Link>
      ))}
    </nav>
  );
}
