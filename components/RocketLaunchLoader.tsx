"use client";

import React, { useEffect, useState } from "react";
import VexAvatar from "@/components/VexAvatar";
import { button } from "@/components/ui";

interface RocketLaunchLoaderProps {
  /** Minimum time (in ms) the launch sequence runs before revealing the page */
  duration?: number;
  /** Callback fired once the rocket finishes launching and overlay fades out */
  onLaunchComplete?: () => void;
}

type LaunchPhase = "calibrating" | "ignition" | "liftoff" | "completed";

const VEX_LAUNCH_STEPS = [
  "Commander Vex: Intercepting your spacecraft beacon... Linking Xeno-Medical neural core to ESP32-S3 node.",
  "Commander Vex: Calibrating MAX30102 optical pulse & SpO₂ sensors for 0g microgravity...",
  "Commander Vex: Arming CCSDS-DTN Store-and-Forward blackout queue & habitat CO₂ monitors...",
  "Commander Vex: Main engine ignition! All 6 crew biometric channels locked. Liftoff!",
];

export default function RocketLaunchLoader({
  duration = 3500,
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
        }, 550);
        return;
      }

      animationFrameId = requestAnimationFrame(updateProgress);
    };

    animationFrameId = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animationFrameId);
  }, [duration, onLaunchComplete]);

  if (!isVisible) return null;

  const currentStepIndex = Math.min(
    VEX_LAUNCH_STEPS.length - 1,
    Math.floor((progress / 100) * VEX_LAUNCH_STEPS.length)
  );

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between overflow-hidden bg-slate-950 text-slate-100 select-none transition-opacity duration-500 ${
        phase === "completed" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <style>{`
        @keyframes engineShake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-1.5px, 1px) rotate(-0.4deg); }
          50% { transform: translate(1.5px, -1px) rotate(0.4deg); }
          75% { transform: translate(-1.5px, -1px) rotate(-0.2deg); }
        }
        @keyframes flamePulse {
          0%, 100% { transform: scaleY(1) scaleX(1); opacity: 0.95; }
          50% { transform: scaleY(1.25) scaleX(0.9); opacity: 1; }
        }
        @keyframes starStreak {
          0% { transform: translateY(-100vh); opacity: 0; }
          30% { opacity: 0.7; }
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

      {/* Animated Warp Stars */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(24)].map((_, i) => {
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
              className={`absolute top-0 w-[1.5px] rounded-full bg-sky-400/60 transition-all duration-300 ${
                phase === "liftoff" ? "h-20 opacity-80" : "h-3 opacity-30"
              }`}
            />
          );
        })}
      </div>

      {/* Top Bar with Skip Option */}
      <div className="relative z-10 mt-6 flex w-full max-w-xl items-center justify-between px-6">
        <span className="font-mono text-xs text-slate-400">
          ASTROVITALS · PROLOGUE SEQUENCE
        </span>
        <button
          type="button"
          onClick={() => {
            setIsVisible(false);
            onLaunchComplete?.();
          }}
          className={button}
        >
          Skip to Console →
        </button>
      </div>

      {/* Center Rocket & Launchpad Stage */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center">
        <div
          className={`relative flex flex-col items-center transition-transform duration-700 ease-in ${
            phase === "ignition" ? "animate-engine-shake" : ""
          } ${
            phase === "liftoff" || phase === "completed"
              ? "-translate-y-[115vh] scale-95"
              : "translate-y-0 scale-100"
          }`}
        >
          <svg
            viewBox="0 0 120 200"
            className="h-40 w-24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M60 8C60 8 34 45 34 85H86C86 45 60 8 60 8Z"
              fill="#1e293b"
              stroke="#38BDF8"
              strokeWidth="2"
            />
            <path
              d="M60 8C60 8 46 28 42 45H78C74 28 60 8 60 8Z"
              fill="#0f172a"
            />
            <rect
              x="34"
              y="85"
              width="52"
              height="65"
              rx="4"
              fill="#1e293b"
              stroke="#38BDF8"
              strokeWidth="2"
            />
            <circle
              cx="60"
              cy="78"
              r="12"
              fill="#020617"
              stroke="#38BDF8"
              strokeWidth="2.5"
            />
            <circle cx="60" cy="78" r="7" fill="#38bdf8" fillOpacity="0.25" />
            <rect x="57" y="103" width="6" height="18" rx="1" fill="#10B981" />
            <rect x="51" y="109" width="18" height="6" rx="1" fill="#10B981" />
            <path
              d="M34 115L14 148V162L34 150V115Z"
              fill="#0f172a"
              stroke="#38BDF8"
              strokeWidth="2"
            />
            <path
              d="M86 115L106 148V162L86 150V115Z"
              fill="#0f172a"
              stroke="#38BDF8"
              strokeWidth="2"
            />
            <rect
              x="57"
              y="130"
              width="6"
              height="26"
              rx="2"
              fill="#38bdf8"
            />
            <path
              d="M44 150H76L82 166H38L44 150Z"
              fill="#334155"
              stroke="#94A3B8"
              strokeWidth="2"
            />
          </svg>

          <div
            className={`-mt-3 flex flex-col items-center transition-all duration-300 ${
              phase === "calibrating"
                ? "scale-y-50 opacity-30"
                : "scale-y-100 opacity-100"
            }`}
          >
            <div className="animate-flame flex flex-col items-center">
              <div
                className={`w-9 rounded-b-full bg-gradient-to-b from-sky-300 via-amber-400 to-rose-500 transition-all duration-300 ${
                  phase === "liftoff" ? "h-32 w-11" : "h-18"
                }`}
              />
            </div>
          </div>
        </div>

        <div className="mt-2 h-1 w-40 rounded-full bg-slate-800" />
      </div>

      {/* Bottom Commander Vex Pre-Flight Briefing Card */}
      <div className="relative z-10 mb-8 w-full max-w-xl px-6">
        <div className="rounded-md border border-slate-800 bg-slate-900 p-3.5">
          <div className="flex items-start gap-3">
            <VexAvatar size="sm" status="GREEN" modeAccent="sky" isTalking />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="font-semibold text-sky-400">
                  CMDR. ZYX-9 (&ldquo;VEX&rdquo;) · LAUNCH TELEMETRY CHECK
                </span>
                <span className="font-tabular text-slate-300">{progress}%</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-200">
                {VEX_LAUNCH_STEPS[currentStepIndex]}
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-950">
                <div
                  className="h-full rounded-full bg-sky-400 transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
