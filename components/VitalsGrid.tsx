"use client";

import React from "react";
import { useHealthStore, MetricKey } from "@/store/useHealthStore";
import { getStatusTheme, cn } from "@/lib/utils";
import { METRIC_GUIDES } from "@/lib/medicalGuides";
import VexSectionBanner from "@/components/VexSectionBanner";

interface VitalsGridProps {
  selectedMetric: MetricKey;
  onSelectMetric: (key: MetricKey) => void;
}

const KEYS: MetricKey[] = ["hr", "spo2", "temp", "bp", "glo", "co2"];

export default function VitalsGrid({
  selectedMetric,
  onSelectMetric,
}: VitalsGridProps) {
  const { vitals, evaluations, history, overallStatus } = useHealthStore();

  const display = (key: MetricKey) =>
    key === "bp" ? `${vitals.bpSys}/${vitals.bpDia}` : String(vitals[key]);

  const percent = (key: MetricKey, raw: number) => {
    const { minDomain, maxDomain } = METRIC_GUIDES[key].chartConfig;
    return Math.max(
      0,
      Math.min(100, ((raw - minDomain) / (maxDomain - minDomain)) * 100)
    );
  };

  const activeGuide = METRIC_GUIDES[selectedMetric];
  const activeEval = evaluations[selectedMetric];
  const abnormalKeys = KEYS.filter((k) => evaluations[k].status !== "GREEN");
  const worstKey =
    abnormalKeys.find((k) => evaluations[k].status === "RED") ||
    abnormalKeys[0];

  const bannerInstruction = `Click any of the 6 cards (or press keys 1–6) to focus that channel. Currently locked on ${activeGuide.title} (${activeGuide.howToMeasureSteps[0]}).`;
  const bannerWarning = worstKey
    ? `${METRIC_GUIDES[worstKey].shortTitle} is ${evaluations[worstKey].label}: ${evaluations[worstKey].actions[0]}`
    : `Watch for Amber/Red card borders—${activeGuide.shortTitle} safe corridor is ${activeGuide.normalRangeText}.`;

  return (
    <div className="space-y-2.5">
      <VexSectionBanner
        sectionId="vitals"
        sectionBadge="SECTION 03 · 6-CHANNEL VITALS TELEMETRY GRID"
        status={overallStatus}
        storyNote={`Channels 1–3 stream live from ESP32 I2C sensors; Channels 4–6 track crew peripheral logs`}
        instruction={bannerInstruction}
        warning={bannerWarning}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {KEYS.map((key, i) => {
          const guide = METRIC_GUIDES[key];
          const ev = evaluations[key];
          const theme = getStatusTheme(ev.status);
          const selected = selectedMetric === key;
          const abnormal = ev.status !== "GREEN";
          const raw = key === "bp" ? vitals.bpSys : (vitals[key] as number);
          const recent = history
            .slice(-12)
            .map((h) => (key === "bp" ? h.bpSys : (h[key] as number)));

          return (
            <button
              key={key}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelectMetric(key)}
              style={
                abnormal && !selected ? { borderColor: theme.hex } : undefined
              }
              className={cn(
                "flex flex-col gap-2 rounded-md border bg-slate-900 p-3 text-left transition-colors hover:bg-slate-800/70",
                selected
                  ? "border-sky-400 bg-slate-800/60"
                  : abnormal
                  ? ""
                  : "border-slate-800"
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-200">
                  {guide.shortTitle}
                </span>
                <span className="text-xs text-slate-500">
                  {guide.source === "ESP32_SENSOR" ? "Sensor" : "Crew log"} ·{" "}
                  {i + 1}
                </span>
              </span>

              <span className="flex items-baseline gap-1.5">
                <span className="font-tabular font-mono text-2xl font-semibold text-slate-50">
                  {display(key)}
                </span>
                <span className="text-xs text-slate-400">{guide.unit}</span>
              </span>

              <span className="flex h-7 items-end gap-0.5" aria-hidden>
                {recent.map((val, idx) => (
                  <span
                    key={idx}
                    style={{
                      height: `${Math.max(12, percent(key, val))}%`,
                      backgroundColor: theme.hex,
                    }}
                    className="flex-1 rounded-t-sm opacity-70"
                  />
                ))}
              </span>

              <span
                className="h-1 w-full overflow-hidden rounded-full bg-slate-800"
                aria-hidden
              >
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${Math.max(4, percent(key, raw))}%`,
                    backgroundColor: theme.hex,
                  }}
                />
              </span>

              <span className="flex items-center justify-between gap-2 text-xs">
                <span
                  className={cn(
                    "flex min-w-0 items-center gap-1.5 font-medium",
                    theme.badgeText
                  )}
                >
                  <span
                    className={cn("size-1.5 shrink-0 rounded-full", theme.dot)}
                  />
                  <span className="truncate">{ev.label}</span>
                </span>
                <span className="shrink-0 text-slate-400">
                  {guide.normalRangeText}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
