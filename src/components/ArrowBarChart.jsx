const BAR_COLORS = [
  "#f97316", "#3b82f6", "#22c55e",
  "#eab308", "#ef4444", "#8b5cf6", "#06b6d4",
];

export default function ArrowBarChart({ data, valueKey = "Vendas", height = 200 }) {
  const values = data.map(d => d[valueKey]);
  const maxVal = Math.max(...values, 1);

  /* 5 linhas de grade com valores no eixo Y */
  const steps = 5;
  const gridLines = Array.from({ length: steps + 1 }, (_, i) =>
    Number(((maxVal * i) / steps).toFixed(0))
  ).reverse();

  return (
    <div style={{ display: "flex", gap: 12, fontFamily: "var(--font-sans)" }}>

      {/* Eixo Y */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "flex-end",
        height: height + 24,
        paddingBottom: 24,
        flexShrink: 0,
      }}>
        {gridLines.map((v, i) => (
          <span key={i} style={{ fontSize: 10, color: "var(--c-muted)", lineHeight: 1 }}>
            {v > 0 ? Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 0 }) : "0"}
          </span>
        ))}
      </div>

      {/* Área do gráfico */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Barras + linhas de grade */}
        <div style={{ height, position: "relative", display: "flex", alignItems: "flex-end", gap: 8 }}>

          {/* Linhas de grade horizontais */}
          {gridLines.map((_, i) => (
            <div key={i} style={{
              position: "absolute",
              left: 0, right: 0,
              top: `${(i / steps) * 100}%`,
              borderTop: `1px solid var(--c-border)`,
              opacity: 0.5,
            }} />
          ))}

          {/* Barras */}
          {data.map((item, i) => {
            const pct = maxVal > 0 ? item[valueKey] / maxVal : 0;
            const barH = Math.max(pct * height, item[valueKey] > 0 ? 8 : 2);
            const color = BAR_COLORS[i % BAR_COLORS.length];

            return (
              <div
                key={i}
                title={item[valueKey] > 0
                  ? `R$ ${Number(item[valueKey]).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                  : "Sem vendas"}
                style={{
                  flex: 1,
                  height: barH,
                  background: color,
                  borderRadius: "4px 4px 0 0",
                  position: "relative",
                  transition: "height .4s ease",
                  opacity: item[valueKey] === 0 ? 0.2 : 1,
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "center",
                  paddingTop: 4,
                }}
              >
                {item[valueKey] > 0 && barH > 22 && (
                  <span style={{
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    textShadow: "0 1px 2px rgba(0,0,0,0.4)",
                    lineHeight: 1,
                    pointerEvents: "none",
                  }}>
                    {Number(item[valueKey]).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Eixo X */}
        <div style={{
          height: 24,
          display: "flex",
          gap: 8,
          borderTop: `1px solid var(--c-border)`,
          paddingTop: 6,
        }}>
          {data.map((item, i) => (
            <div key={i} style={{
              flex: 1,
              textAlign: "center",
              fontSize: 10,
              color: "var(--c-muted)",
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {item.dia || item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
