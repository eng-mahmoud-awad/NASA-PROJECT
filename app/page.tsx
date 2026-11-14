"use client";

import React, { useEffect, useState } from "react";
import RocketLaunchLoader from "@/components/RocketLaunchLoader";
import MissionHeader from "@/components/MissionHeader";
import AstronautBodyHud from "@/components/AstronautBodyHud";
import VitalsGrid from "@/components/VitalsGrid";
import CrewInputPanel from "@/components/CrewInputPanel";
import LiveChartAndQuests from "@/components/LiveChartAndQuests";
import { useHealthStore, MetricKey } from "@/store/useHealthStore";
import { simulateNextTelemetryTick } from "@/lib/esp32Client";
import NtnSatelliteBar from "@/components/NtnSatelliteBar";
import { encapsulateNtnFrame } from "@/lib/ntnLayer";
import OsloPulseProtocol from "@/components/OsloPulseProtocol";
import AlienAdvisor from "@/components/AlienAdvisor";
import VexAvatar from "@/components/VexAvatar";
import { scrollToWebsiteSection } from "@/components/VexSectionBanner";

const HOTKEY_CHANNELS: MetricKey[] = ["hr", "spo2", "temp", "bp", "glo", "co2"];

export default function AstroVitalsApp() {
  const [launched, setLaunched] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("hr");

  const {
    pollEsp32,
    updateEsp32Telemetry,
    overallStatus,
    vitals,
    startSectionTutorial,
  } = useHealthStore();

  // Keyboard channel hotkeys [1-6]
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const idx = Number(e.key) - 1;
      if (idx >= 0 && idx < HOTKEY_CHANNELS.length) setSelectedMetric(HOTKEY_CHANNELS[idx]);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // 2-second loop: poll the real ESP32 if connected, otherwise run the simulation
  useEffect(() => {
    const interval = setInterval(async () => {
      await pollEsp32();
      const state = useHealthStore.getState();

      if (!state.isEsp32Connected) {
        const simTick = simulateNextTelemetryTick(state.vitals);
        const nextSeq = state.ntnSequence + 1;
        const frame = encapsulateNtnFrame(simTick, state.ntnOrbitMode, nextSeq, state.isSatelliteBlackout);

        if (state.isSatelliteBlackout) {
          useHealthStore.setState({
            ntnSequence: nextSeq,
            lastNtnFrame: frame,
            dtnBufferQueue: [...state.dtnBufferQueue.slice(-19), frame],
          });
        } else {
          useHealthStore.setState({ ntnSequence: nextSeq, lastNtnFrame: frame });
          updateEsp32Telemetry(simTick);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [pollEsp32, updateEsp32Telemetry]);

  return (
    <div className="relative min-h-screen text-slate-200">
      {!launched && <RocketLaunchLoader duration={3500} onLaunchComplete={() => setLaunched(true)} />}

      <MissionHeader />

      {/*
        Screen job: tell the crew member whether any vital is out of range and
        what to do about it. Order follows that decision:
        alerts -> all six vitals -> trend of the selected one -> logging and link -> countermeasures.
      */}
      <main className="mx-auto max-w-[1440px] space-y-4 px-4 py-4">
        <AlienAdvisor selectedMetric={selectedMetric} onSelectMetric={setSelectedMetric} />

        <section id="vitals" aria-label="Vitals" className="scroll-mt-28">
          <VitalsGrid selectedMetric={selectedMetric} onSelectMetric={setSelectedMetric} />
        </section>

        <section id="trend" aria-label="Trend and tasks" className="scroll-mt-28">
          <LiveChartAndQuests selectedMetric={selectedMetric} onSelectMetric={setSelectedMetric} />
        </section>

        <section id="log" aria-label="Sensor map, logging and link" className="grid scroll-mt-28 grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <AstronautBodyHud selectedMetric={selectedMetric} onSelectMetric={setSelectedMetric} />
          </div>
          <div id="crew-log-link" className="grid scroll-mt-28 grid-cols-1 gap-4 lg:col-span-8 lg:grid-cols-2">
            <div>
              <CrewInputPanel />
            </div>
            <div>
              <NtnSatelliteBar />
            </div>
          </div>
        </section>

        <section id="countermeasures" aria-label="Countermeasures" className="scroll-mt-28">
          <OsloPulseProtocol />
        </section>
      </main>

      <footer className="mt-4 border-t border-slate-800 bg-slate-950 px-4 py-3 text-xs text-slate-400">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <VexAvatar size="xs" status={overallStatus} heartRateBpm={vitals.hr} />
            <span>
              AstroVitals · Guided by Commander Zyx-9 (&ldquo;Vex&rdquo;) · ESP32-S3 over I2C, CCSDS-DTN-BPv7, NASA HRP risk framework
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                startSectionTutorial(0);
                setTimeout(() => scrollToWebsiteSection("mission-header"), 50);
              }}
              className="rounded border border-slate-700 bg-slate-900 px-2.5 py-1 font-mono text-xs text-sky-400 hover:border-sky-400 hover:text-sky-300"
            >
              Restart 7-Section Website Tutorial
            </button>
            <span className="font-mono">Keys 1–6 select a channel · sampling every 2 s</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
