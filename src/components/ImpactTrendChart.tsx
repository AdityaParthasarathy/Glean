"use client";

import { useState } from "react";

export interface TrendPoint {
  date: string;
  value: number;
}

const WIDTH = 600;
const HEIGHT = 180;
const PAD_LEFT = 34;
const PAD_RIGHT = 44;
const PAD_TOP = 12;
const PAD_BOTTOM = 22;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Single-series trend line — one hue (accent), no legend (the chart title
 * already names the series), sparing labels (axis ticks + one end value),
 * hover crosshair + tooltip. Hand-rolled SVG rather than a charting
 * dependency — one chart, not worth the bundle weight.
 */
export default function ImpactTrendChart({
  data,
  valueLabel,
}: {
  data: TrendPoint[];
  valueLabel: string;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (data.length < 2) {
    return (
      <p className="text-sm text-ink-faint">Not enough history yet for a trend line.</p>
    );
  }

  const innerW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const innerH = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const maxValue = Math.max(...data.map((d) => d.value), 1) * 1.15;

  const xAt = (i: number) => PAD_LEFT + (i / (data.length - 1)) * innerW;
  const yAt = (v: number) => PAD_TOP + innerH - (v / maxValue) * innerH;

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"}${xAt(i)},${yAt(d.value)}`).join(" ");
  const areaPath = `${linePath} L${xAt(data.length - 1)},${PAD_TOP + innerH} L${xAt(0)},${PAD_TOP + innerH} Z`;

  const gridSteps = [0, 0.5, 1];
  const last = data[data.length - 1];
  const hovered = hoverIdx !== null ? data[hoverIdx] : null;

  function handleMove(e: React.MouseEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const ratio = Math.min(1, Math.max(0, (relX - PAD_LEFT) / innerW));
    const idx = Math.round(ratio * (data.length - 1));
    setHoverIdx(idx);
  }

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label={`${valueLabel} over the last ${data.length} days, ending at ${last.value}`}
      >
        {gridSteps.map((step) => {
          const y = PAD_TOP + innerH - step * innerH;
          return (
            <g key={step}>
              <line
                x1={PAD_LEFT}
                x2={WIDTH - PAD_RIGHT}
                y1={y}
                y2={y}
                stroke="var(--color-hairline)"
                strokeWidth={1}
              />
              <text
                x={PAD_LEFT - 8}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={10}
                fill="var(--color-ink-faint)"
              >
                {Math.round(step * maxValue)}
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill="var(--color-accent)" opacity={0.1} />
        <path d={linePath} fill="none" stroke="var(--color-accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {hovered && (
          <line
            x1={xAt(hoverIdx!)}
            x2={xAt(hoverIdx!)}
            y1={PAD_TOP}
            y2={PAD_TOP + innerH}
            stroke="var(--color-ink-faint)"
            strokeWidth={1}
          />
        )}

        {[0, data.length - 1].map((i) => (
          <text
            key={i}
            x={xAt(i)}
            y={HEIGHT - 4}
            textAnchor={i === 0 ? "start" : "end"}
            fontSize={10}
            fill="var(--color-ink-faint)"
          >
            {formatDate(data[i].date)}
          </text>
        ))}

        {/* End marker + sparing direct label — the one value called out
            directly, per single-series convention. */}
        <circle cx={xAt(data.length - 1)} cy={yAt(last.value)} r={4} fill="var(--color-accent)" stroke="var(--color-bg)" strokeWidth={2} />
        <text
          x={xAt(data.length - 1) - 6}
          y={yAt(last.value) - 10}
          textAnchor="end"
          fontSize={12}
          fontWeight={600}
          fill="var(--color-ink)"
        >
          {last.value}
        </text>

        {hovered && (
          <circle
            cx={xAt(hoverIdx!)}
            cy={yAt(hovered.value)}
            r={4}
            fill="var(--color-accent)"
            stroke="var(--color-bg)"
            strokeWidth={2}
          />
        )}

        <rect
          x={PAD_LEFT}
          y={0}
          width={innerW}
          height={HEIGHT}
          fill="transparent"
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIdx(null)}
        />
      </svg>

      {hovered && hoverIdx !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-hairline-strong bg-surface px-2.5 py-1.5 text-xs shadow-sm"
          style={{
            left: `${(xAt(hoverIdx) / WIDTH) * 100}%`,
            top: `${(yAt(hovered.value) / HEIGHT) * 100 - 4}%`,
          }}
        >
          <p className="font-semibold text-ink">
            {hovered.value} {valueLabel}
          </p>
          <p className="text-ink-faint">{formatDate(hovered.date)}</p>
        </div>
      )}
    </div>
  );
}
