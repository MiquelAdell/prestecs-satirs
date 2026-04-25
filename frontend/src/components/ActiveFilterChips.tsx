import { Chip } from "../ui/Chip";
import type { FilterValue } from "./FilterControl";
import styles from "./ActiveFilterChips.module.css";

export type LocationValue = "all" | "armari" | "soterrani";
export type TimePreset = "all" | "lt30" | "30to60" | "1to2h" | "2hplus";

export interface ActiveFilterChipsProps {
  readonly search: string;
  readonly filter: FilterValue;
  readonly location: LocationValue;
  readonly timePreset: TimePreset;
  readonly minRating: number;
  readonly playerRange: readonly [number, number];
  readonly playerBounds: readonly [number, number];
  readonly onClearSearch: () => void;
  readonly onClearFilter: () => void;
  readonly onClearLocation: () => void;
  readonly onClearTimePreset: () => void;
  readonly onClearMinRating: () => void;
  readonly onClearPlayerRange: () => void;
}

const FILTER_LABELS: Readonly<Record<Exclude<FilterValue, "all">, string>> = {
  available: "Disponibles",
  lent: "Prestados",
};

const LOCATION_LABELS: Readonly<Record<Exclude<LocationValue, "all">, string>> = {
  armari: "Armario",
  soterrani: "Sótano",
};

const TIME_PRESET_LABELS: Readonly<Record<Exclude<TimePreset, "all">, string>> = {
  lt30: "< 30 min",
  "30to60": "30–60 min",
  "1to2h": "1–2 h",
  "2hplus": "2 h+",
};

function formatPlayerRange(
  range: readonly [number, number],
  bounds: readonly [number, number],
): string {
  const [low, high] = range;
  const upperLabel = high >= bounds[1] ? `${high}+` : String(high);
  if (low === high) {
    return `${low} jugadores`;
  }
  return `${low}–${upperLabel} jugadores`;
}

export function ActiveFilterChips({
  search,
  filter,
  location,
  timePreset,
  minRating,
  playerRange,
  playerBounds,
  onClearSearch,
  onClearFilter,
  onClearLocation,
  onClearTimePreset,
  onClearMinRating,
  onClearPlayerRange,
}: ActiveFilterChipsProps) {
  const trimmedSearch = search.trim();
  const playerRangeActive =
    playerRange[0] > playerBounds[0] || playerRange[1] < playerBounds[1];

  const chips = [
    trimmedSearch !== "" && {
      key: "search",
      label: `Buscar: "${trimmedSearch}"`,
      onRemove: onClearSearch,
    },
    filter !== "all" && {
      key: "filter",
      label: FILTER_LABELS[filter],
      onRemove: onClearFilter,
    },
    location !== "all" && {
      key: "location",
      label: LOCATION_LABELS[location],
      onRemove: onClearLocation,
    },
    playerRangeActive && {
      key: "players",
      label: formatPlayerRange(playerRange, playerBounds),
      onRemove: onClearPlayerRange,
    },
    timePreset !== "all" && {
      key: "time",
      label: TIME_PRESET_LABELS[timePreset],
      onRemove: onClearTimePreset,
    },
    minRating > 0 && {
      key: "rating",
      label: `≥ ${minRating.toFixed(1)} ★`,
      onRemove: onClearMinRating,
    },
  ].filter(
    (chip): chip is { key: string; label: string; onRemove: () => void } =>
      Boolean(chip),
  );

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className={styles.row} role="list" aria-label="Filtros activos">
      {chips.map((chip) => (
        <div key={chip.key} role="listitem">
          <Chip onRemove={chip.onRemove}>{chip.label}</Chip>
        </div>
      ))}
    </div>
  );
}
