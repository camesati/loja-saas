import { useState, useCallback, createContext, useContext } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const styles = {
    success: {
      bg: "#F0FDF4",
      border: "#BBF7D0",
      text: "#166534",
      icon: <CheckCircle size={15} style={{ color: "#16A34A" }} className="shrink-0" />,
    },
    error: {
      bg: "#FFF1F2",
      border: "#FECDD3",
      text: "#9F1239",
      icon: <XCircle size={15} style={{ color: "#E11D48" }} className="shrink-0" />,
    },
  };

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
        {toasts.map(t => {
          const s = styles[t.type] || styles.success;
          return (
            <div
              key={t.id}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm shadow-lg"
              style={{
                background: s.bg,
                border: `1.5px solid ${s.border}`,
                color: s.text,
                fontFamily: "'Open Sans', sans-serif",
                minWidth: "260px",
                maxWidth: "360px",
              }}
            >
              {s.icon}
              <span className="flex-1">{t.message}</span>
              <button
                onClick={() => remove(t.id)}
                style={{ opacity: 0.5, color: s.text }}
                className="hover:opacity-100 transition-opacity shrink-0"
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
