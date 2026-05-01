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

export function useGameHistory(slug: string | undefined): UseGameHistoryResult {
  const [game, setGame] = useState<GameWithStatus | null>(null);
  const [history, setHistory] = useState<readonly LoanHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError("Identificador de juego no válido");
      return;
    }

    setLoading(true);
    setError(null);

    const fetchAll = async () => {
      const [games, entries] = await Promise.all([
        apiFetch<readonly GameWithStatus[]>("/juegos"),
        apiFetch<readonly LoanHistoryEntry[]>(`/juegos/${slug}/history`),
      ]);
      const found = games.find((g) => g.slug === slug) ?? null;
      setGame(found);
      setHistory(entries);
    };

    fetchAll()
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  return { game, history, loading, error };
}
