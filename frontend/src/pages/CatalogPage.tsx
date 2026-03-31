import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGames } from "../hooks/useGames";
import { GameCard } from "../components/GameCard";
import { SearchBar } from "../components/SearchBar";
import { FilterControl, type FilterValue } from "../components/FilterControl";
import type { GameWithStatus } from "../types/game";
import "./CatalogPage.css";

type SortValue = "name-asc" | "name-desc" | "rating" | "players" | "time";
type LocationValue = "all" | "armari" | "soterrani";
type TimePreset = "all" | "lt30" | "30to60" | "1to2h" | "2hplus";

const SORT_OPTIONS: readonly { readonly value: SortValue; readonly i18nKey: string }[] = [
  { value: "name-asc", i18nKey: "catalog.sortName" },
  { value: "name-desc", i18nKey: "catalog.sortNameDesc" },
  { value: "rating", i18nKey: "catalog.sortRating" },
  { value: "players", i18nKey: "catalog.sortPlayers" },
  { value: "time", i18nKey: "catalog.sortTime" },
];

const LOCATION_KEYS: readonly { readonly value: LocationValue; readonly i18nKey: string }[] = [
  { value: "all", i18nKey: "catalog.locationAll" },
  { value: "armari", i18nKey: "catalog.locationArmari" },
  { value: "soterrani", i18nKey: "catalog.locationSoterrani" },
];

const TIME_PRESETS: readonly { readonly value: TimePreset; readonly i18nKey: string }[] = [
  { value: "all", i18nKey: "catalog.timeAll" },
  { value: "lt30", i18nKey: "catalog.timeLess30" },
  { value: "30to60", i18nKey: "catalog.time30to60" },
  { value: "1to2h", i18nKey: "catalog.time1to2h" },
  { value: "2hplus", i18nKey: "catalog.time2hPlus" },
];

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

export function CatalogPage() {
  const { games, loading, error, refetch } = useGames();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");
  const [location, setLocation] = useState<LocationValue>("all");
  const [sort, setSort] = useState<SortValue>("name-asc");
  const [sortOpen, setSortOpen] = useState(false);
  const [playersMin, setPlayersMin] = useState("");
  const [playersMax, setPlayersMax] = useState("");
  const [timePreset, setTimePreset] = useState<TimePreset>("all");
  const [minRating, setMinRating] = useState(0);
  const { t } = useTranslation();
  const sortRef = useRef<HTMLDivElement>(null);

  const hasPlayerData = useMemo(
    () => games.some((g) => g.min_players > 0),
    [games],
  );
  const hasTimeData = useMemo(
    () => games.some((g) => g.playing_time > 0),
    [games],
  );

  // Close sort dropdown on outside click
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
    let result: readonly GameWithStatus[] = games;

    // Availability filter
    if (filter === "available") {
      result = result.filter((g) => g.status === "available");
    } else if (filter === "lent") {
      result = result.filter((g) => g.status === "lent");
    }

    // Location filter
    if (location !== "all") {
      result = result.filter((g) => g.location === location);
    }

    // Search filter
    if (search.trim() !== "") {
      const query = search.trim().toLowerCase();
      result = result.filter((g) => g.name.toLowerCase().includes(query));
    }

    // Player count filter
    const pMin = playersMin === "" ? 0 : Number(playersMin);
    const pMax = playersMax === "" ? 0 : Number(playersMax);
    if (pMin > 0 || pMax > 0) {
      result = result.filter((g) => {
        if (g.min_players <= 0 && g.max_players <= 0) return false;
        if (pMax > 0 && g.min_players > pMax) return false;
        if (pMin > 0 && g.max_players < pMin) return false;
        return true;
      });
    }

    // Time preset filter
    if (timePreset !== "all") {
      result = result.filter((g) => matchesTimePreset(g.playing_time, timePreset));
    }

    // Rating filter
    if (minRating > 0) {
      result = result.filter((g) => g.bgg_rating >= minRating);
    }

    // Sort
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
      case "players":
        sorted.sort((a, b) => a.min_players - b.min_players);
        break;
      case "time":
        sorted.sort((a, b) => a.playing_time - b.playing_time);
        break;
    }

    return sorted;
  }, [games, search, filter, location, sort, playersMin, playersMax, timePreset, minRating]);

  if (loading) {
    return (
      <div className="catalog-page">
        <p className="catalog-loading">{t("catalog.loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="catalog-page">
        <p className="catalog-error">{error}</p>
      </div>
    );
  }

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sort);

  return (
    <div className="catalog-page">
      <div className="catalog-header">
        <h1>{t("catalog.title")}</h1>

        {/* Row 1: Search + Sort */}
        <div className="catalog-controls">
          <SearchBar value={search} onChange={setSearch} />
          <div className="catalog-sort-wrapper" ref={sortRef}>
            <button
              className="catalog-sort-btn"
              onClick={() => setSortOpen((prev) => !prev)}
              aria-haspopup="listbox"
              aria-expanded={sortOpen}
            >
              <span className="catalog-sort-icon" aria-hidden="true">⇅</span>
              {currentSortLabel ? t(currentSortLabel.i18nKey) : t("catalog.sortLabel")}
            </button>
            {sortOpen && (
              <div className="catalog-sort-panel" role="listbox" aria-label={t("catalog.sortLabel")}>
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    role="option"
                    className={`catalog-sort-option${sort === option.value ? " selected" : ""}`}
                    aria-selected={sort === option.value}
                    onClick={() => handleSortSelect(option.value)}
                  >
                    <span className="catalog-sort-radio" aria-hidden="true">
                      {sort === option.value ? "●" : "○"}
                    </span>
                    {t(option.i18nKey)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Availability + Location */}
        <div className="catalog-filters">
          <FilterControl value={filter} onChange={setFilter} />
          <div className="filter-control" role="group" aria-label={t("catalog.locationAll")}>
            {LOCATION_KEYS.map((option) => (
              <button
                key={option.value}
                className={location === option.value ? "active" : ""}
                onClick={() => setLocation(option.value)}
                aria-pressed={location === option.value}
              >
                {t(option.i18nKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Players + Time + Rating */}
        <div className="catalog-filters-row3">
          <div className="catalog-filter-group">
            <label className="catalog-filter-label">{t("catalog.players")}</label>
            <div className="catalog-players-inputs">
              <input
                type="number"
                className="catalog-number-input"
                placeholder={t("catalog.playersMin")}
                min={0}
                value={playersMin}
                onChange={(e) => setPlayersMin(e.target.value)}
                aria-label={t("catalog.playersMin")}
              />
              <span className="catalog-range-sep">–</span>
              <input
                type="number"
                className="catalog-number-input"
                placeholder={t("catalog.playersMax")}
                min={0}
                value={playersMax}
                onChange={(e) => setPlayersMax(e.target.value)}
                aria-label={t("catalog.playersMax")}
              />
            </div>
          </div>

          <div className="catalog-filter-group">
            <label className="catalog-filter-label">{t("catalog.sortTime")}</label>
            <div className="filter-control" role="group" aria-label={t("catalog.sortTime")}>
              {TIME_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  className={timePreset === preset.value ? "active" : ""}
                  onClick={() => setTimePreset(preset.value)}
                  aria-pressed={timePreset === preset.value}
                >
                  {t(preset.i18nKey)}
                </button>
              ))}
            </div>
          </div>

          <div className="catalog-filter-group">
            <label className="catalog-filter-label" htmlFor="min-rating-input">
              {t("catalog.minRating")}: {minRating.toFixed(1)}
            </label>
            <input
              id="min-rating-input"
              type="range"
              className="catalog-rating-slider"
              min={0}
              max={10}
              step={0.1}
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {filteredGames.length === 0 ? (
        <p className="catalog-empty">{t("catalog.empty")}</p>
      ) : (
        <div className="catalog-grid">
          {filteredGames.map((game) => (
            <GameCard key={game.id} game={game} onAction={refetch} />
          ))}
        </div>
      )}
    </div>
  );
}
