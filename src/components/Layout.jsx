import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import {
  LayoutDashboard, ShoppingCart, Package, Layers,
  Users, UserCheck, CreditCard, BarChart2, Settings,
  LogOut, Menu, X, Sun, Moon,
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

export default function Layout({ page, setPage, theme, toggleTheme, children }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const email = user?.email || "";
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--c-bg)", transition: "background .25s ease" }}>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-20 md:hidden"
          style={{ background: "var(--c-overlay)", backdropFilter: "blur(2px)" }}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-30
          w-56 shrink-0 flex flex-col
          transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        style={{
          background: "var(--c-surface)",
          borderRight: "1px solid var(--c-border)",
          boxShadow: "4px 0 24px rgba(0,0,0,0.30)",
          transition: "background .25s ease, transform .2s ease",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-[18px] py-5 shrink-0" style={{ borderBottom: "1px solid var(--c-border)" }}>
          <div className="w-[34px] h-[34px] rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, var(--c-accent) 0%, var(--c-accent-deep) 100%)" }}>
            <span className="font-display text-xl font-bold text-white leading-none">C</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-display text-base font-bold tracking-wide leading-tight"
              style={{ color: "var(--c-accent-deep)" }}>Camesa</div>
            <div className="text-label mt-px" style={{ opacity: 0.8 }}>Gestão</div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden flex items-center justify-center p-1 text-muted hover:text-text transition-colors"
            style={{ background: "none", border: "none", cursor: "pointer" }}
            aria-label="Fechar menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav com grupos */}
        <nav
          role="navigation"
          aria-label="Menu principal"
          className="flex-1 px-2.5 py-2 overflow-y-auto"
        >
          {NAV_GROUPS.map(({ label: groupLabel, items }) => (
            <div key={groupLabel} className="mb-1">
              <div className="text-label px-2.5 pt-2.5 pb-1" style={{ opacity: 0.7 }}>
                {groupLabel}
              </div>
              {items.map(({ key, label, icon: Icon }) => {
                const active = page === key;
                return (
                  <button
                    key={key}
                    onClick={() => { setPage(key); setSidebarOpen(false); }}
                    aria-current={active ? "page" : undefined}
                    className={`
                      flex items-center gap-2 w-full my-px rounded-[9px]
                      text-[13px] font-sans transition-all duration-100 text-left
                      pr-2.5 py-2
                      ${active ? "nav-item-active" : "nav-item-inactive"}
                    `}
                  >
                    <Icon size={15} strokeWidth={active ? 2.5 : 2} className="shrink-0" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Usuário */}
        <div className="px-3.5 py-3.5 shrink-0" style={{ borderTop: "1px solid var(--c-border)" }}>
          <div className="flex items-center gap-2 mb-2.5">
            <div
              className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
              style={{ background: "linear-gradient(135deg, var(--c-accent), var(--c-accent-deep))" }}
            >
              {initials}
            </div>
            <span className="text-xs font-semibold text-text truncate flex-1">{email}</span>
          </div>
          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
            className="btn-secondary btn-sm w-full justify-center mb-2"
          >
            {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
            {theme === "dark" ? "Tema claro" : "Tema escuro"}
          </button>
          <button onClick={logout} className="btn-secondary btn-sm w-full justify-center">
            <LogOut size={13} />
            Sair
          </button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0" style={{ background: "var(--c-bg)", transition: "background .25s ease" }}>

        {/* Topbar mobile */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 shrink-0" style={{ background: "var(--c-surface)", borderBottom: "1px solid var(--c-border)" }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center p-1 text-muted hover:text-text transition-colors"
            style={{ background: "none", border: "none", cursor: "pointer" }}
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
          <span className="font-sans font-bold text-[15px] text-text">
            {ALL_NAV.find(n => n.key === page)?.label || "Dashboard"}
          </span>
        </header>

        <main className="flex-1 overflow-y-auto" style={{ padding: "22px 26px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
