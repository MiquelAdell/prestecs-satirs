import { useCallback, useEffect, useReducer } from "react";
import { apiFetch } from "../api/client";
import type { LoanHistoryEntry } from "../types/loan";
import type { GameWithStatus } from "../types/game";

interface State {
  readonly game: GameWithStatus | null;
  readonly history: readonly LoanHistoryEntry[];
  readonly loading: boolean;
  readonly error: string | null;
}

type Action =
  | { readonly type: "start" }
  | { readonly type: "success"; readonly game: GameWithStatus; readonly history: readonly LoanHistoryEntry[] }
  | { readonly type: "error"; readonly error: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "start":
      return { ...state, loading: true, error: null };
    case "success":
      return { game: action.game, history: action.history, loading: false, error: null };
    case "error":
      return { ...state, loading: false, error: action.error };
  }
}

interface UseGameHistoryResult extends State {
  readonly refetch: () => void;
}

export function useGameHistory(slug: string | undefined): UseGameHistoryResult {
  const [state, dispatch] = useReducer(reducer, {
    game: null,
    history: [],
    loading: true,
    error: null,
  });

  const fetchAll = useCallback(() => {
    if (!slug) {
      dispatch({ type: "error", error: "Identificador de juego no válido" });
      return;
    }

    dispatch({ type: "start" });

    Promise.all([
      apiFetch<GameWithStatus>(`/juegos/${slug}`),
      apiFetch<readonly LoanHistoryEntry[]>(`/juegos/${slug}/history`),
    ])
      .then(([game, history]) => dispatch({ type: "success", game, history }))
      .catch((err: Error) => dispatch({ type: "error", error: err.message }));
  }, [slug]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { ...state, refetch: fetchAll };
}
