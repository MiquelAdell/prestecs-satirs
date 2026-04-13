import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../api/client";
import "./LoginPage.css";

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiFetch("/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } catch {
      setError(t("forgotPassword.unknownError"));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="login-page">
        <div className="login-form">
          <h1>{t("forgotPassword.title")}</h1>
          <p style={{ marginBottom: "var(--space-md)", lineHeight: 1.5 }}>
            {t("forgotPassword.successMessage")}
          </p>
          <Link to="/login" className="btn btn-primary" style={{ display: "block", textAlign: "center" }}>
            {t("forgotPassword.backToLogin")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={(e) => void handleSubmit(e)}>
        <h1>{t("forgotPassword.title")}</h1>

        <p style={{ marginBottom: "var(--space-md)", fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
          {t("forgotPassword.instructions")}
        </p>

        {error && <div className="login-error">{error}</div>}

        <div className="login-field">
          <label htmlFor="email">{t("login.email")}</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
          />
        </div>

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? t("forgotPassword.submitting") : t("forgotPassword.submit")}
        </button>

        <p style={{ marginTop: "var(--space-md)", textAlign: "center", fontSize: "var(--font-size-sm)" }}>
          <Link to="/login">{t("forgotPassword.backToLogin")}</Link>
        </p>
      </form>
    </div>
  );
}
