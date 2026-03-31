import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import type { ActiveLoan } from "../types/loan";

interface UseMyLoansResult {
  readonly loans: readonly ActiveLoan[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly refetch: () => void;
}

export function useMyLoans(): UseMyLoansResult {
  const [loans, setLoans] = useState<readonly ActiveLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLoans = useCallback(() => {
    setLoading(true);
    setError(null);
    apiFetch<readonly ActiveLoan[]>("/my-loans")
      .then(setLoans)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  return { loans, loading, error, refetch: fetchLoans };
}
