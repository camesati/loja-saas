import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({ message, onConfirm, onCancel, loading }) {
  const descId = "confirm-dialog-desc";

  return (
    <div className="modal-overlay">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-describedby={descId}
        className="card anim-modal-in max-w-sm w-full"
        style={{ padding: 24 }}
      >
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "var(--c-danger-bg)", border: "1px solid #FECACA" }}>
            <AlertTriangle size={18} color="var(--c-danger)" />
          </div>
          <p id={descId} className="text-body m-0 leading-relaxed">
            {message}
          </p>
        </div>
        <div className="modal-footer" style={{ padding: 0, background: "transparent", border: "none" }}>
          <button className="btn-secondary btn-sm" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
          <button
            className={`btn-danger btn-sm${loading ? " btn-loading" : ""}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "" : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}
