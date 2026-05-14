import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { resetPassword } from "../config/supabase.js";
import { Eye, EyeOff, ArrowRight } from "lucide-react";

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login"); // login | register | recover
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", fullName: "" });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const reset = (m) => { setMode(m); setError(""); setSuccess(""); };

  const handleLogin = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try { await login(form.email, form.password); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try { await register(form.email, form.password, form.fullName); setSuccess("Conta criada com sucesso!"); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleRecover = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try { await resetPassword(form.email); setSuccess("Email de recuperação enviado!"); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: "var(--c-bg)",
        backgroundImage: "radial-gradient(var(--c-border) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      {/* Card principal */}
      <div
        className="card anim-in w-full overflow-hidden"
        style={{ maxWidth: "400px", borderRadius: "var(--radius-2xl)", padding: 0,
          boxShadow: "0 4px 24px rgba(42,63,82,0.08), 0 1px 4px rgba(42,63,82,0.06)" }}
      >
        {/* Cabeçalho da marca */}
        <div
          className="text-center border-b border-border"
          style={{ padding: "36px 36px 28px",
            background: "linear-gradient(160deg, var(--c-bg) 0%, var(--c-card) 100%)" }}
        >
          {/* Monograma */}
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 border border-border"
            style={{
              background: "var(--c-kpi-blue-bg)",
              boxShadow: "0 2px 8px rgba(4,116,175,0.12)",
            }}
          >
            <span
              className="font-display text-[28px] italic leading-none"
              style={{ color: "var(--c-accent)", fontWeight: 400 }}
            >C</span>
          </div>

          {/* Wordmark */}
          <div
            className="font-display text-[28px] italic leading-none mb-1.5"
            style={{ color: "var(--c-accent-deep)", fontWeight: 400, letterSpacing: ".03em" }}
          >
            Camesa
          </div>
          <div className="text-label" style={{ letterSpacing: ".12em" }}>
            a cara da sua casa
          </div>
        </div>

        {/* Corpo do formulário */}
        <div style={{ padding: "28px 36px 32px" }}>

          {/* Título do modo */}
          <div className="anim-in-1 mb-5">
            <h2 className="text-h1">
              {mode === "login"    && "Bem-vindo de volta"}
              {mode === "register" && "Criar conta"}
              {mode === "recover"  && "Recuperar acesso"}
            </h2>
            <p className="text-sm-ui mt-1">
              {mode === "login"    && "Acesse o painel de gestão"}
              {mode === "register" && "Preencha os dados abaixo"}
              {mode === "recover"  && "Enviaremos um link por email"}
            </p>
          </div>

          {/* Alertas */}
          {error && (
            <div
              className="anim-in rounded-xl text-[13px] mb-4"
              style={{ padding: "10px 14px", background: "var(--c-danger-bg)",
                border: "1.5px solid #FECACA", color: "#991B1B" }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              className="anim-in rounded-xl text-[13px] mb-4"
              style={{ padding: "10px 14px", background: "var(--c-success-bg)",
                border: "1.5px solid #A7F3D0", color: "#065F46" }}
            >
              {success}
            </div>
          )}

          {/* ── Login ─────────────────────────────── */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="anim-in-2 flex flex-col gap-3.5">
              <div className="form-group">
                <label className="input-label">Email</label>
                <input
                  type="email" value={form.email} onChange={set("email")}
                  placeholder="seu@email.com" required autoComplete="email"
                />
              </div>
              <div className="form-group">
                <label className="input-label">Senha</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={form.password} onChange={set("password")}
                    placeholder="••••••••" required
                    autoComplete="current-password"
                    style={{ paddingRight: "44px" }}
                  />
                  <button
                    type="button" onClick={() => setShowPass(p => !p)}
                    aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex text-muted hover:text-text transition-colors"
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className={`btn-primary w-full justify-center mt-1${loading ? " btn-loading" : ""}`}
                disabled={loading}
              >
                {!loading && (<>Entrar <ArrowRight size={15} /></>)}
              </button>

              <div className="flex justify-between mt-1">
                <button type="button" onClick={() => reset("register")}
                  className="text-accent text-[12.5px] font-semibold hover:text-accent-deep transition-colors"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  Criar conta
                </button>
                <button type="button" onClick={() => reset("recover")}
                  className="text-muted text-[12.5px] hover:text-text transition-colors"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  Esqueceu a senha?
                </button>
              </div>
            </form>
          )}

          {/* ── Cadastro ──────────────────────────── */}
          {mode === "register" && (
            <form onSubmit={handleRegister} className="anim-in-2 flex flex-col gap-3.5">
              <div className="form-group">
                <label className="input-label">Nome completo</label>
                <input type="text" value={form.fullName} onChange={set("fullName")}
                  placeholder="Seu nome" required autoComplete="name" />
              </div>
              <div className="form-group">
                <label className="input-label">Email</label>
                <input type="email" value={form.email} onChange={set("email")}
                  placeholder="seu@email.com" required autoComplete="email" />
              </div>
              <div className="form-group">
                <label className="input-label">Senha</label>
                <input type="password" value={form.password} onChange={set("password")}
                  placeholder="Mínimo 6 caracteres" required minLength={6}
                  autoComplete="new-password" />
              </div>
              <button type="submit"
                className={`btn-primary w-full justify-center mt-1${loading ? " btn-loading" : ""}`}
                disabled={loading}>
                {!loading && (<>Criar conta <ArrowRight size={15} /></>)}
              </button>
              <button type="button" onClick={() => reset("login")}
                className="text-muted text-[12.5px] text-center mt-0.5 hover:text-text transition-colors"
                style={{ background: "none", border: "none", cursor: "pointer" }}>
                ← Voltar para o login
              </button>
            </form>
          )}

          {/* ── Recuperar ─────────────────────────── */}
          {mode === "recover" && (
            <form onSubmit={handleRecover} className="anim-in-2 flex flex-col gap-3.5">
              <div className="form-group">
                <label className="input-label">Email cadastrado</label>
                <input type="email" value={form.email} onChange={set("email")}
                  placeholder="seu@email.com" required autoComplete="email" />
              </div>
              <button type="submit"
                className={`btn-primary w-full justify-center mt-1${loading ? " btn-loading" : ""}`}
                disabled={loading}>
                {!loading && (<>Enviar link <ArrowRight size={15} /></>)}
              </button>
              <button type="button" onClick={() => reset("login")}
                className="text-muted text-[12.5px] text-center mt-0.5 hover:text-text transition-colors"
                style={{ background: "none", border: "none", cursor: "pointer" }}>
                ← Voltar para o login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
