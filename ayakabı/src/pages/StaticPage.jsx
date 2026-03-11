import Breadcrumb from "../components/Breadcrumb";
import { useSEO } from "../hooks/useSEO";

export default function StaticPage({ title, description, sections = [] }) {
  useSEO({ title, description });

  return (
    <div className="container page-pad static-page">
      <Breadcrumb items={[{ label: "Anasayfa", to: "/" }, { label: title }]} />
      <h1>{title}</h1>
      <p className="lead">{description}</p>
      {sections.map((s) => (
        <section key={s.title}>
          <h3>{s.title}</h3>
          <p>{s.text}</p>
        </section>
      ))}
    </div>
  );
}
