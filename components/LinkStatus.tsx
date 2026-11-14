"use client";

import { useHealthStore } from "@/store/useHealthStore";
import { ORBIT_SPECS, type NtnOrbitMode } from "@/lib/ntnLayer";
import { Panel, button } from "@/components/ui";

const MODES = (Object.keys(ORBIT_SPECS) as NtnOrbitMode[]).map((value) => ({
  value,
  label: ORBIT_SPECS[value].label,
}));

export default function LinkStatus() {
  const { isEsp32Connected, orbitMode, setOrbitMode, blackout, toggleBlackout, lastFrame, queue } =
    useHealthStore();
  const spec = ORBIT_SPECS[orbitMode];

  const rows: [string, React.ReactNode][] = [
    ["Source", isEsp32Connected ? "ESP32 at 192.168.4.1" : "Simulated"],
    ["Band", `${spec.band}, ${spec.protocol}`],
    ["Latency", blackout ? "—" : `${lastFrame?.latencyMs ?? spec.latencyMs} ms`],
    ["SNR", blackout ? "—" : `${lastFrame?.snrDb ?? spec.snrDb} dB`],
    ["Last frame", lastFrame?.frameId ?? "—"],
  ];

  return (
    <Panel title="Telemetry link" aside={blackout ? <span className="text-amber-400">no signal</span> : "connected"}>
      <select
        value={orbitMode}
        onChange={(e) => setOrbitMode(e.target.value as NtnOrbitMode)}
        className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-sm text-zinc-200"
      >
        {MODES.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>

      <dl className="mt-4 space-y-1.5 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <dt className="text-zinc-500">{k}</dt>
            <dd className="font-mono text-zinc-200">{v}</dd>
          </div>
        ))}
      </dl>

      {blackout && (
        <p className="mt-3 text-xs text-amber-400">
          Readings are being stored and will be sent when the link comes back ({queue.length} queued).
        </p>
      )}

      <button onClick={toggleBlackout} className={`${button} mt-4 w-full`}>
        {blackout ? "Restore signal" : "Simulate signal loss"}
      </button>
    </Panel>
  );
}
