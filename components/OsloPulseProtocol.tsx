"use client";

import React, { useEffect, useState } from "react";
import { CheckSquare, Square } from "lucide-react";
import { useHealthStore, HealthStatus } from "@/store/useHealthStore";
import { cn } from "@/lib/utils";
import { Panel, button, primaryButton, field } from "@/components/ui";
import VexSectionBanner from "@/components/VexSectionBanner";

const FLUX_BY_ENV = {
  spacecraft: 0.68,
  station: 0.42,
  rover: 0.54,
  base: 0.35,
} as const;

function Module({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-slate-800 bg-slate-950/60 p-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-slate-100">{title}</h3>
        {aside && <div className="text-right text-xs">{aside}</div>}
      </div>
      {children}
    </div>
  );
}

function SymptomSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block text-xs">
      <span className="flex justify-between text-slate-300">
        {label}
        <span
          className={cn(
            "font-mono",
            value >= 6
              ? "text-rose-400"
              : value >= 3
              ? "text-amber-400"
              : "text-slate-200"
          )}
        >
          {value} / 10
        </span>
      </span>
      <input
        type="range"
        min={0}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 h-1.5 w-full cursor-pointer accent-sky-400"
      />
    </label>
  );
}

function Bars({
  values,
  domain,
  tone,
  floor,
  label,
}: {
  values: number[];
  domain: [number, number];
  tone: (v: number) => string;
  floor?: number;
  label: string;
}) {
  const pct = (v: number) =>
    Math.max(
      10,
      Math.min(100, ((v - domain[0]) / (domain[1] - domain[0])) * 100)
    );
  return (
    <div>
      <div className="mb-1 text-xs text-slate-400">{label}</div>
      <div className="relative flex h-14 items-end gap-1 rounded border border-slate-800 bg-slate-950 p-1.5">
        {values.map((v, i) => (
          <div
            key={i}
            title={String(v)}
            style={{ height: `${pct(v)}%` }}
            className={cn("flex-1 rounded-t-sm", tone(v))}
          />
        ))}
        {floor !== undefined && (
          <div
            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-rose-500/70"
            style={{ bottom: `calc(${pct(floor)}% * 0.8 + 6px)` }}
          />
        )}
      </div>
    </div>
  );
}

export default function OsloPulseProtocol() {
  const {
    environment,
    vitals,
    history,
    isEsp32Connected,
    completeQuest,
  } = useHealthStore();

  const [symptoms, setSymptoms] = useState({
    headache: 1,
    jointPain: 2,
    nausea: 0,
    fatigue: 2,
  });
  const setSym = (k: keyof typeof symptoms) => (v: number) =>
    setSymptoms((s) => ({ ...s, [k]: v }));

  // 10-second reaction test (psychomotor vigilance)
  const [cogRunning, setCogRunning] = useState(false);
  const [cogTimeLeft, setCogTimeLeft] = useState(10);
  const [cogTarget, setCogTarget] = useState({ x: 50, y: 50 });
  const [cogHits, setCogHits] = useState(0);
  const [cogAvgMs, setCogAvgMs] = useState<number | null>(null);
  const [lastSpawn, setLastSpawn] = useState(0);

  const [bone, setBone] = useState([
    {
      id: "ared_2h",
      label: "2 hours of ARED resistive exercise",
      checked: false,
    },
    { id: "ca_vitd", label: "Daily calcium and vitamin D", checked: false },
  ]);

  const [flux, setFlux] = useState<number>(FLUX_BY_ENV[environment]);
  const [doseInput, setDoseInput] = useState("14.8");
  const [dose, setDose] = useState(14.8);

  useEffect(() => {
    const base = FLUX_BY_ENV[environment];
    setFlux(base);
    const id = setInterval(() => {
      const jitter = (Math.random() - 0.48) * 0.08;
      setFlux(Number(Math.max(0.15, Math.min(2.5, base + jitter)).toFixed(2)));
    }, 2500);
    return () => clearInterval(id);
  }, [environment]);

  useEffect(() => {
    if (!cogRunning) return;
    if (cogTimeLeft <= 0) {
      setCogRunning(false);
      return;
    }
    const id = setTimeout(() => setCogTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [cogRunning, cogTimeLeft]);

  const randomSpot = () => ({
    x: Math.floor(Math.random() * 75) + 12,
    y: Math.floor(Math.random() * 65) + 18,
  });

  const startTest = () => {
    setCogHits(0);
    setCogAvgMs(null);
    setCogTimeLeft(10);
    setCogRunning(true);
    setLastSpawn(performance.now());
    setCogTarget(randomSpot());
  };

  const hitTarget = () => {
    if (!cogRunning) return;
    const now = performance.now();
    const reaction = Math.round(now - lastSpawn);
    setCogHits((h) => h + 1);
    setCogAvgMs((prev) =>
      prev === null ? reaction : Math.round((prev + reaction) / 2)
    );
    setLastSpawn(now);
    setCogTarget(randomSpot());
  };

  const toggleBone = (id: string) => {
    const next = bone.map((b) =>
      b.id === id ? { ...b, checked: !b.checked } : b
    );
    setBone(next);
    if (next.every((b) => b.checked)) completeQuest("q_ared_exercise");
  };

  const boneDone = bone.filter((b) => b.checked).length;
  const hrRecovered = vitals.hr <= 75;
  const needsReport =
    symptoms.nausea >= 5 || symptoms.fatigue >= 6 || dose > 50;
  const spo2Low = vitals.spo2 < 92;
  const reactionSlow = cogAvgMs !== null && cogAvgMs >= 550;

  let sectionStatus: HealthStatus = "GREEN";
  if (spo2Low || needsReport) {
    sectionStatus = "RED";
  } else if (!hrRecovered || reactionSlow || boneDone < bone.length) {
    sectionStatus = "YELLOW";
  }

  const vexWarningText = spo2Low
    ? `SpO₂ (${vitals.spo2}%) is below the 92% safety floor—put on 100% O₂ mask and halt exertion immediately!`
    : needsReport
    ? `Radiation dose (${dose} mSv) or symptom scores require immediate Flight Surgeon report!`
    : reactionSlow
    ? `Reaction average (${cogAvgMs} ms) is slower than 550 ms threshold—check Cabin CO₂ and SpO₂!`
    : !hrRecovered
    ? `Resting HR (${vitals.hr} BPM) is above the 75 BPM recovery target—practice 6 breaths/min paced breathing.`
    : `All 4 countermeasure modules are within safe corridors (${boneDone}/${bone.length} bone protocols logged).`;

  return (
    <div className="space-y-2.5">
      <VexSectionBanner
        sectionId="countermeasures"
        sectionBadge="SECTION 07 · COUNTERMEASURES & SYMPTOM CHECK (OSLO PULSE)"
        status={sectionStatus}
        storyNote="Active interventions for Hypoxia, 0g Cardiovascular Deconditioning, Bone Loss, and Radiation"
        instruction="Run the 10-second Hypoxia reaction test, check off your 2h ARED bone exercise, and update your radiation dosimeter & symptom sliders."
        warning={vexWarningText}
      />

      <Panel
        title="Countermeasures and symptom check"
        aside={
          isEsp32Connected ? "Live MAX30102 sensor" : "Simulated sensor stream"
        }
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {/* Hypoxia */}
          <Module
            title="Hypoxia"
            aside={
              <span
                className={cn(
                  "font-mono",
                  spo2Low ? "text-rose-400" : "text-slate-200"
                )}
              >
                {vitals.spo2}% SpO₂{spo2Low ? " · below floor" : ""}
              </span>
            }
          >
            <Bars
              label="SpO₂, last 16 readings (dashed line = 92% floor)"
              values={history.slice(-16).map((s) => s.spo2)}
              domain={[85, 100]}
              floor={92}
              tone={(v) => (v < 92 ? "bg-rose-500" : "bg-slate-500")}
            />
            <SymptomSlider
              label="Headache"
              value={symptoms.headache}
              onChange={setSym("headache")}
            />

            <div className="rounded border border-slate-800 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-300">
                  10-second reaction test
                </span>
                {cogRunning ? (
                  <span className="font-tabular font-mono text-xs text-slate-300">
                    {cogTimeLeft}s · {cogHits} hits
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={startTest}
                    className={cn(primaryButton, "px-2 py-1 text-xs")}
                  >
                    {cogAvgMs ? "Run again" : "Start"}
                  </button>
                )}
              </div>
              {cogRunning ? (
                <div className="relative mt-2 h-24 rounded border border-slate-700 bg-slate-950">
                  <button
                    type="button"
                    aria-label="Target"
                    onClick={hitTarget}
                    style={{ left: `${cogTarget.x}%`, top: `${cogTarget.y}%` }}
                    className="absolute size-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400 active:scale-90"
                  />
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-400">
                  {cogAvgMs
                    ? `${cogAvgMs} ms average over ${cogHits} taps. ${
                        cogAvgMs < 550
                          ? "Within normal range."
                          : "Slower than usual."
                      }`
                    : "Tap the dot as fast as you can. Slow reactions can be an early sign of hypoxia or high CO₂."}
                </p>
              )}
            </div>
          </Module>

          {/* Cardiovascular */}
          <Module
            title="Cardiovascular"
            aside={
              <span className="font-mono text-slate-200">{vitals.hr} BPM</span>
            }
          >
            <Bars
              label="Heart rate, last 16 readings"
              values={history.slice(-16).map((s) => s.hr)}
              domain={[50, 120]}
              tone={(v) =>
                v > 95
                  ? "bg-rose-500"
                  : v > 80
                  ? "bg-amber-400"
                  : "bg-slate-500"
              }
            />
            <div className="rounded border border-slate-800 p-2.5 text-xs">
              <div
                className={cn(
                  "font-medium",
                  hrRecovered ? "text-emerald-400" : "text-amber-400"
                )}
              >
                {hrRecovered
                  ? "Resting rate at or under 75 BPM target"
                  : "Resting rate above 75 BPM target"}
              </div>
              <p className="mt-1 leading-relaxed text-slate-400">
                {hrRecovered
                  ? "Heart rate is inside the expected 0g resting range."
                  : "Try paced breathing at 6 breaths per minute, then re-check."}
              </p>
            </div>
          </Module>

          {/* Bone */}
          <Module
            title="Bone loss"
            aside={
              <span className="text-slate-300">
                {boneDone} of {bone.length} logged today
              </span>
            }
          >
            <ul className="space-y-1.5">
              {bone.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => toggleBone(b.id)}
                    aria-pressed={b.checked}
                    className={cn(
                      "flex w-full items-center gap-2 rounded border px-2.5 py-2 text-left text-xs transition-colors",
                      b.checked
                        ? "border-slate-800 text-slate-500"
                        : "border-slate-700 text-slate-200 hover:border-slate-500 hover:bg-slate-800"
                    )}
                  >
                    {b.checked ? (
                      <CheckSquare size={15} className="shrink-0" />
                    ) : (
                      <Square size={15} className="shrink-0" />
                    )}
                    <span className={cn(b.checked && "line-through")}>
                      {b.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <SymptomSlider
              label="Joint or back discomfort"
              value={symptoms.jointPain}
              onChange={setSym("jointPain")}
            />
          </Module>

          {/* Radiation */}
          <Module
            title="Radiation"
            aside={
              <span
                className={needsReport ? "text-rose-400" : "text-slate-300"}
              >
                {needsReport ? "Report to flight surgeon" : "Within limits"}
              </span>
            }
          >
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded border border-slate-800 p-2">
                <div className="text-slate-400">Area monitor</div>
                <div className="mt-0.5 font-tabular font-mono text-lg text-slate-50">
                  {flux}
                </div>
                <div className="text-slate-500">mSv/day</div>
              </div>
              <div className="rounded border border-slate-800 p-2">
                <div className="text-slate-400">Total dose</div>
                <div className="mt-0.5 font-tabular font-mono text-lg text-slate-50">
                  {dose}
                </div>
                <div className="text-slate-500">mSv</div>
              </div>
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setDose(Number(doseInput) || 0);
              }}
            >
              <input
                type="number"
                step="0.1"
                value={doseInput}
                onChange={(e) => setDoseInput(e.target.value)}
                aria-label="Badge dosimeter reading (mSv)"
                className={field}
              />
              <button type="submit" className={button}>
                Update
              </button>
            </form>
            <SymptomSlider
              label="Nausea"
              value={symptoms.nausea}
              onChange={setSym("nausea")}
            />
            <SymptomSlider
              label="Fatigue"
              value={symptoms.fatigue}
              onChange={setSym("fatigue")}
            />
          </Module>
        </div>
      </Panel>
    </div>
  );
}
