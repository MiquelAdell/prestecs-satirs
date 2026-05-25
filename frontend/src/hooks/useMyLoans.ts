import { useCallback, useEffect, useReducer } from "react";
import { apiFetch } from "../api/client";
import type { ActiveLoan } from "../types/loan";

interface State {
  readonly loans: readonly ActiveLoan[];
  readonly loading: boolean;
  readonly error: string | null;
}

type Action =
  | { readonly type: "start" }
  | { readonly type: "success"; readonly loans: readonly ActiveLoan[] }
  | { readonly type: "error"; readonly error: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "start":
      return { ...state, loading: true, error: null };
    case "success":
      return { loans: action.loans, loading: false, error: null };
    case "error":
      return { ...state, loading: false, error: action.error };
  }
}

interface UseMyLoansResult extends State {
  readonly refetch: () => void;
}

export function useMyLoans(): UseMyLoansResult {
  const [state, dispatch] = useReducer(reducer, {
    loans: [],
    loading: true,
    error: null,
  });

  const fetchLoans = useCallback(() => {
    dispatch({ type: "start" });
    apiFetch<readonly ActiveLoan[]>("/my-loans")
      .then((loans) => dispatch({ type: "success", loans }))
      .catch((err: Error) => dispatch({ type: "error", error: err.message }));
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  return { ...state, refetch: fetchLoans };
}
