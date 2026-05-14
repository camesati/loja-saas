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

/* KPI Card */
function KPICard({ icon: Icon, label, value, bg, iconColor, delay = 0 }) {
  return (
    <div
      className="card anim-in"
      style={{ animationDelay: `${delay}ms`, display: "flex", alignItems: "center", gap: 16 }}
    >
      <div style={{
        width: 44, height: 44,
        borderRadius: "12px",
        background: bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon size={20} color={iconColor} strokeWidth={2} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "12px", color: "var(--c-muted)", fontWeight: 600, marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--c-text)", lineHeight: 1.2 }}>
          {value}
        </div>
      </div>
    </div>
  );
}

/* Skeleton de KPI Card para loading */
function KPISkeleton({ delay = 0 }) {
  return (
    <div className="card" style={{ animationDelay: `${delay}ms`, display: "flex", alignItems: "center", gap: 16 }}>
      <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="skeleton" style={{ height: 12, width: "60%", marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 22, width: "80%" }} />
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
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Cabeçalho */}
      <div className="anim-in">
        <h2 className="page-title">Dashboard</h2>
        <p className="page-subtitle">Visão geral do seu negócio</p>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}
           className="lg:grid-cols-4">
        {loading ? (
          <>
            <KPISkeleton delay={0}   />
            <KPISkeleton delay={60}  />
            <KPISkeleton delay={120} />
            <KPISkeleton delay={180} />
          </>
        ) : (
          <>
            <KPICard icon={TrendingUp}  label="Vendas Hoje"      value={fmt(kpi.hoje)}    bg="#EEF6FB" iconColor="#0474AF" delay={0}   />
            <KPICard icon={ShoppingBag} label="Vendas do Mês"    value={fmt(kpi.mes)}     bg="#F0FDF4" iconColor="#16A34A" delay={60}  />
            <KPICard icon={Package}     label="Itens em Estoque" value={kpi.estoque}      bg="#FEF9EC" iconColor="#D97706" delay={120} />
            <KPICard icon={Users}       label="Clientes"         value={kpi.clientes}     bg="#F3F0FE" iconColor="#7C3AED" delay={180} />
          </>
        )}
      </div>

      {/* Gráfico + Últimas vendas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}
           className="lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">

        {/* Card do gráfico */}
        <div className="card anim-in-1" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--c-text)" }}>
                Vendas — últimos 7 dias
              </div>
              <div style={{ fontSize: "12px", color: "var(--c-muted)", marginTop: 2 }}>
                Total: {loading ? "—" : fmt(chartData.reduce((s, d) => s + d["Vendas"], 0))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="skeleton" style={{ height: 224, borderRadius: 10 }} />
          ) : hasChart ? (
            <BarChart
              data={chartData}
              index="dia"
              categories={["Vendas"]}
              colors={["blue"]}
              valueFormatter={(v) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              showLegend={false}
              showGridLines={true}
              className="h-56 chart-brand"
            />
          ) : (
            <div style={{
              height: 224,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: "#EEF6FB",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <BarChart2 size={22} color="#0474AF" />
              </div>
              <span style={{ fontSize: "13px", color: "var(--c-muted)", fontWeight: 500 }}>
                Nenhuma venda nos últimos 7 dias
              </span>
            </div>
          )}
        </div>

        {/* Últimas vendas */}
        <div className="card anim-in-2" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--c-text)" }}>
              Últimas vendas
            </div>
            <button
              onClick={() => setPage("reports")}
              style={{
                display: "flex", alignItems: "center", gap: 3,
                fontSize: "12px", color: "var(--c-accent)",
                background: "none", border: "none", cursor: "pointer",
                fontWeight: 600, padding: 0,
              }}
            >
              Ver todas <ArrowRight size={12} />
            </button>
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 13, width: "70%", marginBottom: 6 }} />
                    <div className="skeleton" style={{ height: 11, width: "50%" }} />
                  </div>
                  <div className="skeleton" style={{ height: 14, width: 70 }} />
                </div>
              ))}
            </div>
          ) : recentSales.length === 0 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: "#EEF6FB",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Clock size={22} color="#0474AF" />
              </div>
              <span style={{ fontSize: "13px", color: "var(--c-muted)", fontWeight: 500 }}>
                Nenhuma venda ainda
              </span>
              <button className="btn-primary btn-sm" onClick={() => setPage("pdv")}>
                Fazer primeira venda
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              {recentSales.map((s, i) => (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    borderBottom: i < recentSales.length - 1 ? "1px solid var(--c-border)" : "none",
                    gap: 12,
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--c-text)" }}>
                      #{s.sale_number}
                      {s.customers?.name && (
                        <span style={{ fontWeight: 400, color: "var(--c-muted)", marginLeft: 6 }}>
                          · {s.customers.name}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--c-muted)", marginTop: 1 }}>
                      {fmtDate(s.created_at)} · {s.payment_methods?.name || "—"}
                    </div>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--c-accent)", flexShrink: 0 }}>
                    {fmt(s.total_amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Acesso rápido */}
      <div className="card anim-in-3" style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--c-text)", flexShrink: 0 }}>
          Acesso rápido
        </span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {/* Nova Venda — CTA principal com cor sólida */}
          <button
            onClick={() => setPage("pdv")}
            style={{
              padding: "7px 16px",
              borderRadius: "9px",
              fontSize: "12.5px",
              fontWeight: 700,
              background: "var(--c-accent)",
              color: "#fff",
              border: "1.5px solid var(--c-accent)",
              cursor: "pointer",
              transition: "all .15s",
              fontFamily: "var(--font-sans)",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--c-accent-deep)"; e.currentTarget.style.borderColor = "var(--c-accent-deep)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--c-accent)"; e.currentTarget.style.borderColor = "var(--c-accent)"; }}
          >
            Nova Venda
          </button>
          {[
            ["products",  "Produtos",  "#F0FDF4", "#16A34A"],
            ["customers", "Clientes",  "#F3F0FE", "#7C3AED"],
            ["stock",     "Estoque",   "#FEF9EC", "#D97706"],
          ].map(([p, l, bg, color]) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                padding: "7px 14px",
                borderRadius: "9px",
                fontSize: "12.5px",
                fontWeight: 600,
                background: bg,
                color: color,
                border: "1.5px solid transparent",
                cursor: "pointer",
                transition: "all .15s",
                fontFamily: "var(--font-sans)",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = color; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "transparent"; }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
