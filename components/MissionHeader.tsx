"use client";

import React, { useEffect, useState } from "react";
import {
  Rocket,
  Orbit,
  Truck,
  ShieldAlert,
  Wifi,
  WifiOff,
  Download,
  Flame,
  RotateCcw,
} from "lucide-react";
import {
  useHealthStore,
  MissionEnvironment,
  DemoScenario,
} from "@/store/useHealthStore";
import { cn, formatMissionElapsedTime, getStatusTheme } from "@/lib/utils";
import { exportTelemetryDownlinkPacket } from "@/lib/esp32Client";

const ENV_OPTIONS: {
  id: MissionEnvironment;
  label: string;
  grav: string;
  icon: React.ElementType;
}[] = [
  { id: "spacecraft", label: "Transit", grav: "0g", icon: Rocket },
  { id: "station", label: "Station", grav: "0g", icon: Orbit },
  { id: "rover", label: "Rover", grav: "0.16g", icon: Truck },
  { id: "base", label: "Base", grav: "0.38g", icon: ShieldAlert },
];

export default function MissionHeader() {
  const {
    environment,
    setEnvironment,
    overallStatus,
    readinessScore,
    isEsp32Connected,
    vitals,
    history,
    triggerDemoScenario,
    resetMissionData,
  } = useHealthStore();

  const [metSeconds, setMetSeconds] = useState(389520);
  const statusTheme = getStatusTheme(overallStatus);

  useEffect(() => {
    const timer = setInterval(() => setMetSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-950/85 px-4 py-3 backdrop-blur-md">
      {/* Left: Brand & MET Clock */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl border",
            statusTheme.badgeBg,
            statusTheme.badgeBorder
          )}
        >
          <span className={cn("h-3 w-3 rounded-full", statusTheme.dot)} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-wider text-slate-100">
              ASTROVITALS
            </span>
            <span
              className={cn(
                "rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold",
                statusTheme.badgeBg,
                statusTheme.badgeText,
                statusTheme.badgeBorder
              )}
            >
              {statusTheme.label}
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
            <span>{formatMissionElapsedTime(metSeconds)}</span>
            <span>•</span>
            <span
              className={cn(
                "flex items-center gap-1",
                isEsp32Connected ? "text-emerald-400" : "text-cyan-400"
              )}
            >
              {isEsp32Connected ? <Wifi size={12} /> : <WifiOff size={12} />}
              {isEsp32Connected ? "ESP32 LIVE" : "SIMULATOR"}
            </span>
          </div>
        </div>
      </div>

      {/* Center: Interactive Environment Switcher */}
      <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/90 p-1">
        {ENV_OPTIONS.map((env) => {
          const Icon = env.icon;
          const active = environment === env.id;
          return (
            <button
              key={env.id}
              onClick={() => setEnvironment(env.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                active
                  ? "bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              <Icon size={14} />
              <span>{env.label}</span>
              <span
                className={cn(
                  "rounded px-1 font-mono text-[10px]",
                  active ? "bg-slate-950/20 text-slate-950" : "bg-slate-800 text-slate-400"
                )}
              >
                {env.grav}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right: 1-Click Judge Scenarios & Readiness Ring */}
      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/70 p-1 xl:flex">
          {(
            [
              { id: "nominal", label: "Nominal", color: "hover:text-emerald-400" },
              { id: "co2_pocket", label: "0g CO2", color: "hover:text-amber-400" },
              { id: "eva_hypoxia", label: "EVA Hypoxia", color: "hover:text-rose-400" },
              { id: "fluid_shift_bp", label: "0g BP Shift", color: "hover:text-rose-400" },
            ] as { id: DemoScenario; label: string; color: string }[]
          ).map((btn) => (
            <button
              key={btn.id}
              onClick={() => triggerDemoScenario(btn.id)}
              className={cn(
                "flex items-center gap-1 rounded-lg px-2.5 py-1 font-mono text-[11px] text-slate-300 transition hover:bg-slate-800",
                btn.color
              )}
              title="Trigger Instant Judge Demo Scenario"
            >
              <Flame size={11} />
              {btn.label}
            </button>
          ))}
        </div>

        {/* Readiness Gauge Pill */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5">
          <div className="text-right">
            <div className="font-mono text-[10px] text-slate-400">READINESS</div>
            <div className="font-mono text-sm font-bold text-emerald-400">
              {readinessScore}%
            </div>
          </div>
          <button
            onClick={() =>
              exportTelemetryDownlinkPacket({
                environment,
                readinessScore,
                vitals,
                history,
              })
            }
            className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-cyan-400 transition hover:border-cyan-500 hover:bg-cyan-500/10"
            title="Export Downlink JSON"
          >
            <Download size={15} />
          </button>
          <button
            onClick={resetMissionData}
            className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-400 transition hover:text-white"
            title="Reset Telemetry"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}