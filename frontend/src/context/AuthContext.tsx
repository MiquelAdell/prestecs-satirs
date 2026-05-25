import { useEffect, useState, type ReactNode } from "react";
import { apiFetch } from "../api/client";
import type { CurrentMember } from "../types/member";
import { AuthContext } from "./auth-context";

const SESSION_KEY = "prestamos_session";

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const [member, setMember] = useState<CurrentMember | null>(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(SESSION_KEY)));

  useEffect(() => {
    if (!localStorage.getItem(SESSION_KEY)) {
      return;
    }
    apiFetch<CurrentMember>("/me")
      .then(setMember)
      .catch(() => {
        localStorage.removeItem(SESSION_KEY);
        setMember(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    await apiFetch<{ ok: boolean }>("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem(SESSION_KEY, "1");
    const me = await apiFetch<CurrentMember>("/me");
    setMember(me);
  };

  const logout = async () => {
    await apiFetch<{ ok: boolean }>("/logout", { method: "POST" });
    localStorage.removeItem(SESSION_KEY);
    setMember(null);
  };

  return (
    <AuthContext.Provider value={{ member, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
