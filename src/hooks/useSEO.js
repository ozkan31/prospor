import { useEffect } from "react";

const upsertMeta = (attr, key, content) => {
  let el = document.head.querySelector(`meta[${attr}='${key}']`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

export function useSEO({ title, description, ogTitle, ogDescription, schema }) {
  useEffect(() => {
    if (title) document.title = `${title} | ProSpor`;
    if (description) upsertMeta("name", "description", description);
    if (ogTitle || title) upsertMeta("property", "og:title", ogTitle || title);
    if (ogDescription || description) upsertMeta("property", "og:description", ogDescription || description);

    let schemaNode;
    if (schema) {
      schemaNode = document.createElement("script");
      schemaNode.type = "application/ld+json";
      schemaNode.text = JSON.stringify(schema);
      document.head.appendChild(schemaNode);
    }

    return () => {
      if (schemaNode) schemaNode.remove();
    };
  }, [title, description, ogTitle, ogDescription, schema]);
}
