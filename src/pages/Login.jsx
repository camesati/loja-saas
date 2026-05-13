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
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--c-bg)",
      backgroundImage: "radial-gradient(var(--c-border) 1px, transparent 1px)",
      backgroundSize: "22px 22px",
      padding: "24px",
    }}>

      {/* Card principal */}
      <div className="anim-in" style={{
        width: "100%",
        maxWidth: "400px",
        background: "#fff",
        borderRadius: "20px",
        border: "1.5px solid var(--c-border)",
        boxShadow: "0 4px 24px rgba(42,63,82,0.08), 0 1px 4px rgba(42,63,82,0.06)",
        overflow: "hidden",
      }}>

        {/* Cabeçalho da marca */}
        <div style={{
          padding: "36px 36px 28px",
          textAlign: "center",
          borderBottom: "1.5px solid var(--c-border)",
          background: "linear-gradient(160deg, #F5F8FC 0%, #FFFFFF 100%)",
        }}>
          {/* Monograma */}
          <div style={{
            width: 56, height: 56,
            borderRadius: "16px",
            background: "linear-gradient(135deg, #EBF4FC 0%, #D6E8F7 100%)",
            border: "1.5px solid #C4D9ED",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
            boxShadow: "0 2px 8px rgba(74,143,193,0.15)",
          }}>
            <span style={{
              fontFamily: "var(--font-display)",
              fontSize: "28px",
              fontStyle: "italic",
              fontWeight: 400,
              color: "#4A8FC1",
              lineHeight: 1,
            }}>C</span>
          </div>

          {/* Wordmark */}
          <div style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: "28px",
            fontWeight: 400,
            color: "#2A3F52",
            letterSpacing: ".03em",
            lineHeight: 1,
            marginBottom: 6,
          }}>
            Camesa
          </div>
          <div style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--c-muted)",
            letterSpacing: ".12em",
            textTransform: "uppercase",
          }}>
            a cara da sua casa
          </div>
        </div>

        {/* Corpo do formulário */}
        <div style={{ padding: "28px 36px 32px" }}>

          {/* Título do modo */}
          <div className="anim-in-1" style={{ marginBottom: 20 }}>
            <h2 style={{
              fontFamily: "var(--font-sans)",
              fontSize: "18px",
              fontWeight: 700,
              color: "var(--c-text)",
              margin: 0,
            }}>
              {mode === "login"    && "Bem-vindo de volta"}
              {mode === "register" && "Criar conta"}
              {mode === "recover"  && "Recuperar acesso"}
            </h2>
            <p style={{ fontSize: "13px", color: "var(--c-muted)", margin: "4px 0 0" }}>
              {mode === "login"    && "Acesse o painel de gestão"}
              {mode === "register" && "Preencha os dados abaixo"}
              {mode === "recover"  && "Enviaremos um link por email"}
            </p>
          </div>

          {/* Alertas */}
          {error && (
            <div className="anim-in" style={{
              padding: "10px 14px",
              background: "#FEE2E2",
              border: "1.5px solid #FECACA",
              borderRadius: "10px",
              color: "#991B1B",
              fontSize: "13px",
              marginBottom: 16,
            }}>
              {error}
            </div>
          )}
          {success && (
            <div className="anim-in" style={{
              padding: "10px 14px",
              background: "#D1FAE5",
              border: "1.5px solid #A7F3D0",
              borderRadius: "10px",
              color: "#065F46",
              fontSize: "13px",
              marginBottom: 16,
            }}>
              {success}
            </div>
          )}

          {/* ── Login ─────────────────────────────── */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="anim-in-2" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="form-group">
                <label className="input-label">Email</label>
                <input type="email" value={form.email} onChange={set("email")} placeholder="seu@email.com" required />
              </div>
              <div className="form-group">
                <label className="input-label">Senha</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPass ? "text" : "password"}
                    value={form.password}
                    onChange={set("password")}
                    placeholder="••••••••"
                    required
                    style={{ paddingRight: "44px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    style={{
                      position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--c-muted)", display: "flex", padding: 0,
                    }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary w-full justify-center" style={{ marginTop: 4 }} disabled={loading}>
                {loading ? "Entrando..." : (<>Entrar <ArrowRight size={15} /></>)}
              </button>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <button type="button" onClick={() => reset("register")}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12.5px", color: "var(--c-accent)", fontWeight: 600, padding: 0 }}>
                  Criar conta
                </button>
                <button type="button" onClick={() => reset("recover")}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12.5px", color: "var(--c-muted)", padding: 0 }}>
                  Esqueceu a senha?
                </button>
              </div>
            </form>
          )}

          {/* ── Cadastro ──────────────────────────── */}
          {mode === "register" && (
            <form onSubmit={handleRegister} className="anim-in-2" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
              <button type="submit" className="btn-primary w-full justify-center" style={{ marginTop: 4 }} disabled={loading}>
                {loading ? "Criando conta..." : (<>Criar conta <ArrowRight size={15} /></>)}
              </button>
              <button type="button" onClick={() => reset("login")}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12.5px", color: "var(--c-muted)", textAlign: "center", marginTop: 2 }}>
                ← Voltar para o login
              </button>
            </form>
          )}

          {/* ── Recuperar ─────────────────────────── */}
          {mode === "recover" && (
            <form onSubmit={handleRecover} className="anim-in-2" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="form-group">
                <label className="input-label">Email cadastrado</label>
                <input type="email" value={form.email} onChange={set("email")} placeholder="seu@email.com" required />
              </div>
              <button type="submit" className="btn-primary w-full justify-center" style={{ marginTop: 4 }} disabled={loading}>
                {loading ? "Enviando..." : (<>Enviar link <ArrowRight size={15} /></>)}
              </button>
              <button type="button" onClick={() => reset("login")}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12.5px", color: "var(--c-muted)", textAlign: "center", marginTop: 2 }}>
                ← Voltar para o login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
