import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({ message, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-card border border-border rounded-xl w-full max-w-sm shadow-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-900/40 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <p className="text-text text-sm">{message}</p>
        </div>
        <div className="flex gap-2 justify-end">
          <button className="btn-secondary btn-sm" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
          <button className="btn-danger btn-sm" onClick={onConfirm} disabled={loading}>
            {loading ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}
