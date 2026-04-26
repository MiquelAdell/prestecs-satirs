import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGames } from "../hooks/useGames";
import { GameCard } from "../components/GameCard";
import { SearchBar } from "../components/SearchBar";
import { FilterControl, type FilterValue } from "../components/FilterControl";
import {
  ActiveFilterChips,
  type LocationValue,
  type TimePreset,
} from "../components/ActiveFilterChips";
import { Button } from "../ui/Button";
import { RangeSlider } from "../ui/RangeSlider";
import {
  DialogContent,
  DialogRoot,
  DialogTitle,
} from "../ui/Dialog";
import type { GameWithStatus } from "../types/game";
import styles from "./CatalogPage.module.css";

type SortValue =
  | "name-asc"
  | "name-desc"
  | "rating"
  | "players-asc"
  | "players-desc"
  | "time-asc"
  | "time-desc";

const SORT_OPTIONS: readonly { readonly value: SortValue; readonly label: string }[] = [
  { value: "name-asc", label: "Nombre (A-Z)" },
  { value: "name-desc", label: "Nombre (Z-A)" },
  { value: "rating", label: "Valoración BGG (alta a baja)" },
  { value: "players-asc", label: "Jugadores (menos a más)" },
  { value: "players-desc", label: "Jugadores (más a menos)" },
  { value: "time-asc", label: "Tiempo de juego (corto a largo)" },
  { value: "time-desc", label: "Tiempo de juego (largo a corto)" },
];

const LOCATION_OPTIONS: readonly { readonly value: LocationValue; readonly label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "armari", label: "Armario" },
  { value: "soterrani", label: "Sótano" },
];

const TIME_PRESETS: readonly { readonly value: TimePreset; readonly label: string }[] = [
  { value: "all", label: "Todo" },
  { value: "lt30", label: "<30" },
  { value: "30to60", label: "30–60" },
  { value: "1to2h", label: "1–2h" },
  { value: "2hplus", label: "2h+" },
];

const PLAYER_BOUNDS = [1, 12] as const;
const DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";

function stripPunctuation(name: string): string {
  return name.replace(/[¡¿!?«»()'".,;:]/g, "").trim();
}

function matchesTimePreset(playingTime: number, preset: TimePreset): boolean {
  switch (preset) {
    case "all":
      return true;
    case "lt30":
      return playingTime > 0 && playingTime < 30;
    case "30to60":
      return playingTime >= 30 && playingTime <= 60;
    case "1to2h":
      return playingTime > 60 && playingTime <= 120;
    case "2hplus":
      return playingTime > 120;
  }
}

function useMatchMedia(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mql = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    setMatches(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

function formatPlayer(value: number): string {
  return value >= PLAYER_BOUNDS[1] ? `${value}+` : String(value);
}

export type CatalogPageMode = "member" | "public";

export interface CatalogPageProps {
  readonly mode?: CatalogPageMode;
}

export function CatalogPage({ mode = "member" }: CatalogPageProps) {
  const { games, loading, error, refetch } = useGames();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");
  const [location, setLocation] = useState<LocationValue>("all");
  const [sort, setSort] = useState<SortValue>("name-asc");
  const [sortOpen, setSortOpen] = useState(false);
  const [timePreset, setTimePreset] = useState<TimePreset>("all");
  const [minRating, setMinRating] = useState(0);
  const [playerRange, setPlayerRange] =
    useState<readonly [number, number]>(PLAYER_BOUNDS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const isDesktop = useMatchMedia(DESKTOP_MEDIA_QUERY);

  const hasPlayerData = useMemo(
    () => games.some((g) => g.min_players > 0),
    [games],
  );
  const hasTimeData = useMemo(
    () => games.some((g) => g.playing_time > 0),
    [games],
  );

  useEffect(() => {
    if (!sortOpen) return;
    function handleClick(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [sortOpen]);

  const handleSortSelect = useCallback((value: SortValue) => {
    setSort(value);
    setSortOpen(false);
  }, []);

  const filteredGames = useMemo(() => {
    const passesFilter = (game: GameWithStatus): boolean => {
      if (filter === "available" && game.status !== "available") return false;
      if (filter === "lent" && game.status !== "lent") return false;
      if (location !== "all" && game.location !== location) return false;
      if (search.trim() !== "") {
        const query = search.trim().toLowerCase();
        if (!game.name.toLowerCase().includes(query)) return false;
      }
      const [pMin, pMax] = playerRange;
      const isAtExtremes =
        pMin <= PLAYER_BOUNDS[0] && pMax >= PLAYER_BOUNDS[1];
      if (!isAtExtremes) {
        if (game.min_players <= 0 && game.max_players <= 0) return false;
        const effectivePMax = pMax >= PLAYER_BOUNDS[1] ? Infinity : pMax;
        if (game.min_players > effectivePMax) return false;
        if (game.max_players > 0 && game.max_players < pMin) return false;
      }
      if (!matchesTimePreset(game.playing_time, timePreset)) return false;
      if (minRating > 0 && game.bgg_rating < minRating) return false;
      return true;
    };

    const result = games.filter(passesFilter);
    const sorted = [...result];
    switch (sort) {
      case "name-asc":
        sorted.sort((a, b) =>
          stripPunctuation(a.name).localeCompare(stripPunctuation(b.name)),
        );
        break;
      case "name-desc":
        sorted.sort((a, b) =>
          stripPunctuation(b.name).localeCompare(stripPunctuation(a.name)),
        );
        break;
      case "rating":
        sorted.sort((a, b) => b.bgg_rating - a.bgg_rating);
        break;
      case "players-asc":
        sorted.sort((a, b) => a.min_players - b.min_players);
        break;
      case "players-desc":
        sorted.sort((a, b) => b.max_players - a.max_players);
        break;
      case "time-asc":
        sorted.sort((a, b) => a.playing_time - b.playing_time);
        break;
      case "time-desc":
        sorted.sort((a, b) => b.playing_time - a.playing_time);
        break;
    }
    return sorted;
  }, [
    games,
    search,
    filter,
    location,
    sort,
    playerRange,
    timePreset,
    minRating,
  ]);

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sort);

  const filterPanel = (
    <div className={styles.filterPanel}>
      <div className={styles.filterGroup}>
        <SearchBar value={search} onChange={setSearch} />
      </div>

      <div className={styles.filterGroup}>
        <span className={styles.filterLabel}>Disponibilidad</span>
        <FilterControl value={filter} onChange={setFilter} />
      </div>

      <div className={styles.filterGroup}>
        <span className={styles.filterLabel}>Ubicación</span>
        <div className="filter-control" role="group" aria-label="Ubicación">
          {LOCATION_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={location === option.value ? "active" : ""}
              onClick={() => setLocation(option.value)}
              aria-pressed={location === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {hasPlayerData && (
        <div className={styles.filterGroup}>
          <RangeSlider
            label="Jugadores"
            min={PLAYER_BOUNDS[0]}
            max={PLAYER_BOUNDS[1]}
            value={playerRange}
            onValueChange={setPlayerRange}
            formatValue={formatPlayer}
          />
        </div>
      )}

      {hasTimeData && (
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Tiempo de juego</span>
          <div className="filter-control" role="group" aria-label="Tiempo de juego">
            {TIME_PRESETS.map((preset) => (
              <button
                key={preset.value}
                className={timePreset === preset.value ? "active" : ""}
                onClick={() => setTimePreset(preset.value)}
                aria-pressed={timePreset === preset.value}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={styles.filterGroup}>
        <label className={styles.filterLabel} htmlFor="min-rating-input">
          Valoración mínima: {minRating.toFixed(1)}
        </label>
        <input
          id="min-rating-input"
          type="range"
          className={styles.ratingSlider}
          min={0}
          max={10}
          step={0.1}
          value={minRating}
          onChange={(e) => setMinRating(Number(e.target.value))}
        />
      </div>

      <div className={styles.filterGroup}>
        <span className={styles.filterLabel}>Ordenar</span>
        <div className={styles.sortWrapper} ref={sortRef}>
          <Button
            variant="secondary"
            onClick={() => setSortOpen((prev) => !prev)}
            aria-haspopup="listbox"
            aria-expanded={sortOpen}
            className={styles.sortButton}
          >
            {currentSortLabel ? currentSortLabel.label : "Ordenar"}
            <span className={styles.sortChevron} aria-hidden="true">▾</span>
          </Button>
          {sortOpen && (
            <div className={styles.sortPanel} role="listbox" aria-label="Ordenar">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  className={[
                    styles.sortOption,
                    sort === option.value && styles.sortOptionSelected,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-selected={sort === option.value}
                  onClick={() => handleSortSelect(option.value)}
                >
                  <span className={styles.sortRadio} aria-hidden="true">
                    {sort === option.value ? "●" : "○"}
                  </span>
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.message}>Cargando juegos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <p className={styles.message}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          {mode === "public" ? "Ludoteca del Refugio" : "Catálogo de juegos"}
        </h1>
        {mode === "public" && (
          <a className={styles.loginLink} href="/prestamos/login">
            Iniciar sesión
          </a>
        )}
      </header>

      <div className={styles.layout}>
        {isDesktop ? (
          <aside className={styles.sidebar}>{filterPanel}</aside>
        ) : (
          <div className={styles.mobileToolbar}>
            <Button
              variant="secondary"
              onClick={() => setSheetOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={sheetOpen}
            >
              Filtros
            </Button>
          </div>
        )}

        <section className={styles.results}>
          <ActiveFilterChips
            search={search}
            filter={filter}
            location={location}
            timePreset={timePreset}
            minRating={minRating}
            playerRange={playerRange}
            playerBounds={PLAYER_BOUNDS}
            onClearSearch={() => setSearch("")}
            onClearFilter={() => setFilter("all")}
            onClearLocation={() => setLocation("all")}
            onClearTimePreset={() => setTimePreset("all")}
            onClearMinRating={() => setMinRating(0)}
            onClearPlayerRange={() => setPlayerRange(PLAYER_BOUNDS)}
          />

          {filteredGames.length === 0 ? (
            <p className={styles.message}>No se han encontrado juegos.</p>
          ) : (
            <div className={styles.grid}>
              {filteredGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onAction={refetch}
                  mode={mode}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {!isDesktop && (
        <DialogRoot open={sheetOpen} onOpenChange={setSheetOpen}>
          <DialogContent className={styles.bottomSheet}>
            <DialogTitle className={styles.sheetTitle}>Filtros</DialogTitle>
            <div className={styles.sheetBody}>{filterPanel}</div>
            <div className={styles.sheetFooter}>
              <Button onClick={() => setSheetOpen(false)}>Aplicar</Button>
            </div>
          </DialogContent>
        </DialogRoot>
      )}
    </div>
  );
}
