import Breadcrumb from "../components/Breadcrumb";
import { useSEO } from "../hooks/useSEO";

export default function BlogPage() {
  useSEO({ title: "Blog", description: "Spor ayakkabı trendleri, bakım ipuçları ve satın alma rehberleri." });

  const posts = [
    { title: "Koşu Ayakkabısı Seçerken 7 Kritik Kriter", excerpt: "Pronasyon, drop, taban ve malzeme seçim rehberi." },
    { title: "Sneaker Bakımında Yapılan Hatalar", excerpt: "Modelin ömrünü kısaltan yaygın temizlik alışkanlıkları." },
    { title: "2026 İlkbahar Spor Stil Trendleri", excerpt: "Günlük kombinlerde öne çıkan premium sneaker çizgileri." }
  ];

  return (
    <div className="container page-pad">
      <Breadcrumb items={[{ label: "Anasayfa", to: "/" }, { label: "Blog" }]} />
      <h1>Blog</h1>
      <div className="blog-grid">
        {posts.map((post) => (
          <article key={post.title}>
            <h3>{post.title}</h3>
            <p>{post.excerpt}</p>
            <button className="link-btn">Devamını Oku</button>
          </article>
        ))}
      </div>
    </div>
  );
}
