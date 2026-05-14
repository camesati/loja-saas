import { useState, useCallback, createContext, useContext } from "react";
import { CheckCircle2, XCircle, Info, AlertCircle, X } from "lucide-react";

const ToastContext = createContext(null);

const TOAST_CFG = {
  success: { cls: "toast-success", icon: CheckCircle2, iconColor: "var(--c-success)" },
  error:   { cls: "toast-error",   icon: XCircle,      iconColor: "var(--c-danger)" },
  info:    { cls: "toast-info",    icon: Info,         iconColor: "var(--c-cyan)" },
  warning: { cls: "toast-warning", icon: AlertCircle,  iconColor: "var(--c-warning)" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3800);
  }, []);

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div
        role="region"
        aria-live="polite"
        aria-label="Notificações"
        className="toast-container"
      >
        {toasts.map(t => {
          const cfg = TOAST_CFG[t.type] || TOAST_CFG.success;
          const IconComp = cfg.icon;
          return (
            <div key={t.id} className={`toast-item ${cfg.cls}`}>
              <IconComp size={15} color={cfg.iconColor} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{t.message}</span>
              <button
                onClick={() => remove(t.id)}
                aria-label="Fechar notificação"
                className="toast-dismiss"
                style={{ color: "currentColor" }}
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
