import { useTranslation } from "react-i18next";
import type { LoanHistoryEntry as LoanHistoryEntryType } from "../types/loan";
import "./LoanHistoryEntry.css";

interface LoanHistoryEntryProps {
  readonly entry: LoanHistoryEntryType;
}

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

export function LoanHistoryEntry({ entry }: LoanHistoryEntryProps) {
  const { t, i18n } = useTranslation();
  const lng = i18n.language?.substring(0, 2) ?? "ca";

  return (
    <div className="loan-history-entry">
      <span className="loan-history-member">{entry.member_display_name}</span>
      <span className="loan-history-dates">
        {formatDate(entry.borrowed_at, lng)}
        {" — "}
        {entry.returned_at !== null ? (
          formatDate(entry.returned_at, lng)
        ) : (
          <span className="loan-history-active">{t("loanHistory.currentlyLent")}</span>
        )}
      </span>
    </div>
  );
}
