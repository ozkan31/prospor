import { useEffect, useState } from "react";

export default function Toast({ message, kind = "success" }) {
  const [visible, setVisible] = useState(Boolean(message));

  useEffect(() => {
    setVisible(Boolean(message));
    if (!message) return undefined;
    const timer = setTimeout(() => setVisible(false), 2400);
    return () => clearTimeout(timer);
  }, [message]);

  if (!visible || !message) return null;
  return <div className={`toast ${kind}`}>{message}</div>;
}
