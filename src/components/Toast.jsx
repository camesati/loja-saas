import { useState, useCallback, createContext, useContext } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3800);
  }, []);

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const cfg = {
    success: { bg: "#F0FDF4", border: "#BBF7D0", text: "#065F46", icon: <CheckCircle2 size={15} color="#16A34A" style={{ flexShrink: 0 }} /> },
    error:   { bg: "#FFF1F2", border: "#FECDD3", text: "#9F1239", icon: <XCircle      size={15} color="#E11D48" style={{ flexShrink: 0 }} /> },
  };

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 50, display: "flex", flexDirection: "column", gap: 8 }}>
        {toasts.map(t => {
          const s = cfg[t.type] || cfg.success;
          return (
            <div key={t.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "11px 14px",
              background: s.bg,
              border: `1.5px solid ${s.border}`,
              borderRadius: "12px",
              color: s.text,
              fontSize: "13px",
              fontFamily: "var(--font-sans)",
              fontWeight: 500,
              boxShadow: "0 4px 16px rgba(42,63,82,0.10)",
              minWidth: "250px", maxWidth: "340px",
              animation: "fadeUp .25s ease both",
            }}>
              {s.icon}
              <span style={{ flex: 1 }}>{t.message}</span>
              <button
                onClick={() => remove(t.id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: s.text, opacity: .5, padding: 0, display: "flex" }}
                onMouseEnter={e => e.target.style.opacity = 1}
                onMouseLeave={e => e.target.style.opacity = .5}
              >
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
