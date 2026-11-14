"use client";

import { useHealthStore, type MetricKey } from "@/store/useHealthStore";
import { METRICS, metricValue } from "@/lib/metrics";
import { STATUS } from "@/lib/utils";
import { Panel } from "@/components/ui";

const W = 600;
const H = 160;

export default function TrendChart({ metric, className }: { metric: MetricKey; className?: string }) {
  const { history, evaluations } = useHealthStore();
  const m = METRICS[metric];
  const { min, max, safeMin, safeMax } = m.chart;
  const color = STATUS[evaluations[metric].status].hex;

  const y = (v: number) => H - ((Math.min(max, Math.max(min, v)) - min) / (max - min)) * H;
  const x = (i: number) => (history.length > 1 ? (i / (history.length - 1)) * W : W / 2);
  const line = history.map((s, i) => `${x(i)},${y(metricValue(s, metric))}`).join(" ");

  return (
    <Panel
      title={`${m.name} trend`}
      aside={`last ${history.length} readings · normal ${m.range} ${m.unit}`}
      className={className}
    >
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-48 w-full">
          <rect x={0} y={y(safeMax)} width={W} height={y(safeMin) - y(safeMax)} fill="#ffffff" fillOpacity={0.04} />
          {history.length > 1 && (
            <polyline
              points={line}
              fill="none"
              stroke={color}
              strokeWidth={1.75}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex flex-col justify-between font-mono text-[10px] text-zinc-600">
          <span>{max}</span>
          <span>{min}</span>
        </div>
      </div>
      <div className="mt-2 flex justify-between font-mono text-[11px] text-zinc-500">
        <span>{history[0]?.timestamp}</span>
        <span>{history.at(-1)?.timestamp}</span>
      </div>
    </Panel>
  );
}
