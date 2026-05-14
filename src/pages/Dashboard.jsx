import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { db } from "../config/supabase.js";
import { BarChart } from "@tremor/react";
import {
  TrendingUp, Users, Package, ShoppingBag,
  ArrowRight, Clock, BarChart2,
} from "lucide-react";

const fmt = (v) => `R$ ${Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
const fmtDate = (d) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

const KPI_VARIANTS = [
  { icon: TrendingUp,  label: "Vendas Hoje",      key: "hoje",     variant: "blue",   iconColor: "var(--c-accent)" },
  { icon: ShoppingBag, label: "Vendas do Mês",    key: "mes",      variant: "green",  iconColor: "var(--c-success)" },
  { icon: Package,     label: "Itens em Estoque", key: "estoque",  variant: "orange", iconColor: "var(--c-warning)" },
  { icon: Users,       label: "Clientes",         key: "clientes", variant: "purple", iconColor: "#7C3AED" },
];

function KPICard({ icon: Icon, label, value, variant, iconColor, delay = 0 }) {
  return (
    <div className={`kpi-card kpi-card--${variant} anim-in`} style={{ animationDelay: `${delay}ms` }}>
      <div className="kpi-icon-wrap">
        <Icon size={20} color={iconColor} strokeWidth={2} />
      </div>
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
  const uid = session?.user?.id;

  const [kpi, setKpi] = useState({ hoje: 0, mes: 0, estoque: 0, clientes: 0 });
  const [recentSales, setRecentSales] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (uid) loadAll(); }, [uid]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const firstDay = new Date(); firstDay.setDate(1);
      const firstDayStr = firstDay.toISOString().split("T")[0];

      const [salesHojeArr, salesMesArr, products, clientes, sales, salesWeek] = await Promise.all([
        db.get("sales", `user_id=eq.${uid}&created_at=gte.${today}T00:00:00&select=total_amount`, token),
        db.get("sales", `user_id=eq.${uid}&created_at=gte.${firstDayStr}T00:00:00&select=total_amount`, token),
        db.get("products", `user_id=eq.${uid}&select=quantity`, token),
        db.get("customers", `user_id=eq.${uid}&select=id`, token),
        db.get("sales", `user_id=eq.${uid}&order=created_at.desc&limit=6&select=id,sale_number,total_amount,created_at,customers(name),payment_methods(name)`, token),
        db.get("sales", `user_id=eq.${uid}&created_at=gte.${(() => { const d = new Date(); d.setDate(d.getDate()-6); return d.toISOString().split("T")[0]; })()}T00:00:00&select=total_amount,created_at`, token),
      ]);

      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split("T")[0];
      });
      const chartMap = {};
      salesWeek.forEach(s => {
        const day = s.created_at.split("T")[0];
        chartMap[day] = (chartMap[day] || 0) + Number(s.total_amount);
      });
      const chart = days.map(d => ({
        dia: new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" }),
        "Vendas": Number((chartMap[d] || 0).toFixed(2)),
      }));

      setKpi({
        hoje:     salesHojeArr.reduce((s, r) => s + Number(r.total_amount), 0),
        mes:      salesMesArr.reduce((s, r) => s + Number(r.total_amount), 0),
        estoque:  products.reduce((s, r) => s + Number(r.quantity), 0),
        clientes: clientes.length,
      });
      setRecentSales(sales);
      setChartData(chart);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const hasChart = chartData.some(d => d["Vendas"] > 0);

  return (
    <div className="flex flex-col gap-section">

      {/* Cabeçalho */}
      <div className="anim-in">
        <h2 className="page-title">Dashboard</h2>
        <p className="page-subtitle">Visão geral do seu negócio</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {loading
          ? KPI_VARIANTS.map((_, i) => <KPISkeleton key={i} delay={i * 60} />)
          : KPI_VARIANTS.map((v, i) => (
              <KPICard key={v.key} {...v} value={v.key === "estoque" || v.key === "clientes" ? kpi[v.key] : fmt(kpi[v.key])} delay={i * 60} />
            ))
        }
      </div>

      {/* Gráfico + Últimas vendas */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)] gap-3.5">

        {/* Card do gráfico */}
        <div className="card anim-in-1 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-h3">Vendas — últimos 7 dias</div>
              <div className="text-sm-ui mt-0.5">
                Total: {loading ? "—" : fmt(chartData.reduce((s, d) => s + d["Vendas"], 0))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="skeleton" style={{ height: 224, borderRadius: "var(--radius-md)" }} />
          ) : hasChart ? (
            <BarChart
              data={chartData}
              index="dia"
              categories={["Vendas"]}
              colors={["blue"]}
              valueFormatter={(v) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              showLegend={false}
              showGridLines={true}
              className="h-56"
            />
          ) : (
            <div className="h-56 flex flex-col items-center justify-center gap-2.5">
              <div className="kpi-icon-wrap kpi-card--blue">
                <BarChart2 size={22} color="var(--c-accent)" />
              </div>
              <span className="text-sm-ui font-medium">Nenhuma venda nos últimos 7 dias</span>
            </div>
          )}
        </div>

        {/* Últimas vendas */}
        <div className="card anim-in-2 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="text-h3">Últimas vendas</div>
            <button
              onClick={() => setPage("reports")}
              className="flex items-center gap-1 text-accent text-xs font-semibold hover:text-accent-deep transition-colors"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              Ver todas <ArrowRight size={12} />
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(4)].map((_, i) => (
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
            <div className="flex-1 flex flex-col items-center justify-center gap-2.5">
              <div className="kpi-icon-wrap kpi-card--blue">
                <Clock size={22} color="var(--c-accent)" />
              </div>
              <span className="text-sm-ui font-medium">Nenhuma venda ainda</span>
              <button className="btn-primary btn-sm" onClick={() => setPage("pdv")}>
                Fazer primeira venda
              </button>
            </div>
          ) : (
            <div className="flex flex-col flex-1">
              {recentSales.map((s, i) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3"
                  style={{
                    padding: "10px 0",
                    borderBottom: i < recentSales.length - 1 ? "1px solid var(--c-border)" : "none",
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-text">
                      #{s.sale_number}
                      {s.customers?.name && (
                        <span className="font-normal text-muted ml-1.5">· {s.customers.name}</span>
                      )}
                    </div>
                    <div className="text-xs text-muted mt-px">
                      {fmtDate(s.created_at)} · {s.payment_methods?.name || "—"}
                    </div>
                  </div>
                  <div className="text-[13px] font-bold shrink-0" style={{ color: "var(--c-accent)" }}>
                    {fmt(s.total_amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Acesso rápido */}
      <div className="card anim-in-3 flex flex-wrap items-center gap-4">
        <span className="text-h3 shrink-0">Acesso rápido</span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setPage("pdv")}
            className="btn-primary btn-sm"
          >
            Nova Venda
          </button>
          {[
            { page: "products",  label: "Produtos",  bg: "var(--c-kpi-green-bg)",  color: "var(--c-success)" },
            { page: "customers", label: "Clientes",  bg: "var(--c-kpi-purple-bg)", color: "#7C3AED" },
            { page: "stock",     label: "Estoque",   bg: "var(--c-kpi-orange-bg)", color: "var(--c-warning)" },
          ].map(({ page: p, label, bg, color }) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className="btn-sm transition-all"
              style={{
                background: bg, color, border: "1.5px solid transparent",
                fontFamily: "var(--font-sans)", cursor: "pointer",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = color; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "transparent"; }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
