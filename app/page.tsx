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

export default function AstroVitalsApp() {
  const [launched, setLaunched] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("hr");

  const { isEsp32Connected, pollEsp32, updateEsp32Telemetry } =
    useHealthStore();

  // Live 2-second loop: Polls real ESP32 if connected, otherwise runs smooth 3-sensor simulation
  useEffect(() => {
  const interval = setInterval(async () => {
    await pollEsp32();
    const state = useHealthStore.getState();

    // إذا كان الـ ESP32 غير متصل، يعمل المحاكي أيضاً عبر طبقة الـ NTN!
    if (!state.isEsp32Connected) {
      const simTick = simulateNextTelemetryTick(state.vitals);
      const nextSeq = state.ntnSequence + 1;
      const frame = encapsulateNtnFrame(
        simTick,
        state.ntnOrbitMode,
        nextSeq,
        state.isSatelliteBlackout
      );

      if (state.isSatelliteBlackout) {
        useHealthStore.setState({
          ntnSequence: nextSeq,
          lastNtnFrame: frame,
          dtnBufferQueue: [...state.dtnBufferQueue.slice(-19), frame],
        });
      } else {
        useHealthStore.setState({
          ntnSequence: nextSeq,
          lastNtnFrame: frame,
        });
        updateEsp32Telemetry(simTick);
      }
    }
  }, 2000);

  return () => clearInterval(interval);
}, [pollEsp32, updateEsp32Telemetry]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {!launched && (
        <RocketLaunchLoader
          duration={3500}
          onLaunchComplete={() => setLaunched(true)}
        />
      )}

      <MissionHeader />

      <main className="mx-auto max-w-7xl space-y-4 p-4">
        {/* Top Cockpit Grid: Left 2D Body Scanner (4 cols) + Right Cards & Sliders (8 cols) */}
        <NtnSatelliteBar />
        <OsloPulseProtocol />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <AstronautBodyHud
              selectedMetric={selectedMetric}
              onSelectMetric={setSelectedMetric}
            />
          </div>

          <div className="flex flex-col justify-between gap-4 lg:col-span-8">
            <VitalsGrid
              selectedMetric={selectedMetric}
              onSelectMetric={setSelectedMetric}
            />
            <CrewInputPanel />
          </div>
        </div>

        {/* Bottom Section: Live Waveform Chart + Interactive Gamification Quests */}
        <LiveChartAndQuests
          selectedMetric={selectedMetric}
          onSelectMetric={setSelectedMetric}
        />
      </main>
    </div>
  );
}