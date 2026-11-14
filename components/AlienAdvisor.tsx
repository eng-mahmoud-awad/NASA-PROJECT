"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  ShieldCheck,
  Volume2,
  ArrowRight,
  Compass,
  Zap,
  RefreshCw,
  Eye,
  HeartPulse,
  Flame,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Play,
  ShieldAlert,
  MapPin,
  HelpCircle,
  X,
} from "lucide-react";
import {
  useHealthStore,
  MetricKey,
  DemoScenario,
  VexGuideMode,
  HealthStatus,
} from "@/store/useHealthStore";
import { METRIC_GUIDES, ENVIRONMENT_PROFILES } from "@/lib/medicalGuides";
import { NASA_METRIC_RESEARCH } from "@/lib/nasaHrpData";
import { WEBSITE_TUTORIAL_STEPS, VEX_STORY_CHAPTERS } from "@/lib/vexData";
import { cn, getStatusTheme } from "@/lib/utils";
import VexAvatar from "@/components/VexAvatar";
import { scrollToWebsiteSection } from "@/components/VexSectionBanner";
import { button, primaryButton } from "@/components/ui";

interface AlienAdvisorProps {
  selectedMetric: MetricKey;
  onSelectMetric: (metric: MetricKey) => void;
}

export default function AlienAdvisor({
  selectedMetric,
  onSelectMetric,
}: AlienAdvisorProps) {
  const {
    vitals,
    evaluations,
    overallStatus,
    environment,
    setEnvironment,
    isSatelliteBlackout,
    toggleSatelliteBlackout,
    setNtnOrbitMode,
    triggerDemoScenario,
    resetMissionData,
    vexMode,
    setVexMode,
    storyChapterIdx,
    setStoryChapterIdx,
    tutorialActive,
    tutorialStepIdx,
    startSectionTutorial,
    setTutorialStepIdx,
    stopSectionTutorial,
  } = useHealthStore();

  const [customTipIdx, setCustomTipIdx] = useState<number>(0);
  const [typedText, setTypedText] = useState<string>("");
  const [isTalking, setIsTalking] = useState<boolean>(false);
  const [scanningSweep, setScanningSweep] = useState<boolean>(false);
  const [scrolledDown, setScrolledDown] = useState<boolean>(false);
  const [storyModalOpen, setStoryModalOpen] = useState<boolean>(false);

  // Track scroll position so Vex's persistent companion dock follows the user everywhere
  useEffect(() => {
    const handleScroll = () => {
      setScrolledDown(window.scrollY > 340);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Automatically switch to Live Guardian warning mode whenever an anomaly or blackout triggers
  useEffect(() => {
    if (overallStatus !== "GREEN" || isSatelliteBlackout) {
      setVexMode("live_guardian");
    }
  }, [overallStatus, isSatelliteBlackout, setVexMode]);

  // Periodic autonomous instruction rotation when in nominal Live Guardian mode
  useEffect(() => {
    const timer = setInterval(() => {
      if (
        overallStatus === "GREEN" &&
        !isSatelliteBlackout &&
        vexMode === "live_guardian"
      ) {
        setCustomTipIdx((i) => i + 1);
      }
    }, 18000);
    return () => clearInterval(timer);
  }, [overallStatus, isSatelliteBlackout, vexMode]);

  // Find all currently abnormal metrics (YELLOW or RED)
  const anomalyKeys = (
    ["spo2", "co2", "hr", "bp", "temp", "glo"] as MetricKey[]
  ).filter((k) => evaluations[k].status !== "GREEN");

  const activeChapter =
    VEX_STORY_CHAPTERS[storyChapterIdx % VEX_STORY_CHAPTERS.length];
  const activeTutorialStep =
    WEBSITE_TUTORIAL_STEPS[tutorialStepIdx % WEBSITE_TUTORIAL_STEPS.length];

  const applyStoryChapterContext = useCallback(
    (idx: number, shouldScroll = false) => {
      const ch = VEX_STORY_CHAPTERS[idx % VEX_STORY_CHAPTERS.length];
      setStoryChapterIdx(idx % VEX_STORY_CHAPTERS.length);
      setEnvironment(ch.env);
      if (ch.orbitMode) setNtnOrbitMode(ch.orbitMode);
      onSelectMetric(ch.metricFocus);
      if (shouldScroll) {
        setTimeout(() => scrollToWebsiteSection(ch.targetDomId), 60);
      }
    },
    [setStoryChapterIdx, setEnvironment, setNtnOrbitMode, onSelectMetric]
  );

  const handleAdvanceStory = useCallback(() => {
    if (storyChapterIdx === VEX_STORY_CHAPTERS.length - 1) {
      triggerDemoScenario("eva_hypoxia");
      setVexMode("live_guardian");
      setStoryChapterIdx(0);
      return;
    }
    const nextIdx = (storyChapterIdx + 1) % VEX_STORY_CHAPTERS.length;
    applyStoryChapterContext(nextIdx, false);
  }, [
    storyChapterIdx,
    triggerDemoScenario,
    setVexMode,
    setStoryChapterIdx,
    applyStoryChapterContext,
  ]);

  const handleSelectTutorialStep = useCallback(
    (idx: number, shouldScroll = true) => {
      const bounded =
        (idx + WEBSITE_TUTORIAL_STEPS.length) % WEBSITE_TUTORIAL_STEPS.length;
      setTutorialStepIdx(bounded);
      const spec = WEBSITE_TUTORIAL_STEPS[bounded];
      if (spec.focusMetric) {
        onSelectMetric(spec.focusMetric);
      }
      if (shouldScroll) {
        setTimeout(() => scrollToWebsiteSection(spec.domId), 60);
      }
    },
    [setTutorialStepIdx, onSelectMetric]
  );

  // Build Vex's live speech, instruction, and warning based on current mode and telemetry
  const getActiveTransmission = useCallback(() => {
    const activeGuide = METRIC_GUIDES[selectedMetric];
    const activeNasa = NASA_METRIC_RESEARCH[selectedMetric];
    const activeEval = evaluations[selectedMetric];
    const envProfile = ENVIRONMENT_PROFILES[environment];

    // 1. WEBSITE SECTION TUTORIAL MODE (Identifies every section of the website)
    if (vexMode === "section_tutorial") {
      return {
        visualStatus: overallStatus,
        modeAccent: "sky" as const,
        code: activeTutorialStep.code,
        headline: `Website Guide (${activeTutorialStep.step}/${WEBSITE_TUTORIAL_STEPS.length}): ${activeTutorialStep.title}`,
        sectionIdentify: activeTutorialStep.sectionIdentification,
        narrative: activeTutorialStep.vexStory,
        instruction: activeTutorialStep.vexInstruction,
        warning: activeTutorialStep.vexWarning,
        primaryCta:
          activeTutorialStep.step < WEBSITE_TUTORIAL_STEPS.length
            ? `Next: ${WEBSITE_TUTORIAL_STEPS[activeTutorialStep.step].shortLabel} →`
            : "Finish Tour & Return to Story",
        onPrimaryCta: () => {
          if (activeTutorialStep.step < WEBSITE_TUTORIAL_STEPS.length) {
            handleSelectTutorialStep(tutorialStepIdx + 1, true);
          } else {
            stopSectionTutorial();
          }
        },
        secondaryCta: `Scroll & Highlight Section`,
        onSecondaryCta: () => scrollToWebsiteSection(activeTutorialStep.domId),
      };
    }

    // 2. LIVE GUARDIAN MODE (Prioritizes any active blackout or abnormal vital)
    if (vexMode === "live_guardian") {
      if (isSatelliteBlackout) {
        return {
          visualStatus: "YELLOW" as HealthStatus,
          modeAccent: "status" as const,
          code: "COMMS WARNING · LOS SATELLITE BLACKOUT",
          headline: "Vex Warning: Earth Line-of-Sight Severed — Buffering Active",
          sectionIdentify:
            "Inspect Section 06 (Telemetry Link) to monitor queued CCSDS-DTN packets.",
          narrative: `Astronaut, planetary shadow has severed our radio link with Mission Control. On a standard monitor, your live telemetry would be lost. I have routed your ESP32 stream into my onboard CCSDS-DTN bundle queue until we regain line-of-sight.`,
          instruction: `Check the 'Queued packets' counter in Section 06 (Telemetry Link), then click 'Restore signal' once we clear the horizon.`,
          warning: `Autonomous onboard medical authority is active—do not remove your MAX30102 optical sensor during communication blackout.`,
          primaryCta: "Restore Satellite Signal (AOS)",
          onPrimaryCta: () => toggleSatelliteBlackout(),
          secondaryCta: "Jump to Telemetry Link",
          onSecondaryCta: () => scrollToWebsiteSection("crew-log-link"),
        };
      }

      if (anomalyKeys.length > 0) {
        const worstKey =
          anomalyKeys.find((k) => evaluations[k].status === "RED") ||
          anomalyKeys[0];
        const worstEval = evaluations[worstKey];
        const worstGuide = METRIC_GUIDES[worstKey];

        return {
          visualStatus: worstEval.status,
          modeAccent: "status" as const,
          code: `${worstEval.status} ALERT · ${worstGuide.shortTitle} (${worstEval.label.toUpperCase()})`,
          headline: `Vex Bio-Hazard Warning: ${worstGuide.title} — ${worstEval.label}`,
          sectionIdentify: `Abnormal reading detected in Section 03 (Vitals Grid) & Section 04 (Trend Waveform).`,
          narrative: `My ocular sensors locked onto a telemetry deviation. Your ${
            worstGuide.title
          } is reading ${
            worstKey === "bp"
              ? `${vitals.bpSys}/${vitals.bpDia}`
              : vitals[worstKey]
          } ${worstGuide.unit} (normal corridor: ${
            worstGuide.normalRangeText
          }). ${worstEval.insight}`,
          instruction: worstEval.actions[0],
          warning: worstEval.actions[1] || worstGuide.spaceflightRisk,
          primaryCta: `Execute Countermeasure & Stabilize ${worstGuide.shortTitle}`,
          onPrimaryCta: () => {
            onSelectMetric(worstKey);
            resetMissionData();
          },
          secondaryCta: "Inspect in Countermeasures",
          onSecondaryCta: () => {
            onSelectMetric(worstKey);
            scrollToWebsiteSection("countermeasures");
          },
        };
      }

      // Nominal Live Guardian rotations
      const nominalStories = [
        {
          code: `LIVE GUARDIAN · ${envProfile.name.toUpperCase()}`,
          headline: `All 6 Channels Nominal in ${envProfile.name} (${envProfile.gravityLabel})`,
          sectionIdentify:
            "Monitoring Section 03 (Vitals Grid) and Section 04 (Trend Waveform) every 2 seconds.",
          narrative: `All six biometric channels are inside NASA's safe corridor. We are currently operating in ${envProfile.name} (${envProfile.gravityLabel}). ${envProfile.tagline} Live ESP32 stream: HR ${vitals.hr} BPM, SpO₂ ${vitals.spo2}%, Temp ${vitals.temp}°C.`,
          instruction: `Currently inspecting ${activeGuide.title} (${activeGuide.normalRangeText}). ${activeEval.actions[0]}`,
          warning: `Primary habitat hazard here: ${envProfile.primaryHazards[0]}.`,
          cta: "Start 7-Section Website Tutorial",
          action: () => startSectionTutorial(0),
        },
        {
          code: "VEX FLIGHT SURGEON LOG · ZERO-G HEART",
          headline: "Monitoring Microgravity Cardiovascular Deconditioning",
          sectionIdentify:
            "Cross-checking Section 03 (HR Card) with Section 07 (Cardiovascular Countermeasures).",
          narrative: `On my homeworld we evolved three hearts for high gravity; humans have one. In microgravity, your heart works less against gravity and loses muscle mass while ~2L of fluid shifts toward your head.`,
          instruction: `Keep resting heart rate at or below 75 BPM (currently ${vitals.hr} BPM) and log your daily ARED resistive exercise in Section 07.`,
          warning: `Skipping daily resistive exercise accelerates bone mineral loss by up to 1.5% per month in 0g.`,
          cta: "Inspect Cardiac Channel (HR)",
          action: () => onSelectMetric("hr"),
        },
      ];

      const pick = nominalStories[customTipIdx % nominalStories.length];
      return {
        visualStatus: "GREEN" as HealthStatus,
        modeAccent: "status" as const,
        code: pick.code,
        headline: pick.headline,
        sectionIdentify: pick.sectionIdentify,
        narrative: pick.narrative,
        instruction: pick.instruction,
        warning: pick.warning,
        primaryCta: pick.cta,
        onPrimaryCta: pick.action,
        secondaryCta: "Return to Story Campaign",
        onSecondaryCta: () => setVexMode("story_campaign"),
      };
    }

    // 3. STORY CAMPAIGN MODE (Default Main Storytelling Experience)
    if (vexMode === "story_campaign") {
      const targetStep = WEBSITE_TUTORIAL_STEPS.find(
        (s) => s.id === activeChapter.targetSectionId
      );
      return {
        visualStatus: overallStatus,
        modeAccent: "sky" as const,
        code: activeChapter.locationBadge,
        headline: `${activeChapter.actTitle} — ${activeChapter.subtitle}`,
        sectionIdentify: targetStep
          ? `Story Focuses on ${targetStep.shortLabel}: ${targetStep.title}`
          : undefined,
        narrative: activeChapter.storyNarrative(vitals),
        instruction: activeChapter.vexInstruction,
        warning: activeChapter.vexWarning,
        primaryCta: activeChapter.astronautReply,
        onPrimaryCta: handleAdvanceStory,
        secondaryCta: `Jump to Section (${activeChapter.targetSectionId.replace("-", " ")})`,
        onSecondaryCta: () => {
          applyStoryChapterContext(storyChapterIdx, true);
        },
      };
    }

    // 4. 0g Sensor Coach Mode
    if (vexMode === "measure_coach") {
      return {
        visualStatus: evaluations[selectedMetric].status,
        modeAccent: "sky" as const,
        code: `0G SENSOR COACH · ${activeGuide.shortTitle} (${activeGuide.hardwareName})`,
        headline: `How to Measure ${activeGuide.title} in Microgravity`,
        sectionIdentify: `Hardware mapped in Section 05 (Suit Sensor Map) · Target ${activeGuide.normalRangeText}`,
        narrative: `${activeGuide.whatItMeans} ${activeGuide.spaceflightRisk}`,
        instruction: `Step 1: ${activeGuide.howToMeasureSteps[0]} Step 2: ${
          activeGuide.howToMeasureSteps[1] || ""
        }`,
        warning: `NASA HRP Countermeasure: ${activeNasa.ongoingResearchCountermeasure}`,
        primaryCta: "Coach Next Sensor Channel →",
        onPrimaryCta: () => {
          const order: MetricKey[] = ["hr", "spo2", "temp", "bp", "glo", "co2"];
          const next =
            order[(order.indexOf(selectedMetric) + 1) % order.length];
          onSelectMetric(next);
        },
        secondaryCta: "View on Suit Sensor Map",
        onSecondaryCta: () => scrollToWebsiteSection("sensor-map"),
      };
    }

    // 5. Emergency Drill Instructor Mode
    return {
      visualStatus: overallStatus,
      modeAccent: "status" as const,
      code: "SIMULATOR · BIO-HAZARD DRILL INSTRUCTOR",
      headline: "Test Vex's Warning System with a Live Spaceflight Crisis",
      sectionIdentify:
        "Triggers abnormal telemetry across all 7 website sections so you can practice emergency response.",
      narrative: `In deep space, environmental systems fail without warning. Trigger any of the medical hazards below—watch how my ocular sensors, section banners, and voice console diagnose the failure and issue life-saving instructions.`,
      instruction: `Select any hazard drill button below (EVA Hypoxia, 0g CO₂ Bubble, 0g Fluid Shift BP, or LOS Blackout) to test the warning system.`,
      warning: `Always restore nominal baseline after completing a flight surgeon emergency simulation.`,
      primaryCta: "Restore All Vitals to Nominal",
      onPrimaryCta: () => resetMissionData(),
      secondaryCta: "Tour All 7 Website Sections",
      onSecondaryCta: () => startSectionTutorial(0),
    };
  }, [
    vexMode,
    selectedMetric,
    evaluations,
    environment,
    isSatelliteBlackout,
    anomalyKeys,
    vitals,
    customTipIdx,
    activeChapter,
    activeTutorialStep,
    overallStatus,
    tutorialStepIdx,
    storyChapterIdx,
    handleAdvanceStory,
    handleSelectTutorialStep,
    applyStoryChapterContext,
    onSelectMetric,
    resetMissionData,
    setVexMode,
    startSectionTutorial,
    stopSectionTutorial,
    toggleSatelliteBlackout,
  ]);

  const transmission = getActiveTransmission();
  const statusTheme = getStatusTheme(transmission.visualStatus);

  // Typewriter voice animation whenever narrative changes
  useEffect(() => {
    const full = transmission.narrative;
    setTypedText("");
    setIsTalking(true);
    let i = 0;
    const timer = setInterval(() => {
      i += 4;
      setTypedText(full.slice(0, i));
      if (i >= full.length) {
        setIsTalking(false);
        clearInterval(timer);
      }
    }, 14);
    return () => clearInterval(timer);
  }, [transmission.narrative]);

  // Trigger a visual 6-channel scan sweep
  const handleFullBioSweep = () => {
    setScanningSweep(true);
    const keys: MetricKey[] = ["hr", "spo2", "temp", "bp", "glo", "co2"];
    keys.forEach((k, idx) => {
      setTimeout(() => {
        onSelectMetric(k);
        if (idx === keys.length - 1) {
          setScanningSweep(false);
        }
      }, idx * 220);
    });
  };

  const isTutorialOnBridge =
    tutorialActive && activeTutorialStep.id === "vex-bridge";

  return (
    <>
      {/* ===================================================================== */}
      {/* MAIN HERO CONSOLE: COMMANDER VEX STORYTELLING, TUTORIAL & WARNINGS    */}
      {/* Styled to match AstroVitals Avionics Console (slate-900 / sky-400)    */}
      {/* ===================================================================== */}
      <section
        id="vex-bridge"
        aria-label="Commander Vex Story, Website Tutorial, and Bio-Warning Console"
        className={cn(
          "scroll-mt-28 rounded-md border bg-slate-900 transition-colors",
          isTutorialOnBridge
            ? "border-sky-400 ring-1 ring-sky-400/40"
            : overallStatus === "RED"
            ? "border-rose-500/70"
            : overallStatus === "YELLOW" || isSatelliteBlackout
            ? "border-amber-500/60"
            : "border-slate-800"
        )}
      >
        {/* Console Panel Header Bar (Matches components/ui.tsx Panel) */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className={cn(
                "size-2 rounded-full",
                isSatelliteBlackout ? "bg-amber-400 animate-pulse" : statusTheme.dot
              )}
            />
            <h2 className="text-sm font-semibold text-slate-100">
              Commander Zyx-9 (&ldquo;Vex&rdquo;) · Xeno-Medical Mission Guide &amp; Story Host
            </h2>
            <span className="hidden rounded border border-slate-700 bg-slate-950 px-2 py-0.5 font-mono text-[11px] text-slate-300 sm:inline-block">
              {vexMode === "section_tutorial"
                ? `WEBSITE TUTORIAL (${activeTutorialStep.step}/7)`
                : vexMode === "story_campaign"
                ? `STORY CAMPAIGN (ACT ${activeChapter.chapter}/5)`
                : statusTheme.label}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (tutorialActive) {
                  stopSectionTutorial();
                } else {
                  startSectionTutorial(0);
                }
              }}
              className={cn(
                tutorialActive ? primaryButton : button,
                "px-2.5 py-1 text-xs"
              )}
            >
              <MapPin size={13} />
              <span>
                {tutorialActive
                  ? `Exit Website Tour (${activeTutorialStep.step}/7)`
                  : "Tour Website Sections (7)"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStoryModalOpen(true)}
              className={cn(button, "px-2.5 py-1 text-xs")}
            >
              <BookOpen size={13} />
              <span>Story &amp; Guide Index</span>
            </button>
          </div>
        </header>

        {/* Main 12-Column Avionics Grid */}
        <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-12">
          {/* ================================================================= */}
          {/* LEFT 4 COLS: AVIONICS HOLOGRAM STAGE & 6-CHANNEL RADAR            */}
          {/* ================================================================= */}
          <div className="flex flex-col justify-between rounded-md border border-slate-800 bg-slate-950 p-3.5 lg:col-span-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
              <span className="font-mono font-medium text-slate-300">
                XENO-SURGEON HOLO-LINK
              </span>
              <span className={cn("font-mono font-medium", statusTheme.badgeText)}>
                HR SYNC · {vitals.hr} BPM
              </span>
            </div>

            {/* Redesigned Avionics Alien Character */}
            <div className="my-2 flex items-center justify-center py-1">
              <VexAvatar
                size="lg"
                status={transmission.visualStatus}
                modeAccent={transmission.modeAccent}
                isTalking={isTalking}
                heartRateBpm={vitals.hr}
              />
            </div>

            {/* Bottom 6-Channel Live Telemetry Selector Controlled by Vex */}
            <div className="space-y-2 border-t border-slate-800 pt-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                  <Eye size={12} className="text-sky-400" />
                  6-CHANNEL ORGAN LOCK
                </span>
                <button
                  type="button"
                  onClick={handleFullBioSweep}
                  className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[11px] text-slate-200 transition-colors hover:border-sky-400 hover:text-sky-300"
                >
                  <RefreshCw
                    size={10}
                    className={cn(scanningSweep && "animate-spin text-sky-400")}
                  />
                  <span>{scanningSweep ? "Sweeping..." : "Bio-sweep"}</span>
                </button>
              </div>

              <div className="grid grid-cols-6 gap-1">
                {(["hr", "spo2", "temp", "bp", "glo", "co2"] as MetricKey[]).map(
                  (k) => {
                    const st = evaluations[k].status;
                    const t = getStatusTheme(st);
                    const active = selectedMetric === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => onSelectMetric(k)}
                        className={cn(
                          "flex flex-col items-center rounded border py-1 font-mono text-[10px] uppercase transition-colors",
                          active
                            ? "border-sky-400 bg-slate-800 text-slate-50"
                            : st !== "GREEN"
                            ? "border-amber-500/50 bg-slate-900 text-amber-300"
                            : "border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                        )}
                      >
                        <span className="font-semibold">{k}</span>
                        <span
                          className="mt-0.5 size-1.5 rounded-full"
                          style={{ backgroundColor: t.hex }}
                        />
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* RIGHT 8 COLS: STORYTELLING, WEBSITE TUTORIAL, INSTRUCTIONS/WARNS  */}
          {/* ================================================================= */}
          <div className="flex flex-col justify-between gap-3 lg:col-span-8">
            {/* Mode Switcher Bar (Segmented Console Style) */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div
                role="tablist"
                aria-label="Commander Vex operating modes"
                className="inline-flex flex-wrap gap-0.5 rounded-md border border-slate-800 bg-slate-950 p-0.5 text-xs"
              >
                {(
                  [
                    {
                      id: "story_campaign",
                      label: "Story Campaign (5 Acts)",
                      icon: BookOpen,
                    },
                    {
                      id: "section_tutorial",
                      label: "Website Tutorial (7 Sections)",
                      icon: HelpCircle,
                    },
                    {
                      id: "live_guardian",
                      label: "Live Warnings",
                      icon: HeartPulse,
                      badge:
                        anomalyKeys.length + (isSatelliteBlackout ? 1 : 0) > 0
                          ? String(
                              anomalyKeys.length + (isSatelliteBlackout ? 1 : 0)
                            )
                          : undefined,
                    },
                    {
                      id: "measure_coach",
                      label: "0g Instructions",
                      icon: Compass,
                    },
                    {
                      id: "drill_instructor",
                      label: "Hazard Drills",
                      icon: Flame,
                    },
                  ] as {
                    id: VexGuideMode;
                    label: string;
                    icon: React.ElementType;
                    badge?: string;
                  }[]
                ).map((tab) => {
                  const Icon = tab.icon;
                  const active = vexMode === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => {
                        if (tab.id === "section_tutorial") {
                          startSectionTutorial(tutorialStepIdx);
                        } else {
                          setVexMode(tab.id);
                        }
                      }}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 font-medium transition-colors",
                        active
                          ? "bg-slate-700 text-slate-50"
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      )}
                    >
                      <Icon size={13} className={cn(active && "text-sky-400")} />
                      <span>{tab.label}</span>
                      {tab.badge && (
                        <span className="rounded bg-rose-500 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-slate-950">
                          {tab.badge}!
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active Warnings Pill */}
              {anomalyKeys.length === 0 && !isSatelliteBlackout ? (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-950 px-2.5 py-1 font-mono text-xs text-emerald-400">
                  <ShieldCheck size={13} />
                  <span>0 ACTIVE WARNINGS</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/50 bg-rose-500/10 px-2.5 py-1 font-mono text-xs font-medium text-rose-300">
                  <AlertTriangle size={13} className="text-rose-400" />
                  <span>
                    {anomalyKeys.length + (isSatelliteBlackout ? 1 : 0)} ACTIVE
                    WARNING(S)
                  </span>
                </span>
              )}
            </div>

            {/* Sub-Navigation Bar: Story Acts (1-5) OR Website Sections (1-7) */}
            {vexMode === "story_campaign" && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 py-2">
                <div className="flex flex-wrap items-center gap-1">
                  {VEX_STORY_CHAPTERS.map((ch, idx) => {
                    const active = storyChapterIdx === idx;
                    return (
                      <button
                        key={ch.chapter}
                        type="button"
                        onClick={() => applyStoryChapterContext(idx, false)}
                        className={cn(
                          "rounded px-2.5 py-1 font-mono text-xs transition-colors",
                          active
                            ? "bg-sky-500 font-semibold text-slate-950"
                            : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                        )}
                      >
                        Act {ch.chapter}
                      </button>
                    );
                  })}
                </div>
                <span className="font-mono text-xs text-slate-400">
                  {activeChapter.subtitle}
                </span>
              </div>
            )}

            {vexMode === "section_tutorial" && (
              <div className="flex flex-wrap items-center justify-between gap-1.5 rounded-md border border-sky-500/40 bg-slate-950 px-3 py-2">
                <div className="flex flex-wrap items-center gap-1">
                  {WEBSITE_TUTORIAL_STEPS.map((st, idx) => {
                    const active = tutorialStepIdx === idx;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleSelectTutorialStep(idx, true)}
                        className={cn(
                          "rounded px-2 py-1 font-mono text-[11px] transition-colors",
                          active
                            ? "bg-sky-500 font-semibold text-slate-950"
                            : "border border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600 hover:text-slate-100"
                        )}
                      >
                        {st.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Main Transmission Readout Box */}
            <div className="flex-1 rounded-md border border-slate-800 bg-slate-950 p-4">
              {/* Top Telemetry Meta Line */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] font-semibold text-sky-400">
                    {transmission.code}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="font-mono text-[11px] text-slate-400">
                    CHANNEL: {METRIC_GUIDES[selectedMetric].title.toUpperCase()}
                  </span>
                </div>

                {/* Subtle Voice Modulation Bars */}
                <div className="flex items-center gap-1" aria-hidden>
                  <Volume2 size={13} className="mr-1 text-slate-400" />
                  {[1, 2, 3, 4, 5, 6].map((bar) => (
                    <span
                      key={bar}
                      style={{
                        height: isTalking
                          ? `${((bar * 5) % 12) + 4}px`
                          : "4px",
                      }}
                      className={cn(
                        "w-0.5 rounded-full transition-all duration-150",
                        isTalking ? "bg-sky-400" : "bg-slate-700"
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Headline */}
              <h3 className="mt-2.5 flex items-center gap-2 text-base font-semibold text-slate-50">
                {transmission.visualStatus !== "GREEN" ? (
                  <AlertTriangle
                    size={17}
                    className={cn(
                      "shrink-0",
                      transmission.visualStatus === "RED"
                        ? "text-rose-400"
                        : "text-amber-400"
                    )}
                  />
                ) : (
                  <Compass size={17} className="shrink-0 text-sky-400" />
                )}
                <span>{transmission.headline}</span>
              </h3>

              {/* Section Identification Callout (Shown in Tutorial Mode & Story Mode) */}
              {transmission.sectionIdentify && (
                <div className="mt-2 rounded border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-slate-300">
                  <span className="font-mono font-semibold text-sky-400">
                    SECTION IDENTIFIER:{" "}
                  </span>
                  {transmission.sectionIdentify}
                </div>
              )}

              {/* Narrative Stream */}
              <p className="mt-2.5 min-h-[54px] text-sm leading-relaxed text-slate-200">
                &ldquo;{typedText}&rdquo;
                {isTalking && (
                  <span className="ml-1 inline-block h-3.5 w-1.5 animate-pulse bg-sky-400 align-middle" />
                )}
              </p>

              {/* Dual Tactical Callout Boxes: 1) VEX INSTRUCTION  2) VEX WARNING */}
              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div className="rounded-md border border-slate-800 bg-slate-900 p-3">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase text-sky-400">
                    <Compass size={13} />
                    <span>Vex Instruction</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-200">
                    {transmission.instruction}
                  </p>
                </div>

                <div
                  className={cn(
                    "rounded-md border bg-slate-900 p-3",
                    transmission.visualStatus === "RED"
                      ? "border-rose-500/60"
                      : transmission.visualStatus === "YELLOW"
                      ? "border-amber-500/50"
                      : "border-slate-800"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase",
                      transmission.visualStatus === "RED"
                        ? "text-rose-400"
                        : "text-amber-400"
                    )}
                  >
                    <ShieldAlert size={13} />
                    <span>Vex Warning</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-200">
                    {transmission.warning}
                  </p>
                </div>
              </div>

              {/* Scenario Drill Buttons when in Drill Instructor Mode */}
              {vexMode === "drill_instructor" && (
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-800 pt-3 sm:grid-cols-5">
                  {(
                    [
                      { id: "nominal", label: "Restore Nominal" },
                      { id: "eva_hypoxia", label: "EVA Hypoxia (SpO₂↓)" },
                      { id: "co2_pocket", label: "0g CO₂ Bubble" },
                      { id: "fluid_shift_bp", label: "0g BP Shift" },
                    ] as { id: DemoScenario; label: string }[]
                  ).map((drill) => (
                    <button
                      key={drill.id}
                      type="button"
                      onClick={() => {
                        triggerDemoScenario(drill.id);
                        if (drill.id !== "nominal") setVexMode("live_guardian");
                      }}
                      className={cn(button, "px-2 py-1.5 text-xs")}
                    >
                      {drill.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      toggleSatelliteBlackout();
                      setVexMode("live_guardian");
                    }}
                    className={cn(button, "px-2 py-1.5 text-xs")}
                  >
                    {isSatelliteBlackout ? "Restore AOS Link" : "LOS Blackout"}
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Action & Navigation Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {vexMode === "story_campaign" && storyChapterIdx > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      applyStoryChapterContext(storyChapterIdx - 1, false)
                    }
                    className={button}
                  >
                    <ChevronLeft size={14} />
                    <span>Prev Act</span>
                  </button>
                )}

                {vexMode === "section_tutorial" && tutorialStepIdx > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      handleSelectTutorialStep(tutorialStepIdx - 1, true)
                    }
                    className={button}
                  >
                    <ChevronLeft size={14} />
                    <span>Prev Section</span>
                  </button>
                )}

                {transmission.primaryCta && (
                  <button
                    type="button"
                    onClick={transmission.onPrimaryCta}
                    className={primaryButton}
                  >
                    <Zap size={14} />
                    <span>{transmission.primaryCta}</span>
                    <ArrowRight size={14} />
                  </button>
                )}

                {transmission.secondaryCta && (
                  <button
                    type="button"
                    onClick={transmission.onSecondaryCta}
                    className={button}
                  >
                    <MapPin size={14} className="text-sky-400" />
                    <span>{transmission.secondaryCta}</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerDemoScenario("co2_pocket");
                  setVexMode("live_guardian");
                }}
                className={cn(button, "text-amber-300 hover:border-amber-500/60")}
                title="Simulate a 0g CO2 pocket so Commander Vex demonstrates his live warning protocol"
              >
                <AlertTriangle size={13} className="text-amber-400" />
                <span>Simulate Warning</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* FULL STORY & WEBSITE SECTION INDEX MODAL                              */}
      {/* ===================================================================== */}
      {storyModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Commander Vex Story and Website Section Guide"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        >
          <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-md border border-slate-700 bg-slate-900 p-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <VexAvatar size="sm" status={overallStatus} modeAccent="sky" />
                <div>
                  <span className="font-mono text-[11px] font-semibold text-sky-400">
                    XENO-MEDICAL MISSION ARCHIVE &amp; SECTION DIRECTORY
                  </span>
                  <h3 className="text-base font-semibold text-slate-50">
                    Commander Vex&apos;s 5-Act Story Campaign &amp; 7-Section Website Guide
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStoryModalOpen(false)}
                className={button}
              >
                <X size={14} />
                Close
              </button>
            </div>

            {/* Part 1: 7 Website Sections */}
            <div className="mt-4">
              <h4 className="font-mono text-xs font-semibold uppercase text-sky-400">
                1. Interactive Website Section Tutorial (All 7 Console Sections)
              </h4>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {WEBSITE_TUTORIAL_STEPS.map((st, idx) => (
                  <div
                    key={st.id}
                    className="flex flex-col justify-between rounded-md border border-slate-800 bg-slate-950 p-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-100">
                          {st.shortLabel}: {st.title}
                        </span>
                      </div>
                      <p className="mt-1 text-slate-400">
                        {st.sectionIdentification}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setStoryModalOpen(false);
                        startSectionTutorial(idx);
                        setTimeout(() => scrollToWebsiteSection(st.domId), 80);
                      }}
                      className={cn(button, "mt-2.5 self-start px-2.5 py-1 text-xs")}
                    >
                      <MapPin size={12} className="text-sky-400" />
                      <span>Tour &amp; Highlight Section</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Part 2: 5 Story Chapters */}
            <div className="mt-5 border-t border-slate-800 pt-4">
              <h4 className="font-mono text-xs font-semibold uppercase text-sky-400">
                2. Commander Vex 5-Act Mission Story Campaign
              </h4>
              <div className="mt-2 space-y-2 text-xs">
                {VEX_STORY_CHAPTERS.map((ch, idx) => (
                  <div
                    key={ch.chapter}
                    className="rounded-md border border-slate-800 bg-slate-950 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-slate-100">
                        {ch.actTitle} — {ch.subtitle}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setVexMode("story_campaign");
                          applyStoryChapterContext(idx, false);
                          setStoryModalOpen(false);
                        }}
                        className={cn(button, "px-2.5 py-1 text-xs")}
                      >
                        <Play size={11} className="text-sky-400" />
                        <span>Load Act {ch.chapter}</span>
                      </button>
                    </div>
                    <p className="mt-1.5 text-slate-300">
                      {ch.storyNarrative(vitals)}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-sky-400">
                      Instruction: {ch.vexInstruction}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PERSISTENT FLOATING VEX CO-PILOT DOCK (Everywhere on Scroll / Tour)   */}
      {/* ===================================================================== */}
      {(scrolledDown || tutorialActive || overallStatus !== "GREEN" || isSatelliteBlackout) && (
        <aside
          aria-label="Commander Vex floating co-pilot comms"
          className={cn(
            "fixed bottom-4 right-4 z-50 flex max-w-md items-center gap-3 rounded-md border bg-slate-900/95 p-3 shadow-2xl backdrop-blur-sm sm:bottom-5 sm:right-5",
            tutorialActive
              ? "border-sky-400 ring-1 ring-sky-400/30"
              : overallStatus === "RED"
              ? "border-rose-500"
              : overallStatus === "YELLOW" || isSatelliteBlackout
              ? "border-amber-500"
              : "border-slate-700"
          )}
        >
          <VexAvatar
            size="sm"
            status={transmission.visualStatus}
            modeAccent={tutorialActive ? "sky" : "status"}
            isTalking={isTalking}
            heartRateBpm={vitals.hr}
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase text-sky-400">
              <span className={cn("size-1.5 rounded-full", statusTheme.dot)} />
              <span className="truncate">
                {tutorialActive
                  ? `TUTORIAL STEP ${activeTutorialStep.step}/7 · ${activeTutorialStep.shortLabel}`
                  : transmission.code}
              </span>
            </div>
            <div className="truncate text-xs font-semibold text-slate-100">
              {tutorialActive
                ? activeTutorialStep.title
                : transmission.headline}
            </div>
            <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-300">
              {tutorialActive
                ? activeTutorialStep.vexInstruction
                : transmission.instruction}
            </p>
          </div>

          {tutorialActive ? (
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  handleSelectTutorialStep(tutorialStepIdx - 1, true)
                }
                className={cn(button, "px-2 py-1 text-xs")}
                aria-label="Previous tutorial section"
              >
                <ChevronLeft size={13} />
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSelectTutorialStep(tutorialStepIdx + 1, true)
                }
                className={cn(primaryButton, "px-2.5 py-1 text-xs")}
              >
                <span>Next</span>
                <ChevronRight size={13} />
              </button>
              <button
                type="button"
                onClick={stopSectionTutorial}
                className={cn(button, "px-1.5 py-1 text-xs text-slate-400")}
                aria-label="Stop tutorial"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => startSectionTutorial(0)}
                className={cn(button, "px-2.5 py-1 text-xs")}
                title="Start interactive section-by-section tutorial"
              >
                <MapPin size={12} className="text-sky-400" />
                <span>Tour</span>
              </button>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className={cn(primaryButton, "px-2.5 py-1 text-xs")}
              >
                <span>Bridge ↑</span>
              </button>
            </div>
          )}
        </aside>
      )}
    </>
  );
}
