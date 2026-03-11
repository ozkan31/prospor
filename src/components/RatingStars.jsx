export default function RatingStars({ value = 0 }) {
  const full = Math.round(value);
  return (
    <div className="stars" aria-label={`Puan ${value}`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < full ? "star filled" : "star"}>★</span>
      ))}
    </div>
  );
}
