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
    description: "ProSpor, performans ve stil odaklı spor ayakkabı ürünlerini güvenli ödeme, şeffaf satış politikası ve güçlü müşteri desteği ile sunan bir e-ticaret markasıdır.",
    sections: [
      {
        title: "Marka Hikayemiz",
        text: "ProSpor; koşu, antrenman ve günlük kullanıma uygun spor ayakkabı kategorilerinde müşterilerine güvenilir, hızlı ve sürdürülebilir bir alışveriş deneyimi sunmak amacıyla kurulmuştur. Ürün seçiminden teslimat sonrasına kadar her adımda açık iletişim, net bilgilendirme ve müşteri memnuniyetini esas alır."
      },
      {
        title: "Misyonumuz",
        text: "Orijinal ve güncel ürünleri doğru fiyat politikası, hızlı sevkiyat, güvenli ödeme altyapısı ve güçlü satış sonrası destekle müşterilerimize ulaştırmaktır. Sipariş süreci boyunca müşterilerimize şeffaf bilgilendirme sunar, talepleri mümkün olan en kısa sürede sonuçlandırırız."
      },
      {
        title: "Vizyonumuz",
        text: "Türkiye'de spor ayakkabı alışverişinde güven, hız ve hizmet kalitesiyle ilk akla gelen e-ticaret markalarından biri olmak; kullanıcı deneyimi, veri güvenliği ve müşteri ilişkilerinde yüksek standartları kalıcı hale getirmektir."
      },
      {
        title: "Müşteri Desteği ve İletişim",
        text: "Sipariş öncesi ürün danışmanlığı, sipariş sonrası kargo takibi, iade ve değişim talepleri için müşterilerimiz bize destek@prospor07.com e-posta adresi ve 0531 823 30 74 telefon numarası üzerinden ulaşabilir. Şirket adresimiz: Antalya Kumluca bağlık mahallesi İpek Sokak Gökmen apartmanı kat 1 daire 2. Destek ekibimiz hafta içi 09:00 - 22:00 saatleri arasında aktif olarak hizmet verir."
      }
    ]
  },
  shipping: {
    title: "Kargo ve Teslimat",
    description: "Siparişinizin hazırlanması, kargoya verilmesi ve teslimat süreci hakkında bilgilendirme.",
    sections: [
      {
        title: "Sipariş Hazırlık Süreci",
        text: "Ödemesi onaylanan siparişler sistem tarafından otomatik olarak hazırlık sürecine alınır. Hafta içi 15:00'e kadar verilen siparişler, stok ve doğrulama koşullarına bağlı olarak aynı gün kargoya teslim edilir. Resmi tatil, kampanya yoğunluğu veya olağanüstü durumlarda hazırlık süresinde sınırlı gecikmeler yaşanabilir."
      },
      {
        title: "Teslimat Süresi ve Kargo Firması",
        text: "Siparişler Türkiye geneline ortalama 1-3 iş günü içinde teslim edilir. Teslimat süresi; alıcı adresi, hava koşulları, operasyon yoğunluğu ve kargo dağıtım ağına bağlı olarak değişebilir. Kargo tesliminden sonra takip numarası müşteriye SMS/e-posta ile iletilir."
      },
      {
        title: "Kargo Ücreti ve Ücretsiz Kargo",
        text: "Belirli kampanya dönemleri hariç 999 TL ve üzeri siparişlerde kargo ücretsizdir. Bu tutarın altındaki siparişlerde güncel kargo bedeli ödeme adımında açık şekilde gösterilir ve sipariş toplamına eklenir."
      },
      {
        title: "Teslimat Sırasında Kontrol",
        text: "Paket teslim alınırken dış ambalajın hasarlı olması halinde tutanak tutulması önerilir. Hasarlı teslimat, eksik ürün veya yanlış ürün durumlarında müşterilerimizin aynı gün içinde destek ekibimizle iletişime geçmesi sürecin hızlı çözülmesi açısından önemlidir."
      }
    ]
  },
  returns: {
    title: "İade ve Değişim",
    description: "Satın aldığınız ürünler için iade ve değişim koşulları.",
    sections: [
      {
        title: "İade Süresi",
        text: "Müşterilerimiz, siparişi teslim aldığı tarihten itibaren 14 gün içinde iade veya değişim talebi oluşturabilir. Talep oluşturulduktan sonra ürünün belirtilen süre içinde anlaşmalı kargo ile tarafımıza gönderilmesi gerekir."
      },
      {
        title: "İade/Değişim Koşulları",
        text: "İade veya değişim yapılacak ürün kullanılmamış olmalı; ürün, orijinal kutusu, etiketleri ve varsa tüm aksesuarları ile birlikte eksiksiz şekilde gönderilmelidir. Hijyen koşulları gereği kullanılmış, deformasyona uğramış veya tekrar satışı mümkün olmayan ürünlerde iade/değişim kabul edilmeyebilir."
      },
      {
        title: "Ücret İadesi",
        text: "İade onayı verilen siparişlerde ürün bedeli, ödeme işleminin gerçekleştiği yönteme göre iade edilir. Banka süreçlerine bağlı olarak tutarın karta yansıması 1-10 iş günü arasında değişebilir. Bu süre bankadan bankaya farklılık gösterebilir."
      },
      {
        title: "Destek ve Takip",
        text: "İade/değişim süreciyle ilgili tüm sorularınız için destek@prospor07.com e-posta adresinden veya 0531 823 30 74 numaralı telefondan bizimle iletişime geçebilirsiniz. Talep numarası ile süreç adım adım takip edilebilir."
      }
    ]
  },
  privacy: {
    title: "Gizlilik Politikası",
    description: "Kişisel verilerin toplanması, işlenmesi, saklanması ve korunmasına ilişkin bilgilendirme.",
    sections: [
      {
        title: "Toplanan Veriler",
        text: "Ad-soyad, iletişim bilgileri, teslimat adresi, sipariş bilgileri ve müşteri destek kayıtları gibi işlem için gerekli veriler toplanır. Ödeme verileri güvenli ödeme altyapısı üzerinden işlenir; kart bilgileri sistemimizde düz metin olarak saklanmaz."
      },
      {
        title: "Veri İşleme Amaçları",
        text: "Kişisel veriler; sipariş oluşturma, ödeme onayı, ürün teslimatı, iade/değişim süreçleri, fatura düzenleme, müşteri desteği ve yasal yükümlülüklerin yerine getirilmesi amacıyla işlenir."
      },
      {
        title: "Veri Güvenliği ve Saklama",
        text: "Veriler, yetkisiz erişime karşı teknik ve idari tedbirlerle korunur. Veri saklama süreleri mevzuata ve hizmet gerekliliklerine göre belirlenir; süre sonunda veri silme veya anonimleştirme yöntemleri uygulanır."
      },
      {
        title: "Kullanıcı Hakları",
        text: "Kullanıcılar, KVKK kapsamındaki erişim, düzeltme, silme ve itiraz haklarını kullanabilir. Bu talepler için destek@prospor07.com adresinden bize ulaşabilirsiniz."
      }
    ]
  },
  distance: {
    title: "Mesafeli Satış Sözleşmesi",
    description: "Mesafeli satışa ilişkin yasal hak ve yükümlülüklerin temel çerçevesi.",
    sections: [
      {
        title: "Taraflar ve Konu",
        text: "Bu sözleşme; alıcı ile ProSpor arasında, alıcının elektronik ortamda verdiği siparişe konu ürünün satışı ve teslimine ilişkin tarafların hak ve yükümlülüklerini düzenler. Satıcı iletişim bilgileri: destek@prospor07.com, 0531 823 30 74, Antalya Kumluca bağlık mahallesi İpek Sokak Gökmen apartmanı kat 1 daire 2. Sözleşme, ilgili mevzuat hükümlerine uygun şekilde uygulanır."
      },
      {
        title: "Sipariş ve Ödeme",
        text: "Siparişin tamamlanması, ödeme bilgilerinin doğrulanması ve işlemin onaylanması ile sözleşme yürürlüğe girer. Ödeme adımında siparişe ait ürün bedeli, kargo bedeli ve toplam tutar müşteriye açık şekilde gösterilir."
      },
      {
        title: "Teslimat ve İfa",
        text: "Satıcı, siparişi makul süre içinde ve en geç yasal süreler dahilinde alıcıya teslim etmekle yükümlüdür. Mücbir sebep hallerinde teslimat süresi uzayabilir; bu durumda alıcı bilgilendirilir."
      },
      {
        title: "Cayma Hakkı",
        text: "Alıcı, ürünün tesliminden itibaren yasal süre içinde cayma hakkını kullanabilir. Cayma hakkı kullanımında ürünün iade şartlarına uygun şekilde gönderilmesi gerekir. İstisnai ürünler mevzuat doğrultusunda değerlendirilir."
      }
    ]
  },
  terms: {
    title: "Kullanım Koşulları",
    description: "Web sitemizin kullanımına ilişkin genel şartlar ve kurallar.",
    sections: [
      {
        title: "Genel Kullanım",
        text: "Siteyi ziyaret eden veya alışveriş yapan tüm kullanıcılar kullanım koşullarını kabul etmiş sayılır. Kullanıcılar, üyelik ve sipariş süreçlerinde doğru, güncel ve eksiksiz bilgi sağlamakla sorumludur."
      },
      {
        title: "Fikri Mülkiyet Hakları",
        text: "Sitede yer alan tasarım, görsel, metin, logo, marka ve diğer içeriklerin hakları ProSpor'a veya ilgili hak sahiplerine aittir. Yazılı izin olmadan kopyalama, çoğaltma, dağıtma veya ticari kullanım yapılamaz."
      },
      {
        title: "Sorumluluk Sınırları",
        text: "Sistemsel bakım, teknik arıza, internet altyapı sorunları veya mücbir sebepler nedeniyle hizmette kesinti yaşanabilir. ProSpor, mevzuattan doğan tüketici hakları saklı kalmak kaydıyla bu durumlardan kaynaklanan sınırlı gecikmeler için gerekli bilgilendirmeyi yapar."
      },
      {
        title: "Uyuşmazlık ve İletişim",
        text: "Kullanıcı talepleri öncelikle müşteri destek kanalları üzerinden çözülmeye çalışılır. Çözülemeyen uyuşmazlıklarda ilgili tüketici mevzuatı hükümleri uygulanır. İletişim: destek@prospor07.com - 0531 823 30 74 - Antalya Kumluca bağlık mahallesi İpek Sokak Gökmen apartmanı kat 1 daire 2."
      }
    ]
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

