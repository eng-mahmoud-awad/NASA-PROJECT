"use client";

import { useEffect, useRef, useState } from "react";
import { useHealthStore } from "@/store/useHealthStore";
import { cn } from "@/lib/utils";
import { Panel, button } from "@/components/ui";

const SYMPTOMS = [
  ["headache", "Headache"],
  ["jointPain", "Joint pain"],
  ["nausea", "Nausea"],
  ["fatigue", "Fatigue"],
] as const;

type Symptom = (typeof SYMPTOMS)[number][0];

const FLUX_BY_ENV = { spacecraft: 0.68, rover: 0.54, station: 0.42, base: 0.35 };
const TEST_SECONDS = 10;

const randomSpot = () => ({ x: 10 + Math.random() * 80, y: 15 + Math.random() * 70 });

function ReactionTest() {
  const [timeLeft, setTimeLeft] = useState(0);
  const [spot, setSpot] = useState(randomSpot);
  const [times, setTimes] = useState<number[]>([]);
  const shownAt = useRef(0);
  const running = timeLeft > 0;

  useEffect(() => {
    if (!running) return;
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [running, timeLeft]);

  const start = () => {
    setTimes([]);
    setTimeLeft(TEST_SECONDS);
    setSpot(randomSpot());
    shownAt.current = performance.now();
  };

  const hit = () => {
    const now = performance.now();
    setTimes((t) => [...t, now - shownAt.current]);
    shownAt.current = now;
    setSpot(randomSpot());
  };

  const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-sm text-zinc-300">Reaction test</h3>
        {running ? (
          <span className="font-mono text-xs text-zinc-400">{timeLeft}s</span>
        ) : (
          <button onClick={start} className="text-xs text-zinc-400 underline-offset-2 hover:text-zinc-100 hover:underline">
            {avg ? "Again" : "Start"}
          </button>
        )}
      </div>

      <div className="relative mt-2 h-28 rounded-md border border-zinc-800 bg-zinc-950">
        {running ? (
          <button
            onClick={hit}
            aria-label="target"
            style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
            className="absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-100 active:scale-90"
          />
        ) : (
          <p className="flex h-full items-center justify-center px-4 text-center text-xs text-zinc-500">
            {avg
              ? `${avg} ms average over ${times.length} taps${avg > 550 ? " — slower than usual" : ""}`
              : "Tap the dot as fast as you can for 10 seconds. Slow reactions can be an early sign of hypoxia or high CO₂."}
          </p>
        )}
      </div>
    </div>
  );
}

export default function CheckIn() {
  const environment = useHealthStore((s) => s.environment);
  const [symptoms, setSymptoms] = useState<Record<Symptom, number>>({
    headache: 1,
    jointPain: 2,
    nausea: 0,
    fatigue: 2,
  });
  const [flux, setFlux] = useState(FLUX_BY_ENV[environment]);
  const [doseInput, setDoseInput] = useState("14.8");
  const [dose, setDose] = useState(14.8);

  useEffect(() => {
    const id = setInterval(() => {
      const next = FLUX_BY_ENV[environment] + (Math.random() - 0.48) * 0.08;
      setFlux(Number(next.toFixed(2)));
    }, 2500);
    return () => clearInterval(id);
  }, [environment]);

  const needsReport = symptoms.nausea >= 5 || symptoms.fatigue >= 6 || dose > 50;

  return (
    <Panel title="Crew check-in">
      <div className="grid gap-8 md:grid-cols-3">
        <div className="space-y-3">
          <h3 className="text-sm text-zinc-300">How do you feel?</h3>
          {SYMPTOMS.map(([key, label]) => (
            <label key={key} className="block text-xs text-zinc-400">
              <span className="flex justify-between">
                {label}
                <span
                  className={cn(
                    "font-mono",
                    symptoms[key] >= 6 ? "text-red-400" : symptoms[key] >= 3 ? "text-amber-400" : "text-zinc-300"
                  )}
                >
                  {symptoms[key]}
                </span>
              </span>
              <input
                type="range"
                min={0}
                max={10}
                value={symptoms[key]}
                onChange={(e) => setSymptoms({ ...symptoms, [key]: Number(e.target.value) })}
                className="mt-1 w-full accent-zinc-300"
              />
            </label>
          ))}
        </div>

        <ReactionTest />

        <div>
          <h3 className="text-sm text-zinc-300">Radiation</h3>
          <dl className="mt-2 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-500">Area monitor</dt>
              <dd className="font-mono text-zinc-200">{flux} mSv/day</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Total dose</dt>
              <dd className="font-mono text-zinc-200">{dose} mSv</dd>
            </div>
          </dl>
          <form
            className="mt-3 flex gap-2"
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
              aria-label="Dosimeter reading (mSv)"
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 font-mono text-sm text-zinc-100 focus:border-zinc-400 focus:outline-none"
            />
            <button type="submit" className={button}>
              Update
            </button>
          </form>
          <p className="mt-1.5 text-xs text-zinc-500">Enter the reading from your badge dosimeter.</p>
        </div>
      </div>

      {needsReport && (
        <p className="mt-6 border-t border-zinc-800 pt-3 text-sm text-amber-400">
          Strong nausea or fatigue, or a dose above 50 mSv — report this to the flight surgeon.
        </p>
      )}
    </Panel>
  );
}
