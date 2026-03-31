import { useTranslation } from "react-i18next";
import "./FilterControl.css";

export type FilterValue = "all" | "available" | "lent";

interface FilterControlProps {
  readonly value: FilterValue;
  readonly onChange: (value: FilterValue) => void;
}

const FILTER_KEYS: readonly { readonly value: FilterValue; readonly i18nKey: string }[] = [
  { value: "all", i18nKey: "filter.all" },
  { value: "available", i18nKey: "filter.available" },
  { value: "lent", i18nKey: "filter.lent" },
];

export function FilterControl({ value, onChange }: FilterControlProps) {
  const { t } = useTranslation();

  return (
    <div className="filter-control" role="group" aria-label={t("filter.ariaLabel")}>
      {FILTER_KEYS.map((option) => (
        <button
          key={option.value}
          className={value === option.value ? "active" : ""}
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
        >
          {t(option.i18nKey)}
        </button>
      ))}
    </div>
  );
}
