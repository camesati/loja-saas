const SUPABASE_URL = "https://tfzjctogkcmjtthvsvph.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmempjdG9na2NtanR0aHZzdnBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MDczNzQsImV4cCI6MjA5NDE4MzM3NH0.WraDMwj6oVUhJD2QfzZ9DRdjXy86fRriFycovxwzDW4";

const getHeaders = (token, extra = {}) => ({
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
  ...extra,
});

export const supaFetch = async (path, { method = "GET", body, token, prefer } = {}) => {
  const extra = prefer ? { Prefer: prefer } : {};
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: getHeaders(token, extra),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Erro na requisição");
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

export const db = {
  get: (table, query, token) =>
    supaFetch(`/rest/v1/${table}?${query}`, { token }),
  post: (table, body, token) =>
    supaFetch(`/rest/v1/${table}`, { method: "POST", body, token, prefer: "return=representation" }),
  patch: (table, id, body, token) =>
    supaFetch(`/rest/v1/${table}?id=eq.${id}`, { method: "PATCH", body, token, prefer: "return=representation" }),
  del: (table, id, token) =>
    supaFetch(`/rest/v1/${table}?id=eq.${id}`, { method: "DELETE", token }),
};

// Auth
export const signIn = async (email, password) => {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error_description || err.message || "Credenciais inválidas");
  }
  return res.json();
};

export const signUp = async (email, password, fullName) => {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, data: { full_name: fullName } }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Erro ao criar conta");
  }
  return res.json();
};

export const signOut = async (token) => {
  await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
    method: "POST",
    headers: getHeaders(token),
  });
};

export const resetPassword = async (email) => {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error("Erro ao enviar email de recuperação");
};

export { SUPABASE_URL, SUPABASE_ANON_KEY };
