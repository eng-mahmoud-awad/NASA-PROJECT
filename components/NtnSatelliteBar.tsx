"use client";

import React from "react";
import {
  Satellite,
  Cpu,
  Monitor,
  Radio,
  ShieldAlert,
  Database,
  RefreshCw,
} from "lucide-react";
import { useHealthStore } from "@/store/useHealthStore";
import { NTN_ORBIT_SPECS, NtnOrbitMode } from "@/lib/ntnLayer";
import { cn } from "@/lib/utils";

const ORBIT_MODES: NtnOrbitMode[] = [
  "DIRECT_LOCAL",
  "LEO_RELAY",
  "LUNAR_GATEWAY",
  "MARS_DSN",
];

export default function NtnSatelliteBar() {
  const {
    isEsp32Connected,
    ntnOrbitMode,
    setNtnOrbitMode,
    isSatelliteBlackout,
    toggleSatelliteBlackout,
    lastNtnFrame,
    dtnBufferQueue,
  } = useHealthStore();

  const activeSpec = NTN_ORBIT_SPECS[ntnOrbitMode];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-3.5 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Interactive 3-Node Topology (ESP32 -> NTN Relay -> Next.js) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Node 1: ESP32 Suit Sensor */}
          <div className="flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-slate-950 px-2.5 py-1.5">
            <Cpu size={15} className="text-cyan-400" />
            <div>
              <div className="font-mono text-[10px] font-bold text-slate-200">
                ESP32 NODE
              </div>
              <div className="font-mono text-[9px] text-cyan-400">
                {isEsp32Connected ? "192.168.4.1" : "SIM-STREAM"}
              </div>
            </div>
          </div>

          {/* Animated Uplink Line */}
          <div className="flex flex-col items-center">
            <span className="font-mono text-[9px] text-emerald-400">UPLINK</span>
            <div className="h-0.5 w-8 bg-gradient-to-r from-cyan-500 to-emerald-400 sm:w-12" />
          </div>

          {/* Node 2: NTN Satellite Relay */}
          <div
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-1.5 transition-all",
              isSatelliteBlackout
                ? "border-rose-500/60 bg-rose-500/15 text-rose-300"
                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
            )}
          >
            <Satellite
              size={16}
              className={cn(!isSatelliteBlackout && "animate-pulse")}
            />
            <div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold">
                <span>NTN: {activeSpec.shortLabel}</span>
                <span className="rounded bg-slate-950/60 px-1 py-0.2 text-[9px]">
                  {activeSpec.band}
                </span>
              </div>
              <div className="font-mono text-[9px] opacity-85">
                {isSatelliteBlackout
                  ? `LOS BLACKOUT — DTN BUFFER (${dtnBufferQueue.length} PKTS)`
                  : `${activeSpec.protocol} • ${
                      lastNtnFrame?.latencyMs ?? activeSpec.baseLatencyMs
                    }ms • SNR ${lastNtnFrame?.snrDb ?? activeSpec.baseSnrDb}dB`}
              </div>
            </div>
          </div>

          {/* Animated Downlink Line */}
          <div className="flex flex-col items-center">
            <span
              className={cn(
                "font-mono text-[9px]",
                isSatelliteBlackout ? "text-rose-400" : "text-cyan-400"
              )}
            >
              {isSatelliteBlackout ? "BUFFERED" : "DOWNLINK"}
            </span>
            <div
              className={cn(
                "h-0.5 w-8 sm:w-12",
                isSatelliteBlackout
                  ? "border-b border-dashed border-rose-500"
                  : "bg-gradient-to-r from-emerald-400 to-cyan-500"
              )}
            />
          </div>

          {/* Node 3: Next.js Mission Deck */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-1.5">
            <Monitor size={15} className="text-emerald-400" />
            <div>
              <div className="font-mono text-[10px] font-bold text-slate-200">
                ASTROVITALS UI
              </div>
              <div className="font-mono text-[9px] text-slate-400">
                {lastNtnFrame?.frameId ?? "CCSDS-SYNC"}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Orbit Mode Selector + DTN Blackout Test Button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-slate-800 bg-slate-950 p-1">
            {ORBIT_MODES.map((mode) => {
              const spec = NTN_ORBIT_SPECS[mode];
              const active = ntnOrbitMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => setNtnOrbitMode(mode)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 font-mono text-[10px] font-bold transition",
                    active
                      ? "bg-emerald-500 text-slate-950"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  {spec.shortLabel}
                </button>
              );
            })}
          </div>

          {/* Simulate Satellite Blackout (DTN Store-and-Forward Demo) */}
          <button
            onClick={toggleSatelliteBlackout}
            className={cn(
              "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-[11px] font-bold transition",
              isSatelliteBlackout
                ? "border-emerald-500 bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                : "border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
            )}
          >
            {isSatelliteBlackout ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                <span>Restore AOS ({dtnBufferQueue.length} Queued)</span>
              </>
            ) : (
              <>
                <ShieldAlert size={12} />
                <span>Test LOS Blackout</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}