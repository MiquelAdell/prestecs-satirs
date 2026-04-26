import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useGameHistory } from "../hooks/useGameHistory";
import { apiFetch } from "../api/client";
import { LoanHistoryEntry } from "../components/LoanHistoryEntry";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import styles from "./GameDetailPage.module.css";

export type GameDetailPageMode = "member" | "public";

export interface GameDetailPageProps {
  readonly mode?: GameDetailPageMode;
}

export function GameDetailPage({ mode = "member" }: GameDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const { game, history, loading, error, refetch } = useGameHistory(id);
  const { member } = useAuth();
  const [confirmAction, setConfirmAction] = useState<"borrow" | "return" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.message}>Cargando...</p>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className={styles.page}>
        <Link to="/" className={styles.backLink}>
          &larr; Volver al catálogo
        </Link>
        <p className={styles.message}>{error ?? "Juego no encontrado."}</p>
      </div>
    );
  }

  const isPublic = mode === "public";
  const isAvailable = game.status === "available";
  const canBorrow = !isPublic && member !== null && isAvailable;
  const canReturn =
    !isPublic &&
    member !== null &&
    !isAvailable &&
    game.loan_id !== null &&
    (member.is_admin || game.borrower_display_name === member.display_name);

  const handleBorrow = async () => {
    setActionLoading(true);
    try {
      await apiFetch<unknown>("/loans", {
        method: "POST",
        body: JSON.stringify({ game_id: game.id }),
      });
      refetch();
    } catch {
      /* error handled silently */
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const handleReturn = async () => {
    setActionLoading(true);
    try {
      await apiFetch<unknown>(`/loans/${game.loan_id}/return`, {
        method: "PATCH",
      });
      refetch();
    } catch {
      /* error handled silently */
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const isGuest = isPublic || member === null;

  const renderActionArea = () => {
    if (canBorrow) {
      return (
        <Button
          variant="primary"
          size="lg"
          onClick={() => setConfirmAction("borrow")}
          disabled={actionLoading}
        >
          Tomar prestado
        </Button>
      );
    }
    if (!isAvailable) {
      return (
        <div className={styles.lentBlock}>
          <span
            className={styles.lentIndicator}
            aria-label="Estado del juego: prestado"
          >
            Prestado
          </span>
          {game.borrower_display_name && (
            <span className={styles.lentBy}>
              {`Actualmente prestado a ${game.borrower_display_name}`}
            </span>
          )}
          {canReturn && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => setConfirmAction("return")}
              disabled={actionLoading}
            >
              Devolver
            </Button>
          )}
        </div>
      );
    }
    if (isGuest) {
      return (
        <a className={styles.loginLink} href="/prestamos/login">
          Iniciar sesión para tomar prestado
        </a>
      );
    }
    return null;
  };

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.backLink}>
        &larr; Volver al catálogo
      </Link>

      <Card className={styles.hero}>
        <div className={styles.coverColumn}>
          {(game.image_url || game.thumbnail_url) ? (
            <img
              className={styles.cover}
              src={game.image_url || game.thumbnail_url}
              alt={game.name}
            />
          ) : (
            <div className={`${styles.cover} ${styles.coverPlaceholder}`}>
              <span aria-hidden="true">{game.name.charAt(0)}</span>
            </div>
          )}
        </div>
        <div className={styles.infoColumn}>
          <h1 className={styles.title}>{game.name}</h1>
          <div className={styles.metaRow}>
            {game.year_published > 0 && (
              <span className={styles.year}>{game.year_published}</span>
            )}
            <Badge variant={isAvailable ? "available" : "lent"}>
              {isAvailable ? "Disponible" : "Prestado"}
            </Badge>
            {game.bgg_rating > 0 && (
              <Badge variant="rating">
                {`★ ${game.bgg_rating.toFixed(1)}`}
              </Badge>
            )}
          </div>
          <div className={styles.attrList}>
            {game.min_players > 0 && game.max_players > 0 && (
              <span>{`${game.min_players}–${game.max_players} jugadores`}</span>
            )}
            {game.playing_time > 0 && (
              <span>{`${game.playing_time} min`}</span>
            )}
            {game.location && (
              <span>{`Ubicación: ${game.location === "armari" ? "Armario" : game.location === "soterrani" ? "Sótano" : game.location}`}</span>
            )}
          </div>
          <div className={styles.bggLink}>
            <a
              href={`https://boardgamegeek.com/boardgame/${game.bgg_id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver en BoardGameGeek
            </a>
          </div>
          <div className={styles.actionArea}>{renderActionArea()}</div>
        </div>
      </Card>

      <Card className={styles.historySection}>
        <h2 className={styles.historyTitle}>Historial de préstamos</h2>
        {history.length === 0 ? (
          <p className={styles.message}>Este juego nunca ha sido prestado.</p>
        ) : (
          <div className={styles.historyList}>
            {history.map((entry, i) => (
              <LoanHistoryEntry key={i} entry={entry} />
            ))}
          </div>
        )}
      </Card>

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
