import Breadcrumb from "../components/Breadcrumb";
import { useSEO } from "../hooks/useSEO";

export default function ContactPage() {
  useSEO({ title: "İletişim", description: "ProSpor müşteri hizmetleri ve iletişim kanalları" });

  return (
    <div className="container page-pad">
      <Breadcrumb items={[{ label: "Anasayfa", to: "/" }, { label: "İletişim" }]} />
      <h1>İletişim</h1>
      <div className="checkout-layout">
        <section className="form-card">
          <h3>Bize Ulaşın</h3>
          <div className="form-grid">
            <input placeholder="Ad Soyad" />
            <input placeholder="E-posta" />
            <input className="full" placeholder="Konu" />
            <textarea className="full" rows="5" placeholder="Mesajınız" />
          </div>
          <button className="primary-btn">Gönder</button>
        </section>
        <aside className="summary-box">
          <h3>İletişim Bilgileri</h3>
          <p>Telefon: 0531 823 30 74</p>
          <p>E-posta: destek@prospor07.com</p>
          <p>Adres: Antalya Kumluca bağlık mahallesi İpek Sokak Gökmen apartmanı kat 1 daire 2</p>
          <p>Canlı destek: Hafta içi 09:00 - 22:00</p>
          <p>Destek ekibimiz sipariş, kargo, iade/değişim ve ürün danışmanlığı konularında yardımcı olur.</p>
          <p>Ödeme altyapımız, uluslararası güvenlik standartlarına uygun şekilde çalışır ve işlem doğrulama adımları ödeme sırasında otomatik olarak uygulanır.</p>
          <p>Talep ve şikayetleriniz kayıt altına alınır, çözüm süreci boyunca tarafınıza e-posta veya telefon ile bilgilendirme yapılır.</p>
        </aside>
      </div>
    </div>
  );
}

