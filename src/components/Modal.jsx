import { X } from "lucide-react";
import { useEffect } from "react";

export default function Modal({ title, onClose, children, size = "md" }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const maxW = { sm: "380px", md: "540px", lg: "720px", xl: "900px" }[size] || "540px";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
      background: "rgba(42,63,82,0.18)",
      backdropFilter: "blur(4px)",
    }}>
      <div className="anim-in" style={{
        background: "#fff",
        border: "1.5px solid var(--c-border)",
        borderRadius: "20px",
        width: "100%",
        maxWidth: maxW,
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 12px 48px rgba(42,63,82,0.14), 0 2px 8px rgba(42,63,82,0.06)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 24px",
          borderBottom: "1.5px solid var(--c-border)",
          flexShrink: 0,
        }}>
          <h3 style={{
            fontFamily: "var(--font-sans)",
            fontSize: "15px",
            fontWeight: 700,
            color: "var(--c-text)",
            margin: 0,
          }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28,
              borderRadius: "8px",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "#F5F8FC",
              border: "1.5px solid var(--c-border)",
              cursor: "pointer",
              color: "var(--c-muted)",
              transition: "all .15s",
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#E2EAF2"; e.currentTarget.style.color = "var(--c-text)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#F5F8FC"; e.currentTarget.style.color = "var(--c-muted)"; }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "22px 24px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
