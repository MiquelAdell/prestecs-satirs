import { useCallback, useEffect, useReducer } from "react";
import { apiFetch } from "../api/client";
import type { GameWithStatus } from "../types/game";

interface State {
  readonly games: readonly GameWithStatus[];
  readonly loading: boolean;
  readonly error: string | null;
}

type Action =
  | { readonly type: "start" }
  | { readonly type: "success"; readonly games: readonly GameWithStatus[] }
  | { readonly type: "error"; readonly error: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "start":
      return { ...state, loading: true, error: null };
    case "success":
      return { games: action.games, loading: false, error: null };
    case "error":
      return { ...state, loading: false, error: action.error };
  }
}

interface UseGamesResult extends State {
  readonly refetch: () => void;
}

export function useGames(): UseGamesResult {
  const [state, dispatch] = useReducer(reducer, {
    games: [],
    loading: true,
    error: null,
  });

  const fetchGames = useCallback(() => {
    dispatch({ type: "start" });
    apiFetch<readonly GameWithStatus[]>("/juegos")
      .then((games) => dispatch({ type: "success", games }))
      .catch((err: Error) => dispatch({ type: "error", error: err.message }));
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  return { ...state, refetch: fetchGames };
}
