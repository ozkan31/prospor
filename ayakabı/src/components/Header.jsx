import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";

export default function Header() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const headerRef = useRef(null);
  const navigate = useNavigate();
  const { favorites, user, products, cartItems } = useStore();
  const cartQty = cartItems.reduce((sum, line) => sum + line.qty, 0);
  const accountPath = user?.email ? "/hesabim" : "/giris-kayit";
  const favoritesPath = user?.email ? "/favoriler" : "/giris-kayit";

  const suggestions = useMemo(() => {
    if (!q.trim()) return [];
    return products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6);
  }, [q, products]);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!headerRef.current) return;
      if (!headerRef.current.contains(event.target)) setOpen(false);
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const goTo = (path) => {
    setOpen(false);
    navigate(path);
  };

  const onSearchSubmit = (event) => {
    event.preventDefault();
    const term = q.trim().toLowerCase();

    if (!term) {
      navigate("/urunler");
      return;
    }

    const found = products.find((p) => p.name.toLowerCase().includes(term));
    if (found) {
      navigate(`/urun/${found.id}`);
      setQ("");
      return;
    }

    navigate("/urunler");
  };

  return (
    <header ref={headerRef}>
      <div className="utility-bar">
        <div className="container utility-inner">
          <span>ProSpor Journal</span>
          <nav>
            <Link to="/iletisim">Yardım</Link>
            <Link to="/kargo-ve-teslimat">Kargo</Link>
            {!user?.email && <Link to="/giris-kayit">Giriş Yap / Üye Ol</Link>}
          </nav>
        </div>
      </div>

      <div className="header-main container">
        <Link to="/" className="logo">ProSpor</Link>

        <nav className={`nike-nav ${open ? "open" : ""}`}>
          <button type="button" className="menu-link-btn" onClick={() => goTo("/urunler")}>Yeni ve Popüler</button>
          <button type="button" className="menu-link-btn" onClick={() => goTo("/kategori/erkek-ayakkabi")}>Erkek</button>
          <button type="button" className="menu-link-btn" onClick={() => goTo("/kategori/kadin-ayakkabi")}>Kadın</button>
          <button type="button" className="menu-link-btn" onClick={() => goTo("/kategori/cocuk-ayakkabi")}>Çocuk</button>
          <button type="button" className="menu-link-btn" onClick={() => goTo("/kategori/spor-ayakkabi")}>Spor</button>
          <button type="button" className="menu-link-btn" onClick={() => goTo("/kategori/kosu-ayakkabisi")}>Koşu</button>
          <button type="button" className="menu-link-btn" onClick={() => goTo("/kategori/indirimdekiler")}>İndirim</button>
        </nav>

        <div className="header-actions">
          <div className="search-wrap">
            <form className="search-form" onSubmit={onSearchSubmit}>
              <input value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder="Ürün ara" />
              <button type="submit" className="search-btn" aria-label="Ara">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M16.5 16.5 21 21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </form>

            {suggestions.length > 0 && (
              <div className="search-suggestions">
                {suggestions.map((item) => (
                  <Link key={item.id} to={`/urun/${item.id}`} onClick={() => setQ("")}>{item.name}</Link>
                ))}
              </div>
            )}
          </div>
          <div className="desktop-header-icons">
            <Link to={favoritesPath} className="desktop-icon-link" aria-label="Favoriler">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 21s-6.7-4.2-9.4-8.1C.8 10.4 1.2 6.8 4 4.8c2.3-1.6 5.2-1.1 7 1 1.8-2.1 4.7-2.6 7-1 2.8 2 3.2 5.6 1.4 8.1C18.7 16.8 12 21 12 21z" fill="currentColor" />
              </svg>
              <span>{favorites.length}</span>
            </Link>
            <Link to={accountPath} className="desktop-icon-link" aria-label="Hesabim">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 12.5a4.75 4.75 0 1 0 0-9.5 4.75 4.75 0 0 0 0 9.5zM4 21a8 8 0 1 1 16 0H4z" fill="currentColor" />
              </svg>
            </Link>
            <Link to="/sepet" className="desktop-icon-link" aria-label="Sepet">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 5h14l-1.5 8.5H8.2L7 5zM5 3h2l1.5 11.5h10.7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="10" cy="19" r="1.7" fill="currentColor" />
                <circle cx="18" cy="19" r="1.7" fill="currentColor" />
              </svg>
              <span>{cartQty}</span>
            </Link>
          </div>
          <button className="menu-btn" onClick={() => setOpen((s) => !s)}>?</button>
        </div>
      </div>

      <div className="announcement-bar" aria-label="Duyurular">
        <div className="announcement-track">
          <span>Ücretsiz kargo 999 TL+ | 14 gün iade | Orijinal ürün garantisi</span>
          <span aria-hidden="true">Ücretsiz kargo 999 TL+ | 14 gün iade | Orijinal ürün garantisi</span>
        </div>
      </div>
    </header>
  );
}
