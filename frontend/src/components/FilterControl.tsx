import "./FilterControl.css";

export type FilterValue = "all" | "available" | "lent";

interface FilterControlProps {
  readonly value: FilterValue;
  readonly onChange: (value: FilterValue) => void;
}

const OPTIONS: readonly { readonly value: FilterValue; readonly label: string }[] = [
  { value: "all", label: "Tot" },
  { value: "available", label: "Disponible" },
  { value: "lent", label: "Prestat" },
];

export function FilterControl({ value, onChange }: FilterControlProps) {
  return (
    <div className="filter-control" role="group" aria-label="Filtre de disponibilitat">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          className={value === option.value ? "active" : ""}
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
