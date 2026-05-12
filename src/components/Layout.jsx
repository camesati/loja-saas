import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import {
  LayoutDashboard, ShoppingCart, Package, Layers,
  Users, UserCheck, CreditCard, BarChart2, Settings,
  LogOut, Menu, X, Store,
} from "lucide-react";

const NAV = [
  { key: "dashboard", label: "Dashboard",    icon: LayoutDashboard },
  { key: "pdv",       label: "PDV",          icon: ShoppingCart },
  { key: "products",  label: "Produtos",     icon: Package },
  { key: "stock",     label: "Estoque",      icon: Layers },
  { key: "customers", label: "Clientes",     icon: Users },
  { key: "sellers",   label: "Vendedores",   icon: UserCheck },
  { key: "payments",  label: "Pagamentos",   icon: CreditCard },
  { key: "reports",   label: "Relatórios",   icon: BarChart2 },
  { key: "settings",  label: "Configurações",icon: Settings },
];

export default function Layout({ page, setPage, children }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const email = user?.email || "";
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 md:hidden"
          style={{ background: "rgba(45, 74, 94, 0.25)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — azul-lavanda pastel */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-30 w-60 flex flex-col
          border-r border-border
          transform transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        style={{ background: "#EDF3FB" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "#D6E8F7" }}
          >
            <Store size={16} style={{ color: "#2C6FA8" }} />
          </div>
          <span
            className="font-bold text-sm tracking-wide"
            style={{ fontFamily: "'Montserrat', sans-serif", color: "#2C6FA8" }}
          >
            CAMESA
          </span>
          <button
            className="ml-auto md:hidden text-muted hover:text-text"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto px-2">
          {NAV.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setPage(key); setSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all duration-100 text-left mb-0.5"
              style={
                page === key
                  ? {
                      background: "#D6E8F7",
                      color: "#2C6FA8",
                      fontWeight: 600,
                      fontFamily: "'Montserrat', sans-serif",
                    }
                  : { color: "#8FA3B1" }
              }
              onMouseEnter={e => {
                if (page !== key) e.currentTarget.style.background = "#F0F6FC";
                if (page !== key) e.currentTarget.style.color = "#2D4A5E";
              }}
              onMouseLeave={e => {
                if (page !== key) e.currentTarget.style.background = "";
                if (page !== key) e.currentTarget.style.color = "#8FA3B1";
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-2.5 mb-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: "#4A8FC1" }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-text truncate">{email}</p>
            </div>
          </div>
          <button onClick={logout} className="btn-secondary btn-sm w-full justify-center">
            <LogOut size={13} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar mobile */}
        <header
          className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border"
          style={{ background: "#EDF3FB" }}
        >
          <button onClick={() => setSidebarOpen(true)} className="text-muted hover:text-text">
            <Menu size={20} />
          </button>
          <span
            className="text-sm font-semibold text-text"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {NAV.find(n => n.key === page)?.label || "Dashboard"}
          </span>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
