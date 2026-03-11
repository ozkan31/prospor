import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import CookieBanner from "./CookieBanner";
import MobileBottomNav from "./MobileBottomNav";

export default function Layout() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");

  return (
    <div className="site-shell">
      {!isAdminPage && <Header />}
      <main>
        <Outlet />
      </main>
      {!isAdminPage && <Footer />}
      <CookieBanner />
      <MobileBottomNav />
    </div>
  );
}
