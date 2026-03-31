import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../api/client";
import "./SetPasswordPage.css";

export function SetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { t } = useTranslation();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError(t("setPassword.errorInvalidToken"));
      return;
    }

    if (password.length < 4) {
      setError(t("setPassword.errorMinLength"));
      return;
    }

    if (password !== confirm) {
      setError(t("setPassword.errorMismatch"));
      return;
    }

    setLoading(true);
    try {
      await apiFetch<{ ok: boolean }>("/set-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("setPassword.unknownError");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="set-password-page">
        <div className="set-password-form">
          <h1>{t("setPassword.successTitle")}</h1>
          <div className="set-password-success">
            {t("setPassword.successMessage")}{" "}
            <Link to="/login">{t("setPassword.loginLink")}</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="set-password-page">
      <form className="set-password-form" onSubmit={(e) => void handleSubmit(e)}>
        <h1>{t("setPassword.title")}</h1>

        {error && <div className="set-password-error">{error}</div>}

        <div className="set-password-field">
          <label htmlFor="password">{t("setPassword.password")}</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>

        <div className="set-password-field">
          <label htmlFor="confirm">{t("setPassword.confirm")}</label>
          <input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? t("setPassword.submitting") : t("setPassword.submit")}
        </button>
      </form>
    </div>
  );
}
