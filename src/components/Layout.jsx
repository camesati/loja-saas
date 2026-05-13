import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import {
  LayoutDashboard, ShoppingCart, Package, Layers,
  Users, UserCheck, CreditCard, BarChart2, Settings,
  LogOut, Menu, X,
} from "lucide-react";

const NAV = [
  { key: "dashboard", label: "Dashboard",     icon: LayoutDashboard },
  { key: "pdv",       label: "PDV",           icon: ShoppingCart },
  { key: "products",  label: "Produtos",      icon: Package },
  { key: "stock",     label: "Estoque",       icon: Layers },
  { key: "customers", label: "Clientes",      icon: Users },
  { key: "sellers",   label: "Vendedores",    icon: UserCheck },
  { key: "payments",  label: "Pagamentos",    icon: CreditCard },
  { key: "reports",   label: "Relatórios",    icon: BarChart2 },
  { key: "settings",  label: "Configurações", icon: Settings },
];

export default function Layout({ page, setPage, children }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hoveredKey, setHoveredKey] = useState(null);

  const email = user?.email || "";
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--c-bg)" }}>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-20 md:hidden"
          style={{ background: "rgba(42,63,82,0.20)", backdropFilter: "blur(2px)" }}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────
          Mobile: fixed, desliza com transform
          Desktop (md+): static, parte do flex — sem md:ml necessário no main
      ─────────────────────────────────────────────────────────────── */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-30
          w-[220px] shrink-0 flex flex-col
          transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        style={{
          background: "#FFFFFF",
          borderRight: "1.5px solid var(--c-border)",
          boxShadow: "2px 0 16px rgba(26,46,61,0.05)",
        }}
      >
        {/* Logo */}
        <div style={{
          padding: "20px 18px 16px",
          borderBottom: "1.5px solid var(--c-border)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}>
          <div style={{
            width: 34, height: 34,
            borderRadius: "10px",
            background: "linear-gradient(135deg, #EBF4FC 0%, #D0E6F7 100%)",
            border: "1.5px solid #BDD4EA",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <span style={{
              fontFamily: "var(--font-display)",
              fontSize: "20px",
              fontStyle: "italic",
              fontWeight: 400,
              color: "#4A8FC1",
              lineHeight: 1,
              paddingBottom: "1px",
            }}>C</span>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: "17px",
              fontWeight: 500,
              color: "#1A2E3D",
              letterSpacing: ".02em",
              lineHeight: 1.15,
            }}>Camesa</div>
            <div style={{
              fontSize: "9.5px",
              color: "var(--c-muted)",
              letterSpacing: ".10em",
              textTransform: "uppercase",
              fontWeight: 700,
              marginTop: "1px",
            }}>Gestão</div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--c-muted)", padding: 4, display: "flex" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "8px 10px", overflowY: "auto" }}>
          {NAV.map(({ key, label, icon: Icon }) => {
            const active = page === key;
            const hovered = hoveredKey === key && !active;
            return (
              <button
                key={key}
                onClick={() => { setPage(key); setSidebarOpen(false); }}
                onMouseEnter={() => setHoveredKey(key)}
                onMouseLeave={() => setHoveredKey(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "9px",
                  width: "100%",
                  padding: "8px 12px",
                  margin: "1px 0",
                  borderRadius: "9px",
                  fontSize: "13px",
                  fontFamily: "var(--font-sans)",
                  fontWeight: active ? 700 : 500,
                  color: active ? "#4A8FC1" : hovered ? "#1A2E3D" : "#4E6A7E",
                  background: active ? "#EBF4FC" : hovered ? "#F4F8FC" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all .12s",
                }}
              >
                <Icon size={15} strokeWidth={active ? 2.5 : 2} style={{ flexShrink: 0 }} />
                <span>{label}</span>
                {active && (
                  <span style={{
                    marginLeft: "auto",
                    width: 6, height: 6,
                    borderRadius: "50%",
                    background: "#4A8FC1",
                    display: "inline-block",
                    flexShrink: 0,
                  }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Usuário */}
        <div style={{ borderTop: "1.5px solid var(--c-border)", padding: "14px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
            <div style={{
              width: 30, height: 30,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #BDD4EA, #4A8FC1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "11px", fontWeight: 700, color: "#fff",
              flexShrink: 0,
            }}>
              {initials}
            </div>
            <span style={{
              fontSize: "12px", fontWeight: 600,
              color: "var(--c-text)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              flex: 1,
            }}>
              {email}
            </span>
          </div>
          <button onClick={logout} className="btn-secondary btn-sm w-full justify-center">
            <LogOut size={13} />
            Sair
          </button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar mobile */}
        <header
          className="md:hidden flex items-center gap-3"
          style={{
            padding: "12px 16px",
            background: "#fff",
            borderBottom: "1.5px solid var(--c-border)",
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--c-muted)", padding: 4, display: "flex" }}
          >
            <Menu size={20} />
          </button>
          <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "14px", color: "var(--c-text)" }}>
            {NAV.find(n => n.key === page)?.label || "Dashboard"}
          </span>
        </header>

        <main style={{ flex: 1, overflowY: "auto", padding: "22px 26px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
