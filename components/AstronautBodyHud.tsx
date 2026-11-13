"use client";

import React, { useState } from "react";
import { HelpCircle, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import { useHealthStore, MetricKey } from "@/store/useHealthStore";
import { getStatusTheme, cn } from "@/lib/utils";
import { METRIC_GUIDES } from "@/lib/medicalGuides";
import { NASA_METRIC_RESEARCH, NASA_RIDGE_HAZARDS } from "@/lib/nasaHrpData";

interface AstronautBodyHudProps {
  selectedMetric: MetricKey;
  onSelectMetric: (key: MetricKey) => void;
}

const HOTSPOTS: {
  key: MetricKey;
  cx: number;
  cy: number;
  shortLabel: string;
}[] = [
  { key: "co2", cx: 100, cy: 42, shortLabel: "CO2" },
  { key: "spo2", cx: 82, cy: 92, shortLabel: "O2" },
  { key: "hr", cx: 112, cy: 105, shortLabel: "HR" },
  { key: "bp", cx: 52, cy: 125, shortLabel: "BP" },
  { key: "temp", cx: 100, cy: 145, shortLabel: "TEMP" },
  { key: "glo", cx: 118, cy: 168, shortLabel: "GLO" },
];

export default function AstronautBodyHud({
  selectedMetric,
  onSelectMetric,
}: AstronautBodyHudProps) {
  const { evaluations } = useHealthStore();
  const [showSteps, setShowSteps] = useState(false);

  const activeEval = evaluations[selectedMetric];
  const activeGuide = METRIC_GUIDES[selectedMetric];
  const activeNasa = NASA_METRIC_RESEARCH[selectedMetric];
  const hazardBadge = NASA_RIDGE_HAZARDS[activeNasa.primaryHazard];
  const theme = getStatusTheme(activeEval.status);

  return (
    <div className="relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur">
      {/* Top Row: Selected Organ Status & NASA Hazard Pill */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-semibold",
            hazardBadge.badgeColor
          )}
        >
          HRP HAZARD [{hazardBadge.code}]: {hazardBadge.name}
        </span>

        <button
          onClick={() => setShowSteps((s) => !s)}
          className={cn(
            "flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition",
            showSteps
              ? "border-cyan-400 bg-cyan-500/20 text-cyan-300"
              : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600"
          )}
        >
          <HelpCircle size={13} />
          {showSteps ? "Hide Guide" : "How to Measure"}
        </button>
      </div>

      {/* Center: Interactive SVG Astronaut Silhouette */}
      <div className="relative my-2 flex items-center justify-center">
        {/* Radar Background Rings */}
        <div className="pointer-events-none absolute h-56 w-56 rounded-full border border-cyan-500/10" />
        <div className="pointer-events-none absolute h-40 w-40 rounded-full border border-cyan-500/15 border-dashed animate-spin [animation-duration:25s]" />

        <svg viewBox="0 0 200 280" className="h-72 w-52 select-none">
          {/* Helmet & Visor */}
          <circle
            cx="100"
            cy="45"
            r="26"
            className="fill-slate-900 stroke-cyan-500/50"
            strokeWidth="2"
          />
          <rect
            x="80"
            y="32"
            width="40"
            height="22"
            rx="10"
            className="fill-cyan-950/80 stroke-cyan-400/60"
            strokeWidth="1.5"
          />

          {/* Torso & Life Support Chest Pack */}
          <rect
            x="68"
            y="75"
            width="64"
            height="105"
            rx="16"
            className="fill-slate-900 stroke-slate-700"
            strokeWidth="2"
          />
          <rect
            x="78"
            y="88"
            width="44"
            height="68"
            rx="8"
            className="fill-slate-950/90 stroke-cyan-500/30"
            strokeWidth="1"
          />

          {/* Left & Right Arms */}
          <rect
            x="40"
            y="80"
            width="22"
            height="85"
            rx="11"
            className="fill-slate-900 stroke-slate-700"
            strokeWidth="2"
          />
          <rect
            x="138"
            y="80"
            width="22"
            height="85"
            rx="11"
            className="fill-slate-900 stroke-slate-700"
            strokeWidth="2"
          />

          {/* Legs */}
          <rect
            x="70"
            y="184"
            width="26"
            height="82"
            rx="10"
            className="fill-slate-900 stroke-slate-700"
            strokeWidth="2"
          />
          <rect
            x="104"
            y="184"
            width="26"
            height="82"
            rx="10"
            className="fill-slate-900 stroke-slate-700"
            strokeWidth="2"
          />

          {/* Interactive Organ / Sensor Hotspots */}
          {HOTSPOTS.map((spot) => {
            const spotStatus = evaluations[spot.key].status;
            const spotTheme = getStatusTheme(spotStatus);
            const isSelected = selectedMetric === spot.key;

            return (
              <g
                key={spot.key}
                onClick={() => onSelectMetric(spot.key)}
                className="cursor-pointer transition-transform hover:scale-110"
              >
                {/* Outer Pulse Ring */}
                <circle
                  cx={spot.cx}
                  cy={spot.cy}
                  r={isSelected ? 15 : 10}
                  fill={spotTheme.hex}
                  fillOpacity={isSelected ? 0.35 : 0.15}
                  stroke={spotTheme.hex}
                  strokeWidth={isSelected ? 2 : 1}
                />
                {/* Core Node */}
                <circle
                  cx={spot.cx}
                  cy={spot.cy}
                  r={5.5}
                  fill={spotTheme.hex}
                />
                {/* Tiny Callout Tag */}
                <text
                  x={spot.cx + (spot.cx < 100 ? -16 : 16)}
                  y={spot.cy + 3}
                  textAnchor={spot.cx < 100 ? "end" : "start"}
                  className="fill-slate-200 font-mono text-[9px] font-bold"
                >
                  {spot.shortLabel}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Interactive Overlay Drawer when "How to Measure" is toggled */}
        {showSteps && (
          <div className="absolute inset-0 z-20 flex flex-col justify-between rounded-xl border border-cyan-500/40 bg-slate-950/95 p-4 backdrop-blur-md">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-mono text-xs font-bold text-cyan-400">
                  HOW TO MEASURE: {activeGuide.title.toUpperCase()}
                </span>
                <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-300">
                  {activeGuide.hardwareName}
                </span>
              </div>
              <ol className="mt-3 space-y-2 text-xs text-slate-200">
                {activeGuide.howToMeasureSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 font-mono text-[10px] font-bold text-cyan-300">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 pt-2 text-[11px]">
              <a
                href={activeNasa.referenceLinks[0].url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-cyan-400 hover:underline"
              >
                <span>{activeNasa.referenceLinks[0].title}</span>
                <ExternalLink size={11} />
              </a>
              <button
                onClick={() => setShowSteps(false)}
                className="rounded bg-cyan-500 px-3 py-1 font-bold text-slate-950"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Compact Action Strip (1-line status + 1-click countermeasure) */}
      <div
        className={cn(
          "rounded-xl border p-3 transition-all",
          theme.badgeBg,
          theme.badgeBorder
        )}
      >
        <div className="flex items-center justify-between">
          <span className={cn("font-mono text-xs font-bold", theme.badgeText)}>
            {activeGuide.shortTitle}: {activeEval.label}
          </span>
          <span className="font-mono text-[10px] text-slate-400">
            Target: {activeGuide.normalRangeText}
          </span>
        </div>
        <div className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-200">
          {activeEval.status === "GREEN" ? (
            <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-400" />
          )}
          <span className="line-clamp-2">{activeEval.actions[0]}</span>
        </div>
      </div>
    </div>
  );
}