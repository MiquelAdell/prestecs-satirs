import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import type { LoanHistoryEntry } from "../types/loan";
import type { GameWithStatus } from "../types/game";

interface UseGameHistoryResult {
  readonly game: GameWithStatus | null;
  readonly history: readonly LoanHistoryEntry[];
  readonly loading: boolean;
  readonly error: string | null;
}

export function useGameHistory(gameId: string | undefined): UseGameHistoryResult {
  const [game, setGame] = useState<GameWithStatus | null>(null);
  const [history, setHistory] = useState<readonly LoanHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) {
      setLoading(false);
      setError("ID de joc no vàlid");
      return;
    }

    setLoading(true);
    setError(null);

    const fetchAll = async () => {
      const [games, entries] = await Promise.all([
        apiFetch<readonly GameWithStatus[]>("/games"),
        apiFetch<readonly LoanHistoryEntry[]>(`/games/${gameId}/history`),
      ]);
      const found = games.find((g) => g.id === Number(gameId)) ?? null;
      setGame(found);
      setHistory(entries);
    };

    fetchAll()
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [gameId]);

  return { game, history, loading, error };
}
