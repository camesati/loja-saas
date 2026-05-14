import { createContext, useContext, useState, useEffect } from "react";
import { signIn, signUp, signOut, refreshToken, setTokenExpiredHandler } from "../config/supabase";

const AuthContext = createContext(null);

const SESSION_KEY = "sb_session";

const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // Margem de 30s para evitar uso de token na borda do vencimento
    return payload.exp * 1000 < Date.now() + 30_000;
  } catch {
    return true;
  }
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const applySession = (sess) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sess));
    setSession(sess);
    return sess;
  };

  const clearSession = () => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  };

  const doRefresh = async (stored) => {
    if (!stored?.refresh_token) return null;
    const data = await refreshToken(stored.refresh_token);
    if (!data?.access_token) return null;
    return applySession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: data.user ?? stored.user,
    });
  };

  // Registra o handler de token expirado para o supaFetch retentar chamadas automaticamente
  useEffect(() => {
    setTokenExpiredHandler(async () => {
      const stored = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      const refreshed = await doRefresh(stored);
      if (!refreshed) clearSession();
      return refreshed?.access_token ?? null;
    });
  }, []);

  // Ao iniciar, verifica se o token salvo ainda é válido; se não, tenta refresh
  useEffect(() => {
    const init = async () => {
      try {
        const stored = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
        if (!stored) return;

        if (!isTokenExpired(stored.access_token)) {
          setSession(stored);
          return;
        }

        // Token expirado — tenta renovar silenciosamente
        const refreshed = await doRefresh(stored);
        if (!refreshed) clearSession();
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const login = async (email, password) => {
    const data = await signIn(email, password);
    return applySession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: data.user,
    });
  };

  const register = async (email, password, fullName) => {
    const data = await signUp(email, password, fullName);
    if (data.access_token) {
      applySession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user: data.user,
      });
    }
    return data;
  };

  const logout = async () => {
    if (session?.access_token) await signOut(session.access_token).catch(() => {});
    clearSession();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
