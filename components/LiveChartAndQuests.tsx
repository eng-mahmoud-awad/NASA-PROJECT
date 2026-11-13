"use client";

import React from "react";
import { Trophy, CheckSquare, Square, Flame, Award } from "lucide-react";
import { useHealthStore, MetricKey } from "@/store/useHealthStore";
import { METRIC_GUIDES } from "@/lib/medicalGuides";
import { getStatusTheme, cn } from "@/lib/utils";

interface LiveChartAndQuestsProps {
  selectedMetric: MetricKey;
  onSelectMetric: (key: MetricKey) => void;
}

export default function LiveChartAndQuests({
  selectedMetric,
  onSelectMetric,
}: LiveChartAndQuestsProps) {
  const {
    history,
    evaluations,
    xp,
    level,
    streakDays,
    quests,
    badges,
    completeQuest,
  } = useHealthStore();

  const guide = METRIC_GUIDES[selectedMetric];
  const theme = getStatusTheme(evaluations[selectedMetric].status);
  const { minDomain, maxDomain, safeMin, safeMax } = guide.chartConfig;

  // Map history points to SVG coordinates (width: 500, height: 150)
  const W = 500;
  const H = 150;
  const points = history.map((snap, idx) => {
    const val =
      selectedMetric === "bp" ? snap.bpSys : (snap[selectedMetric] as number);
    const x =
      history.length > 1 ? (idx / (history.length - 1)) * (W - 20) + 10 : W / 2;
    const clamped = Math.max(minDomain, Math.min(maxDomain, val));
    const y =
      H - ((clamped - minDomain) / (maxDomain - minDomain)) * (H - 24) - 12;
    return { x, y, val, time: snap.timestamp };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPoints =
    points.length > 1
      ? `${points[0].x},${H} ${polylinePoints} ${points[points.length - 1].x},${H}`
      : "";

  const safeTopY =
    H - ((safeMax - minDomain) / (maxDomain - minDomain)) * (H - 24) - 12;
  const safeBottomY =
    H - ((safeMin - minDomain) / (maxDomain - minDomain)) * (H - 24) - 12;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* Left 7 Cols: Interactive Dynamic Waveform Chart */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-4 lg:col-span-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-mono text-[10px] uppercase text-cyan-400">
              REAL-TIME TELEMETRY WAVEFORM
            </span>
            <h3 className="text-sm font-bold text-white">
              {guide.title} ({guide.unit})
            </h3>
          </div>

          {/* Quick Metric Switcher Tabs */}
          <div className="flex gap-1 rounded-lg bg-slate-950 p-1">
            {(["hr", "spo2", "temp", "bp", "glo", "co2"] as MetricKey[]).map(
              (k) => (
                <button
                  key={k}
                  onClick={() => onSelectMetric(k)}
                  className={cn(
                    "rounded px-2 py-1 font-mono text-[10px] font-bold uppercase transition",
                    selectedMetric === k
                      ? "bg-cyan-500 text-slate-950"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  {k}
                </button>
              )
            )}
          </div>
        </div>

        {/* SVG Chart with Nominal Safe Band */}
        <div className="relative my-3 w-full overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/90 p-2">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-40 w-full overflow-visible">
            {/* Green Nominal Safe Zone Band */}
            <rect
              x="0"
              y={safeTopY}
              width={W}
              height={Math.max(4, safeBottomY - safeTopY)}
              fill="#10b981"
              fillOpacity="0.08"
            />
            <line
              x1="0"
              y1={safeTopY}
              x2={W}
              y2={safeTopY}
              stroke="#10b981"
              strokeDasharray="4 4"
              strokeOpacity="0.4"
            />
            <line
              x1="0"
              y1={safeBottomY}
              x2={W}
              y2={safeBottomY}
              stroke="#10b981"
              strokeDasharray="4 4"
              strokeOpacity="0.4"
            />

            {/* Shaded Area under curve */}
            {points.length > 1 && (
              <polygon
                points={areaPoints}
                fill={theme.hex}
                fillOpacity="0.16"
              />
            )}

            {/* Main Telemetry Line */}
            {points.length > 1 && (
              <polyline
                fill="none"
                stroke={theme.hex}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylinePoints}
              />
            )}

            {/* Data Nodes */}
            {points.map((pt, i) => (
              <circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r={i === points.length - 1 ? 4.5 : 2.5}
                fill={theme.hex}
              />
            ))}
          </svg>
        </div>

        <div className="flex justify-between font-mono text-[11px] text-slate-400">
          <span>Safe Zone: {guide.normalRangeText}</span>
          <span>Samples Logged: {history.length}</span>
        </div>
      </div>

      {/* Right 5 Cols: Interactive Gamification Quests & Badges */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-4 lg:col-span-5">
        {/* Top XP & Level Bar */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                <Trophy size={16} />
              </div>
              <div>
                <div className="text-xs font-bold text-white">
                  CREW LEVEL {level}
                </div>
                <div className="font-mono text-[10px] text-amber-400">
                  {xp} XP TOTAL
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 font-mono text-xs font-bold text-amber-300">
              <Flame size={13} />
              <span>{streakDays}d Streak</span>
            </div>
          </div>

          {/* Interactive Quests Checklist */}
          <div className="mt-3 space-y-2">
            {quests.map((q) => (
              <button
                key={q.id}
                onClick={() => completeQuest(q.id)}
                disabled={q.completed}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition",
                  q.completed
                    ? "border-emerald-500/30 bg-emerald-500/10 text-slate-400"
                    : "border-slate-800 bg-slate-950/70 text-slate-200 hover:border-cyan-500/50"
                )}
              >
                <div className="flex items-center gap-2.5 pr-2">
                  {q.completed ? (
                    <CheckSquare size={16} className="shrink-0 text-emerald-400" />
                  ) : (
                    <Square size={16} className="shrink-0 text-cyan-400" />
                  )}
                  <span
                    className={cn(
                      "text-xs font-medium",
                      q.completed && "line-through"
                    )}
                  >
                    {q.title}
                  </span>
                </div>
                <span className="shrink-0 rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                  +{q.xpReward} XP
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Unlockable Crew Badges Strip */}
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-800 pt-3">
          {badges.map((b) => (
            <div
              key={b.id}
              title={b.description}
              className={cn(
                "flex flex-1 items-center gap-1.5 rounded-lg border px-2 py-1.5 font-mono text-[10px]",
                b.unlocked
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                  : "border-slate-800 bg-slate-950/50 text-slate-600"
              )}
            >
              <Award size={13} className="shrink-0" />
              <span className="truncate font-bold">{b.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}