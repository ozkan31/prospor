import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import AccountPage from "./pages/AccountPage";
import AdminPage from "./pages/AdminPage";
import AuthPage from "./pages/AuthPage";
import BlogPage from "./pages/BlogPage";
import CartPage from "./pages/CartPage";
import CategoryPage from "./pages/CategoryPage";
import CheckoutPage from "./pages/CheckoutPage";
import CheckoutSuccessPage from "./pages/CheckoutSuccessPage";
import ContactPage from "./pages/ContactPage";
import FAQPage from "./pages/FAQPage";
import FavoritesPage from "./pages/FavoritesPage";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import ProductsPage from "./pages/ProductsPage";
import StaticPage from "./pages/StaticPage";

const staticPages = {
  about: {
    title: "Hakkımızda",
    description: "ProSpor, premium spor ayakkabı deneyimi sunan yeni nesil bir e-ticaret markasıdır.",
    sections: [
      { title: "Misyonumuz", text: "Orijinal ürünleri hızlı teslimat ve yüksek hizmet kalitesiyle ulaştırmak." },
      { title: "Vizyonumuz", text: "Türkiye'nin en güvenilir premium spor ayakkabı platformu olmak." }
    ]
  },
  shipping: {
    title: "Kargo ve Teslimat",
    description: "Teslimat süreçleri ve kargo bilgilendirmeleri.",
    sections: [
      { title: "Teslimat Süresi", text: "Aynı gün kargo, 1-3 iş günü içinde teslimat." },
      { title: "Kargo Ücreti", text: "999 TL üzeri siparişlerde ücretsiz kargo." }
    ]
  },
  returns: {
    title: "İade ve Değişim",
    description: "İade ve değişim koşulları.",
    sections: [
      { title: "İade Süresi", text: "Teslimattan itibaren 14 gün içinde iade/değişim yapılabilir." },
      { title: "Koşullar", text: "Ürün kullanılmamış ve orijinal kutusuyla gönderilmelidir." }
    ]
  },
  privacy: {
    title: "Gizlilik Politikası",
    description: "Kişisel verilerin korunması ve işlenmesi hakkında bilgilendirme.",
    sections: [{ title: "KVKK", text: "Verileriniz KVKK ve ilgili mevzuat kapsamında korunur." }]
  },
  distance: {
    title: "Mesafeli Satış Sözleşmesi",
    description: "Mesafeli satışa ilişkin yasal sözleşme metni.",
    sections: [{ title: "Sözleşme", text: "Sipariş onayı ile mesafeli satış sözleşmesi yürürlüğe girer." }]
  },
  terms: {
    title: "Kullanım Koşulları",
    description: "Site kullanım şartları.",
    sections: [{ title: "Genel Şartlar", text: "Siteyi kullanan herkes kullanım koşullarını kabul etmiş sayılır." }]
  }
};

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="urunler" element={<ProductsPage />} />
          <Route path="kategori/:slug" element={<CategoryPage />} />
          <Route path="urun/:id" element={<ProductDetailPage />} />
          <Route path="sepet" element={<CartPage />} />
          <Route path="odeme" element={<CheckoutPage />} />
          <Route path="odeme/basarili" element={<CheckoutSuccessPage />} />
          <Route path="favoriler" element={<FavoritesPage />} />
          <Route path="giris-kayit" element={<AuthPage />} />
          <Route path="hesabim" element={<AccountPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="hesabim/siparis/:orderId" element={<OrderDetailPage />} />

          <Route path="hakkimizda" element={<StaticPage {...staticPages.about} />} />
          <Route path="iletisim" element={<ContactPage />} />
          <Route path="sss" element={<FAQPage />} />
          <Route path="kargo-ve-teslimat" element={<StaticPage {...staticPages.shipping} />} />
          <Route path="iade-ve-degisim" element={<StaticPage {...staticPages.returns} />} />
          <Route path="gizlilik-politikasi" element={<StaticPage {...staticPages.privacy} />} />
          <Route path="mesafeli-satis-sozlesmesi" element={<StaticPage {...staticPages.distance} />} />
          <Route path="kullanim-kosullari" element={<StaticPage {...staticPages.terms} />} />
          <Route path="blog" element={<BlogPage />} />

          <Route path="404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Routes>
    </>
  );
}
