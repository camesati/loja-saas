import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { db } from "../config/supabase.js";
import { BarChart, Card, Title, Text, Metric } from "@tremor/react";
import { TrendingUp, Users, Package, ShoppingBag } from "lucide-react";

const fmt = (v) => `R$ ${Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

function KPICard({ icon: Icon, label, value, color = "text-accent" }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-accent/10 shrink-0`}>
        <Icon size={20} className={color} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="text-xl font-bold text-text truncate">{value}</p>
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

  useEffect(() => {
    if (!uid) return;
    loadAll();
  }, [uid]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const firstDay = new Date();
      firstDay.setDate(1);
      const firstDayStr = firstDay.toISOString().split("T")[0];

      // Vendas de hoje
      const salesHoje = await db.get(
        "sales",
        `user_id=eq.${uid}&created_at=gte.${today}T00:00:00&select=total_amount`,
        token
      );
      const totalHoje = salesHoje.reduce((s, r) => s + Number(r.total_amount), 0);

      // Vendas do mês
      const salesMes = await db.get(
        "sales",
        `user_id=eq.${uid}&created_at=gte.${firstDayStr}T00:00:00&select=total_amount`,
        token
      );
      const totalMes = salesMes.reduce((s, r) => s + Number(r.total_amount), 0);

      // Estoque total
      const products = await db.get("products", `user_id=eq.${uid}&select=quantity`, token);
      const totalEstoque = products.reduce((s, r) => s + Number(r.quantity), 0);

      // Clientes
      const clientes = await db.get("customers", `user_id=eq.${uid}&select=id`, token);

      // Últimas vendas
      const sales = await db.get(
        "sales",
        `user_id=eq.${uid}&order=created_at.desc&limit=5&select=id,sale_number,total_amount,created_at,customers(name),sellers(name),payment_methods(name)`,
        token
      );

      // Chart: últimos 7 dias
      const dt7 = new Date();
      dt7.setDate(dt7.getDate() - 6);
      const salesWeek = await db.get(
        "sales",
        `user_id=eq.${uid}&created_at=gte.${dt7.toISOString().split("T")[0]}T00:00:00&select=total_amount,created_at`,
        token
      );

      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split("T")[0];
      });

      const chartMap = {};
      salesWeek.forEach(s => {
        const day = s.created_at.split("T")[0];
        chartMap[day] = (chartMap[day] || 0) + Number(s.total_amount);
      });

      const chart = days.map(d => ({
        dia: new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" }),
        "Vendas (R$)": Number((chartMap[d] || 0).toFixed(2)),
      }));

      setKpi({ hoje: totalHoje, mes: totalMes, estoque: totalEstoque, clientes: clientes.length });
      setRecentSales(sales);
      setChartData(chart);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text">Dashboard</h2>
        <p className="text-sm text-muted">Visão geral do seu negócio</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={TrendingUp}  label="Vendas Hoje"    value={fmt(kpi.hoje)}     />
        <KPICard icon={ShoppingBag} label="Vendas do Mês"  value={fmt(kpi.mes)}      />
        <KPICard icon={Package}     label="Itens em Estoque" value={kpi.estoque}     />
        <KPICard icon={Users}       label="Clientes"       value={kpi.clientes}      />
      </div>

      {/* Chart + Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Gráfico */}
        <div className="card lg:col-span-3">
          <h3 className="text-sm font-semibold text-text mb-4">Vendas — últimos 7 dias</h3>
          {chartData.some(d => d["Vendas (R$)"] > 0) ? (
            <BarChart
              data={chartData}
              index="dia"
              categories={["Vendas (R$)"]}
              colors={["blue"]}
              valueFormatter={(v) => `R$ ${v.toFixed(2)}`}
              showLegend={false}
              className="h-44"
            />
          ) : (
            <div className="h-44 flex items-center justify-center text-muted text-sm">
              Nenhuma venda nos últimos 7 dias
            </div>
          )}
        </div>

        {/* Últimas vendas */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text">Últimas vendas</h3>
            <button onClick={() => setPage("reports")} className="text-xs text-accent hover:underline">
              Ver todas
            </button>
          </div>
          {recentSales.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">Nenhuma venda ainda</p>
          ) : (
            <div className="space-y-2">
              {recentSales.map(s => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="min-w-0">
                    <p className="text-xs text-text font-medium">#{s.sale_number}</p>
                    <p className="text-xs text-muted truncate">{s.customers?.name || "—"}</p>
                  </div>
                  <span className="text-xs font-semibold text-accent shrink-0">
                    {fmt(s.total_amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Atalhos */}
      <div className="card">
        <h3 className="text-sm font-semibold text-text mb-3">Acesso rápido</h3>
        <div className="flex flex-wrap gap-2">
          {[["pdv","Nova Venda"],["products","Produtos"],["customers","Clientes"],["stock","Estoque"]].map(([p, l]) => (
            <button key={p} onClick={() => setPage(p)} className="btn-secondary btn-sm">
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
