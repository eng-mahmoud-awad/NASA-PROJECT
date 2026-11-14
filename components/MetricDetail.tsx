"use client";

import { useHealthStore, type MetricKey } from "@/store/useHealthStore";
import { METRICS } from "@/lib/metrics";
import { STATUS, cn } from "@/lib/utils";
import { Panel } from "@/components/ui";

export default function MetricDetail({ metric }: { metric: MetricKey }) {
  const evaluation = useHealthStore((s) => s.evaluations[metric]);
  const m = METRICS[metric];

  return (
    <Panel title={m.name} aside={m.manual ? "logged by crew" : "from sensor"}>
      <p className={cn("text-sm font-medium", STATUS[evaluation.status].text)}>{evaluation.label}</p>
      <p className="mt-1 text-sm text-zinc-300">{evaluation.advice}</p>

      <p className="mt-4 text-sm leading-relaxed text-zinc-400">{m.whyItMatters}</p>

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-zinc-300 hover:text-zinc-100">How to measure</summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-zinc-400">
          {m.howTo.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </details>
    </Panel>
  );
}
