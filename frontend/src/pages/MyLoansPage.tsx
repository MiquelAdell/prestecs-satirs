import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMyLoans } from "../hooks/useMyLoans";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { apiFetch } from "../api/client";
import type { ActiveLoan } from "../types/loan";
import "./MyLoansPage.css";

function formatDate(iso: string, lng: string): string {
  const localeMap: Record<string, string> = {
    ca: "ca-ES",
    es: "es-ES",
    en: "en-GB",
  };
  return new Date(iso).toLocaleDateString(localeMap[lng] ?? "ca-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function MyLoansPage() {
  const { loans, loading, error, refetch } = useMyLoans();
  const [returning, setReturning] = useState<ActiveLoan | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { t, i18n } = useTranslation();
  const lng = i18n.language?.substring(0, 2) ?? "ca";

  const handleReturn = async (loan: ActiveLoan) => {
    setActionLoading(true);
    try {
      await apiFetch<unknown>(`/loans/${loan.loan_id}/return`, {
        method: "PATCH",
      });
      refetch();
    } catch {
      /* silently handle — list will refetch */
    } finally {
      setActionLoading(false);
      setReturning(null);
    }
  };

  if (loading) {
    return (
      <div className="my-loans-page">
        <h1>{t("myLoans.title")}</h1>
        <p className="my-loans-loading">{t("myLoans.loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-loans-page">
        <h1>{t("myLoans.title")}</h1>
        <p className="my-loans-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="my-loans-page">
      <h1>{t("myLoans.title")}</h1>

      {loans.length === 0 ? (
        <p className="my-loans-empty">{t("myLoans.empty")}</p>
      ) : (
        <div className="my-loans-list">
          {loans.map((loan) => (
            <div key={loan.loan_id} className="my-loans-item">
              <img
                className="my-loans-thumbnail"
                src={loan.game_thumbnail_url}
                alt={loan.game_name}
                loading="lazy"
              />
              <div className="my-loans-info">
                <div className="my-loans-name">{loan.game_name}</div>
                <div className="my-loans-date">{t("myLoans.borrowedOn", { date: formatDate(loan.borrowed_at, lng) })}</div>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => setReturning(loan)}
                disabled={actionLoading}
              >
                {t("myLoans.return")}
              </button>
            </div>
          ))}
        </div>
      )}

      {returning && (
        <ConfirmDialog
          message={t("myLoans.confirmReturn", { name: returning.game_name })}
          onConfirm={() => void handleReturn(returning)}
          onCancel={() => setReturning(null)}
          confirmLabel={t("myLoans.return")}
        />
      )}
    </div>
  );
}
