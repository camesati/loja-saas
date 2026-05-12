import { X } from "lucide-react";
import { useEffect } from "react";

export default function Modal({ title, onClose, children, size = "md" }) {
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(45, 74, 94, 0.22)" }}
    >
      <div
        className={`bg-white w-full ${widths[size]} max-h-[90vh] flex flex-col rounded-2xl overflow-hidden`}
        style={{
          border: "1.5px solid #E4ECF2",
          boxShadow: "0 8px 32px rgba(45, 74, 94, 0.12), 0 2px 8px rgba(45, 74, 94, 0.08)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-border"
        >
          <h3
            className="font-semibold text-text text-sm"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-text transition-colors"
            style={{ background: "#F8FAFB" }}
          >
            <X size={15} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}
