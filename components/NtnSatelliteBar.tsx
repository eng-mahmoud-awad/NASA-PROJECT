"use client";

import React from "react";
import { useHealthStore } from "@/store/useHealthStore";
import { NTN_ORBIT_SPECS, NtnOrbitMode } from "@/lib/ntnLayer";
import { Panel, Segmented, button, primaryButton } from "@/components/ui";
import VexAvatar from "@/components/VexAvatar";
import { cn } from "@/lib/utils";

const MODES: { value: NtnOrbitMode; label: string }[] = (
  ["DIRECT_LOCAL", "LEO_RELAY", "LUNAR_GATEWAY", "MARS_DSN"] as NtnOrbitMode[]
).map((value) => ({ value, label: NTN_ORBIT_SPECS[value].shortLabel }));

export default function NtnSatelliteBar() {
  const {
    isEsp32Connected,
    esp32Ip,
    ntnOrbitMode,
    setNtnOrbitMode,
    isSatelliteBlackout,
    toggleSatelliteBlackout,
    lastNtnFrame,
    dtnBufferQueue,
    vitals,
  } = useHealthStore();

  const spec = NTN_ORBIT_SPECS[ntnOrbitMode];

  const rows: [string, string][] = [
    [
      "Source",
      isEsp32Connected ? `ESP32 at ${esp32Ip}` : "Simulated sensor stream",
    ],
    ["Band", `${spec.band}, ${spec.protocol}`],
    [
      "Round trip",
      isSatelliteBlackout
        ? "—"
        : `${lastNtnFrame?.latencyMs ?? spec.baseLatencyMs} ms`,
    ],
    [
      "SNR",
      isSatelliteBlackout
        ? "—"
        : `${lastNtnFrame?.snrDb ?? spec.baseSnrDb} dB`,
    ],
    ["Last frame", lastNtnFrame?.frameId ?? "—"],
    ["Queued packets", String(dtnBufferQueue.length)],
  ];

  return (
    <div className="flex h-full flex-col gap-2.5">
      {/* Vex Comms Officer Strip for NTN Satellite Relay */}
      <div
        className={cn(
          "rounded-md border bg-slate-950/90 px-3 py-2 text-xs transition-colors",
          isSatelliteBlackout ? "border-amber-500/60" : "border-slate-800"
        )}
      >
        <div className="flex items-start gap-2.5">
          <VexAvatar
            size="xs"
            status={isSatelliteBlackout ? "YELLOW" : "GREEN"}
            heartRateBpm={vitals.hr}
            className="mt-0.5"
          />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] font-semibold text-slate-200">
                VEX · SEC 06B · CCSDS-DTN SATELLITE RELAY
              </span>
              <span
                className={cn(
                  "font-mono text-[10px] font-medium",
                  isSatelliteBlackout ? "text-amber-400" : "text-emerald-400"
                )}
              >
                {isSatelliteBlackout ? "LOS BUFFERING" : "AOS LOCKED"}
              </span>
            </div>
            <p className="leading-snug text-slate-300">
              <span className="font-mono text-[11px] font-semibold text-sky-400">
                Instruction:{" "}
              </span>
              Select your orbital relay path ({spec.shortLabel}) or test{" "}
              <span className="text-slate-100">Simulate signal loss</span>.
            </p>
            <p
              className={cn(
                "leading-snug",
                isSatelliteBlackout ? "text-amber-300" : "text-slate-400"
              )}
            >
              <span className="font-mono text-[11px] font-semibold text-amber-400">
                Warning:{" "}
              </span>
              {isSatelliteBlackout
                ? `Blackout active! ${dtnBufferQueue.length} packet(s) buffered onboard—click 'Restore signal' when clear of shadow.`
                : `At ${spec.shortLabel} (${spec.baseLatencyMs} ms RTT), DTN Store-and-Forward prevents packet loss during occultation.`}
            </p>
          </div>
        </div>
      </div>

      <Panel
        title="Telemetry link"
        aside={
          isSatelliteBlackout ? (
            <span className="text-amber-400">No signal, buffering</span>
          ) : (
            "Connected"
          )
        }
        className="flex-1"
      >
        <Segmented
          options={MODES}
          value={ntnOrbitMode}
          onChange={setNtnOrbitMode}
          label="Relay path"
        />

        <dl className="mt-4 space-y-2 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4">
              <dt className="text-slate-400">{k}</dt>
              <dd className="font-tabular text-right font-mono text-slate-100">
                {v}
              </dd>
            </div>
          ))}
        </dl>

        {isSatelliteBlackout && (
          <p className="mt-3 text-xs text-amber-400">
            Readings are stored on board and will send when the link returns.
          </p>
        )}

        <button
          type="button"
          onClick={toggleSatelliteBlackout}
          className={`${
            isSatelliteBlackout ? primaryButton : button
          } mt-4 w-full`}
        >
          {isSatelliteBlackout
            ? `Restore signal (${dtnBufferQueue.length} queued)`
            : "Simulate signal loss"}
        </button>
      </Panel>
    </div>
  );
}
