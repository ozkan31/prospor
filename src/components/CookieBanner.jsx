import { useState } from "react";

export default function CookieBanner() {
  const [accepted, setAccepted] = useState(() => localStorage.getItem("prospor_cookie") === "1");

  if (accepted) return null;

  return (
    <div className="cookie-banner">
      <p>Çerezleri deneyimi iyileştirmek, analiz ve pazarlama için kullanıyoruz.</p>
      <button
        className="primary-btn"
        onClick={() => {
          localStorage.setItem("prospor_cookie", "1");
          setAccepted(true);
        }}
      >
        Kabul Et
      </button>
    </div>
  );
}
