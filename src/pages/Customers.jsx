import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { db } from "../config/supabase.js";
import { useToast } from "../components/Toast.jsx";
import Modal from "../components/Modal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { Plus, Search, Pencil, Trash2, Users } from "lucide-react";

const EMPTY = { name: "", cpf: "", birth_date: "", email: "", profession: "" };

export default function Customers() {
  const { session } = useAuth();
  const token = session?.access_token;
  const uid = session?.user?.id;
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { load(); }, [uid]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await db.get("customers", `user_id=eq.${uid}&order=name.asc`, token);
      setRows(data || []);
    } finally { setLoading(false); }
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const openNew = () => { setForm(EMPTY); setModal("new"); };
  const openEdit = (r) => { setForm({ name: r.name, cpf: r.cpf || "", birth_date: r.birth_date || "", email: r.email || "", profession: r.profession || "" }); setModal(r); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...form, user_id: uid };
      if (!body.cpf) delete body.cpf;
      if (!body.birth_date) delete body.birth_date;
      if (!body.email) delete body.email;
      if (!body.profession) delete body.profession;

      if (modal === "new") {
        await db.post("customers", body, token);
        toast("Cliente cadastrado!");
      } else {
        await db.patch("customers", modal.id, body, token);
        toast("Cliente atualizado!");
      }
      setModal(null);
      load();
    } catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    try {
      await db.del("customers", deleting.id, token);
      toast("Cliente excluído!");
      setDeleting(null);
      load();
    } catch (e) { toast(e.message, "error"); }
  };

  const filtered = rows.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.cpf || "").includes(search) ||
    (r.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text">Clientes</h2>
          <p className="text-sm text-muted">{rows.length} cadastrados</p>
        </div>
        <button className="btn-primary" onClick={openNew}><Plus size={15} />Novo cliente</button>
      </div>

      {/* Busca */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, CPF ou email..." style={{ paddingLeft: "34px" }} />
      </div>

      {/* Tabela */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Nome","CPF","Email","Profissão","Ações"].map(h => (
                <th key={h} className="text-left text-xs text-muted font-medium px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="py-12 text-center text-muted text-sm">Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center">
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: "#EEF6FB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Users size={22} color="#0474AF" />
                    </div>
                    <p style={{ color: "var(--c-muted)", fontSize: "13px", margin: 0 }}>Nenhum cliente encontrado</p>
                  </div>
                </td>
              </tr>
            ) : filtered.map(r => (
              <tr key={r.id} className="table-row-hover border-b border-border last:border-0">
                <td className="px-4 py-3 text-text font-medium">{r.name}</td>
                <td className="px-4 py-3 text-muted">{r.cpf || "—"}</td>
                <td className="px-4 py-3 text-muted">{r.email || "—"}</td>
                <td className="px-4 py-3 text-muted">{r.profession || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button aria-label="Editar cliente" onClick={() => openEdit(r)} className="btn-secondary btn-sm"><Pencil size={12} /></button>
                    <button aria-label="Excluir cliente" onClick={() => setDeleting(r)} className="btn-danger btn-sm"><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <Modal title={modal === "new" ? "Novo cliente" : "Editar cliente"} onClose={() => setModal(null)}>
          <form onSubmit={save} className="grid grid-cols-2 gap-4">
            <div className="form-group col-span-2">
              <label className="input-label">Nome *</label>
              <input value={form.name} onChange={set("name")} required />
            </div>
            <div className="form-group">
              <label className="input-label">CPF</label>
              <input value={form.cpf} onChange={set("cpf")} placeholder="000.000.000-00" />
            </div>
            <div className="form-group">
              <label className="input-label">Data de nascimento</label>
              <input type="date" value={form.birth_date} onChange={set("birth_date")} />
            </div>
            <div className="form-group">
              <label className="input-label">Email</label>
              <input type="email" value={form.email} onChange={set("email")} />
            </div>
            <div className="form-group">
              <label className="input-label">Profissão</label>
              <input value={form.profession} onChange={set("profession")} />
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
          message={`Excluir o cliente "${deleting.name}"?`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
