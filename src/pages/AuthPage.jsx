import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Breadcrumb from "../components/Breadcrumb";
import { useStore } from "../context/StoreContext";
import { useSEO } from "../hooks/useSEO";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

const decodeJwt = (token) => {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
};

const isValidGmail = (value) => {
  const v = String(value || "").trim().toLowerCase();
  return /^[a-z0-9._%+-]+@gmail\.com$/.test(v);
};

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordAgain, setShowPasswordAgain] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login, register, isLoggedIn } = useStore();
  const navigate = useNavigate();

  useSEO({ title: "Giriş / Kayıt", description: "ProSpor hesabınıza giriş yapın veya yeni hesap oluşturun." });

  if (isLoggedIn) {
    return <Navigate to="/hesabim" replace />;
  }

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleGooglePrompt = () => {
    if (!GOOGLE_CLIENT_ID) {
      setError("Google girişi için VITE_GOOGLE_CLIENT_ID tanımlaman gerekiyor.");
      return;
    }

    if (!window.google?.accounts?.id) {
      setError("Google kimlik servisi yüklenemedi.");
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        const data = decodeJwt(response.credential);
        if (!data) return;
        setFirstName(data.given_name || "");
        setLastName(data.family_name || "");
        setEmail(data.email || "");
      }
    });

    setError("");
    window.google.accounts.id.prompt();
  };

  const handleSubmit = async () => {
    clearMessages();

    if (!isValidGmail(email)) {
      setError("Sadece @gmail.com uzantılı e-posta kullanabilirsiniz.");
      return;
    }

    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalı.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "register") {
        if (!firstName.trim() || !lastName.trim()) {
          setError("Ad ve soyad zorunludur.");
          return;
        }

        if (password !== passwordAgain) {
          setError("Şifre uyuşmuyor.");
          return;
        }

        await register({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password
        });

        setSuccess("Kayıt başarılı. Yönlendiriliyorsunuz...");
        setTimeout(() => navigate("/hesabim"), 500);
        return;
      }

      await login({ email: email.trim(), password });
      setSuccess("Giriş başarılı. Yönlendiriliyorsunuz...");
      setTimeout(() => navigate("/hesabim"), 500);
    } catch (e) {
      setError(e.message || "İşlem başarısız.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container page-pad auth-wrap">
      <Breadcrumb items={[{ label: "Anasayfa", to: "/" }, { label: "Giriş / Kayıt" }]} />
      <div className="auth-card">
        <div className="inline-actions">
          <button
            className={mode === "login" ? "primary-btn" : "secondary-btn"}
            onClick={() => {
              setMode("login");
              clearMessages();
            }}
          >
            Giriş Yap
          </button>
          <button
            className={mode === "register" ? "primary-btn" : "secondary-btn"}
            onClick={() => {
              setMode("register");
              clearMessages();
            }}
          >
            Kayıt Ol
          </button>
        </div>

        {mode === "register" && (
          <div className="name-row">
            <input placeholder="Ad" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <input placeholder="Soyad" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        )}

        <input placeholder="E-posta" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <div className="password-wrap">
          <input
            placeholder="Şifre"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="button" className="password-toggle" onClick={() => setShowPassword((s) => !s)}>
            {showPassword ? "Gizle" : "Göster"}
          </button>
        </div>
        {mode === "register" && (
          <div className="password-wrap">
            <input
              placeholder="Şifre Tekrar"
              type={showPasswordAgain ? "text" : "password"}
              value={passwordAgain}
              onChange={(e) => setPasswordAgain(e.target.value)}
            />
            <button type="button" className="password-toggle" onClick={() => setShowPasswordAgain((s) => !s)}>
              {showPasswordAgain ? "Gizle" : "Göster"}
            </button>
          </div>
        )}

        {mode === "register" && password && passwordAgain && password !== passwordAgain && (
          <p className="form-error">Şifre uyuşmuyor.</p>
        )}

        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success">{success}</p>}

        <button className="primary-btn block" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "İşleniyor..." : mode === "login" ? "Giriş Yap" : "Hesap Oluştur"}
        </button>

        {mode === "register" && (
          <button type="button" className="secondary-btn block" onClick={handleGooglePrompt}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: 8, verticalAlign: "text-bottom" }}>
              <path fill="#EA4335" d="M2 6.75 12 14l10-7.25V6a2 2 0 0 0-2-2h-1.5L12 8.75 5.5 4H4a2 2 0 0 0-2 2v.75z" />
              <path fill="#4285F4" d="M22 8.5 12 15.75 2 8.5V18a2 2 0 0 0 2 2h1.5V10.25L12 15l6.5-4.75V20H20a2 2 0 0 0 2-2V8.5z" />
              <path fill="#34A853" d="M2 8.5V18a2 2 0 0 0 2 2h1.5V10.25L2 8.5z" />
              <path fill="#FBBC05" d="M22 8.5V18a2 2 0 0 1-2 2h-1.5V10.25L22 8.5z" />
            </svg>
            Gmail ile Bilgi Doldur
          </button>
        )}

        {mode === "login" && (
          <p className="muted">Şifre sıfırlama endpointi henüz backend'e eklenmedi.</p>
        )}
      </div>
    </div>
  );
}
