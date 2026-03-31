import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [tokenBanner, setTokenBanner] = useState<{ url: string; label: string } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<keyof AdminMember>("display_name");
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (key: keyof AdminMember) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const sortedMembers = [...members].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (av === null && bv === null) return 0;
    if (av === null) return sortAsc ? 1 : -1;
    if (bv === null) return sortAsc ? -1 : 1;
    if (typeof av === "string" && typeof bv === "string") {
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    if (typeof av === "number" && typeof bv === "number") {
      return sortAsc ? av - bv : bv - av;
    }
    if (typeof av === "boolean" && typeof bv === "boolean") {
      return sortAsc ? (av === bv ? 0 : av ? -1 : 1) : (av === bv ? 0 : av ? 1 : -1);
    }
    return 0;
  });

  const fetchMembers = useCallback(async () => {
    try {
      const data = await apiFetch<AdminMember[]>("/admin/members");
      setMembers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.errorLoadingMembers"));
    } finally {
      setLoading(false);
    }
  }, [t]);

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
      setError(err instanceof Error ? err.message : t("admin.errorUpdatingStatus"));
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
        setSuccessMessage(t("admin.emailSent", { email: m.email }));
      } else {
        setTokenBanner({
          url: res.token_url,
          label: t("admin.accessLinkFor", { name: m.display_name }),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.errorSendingLink"));
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
        <p className="admin-loading">{t("admin.loading")}</p>
      </div>
    );
  }

  if (!member?.is_admin) {
    return (
      <div className="admin-members-page">
        <p className="admin-restricted">{t("admin.restricted")}</p>
      </div>
    );
  }

  const columnHeaders: readonly (readonly [keyof AdminMember, string])[] = [
    ["display_name", t("admin.colName")],
    ["email", t("admin.colEmail")],
    ["member_number", t("admin.colMemberNumber")],
    ["is_active", t("admin.colStatus")],
    ["active_loan_count", t("admin.colActiveLoans")],
  ];

  return (
    <div className="admin-members-page">
      <div className="admin-members-header">
        <h1>{t("admin.title")}</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setTokenBanner(null);
            setSuccessMessage(null);
          }}
        >
          {showCreateForm ? t("admin.cancel") : t("admin.createMember")}
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
              {t("admin.copy")}
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
              label: t("admin.accessLinkFor", { name: res.member.display_name }),
            });
            void fetchMembers();
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {loading ? (
        <p className="admin-loading">{t("admin.loadingMembers")}</p>
      ) : error ? (
        <p className="admin-error">{error}</p>
      ) : members.length === 0 ? (
        <p className="admin-empty">{t("admin.empty")}</p>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                {columnHeaders.map(([key, label]) => (
                  <th
                    key={key}
                    className="admin-th-sortable"
                    onClick={() => handleSort(key)}
                  >
                    {label} {sortKey === key ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                ))}
                <th>{t("admin.colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {sortedMembers.map((m) => (
                <tr key={m.id}>
                  <td>{m.display_name}</td>
                  <td>{m.email}</td>
                  <td>{m.member_number ?? "—"}</td>
                  <td>
                    <span
                      className={`admin-badge ${
                        m.is_active ? "admin-badge--active" : "admin-badge--inactive"
                      }`}
                    >
                      {m.is_active ? t("admin.statusActive") : t("admin.statusInactive")}
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
                        {m.is_active ? t("admin.deactivate") : t("admin.activate")}
                      </button>
                      <button
                        className="btn-sm btn-primary"
                        onClick={() => void handleSendLink(m)}
                        disabled={actionLoading === m.id}
                      >
                        {t("admin.sendAccessLink")}
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
  const { t } = useTranslation();
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
      setFormError(t("admin.requiredFields"));
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
      setFormError(err instanceof Error ? err.message : t("admin.errorCreating"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="admin-create-form" onSubmit={(e) => void handleSubmit(e)}>
      <h2>{t("admin.newMemberTitle")}</h2>
      <div className="admin-form-grid">
        <div className="admin-form-field">
          <label htmlFor="cf-first-name">{t("admin.firstName")}</label>
          <input
            id="cf-first-name"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div className="admin-form-field">
          <label htmlFor="cf-last-name">{t("admin.lastName")}</label>
          <input
            id="cf-last-name"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <div className="admin-form-field">
          <label htmlFor="cf-email">{t("admin.emailField")}</label>
          <input
            id="cf-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="admin-form-field">
          <label htmlFor="cf-nickname">{t("admin.nickname")}</label>
          <input
            id="cf-nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>
        <div className="admin-form-field">
          <label htmlFor="cf-phone">{t("admin.phone")}</label>
          <input
            id="cf-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="admin-form-field">
          <label htmlFor="cf-member-number">{t("admin.memberNumber")}</label>
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
            {submitting ? t("admin.creating") : t("admin.createMember")}
          </button>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={onCancel}
            disabled={submitting}
          >
            {t("admin.cancel")}
          </button>
        </div>
      </div>
    </form>
  );
}
