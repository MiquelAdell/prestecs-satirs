import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGameHistory } from "../hooks/useGameHistory";
import { LoanHistoryEntry } from "../components/LoanHistoryEntry";
import "./GameDetailPage.css";

export function GameDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { game, history, loading, error } = useGameHistory(id);
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="game-detail-page">
        <p className="game-detail-loading">{t("gameDetail.loading")}</p>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="game-detail-page">
        <Link to="/" className="game-detail-back">
          &larr; {t("gameDetail.backToCatalog")}
        </Link>
        <p className="game-detail-error">{error ?? t("gameDetail.notFound")}</p>
      </div>
    );
  }

  return (
    <div className="game-detail-page">
      <Link to="/" className="game-detail-back">
        &larr; {t("gameDetail.backToCatalog")}
      </Link>

      <div className="game-detail-header">
        <img
          className="game-detail-thumbnail"
          src={game.image_url || game.thumbnail_url}
          alt={game.name}
        />
        <div className="game-detail-info">
          <h1>{game.name}</h1>
          <div className="game-detail-year">{game.year_published}</div>
          <span className={`game-detail-status ${game.status}`}>
            {game.status === "available"
              ? t("game.available")
              : t("game.lentTo", { name: game.borrower_display_name })}
          </span>
          <div className="game-detail-bgg">
            <a
              href={`https://boardgamegeek.com/boardgame/${game.bgg_id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("gameDetail.viewOnBGG")}
            </a>
          </div>
        </div>
      </div>

      <div className="game-detail-history">
        <h2>{t("gameDetail.historyTitle")}</h2>
        {history.length === 0 ? (
          <p className="game-detail-no-history">
            {t("gameDetail.noHistory")}
          </p>
        ) : (
          <div className="game-detail-history-list">
            {history.map((entry, i) => (
              <LoanHistoryEntry key={i} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
