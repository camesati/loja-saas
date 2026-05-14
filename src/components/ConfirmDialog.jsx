import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({ message, onConfirm, onCancel, loading }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
      background: "rgba(42,63,82,0.18)",
      backdropFilter: "blur(4px)",
    }}>
      <div className="card anim-in" style={{ width: "100%", maxWidth: 360, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 40, height: 40,
            borderRadius: "50%",
            background: "#FEE2E2",
            border: "1px solid #FECACA",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <AlertTriangle size={18} color="#DC2626" />
          </div>
          <p style={{ color: "var(--c-text)", fontSize: "14px", lineHeight: 1.5, margin: 0 }}>
            {message}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn-secondary btn-sm" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
          <button className={`btn-danger btn-sm${loading ? " btn-loading" : ""}`} onClick={onConfirm} disabled={loading}>
            {loading ? "" : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}
