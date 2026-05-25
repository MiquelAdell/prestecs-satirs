import { useContext } from "react";
import { AuthContext } from "./auth-context";
import type { AuthState } from "./auth-context";

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
