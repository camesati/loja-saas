import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { db } from "../config/supabase.js";
import { useToast } from "../components/Toast.jsx";
import Modal from "../components/Modal.jsx";
import { Plus, Search, Layers } from "lucide-react";

const EMPTY = { sku: "", description: "", quantity: "", unit_cost: "", notes: "" };

export default function StockEntries() {
  const { session } = useAuth();
  const token = session?.access_token;
  const uid = session?.user?.id;
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [uid]);

  const load = async () => {
    setLoading(true);
    try {
      const [entries, prods] = await Promise.all([
        db.get("stock_entries", `user_id=eq.${uid}&order=created_at.desc`, token),
        db.get("products", `user_id=eq.${uid}&order=description.asc`, token),
      ]);
      setRows(entries || []);
      setProducts(prods || []);
    } finally { setLoading(false); }
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const selectProduct = (e) => {
    const prod = products.find(p => p.id === e.target.value);
    if (prod) setForm(f => ({ ...f, sku: prod.sku, description: prod.description, unit_cost: prod.unit_price }));
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await db.post("stock_entries", {
        sku: form.sku,
        description: form.description,
        quantity: Number(form.quantity),
        unit_cost: Number(form.unit_cost),
        notes: form.notes || null,
        user_id: uid,
      }, token);
      toast("Entrada de estoque registrada!");
      setModal(false);
      setForm(EMPTY);
      load();
    } catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const fmt = (v) => `R$ ${Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    return !q || r.sku.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text">Entradas de Estoque</h2>
          <p className="text-sm text-muted">{rows.length} registros</p>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}><Plus size={15} />Nova entrada</button>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por SKU ou produto..." style={{ paddingLeft: "34px" }} />
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">SKU</th>
              <th scope="col">Descrição</th>
              <th scope="col" className="th-right">Qtd</th>
              <th scope="col" className="th-right">Custo Unit.</th>
              <th scope="col" className="th-right">Total</th>
              <th scope="col">Obs.</th>
              <th scope="col">Data</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="skeleton-row">
                  <td><div className="skeleton-text w-16" /></td>
                  <td><div className="skeleton-text w-40" /></td>
                  <td><div className="skeleton-text w-10 ml-auto" /></td>
                  <td><div className="skeleton-text w-16 ml-auto" /></td>
                  <td><div className="skeleton-text w-16 ml-auto" /></td>
                  <td><div className="skeleton-text w-20" /></td>
                  <td><div className="skeleton-text w-20" /></td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2.5">
                    <div className="kpi-icon-wrap kpi-card--blue">
                      <Layers size={22} color="var(--c-accent)" />
                    </div>
                    <p className="text-sm-ui">Nenhuma entrada registrada</p>
                  </div>
                </td>
              </tr>
            ) : filtered.map(r => (
              <tr key={r.id}>
                <td className="td-mono">{r.sku}</td>
                <td>{r.description}</td>
                <td className="td-amount" style={{ color: "var(--c-success)" }}>+{r.quantity}</td>
                <td className="td-amount">{fmt(r.unit_cost)}</td>
                <td className="td-amount">{fmt(r.quantity * r.unit_cost)}</td>
                <td className="td-muted">{r.notes || "—"}</td>
                <td className="td-muted">{new Date(r.created_at).toLocaleDateString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title="Nova entrada de estoque" onClose={() => { setModal(false); setForm(EMPTY); }}>
          <form onSubmit={save} className="flex flex-col gap-4">
            <div className="form-group">
              <label className="input-label">Produto</label>
              <select onChange={selectProduct} defaultValue="">
                <option value="">— Selecione para preencher —</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.description}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="input-label">SKU *</label>
                <input value={form.sku} onChange={set("sku")} required />
              </div>
              <div className="form-group col-span-2">
                <label className="input-label">Descrição *</label>
                <input value={form.description} onChange={set("description")} required />
              </div>
              <div className="form-group">
                <label className="input-label">Quantidade *</label>
                <input type="number" min="1" value={form.quantity} onChange={set("quantity")} required />
              </div>
              <div className="form-group">
                <label className="input-label">Custo unitário</label>
                <input type="number" step="0.01" min="0" value={form.unit_cost} onChange={set("unit_cost")} />
              </div>
              <div className="form-group col-span-2">
                <label className="input-label">Observações</label>
                <input value={form.notes} onChange={set("notes")} placeholder="Opcional..." />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => { setModal(false); setForm(EMPTY); }}>Cancelar</button>
              <button type="submit" className={`btn-primary${saving ? " btn-loading" : ""}`} disabled={saving}>{saving ? "" : "Registrar entrada"}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
