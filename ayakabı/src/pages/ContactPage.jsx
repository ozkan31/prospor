import Breadcrumb from "../components/Breadcrumb";
import { useSEO } from "../hooks/useSEO";

export default function ContactPage() {
  useSEO({ title: "İletişim", description: "ProSpor müşteri hizmetleri ve iletişim formu" });

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
          <p>Telefon: +90 850 123 45 67</p>
          <p>E-posta: destek@prospor.com</p>
          <p>Adres: Maslak Mah. Spor Cad. No:7 Sarıyer / İstanbul</p>
          <p>Canlı destek: 09:00 - 22:00</p>
        </aside>
      </div>
    </div>
  );
}
