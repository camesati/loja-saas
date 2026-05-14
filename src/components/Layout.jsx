import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import {
  LayoutDashboard, ShoppingCart, Package, Layers,
  Users, UserCheck, CreditCard, BarChart2, Settings,
  LogOut, Menu, X,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Vendas",
    items: [
      { key: "dashboard", label: "Dashboard",  icon: LayoutDashboard },
      { key: "pdv",       label: "PDV",        icon: ShoppingCart },
      { key: "reports",   label: "Relatórios", icon: BarChart2 },
    ],
  },
  {
    label: "Cadastros",
    items: [
      { key: "products",  label: "Produtos",    icon: Package },
      { key: "stock",     label: "Estoque",     icon: Layers },
      { key: "customers", label: "Clientes",    icon: Users },
      { key: "sellers",   label: "Vendedores",  icon: UserCheck },
      { key: "payments",  label: "Pagamentos",  icon: CreditCard },
    ],
  },
  {
    label: "Sistema",
    items: [
      { key: "settings", label: "Configurações", icon: Settings },
    ],
  },
];

const ALL_NAV = NAV_GROUPS.flatMap(g => g.items);

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

      {/* ── Sidebar ─────────────────────────────────────── */}
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
            background: "linear-gradient(135deg, #0474AF 0%, #045C84 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <span style={{
              fontFamily: "var(--font-display)",
              fontSize: "20px",
              fontWeight: 700,
              color: "#FFFFFF",
              lineHeight: 1,
            }}>C</span>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "var(--font-display)",
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--c-accent-deep)",
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

        {/* Nav com grupos */}
        <nav style={{ flex: 1, padding: "8px 10px", overflowY: "auto" }}>
          {NAV_GROUPS.map(({ label: groupLabel, items }) => (
            <div key={groupLabel} style={{ marginBottom: 4 }}>
              <div style={{
                padding: "10px 10px 4px",
                fontSize: "10px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: ".08em",
                color: "var(--c-muted)",
                opacity: 0.7,
              }}>
                {groupLabel}
              </div>
              {items.map(({ key, label, icon: Icon }) => {
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
                      padding: "8px 10px",
                      paddingLeft: active ? "9px" : "12px",
                      margin: "1px 0",
                      borderRadius: "9px",
                      fontSize: "13px",
                      fontFamily: "var(--font-sans)",
                      fontWeight: active ? 700 : 500,
                      color: active ? "var(--c-accent)" : hovered ? "var(--c-text)" : "var(--c-muted)",
                      background: active ? "#EEF6FB" : hovered ? "#F4F8FC" : "transparent",
                      border: "none",
                      borderLeft: active ? "3px solid var(--c-magenta)" : "3px solid transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all .12s",
                    }}
                  >
                    <Icon size={15} strokeWidth={active ? 2.5 : 2} style={{ flexShrink: 0 }} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Usuário */}
        <div style={{ borderTop: "1.5px solid var(--c-border)", padding: "14px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
            <div style={{
              width: 30, height: 30,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #0474AF, #045C84)",
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
          <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "15px", color: "var(--c-text)" }}>
            {ALL_NAV.find(n => n.key === page)?.label || "Dashboard"}
          </span>
        </header>

        <main style={{ flex: 1, overflowY: "auto", padding: "22px 26px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
