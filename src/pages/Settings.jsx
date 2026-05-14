import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { db } from "../config/supabase.js";
import { useToast } from "../components/Toast.jsx";
import Modal from "../components/Modal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { Plus, Pencil, Trash2, Save } from "lucide-react";

export default function Settings() {
  const { session } = useAuth();
  const token = session?.access_token;
  const uid = session?.user?.id;
  const toast = useToast();

  const [tab, setTab] = useState("profile");

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-text">Configurações</h2>

      {/* Tabs */}
      <div className="flex border-b border-border" role="tablist" aria-label="Configurações">
        {[["profile","Perfil"],["groups","Grupos"],["categories","Categorias"]].map(([k, l]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            aria-controls={`panel-${k}`}
            id={`tab-${k}`}
            onClick={() => setTab(k)}
            className={`pb-3 px-4 text-sm border-b-2 transition-colors ${
              tab === k ? "border-accent text-accent font-semibold" : "border-transparent text-muted hover:text-text"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div id="panel-profile" role="tabpanel" aria-labelledby="tab-profile" hidden={tab !== "profile"}>
        {tab === "profile" && <ProfileTab uid={uid} token={token} toast={toast} />}
      </div>
      <div id="panel-groups" role="tabpanel" aria-labelledby="tab-groups" hidden={tab !== "groups"}>
        {tab === "groups" && <GroupsTab uid={uid} token={token} toast={toast} />}
      </div>
      <div id="panel-categories" role="tabpanel" aria-labelledby="tab-categories" hidden={tab !== "categories"}>
        {tab === "categories" && <CategoriesTab uid={uid} token={token} toast={toast} />}
      </div>
    </div>
  );
}

function ProfileTab({ uid, token, toast }) {
  const [storeName, setStoreName] = useState("");
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    db.get("profiles", `id=eq.${uid}`, token).then(([p]) => {
      if (p) { setStoreName(p.store_name || ""); setFullName(p.full_name || ""); }
    });
  }, [uid]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await db.patch("profiles", uid, { store_name: storeName, full_name: fullName }, token);
      toast("Perfil atualizado!");
    } catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={save} className="card max-w-md space-y-4">
      <h3 className="text-sm font-semibold text-text">Dados da loja</h3>
      <div className="form-group">
        <label className="input-label">Nome da loja</label>
        <input value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="Ex: Minha Loja de Roupas" />
      </div>
      <div className="form-group">
        <label className="input-label">Seu nome</label>
        <input value={fullName} onChange={e => setFullName(e.target.value)} />
      </div>
      <button type="submit" className="btn-primary" disabled={saving}>
        <Save size={14} />
        {saving ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}

function GroupsTab({ uid, token, toast }) {
  const [rows, setRows] = useState([]);
  const [modal, setModal] = useState(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    const data = await db.get("groups", `user_id=eq.${uid}&order=name.asc`, token);
    setRows(data || []);
  };

  useEffect(() => { load(); }, [uid]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === "new") {
        await db.post("groups", { name, user_id: uid }, token);
        toast("Grupo criado!");
      } else {
        await db.patch("groups", modal.id, { name }, token);
        toast("Grupo atualizado!");
      }
      setModal(null);
      load();
    } catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    try {
      await db.del("groups", deleting.id, token);
      toast("Grupo excluído!");
      setDeleting(null);
      load();
    } catch (e) { toast(e.message, "error"); }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => { setName(""); setModal("new"); }}>
          <Plus size={14} />Novo grupo
        </button>
      </div>
      <div className="card overflow-x-auto p-0 max-w-lg">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Nome</th>
              <th scope="col" className="th-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={2} className="py-8 text-center text-sm-ui">Nenhum grupo cadastrado</td></tr>
            ) : rows.map(r => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td className="td-actions">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => { setName(r.name); setModal(r); }} className="btn-secondary btn-sm"><Pencil size={12} /></button>
                    <button onClick={() => setDeleting(r)} className="btn-danger btn-sm"><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={modal === "new" ? "Novo grupo" : "Editar grupo"} onClose={() => setModal(null)} size="sm">
          <form onSubmit={save} className="flex flex-col gap-4">
            <div className="form-group">
              <label className="input-label">Nome *</label>
              <input value={name} onChange={e => setName(e.target.value)} required autoFocus />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          message={`Excluir o grupo "${deleting.name}"?`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

function CategoriesTab({ uid, token, toast }) {
  const [rows, setRows] = useState([]);
  const [groups, setGroups] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: "", group_id: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    const [cats, grps] = await Promise.all([
      db.get("categories", `user_id=eq.${uid}&order=name.asc&select=*,groups(name)`, token),
      db.get("groups", `user_id=eq.${uid}&order=name.asc`, token),
    ]);
    setRows(cats || []);
    setGroups(grps || []);
  };

  useEffect(() => { load(); }, [uid]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { name: form.name, group_id: form.group_id || null, user_id: uid };
      if (modal === "new") {
        await db.post("categories", body, token);
        toast("Categoria criada!");
      } else {
        await db.patch("categories", modal.id, body, token);
        toast("Categoria atualizada!");
      }
      setModal(null);
      load();
    } catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    try {
      await db.del("categories", deleting.id, token);
      toast("Categoria excluída!");
      setDeleting(null);
      load();
    } catch (e) { toast(e.message, "error"); }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => { setForm({ name: "", group_id: "" }); setModal("new"); }}>
          <Plus size={14} />Nova categoria
        </button>
      </div>
      <div className="card overflow-x-auto p-0 max-w-lg">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Nome</th>
              <th scope="col">Grupo</th>
              <th scope="col" className="th-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={3} className="py-8 text-center text-sm-ui">Nenhuma categoria cadastrada</td></tr>
            ) : rows.map(r => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td className="td-muted">{r.groups?.name || "—"}</td>
                <td className="td-actions">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => { setForm({ name: r.name, group_id: r.group_id || "" }); setModal(r); }} className="btn-secondary btn-sm"><Pencil size={12} /></button>
                    <button onClick={() => setDeleting(r)} className="btn-danger btn-sm"><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={modal === "new" ? "Nova categoria" : "Editar categoria"} onClose={() => setModal(null)} size="sm">
          <form onSubmit={save} className="flex flex-col gap-4">
            <div className="form-group">
              <label className="input-label">Nome *</label>
              <input value={form.name} onChange={set("name")} required autoFocus />
            </div>
            <div className="form-group">
              <label className="input-label">Grupo</label>
              <select value={form.group_id} onChange={set("group_id")}>
                <option value="">— Nenhum —</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          message={`Excluir a categoria "${deleting.name}"?`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
