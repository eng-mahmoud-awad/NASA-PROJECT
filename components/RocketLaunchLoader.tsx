"use client";

import React, { useEffect, useState } from "react";

interface RocketLaunchLoaderProps {
  /** Minimum time (in ms) the launch sequence runs before revealing the page */
  duration?: number;
  /** Callback fired once the rocket finishes launching and overlay fades out */
  onLaunchComplete?: () => void;
}

type LaunchPhase = "calibrating" | "ignition" | "liftoff" | "completed";

// const TELEMETRY_STEPS = [
//   "CONNECTING TO ESP32 BIO-TELEMETRY NODE...",
//   "CALIBRATING MAX30102 (HR & SpO2) OPTICAL SENSORS...",
//   "VERIFYING SCD40 CABIN CO2 & THERMAL SENSORS...",
//   "LOADING ENVIRONMENT RISK ENGINE & CREW PROFILES...",
//   "MAIN ENGINE IGNITION — ALL VITALS NOMINAL. LIFTOFF!",
// ];

export default function RocketLaunchLoader({
  duration = 3800,
  onLaunchComplete,
}: RocketLaunchLoaderProps) {
  const [progress, setProgress] = useState<number>(0);
  const [phase, setPhase] = useState<LaunchPhase>("calibrating");
  const [isVisible, setIsVisible] = useState<boolean>(true);

  useEffect(() => {
    const startTime = performance.now();
    let animationFrameId: number;

    const updateProgress = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(pct);

      if (pct < 45) {
        setPhase("calibrating");
      } else if (pct < 82) {
        setPhase("ignition");
      } else if (pct < 100) {
        setPhase("liftoff");
      } else {
        setPhase("completed");
        setTimeout(() => {
          setIsVisible(false);
          onLaunchComplete?.();
        }, 650);
        return;
      }

      animationFrameId = requestAnimationFrame(updateProgress);
    };

    animationFrameId = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animationFrameId);
  }, [duration, onLaunchComplete]);

  if (!isVisible) return null;

//   const currentStepIndex = Math.min(
//     TELEMETRY_STEPS.length - 1,
//     Math.floor((progress / 100) * TELEMETRY_STEPS.length)
//   );

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between overflow-hidden bg-slate-950 text-slate-100 select-none transition-opacity duration-700 ${
        phase === "completed" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Custom Keyframes for Engine Shake, Flame Flicker, and Star Warp */}
      <style>{`
        @keyframes engineShake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          20% { transform: translate(-2px, 1px) rotate(-0.5deg); }
          40% { transform: translate(2px, -1px) rotate(0.5deg); }
          60% { transform: translate(-2px, -1px) rotate(-0.3deg); }
          80% { transform: translate(2px, 1px) rotate(0.3deg); }
        }
        @keyframes flamePulse {
          0%, 100% { transform: scaleY(1) scaleX(1); opacity: 0.95; }
          50% { transform: scaleY(1.28) scaleX(0.88); opacity: 1; }
        }
        @keyframes starStreak {
          0% { transform: translateY(-100vh); opacity: 0; }
          30% { opacity: 0.8; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        .animate-engine-shake {
          animation: engineShake 0.12s infinite ease-in-out;
        }
        .animate-flame {
          animation: flamePulse 0.09s infinite ease-in-out;
          transform-origin: top center;
        }
      `}</style>

      {/* Background Deep-Space Radial Glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.08)_0%,_rgba(15,23,42,0.95)_65%,_#020617_100%)]" />

      {/* Animated Warp Stars */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(28)].map((_, i) => {
          const left = `${(i * 37) % 100}%`;
          const delay = `${(i * 0.17) % 2}s`;
          const speed =
            phase === "liftoff" || phase === "completed" ? "0.45s" : "2.2s";

          return (
            <span
              key={i}
              style={{
                left,
                animation: `starStreak ${speed} linear ${delay} infinite`,
              }}
              className={`absolute top-0 w-[2px] rounded-full bg-gradient-to-b from-transparent via-cyan-300 to-white transition-all duration-300 ${
                phase === "liftoff" ? "h-24 opacity-90" : "h-3 opacity-40"
              }`}
            />
          );
        })}
      </div>

      {/* Top Mission Header */}
      {/* <div className="relative z-10 mt-10 flex flex-col items-center gap-1 text-center">
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-mono tracking-widest text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          NASA SPACE APPS // ASTRO-VITALS OS
        </div>
        <h1 className="mt-2 text-xl font-bold tracking-wider text-slate-200 sm:text-2xl">
          CREW HEALTH TELEMETRY SYSTEM
        </h1>
      </div> */}

      {/* Center Rocket & Launchpad Stage */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto">
        {/* Rocket Wrapper — Handles Shake on Ignition & Vertical Launch on Liftoff */}
        <div
          className={`relative flex flex-col items-center transition-transform duration-700 ease-in ${
            phase === "ignition" ? "animate-engine-shake" : ""
          } ${
            phase === "liftoff" || phase === "completed"
              ? "-translate-y-[115vh] scale-95"
              : "translate-y-0 scale-100"
          }`}
        >
          {/* Spacecraft SVG */}
          <svg
            viewBox="0 0 120 200"
            className="h-44 w-28 drop-shadow-[0_0_25px_rgba(6,182,212,0.35)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Nose Cone */}
            <path
              d="M60 8C60 8 34 45 34 85H86C86 45 60 8 60 8Z"
              fill="url(#rocketBody)"
              stroke="#38BDF8"
              strokeWidth="2"
            />
            <path
              d="M60 8C60 8 46 28 42 45H78C74 28 60 8 60 8Z"
              fill="#0284C7"
            />

            {/* Main Fuselage */}
            <rect
              x="34"
              y="85"
              width="52"
              height="65"
              rx="4"
              fill="url(#rocketBody)"
              stroke="#38BDF8"
              strokeWidth="2"
            />

            {/* Cockpit Porthole Window */}
            <circle
              cx="60"
              cy="78"
              r="12"
              fill="#0F172A"
              stroke="#38BDF8"
              strokeWidth="3"
            />
            <circle cx="60" cy="78" r="8" fill="#06B6D4" fillOpacity="0.35" />
            <circle cx="57" cy="75" r="2.5" fill="#E0F2FE" />

            {/* Medical Cross Emblem on Fuselage */}
            <rect x="57" y="103" width="6" height="18" rx="1" fill="#10B981" />
            <rect x="51" y="109" width="18" height="6" rx="1" fill="#10B981" />

            {/* Left & Right Booster Fins */}
            <path
              d="M34 115L14 148V162L34 150V115Z"
              fill="#0369A1"
              stroke="#38BDF8"
              strokeWidth="2"
            />
            <path
              d="M86 115L106 148V162L86 150V115Z"
              fill="#0369A1"
              stroke="#38BDF8"
              strokeWidth="2"
            />

            {/* Center Fin */}
            <rect
              x="57"
              y="130"
              width="6"
              height="26"
              rx="2"
              fill="#0284C7"
            />

            {/* Engine Nozzle */}
            <path
              d="M44 150H76L82 166H38L44 150Z"
              fill="#334155"
              stroke="#94A3B8"
              strokeWidth="2"
            />

            <defs>
              <linearGradient
                id="rocketBody"
                x1="34"
                y1="8"
                x2="86"
                y2="150"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#F8FAFC" />
                <stop offset="0.5" stopColor="#E2E8F0" />
                <stop offset="1" stopColor="#94A3B8" />
              </linearGradient>
            </defs>
          </svg>

          {/* Exhaust Thruster Flame */}
          <div
            className={`-mt-3 flex flex-col items-center transition-all duration-300 ${
              phase === "calibrating"
                ? "scale-y-50 opacity-30"
                : "scale-y-100 opacity-100"
            }`}
          >
            {/* Outer Orange/Cyan Plasma Plume */}
            <div className="animate-flame flex flex-col items-center">
              <div
                className={`w-10 rounded-b-full bg-gradient-to-b from-cyan-300 via-amber-400 to-rose-600 blur-[1px] transition-all duration-300 ${
                  phase === "liftoff" ? "h-36 w-12" : "h-20"
                }`}
              />
              {/* Inner White-Hot Core */}
              <div
                className={`-mt-20 w-5 rounded-b-full bg-white blur-[1px] transition-all duration-300 ${
                  phase === "liftoff" ? "h-20" : "h-12"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Launchpad Smoke Clouds & Pedestal */}
        <div className="relative mt-2 flex flex-col items-center">
          {(phase === "ignition" || phase === "liftoff") && (
            <div className="absolute -top-8 flex items-center justify-center gap-3">
              <span className="h-12 w-12 rounded-full bg-slate-400/20 blur-md animate-ping" />
              <span className="h-16 w-24 rounded-full bg-amber-500/20 blur-xl animate-pulse" />
              <span className="h-12 w-12 rounded-full bg-slate-400/20 blur-md animate-ping" />
            </div>
          )}
          <div className="h-2 w-44 rounded-full bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent shadow-[0_0_20px_rgba(6,182,212,0.7)]" />
        </div>
      </div>

      {/* Bottom Telemetry Console & Progress Bar */}
      <div className="relative z-10 mb-12 w-full max-w-md px-6">
        {/* <div className="mb-2 flex items-center justify-between font-mono text-xs">
          <span className="text-cyan-400 truncate pr-2">
            {TELEMETRY_STEPS[currentStepIndex]}
          </span>
          <span className="font-bold text-emerald-400">{progress}%</span>
        </div> */}

        {/* Progress Bar Track */}
        {/* <div className="h-2.5 w-full overflow-hidden rounded-full border border-slate-800 bg-slate-900/90 p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-amber-400 transition-all duration-100 ease-out shadow-[0_0_12px_rgba(16,185,129,0.7)]"
            style={{ width: `${progress}%` }}
          />
        </div> */}

        {/* Sensor Check Badges */}
        {/* <div className="mt-3 grid grid-cols-4 gap-2 text-center font-mono text-[10px]">
          <div
            className={`rounded border py-1 transition-colors ${
              progress > 20
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-slate-800 bg-slate-900/50 text-slate-500"
            }`}
          >
            ESP32 LINK
          </div>
          <div
            className={`rounded border py-1 transition-colors ${
              progress > 45
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-slate-800 bg-slate-900/50 text-slate-500"
            }`}
          >
            HR / SpO2
          </div>
          <div
            className={`rounded border py-1 transition-colors ${
              progress > 70
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-slate-800 bg-slate-900/50 text-slate-500"
            }`}
          >
            CO2 / TEMP
          </div>
          <div
            className={`rounded border py-1 transition-colors ${
              progress > 90
                ? "border-amber-500/50 bg-amber-500/20 text-amber-300"
                : "border-slate-800 bg-slate-900/50 text-slate-500"
            }`}
          >
            IGNITION
          </div> 
        </div> */}
      </div>
    </div>
  );
}