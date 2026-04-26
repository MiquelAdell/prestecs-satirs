import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import type { LoanHistoryEntry } from "../types/loan";
import type { GameWithStatus } from "../types/game";

interface UseGameHistoryResult {
  readonly game: GameWithStatus | null;
  readonly history: readonly LoanHistoryEntry[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly refetch: () => void;
}

export function useGameHistory(gameId: string | undefined): UseGameHistoryResult {
  const [game, setGame] = useState<GameWithStatus | null>(null);
  const [history, setHistory] = useState<readonly LoanHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(() => {
    if (!gameId) {
      setLoading(false);
      setError("ID de juego no válido");
      return;
    }

    setLoading(true);
    setError(null);

    Promise.all([
      apiFetch<readonly GameWithStatus[]>("/games"),
      apiFetch<readonly LoanHistoryEntry[]>(`/games/${gameId}/history`),
    ])
      .then(([games, entries]) => {
        setGame(games.find((g) => g.id === Number(gameId)) ?? null);
        setHistory(entries);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [gameId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { game, history, loading, error, refetch: fetchAll };
}
