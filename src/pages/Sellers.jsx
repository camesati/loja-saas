import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { db } from "../config/supabase.js";
import { useToast } from "../components/Toast.jsx";
import Modal from "../components/Modal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { Plus, Pencil, Trash2, UserCheck } from "lucide-react";

const EMPTY = { seller_code: "", name: "", active: true };

export default function Sellers() {
  const { session } = useAuth();
  const token = session?.access_token;
  const uid = session?.user?.id;
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { load(); }, [uid]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await db.get("sellers", `user_id=eq.${uid}&order=name.asc`, token);
      setRows(data || []);
    } finally { setLoading(false); }
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const openNew = () => { setForm(EMPTY); setModal("new"); };
  const openEdit = (r) => { setForm({ seller_code: r.seller_code, name: r.name, active: r.active }); setModal(r); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...form, user_id: uid };
      if (modal === "new") {
        await db.post("sellers", body, token);
        toast("Vendedor cadastrado!");
      } else {
        await db.patch("sellers", modal.id, body, token);
        toast("Vendedor atualizado!");
      }
      setModal(null);
      load();
    } catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const toggleActive = async (r) => {
    try {
      await db.patch("sellers", r.id, { active: !r.active }, token);
      toast(r.active ? "Vendedor desativado" : "Vendedor ativado");
      load();
    } catch (e) { toast(e.message, "error"); }
  };

  const confirmDelete = async () => {
    try {
      await db.del("sellers", deleting.id, token);
      toast("Vendedor excluído!");
      setDeleting(null);
      load();
    } catch (e) { toast(e.message, "error"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text">Vendedores</h2>
          <p className="text-sm text-muted">{rows.length} cadastrados</p>
        </div>
        <button className="btn-primary" onClick={openNew}><Plus size={15} />Novo vendedor</button>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Código</th>
              <th scope="col">Nome</th>
              <th scope="col">Status</th>
              <th scope="col" className="th-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i} className="skeleton-row">
                  <td><div className="skeleton-text w-16" /></td>
                  <td><div className="skeleton-text w-32" /></td>
                  <td><div className="skeleton-badge" /></td>
                  <td><div className="skeleton-text w-16 ml-auto" /></td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2.5">
                    <div className="kpi-icon-wrap kpi-card--blue">
                      <UserCheck size={22} color="var(--c-accent)" />
                    </div>
                    <p className="text-sm-ui">Nenhum vendedor cadastrado</p>
                  </div>
                </td>
              </tr>
            ) : rows.map(r => (
              <tr key={r.id}>
                <td className="td-mono">{r.seller_code}</td>
                <td className="font-medium">{r.name}</td>
                <td>
                  <button
                    onClick={() => toggleActive(r)}
                    aria-label={r.active ? "Desativar vendedor" : "Ativar vendedor"}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    <span className={r.active ? "badge-green" : "badge-red"} style={{ cursor: "pointer", minHeight: 28 }}>
                      {r.active ? "Ativo" : "Inativo"}
                    </span>
                  </button>
                </td>
                <td className="td-actions">
                  <div className="flex gap-2 justify-end">
                    <button aria-label="Editar vendedor" onClick={() => openEdit(r)} className="btn-secondary btn-sm"><Pencil size={12} /></button>
                    <button aria-label="Excluir vendedor" onClick={() => setDeleting(r)} className="btn-danger btn-sm"><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={modal === "new" ? "Novo vendedor" : "Editar vendedor"} onClose={() => setModal(null)}>
          <form onSubmit={save} className="flex flex-col gap-4">
            <div className="form-group">
              <label className="input-label">Código *</label>
              <input value={form.seller_code} onChange={set("seller_code")} required placeholder="VEN001" />
            </div>
            <div className="form-group">
              <label className="input-label">Nome *</label>
              <input value={form.name} onChange={set("name")} required />
            </div>
            <div className="form-group">
              <label className="input-label">Status</label>
              <select value={form.active ? "1" : "0"} onChange={e => setForm(f => ({ ...f, active: e.target.value === "1" }))}>
                <option value="1">Ativo</option>
                <option value="0">Inativo</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button type="submit" className={`btn-primary${saving ? " btn-loading" : ""}`} disabled={saving}>{saving ? "" : "Salvar"}</button>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          message={`Excluir o vendedor "${deleting.name}"?`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
