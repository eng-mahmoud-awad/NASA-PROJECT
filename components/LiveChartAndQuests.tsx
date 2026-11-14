"use client";

import React from "react";
import { CheckSquare, Square } from "lucide-react";
import { useHealthStore, MetricKey } from "@/store/useHealthStore";
import { METRIC_GUIDES } from "@/lib/medicalGuides";
import { getStatusTheme, cn } from "@/lib/utils";
import { Panel, Segmented } from "@/components/ui";
import VexSectionBanner from "@/components/VexSectionBanner";

interface LiveChartAndQuestsProps {
  selectedMetric: MetricKey;
  onSelectMetric: (key: MetricKey) => void;
}

const KEYS: MetricKey[] = ["hr", "spo2", "temp", "bp", "glo", "co2"];
const W = 500;
const H = 150;

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
  const ev = evaluations[selectedMetric];
  const theme = getStatusTheme(ev.status);
  const { minDomain, maxDomain, safeMin, safeMax } = guide.chartConfig;

  const yOf = (v: number) =>
    H - ((v - minDomain) / (maxDomain - minDomain)) * (H - 24) - 12;

  const points = history.map((snap, idx) => {
    const val =
      selectedMetric === "bp" ? snap.bpSys : (snap[selectedMetric] as number);
    const x =
      history.length > 1
        ? (idx / (history.length - 1)) * (W - 20) + 10
        : W / 2;
    return { x, y: yOf(Math.max(minDomain, Math.min(maxDomain, val))), val };
  });

  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area =
    points.length > 1
      ? `${points[0].x},${H} ${line} ${points[points.length - 1].x},${H}`
      : "";
  const safeTopY = yOf(safeMax);
  const safeBottomY = yOf(safeMin);
  const latest = points.length ? points[points.length - 1].val : null;

  const done = quests.filter((q) => q.completed).length;
  const levelPct = Math.min(100, Math.round(((xp % 150) / 150) * 100));

  const outOfBand =
    latest !== null && (latest < safeMin || latest > safeMax);
  const pendingQuest = quests.find((q) => !q.completed);

  return (
    <div className="space-y-2.5">
      <VexSectionBanner
        sectionId="trend"
        sectionBadge="SECTION 04 · TREND WAVEFORM & CREW READINESS TASKS"
        status={ev.status}
        storyNote={`Tracking last ${history.length} samples of ${guide.title} against NASA's [${safeMin}–${safeMax} ${guide.unit}] safe band`}
        instruction={
          pendingQuest
            ? `Keep ${guide.shortTitle} inside the shaded green corridor on the left, then check off "${pendingQuest.title}" (+${pendingQuest.xpReward} XP) on the right.`
            : `All ${quests.length} daily crew tasks completed! Use the metric switcher on the chart to verify all 6 trend lines.`
        }
        warning={
          outOfBand
            ? `${guide.shortTitle} (${latest} ${guide.unit}) has exited the safe corridor [${safeMin}–${safeMax}]! ${ev.actions[0]}`
            : `If the waveform slopes steadily toward the dashed safe boundary (${safeMin} or ${safeMax} ${guide.unit}), act before an alarm sounds.`
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Panel
          title={`${guide.title}: last ${history.length} readings`}
          aside={<span>Normal {guide.normalRangeText}</span>}
          className="lg:col-span-8"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-tabular font-mono text-3xl font-semibold text-slate-50">
                  {latest ?? "—"}
                </span>
                <span className="text-sm text-slate-400">{guide.unit}</span>
              </div>
              <div
                className={cn(
                  "mt-0.5 flex items-center gap-1.5 text-sm font-medium",
                  theme.badgeText
                )}
              >
                <span className={cn("size-1.5 rounded-full", theme.dot)} />
                {ev.label}
              </div>
            </div>
            <Segmented
              label="Metric"
              value={selectedMetric}
              onChange={onSelectMetric}
              options={KEYS.map((k) => ({
                value: k,
                label: METRIC_GUIDES[k].shortTitle,
              }))}
            />
          </div>

          {points.length < 2 ? (
            <p className="mt-4 rounded-md border border-slate-800 bg-slate-950 p-6 text-center text-sm text-slate-400">
              Waiting for readings. The trend draws once a second sample arrives
              (one every 2 seconds).
            </p>
          ) : (
            <>
              <div className="mt-4 rounded-md border border-slate-800 bg-slate-950 p-3">
                <svg
                  viewBox={`0 0 ${W} ${H}`}
                  className="h-44 w-full overflow-visible"
                  role="img"
                  aria-label={`${guide.title} trend`}
                >
                  <rect
                    x="0"
                    y={safeTopY}
                    width={W}
                    height={Math.max(4, safeBottomY - safeTopY)}
                    fill="#10b981"
                    fillOpacity="0.07"
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
                  <text
                    x={W - 2}
                    y={safeTopY - 3}
                    textAnchor="end"
                    className="fill-slate-500 font-mono text-[10px]"
                  >
                    {safeMax}
                  </text>
                  <text
                    x={W - 2}
                    y={safeBottomY + 11}
                    textAnchor="end"
                    className="fill-slate-500 font-mono text-[10px]"
                  >
                    {safeMin}
                  </text>
                  <polygon points={area} fill={theme.hex} fillOpacity="0.1" />
                  <polyline
                    fill="none"
                    stroke={theme.hex}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={line}
                  />
                  <circle
                    cx={points[points.length - 1].x}
                    cy={points[points.length - 1].y}
                    r="4"
                    fill={theme.hex}
                  />
                </svg>
              </div>
              <div className="mt-2 flex justify-between font-mono text-[11px] text-slate-500">
                <span>{history[0]?.timestamp}</span>
                <span>Shaded band = normal range</span>
                <span>{history[history.length - 1]?.timestamp}</span>
              </div>
            </>
          )}
        </Panel>

        <Panel
          title="Crew tasks"
          aside={`${done} of ${quests.length} done`}
          className="lg:col-span-4"
        >
          <div className="mb-3 text-sm text-slate-300">
            <div className="flex items-center justify-between">
              <span>
                Level {level} · <span className="font-mono">{xp}</span> XP
              </span>
              <span className="text-slate-400">{streakDays}-day streak</span>
            </div>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-sky-400"
                style={{ width: `${levelPct}%` }}
              />
            </div>
          </div>

          <ul className="space-y-1.5">
            {quests.map((q) => (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => completeQuest(q.id)}
                  disabled={q.completed}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors",
                    q.completed
                      ? "border-slate-800 text-slate-500"
                      : "border-slate-700 text-slate-200 hover:border-slate-500 hover:bg-slate-800"
                  )}
                >
                  <span className="flex items-center gap-2">
                    {q.completed ? (
                      <CheckSquare size={15} className="shrink-0" />
                    ) : (
                      <Square size={15} className="shrink-0" />
                    )}
                    <span className={cn(q.completed && "line-through")}>
                      {q.title}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-xs text-slate-400">
                    +{q.xpReward} XP
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <ul className="mt-4 space-y-1 border-t border-slate-800 pt-3 text-xs">
            {badges.map((b) => (
              <li
                key={b.id}
                title={b.description}
                className="flex justify-between gap-2"
              >
                <span
                  className={b.unlocked ? "text-slate-200" : "text-slate-500"}
                >
                  {b.title}
                </span>
                <span
                  className={b.unlocked ? "text-slate-300" : "text-slate-600"}
                >
                  {b.unlocked ? "Unlocked" : "Locked"}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
