import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import "./SetPasswordPage.css";

export function SetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Token no vàlid o absent.");
      return;
    }

    if (password.length < 4) {
      setError("La contrasenya ha de tenir almenys 4 caràcters.");
      return;
    }

    if (password !== confirm) {
      setError("Les contrasenyes no coincideixen.");
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
      const message = err instanceof Error ? err.message : "Error desconegut";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="set-password-page">
        <div className="set-password-form">
          <h1>Contrasenya establerta</h1>
          <div className="set-password-success">
            La contrasenya s'ha establert correctament.{" "}
            <Link to="/login">Inicia sessió</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="set-password-page">
      <form className="set-password-form" onSubmit={(e) => void handleSubmit(e)}>
        <h1>Establir contrasenya</h1>

        {error && <div className="set-password-error">{error}</div>}

        <div className="set-password-field">
          <label htmlFor="password">Contrasenya</label>
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
          <label htmlFor="confirm">Confirmar contrasenya</label>
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
          {loading ? "Establint..." : "Establir contrasenya"}
        </button>
      </form>
    </div>
  );
}
