import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { resetPassword } from "../config/supabase.js";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { login, register } = useAuth();
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", fullName: "" });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try { await login(form.email, form.password); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await register(form.email, form.password, form.fullName);
      setSuccess("Conta criada com sucesso!");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleRecover = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await resetPassword(form.email);
      setSuccess("Email de recuperação enviado!");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const changeTab = (t) => { setTab(t); setError(""); setSuccess(""); };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#F8FAFB" }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "#D6E8F7" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="#2C6FA8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="9,22 9,12 15,12 15,22" stroke="#2C6FA8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1
            className="text-xl font-bold"
            style={{ fontFamily: "'Montserrat', sans-serif", color: "#2C6FA8" }}
          >
            CAMESA
          </h1>
          <p className="text-sm text-muted mt-1">Sistema de gestão</p>
        </div>

        {/* Card */}
        <div className="card">
          {/* Tabs */}
          <div className="flex border-b border-border mb-5 -mx-5 px-5">
            {[["login","Entrar"],["register","Criar conta"],["recover","Recuperar"]].map(([k, l]) => (
              <button
                key={k}
                onClick={() => changeTab(k)}
                className="pb-3 text-sm mr-4 border-b-2 transition-colors"
                style={
                  tab === k
                    ? { borderColor: "#4A8FC1", color: "#4A8FC1", fontWeight: 600 }
                    : { borderColor: "transparent", color: "#8FA3B1" }
                }
              >
                {l}
              </button>
            ))}
          </div>

          {/* Alertas */}
          {error && (
            <div
              className="mb-4 px-4 py-3 rounded-xl text-sm"
              style={{ background: "#FEE2E2", border: "1.5px solid #FECACA", color: "#991B1B" }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              className="mb-4 px-4 py-3 rounded-xl text-sm"
              style={{ background: "#DCFCE7", border: "1.5px solid #BBF7D0", color: "#166534" }}
            >
              {success}
            </div>
          )}

          {/* Login */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="input-label">Email</label>
                <input type="email" value={form.email} onChange={set("email")} placeholder="seu@email.com" required />
              </div>
              <div className="form-group">
                <label className="input-label">Senha</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={form.password}
                    onChange={set("password")}
                    placeholder="••••••••"
                    required
                    style={{ paddingRight: "42px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn-primary w-full justify-center mt-1" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          )}

          {/* Cadastro */}
          {tab === "register" && (
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="input-label">Nome completo</label>
                <input type="text" value={form.fullName} onChange={set("fullName")} placeholder="Seu nome" required />
              </div>
              <div className="form-group">
                <label className="input-label">Email</label>
                <input type="email" value={form.email} onChange={set("email")} placeholder="seu@email.com" required />
              </div>
              <div className="form-group">
                <label className="input-label">Senha</label>
                <input type="password" value={form.password} onChange={set("password")} placeholder="Mínimo 6 caracteres" required minLength={6} />
              </div>
              <button type="submit" className="btn-primary w-full justify-center mt-1" disabled={loading}>
                {loading ? "Criando conta..." : "Criar conta"}
              </button>
            </form>
          )}

          {/* Recuperar */}
          {tab === "recover" && (
            <form onSubmit={handleRecover} className="flex flex-col gap-4">
              <p className="text-sm text-muted">
                Informe seu email e enviaremos um link para redefinir sua senha.
              </p>
              <div className="form-group">
                <label className="input-label">Email</label>
                <input type="email" value={form.email} onChange={set("email")} placeholder="seu@email.com" required />
              </div>
              <button type="submit" className="btn-primary w-full justify-center mt-1" disabled={loading}>
                {loading ? "Enviando..." : "Enviar email"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
