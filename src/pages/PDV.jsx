import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { db } from "../config/supabase.js";
import { useToast } from "../components/Toast.jsx";
import { Search, Plus, Minus, Trash2, CheckCircle, ShoppingCart } from "lucide-react";

const fmt = (v) => `R$ ${Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

export default function PDV() {
  const { session } = useAuth();
  const token = session?.access_token;
  const uid = session?.user?.id;
  const toast = useToast();

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [form, setForm] = useState({ customer_id: "", seller_id: "", payment_method_id: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => {
    loadSelects();
  }, [uid]);

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const q = search.toLowerCase();
    const results = products.filter(p =>
      p.sku.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    ).slice(0, 8);
    setSearchResults(results);
  }, [search, products]);

  const loadSelects = async () => {
    const [prods, cust, sell, pay] = await Promise.all([
      db.get("products", `user_id=eq.${uid}&order=description.asc`, token),
      db.get("customers", `user_id=eq.${uid}&order=name.asc`, token),
      db.get("sellers", `user_id=eq.${uid}&active=eq.true&order=name.asc`, token),
      db.get("payment_methods", `user_id=eq.${uid}&active=eq.true&order=name.asc`, token),
    ]);
    setProducts(prods || []);
    setCustomers(cust || []);
    setSellers(sell || []);
    setPayments(pay || []);
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        return prev.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        product_id: product.id,
        sku: product.sku,
        description: product.description,
        unit_price: product.unit_price,
        quantity: 1,
      }];
    });
    setSearch("");
    setSearchResults([]);
    searchRef.current?.focus();
  };

  const updateQty = (id, delta) => {
    setCart(prev =>
      prev.map(i => i.product_id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)
    );
  };

  const removeItem = (id) => setCart(prev => prev.filter(i => i.product_id !== id));

  const total = cart.reduce((s, i) => s + i.unit_price * i.quantity, 0);

  const finalize = async () => {
    if (cart.length === 0) { toast("Adicione produtos ao carrinho", "error"); return; }
    if (!form.payment_method_id) { toast("Selecione a forma de pagamento", "error"); return; }
    if (!form.seller_id) { toast("Selecione o vendedor", "error"); return; }

    setLoading(true);
    try {
      const saleBody = {
        total_amount: total,
        notes: form.notes || null,
        customer_id: form.customer_id || null,
        seller_id: form.seller_id,
        payment_method_id: form.payment_method_id,
        user_id: uid,
      };
      const [sale] = await db.post("sales", saleBody, token);

      await Promise.all(
        cart.map(item =>
          db.post("sale_items", {
            sale_id: sale.id,
            product_id: item.product_id,
            sku: item.sku,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            user_id: uid,
          }, token)
        )
      );

      setDone({ saleNumber: sale.sale_number, total });
      setCart([]);
      setForm({ customer_id: "", seller_id: "", payment_method_id: "", notes: "" });
    } catch (e) {
      toast(e.message || "Erro ao finalizar venda", "error");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 20 }}>
        <div style={{
          width: 64, height: 64,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #D0F0F6, #EEF6FB)",
          border: "2px solid #33B3CB",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <CheckCircle size={32} color="#0474AF" />
        </div>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--c-text)", margin: 0 }}>Venda finalizada!</h2>
          <p style={{ color: "var(--c-muted)", marginTop: 4, fontSize: "14px" }}>
            Venda #{done.saleNumber} — <strong style={{ color: "var(--c-accent)" }}>{fmt(done.total)}</strong>
          </p>
        </div>
        <button className="btn-primary" onClick={() => setDone(null)}>
          <ShoppingCart size={16} />
          Nova venda
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-text">PDV — Ponto de Venda</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Busca + Carrinho */}
        <div className="lg:col-span-2 space-y-3">
          {/* Busca */}
          <div className="card">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar produto por SKU ou nome..."
                style={{ paddingLeft: "36px" }}
                autoFocus
              />
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 border border-border rounded-lg overflow-hidden">
                {searchResults.map(p => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 text-left border-b border-border last:border-0 transition-colors"
                  >
                    <div>
                      <span className="text-xs text-muted mr-2">{p.sku}</span>
                      <span className="text-sm text-text">{p.description}</span>
                    </div>
                    <span className="text-sm font-semibold text-accent shrink-0 ml-4">
                      {fmt(p.unit_price)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Carrinho */}
          <div className="card">
            <h3 className="text-sm font-semibold text-text mb-3">Carrinho</h3>
            {cart.length === 0 ? (
              <div className="py-10 text-center text-muted text-sm">
                <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
                Busque e adicione produtos
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.product_id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted">{item.sku}</p>
                      <p className="text-sm text-text truncate">{item.description}</p>
                      <p className="text-xs text-accent">{fmt(item.unit_price)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => updateQty(item.product_id, -1)} className="w-7 h-7 rounded bg-[#EDF3FB] flex items-center justify-center text-muted hover:text-text">
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-sm text-text font-medium">{item.quantity}</span>
                      <button onClick={() => updateQty(item.product_id, +1)} className="w-7 h-7 rounded bg-[#EDF3FB] flex items-center justify-center text-muted hover:text-text">
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-text shrink-0 w-20 text-right">
                      {fmt(item.unit_price * item.quantity)}
                    </span>
                    <button onClick={() => removeItem(item.product_id)} className="text-red-500 hover:text-red-400 shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Painel de finalização */}
        <div className="space-y-3">
          <div className="card space-y-4">
            <h3 className="text-sm font-semibold text-text">Detalhes da venda</h3>

            <div className="form-group">
              <label className="input-label">Cliente (opcional)</label>
              <select value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}>
                <option value="">— Sem cliente —</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="input-label">Vendedor *</label>
              <select value={form.seller_id} onChange={e => setForm(f => ({ ...f, seller_id: e.target.value }))}>
                <option value="">Selecione...</option>
                {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="input-label">Forma de pagamento *</label>
              <select value={form.payment_method_id} onChange={e => setForm(f => ({ ...f, payment_method_id: e.target.value }))}>
                <option value="">Selecione...</option>
                {payments.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="input-label">Observações</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Opcional..." />
            </div>
          </div>

          {/* Total */}
          <div className="card">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted">Itens</span>
              <span className="text-sm text-text">{cart.reduce((s, i) => s + i.quantity, 0)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3 mt-2">
              <span className="text-base font-semibold text-text">Total</span>
              <span className="text-xl font-bold text-accent">{fmt(total)}</span>
            </div>
            <button
              className={`btn-primary w-full justify-center mt-4${loading ? " btn-loading" : ""}`}
              onClick={finalize}
              disabled={loading || cart.length === 0}
            >
              {loading ? "" : "Finalizar venda"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
