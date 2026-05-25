import { createContext } from "react";
import type { CurrentMember } from "../types/member";

export interface AuthState {
  readonly member: CurrentMember | null;
  readonly loading: boolean;
  readonly login: (email: string, password: string) => Promise<void>;
  readonly logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);
