import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/client";
import { ConfirmDialog } from "./ConfirmDialog";
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
        <img
          className="game-card-thumbnail"
          src={game.thumbnail_url}
          alt={game.name}
          loading="lazy"
        />
        <div className="game-card-body">
          <div className="game-card-name">{game.name}</div>
          <div className="game-card-year">{game.year_published}</div>
          <span className={`game-card-status ${game.status}`}>
            {game.status === "available"
              ? "Disponible"
              : `Prestat a ${game.borrower_display_name}`}
          </span>
        </div>
      </Link>

      <div className="game-card-actions">
        {canBorrow && (
          <button
            className="btn btn-primary"
            onClick={() => setConfirmAction("borrow")}
            disabled={loading}
          >
            Manllevar
          </button>
        )}
        {canReturn && (
          <button
            className="btn btn-secondary"
            onClick={() => setConfirmAction("return")}
            disabled={loading}
          >
            Retornar
          </button>
        )}
      </div>

      {confirmAction === "borrow" && (
        <ConfirmDialog
          message={`Vols manllevar "${game.name}"?`}
          onConfirm={() => void handleBorrow()}
          onCancel={() => setConfirmAction(null)}
          confirmLabel="Manllevar"
        />
      )}

      {confirmAction === "return" && (
        <ConfirmDialog
          message={`Vols retornar "${game.name}"?`}
          onConfirm={() => void handleReturn()}
          onCancel={() => setConfirmAction(null)}
          confirmLabel="Retornar"
        />
      )}
    </div>
  );
}
