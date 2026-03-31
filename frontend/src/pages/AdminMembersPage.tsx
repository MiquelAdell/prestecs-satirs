import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/client";
import type {
  AdminMember,
  CreateMemberRequest,
  CreateMemberResponse,
  SendLinkResponse,
  OkResponse,
} from "../types/admin";
import "./AdminMembersPage.css";

export function AdminMembersPage() {
  const { member, loading: authLoading } = useAuth();
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [tokenBanner, setTokenBanner] = useState<{ url: string; label: string } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      const data = await apiFetch<AdminMember[]>("/admin/members");
      setMembers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error carregant els socis.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (member?.is_admin) {
      void fetchMembers();
    }
  }, [member, fetchMembers]);

  const handleToggleActive = async (m: AdminMember) => {
    setActionLoading(m.id);
    try {
      const action = m.is_active ? "disable" : "enable";
      await apiFetch<OkResponse>(`/admin/members/${m.id}/${action}`, {
        method: "PATCH",
      });
      await fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error actualitzant l'estat.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendLink = async (m: AdminMember) => {
    setActionLoading(m.id);
    setTokenBanner(null);
    setSuccessMessage(null);
    try {
      const res = await apiFetch<SendLinkResponse>(
        `/admin/members/${m.id}/send-access-link`,
        { method: "POST" }
      );
      if (res.email_sent) {
        setSuccessMessage(`Correu enviat a ${m.email}`);
      } else {
        setTokenBanner({
          url: res.token_url,
          label: `Enlla\u00e7 d'acc\u00e9s per a ${m.display_name}:`,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error enviant l'enlla\u00e7.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  if (authLoading) {
    return (
      <div className="admin-members-page">
        <p className="admin-loading">Carregant...</p>
      </div>
    );
  }

  if (!member?.is_admin) {
    return (
      <div className="admin-members-page">
        <p className="admin-restricted">Acc\u00e9s restringit</p>
      </div>
    );
  }

  return (
    <div className="admin-members-page">
      <div className="admin-members-header">
        <h1>Gesti\u00f3 de socis</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setTokenBanner(null);
            setSuccessMessage(null);
          }}
        >
          {showCreateForm ? "Cancel\u00b7lar" : "Crear soci"}
        </button>
      </div>

      {successMessage && (
        <div className="admin-success-banner">{successMessage}</div>
      )}

      {tokenBanner && (
        <div className="admin-token-banner">
          <p>{tokenBanner.label}</p>
          <div className="admin-token-url">
            <code>{tokenBanner.url}</code>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => void handleCopy(tokenBanner.url)}
            >
              Copiar
            </button>
          </div>
        </div>
      )}

      {showCreateForm && (
        <CreateMemberForm
          onCreated={(res) => {
            setShowCreateForm(false);
            setTokenBanner({
              url: res.token_url,
              label: `Enlla\u00e7 d'acc\u00e9s per a ${res.member.display_name}:`,
            });
            void fetchMembers();
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {loading ? (
        <p className="admin-loading">Carregant socis...</p>
      ) : error ? (
        <p className="admin-error">{error}</p>
      ) : members.length === 0 ? (
        <p className="admin-empty">No hi ha socis registrats.</p>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>N\u00ba Soci</th>
                <th>Estat</th>
                <th>Pr\u00e9stecs actius</th>
                <th>Accions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>{m.display_name}</td>
                  <td>{m.email}</td>
                  <td>{m.member_number ?? "\u2014"}</td>
                  <td>
                    <span
                      className={`admin-badge ${
                        m.is_active ? "admin-badge--active" : "admin-badge--inactive"
                      }`}
                    >
                      {m.is_active ? "Actiu" : "Desactivat"}
                    </span>
                  </td>
                  <td>{m.active_loan_count}</td>
                  <td>
                    <div className="admin-actions">
                      <button
                        className={`btn-sm ${m.is_active ? "btn-danger" : "btn-success"}`}
                        onClick={() => void handleToggleActive(m)}
                        disabled={actionLoading === m.id}
                      >
                        {m.is_active ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        className="btn-sm btn-primary"
                        onClick={() => void handleSendLink(m)}
                        disabled={actionLoading === m.id}
                      >
                        Enviar enlla\u00e7 d&apos;acc\u00e9s
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---- Create member inline form ---- */

interface CreateMemberFormProps {
  readonly onCreated: (res: CreateMemberResponse) => void;
  readonly onCancel: () => void;
}

function CreateMemberForm({ onCreated, onCancel }: CreateMemberFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [memberNumber, setMemberNumber] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setFormError("Nom, cognoms i email s\u00f3n obligatoris.");
      return;
    }

    setSubmitting(true);
    try {
      const body: CreateMemberRequest = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        nickname: nickname.trim() || null,
        phone: phone.trim() || null,
        member_number: memberNumber.trim() ? Number(memberNumber.trim()) : null,
      };

      const res = await apiFetch<CreateMemberResponse>("/admin/members", {
        method: "POST",
        body: JSON.stringify(body),
      });
      onCreated(res);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error creant el soci.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="admin-create-form" onSubmit={(e) => void handleSubmit(e)}>
      <h2>Nou soci</h2>
      <div className="admin-form-grid">
        <div className="admin-form-field">
          <label htmlFor="cf-first-name">Nom *</label>
          <input
            id="cf-first-name"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div className="admin-form-field">
          <label htmlFor="cf-last-name">Cognoms *</label>
          <input
            id="cf-last-name"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <div className="admin-form-field">
          <label htmlFor="cf-email">Email *</label>
          <input
            id="cf-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="admin-form-field">
          <label htmlFor="cf-nickname">Sobrenom</label>
          <input
            id="cf-nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>
        <div className="admin-form-field">
          <label htmlFor="cf-phone">Tel\u00e8fon</label>
          <input
            id="cf-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="admin-form-field">
          <label htmlFor="cf-member-number">N\u00ba Soci</label>
          <input
            id="cf-member-number"
            type="number"
            value={memberNumber}
            onChange={(e) => setMemberNumber(e.target.value)}
          />
        </div>
        {formError && <p className="admin-form-error">{formError}</p>}
        <div className="admin-form-actions">
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Creant..." : "Crear soci"}
          </button>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel\u00b7lar
          </button>
        </div>
      </div>
    </form>
  );
}
