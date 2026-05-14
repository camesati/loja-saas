import { X } from "lucide-react";
import { useEffect, useRef } from "react";

const MAX_WIDTHS = { sm: "380px", md: "540px", lg: "720px", xl: "900px" };

export default function Modal({ title, onClose, children, footer, size = "md" }) {
  const containerRef = useRef(null);
  const titleId = `modal-title-${Math.random().toString(36).slice(2, 7)}`;

  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);

    // Focus trap
    const focusable = containerRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable?.length) focusable[0].focus();

    const trapFocus = (e) => {
      if (!containerRef.current || e.key !== "Tab") return;
      const els = [...(containerRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ))];
      if (!els.length) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trapFocus);

    return () => {
      document.removeEventListener("keydown", h);
      document.removeEventListener("keydown", trapFocus);
    };
  }, [onClose]);

  return (
    <div className="modal-overlay">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="modal-container anim-modal-in"
        style={{ maxWidth: MAX_WIDTHS[size] || "540px" }}
      >
        {/* Header */}
        <div className="modal-header">
          <h3 id={titleId} className="modal-title">{title}</h3>
          <button onClick={onClose} aria-label="Fechar" className="modal-close">
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
