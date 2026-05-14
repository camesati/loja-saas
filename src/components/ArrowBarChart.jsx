import { useState, useRef } from "react";

const fmtR = (v) => `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

export default function ArrowBarChart({ data, valueKey = "Vendas", height = 200, color }) {
  const barColor  = color || "var(--c-accent)";
  const values    = data.map(d => d[valueKey] || 0);
  const maxVal    = Math.max(...values, 1);
  const stacked   = data.some(d => d.segments?.length > 0);

  /* Y-axis: arredondamento limpo */
  const rawStep   = maxVal / 5;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep || 1)));
  const niceStep  = Math.ceil(rawStep / magnitude) * magnitude;
  const niceMax   = niceStep * 5;
  const steps     = 5;
  const gridLines = Array.from({ length: steps + 1 }, (_, i) => niceStep * (steps - i));
  const formatY   = (v) => v >= 1000 ? `R$${(v / 1000).toFixed(1).replace(".0", "")}k` : `R$${v}`;

  /* Tooltip */
  const [tooltip, setTooltip]   = useState(null);
  const barsAreaRef             = useRef(null);

  const showTooltip = (e, item) => {
    if (!barsAreaRef.current) return;
    const areaRect = barsAreaRef.current.getBoundingClientRect();
    const barRect  = e.currentTarget.getBoundingClientRect();
    const left = barRect.left - areaRect.left + barRect.width / 2;
    setTooltip({ left, item });
  };
  const hideTooltip = () => setTooltip(null);

  /* Legenda */
  const legendItems = stacked
    ? [...new Map(data.flatMap(d => (d.segments || []).map(s => [s.label, s.color]))).entries()]
        .map(([label, c]) => ({ label, color: c }))
    : [];

  return (
    <div style={{ fontFamily: "var(--font-sans)", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8 }}>

        {/* Eixo Y */}
        <div style={{
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          alignItems: "flex-end", height: height + 28, paddingBottom: 28,
          flexShrink: 0, minWidth: 36,
        }}>
          {gridLines.map((v, i) => (
            <span key={i} style={{ fontSize: 10, color: "var(--c-muted)", lineHeight: 1, whiteSpace: "nowrap" }}>
              {formatY(v)}
            </span>
          ))}
        </div>

        {/* Área do gráfico */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

          {/* Barras + linhas de grade + tooltip */}
          <div
            ref={barsAreaRef}
            style={{ height, position: "relative", display: "flex", alignItems: "flex-end", gap: 6 }}
          >
            {/* Linha de base (eixo X) */}
            <div style={{
              position: "absolute", left: 0, right: 0, bottom: 0,
              borderTop: "1.5px solid var(--c-border)",
              opacity: 0.4,
              pointerEvents: "none",
            }} />

            {/* Barras */}
            {data.map((item, i) => {
              const val  = item[valueKey] || 0;
              const barH = Math.max(niceMax > 0 ? (val / niceMax) * height : 0, val > 0 ? 4 : 2);

              const barProps = {
                key: i,
                onMouseEnter: (e) => showTooltip(e, item),
                onMouseLeave: hideTooltip,
                style: {
                  flex: 1, height: barH,
                  borderRadius: "4px 4px 0 0",
                  cursor: "default",
                  transition: "height .4s cubic-bezier(.4,0,.2,1), opacity .15s",
                },
              };

              if (stacked && item.segments?.length > 0) {
                return (
                  <div {...barProps} style={{ ...barProps.style, display: "flex", flexDirection: "column-reverse", overflow: "hidden" }}>
                    {item.segments.map((seg, j) => (
                      <div key={j} style={{ width: "100%", height: `${(seg.value / val) * 100}%`, background: seg.color, minHeight: seg.value > 0 ? 1 : 0 }} />
                    ))}
                  </div>
                );
              }

              return (
                <div {...barProps} style={{ ...barProps.style, background: val > 0 ? barColor : "var(--c-border)", opacity: val === 0 ? 0.25 : 1 }} />
              );
            })}

            {/* Tooltip flutuante */}
            {tooltip && (
              <div style={{
                position: "absolute",
                bottom: "calc(100% + 10px)",
                left: tooltip.left,
                transform: "translateX(-50%)",
                background: "var(--c-surface)",
                border: "1px solid var(--c-border)",
                borderRadius: "var(--radius-md)",
                padding: "10px 14px",
                boxShadow: "var(--shadow-modal)",
                zIndex: 20,
                minWidth: 150,
                pointerEvents: "none",
                whiteSpace: "nowrap",
              }}>
                {/* Seta para baixo */}
                <div style={{
                  position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)",
                  width: 10, height: 6,
                  background: "var(--c-surface)",
                  clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                  borderLeft: "1px solid var(--c-border)",
                  borderRight: "1px solid var(--c-border)",
                }} />

                {/* Label da data */}
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--c-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".04em" }}>
                  {tooltip.item.dia || tooltip.item.label}
                </div>

                {/* Total */}
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--c-text)", marginBottom: tooltip.item.segments?.length ? 8 : 0 }}>
                  {fmtR(tooltip.item[valueKey] || 0)}
                </div>

                {/* Segmentos */}
                {tooltip.item.segments?.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, borderTop: "1px solid var(--c-border)", paddingTop: 8 }}>
                    {tooltip.item.segments.map((seg, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 11, color: "var(--c-muted)" }}>{seg.label}</span>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text)" }}>{fmtR(seg.value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Eixo X */}
          <div style={{ height: 28, display: "flex", gap: 6, paddingTop: 6 }}>
            {data.map((item, i) => (
              <div key={i} style={{
                flex: 1, textAlign: "center", fontSize: 10,
                color: "var(--c-muted)", fontWeight: 500,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3,
              }}>
                {item.dia || item.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legenda */}
      {legendItems.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", paddingLeft: 44 }}>
          {legendItems.map(({ label, color: c }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: c, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: "var(--c-muted)" }}>{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
