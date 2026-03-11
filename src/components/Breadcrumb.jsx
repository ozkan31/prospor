import { Link } from "react-router-dom";

export default function Breadcrumb({ items }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((item, idx) => (
        <span key={item.label}>
          {item.to ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
          {idx < items.length - 1 && <span className="separator">/</span>}
        </span>
      ))}
    </nav>
  );
}
