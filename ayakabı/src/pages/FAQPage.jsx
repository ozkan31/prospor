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
    </div>
  );
}
