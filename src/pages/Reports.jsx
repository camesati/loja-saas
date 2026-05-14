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
      <div className="grid grid-cols-3 gap-4">
        {[
          ["Total", fmt(total)],
          ["Nº de vendas", sales.length],
          ["Ticket médio", fmt(avgTicket)],
        ].map(([l, v]) => (
          <div key={l} className="card text-center">
            <p className="text-xs text-muted">{l}</p>
            <p className="text-2xl font-bold text-text mt-1">{v}</p>
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
            <h3 className="text-sm font-semibold text-text mb-4">Top produtos</h3>
            {topProds.length === 0 ? (
              <p className="text-sm text-muted">—</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {topProds.map((p, i) => {
                  const maxTotal = topProds[0]?.total || 1;
                  const pct = Math.round((p.total / maxTotal) * 100);
                  return (
                    <div key={p.sku}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: "11px", color: "var(--c-muted)", width: 14 }}>{i + 1}.</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "12px", color: "var(--c-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                            {p.description}
                          </p>
                          <p style={{ fontSize: "11px", color: "var(--c-muted)", margin: 0 }}>
                            {p.qty} un. · {fmt(p.total)}
                          </p>
                        </div>
                      </div>
                      <div style={{ height: 3, borderRadius: 4, background: "var(--c-border)", marginLeft: 20 }}>
                        <div style={{
                          height: "100%", borderRadius: 4,
                          background: "linear-gradient(90deg, #0474AF, #33B3CB)",
                          width: `${pct}%`,
                          transition: "width .4s ease",
                        }} />
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
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["#","Data","Cliente","Vendedor","Pagamento","Total",""].map(h => (
                <th key={h} className="text-left text-xs text-muted font-medium px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="py-12 text-center text-muted text-sm">Carregando...</td></tr>
            ) : sales.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <FileText size={28} className="mx-auto mb-2 text-muted opacity-40" />
                  <p className="text-muted text-sm">Nenhuma venda no período</p>
                </td>
              </tr>
            ) : sales.map(r => (
              <>
                <tr key={r.id} className="table-row-hover border-b border-border">
                  <td className="px-4 py-3 text-muted text-xs">#{r.sale_number}</td>
                  <td className="px-4 py-3 text-muted text-xs">{fmtDate(r.created_at)}</td>
                  <td className="px-4 py-3 text-text">{r.customers?.name || "—"}</td>
                  <td className="px-4 py-3 text-muted text-xs">{r.sellers?.name || "—"}</td>
                  <td className="px-4 py-3 text-muted text-xs">{r.payment_methods?.name || "—"}</td>
                  <td className="px-4 py-3 text-accent font-semibold">{fmt(r.total_amount)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleExpand(r.id)} className="text-muted hover:text-text">
                      {expanded[r.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </td>
                </tr>
                {expanded[r.id] && (
                  <tr key={`${r.id}-items`} className="bg-[#F6FAFE]">
                    <td colSpan={7} className="px-8 py-3">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-muted">
                            <th className="text-left pb-1">SKU</th>
                            <th className="text-left pb-1">Produto</th>
                            <th className="text-right pb-1">Qtd</th>
                            <th className="text-right pb-1">Unit.</th>
                            <th className="text-right pb-1">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(r.sale_items || []).map((i, idx) => (
                            <tr key={idx}>
                              <td className="text-muted py-0.5">{i.sku}</td>
                              <td className="text-text py-0.5">{i.description}</td>
                              <td className="text-right text-muted py-0.5">{i.quantity}</td>
                              <td className="text-right text-muted py-0.5">{fmt(i.unit_price)}</td>
                              <td className="text-right text-accent py-0.5">{fmt(i.total_price)}</td>
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
