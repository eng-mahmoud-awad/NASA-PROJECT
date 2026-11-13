// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { HealthStatus } from "@/store/useHealthStore";

/** Merge Tailwind CSS classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Unified color-coding palette for Green / Yellow / Red health statuses */
export function getStatusTheme(status: HealthStatus) {
  switch (status) {
    case "GREEN":
      return {
        badgeBg: "bg-emerald-500/15",
        badgeText: "text-emerald-400",
        badgeBorder: "border-emerald-500/40",
        cardBorder: "border-emerald-500/30 hover:border-emerald-500/60",
        glow: "shadow-[0_0_20px_rgba(16,185,129,0.12)]",
        dot: "bg-emerald-400",
        hex: "#10b981",
        label: "NOMINAL",
      };
    case "YELLOW":
      return {
        badgeBg: "bg-amber-500/15",
        badgeText: "text-amber-300",
        badgeBorder: "border-amber-500/50",
        cardBorder: "border-amber-500/50 hover:border-amber-400",
        glow: "shadow-[0_0_25px_rgba(245,158,11,0.18)]",
        dot: "bg-amber-400 animate-pulse",
        hex: "#f59e0b",
        label: "CAUTION",
      };
    case "RED":
      return {
        badgeBg: "bg-rose-500/20",
        badgeText: "text-rose-400",
        badgeBorder: "border-rose-500/60",
        cardBorder: "border-rose-500/70 hover:border-rose-400",
        glow: "shadow-[0_0_30px_rgba(244,63,94,0.28)]",
        dot: "bg-rose-500 animate-ping",
        hex: "#f43f5e",
        label: "CRITICAL",
      };
  }
}

/** Formats seconds into NASA Mission Elapsed Time: MET 04:12:38:09 */
export function formatMissionElapsedTime(totalSeconds: number): string {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, "0");
  return `MET ${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}