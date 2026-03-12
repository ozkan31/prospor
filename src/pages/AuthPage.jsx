import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import Breadcrumb from "../components/Breadcrumb";
import { useStore } from "../context/StoreContext";
import { apiRequest } from "../lib/api";
import { useSEO } from "../hooks/useSEO";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordAgain, setShowPasswordAgain] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetPasswordAgain, setResetPasswordAgain] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const googleBtnRef = useRef(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const resetToken = String(searchParams.get("resetToken") || "").trim();

  const { login, register, loginWithGoogle, isLoggedIn } = useStore();
  const navigate = useNavigate();

  useSEO({ title: "Giriş / Kayıt", description: "ProSpor hesabınıza giriş yapın veya yeni hesap oluşturun." });

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const renderGoogleButton = () => {
      if (cancelled || resetToken || forgotOpen) return;
      if (!GOOGLE_CLIENT_ID || !googleBtnRef.current) return;

      const googleId = window.google?.accounts?.id;
      if (!googleId) {
        attempts += 1;
        if (attempts < 20) setTimeout(renderGoogleButton, 200);
        return;
      }

      googleId.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            clearMessages();
            setSubmitting(true);
            if (!response?.credential) {
              setError("Google kimlik doğrulama bilgisi alınamadı.");
              return;
            }

            await loginWithGoogle(response.credential);
            setSuccess("Google ile giriş başarılı. Yönlendiriliyorsunuz...");
            setTimeout(() => navigate("/hesabim"), 400);
          } catch (e) {
            setError(e.message || "Google ile giriş başarısız.");
          } finally {
            setSubmitting(false);
          }
        }
      });

      googleBtnRef.current.innerHTML = "";
      googleId.renderButton(googleBtnRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: mode === "login" ? "signin_with" : "signup_with",
        shape: "pill",
        width: 360,
        logo_alignment: "left"
      });
    };

    renderGoogleButton();
    return () => {
      cancelled = true;
    };
  }, [mode, loginWithGoogle, navigate, resetToken, forgotOpen]);

  const handleSubmit = async () => {
    clearMessages();

    if (!email.trim()) {
      setError("E-posta alanı zorunludur.");
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

  const handleForgotPassword = async () => {
    clearMessages();
    if (!forgotEmail.trim()) {
      setError("Şifre yenileme için e-posta girin.");
      return;
    }

    setSubmitting(true);
    try {
      const json = await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: forgotEmail.trim() })
      });
      setSuccess(json?.message || "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.");
    } catch (e) {
      setError(e.message || "Şifre yenileme e-postası gönderilemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    clearMessages();

    if (!resetPassword || resetPassword.length < 6) {
      setError("Yeni şifre en az 6 karakter olmalı.");
      return;
    }

    if (resetPassword !== resetPasswordAgain) {
      setError("Yeni şifre tekrar alanı uyuşmuyor.");
      return;
    }

    setSubmitting(true);
    try {
      const json = await apiRequest("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token: resetToken, password: resetPassword })
      });

      setSuccess(json?.message || "Şifreniz güncellendi. Giriş yapabilirsiniz.");
      setResetPassword("");
      setResetPasswordAgain("");
      setSearchParams({});
      setMode("login");
    } catch (e) {
      setError(e.message || "Şifre yenileme başarısız.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoggedIn) {
    return <Navigate to="/hesabim" replace />;
  }

  return (
    <div className="container page-pad auth-wrap">
      <Breadcrumb items={[{ label: "Anasayfa", to: "/" }, { label: "Giriş / Kayıt" }]} />
      <div className="auth-card">
        {resetToken ? (
          <>
            <h3>Yeni Şifre Belirle</h3>
            <div className="password-wrap">
              <input
                placeholder="Yeni Şifre"
                type={showPassword ? "text" : "password"}
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword((s) => !s)}>
                {showPassword ? "Gizle" : "Göster"}
              </button>
            </div>
            <div className="password-wrap">
              <input
                placeholder="Yeni Şifre Tekrar"
                type={showPasswordAgain ? "text" : "password"}
                value={resetPasswordAgain}
                onChange={(e) => setResetPasswordAgain(e.target.value)}
              />
              <button type="button" className="password-toggle" onClick={() => setShowPasswordAgain((s) => !s)}>
                {showPasswordAgain ? "Gizle" : "Göster"}
              </button>
            </div>
            {error && <p className="form-error">{error}</p>}
            {success && <p className="form-success">{success}</p>}
            <button className="primary-btn block" onClick={handleResetPassword} disabled={submitting}>
              {submitting ? "İşleniyor..." : "Şifreyi Güncelle"}
            </button>
          </>
        ) : forgotOpen ? (
          <>
            <h3>Şifre Yenileme</h3>
            <input
              type="email"
              placeholder="Kayıtlı e-posta adresiniz"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
            />
            {error && <p className="form-error">{error}</p>}
            {success && <p className="form-success">{success}</p>}
            <button type="button" className="primary-btn block" onClick={handleForgotPassword} disabled={submitting}>
              {submitting ? "Gönderiliyor..." : "Şifre Sıfırlama Linki Gönder"}
            </button>
            <button
              type="button"
              className="secondary-btn block"
              onClick={() => {
                setForgotOpen(false);
                clearMessages();
              }}
            >
              Giriş Ekranına Dön
            </button>
          </>
        ) : (
          <>
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

            {mode === "login" && (
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setForgotOpen(true);
                  clearMessages();
                }}
              >
                Şifremi Unuttum
              </button>
            )}

            <div className="auth-divider" aria-hidden="true">
              <span>veya</span>
            </div>

            {GOOGLE_CLIENT_ID ? (
              <div className="google-auth-wrap">
                <div ref={googleBtnRef} />
              </div>
            ) : (
              <p className="form-error">Google girişi için VITE_GOOGLE_CLIENT_ID tanımlanmalıdır.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
