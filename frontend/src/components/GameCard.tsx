import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/client";
import { ConfirmDialog } from "./ConfirmDialog";
import { Button } from "../ui/Button";
import type { GameWithStatus } from "../types/game";
import "./GameCard.css";

interface GameCardProps {
  readonly game: GameWithStatus;
  readonly onAction: () => void;
}

export function GameCard({ game, onAction }: GameCardProps) {
  const { member } = useAuth();
  const [confirmAction, setConfirmAction] = useState<"borrow" | "return" | null>(null);
  const [loading, setLoading] = useState(false);

  const canBorrow = member !== null && game.status === "available";
  const canReturn =
    member !== null &&
    game.status === "lent" &&
    game.loan_id !== null &&
    (member.is_admin || game.borrower_display_name === member.display_name);

  const handleBorrow = async () => {
    setLoading(true);
    try {
      await apiFetch<unknown>("/loans", {
        method: "POST",
        body: JSON.stringify({ game_id: game.id }),
      });
      onAction();
    } catch {
      /* error handled silently — game list will refetch */
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  };

  const handleReturn = async () => {
    setLoading(true);
    try {
      await apiFetch<unknown>(`/loans/${game.loan_id}/return`, {
        method: "PATCH",
      });
      onAction();
    } catch {
      /* error handled silently — game list will refetch */
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  };

  return (
    <div className="game-card">
      <Link to={`/games/${game.id}`} className="game-card-link">
        <div className="game-card-thumbnail-wrapper">
          {game.thumbnail_url ? (
            <img
              className="game-card-thumbnail"
              src={game.thumbnail_url}
              alt={game.name}
              loading="lazy"
            />
          ) : (
            <div className="game-card-thumbnail game-card-placeholder">
              <span>{game.name.charAt(0)}</span>
            </div>
          )}
          {game.bgg_rating > 0 && (
            <span className="game-card-rating">
              {`${game.bgg_rating.toFixed(1)} ★`}
            </span>
          )}
        </div>
        <div className="game-card-body">
          <div className="game-card-name">{game.name}</div>
          {game.year_published > 0 && (
            <div className="game-card-year">{game.year_published}</div>
          )}
          <div className="game-card-meta">
            {game.min_players > 0 && game.max_players > 0 && (
              <span className="game-card-players">
                {`${game.min_players}-${game.max_players} jugadores`}
              </span>
            )}
            {game.playing_time > 0 && (
              <span className="game-card-time">
                {`${game.playing_time} min`}
              </span>
            )}
          </div>
          <span className={`game-card-status ${game.status}`}>
            {game.status === "available"
              ? "Disponible"
              : `Prestado a ${game.borrower_display_name}`}
          </span>
        </div>
      </Link>

      <div className="game-card-actions">
        {canBorrow && (
          <Button
            variant="primary"
            onClick={() => setConfirmAction("borrow")}
            disabled={loading}
          >
            Tomar prestado
          </Button>
        )}
        {canReturn && (
          <Button
            variant="secondary"
            onClick={() => setConfirmAction("return")}
            disabled={loading}
          >
            Devolver
          </Button>
        )}
      </div>

      {confirmAction === "borrow" && (
        <ConfirmDialog
          message={`¿Quieres tomar prestado "${game.name}"?`}
          onConfirm={() => void handleBorrow()}
          onCancel={() => setConfirmAction(null)}
          confirmLabel="Tomar prestado"
        />
      )}

      {confirmAction === "return" && (
        <ConfirmDialog
          message={`¿Quieres devolver "${game.name}"?`}
          onConfirm={() => void handleReturn()}
          onCancel={() => setConfirmAction(null)}
          confirmLabel="Devolver"
        />
      )}
    </div>
  );
}
