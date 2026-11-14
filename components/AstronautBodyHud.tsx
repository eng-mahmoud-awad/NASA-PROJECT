"use client";

import React, { useState } from "react";
import { ExternalLink } from "lucide-react";
import { useHealthStore, MetricKey } from "@/store/useHealthStore";
import { getStatusTheme, cn } from "@/lib/utils";
import { METRIC_GUIDES } from "@/lib/medicalGuides";
import { NASA_METRIC_RESEARCH, NASA_RIDGE_HAZARDS } from "@/lib/nasaHrpData";
import { Panel, button } from "@/components/ui";
import VexSectionBanner from "@/components/VexSectionBanner";

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

const BODY = "fill-slate-800 stroke-slate-600";

export default function AstronautBodyHud({
  selectedMetric,
  onSelectMetric,
}: AstronautBodyHudProps) {
  const { evaluations } = useHealthStore();
  const [showSteps, setShowSteps] = useState(false);

  const activeEval = evaluations[selectedMetric];
  const activeGuide = METRIC_GUIDES[selectedMetric];
  const activeNasa = NASA_METRIC_RESEARCH[selectedMetric];
  const hazard = NASA_RIDGE_HAZARDS[activeNasa.primaryHazard];
  const theme = getStatusTheme(activeEval.status);

  return (
    <div id="sensor-map" className="flex h-full scroll-mt-28 flex-col gap-2.5">
      <VexSectionBanner
        sectionId="sensor-map"
        sectionBadge="SEC 05 · SUIT SENSOR MAP"
        status={activeEval.status}
        compact
        instruction={`Click any node on the suit or "How to measure" for ${activeGuide.shortTitle} (${activeGuide.hardwareName}).`}
        warning={
          activeEval.status !== "GREEN"
            ? activeEval.actions[0]
            : activeGuide.howToMeasureSteps[1] || activeGuide.spaceflightRisk
        }
      />

      <Panel
        title="Sensor map"
        aside={
          <button
            type="button"
            onClick={() => setShowSteps((s) => !s)}
            className={cn(button, "px-2 py-1 text-xs")}
          >
            {showSteps ? "Close guide" : "How to measure"}
          </button>
        }
        className="flex-1"
        flush
      >
        <div className="relative flex flex-col items-center border-b border-slate-800 bg-slate-950 py-3">
          <svg
            viewBox="0 0 200 280"
            className="h-60 w-44 select-none"
            role="img"
            aria-label="Suit sensor map. Select a sensor to inspect it."
          >
            <circle
              cx="100"
              cy="45"
              r="26"
              className={BODY}
              strokeWidth="2"
            />
            <rect
              x="80"
              y="32"
              width="40"
              height="22"
              rx="10"
              className="fill-slate-950 stroke-slate-600"
              strokeWidth="1.5"
            />
            <rect
              x="68"
              y="75"
              width="64"
              height="105"
              rx="16"
              className={BODY}
              strokeWidth="2"
            />
            <rect
              x="40"
              y="80"
              width="22"
              height="85"
              rx="11"
              className={BODY}
              strokeWidth="2"
            />
            <rect
              x="138"
              y="80"
              width="22"
              height="85"
              rx="11"
              className={BODY}
              strokeWidth="2"
            />
            <rect
              x="70"
              y="184"
              width="26"
              height="82"
              rx="10"
              className={BODY}
              strokeWidth="2"
            />
            <rect
              x="104"
              y="184"
              width="26"
              height="82"
              rx="10"
              className={BODY}
              strokeWidth="2"
            />

            {HOTSPOTS.map((spot) => {
              const t = getStatusTheme(evaluations[spot.key].status);
              const selected = selectedMetric === spot.key;
              return (
                <g
                  key={spot.key}
                  role="button"
                  tabIndex={0}
                  aria-label={`${METRIC_GUIDES[spot.key].shortTitle}: ${
                    evaluations[spot.key].label
                  }`}
                  onClick={() => onSelectMetric(spot.key)}
                  onKeyDown={(e) =>
                    (e.key === "Enter" || e.key === " ") &&
                    onSelectMetric(spot.key)
                  }
                  className="cursor-pointer"
                >
                  <circle
                    cx={spot.cx}
                    cy={spot.cy}
                    r={selected ? 13 : 9}
                    fill={t.hex}
                    fillOpacity={selected ? 0.3 : 0.12}
                    stroke={selected ? "#38bdf8" : t.hex}
                    strokeWidth={selected ? 2 : 1}
                  />
                  <circle cx={spot.cx} cy={spot.cy} r={5} fill={t.hex} />
                  <text
                    x={spot.cx + (spot.cx < 100 ? -16 : 16)}
                    y={spot.cy + 3}
                    textAnchor={spot.cx < 100 ? "end" : "start"}
                    className="fill-slate-300 font-mono text-[9px]"
                  >
                    {spot.shortLabel}
                  </text>
                </g>
              );
            })}
          </svg>

          {showSteps && (
            <div className="absolute inset-0 z-20 flex flex-col justify-between overflow-auto bg-slate-950 p-4">
              <div>
                <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
                  <span className="text-sm font-medium text-slate-100">
                    Vex 0g Guide: {activeGuide.title}
                  </span>
                  <span className="text-xs text-slate-400">
                    {activeGuide.hardwareName}
                  </span>
                </div>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-xs leading-relaxed text-slate-300">
                  {activeGuide.howToMeasureSteps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
              <a
                href={activeNasa.referenceLinks[0].url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-xs text-sky-400 hover:underline"
              >
                {activeNasa.referenceLinks[0].title}
                <ExternalLink size={11} />
              </a>
            </div>
          )}
        </div>

        <div className="space-y-1.5 p-4 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "flex items-center gap-1.5 font-medium",
                theme.badgeText
              )}
            >
              <span className={cn("size-1.5 rounded-full", theme.dot)} />
              {activeGuide.shortTitle}: {activeEval.label}
            </span>
            <span className="text-xs text-slate-400">
              Target {activeGuide.normalRangeText}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            NASA HRP {hazard.code}: {hazard.name}.{" "}
            {activeNasa.officialHrpRiskName}
          </p>
          <p className="text-sm leading-snug text-slate-200">
            {activeEval.actions[0]}
          </p>
        </div>
      </Panel>
    </div>
  );
}
