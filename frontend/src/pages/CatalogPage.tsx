import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGames } from "../hooks/useGames";
import { GameCard } from "../components/GameCard";
import { SearchBar } from "../components/SearchBar";
import { FilterControl, type FilterValue } from "../components/FilterControl";
import type { GameWithStatus } from "../types/game";
import "./CatalogPage.css";

type SortValue = "name-asc" | "name-desc" | "rating" | "players" | "time";
type LocationValue = "all" | "armari" | "soterrani";

const LOCATION_KEYS: readonly { readonly value: LocationValue; readonly i18nKey: string }[] = [
  { value: "all", i18nKey: "catalog.locationAll" },
  { value: "armari", i18nKey: "catalog.locationArmari" },
  { value: "soterrani", i18nKey: "catalog.locationSoterrani" },
];

export function CatalogPage() {
  const { games, loading, error, refetch } = useGames();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");
  const [location, setLocation] = useState<LocationValue>("all");
  const [sort, setSort] = useState<SortValue>("name-asc");
  const { t } = useTranslation();

  const filteredGames = useMemo(() => {
    let result: readonly GameWithStatus[] = games;

    if (filter === "available") {
      result = result.filter((g) => g.status === "available");
    } else if (filter === "lent") {
      result = result.filter((g) => g.status === "lent");
    }

    if (location !== "all") {
      result = result.filter((g) => g.location === location);
    }

    if (search.trim() !== "") {
      const query = search.trim().toLowerCase();
      result = result.filter((g) => g.name.toLowerCase().includes(query));
    }

    const sorted = [...result];
    switch (sort) {
      case "name-asc":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        sorted.sort((a, b) => b.name.localeCompare(a.name));
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
  }, [games, search, filter, location, sort]);

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

  return (
    <div className="catalog-page">
      <div className="catalog-header">
        <h1>{t("catalog.title")}</h1>
        <div className="catalog-controls">
          <SearchBar value={search} onChange={setSearch} />
          <select
            className="catalog-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortValue)}
            aria-label={t("catalog.sortLabel")}
          >
            <option value="name-asc">{t("catalog.sortName")}</option>
            <option value="name-desc">{t("catalog.sortNameDesc")}</option>
            <option value="rating">{t("catalog.sortRating")}</option>
            <option value="players">{t("catalog.sortPlayers")}</option>
            <option value="time">{t("catalog.sortTime")}</option>
          </select>
        </div>
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
