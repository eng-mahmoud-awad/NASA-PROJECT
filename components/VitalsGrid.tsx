"use client";

import React from "react";
import {
  Heart,
  Wind,
  Thermometer,
  CloudFog,
  Activity,
  Droplet,
  Cpu,
  UserCheck,
} from "lucide-react";
import { useHealthStore, MetricKey } from "@/store/useHealthStore";
import { getStatusTheme, cn } from "@/lib/utils";
import { METRIC_GUIDES } from "@/lib/medicalGuides";

interface VitalsGridProps {
  selectedMetric: MetricKey;
  onSelectMetric: (key: MetricKey) => void;
}

const CARD_ICONS: Record<MetricKey, React.ElementType> = {
  hr: Heart,
  spo2: Wind,
  temp: Thermometer,
  co2: CloudFog,
  bp: Activity,
  glo: Droplet,
};

export default function VitalsGrid({
  selectedMetric,
  onSelectMetric,
}: VitalsGridProps) {
  const { vitals, evaluations, history } = useHealthStore();

  const keys: MetricKey[] = ["hr", "spo2", "temp", "bp", "glo", "co2"];

  const getDisplayValue = (key: MetricKey) => {
    if (key === "bp") return `${vitals.bpSys}/${vitals.bpDia}`;
    return String(vitals[key]);
  };

  const getNumericPercent = (key: MetricKey) => {
    const cfg = METRIC_GUIDES[key].chartConfig;
    const raw = key === "bp" ? vitals.bpSys : (vitals[key] as number);
    const pct = ((raw - cfg.minDomain) / (cfg.maxDomain - cfg.minDomain)) * 100;
    return Math.max(5, Math.min(95, pct));
  };

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {keys.map((key) => {
        const guide = METRIC_GUIDES[key];
        const evalData = evaluations[key];
        const theme = getStatusTheme(evalData.status);
        const Icon = CARD_ICONS[key];
        const isSelected = selectedMetric === key;
        const isEsp32 = guide.source === "ESP32_SENSOR";

        // Last 10 points for mini sparkline
        const recentPoints = history.slice(-10).map((h) =>
          key === "bp" ? h.bpSys : (h[key] as number)
        );

        return (
          <button
            key={key}
            onClick={() => onSelectMetric(key)}
            className={cn(
              "group relative flex flex-col justify-between rounded-2xl border bg-slate-900/75 p-3.5 text-left transition-all",
              theme.cardBorder,
              theme.glow,
              isSelected && "ring-2 ring-cyan-400 bg-slate-900"
            )}
          >
            {/* Top Row: Icon & Source Tag */}
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg border",
                    theme.badgeBg,
                    theme.badgeBorder,
                    theme.badgeText
                  )}
                >
                  <Icon size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">
                    {guide.shortTitle}
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                    {isEsp32 ? (
                      <>
                        <Cpu size={10} className="text-cyan-400" />
                        <span className="text-cyan-400">ESP32</span>
                      </>
                    ) : (
                      <>
                        <UserCheck size={10} className="text-purple-400" />
                        <span className="text-purple-300">INPUT</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Dot & Badge */}
              <span
                className={cn(
                  "rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-bold",
                  theme.badgeBg,
                  theme.badgeText,
                  theme.badgeBorder
                )}
              >
                {evalData.status}
              </span>
            </div>

            {/* Middle Row: Big Live Number + Mini Bar Sparkline */}
            <div className="my-3 flex items-baseline justify-between">
              <div>
                <span className="font-mono text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  {getDisplayValue(key)}
                </span>
                <span className="ml-1 font-mono text-xs text-slate-400">
                  {guide.unit}
                </span>
              </div>

              {/* Mini Sparkline Bars */}
              <div className="flex h-7 items-end gap-0.5">
                {recentPoints.map((val, i) => {
                  const cfg = guide.chartConfig;
                  const hPct = Math.max(
                    15,
                    Math.min(
                      100,
                      ((val - cfg.minDomain) / (cfg.maxDomain - cfg.minDomain)) *
                        100
                    )
                  );
                  return (
                    <span
                      key={i}
                      style={{ height: `${hPct}%`, backgroundColor: theme.hex }}
                      className="w-1 rounded-t opacity-75 transition-all"
                    />
                  );
                })}
              </div>
            </div>

            {/* Bottom Row: Visual Threshold Gauge Bar */}
            <div className="w-full">
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  style={{
                    width: `${getNumericPercent(key)}%`,
                    backgroundColor: theme.hex,
                  }}
                  className="h-full rounded-full transition-all duration-300"
                />
              </div>
              <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-400">
                <span className="truncate">{evalData.label}</span>
                <span>{guide.normalRangeText}</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}