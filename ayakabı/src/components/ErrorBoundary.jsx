import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || "Bilinmeyen hata" };
  }

  componentDidCatch(error, info) {
    console.error("ProSpor runtime error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ maxWidth: 900, margin: "60px auto", padding: 24, background: "#fff", border: "1px solid #ddd", borderRadius: 12 }}>
          <h1>Uygulama Hatası</h1>
          <p>Sayfa yüklenirken bir hata oluştu. Tarayıcı konsolunda detay mevcut.</p>
          <pre style={{ whiteSpace: "pre-wrap", background: "#f7f7f7", padding: 12, borderRadius: 8 }}>{this.state.message}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}
