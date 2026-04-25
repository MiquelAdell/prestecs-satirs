import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/client";
import { ConfirmDialog } from "./ConfirmDialog";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import type { GameWithStatus } from "../types/game";
import styles from "./GameCard.module.css";

export type GameCardMode = "member" | "public";

interface GameCardProps {
  readonly game: GameWithStatus;
  readonly onAction: () => void;
  readonly mode?: GameCardMode;
}

export function GameCard({ game, onAction, mode = "member" }: GameCardProps) {
  const { member } = useAuth();
  const [confirmAction, setConfirmAction] = useState<"borrow" | "return" | null>(null);
  const [loading, setLoading] = useState(false);

  const isPublic = mode === "public";
  const canBorrow =
    !isPublic && member !== null && game.status === "available";
  const canReturn =
    !isPublic &&
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

  const availabilityLabel =
    game.status === "available" ? "Disponible" : "Prestado";
  const showActions = canBorrow || canReturn;

  return (
    <Card className={styles.card}>
      <Link to={`/games/${game.id}`} className={styles.link}>
        <div className={styles.cover}>
          {game.thumbnail_url ? (
            <img
              className={styles.coverImage}
              src={game.thumbnail_url}
              alt={game.name}
              loading="lazy"
            />
          ) : (
            <div className={`${styles.coverImage} ${styles.coverPlaceholder}`}>
              <span aria-hidden="true">{game.name.charAt(0)}</span>
            </div>
          )}
          <div className={styles.badgeAvailability}>
            <Badge
              variant={game.status === "available" ? "available" : "lent"}
            >
              {availabilityLabel}
            </Badge>
          </div>
          {game.bgg_rating > 0 && (
            <div className={styles.badgeRating}>
              <Badge variant="rating">{`★ ${game.bgg_rating.toFixed(1)}`}</Badge>
            </div>
          )}
        </div>
        <div className={styles.body}>
          <h3 className={styles.name}>{game.name}</h3>
          {game.year_published > 0 && (
            <div className={styles.year}>{game.year_published}</div>
          )}
          <div className={styles.meta}>
            {game.min_players > 0 && game.max_players > 0 && (
              <span className={styles.metaItem}>
                {`${game.min_players}–${game.max_players} jugadores`}
              </span>
            )}
            {game.playing_time > 0 && (
              <span className={styles.metaItem}>{`${game.playing_time} min`}</span>
            )}
          </div>
          {game.status === "lent" && game.borrower_display_name && (
            <div className={styles.lender}>
              {`Prestado a ${game.borrower_display_name}`}
            </div>
          )}
        </div>
      </Link>

      {showActions && (
        <div className={styles.actions}>
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
      )}

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
    </Card>
  );
}
