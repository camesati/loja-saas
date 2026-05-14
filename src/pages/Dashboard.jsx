import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { db } from "../config/supabase.js";
import {
  TrendingUp, Users, Package, ShoppingBag,
  ArrowRight, Clock, BarChart2, Receipt,
} from "lucide-react";
import ArrowBarChart from "../components/ArrowBarChart.jsx";
import DonutChart from "../components/DonutChart.jsx";

const fmt = (v) => `R$ ${Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
const fmtDate = (d) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
const fmtDateLong = (d) => d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

const PAYMENT_COLORS = {
  "Crédito":  "#3b82f6",
  "Débito":   "#22c55e",
  "PIX":      "#f59e0b",
  "Dinheiro": "#f97316",
};
const FALLBACK_COLORS = ["#8b5cf6", "#ec4899", "#06b6d4"];

const KPI_VARIANTS = [
  { icon: TrendingUp,  label: "Vendas Hoje",      key: "hoje",        variant: "blue",   iconColor: "var(--c-kpi-blue-icon)" },
  { icon: ShoppingBag, label: "Vendas do Mês",    key: "mes",         variant: "green",  iconColor: "var(--c-kpi-green-icon)" },
  { icon: Receipt,     label: "Ticket Médio",     key: "ticketMedio", variant: "cyan",   iconColor: "var(--c-kpi-cyan-icon)" },
  { icon: Package,     label: "Itens em Estoque", key: "estoque",     variant: "orange", iconColor: "var(--c-kpi-orange-icon)" },
  { icon: Users,       label: "Clientes",         key: "clientes",    variant: "purple", iconColor: "var(--c-kpi-purple-icon)" },
];

const PERIODS = [
  { key: "7d",  label: "7 dias" },
  { key: "30d", label: "30 dias" },
  { key: "mes", label: "Mês atual" },
  { key: "tri", label: "Trimestre" },
  { key: "sem", label: "Semestre" },
  { key: "ano", label: "Ano" },
];

function getDateRange(period) {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  switch (period) {
    case "7d":  { const f = new Date(today); f.setDate(f.getDate()-6);  return { from: f.toISOString().split("T")[0], to: todayStr, groupBy: "day",   count: 7 }; }
    case "30d": { const f = new Date(today); f.setDate(f.getDate()-29); return { from: f.toISOString().split("T")[0], to: todayStr, groupBy: "day",   count: 30 }; }
    case "mes": { const f = new Date(today.getFullYear(), today.getMonth(), 1); return { from: f.toISOString().split("T")[0], to: todayStr, groupBy: "day", count: today.getDate() }; }
    case "tri": { const f = new Date(today.getFullYear(), today.getMonth()-2, 1); return { from: f.toISOString().split("T")[0], to: todayStr, groupBy: "month", count: 3 }; }
    case "sem": { const f = new Date(today.getFullYear(), today.getMonth()-5, 1); return { from: f.toISOString().split("T")[0], to: todayStr, groupBy: "month", count: 6 }; }
    case "ano": { const f = new Date(today.getFullYear(), today.getMonth()-11, 1); return { from: f.toISOString().split("T")[0], to: todayStr, groupBy: "month", count: 12 }; }
    default: return { from: todayStr, to: todayStr, groupBy: "day", count: 1 };
  }
}

/* Agrega vendas por período com segmentos por forma de pagamento */
function buildChartPoints(sales, meta, filter) {
  const { from, to, groupBy, count } = meta;

  /* Tipos de pagamento únicos presentes nas vendas */
  const allTypes = [...new Set(sales.map(s => s.payment_methods?.name || "Outros"))].sort();

  const makeSegments = (typeMap) =>
    allTypes
      .map((t, i) => ({ label: t, value: Number((typeMap[t] || 0).toFixed(2)), color: PAYMENT_COLORS[t] || FALLBACK_COLORS[i % 3] }))
      .filter(s => s.value > 0);

  if (groupBy === "day") {
    const allDays = [];
    const cursor = new Date(from + "T12:00:00");
    const end    = new Date(to   + "T12:00:00");
    while (cursor <= end) { allDays.push(cursor.toISOString().split("T")[0]); cursor.setDate(cursor.getDate() + 1); }

    /* dayTypeMap[day][type] = total */
    const dayTypeMap = {};
    sales.forEach(s => {
      const d = s.created_at.split("T")[0];
      const t = s.payment_methods?.name || "Outros";
      if (!dayTypeMap[d]) dayTypeMap[d] = {};
      dayTypeMap[d][t] = (dayTypeMap[d][t] || 0) + Number(s.total_amount);
    });

    const labelFmt = count <= 7 ? { weekday: "short", day: "2-digit" } : { day: "2-digit", month: "2-digit" };
    return allDays.map(d => {
      const typeMap  = dayTypeMap[d] || {};
      const segments = filter === "all" ? makeSegments(typeMap) : undefined;
      const value    = filter === "all"
        ? Object.values(typeMap).reduce((s, v) => s + v, 0)
        : (typeMap[filter] || 0);
      return { dia: new Date(d + "T12:00:00").toLocaleDateString("pt-BR", labelFmt), "Vendas": Number(value.toFixed(2)), segments };
    });
  } else {
    /* monthTypeMap[key][type] = total */
    const monthTypeMap = {};
    sales.forEach(s => {
      const d = new Date(s.created_at);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const t = s.payment_methods?.name || "Outros";
      if (!monthTypeMap[k]) monthTypeMap[k] = {};
      monthTypeMap[k][t] = (monthTypeMap[k][t] || 0) + Number(s.total_amount);
    });

    const startDate = new Date(from + "T12:00:00");
    return Array.from({ length: count }, (_, i) => {
      const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const typeMap  = monthTypeMap[k] || {};
      const segments = filter === "all" ? makeSegments(typeMap) : undefined;
      const value    = filter === "all"
        ? Object.values(typeMap).reduce((s, v) => s + v, 0)
        : (typeMap[filter] || 0);
      return { dia: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }), "Vendas": Number(value.toFixed(2)), segments };
    });
  }
}

function KPICard({ icon: Icon, label, value, variant, iconColor, delay = 0 }) {
  return (
    <div className={`kpi-card kpi-card--${variant} anim-in`} style={{ animationDelay: `${delay}ms` }}>
      <div className="kpi-icon-wrap"><Icon size={20} color={iconColor} strokeWidth={2} /></div>
      <div className="min-w-0">
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value}</div>
      </div>
    </div>
  );
}

function KPISkeleton({ delay = 0 }) {
  return (
    <div className="card flex items-center gap-4" style={{ animationDelay: `${delay}ms` }}>
      <div className="skeleton w-[42px] h-[42px] rounded-xl shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="skeleton-text w-3/5 mb-2" />
        <div className="skeleton-title w-4/5" />
      </div>
    </div>
  );
}

export default function Dashboard({ setPage }) {
  const { session } = useAuth();
  const token = session?.access_token;
  const uid   = session?.user?.id;

  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const dateLabel = fmtDateLong(new Date());

  const [kpi,         setKpi]         = useState({ hoje: 0, mes: 0, ticketMedio: 0, estoque: 0, clientes: 0 });
  const [recentSales, setRecentSales] = useState([]);
  const [paymentData, setPaymentData] = useState([]);

  /* Gráfico */
  const [chartData,         setChartData]         = useState([]);
  const [chartRawSales,     setChartRawSales]     = useState([]);
  const [chartRawMeta,      setChartRawMeta]      = useState(null);
  const [chartPaymentTypes, setChartPaymentTypes] = useState([]);
  const [chartPeriod,       setChartPeriod]       = useState("7d");
  const [chartFilter,       setChartFilter]       = useState("all");
  const [chartLoading,      setChartLoading]      = useState(false);
  const [loading,           setLoading]           = useState(true);

  useEffect(() => { if (uid) loadKpis(); }, [uid]);
  useEffect(() => { if (uid) loadChartData(chartPeriod); }, [uid, chartPeriod]);

  /* Quando o filtro muda, recalcula a partir do cache sem nova requisição */
  useEffect(() => {
    if (chartRawMeta) setChartData(buildChartPoints(chartRawSales, chartRawMeta, chartFilter));
  }, [chartFilter, chartRawSales, chartRawMeta]);

  const loadKpis = async () => {
    setLoading(true);
    try {
      const today    = new Date().toISOString().split("T")[0];
      const firstDay = new Date(); firstDay.setDate(1);
      const fDayStr  = firstDay.toISOString().split("T")[0];

      const [salesHoje, salesMes, products, clientes, sales, allSales] = await Promise.all([
        db.get("sales", `user_id=eq.${uid}&created_at=gte.${today}T00:00:00&select=total_amount`, token),
        db.get("sales", `user_id=eq.${uid}&created_at=gte.${fDayStr}T00:00:00&select=total_amount`, token),
        db.get("products",  `user_id=eq.${uid}&select=quantity`, token),
        db.get("customers", `user_id=eq.${uid}&select=id`, token),
        db.get("sales", `user_id=eq.${uid}&order=created_at.desc&limit=6&select=id,sale_number,total_amount,created_at,customers(name),payment_methods(name)`, token),
        db.get("sales", `user_id=eq.${uid}&select=total_amount,payment_methods(name)`, token),
      ]);

      const totalMes = salesMes.reduce((s, r) => s + Number(r.total_amount), 0);
      setKpi({
        hoje:        salesHoje.reduce((s, r) => s + Number(r.total_amount), 0),
        mes:         totalMes,
        ticketMedio: salesMes.length > 0 ? totalMes / salesMes.length : 0,
        estoque:     products.reduce((s, r) => s + Number(r.quantity), 0),
        clientes:    clientes.length,
      });
      setRecentSales(sales);

      const pmMap = {};
      allSales.forEach(s => { const n = s.payment_methods?.name || "Outros"; pmMap[n] = (pmMap[n]||0) + Number(s.total_amount); });
      setPaymentData(Object.entries(pmMap).sort((a,b)=>b[1]-a[1]).map(([label,value],i)=>({ label, value, color: PAYMENT_COLORS[label] || FALLBACK_COLORS[i%3] })));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadChartData = async (period) => {
    if (!uid) return;
    setChartLoading(true);
    try {
      const meta = getDateRange(period);
      const { from, to } = meta;
      const sales = await db.get(
        "sales",
        `user_id=eq.${uid}&created_at=gte.${from}T00:00:00&created_at=lte.${to}T23:59:59&select=total_amount,created_at,payment_methods(name)`,
        token
      );

      /* Extrair tipos de pagamento presentes no período */
      const types = [...new Set(sales.map(s => s.payment_methods?.name).filter(Boolean))].sort();
      setChartPaymentTypes(types);

      /* Resetar filtro ao trocar período (evita filtro inválido) */
      const currentFilter = chartFilter !== "all" && types.includes(chartFilter) ? chartFilter : "all";
      if (currentFilter !== chartFilter) setChartFilter("all");

      setChartRawSales(sales);
      setChartRawMeta(meta);
      setChartData(buildChartPoints(sales, meta, currentFilter));
    } catch (e) { console.error(e); }
    finally { setChartLoading(false); }
  };

  const handlePeriod = (key) => { setChartFilter("all"); setChartPeriod(key); };
  const handleFilter = (key) => setChartFilter(key);

  const chartTotal = chartData.reduce((s, d) => s + d["Vendas"], 0);
  const chartColor = chartFilter === "all"
    ? "var(--c-accent)"
    : (PAYMENT_COLORS[chartFilter] || "var(--c-accent)");
  const periodLabel = PERIODS.find(p => p.key === chartPeriod)?.label || "";
  const hasChart = chartData.some(d => d["Vendas"] > 0);

  const btnStyle = { minHeight: 28, padding: "4px 10px", fontSize: 11 };

  return (
    <div className="flex flex-col gap-8">

      {/* Cabeçalho */}
      <div className="anim-in">
        <h2 className="text-h1">{greeting}! 👋</h2>
        <p className="text-sm-ui mt-0.5 capitalize">{dateLabel} · Visão geral do negócio</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {loading
          ? KPI_VARIANTS.map((_, i) => <KPISkeleton key={i} delay={i * 60} />)
          : KPI_VARIANTS.map((v, i) => {
              const raw = kpi[v.key];
              const value = v.key === "estoque" || v.key === "clientes" ? raw : fmt(raw);
              return <KPICard key={v.key} {...v} value={value} delay={i * 60} />;
            })
        }
      </div>

      {/* Gráfico + painel direito */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)] gap-6">

        {/* Card do gráfico */}
        <div className="card anim-in-1 flex flex-col">

          {/* Header: título + total */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="text-h3">Vendas</div>
              <div className="text-sm-ui mt-0.5">
                {chartLoading ? "Carregando..." : `Total: ${fmt(chartTotal)}`}
              </div>
            </div>
          </div>

          {/* Filtros: período + forma de pagamento na mesma linha */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {/* Período */}
            <div className="flex flex-wrap gap-1">
              {PERIODS.map(p => (
                <button key={p.key} onClick={() => handlePeriod(p.key)} style={btnStyle}
                  className={chartPeriod === p.key ? "btn-primary btn-sm" : "btn-secondary btn-sm"}>
                  {p.label}
                </button>
              ))}
            </div>

            {/* Separador vertical */}
            {chartPaymentTypes.length > 0 && (
              <div style={{ width: 1, height: 20, background: "var(--c-border)", flexShrink: 0 }} />
            )}

            {/* Filtro por forma de pagamento */}
            {chartPaymentTypes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <button onClick={() => handleFilter("all")} style={btnStyle}
                  className={chartFilter === "all" ? "btn-primary btn-sm" : "btn-secondary btn-sm"}>
                  Todos
                </button>
                {chartPaymentTypes.map((type, i) => {
                  const c = PAYMENT_COLORS[type] || FALLBACK_COLORS[i % 3];
                  const isActive = chartFilter === type;
                  return (
                    <button key={type} onClick={() => handleFilter(type)} style={{
                      ...btnStyle,
                      background: isActive ? c : "var(--c-card)",
                      color: isActive ? "#fff" : "var(--c-muted)",
                      border: `1.5px solid ${isActive ? c : "var(--c-border)"}`,
                      borderRadius: "var(--radius-sm)",
                      fontFamily: "var(--font-sans)", fontWeight: 600,
                      cursor: "pointer", transition: "all .15s",
                      display: "inline-flex", alignItems: "center", gap: 5,
                    }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: isActive ? "#fff" : c, flexShrink: 0 }} />
                      {type}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Gráfico */}
          {chartLoading ? (
            <div className="skeleton" style={{ height: 236, borderRadius: "var(--radius-md)" }} />
          ) : hasChart ? (
            <ArrowBarChart data={chartData} color={chartColor} />
          ) : (
            <div className="h-56 flex flex-col items-center justify-center gap-3">
              <div className="flex items-center justify-center rounded-xl"
                style={{ width: 56, height: 56, background: "var(--c-kpi-blue-bg)" }}>
                <BarChart2 size={28} color="var(--c-kpi-blue-icon)" />
              </div>
              <span className="text-sm-ui font-medium">Nenhuma venda em {periodLabel.toLowerCase()}</span>
              <button className="btn-primary btn-sm" onClick={() => setPage("pdv")}>
                Registrar primeira venda
              </button>
            </div>
          )}
        </div>

        {/* Painel direito */}
        <div className="flex flex-col gap-6">

          {/* Últimas vendas */}
          <div className="card anim-in-2 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="text-h3">Últimas vendas</div>
              <button onClick={() => setPage("reports")}
                className="flex items-center gap-1 text-accent text-xs font-semibold hover:text-accent-deep transition-colors"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                Ver todas <ArrowRight size={12} />
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="skeleton-text w-[70%] mb-1.5" />
                      <div className="skeleton-text w-[50%]" style={{ height: 11 }} />
                    </div>
                    <div className="skeleton-text w-[70px]" />
                  </div>
                ))}
              </div>
            ) : recentSales.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2.5 py-4">
                <div className="kpi-icon-wrap kpi-card--blue"><Clock size={22} color="var(--c-accent)" /></div>
                <span className="text-sm-ui font-medium">Nenhuma venda ainda</span>
                <button className="btn-primary btn-sm" onClick={() => setPage("pdv")}>Fazer primeira venda</button>
              </div>
            ) : (
              <div className="flex flex-col">
                {recentSales.slice(0, 5).map((s, i) => (
                  <div key={s.id} className="flex items-center justify-between gap-3"
                    style={{ padding: "9px 0", borderBottom: i < Math.min(recentSales.length,5)-1 ? "1px solid var(--c-border)" : "none" }}>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-text">
                        #{s.sale_number}
                        {s.customers?.name && <span className="font-normal text-muted ml-1.5">· {s.customers.name}</span>}
                      </div>
                      <div className="text-xs text-muted mt-px">{fmtDate(s.created_at)} · {s.payment_methods?.name || "—"}</div>
                    </div>
                    <div className="text-[13px] font-bold shrink-0" style={{ color: "var(--c-accent)" }}>{fmt(s.total_amount)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Por forma de pagamento */}
          <div className="card anim-in-3">
            <div className="text-h3 mb-4">Por forma de pgto.</div>
            {loading ? (
              <div className="skeleton" style={{ height: 180, borderRadius: "var(--radius-md)" }} />
            ) : (
              <DonutChart data={paymentData} size={160} />
            )}
          </div>

        </div>
      </div>

      {/* Acesso rápido */}
      <div className="card anim-in-3 flex flex-wrap items-center gap-4">
        <span className="text-h3 shrink-0">Acesso rápido</span>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setPage("pdv")} className="btn-primary btn-sm">Nova Venda</button>
          {[
            { page: "products",  label: "Produtos",  bg: "var(--c-kpi-green-bg)",  color: "var(--c-success)" },
            { page: "customers", label: "Clientes",  bg: "var(--c-kpi-purple-bg)", color: "#7C3AED" },
            { page: "stock",     label: "Estoque",   bg: "var(--c-kpi-orange-bg)", color: "var(--c-warning)" },
          ].map(({ page: p, label, bg, color }) => (
            <button key={p} onClick={() => setPage(p)} className="btn-sm transition-all"
              style={{ background: bg, color, border: "1.5px solid transparent", fontFamily: "var(--font-sans)", cursor: "pointer" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = color; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "transparent"; }}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
