import Breadcrumb from "../components/Breadcrumb";
import { faqs } from "../data/products";
import { useSEO } from "../hooks/useSEO";

export default function FAQPage() {
  useSEO({ title: "Sık Sorulan Sorular", description: "Kargo, iade, ödeme ve üyelikle ilgili sık sorular." });

  return (
    <div className="container page-pad">
      <Breadcrumb items={[{ label: "Anasayfa", to: "/" }, { label: "Sık Sorulan Sorular" }]} />
      <h1>Sık Sorulan Sorular</h1>
      <div className="faq-list">
        {faqs.map((f) => (
          <details key={f.q}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
      <section className="static-page" style={{ marginTop: 16 }}>
        <p className="lead">
          Aradığınız cevabı bulamadıysanız <strong>destek@prospor07.com</strong> adresine yazabilir veya <strong>0531 823 30 74</strong> numarasından bize ulaşabilirsiniz.
        </p>
        <p className="lead">
          Şirket adresimiz: <strong>Antalya Kumluca bağlık mahallesi İpek Sokak Gökmen apartmanı kat 1 daire 2</strong>.
        </p>
        <section>
          <h3>Ödeme Güvenliği Hakkında</h3>
          <p>
            Ödeme işlemleri güvenli ödeme altyapısı üzerinden gerçekleştirilir. Kart bilgileri güvenli bağlantı ile iletilir ve ödeme sağlayıcısının doğrulama süreçlerine tabi tutulur.
            Şüpheli işlem durumlarında ek güvenlik adımları uygulanabilir.
          </p>
        </section>
        <section>
          <h3>İade ve Destek Süreci</h3>
          <p>
            İade ve değişim talepleri mevzuata uygun süreler içinde değerlendirilir. Ürün incelemesi tamamlandıktan sonra sonuç müşteriye yazılı olarak bildirilir.
            Süreç boyunca destek ekibimiz e-posta ve telefon üzerinden aktif bilgilendirme sağlar.
          </p>
        </section>
      </section>
    </div>
  );
}

