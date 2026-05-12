import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { db } from "../config/supabase.js";
import { useToast } from "../components/Toast.jsx";
import Modal from "../components/Modal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { Plus, Pencil, Trash2, CreditCard } from "lucide-react";

const TYPES = { debit: "Débito", credit: "Crédito", pix: "PIX", cash: "Dinheiro" };
const EMPTY = { name: "", type: "pix", active: true };

export default function PaymentMethods() {
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
      const data = await db.get("payment_methods", `user_id=eq.${uid}&order=name.asc`, token);
      setRows(data || []);
    } finally { setLoading(false); }
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const openNew = () => { setForm(EMPTY); setModal("new"); };
  const openEdit = (r) => { setForm({ name: r.name, type: r.type, active: r.active }); setModal(r); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...form, user_id: uid };
      if (modal === "new") {
        await db.post("payment_methods", body, token);
        toast("Forma de pagamento criada!");
      } else {
        await db.patch("payment_methods", modal.id, body, token);
        toast("Atualizado!");
      }
      setModal(null);
      load();
    } catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const toggleActive = async (r) => {
    try {
      await db.patch("payment_methods", r.id, { active: !r.active }, token);
      toast(r.active ? "Desativado" : "Ativado");
      load();
    } catch (e) { toast(e.message, "error"); }
  };

  const confirmDelete = async () => {
    try {
      await db.del("payment_methods", deleting.id, token);
      toast("Excluído!");
      setDeleting(null);
      load();
    } catch (e) { toast(e.message, "error"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text">Formas de Pagamento</h2>
          <p className="text-sm text-muted">{rows.length} cadastradas</p>
        </div>
        <button className="btn-primary" onClick={openNew}><Plus size={15} />Nova forma</button>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Nome","Tipo","Status","Ações"].map(h => (
                <th key={h} className="text-left text-xs text-muted font-medium px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="py-12 text-center text-muted text-sm">Carregando...</td></tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center">
                  <CreditCard size={28} className="mx-auto mb-2 text-muted opacity-40" />
                  <p className="text-muted text-sm">Nenhuma forma cadastrada</p>
                </td>
              </tr>
            ) : rows.map(r => (
              <tr key={r.id} className="table-row-hover border-b border-border last:border-0">
                <td className="px-4 py-3 text-text font-medium">{r.name}</td>
                <td className="px-4 py-3">
                  <span className="badge-blue">{TYPES[r.type] || r.type}</span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(r)}>
                    <span className={r.active ? "badge-green" : "badge-red"}>
                      {r.active ? "Ativo" : "Inativo"}
                    </span>
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(r)} className="btn-secondary btn-sm"><Pencil size={12} /></button>
                    <button onClick={() => setDeleting(r)} className="btn-danger btn-sm"><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={modal === "new" ? "Nova forma de pagamento" : "Editar"} onClose={() => setModal(null)}>
          <form onSubmit={save} className="flex flex-col gap-4">
            <div className="form-group">
              <label className="input-label">Nome *</label>
              <input value={form.name} onChange={set("name")} required placeholder="Ex: PIX, Débito..." />
            </div>
            <div className="form-group">
              <label className="input-label">Tipo *</label>
              <select value={form.type} onChange={set("type")}>
                <option value="debit">Débito</option>
                <option value="credit">Crédito</option>
                <option value="pix">PIX</option>
                <option value="cash">Dinheiro</option>
              </select>
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
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          message={`Excluir "${deleting.name}"?`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
