"use client";

import React, { useEffect, useState } from "react";
import {
  Wind,
  Heart,
  Bone,
  Radiation,
  Brain,
  Award,
  CheckCircle2,
  AlertTriangle,
  Play,
  ShieldCheck,
  Activity,
  Sparkles,
} from "lucide-react";
import { useHealthStore, MissionEnvironment } from "@/store/useHealthStore";
import { cn } from "@/lib/utils";

const OSLO_ENV_MAP: { label: string; value: MissionEnvironment }[] = [
  { label: "Spacecraft", value: "spacecraft" },
  { label: "Lunar/Martian Rover", value: "rover" },
  { label: "Planetary Base", value: "base" },
];

export default function OsloPulseProtocol() {
  const {
    environment,
    setEnvironment,
    vitals,
    history,
    isEsp32Connected,
    completeQuest,
  } = useHealthStore();

  // 1. Subjective Symptom Sliders (0 - 10)
  const [symptoms, setSymptoms] = useState({
    headache: 1,
    jointPain: 2,
    nausea: 0,
    fatigue: 2,
  });

  // 2. 10-Second Cognitive Quick Test (Psychomotor Vigilance / Reaction Test)
  const [cogRunning, setCogRunning] = useState(false);
  const [cogTimeLeft, setCogTimeLeft] = useState(10);
  const [cogTargetPos, setCogTargetPos] = useState({ x: 50, y: 50 });
  const [cogHits, setCogHits] = useState(0);
  const [cogAvgMs, setCogAvgMs] = useState<number | null>(null);
  const [lastSpawnTime, setLastSpawnTime] = useState<number>(0);

  // 3. Bone Density Daily Countermeasure Checklist
  const [boneChecklist, setBoneChecklist] = useState([
    {
      id: "ared_2h",
      label: "Completed 2 hours of ARED resistive exercise",
      checked: false,
    },
    {
      id: "ca_vitd",
      label: "Consumed daily calcium/Vitamin D supplements",
      checked: false,
    },
  ]);

  // 4. Space Radiation (SRAG Flux Simulation + Personal Dosimeter CPD Input)
  const [radiationFlux, setRadiationFlux] = useState<number>(0.42); // mSv/day
  const [cpdDosimeter, setCpdDosimeter] = useState<string>("14.8");
  const [loggedDosimeter, setLoggedDosimeter] = useState<number>(14.8);

  // Live SRAG Radiation Flux micro-fluctuation based on environment
  useEffect(() => {
    const baseFlux =
      environment === "spacecraft"
        ? 0.68
        : environment === "rover"
        ? 0.54
        : 0.35;
    const interval = setInterval(() => {
      const jitter = (Math.random() - 0.48) * 0.08;
      setRadiationFlux(
        Number(Math.max(0.15, Math.min(2.5, baseFlux + jitter)).toFixed(2))
      );
    }, 2500);
    return () => clearInterval(interval);
  }, [environment]);

  // 10s Cognitive Quick Test Timer
  useEffect(() => {
    if (!cogRunning) return;
    if (cogTimeLeft <= 0) {
      setCogRunning(false);
      return;
    }
    const timer = setTimeout(() => setCogTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [cogRunning, cogTimeLeft]);

  const startCognitiveTest = () => {
    setCogHits(0);
    setCogAvgMs(null);
    setCogTimeLeft(10);
    setCogRunning(true);
    setLastSpawnTime(performance.now());
    setCogTargetPos({
      x: Math.floor(Math.random() * 75) + 12,
      y: Math.floor(Math.random() * 65) + 18,
    });
  };

  const handleTargetHit = () => {
    if (!cogRunning) return;
    const now = performance.now();
    const reaction = Math.round(now - lastSpawnTime);
    setCogHits((h) => h + 1);
    setCogAvgMs((prev) =>
      prev === null ? reaction : Math.round((prev + reaction) / 2)
    );
    setLastSpawnTime(now);
    setCogTargetPos({
      x: Math.floor(Math.random() * 75) + 12,
      y: Math.floor(Math.random() * 65) + 18,
    });
  };

  const toggleBoneItem = (id: string) => {
    const updated = boneChecklist.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setBoneChecklist(updated);
    if (updated.every((i) => i.checked)) {
      completeQuest("q_ared_exercise");
    }
  };

  const boneBadgeUnlocked = boneChecklist.every((i) => i.checked);
  const hrRecoveryMet = vitals.hr <= 75;
  const arsRiskAlert =
    symptoms.nausea >= 5 || symptoms.fatigue >= 6 || loggedDosimeter > 50;

  return (
    <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
      {/* Protocol Header & Environment Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
              OSLO PULSE PROTOCOL v1.0
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              {isEsp32Connected ? "MAX30102 OPTICAL LOCK" : "TELEMETRY STREAM"}
            </span>
          </div>
          <h2 className="mt-1 text-lg font-bold text-white">
            Crew Health & NASA HRP Hazard Monitoring
          </h2>
        </div>

        {/* <EnvironmentSelector /> */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 p-1">
          {OSLO_ENV_MAP.map((opt) => {
            const active = environment === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setEnvironment(opt.value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 font-mono text-xs font-bold transition",
                  active
                    ? "bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4-Module Interactive Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* ======================================================== */}
        {/* MODULE 1: RISK OF HYPOXIA (SpO2 + Headache + 10s Reflex) */}
        {/* ======================================================== */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/75 p-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400">
                  <Wind size={17} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    1. Risk of Hypoxia
                  </h3>
                  <p className="font-mono text-[10px] text-slate-400">
                    MAX30102 SpO2 Threshold: 92%
                  </p>
                </div>
              </div>

              <span
                className={cn(
                  "rounded-md border px-2 py-0.5 font-mono text-xs font-bold",
                  vitals.spo2 < 92
                    ? "border-rose-500/50 bg-rose-500/20 text-rose-300"
                    : "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                )}
              >
                {vitals.spo2}% SpO2
              </span>
            </div>

            {/* <LiveSpO2Chart threshold={92} /> */}
            <div className="mt-3 rounded-xl border border-slate-800/90 bg-slate-900/70 p-2.5">
              <div className="mb-1 flex justify-between font-mono text-[10px] text-slate-400">
                <span>LIVE PULSATILE SpO2 STREAM</span>
                <span className="text-rose-400">--- 92% Hypoxia Floor</span>
              </div>
              <div className="flex h-12 items-end gap-1">
                {history.slice(-16).map((snap, i) => {
                  const pct = Math.max(
                    15,
                    Math.min(100, ((snap.spo2 - 85) / 15) * 100)
                  );
                  const isLow = snap.spo2 < 92;
                  return (
                    <div
                      key={i}
                      style={{ height: `${pct}%` }}
                      className={cn(
                        "flex-1 rounded-t transition-all",
                        isLow ? "bg-rose-500" : "bg-cyan-400/80"
                      )}
                      title={`${snap.spo2}% at ${snap.timestamp}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* <SymptomSlider label="Headache Severity" /> */}
            <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/40 p-2.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-300">
                  Headache Severity
                </span>
                <span
                  className={cn(
                    "font-mono font-bold",
                    symptoms.headache >= 6
                      ? "text-rose-400"
                      : symptoms.headache >= 3
                      ? "text-amber-400"
                      : "text-emerald-400"
                  )}
                >
                  {symptoms.headache} / 10
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                value={symptoms.headache}
                onChange={(e) =>
                  setSymptoms({ ...symptoms, headache: Number(e.target.value) })
                }
                className="mt-1.5 h-1.5 w-full cursor-pointer accent-cyan-400"
              />
            </div>
          </div>

          {/* <CognitiveQuickTest duration={10} /> */}
          <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/80 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                <Brain size={14} className="text-purple-400" />
                <span>10s Cognitive Reflex Check</span>
              </div>
              {!cogRunning ? (
                <button
                  onClick={startCognitiveTest}
                  className="flex items-center gap-1 rounded-lg bg-purple-500 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-950 hover:bg-purple-400"
                >
                  <Play size={11} />
                  <span>{cogAvgMs ? "Retest (10s)" : "Start 10s Test"}</span>
                </button>
              ) : (
                <span className="font-mono text-xs font-bold text-amber-400">
                  {cogTimeLeft}s left • Hits: {cogHits}
                </span>
              )}
            </div>

            {cogRunning ? (
              <div className="relative mt-2 h-24 w-full overflow-hidden rounded-lg border border-purple-500/40 bg-slate-950">
                <button
                  type="button"
                  onClick={handleTargetHit}
                  style={{
                    left: `${cogTargetPos.x}%`,
                    top: `${cogTargetPos.y}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-cyan-400 text-slate-950 shadow-[0_0_15px_#22d3ee] transition-transform active:scale-75"
                >
                  <Sparkles size={13} />
                </button>
              </div>
            ) : (
              <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-slate-400">
                <span>
                  {cogAvgMs
                    ? `Avg Reaction: ${cogAvgMs} ms (${cogHits} hits)`
                    : "Tap moving targets to screen for hypoxia cognitive lag"}
                </span>
                {cogAvgMs && (
                  <span
                    className={cn(
                      "font-bold",
                      cogAvgMs < 550 ? "text-emerald-400" : "text-amber-400"
                    )}
                  >
                    {cogAvgMs < 550 ? "ALERTNESS NOMINAL" : "MILD LATENCY"}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* MODULE 2: CARDIOVASCULAR ADAPTATIONS (HR + Recovery)     */}
        {/* ======================================================== */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/75 p-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                  <Heart size={17} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    2. Cardiovascular Adaptations
                  </h3>
                  <p className="font-mono text-[10px] text-slate-400">
                    Resting Baseline Target: ≤ 75 BPM
                  </p>
                </div>
              </div>

              <span className="rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 font-mono text-xs font-bold text-emerald-300">
                {vitals.hr} BPM
              </span>
            </div>

            {/* <LiveHeartRateChart endpoint="/api/telemetry" /> */}
            <div className="mt-3 rounded-xl border border-slate-800/90 bg-slate-900/70 p-2.5">
              <div className="mb-1 flex justify-between font-mono text-[10px] text-slate-400">
                <span>MAX30102 RESTING HEART RATE STREAM</span>
                <span className="text-emerald-400">Target: 70 BPM</span>
              </div>
              <div className="flex h-16 items-end gap-1">
                {history.slice(-16).map((snap, i) => {
                  const pct = Math.max(
                    15,
                    Math.min(100, ((snap.hr - 50) / 70) * 100)
                  );
                  return (
                    <div
                      key={i}
                      style={{ height: `${pct}%` }}
                      className={cn(
                        "flex-1 rounded-t transition-all",
                        snap.hr > 95
                          ? "bg-rose-500"
                          : snap.hr > 80
                          ? "bg-amber-400"
                          : "bg-emerald-400/80"
                      )}
                      title={`${snap.hr} BPM at ${snap.timestamp}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* <RecoveryBadge metric="BPM" target={70} /> */}
          <div
            className={cn(
              "mt-3 flex items-center justify-between rounded-xl border p-3.5",
              hrRecoveryMet
                ? "border-emerald-500/40 bg-emerald-500/10"
                : "border-amber-500/40 bg-amber-500/10"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl border",
                  hrRecoveryMet
                    ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-300"
                    : "border-amber-400/50 bg-amber-500/20 text-amber-300"
                )}
              >
                <Activity size={20} />
              </div>
              <div>
                <div className="font-mono text-xs font-bold text-white">
                  CARDIAC RECOVERY BADGE (TARGET: 70 BPM)
                </div>
                <div className="text-xs text-slate-300">
                  {hrRecoveryMet
                    ? "Resting baseline within resilient 0g cardiovascular zone."
                    : "Elevated resting HR — complete paced breathing to reach ≤75 BPM."}
                </div>
              </div>
            </div>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 font-mono text-[10px] font-bold",
                hrRecoveryMet
                  ? "bg-emerald-400 text-slate-950"
                  : "bg-slate-800 text-amber-300"
              )}
            >
              {hrRecoveryMet ? "UNLOCKED" : "CALIBRATING"}
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* MODULE 3: SPACEFLIGHT-INDUCED BONE CHANGES (ARED)        */}
        {/* ======================================================== */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/75 p-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
                  <Bone size={17} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    3. Spaceflight-Induced Bone Changes
                  </h3>
                  <p className="font-mono text-[10px] text-slate-400">
                    Osteoclastic Resorption Countermeasure Log
                  </p>
                </div>
              </div>

              <span
                className={cn(
                  "flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold",
                  boneBadgeUnlocked
                    ? "border-amber-400 bg-amber-500/20 text-amber-300"
                    : "border-slate-700 bg-slate-900 text-slate-400"
                )}
              >
                <Award size={12} />
                {boneBadgeUnlocked
                  ? "Bone Density Guardian"
                  : "0/2 Countermeasures"}
              </span>
            </div>

            {/* <DailyChecklist /> */}
            <div className="mt-3 space-y-2">
              {boneChecklist.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleBoneItem(item.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border p-2.5 text-left text-xs transition",
                    item.checked
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                      : "border-slate-800 bg-slate-900/60 text-slate-200 hover:border-cyan-500/40"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2
                      size={15}
                      className={
                        item.checked ? "text-emerald-400" : "text-slate-600"
                      }
                    />
                    <span className={cn(item.checked && "line-through")}>
                      {item.label}
                    </span>
                  </span>
                  <span className="font-mono text-[10px] text-amber-300">
                    {item.checked ? "DONE" : "+XP"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* <SymptomSlider label="Joint or Skeletal Discomfort" /> */}
          <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/40 p-2.5">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-300">
                Joint or Skeletal Discomfort
              </span>
              <span
                className={cn(
                  "font-mono font-bold",
                  symptoms.jointPain >= 6
                    ? "text-rose-400"
                    : symptoms.jointPain >= 3
                    ? "text-amber-400"
                    : "text-emerald-400"
                )}
              >
                {symptoms.jointPain} / 10
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              value={symptoms.jointPain}
              onChange={(e) =>
                setSymptoms({ ...symptoms, jointPain: Number(e.target.value) })
              }
              className="mt-1.5 h-1.5 w-full cursor-pointer accent-amber-400"
            />
          </div>
        </div>

        {/* ======================================================== */}
        {/* MODULE 4: SPACE RADIATION EXPOSURE (SRAG + CPD + ARS)    */}
        {/* ======================================================== */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/75 p-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400">
                  <Radiation size={17} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    4. Space Radiation Exposure
                  </h3>
                  <p className="font-mono text-[10px] text-slate-400">
                    SRAG Flux Monitor & Crew Passive Dosimeter (CPD)
                  </p>
                </div>
              </div>

              <span
                className={cn(
                  "rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold",
                  arsRiskAlert
                    ? "border-rose-500/50 bg-rose-500/20 text-rose-300"
                    : "border-purple-500/40 bg-purple-500/15 text-purple-300"
                )}
              >
                {arsRiskAlert ? "ARS CAUTION" : "SHIELDING NOMINAL"}
              </span>
            </div>

            {/* <RadiationAreaMonitorGauge /> & <DosimeterInput unit="mSv" /> */}
            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-2.5">
                <div className="font-mono text-[10px] text-slate-400">
                  SRAG AREA FLUX SIM
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="font-mono text-xl font-extrabold text-purple-300">
                    {radiationFlux}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    mSv/day
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    style={{ width: `${Math.min(100, radiationFlux * 60)}%` }}
                    className="h-full bg-gradient-to-r from-emerald-400 via-purple-400 to-rose-500"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-2.5">
                <div className="font-mono text-[10px] text-slate-400">
                  CPD BADGE DOSIMETER (mSv)
                </div>
                <div className="mt-1 flex gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    value={cpdDosimeter}
                    onChange={(e) => setCpdDosimeter(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-xs text-white focus:border-purple-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setLoggedDosimeter(Number(cpdDosimeter) || 0)
                    }
                    className="rounded-lg bg-purple-500 px-2.5 py-1 font-mono text-[10px] font-bold text-slate-950 hover:bg-purple-400"
                  >
                    Sync
                  </button>
                </div>
                <div className="mt-1 font-mono text-[10px] text-slate-400">
                  Logged Cumulative: {loggedDosimeter} mSv
                </div>
              </div>
            </div>
          </div>

          {/* Acute Radiation Syndrome (ARS) Symptom Sliders */}
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-300">Nausea / Vomiting</span>
                <span className="font-mono font-bold text-purple-300">
                  {symptoms.nausea}/10
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                value={symptoms.nausea}
                onChange={(e) =>
                  setSymptoms({ ...symptoms, nausea: Number(e.target.value) })
                }
                className="mt-1 h-1.5 w-full cursor-pointer accent-purple-400"
              />
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-300">Unexplained Fatigue</span>
                <span className="font-mono font-bold text-purple-300">
                  {symptoms.fatigue}/10
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                value={symptoms.fatigue}
                onChange={(e) =>
                  setSymptoms({ ...symptoms, fatigue: Number(e.target.value) })
                }
                className="mt-1 h-1.5 w-full cursor-pointer accent-purple-400"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}