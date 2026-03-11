import { useMemo } from "react";
import { useParams } from "react-router-dom";
import ProductsPage from "./ProductsPage";
import { categories } from "../data/products";

export default function CategoryPage() {
  const { slug } = useParams();
  const cat = useMemo(() => categories.find((c) => c.slug === slug), [slug]);

  if (!cat) {
    return <ProductsPage />;
  }

  return <ProductsPage prefilter={cat.key} pageTitle={cat.name} />;
}
