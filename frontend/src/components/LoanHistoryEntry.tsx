import type { LoanHistoryEntry as LoanHistoryEntryType } from "../types/loan";
import "./LoanHistoryEntry.css";

interface LoanHistoryEntryProps {
  readonly entry: LoanHistoryEntryType;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ca-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function LoanHistoryEntry({ entry }: LoanHistoryEntryProps) {
  return (
    <div className="loan-history-entry">
      <span className="loan-history-member">{entry.member_display_name}</span>
      <span className="loan-history-dates">
        {formatDate(entry.borrowed_at)}
        {" — "}
        {entry.returned_at !== null ? (
          formatDate(entry.returned_at)
        ) : (
          <span className="loan-history-active">Prestat actualment</span>
        )}
      </span>
    </div>
  );
}
