import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { db } from "../config/supabase.js";
import { BarChart } from "@tremor/react";
import { Search, ChevronDown, ChevronUp, FileText } from "lucide-react";

const fmt = (v) => `R$ ${Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
const fmtDate = (d) => new Date(d).toLocaleDateString("pt-BR");

function today() {
  return new Date().toISOString().split("T")[0];
}
function firstOfMonth() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().split("T")[0];
}

export default function Reports() {
  const { session } = useAuth();
  const token = session?.access_token;
  const uid = session?.user?.id;

  const [dateFrom, setDateFrom] = useState(firstOfMonth());
  const [dateTo, setDateTo] = useState(today());
  const [filterSeller, setFilterSeller] = useState("");
  const [filterPayment, setFilterPayment] = useState("");

  const [sales, setSales] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    loadSelects();
  }, [uid]);

  useEffect(() => {
    if (dateFrom && dateTo) search();
  }, [dateFrom, dateTo, filterSeller, filterPayment]);

  const loadSelects = async () => {
    const [s, p] = await Promise.all([
      db.get("sellers", `user_id=eq.${uid}&active=eq.true&order=name.asc`, token),
      db.get("payment_methods", `user_id=eq.${uid}&order=name.asc`, token),
    ]);
    setSellers(s || []);
    setPayments(p || []);
  };

  const search = async () => {
    setLoading(true);
    try {
      let q = `user_id=eq.${uid}&created_at=gte.${dateFrom}T00:00:00&created_at=lte.${dateTo}T23:59:59&order=created_at.desc`;
      q += `&select=*,customers(name),sellers(name),payment_methods(name),sale_items(sku,description,quantity,unit_price,total_price)`;
      if (filterSeller) q += `&seller_id=eq.${filterSeller}`;
      if (filterPayment) q += `&payment_method_id=eq.${filterPayment}`;
      const data = await db.get("sales", q, token);
      setSales(data || []);
    } finally { setLoading(false); }
  };

  const total = sales.reduce((s, r) => s + Number(r.total_amount), 0);
  const avgTicket = sales.length ? total / sales.length : 0;

  // Chart por dia
  const dayMap = {};
  sales.forEach(s => {
    const day = s.created_at.split("T")[0];
    dayMap[day] = (dayMap[day] || 0) + Number(s.total_amount);
  });
  const chartData = Object.entries(dayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([d, v]) => ({
      dia: new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      "Vendas (R$)": Number(v.toFixed(2)),
    }));

  // Top produtos
  const prodMap = {};
  sales.forEach(s => {
    (s.sale_items || []).forEach(i => {
      prodMap[i.sku] = prodMap[i.sku] || { sku: i.sku, description: i.description, qty: 0, total: 0 };
      prodMap[i.sku].qty += i.quantity;
      prodMap[i.sku].total += Number(i.total_price);
    });
  });
  const topProds = Object.values(prodMap).sort((a, b) => b.total - a.total).slice(0, 5);

  const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-text">Relatórios</h2>
        <p className="text-sm text-muted">Análise de vendas por período</p>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="flex flex-wrap gap-3">
          <div className="form-group flex-1 min-w-32">
            <label className="input-label">De</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="form-group flex-1 min-w-32">
            <label className="input-label">Até</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <div className="form-group flex-1 min-w-40">
            <label className="input-label">Vendedor</label>
            <select value={filterSeller} onChange={e => setFilterSeller(e.target.value)}>
              <option value="">Todos</option>
              {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group flex-1 min-w-40">
            <label className="input-label">Pagamento</label>
            <select value={filterPayment} onChange={e => setFilterPayment(e.target.value)}>
              <option value="">Todos</option>
              {payments.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          ["Total", fmt(total)],
          ["Nº de vendas", sales.length],
          ["Ticket médio", fmt(avgTicket)],
        ].map(([l, v]) => (
          <div key={l} className="card text-center">
            <p className="kpi-label">{l}</p>
            <p className="kpi-value mt-1">{v}</p>
          </div>
        ))}
      </div>

      {/* Chart + Top produtos */}
      {sales.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card lg:col-span-2">
            <h3 className="text-sm font-semibold text-text mb-4">Vendas por dia</h3>
            <BarChart
              data={chartData}
              index="dia"
              categories={["Vendas (R$)"]}
              colors={["blue"]}
              valueFormatter={(v) => `R$ ${v.toFixed(2)}`}
              showLegend={false}
              className="h-44"
            />
          </div>
          <div className="card">
            <h3 className="text-h3 mb-4">Top produtos</h3>
            {topProds.length === 0 ? (
              <p className="text-sm-ui">—</p>
            ) : (
              <div className="flex flex-col gap-3">
                {topProds.map((p, i) => {
                  const maxTotal = topProds[0]?.total || 1;
                  const pct = Math.round((p.total / maxTotal) * 100);
                  return (
                    <div key={p.sku}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs-ui text-muted w-4 shrink-0">{i + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-text truncate m-0">{p.description}</p>
                          <p className="text-xs text-muted m-0">{p.qty} un. · {fmt(p.total)} ({pct}%)</p>
                        </div>
                      </div>
                      <div className="h-[3px] rounded-full bg-border ml-5">
                        <div
                          className="h-full rounded-full transition-all duration-400"
                          style={{
                            background: "linear-gradient(90deg, var(--c-accent), var(--c-cyan))",
                            width: `${pct}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabela de vendas */}
      <div className="card overflow-x-auto p-0">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-text">Vendas do período</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Data</th>
              <th scope="col">Cliente</th>
              <th scope="col">Vendedor</th>
              <th scope="col">Pagamento</th>
              <th scope="col" className="th-right">Total</th>
              <th scope="col"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="skeleton-row">
                  <td><div className="skeleton-text w-12" /></td>
                  <td><div className="skeleton-text w-20" /></td>
                  <td><div className="skeleton-text w-28" /></td>
                  <td><div className="skeleton-text w-20" /></td>
                  <td><div className="skeleton-text w-16" /></td>
                  <td><div className="skeleton-text w-16 ml-auto" /></td>
                  <td></td>
                </tr>
              ))
            ) : sales.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2.5">
                    <div className="kpi-icon-wrap kpi-card--blue">
                      <FileText size={22} color="var(--c-accent)" />
                    </div>
                    <p className="text-sm-ui">Nenhuma venda no período</p>
                  </div>
                </td>
              </tr>
            ) : sales.map(r => (
              <>
                <tr key={r.id}>
                  <td className="td-mono">#{r.sale_number}</td>
                  <td className="td-muted">{fmtDate(r.created_at)}</td>
                  <td>{r.customers?.name || "—"}</td>
                  <td className="td-muted">{r.sellers?.name || "—"}</td>
                  <td className="td-muted">{r.payment_methods?.name || "—"}</td>
                  <td className="td-amount">{fmt(r.total_amount)}</td>
                  <td className="td-actions">
                    <button
                      onClick={() => toggleExpand(r.id)}
                      aria-label={expanded[r.id] ? "Recolher itens" : "Expandir itens"}
                      className="text-muted hover:text-text transition-colors"
                      style={{ background: "none", border: "none", cursor: "pointer" }}
                    >
                      {expanded[r.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </td>
                </tr>
                {expanded[r.id] && (
                  <tr key={`${r.id}-items`} style={{ background: "var(--c-bg)" }}>
                    <td colSpan={7} className="px-8 py-3">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-muted">
                            <th className="text-left pb-1" scope="col">SKU</th>
                            <th className="text-left pb-1" scope="col">Produto</th>
                            <th className="text-right pb-1" scope="col">Qtd</th>
                            <th className="text-right pb-1" scope="col">Unit.</th>
                            <th className="text-right pb-1" scope="col">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(r.sale_items || []).map((item, idx) => (
                            <tr key={idx}>
                              <td className="text-muted py-0.5">{item.sku}</td>
                              <td className="text-text py-0.5">{item.description}</td>
                              <td className="text-right text-muted py-0.5">{item.quantity}</td>
                              <td className="text-right text-muted py-0.5">{fmt(item.unit_price)}</td>
                              <td className="text-right py-0.5 font-semibold" style={{ color: "var(--c-accent)" }}>{fmt(item.total_price)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
