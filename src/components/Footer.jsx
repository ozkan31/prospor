import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer nike-footer">
      <div className="container nike-footer-grid">
        <div>
          <h4>Ürünler</h4>
          <Link to="/kategori/yeni-gelenler">Yeni Gelenler</Link>
          <Link to="/kategori/indirimdekiler">İndirimdekiler</Link>
          <Link to="/kategori/kosu-ayakkabisi">Koşu Ayakkabıları</Link>
          <Link to="/kategori/gunluk-ayakkabi">Günlük Sneaker</Link>
        </div>
        <div>
          <h4>Yardım</h4>
          <Link to="/iletisim">İletişim</Link>
          <Link to="/kargo-ve-teslimat">Kargo ve Teslimat</Link>
          <Link to="/iade-ve-degisim">İade ve Değişim</Link>
          <Link to="/sss">Sık Sorulan Sorular</Link>
        </div>
        <div>
          <h4>Şirket</h4>
          <Link to="/hakkimizda">Hakkımızda</Link>
          <Link to="/gizlilik-politikasi">Gizlilik Politikası</Link>
          <Link to="/mesafeli-satis-sozlesmesi">Mesafeli Satış Sözleşmesi</Link>
          <Link to="/kullanim-kosullari">Kullanım Koşulları</Link>
        </div>
        <div>
          <h4>ProSpor Membership</h4>
          <p>Üyelere özel lansman erişimi, kampanya önceliği ve sezon sürprizleri.</p>
          <Link to="/giris-kayit" className="secondary-btn">Üye Ol</Link>
        </div>
      </div>

      <div className="container nike-footer-bottom">
        <p>Türkiye</p>
        <p>© 2026 ProSpor, Inc. Tüm hakları saklıdır.</p>
      </div>
    </footer>
  );
}
