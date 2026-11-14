"use client";

import { useEffect, useState } from "react";
import { useHealthStore, type MissionEnvironment, type Scenario } from "@/store/useHealthStore";
import { downloadJson } from "@/lib/esp32Client";
import { STATUS, cn, formatMET } from "@/lib/utils";
import { Segmented } from "@/components/ui";

const ENVIRONMENTS: { value: MissionEnvironment; label: string }[] = [
  { value: "spacecraft", label: "Transit" },
  { value: "station", label: "Station" },
  { value: "rover", label: "Rover" },
  { value: "base", label: "Base" },
];

const SCENARIOS: { value: Scenario; label: string }[] = [
  { value: "nominal", label: "Nominal" },
  { value: "co2_pocket", label: "CO₂ pocket (0g)" },
  { value: "eva_hypoxia", label: "Post-EVA hypoxia" },
  { value: "fluid_shift_bp", label: "Fluid shift / high BP" },
];

export default function Header() {
  const { environment, setEnvironment, overallStatus, readiness, vitals, history, loadScenario, reset } =
    useHealthStore();
  const [met, setMet] = useState(389520);
  const status = STATUS[overallStatus];

  useEffect(() => {
    const id = setInterval(() => setMet((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const exportData = () =>
    downloadJson(`astrovitals-${Date.now()}.json`, {
      exportedAt: new Date().toISOString(),
      environment,
      readiness,
      latest: vitals,
      history,
    });

  return (
    <header className="border-b border-zinc-800">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <div className="flex items-baseline gap-3">
          <span className="font-semibold text-zinc-50">AstroVitals</span>
          <span className="font-mono text-xs text-zinc-500 tabular-nums">MET {formatMET(met)}</span>
        </div>

        <Segmented options={ENVIRONMENTS} value={environment} onChange={setEnvironment} />

        <div className="ml-auto flex flex-wrap items-center gap-4 text-sm">
          <span className="flex items-center gap-2 text-zinc-300">
            <span className={cn("size-2 rounded-full", status.dot)} />
            {status.label}
            <span className="text-zinc-500">·</span>
            <span className="tabular-nums">{readiness}% ready</span>
          </span>

          <select
            value=""
            onChange={(e) => loadScenario(e.target.value as Scenario)}
            className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-300"
          >
            <option value="" disabled>
              Load scenario
            </option>
            {SCENARIOS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <button onClick={exportData} className="text-zinc-400 hover:text-zinc-100">
            Export
          </button>
          <button onClick={reset} className="text-zinc-400 hover:text-zinc-100">
            Reset
          </button>
        </div>
      </div>
    </header>
  );
}
