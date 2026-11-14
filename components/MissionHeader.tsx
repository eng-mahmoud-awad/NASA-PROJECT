"use client";

import React, { useEffect, useState } from "react";
import { Download, RotateCcw, Check, MapPin } from "lucide-react";
import {
  useHealthStore,
  MissionEnvironment,
  DemoScenario,
} from "@/store/useHealthStore";
import { ENVIRONMENT_PROFILES } from "@/lib/medicalGuides";
import { WEBSITE_TUTORIAL_STEPS } from "@/lib/vexData";
import { cn, formatMissionElapsedTime, getStatusTheme } from "@/lib/utils";
import { exportTelemetryDownlinkPacket } from "@/lib/esp32Client";
import { Segmented, button, primaryButton, field } from "@/components/ui";
import VexAvatar from "@/components/VexAvatar";
import VexSectionBanner, {
  scrollToWebsiteSection,
} from "@/components/VexSectionBanner";

const ENV_OPTIONS: { value: MissionEnvironment; label: string }[] = [
  { value: "spacecraft", label: "Transit · 0g" },
  { value: "station", label: "Station · 0g" },
  { value: "rover", label: "Rover · 0.16g" },
  { value: "base", label: "Base · 0.38g" },
];

const SCENARIOS: { value: DemoScenario; label: string }[] = [
  { value: "nominal", label: "Nominal" },
  { value: "co2_pocket", label: "0g CO₂ pocket" },
  { value: "eva_hypoxia", label: "EVA hypoxia" },
  { value: "fluid_shift_bp", label: "0g BP shift" },
];

// Every link points at a real section id in page.tsx.
const NAV = [
  { href: "#vex-bridge", label: "Vex Bridge" },
  { href: "#vitals", label: "Vitals" },
  { href: "#trend", label: "Trend" },
  { href: "#crew-log-link", label: "Log & link" },
  { href: "#countermeasures", label: "Countermeasures" },
];

export default function MissionHeader() {
  const {
    environment,
    setEnvironment,
    overallStatus,
    readinessScore,
    isEsp32Connected,
    esp32Ip,
    setEsp32Ip,
    lastSyncTime,
    vitals,
    history,
    triggerDemoScenario,
    resetMissionData,
    tutorialActive,
    tutorialStepIdx,
    startSectionTutorial,
    stopSectionTutorial,
  } = useHealthStore();

  const [metSeconds, setMetSeconds] = useState(389520);
  const [editingIp, setEditingIp] = useState(false);
  const [ipDraft, setIpDraft] = useState(esp32Ip);

  const statusTheme = getStatusTheme(overallStatus);
  const envProfile = ENVIRONMENT_PROFILES[environment];
  const isHeaderStep =
    tutorialActive &&
    WEBSITE_TUTORIAL_STEPS[tutorialStepIdx]?.id === "mission-header";

  useEffect(() => {
    const timer = setInterval(() => setMetSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const saveIp = (e: React.FormEvent) => {
    e.preventDefault();
    if (ipDraft.trim()) setEsp32Ip(ipDraft.trim());
    setEditingIp(false);
  };

  return (
    <header
      id="mission-header"
      className={cn(
        "sticky top-0 z-40 border-b bg-slate-950 transition-colors",
        isHeaderStep ? "border-sky-400" : "border-slate-800"
      )}
    >
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <VexAvatar
            size="xs"
            status={overallStatus}
            heartRateBpm={vitals.hr}
          />
          <div className="flex items-baseline gap-2.5">
            <span className="font-display text-base font-semibold text-slate-50">
              AstroVitals
            </span>
            <span className="font-tabular font-mono text-xs text-slate-400">
              {formatMissionElapsedTime(metSeconds)}
            </span>
          </div>
        </div>

        <nav aria-label="Sections" className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="rounded px-2 py-1 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-2">
          {/* Vex Interactive Website Tutorial Trigger */}
          <button
            type="button"
            onClick={() => {
              if (tutorialActive) {
                stopSectionTutorial();
              } else {
                startSectionTutorial(0);
                setTimeout(() => scrollToWebsiteSection("mission-header"), 50);
              }
            }}
            className={cn(
              tutorialActive ? primaryButton : button,
              "px-2.5 py-1 text-xs"
            )}
            title="Launch Commander Vex's interactive tutorial to identify every section of the website"
          >
            <MapPin size={13} className={cn(!tutorialActive && "text-sky-400")} />
            <span>
              {tutorialActive
                ? `Touring (${tutorialStepIdx + 1}/7)`
                : "Vex Tour (7 Sections)"}
            </span>
          </button>

          <span className="flex items-center gap-2 text-sm text-slate-200">
            <span className={cn("size-2 rounded-full", statusTheme.dot)} />
            {statusTheme.label}
          </span>

          <span className="flex items-center gap-2 text-sm text-slate-300">
            <span className="font-tabular font-mono">{readinessScore}%</span>
            <span className="text-slate-400">ready</span>
            <span className="h-1 w-14 overflow-hidden rounded-full bg-slate-800">
              <span
                className="block h-full rounded-full transition-all duration-500"
                style={{
                  width: `${readinessScore}%`,
                  backgroundColor: statusTheme.hex,
                }}
              />
            </span>
          </span>

          <select
            value=""
            onChange={(e) =>
              triggerDemoScenario(e.target.value as DemoScenario)
            }
            aria-label="Inject test scenario"
            className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-300"
          >
            <option value="" disabled>
              Inject scenario
            </option>
            {SCENARIOS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() =>
              exportTelemetryDownlinkPacket({
                environment,
                readinessScore,
                vitals,
                history,
              })
            }
            className={button}
            aria-label="Export telemetry packet as JSON"
          >
            <Download size={14} />
            Export
          </button>
          <button
            type="button"
            onClick={resetMissionData}
            className={button}
            aria-label="Reset mission telemetry to baseline"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>

      <div className="border-t border-slate-800/70 bg-slate-950">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2">
          <Segmented
            options={ENV_OPTIONS}
            value={environment}
            onChange={setEnvironment}
            label="Habitat environment"
          />

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
            <span className="hidden xl:inline">
              <span className="font-mono text-sky-400">Vex habitat note:</span>{" "}
              {envProfile.tagline}
            </span>
            <span>Check every {envProfile.routineCheckIntervalMins} min</span>
            {lastSyncTime && (
              <span className="font-tabular font-mono">
                Synced {lastSyncTime}
              </span>
            )}
            {editingIp ? (
              <form onSubmit={saveIp} className="flex items-center gap-1.5">
                <label className="sr-only" htmlFor="esp-ip">
                  ESP32 IP address
                </label>
                <input
                  id="esp-ip"
                  value={ipDraft}
                  onChange={(e) => setIpDraft(e.target.value)}
                  autoFocus
                  className={cn(field, "w-36 py-1 text-xs")}
                />
                <button
                  type="submit"
                  aria-label="Save IP address"
                  className="rounded bg-sky-500 p-1.5 text-slate-950 hover:bg-sky-400"
                >
                  <Check size={12} />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIpDraft(esp32Ip);
                  setEditingIp(true);
                }}
                className="rounded px-1.5 py-0.5 hover:bg-slate-800 hover:text-slate-100"
                title="Change ESP32 node address"
              >
                {isEsp32Connected ? "ESP32" : "Simulated"} ·{" "}
                <span className="font-mono">{esp32Ip}</span>
              </button>
            )}
          </div>
        </div>

        {/* Tutorial Spotlight Banner when Step 1 (Mission Header) is active */}
        {isHeaderStep && (
          <div className="mx-auto max-w-[1440px] px-4 pb-3 pt-1">
            <VexSectionBanner
              sectionId="mission-header"
              sectionBadge="SECTION 01 · MISSION HEADER & HABITAT HELM"
              status={overallStatus}
              instruction="Switch habitat gravity profiles on the left or inject test scenarios on the right."
              warning={`Active hazard profile: ${envProfile.primaryHazards[0]}`}
            />
          </div>
        )}
      </div>
    </header>
  );
}
