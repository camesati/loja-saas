import { createContext, useContext, useState, useEffect } from "react";
import { signIn, signUp, signOut } from "../config/supabase";

const AuthContext = createContext(null);

const SESSION_KEY = "sb_session";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) setSession(JSON.parse(stored));
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await signIn(email, password);
    const sess = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: data.user,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sess));
    setSession(sess);
    return sess;
  };

  const register = async (email, password, fullName) => {
    const data = await signUp(email, password, fullName);
    if (data.access_token) {
      const sess = { access_token: data.access_token, refresh_token: data.refresh_token, user: data.user };
      localStorage.setItem(SESSION_KEY, JSON.stringify(sess));
      setSession(sess);
    }
    return data;
  };

  const logout = async () => {
    if (session?.access_token) await signOut(session.access_token).catch(() => {});
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
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
