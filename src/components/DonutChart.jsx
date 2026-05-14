const SLICE_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#f97316", "#8b5cf6", "#ec4899", "#06b6d4"];

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function slicePath(cx, cy, outerR, innerR, startAngle, endAngle) {
  const o1 = polarToCartesian(cx, cy, outerR, startAngle);
  const o2 = polarToCartesian(cx, cy, outerR, endAngle);
  const i1 = polarToCartesian(cx, cy, innerR, startAngle);
  const i2 = polarToCartesian(cx, cy, innerR, endAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${o1.x.toFixed(2)} ${o1.y.toFixed(2)}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${o2.x.toFixed(2)} ${o2.y.toFixed(2)}`,
    `L ${i2.x.toFixed(2)} ${i2.y.toFixed(2)}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${i1.x.toFixed(2)} ${i1.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

const fmtCurrency = (v) =>
  `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

export default function DonutChart({ data, size = 160 }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: size, color: "var(--c-muted)", fontSize: 13 }}>
        Sem dados
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 8;
  const innerR = outerR * 0.58;
  const gap = 1.5; /* graus de espaço entre fatias */

  let cumulative = 0;
  const slices = data.map((item, i) => {
    const pct = item.value / total;
    const angleDeg = pct * 360;
    const startAngle = cumulative + gap / 2;
    const endAngle = cumulative + angleDeg - gap / 2;
    cumulative += angleDeg;
    return { ...item, startAngle, endAngle, pct, color: item.color || SLICE_COLORS[i % SLICE_COLORS.length] };
  });

  return (
    <div style={{ fontFamily: "var(--font-sans)" }}>
      {/* SVG */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {slices.map((s, i) => (
            <path
              key={i}
              d={slicePath(cx, cy, outerR, innerR, s.startAngle, s.endAngle)}
              fill={s.color}
              opacity={0.92}
            >
              <title>{s.label}: {fmtCurrency(s.value)} ({(s.pct * 100).toFixed(1)}%)</title>
            </path>
          ))}
          {/* Texto central — total */}
          <text
            x={cx} y={cy - 6}
            textAnchor="middle"
            style={{ fontSize: 9, fill: "var(--c-muted)", fontFamily: "var(--font-sans)" }}
          >
            TOTAL
          </text>
          <text
            x={cx} y={cy + 8}
            textAnchor="middle"
            style={{ fontSize: 11, fontWeight: 700, fill: "var(--c-text)", fontFamily: "var(--font-sans)" }}
          >
            {total >= 1000
              ? `R$ ${(total / 1000).toFixed(1).replace(".0", "")}k`
              : `R$ ${Number(total).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`}
          </text>
        </svg>
      </div>

      {/* Legenda */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "6px 12px",
        marginTop: 8,
      }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "var(--c-muted)", whiteSpace: "nowrap" }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
