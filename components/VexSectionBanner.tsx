"use client";

import React from "react";
import {
  Compass,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  HelpCircle,
} from "lucide-react";
import {
  HealthStatus,
  WebsiteSectionId,
  useHealthStore,
} from "@/store/useHealthStore";
import { WEBSITE_TUTORIAL_STEPS } from "@/lib/vexData";
import { cn, getStatusTheme } from "@/lib/utils";
import VexAvatar from "@/components/VexAvatar";
import { button, primaryButton } from "@/components/ui";

interface VexSectionBannerProps {
  sectionId: WebsiteSectionId;
  sectionBadge: string;
  status?: HealthStatus;
  storyNote?: string;
  instruction: string;
  warning: string;
  compact?: boolean;
  className?: string;
}

export function scrollToWebsiteSection(domId: string) {
  if (typeof window === "undefined") return;
  const el = document.getElementById(domId);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

export default function VexSectionBanner({
  sectionId,
  sectionBadge,
  status = "GREEN",
  storyNote,
  instruction,
  warning,
  compact = false,
  className,
}: VexSectionBannerProps) {
  const {
    tutorialActive,
    tutorialStepIdx,
    startSectionTutorial,
    setTutorialStepIdx,
    stopSectionTutorial,
    vitals,
  } = useHealthStore();
  const onSelectMetricFromTutorial = vitals.hr;

  const stepIndexForSection = WEBSITE_TUTORIAL_STEPS.findIndex(
    (st) => st.id === sectionId
  );
  const currentStepSpec =
    WEBSITE_TUTORIAL_STEPS[tutorialStepIdx] ?? WEBSITE_TUTORIAL_STEPS[0];
  const isTutorialFocused =
    tutorialActive && currentStepSpec.id === sectionId;

  const theme = getStatusTheme(status);
  const isAlert = status !== "GREEN";

  const handleStepChange = (nextIdx: number) => {
    const bounded =
      (nextIdx + WEBSITE_TUTORIAL_STEPS.length) % WEBSITE_TUTORIAL_STEPS.length;
    setTutorialStepIdx(bounded);
    const targetDom = WEBSITE_TUTORIAL_STEPS[bounded].domId;
    setTimeout(() => scrollToWebsiteSection(targetDom), 60);
  };

  const handleFocusThisSection = () => {
    const idx = stepIndexForSection >= 0 ? stepIndexForSection : 0;
    startSectionTutorial(idx);
    setTimeout(
      () => scrollToWebsiteSection(WEBSITE_TUTORIAL_STEPS[idx].domId),
      60
    );
  };

  // Expanded Tutorial Spotlight Card when this section is actively being toured
  if (isTutorialFocused) {
    return (
      <div
        role="region"
        aria-label={`Commander Vex tutorial for ${currentStepSpec.title}`}
        className={cn(
          "rounded-md border border-sky-400 bg-slate-900 p-3.5 ring-1 ring-sky-400/40 transition-all",
          className
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2.5">
            <VexAvatar
              size="sm"
              status={status}
              modeAccent="sky"
              isTalking
              heartRateBpm={onSelectMetricFromTutorial}
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-sky-500/20 px-2 py-0.5 font-mono text-[11px] font-semibold text-sky-300">
                  VEX SECTION TUTORIAL · STEP {currentStepSpec.step} OF{" "}
                  {WEBSITE_TUTORIAL_STEPS.length}
                </span>
                <span className="font-mono text-xs text-slate-400">
                  {currentStepSpec.code}
                </span>
              </div>
              <h3 className="mt-0.5 text-sm font-semibold text-slate-50">
                {currentStepSpec.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleStepChange(tutorialStepIdx - 1)}
              className={cn(button, "px-2.5 py-1 text-xs")}
            >
              <ChevronLeft size={13} />
              Prev
            </button>
            <button
              type="button"
              onClick={() => handleStepChange(tutorialStepIdx + 1)}
              className={cn(primaryButton, "px-2.5 py-1 text-xs")}
            >
              Next section
              <ChevronRight size={13} />
            </button>
            <button
              type="button"
              onClick={stopSectionTutorial}
              className={cn(button, "px-2 py-1 text-xs text-slate-400")}
              aria-label="Exit section tutorial"
              title="Exit section tutorial"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        <div className="mt-2.5 space-y-2 text-xs leading-relaxed">
          <p className="text-slate-200">
            <span className="font-mono font-semibold text-sky-400">
              IDENTIFY THIS SECTION:{" "}
            </span>
            {currentStepSpec.sectionIdentification}
          </p>
          <p className="text-slate-300">
            <span className="font-mono font-semibold text-slate-200">
              VEX STORY LOG:{" "}
            </span>
            &ldquo;{currentStepSpec.vexStory}&rdquo;
          </p>

          <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
            <div className="rounded-md border border-slate-800 bg-slate-950 p-2.5">
              <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-sky-400">
                <Compass size={12} />
                <span>VEX INSTRUCTION</span>
              </div>
              <p className="mt-1 text-slate-200">
                {currentStepSpec.vexInstruction}
              </p>
            </div>

            <div
              className={cn(
                "rounded-md border bg-slate-950 p-2.5",
                status === "RED"
                  ? "border-rose-500/60"
                  : status === "YELLOW"
                  ? "border-amber-500/50"
                  : "border-slate-800"
              )}
            >
              <div
                className={cn(
                  "flex items-center gap-1.5 font-mono text-[11px] font-semibold",
                  status === "RED" ? "text-rose-400" : "text-amber-400"
                )}
              >
                <AlertTriangle size={12} />
                <span>VEX WARNING</span>
              </div>
              <p className="mt-1 text-slate-200">
                {currentStepSpec.vexWarning}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard Persistent Vex Field Bar embedded inside every section
  return (
    <div
      className={cn(
        "rounded-md border bg-slate-950/90 px-3 py-2 text-xs transition-colors",
        status === "RED"
          ? "border-rose-500/60"
          : status === "YELLOW"
          ? "border-amber-500/50"
          : "border-slate-800",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          <VexAvatar
            size="xs"
            status={status}
            heartRateBpm={onSelectMetricFromTutorial}
            className="mt-0.5"
          />

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] font-semibold text-slate-200">
                VEX · {sectionBadge}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-mono text-[10px] font-medium",
                  theme.badgeText
                )}
              >
                <span className={cn("size-1.5 rounded-full", theme.dot)} />
                {theme.label}
              </span>
              {storyNote && !compact && (
                <span className="truncate text-slate-400">— {storyNote}</span>
              )}
            </div>

            <div
              className={cn(
                "grid gap-1.5",
                compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
              )}
            >
              <p className="leading-snug text-slate-300">
                <span className="font-mono text-[11px] font-semibold text-sky-400">
                  Instruction:{" "}
                </span>
                {instruction}
              </p>
              <p
                className={cn(
                  "leading-snug",
                  isAlert ? theme.badgeText : "text-slate-400"
                )}
              >
                <span
                  className={cn(
                    "font-mono text-[11px] font-semibold",
                    status === "RED"
                      ? "text-rose-400"
                      : status === "YELLOW"
                      ? "text-amber-400"
                      : "text-amber-400/90"
                  )}
                >
                  Warning:{" "}
                </span>
                {warning}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleFocusThisSection}
          className="inline-flex shrink-0 items-center gap-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-[11px] text-slate-300 transition-colors hover:border-sky-400 hover:text-sky-300"
          title="Open Commander Vex's interactive tutorial for this section"
        >
          <HelpCircle size={11} className="text-sky-400" />
          <span>Identify section</span>
        </button>
      </div>
    </div>
  );
}
