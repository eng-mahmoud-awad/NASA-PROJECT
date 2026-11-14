"use client";

import React from "react";
import { HealthStatus } from "@/store/useHealthStore";
import { cn } from "@/lib/utils";

interface VexAvatarProps {
  status?: HealthStatus;
  modeAccent?: "sky" | "status";
  size?: "xs" | "sm" | "md" | "lg";
  isTalking?: boolean;
  heartRateBpm?: number;
  className?: string;
}

/**
 * Commander Zyx-9 ("Vex") — Avionics-styled Xeno-Medical Flight Surgeon SVG.
 * Designed to match the AstroVitals operations console palette:
 * - Slate neutrals (#0a0d12, #0f172a, #1e293b, #334155, #94a3b8)
 * - Sky accent (#38bdf8 / #0ea5e9) for selection, HUD reticles, and tutorial mode
 * - Status colors (#10b981 emerald, #f59e0b amber, #f43f5e rose) strictly for live telemetry state
 */
export default function VexAvatar({
  status = "GREEN",
  modeAccent = "status",
  size = "lg",
  isTalking = false,
  heartRateBpm = 72,
  className,
}: VexAvatarProps) {
  const statusHex =
    status === "RED"
      ? "#f43f5e"
      : status === "YELLOW"
      ? "#f59e0b"
      : modeAccent === "sky"
      ? "#38bdf8"
      : "#10b981";

  const secondaryHex =
    status === "RED"
      ? "#fb7185"
      : status === "YELLOW"
      ? "#fbbf24"
      : "#38bdf8";

  const isAlert = status === "YELLOW" || status === "RED";
  const beatSec = Math.max(0.45, Math.min(1.2, 60 / (heartRateBpm || 72)));

  // Compact head/antennae icon for header, inline badges, and section banners
  if (size === "xs" || size === "sm") {
    const dim = size === "xs" ? "h-7 w-7" : "h-10 w-10";
    return (
      <div
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center rounded-md border border-slate-700 bg-slate-950",
          dim,
          className
        )}
        aria-hidden
      >
        <svg viewBox="0 0 80 80" className="h-full w-full p-0.5" fill="none">
          {/* Twin Telemetry Antennae */}
          <path
            d="M27 22 L20 10 M53 22 L60 10"
            stroke="#64748b"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="19" cy="9" r="4" fill={statusHex} />
          <circle cx="61" cy="9" r="4" fill={statusHex} />

          {/* Side Bio-Acoustic Fins */}
          <path
            d="M16 40 L7 36 M16 46 L8 45 M64 40 L73 36 M64 46 L72 45"
            stroke={secondaryHex}
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Tactical Suit Collar */}
          <path
            d="M20 62 C20 56, 60 56, 60 62 L64 74 L16 74 Z"
            fill="#0f172a"
            stroke="#334155"
            strokeWidth="2"
          />
          <line x1="34" y1="67" x2="46" y2="67" stroke={statusHex} strokeWidth="2.5" strokeLinecap="round" />

          {/* Alien Cranium (Avionics Slate + Sky CAD Contour) */}
          <ellipse
            cx="40"
            cy="41"
            rx="23"
            ry="19"
            fill="#1e293b"
            stroke={secondaryHex}
            strokeWidth="2"
          />

          {/* 3 Tactical Bio-Optic Eyes */}
          <ellipse cx="30" cy="42" rx="5" ry="6.2" fill="#020617" stroke={secondaryHex} strokeWidth="1.5" />
          <circle cx="31.2" cy="40.2" r="1.7" fill="#e2e8f0" />

          <ellipse cx="40" cy="33" rx="4.2" ry="4.8" fill="#020617" stroke={statusHex} strokeWidth="1.5" />
          <circle cx="41" cy="31.8" r="1.4" fill={statusHex} />

          <ellipse cx="50" cy="42" rx="5" ry="6.2" fill="#020617" stroke={secondaryHex} strokeWidth="1.5" />
          <circle cx="51.2" cy="40.2" r="1.7" fill="#e2e8f0" />

          {/* Alert Eyebrows */}
          {isAlert && (
            <>
              <line x1="24" y1="33" x2="34" y2="36" stroke={statusHex} strokeWidth="2" strokeLinecap="round" />
              <line x1="56" y1="33" x2="46" y2="36" stroke={statusHex} strokeWidth="2" strokeLinecap="round" />
            </>
          )}

          {/* Mouth / Voice Line */}
          {isTalking ? (
            <rect x="35" y="51" width="10" height="3.5" rx="1.75" fill={statusHex} />
          ) : (
            <path
              d={status === "RED" ? "M35 54 Q40 50 45 54" : "M34 51 Q40 55 46 51"}
              stroke={secondaryHex}
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}
        </svg>
      </div>
    );
  }

  // Full / Medium Interactive Avionics Character Stage
  const svgSizeClass = size === "md" ? "h-40 w-44" : "h-56 w-60";

  return (
    <div className={cn("relative inline-flex items-center justify-center select-none", className)}>
      <style>{`
        @keyframes vexHover {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes vexEyeBlink {
          0%, 94%, 100% { transform: scaleY(1); }
          97% { transform: scaleY(0.1); }
        }
        @keyframes vexArmSignal {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(8deg); }
        }
        @keyframes vexProbeSweep {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        @keyframes vexVoicePulse {
          0%, 100% { transform: scaleY(0.45); }
          50% { transform: scaleY(1.15); }
        }
        .vex-hover { animation: vexHover 4s ease-in-out infinite; }
        .vex-blink { animation: vexEyeBlink 4.5s infinite; transform-origin: 130px 74px; }
        .vex-arm-right { animation: vexArmSignal 2.2s ease-in-out infinite; transform-origin: 174px 128px; }
        .vex-arm-left { animation: vexProbeSweep 2.6s ease-in-out infinite; transform-origin: 86px 128px; }
        .vex-mouth-talk { animation: vexVoicePulse 0.22s ease-in-out infinite; transform-origin: 130px 102px; }
      `}</style>

      <svg
        viewBox="0 0 260 220"
        className={cn(svgSizeClass, "vex-hover overflow-visible")}
        fill="none"
        role="img"
        aria-label="Commander Vex, Xeno-Medical Flight Surgeon and Mission Guide"
      >
        {/* Avionics CAD Reticle Ring Behind Character */}
        <circle
          cx="130"
          cy="86"
          r="66"
          stroke="#1e293b"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <circle
          cx="130"
          cy="86"
          r="56"
          stroke={secondaryHex}
          strokeOpacity="0.2"
          strokeWidth="1"
        />

        {/* Telemetry Base Emitter Platform */}
        <ellipse
          cx="130"
          cy="204"
          rx="78"
          ry="10"
          fill="#0a0d12"
          stroke="#334155"
          strokeWidth="1.5"
        />
        <ellipse
          cx="130"
          cy="204"
          rx="52"
          ry="5"
          fill={statusHex}
          fillOpacity="0.16"
          stroke={statusHex}
          strokeWidth="1"
          strokeDasharray="5 3"
        />

        {/* Left Arm Holding CAD Bio-Telemetry Probe */}
        <g className="vex-arm-left">
          <path
            d="M84 132 C60 122, 48 102, 50 78"
            stroke="#334155"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M84 132 C60 122, 48 102, 50 78"
            stroke={secondaryHex}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="3 3"
          />
          <circle cx="50" cy="76" r="5.5" fill="#1e293b" stroke={secondaryHex} strokeWidth="1.5" />
          {/* Telemetry Caduceus Probe */}
          <line x1="50" y1="90" x2="50" y2="44" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
          <rect
            x="41"
            y="31"
            width="18"
            height="14"
            rx="3"
            fill="#0a0d12"
            stroke={statusHex}
            strokeWidth="2"
          />
          <circle cx="50" cy="38" r="3.5" fill={statusHex} />
          {/* Tactical Scan Sector */}
          <polygon
            points="50,31 32,12 68,12"
            fill={statusHex}
            fillOpacity="0.14"
          />
        </g>

        {/* Right Arm Signaling Crew */}
        <g className="vex-arm-right">
          <path
            d="M176 132 C200 118, 210 94, 204 70"
            stroke="#334155"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <circle cx="204" cy="68" r="6" fill="#1e293b" stroke={secondaryHex} strokeWidth="1.5" />
          {/* 3-Fingered Tactical Glove */}
          <path
            d="M200 63 L195 53 M204 62 L205 50 M209 64 L216 55"
            stroke={secondaryHex}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>

        {/* NASA-Style Avionics Flight Surgeon Exosuit Torso */}
        <path
          d="M82 120 C82 110, 178 110, 178 120 L186 190 C186 196, 74 196, 74 190 Z"
          fill="#0f172a"
          stroke="#334155"
          strokeWidth="2"
        />
        {/* Suit Technical Seams & Shoulder Yoke */}
        <path
          d="M84 122 L130 134 L176 122"
          stroke="#38bdf8"
          strokeOpacity="0.5"
          strokeWidth="1.5"
        />
        <line x1="104" y1="130" x2="100" y2="190" stroke="#1e293b" strokeWidth="2" />
        <line x1="156" y1="130" x2="160" y2="190" stroke="#1e293b" strokeWidth="2" />

        {/* Chest Xeno-Medical Telemetry Core */}
        <rect
          x="112"
          y="138"
          width="36"
          height="26"
          rx="5"
          fill="#0a0d12"
          stroke={statusHex}
          strokeWidth="1.5"
        />
        {/* Medical Cross / Live ECG Line inside Chest Core */}
        <polyline
          points="116,151 123,151 126,144 130,158 134,147 137,151 144,151"
          fill="none"
          stroke={statusHex}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Lower Arms Resting on Console */}
        <path
          d="M90 152 C74 162, 76 178, 96 180"
          stroke="#334155"
          strokeWidth="6.5"
          strokeLinecap="round"
        />
        <path
          d="M170 152 C186 162, 184 178, 164 180"
          stroke="#334155"
          strokeWidth="6.5"
          strokeLinecap="round"
        />

        {/* Bio-Acoustic Lateral Cranial Fins (Sleek Avionics Geometry) */}
        <path
          d="M80 72 L58 64 L64 76 Z"
          fill="#0f172a"
          stroke={secondaryHex}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M78 84 L60 82 L66 90 Z"
          fill="#0f172a"
          stroke={statusHex}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M180 72 L202 64 L196 76 Z"
          fill="#0f172a"
          stroke={secondaryHex}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M182 84 L200 82 L194 90 Z"
          fill="#0f172a"
          stroke={statusHex}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Twin Quantum Telemetry Antennae (Pulse at Crew Heart Rate) */}
        <path
          d="M106 40 C98 22, 86 16, 80 12"
          stroke="#475569"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx="78" cy="11" r="6" fill="#0a0d12" stroke={statusHex} strokeWidth="2" />
        <circle
          cx="78"
          cy="11"
          r="3"
          fill={statusHex}
          style={{ animation: `ping ${beatSec}s cubic-bezier(0, 0, 0.2, 1) infinite` }}
        />

        <path
          d="M154 40 C162 22, 174 16, 180 12"
          stroke="#475569"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx="182" cy="11" r="6" fill="#0a0d12" stroke={statusHex} strokeWidth="2" />
        <circle
          cx="182"
          cy="11"
          r="3"
          fill={statusHex}
          style={{ animation: `ping ${beatSec}s cubic-bezier(0, 0, 0.2, 1) infinite` }}
        />

        {/* Alien Cranium / Head — Sleek Slate Armored Bio-Shell */}
        <ellipse
          cx="130"
          cy="76"
          rx="50"
          ry="38"
          fill="#1e293b"
          stroke="#475569"
          strokeWidth="2"
        />
        {/* Inner Cranial Neural Circuitry Lines */}
        <path
          d="M92 60 C106 46, 154 46, 168 60"
          stroke={secondaryHex}
          strokeOpacity="0.35"
          strokeWidth="1.2"
          fill="none"
        />
        <polygon points="130,42 135,48 130,54 125,48" fill={statusHex} />

        {/* 3 Expressive Tactical Bio-Optic Eyes */}
        <g className="vex-blink">
          {/* Left Ocular Lens */}
          <ellipse
            cx="104"
            cy="77"
            rx="11"
            ry="13"
            fill="#020617"
            stroke={secondaryHex}
            strokeWidth="2"
          />
          <circle cx="104" cy="77" r="6" stroke={secondaryHex} strokeOpacity="0.35" strokeWidth="1" />
          <circle cx="107" cy="73" r="3.2" fill="#e2e8f0" />
          <circle cx="101" cy="81" r="1.6" fill={secondaryHex} />

          {/* Center Third All-Seeing Telemetry Eye */}
          <ellipse
            cx="130"
            cy="62"
            rx="9"
            ry="10"
            fill="#020617"
            stroke={statusHex}
            strokeWidth="2"
          />
          <circle cx="132" cy="59" r="2.8" fill="#e2e8f0" />
          <circle cx="128" cy="65" r="1.6" fill={statusHex} />

          {/* Right Ocular Lens */}
          <ellipse
            cx="156"
            cy="77"
            rx="11"
            ry="13"
            fill="#020617"
            stroke={secondaryHex}
            strokeWidth="2"
          />
          <circle cx="156" cy="77" r="6" stroke={secondaryHex} strokeOpacity="0.35" strokeWidth="1" />
          <circle cx="159" cy="73" r="3.2" fill="#e2e8f0" />
          <circle cx="153" cy="81" r="1.6" fill={secondaryHex} />
        </g>

        {/* Tactical Brow Vectors in Caution / Critical Mode */}
        {isAlert && (
          <g>
            <line
              x1="91"
              y1="60"
              x2="115"
              y2="65"
              stroke={statusHex}
              strokeWidth="3"
              strokeLinecap="round"
            />
            <line
              x1="169"
              y1="60"
              x2="145"
              y2="65"
              stroke={statusHex}
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* Mouth / Vocal Synthesizer */}
        {isTalking ? (
          <g className="vex-mouth-talk">
            <rect
              x="118"
              y="97"
              width="24"
              height="8"
              rx="4"
              fill="#020617"
              stroke={secondaryHex}
              strokeWidth="1.5"
            />
            <line x1="123" y1="101" x2="137" y2="101" stroke={statusHex} strokeWidth="2" strokeLinecap="round" />
          </g>
        ) : status === "RED" ? (
          <path
            d="M119 104 Q130 96 141 104"
            stroke={statusHex}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M117 98 Q130 106 143 98"
            stroke={secondaryHex}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}

        {/* Front Avionics Holo-Bar Console */}
        <rect
          x="74"
          y="174"
          width="112"
          height="20"
          rx="4"
          fill="#0a0d12"
          stroke="#334155"
          strokeWidth="1.5"
        />
        <line x1="84" y1="184" x2="108" y2="184" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="116" y1="184" x2="144" y2="184" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="152" y1="184" x2="176" y2="184" stroke={statusHex} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}
