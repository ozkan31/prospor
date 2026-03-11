import { Link } from "react-router-dom";
import { useSEO } from "../hooks/useSEO";

export default function NotFoundPage() {
  useSEO({ title: "404", description: "Sayfa bulunamadı" });

  return (
    <div className="container page-pad center-page">
      <h1>404</h1>
      <p>Aradığınız sayfa bulunamadı.</p>
      <Link to="/" className="primary-btn">Anasayfaya Dön</Link>
    </div>
  );
}
