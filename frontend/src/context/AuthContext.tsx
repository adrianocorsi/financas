import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import * as authApi from "../api/auth";
import { tokenStorage } from "../api/client";
import { User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Não há endpoint "me" na API — por isso o usuário fica só na memória/sessão do
// navegador enquanto o token existir; um F5 mantém o token mas perde `user.name`
// até novo login (ver README do frontend se isso incomodar e quiser um endpoint /auth/me).
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  async function signIn(email: string, password: string) {
    const loggedUser = await authApi.login(email, password);
    setUser(loggedUser);
  }

  async function signUp(name: string, email: string, password: string) {
    const newUser = await authApi.register(name, email, password);
    setUser(newUser);
  }

  function signOut() {
    authApi.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}

export function isAuthenticated(): boolean {
  return Boolean(tokenStorage.getAccessToken());
}
