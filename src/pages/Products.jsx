import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { db } from "../config/supabase.js";
import { useToast } from "../components/Toast.jsx";
import Modal from "../components/Modal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { Plus, Search, Pencil, Trash2, Package, AlertTriangle } from "lucide-react";

const EMPTY = { sku: "", description: "", unit_price: "", quantity: "", group_id: "", category_id: "" };

export default function Products() {
  const { session } = useAuth();
  const token = session?.access_token;
  const uid = session?.user?.id;
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [groups, setGroups] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { load(); }, [uid]);

  const load = async () => {
    setLoading(true);
    try {
      const [prods, grps, cats] = await Promise.all([
        db.get("products", `user_id=eq.${uid}&order=sku.asc&select=*,groups(name),categories(name)`, token),
        db.get("groups", `user_id=eq.${uid}&order=name.asc`, token),
        db.get("categories", `user_id=eq.${uid}&order=name.asc`, token),
      ]);
      setRows(prods || []);
      setGroups(grps || []);
      setCategories(cats || []);
    } finally { setLoading(false); }
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const openNew = () => { setForm(EMPTY); setModal("new"); };
  const openEdit = (r) => {
    setForm({
      sku: r.sku, description: r.description,
      unit_price: r.unit_price, quantity: r.quantity,
      group_id: r.group_id || "", category_id: r.category_id || "",
    });
    setModal(r);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        ...form,
        unit_price: Number(form.unit_price),
        quantity: Number(form.quantity),
        group_id: form.group_id || null,
        category_id: form.category_id || null,
        user_id: uid,
      };
      if (modal === "new") {
        await db.post("products", body, token);
        toast("Produto cadastrado!");
      } else {
        await db.patch("products", modal.id, body, token);
        toast("Produto atualizado!");
      }
      setModal(null);
      load();
    } catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    try {
      await db.del("products", deleting.id, token);
      toast("Produto excluído!");
      setDeleting(null);
      load();
    } catch (e) { toast(e.message, "error"); }
  };

  const filteredCats = form.group_id
    ? categories.filter(c => c.group_id === form.group_id)
    : categories;

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.sku.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
    const matchGroup = !filterGroup || r.group_id === filterGroup;
    return matchSearch && matchGroup;
  });

  const fmt = (v) => `R$ ${Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text">Produtos</h2>
          <p className="text-sm text-muted">{rows.length} cadastrados</p>
        </div>
        <button className="btn-primary" onClick={openNew}><Plus size={15} />Novo produto</button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="SKU ou descrição..." style={{ paddingLeft: "34px" }} />
        </div>
        <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)} className="w-40">
          <option value="">Todos os grupos</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {/* Tabela */}
      <div className="card overflow-x-auto p-0">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">SKU</th>
              <th scope="col">Descrição</th>
              <th scope="col">Grupo</th>
              <th scope="col">Categoria</th>
              <th scope="col" className="th-right">Preço</th>
              <th scope="col">Estoque</th>
              <th scope="col" className="th-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="skeleton-row">
                  <td><div className="skeleton-text w-16" /></td>
                  <td><div className="skeleton-text w-40" /></td>
                  <td><div className="skeleton-text w-20" /></td>
                  <td><div className="skeleton-text w-20" /></td>
                  <td><div className="skeleton-text w-16 ml-auto" /></td>
                  <td><div className="skeleton-badge" /></td>
                  <td><div className="skeleton-text w-16 ml-auto" /></td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2.5">
                    <div className="kpi-icon-wrap kpi-card--blue">
                      <Package size={22} color="var(--c-accent)" />
                    </div>
                    <p className="text-sm-ui">Nenhum produto encontrado</p>
                  </div>
                </td>
              </tr>
            ) : filtered.map(r => (
              <tr key={r.id}>
                <td className="td-mono">{r.sku}</td>
                <td className="max-w-48 truncate font-medium">{r.description}</td>
                <td className="td-muted">{r.groups?.name || "—"}</td>
                <td className="td-muted">{r.categories?.name || "—"}</td>
                <td className="td-amount">{fmt(r.unit_price)}</td>
                <td>
                  <span className={`${r.quantity <= 5 ? "badge-red" : r.quantity <= 15 ? "badge-orange" : "badge-green"} inline-flex items-center gap-1`}>
                    {r.quantity <= 5 && <AlertTriangle size={10} />}
                    {r.quantity} un.
                  </span>
                </td>
                <td className="td-actions">
                  <div className="flex gap-2 justify-end">
                    <button aria-label="Editar produto" onClick={() => openEdit(r)} className="btn-secondary btn-sm"><Pencil size={12} /></button>
                    <button aria-label="Excluir produto" onClick={() => setDeleting(r)} className="btn-danger btn-sm"><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={modal === "new" ? "Novo produto" : "Editar produto"} onClose={() => setModal(null)}>
          <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="input-label">SKU *</label>
              <input value={form.sku} onChange={set("sku")} required placeholder="EX001" />
            </div>
            <div className="form-group col-span-2">
              <label className="input-label">Descrição *</label>
              <input value={form.description} onChange={set("description")} required />
            </div>
            <div className="form-group">
              <label className="input-label">Preço unitário *</label>
              <input type="number" step="0.01" min="0" value={form.unit_price} onChange={set("unit_price")} required />
            </div>
            <div className="form-group">
              <label className="input-label">Quantidade *</label>
              <input type="number" min="0" value={form.quantity} onChange={set("quantity")} required />
            </div>
            <div className="form-group">
              <label className="input-label">Grupo</label>
              <select value={form.group_id} onChange={e => { set("group_id")(e); setForm(f => ({ ...f, group_id: e.target.value, category_id: "" })); }}>
                <option value="">— Nenhum —</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="input-label">Categoria</label>
              <select value={form.category_id} onChange={set("category_id")}>
                <option value="">— Nenhuma —</option>
                {filteredCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="col-span-2 flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button type="submit" className={`btn-primary${saving ? " btn-loading" : ""}`} disabled={saving}>{saving ? "" : "Salvar"}</button>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          message={`Excluir o produto "${deleting.description}"?`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
