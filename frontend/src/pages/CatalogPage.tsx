import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGames } from "../hooks/useGames";
import { GameCard } from "../components/GameCard";
import { SearchBar } from "../components/SearchBar";
import { FilterControl, type FilterValue } from "../components/FilterControl";
import type { GameWithStatus } from "../types/game";
import "./CatalogPage.css";

export function CatalogPage() {
  const { games, loading, error, refetch } = useGames();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");
  const { t } = useTranslation();

  const filteredGames = useMemo(() => {
    let result: readonly GameWithStatus[] = games;

    if (filter === "available") {
      result = result.filter((g) => g.status === "available");
    } else if (filter === "lent") {
      result = result.filter((g) => g.status === "lent");
    }

    if (search.trim() !== "") {
      const query = search.trim().toLowerCase();
      result = result.filter((g) => g.name.toLowerCase().includes(query));
    }

    return result;
  }, [games, search, filter]);

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
          <FilterControl value={filter} onChange={setFilter} />
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
