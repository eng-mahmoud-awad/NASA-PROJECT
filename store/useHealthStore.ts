// store/useHealthStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  evaluateAllMetrics,
  computeOverallStatus,
  computeReadinessScore,
} from "@/lib/healthRules";
import { fetchEsp32Telemetry } from "@/lib/esp32Client";
import {
  NtnOrbitMode,
  NtnTelemetryFrame,
  encapsulateNtnFrame,
} from "@/lib/ntnLayer";

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================

export type MissionEnvironment = "spacecraft" | "station" | "rover" | "base";
export type HealthStatus = "GREEN" | "YELLOW" | "RED";
export type MetricKey = "hr" | "spo2" | "temp" | "co2" | "bp" | "glo";
export type DemoScenario =
  | "nominal"
  | "co2_pocket"
  | "eva_hypoxia"
  | "fluid_shift_bp";

export interface VitalsSnapshot {
  timestamp: string;
  hr: number; // Heart Rate (BPM) - ESP32 Live Sensor
  spo2: number; // Blood Oxygen (%) - ESP32 Live Sensor
  temp: number; // Body Temperature (°C) - ESP32 Live Sensor
  co2: number; // Cabin/Suit CO2 (ppm) - Crew Manual Input
  bpSys: number; // Systolic Blood Pressure (mmHg) - Crew Manual Input
  bpDia: number; // Diastolic Blood Pressure (mmHg) - Crew Manual Input
  glo: number; // Blood Glucose (mg/dL) - Crew Manual Input
}

export interface MetricEvaluation {
  status: HealthStatus;
  label: string;
  insight: string;
  actions: string[];
}

export interface HealthQuest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  completed: boolean;
}

export interface CrewBadge {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
}

interface HealthStoreState {
  // Environment & Hardware Connection
  ntnOrbitMode: NtnOrbitMode;
  isSatelliteBlackout: boolean; // لمحاكاة انقطاع القمر الصناعي (LOS) وتخزين الداتا
  ntnSequence: number;
  lastNtnFrame: NtnTelemetryFrame | null;
  dtnBufferQueue: NtnTelemetryFrame[]; // طابور DTN Store-and-Forward

  setNtnOrbitMode: (mode: NtnOrbitMode) => void;
  toggleSatelliteBlackout: () => void;
  environment: MissionEnvironment;
  esp32Ip: string;
  isEsp32Connected: boolean;
  lastSyncTime: string | null;

  // Current Vitals & Risk Evaluations
  vitals: VitalsSnapshot;
  evaluations: Record<MetricKey, MetricEvaluation>;
  overallStatus: HealthStatus;
  history: VitalsSnapshot[];

  // Gamification & Crew Readiness
  xp: number;
  level: number;
  streakDays: number;
  readinessScore: number;
  quests: HealthQuest[];
  badges: CrewBadge[];

  // Actions
  setEnvironment: (env: MissionEnvironment) => void;
  setEsp32Ip: (ip: string) => void;
  updateEsp32Telemetry: (data: {
    hr: number;
    spo2: number;
    temp: number;
  }) => void;
  pollEsp32: () => Promise<void>;
  logCrewManualVitals: (
    bpSys: number,
    bpDia: number,
    glo: number,
    co2: number
  ) => void;
  triggerDemoScenario: (scenario: DemoScenario) => void;
  completeQuest: (questId: string) => void;
  resetMissionData: () => void;
}

// ==========================================
// 2. INITIAL DEFAULT DATA
// ==========================================

const INITIAL_VITALS: VitalsSnapshot = {
  timestamp: "12:00:00",
  hr: 74,
  spo2: 98.2,
  temp: 36.8,
  co2: 720,
  bpSys: 116,
  bpDia: 74,
  glo: 88,
};

const INITIAL_QUESTS: HealthQuest[] = [
  {
    id: "q_morning_bp",
    title: "Log Morning Blood Pressure & Glucose",
    description:
      "Take cuff & glucometer measurements at heart level and submit in the Crew Input panel.",
    xpReward: 50,
    completed: false,
  },
  {
    id: "q_co2_check",
    title: "Verify Habitat CO2 Scrubber & Airflow",
    description:
      "Confirm ambient CO2 is under 1,000 ppm to prevent microgravity headaches.",
    xpReward: 40,
    completed: false,
  },
  {
    id: "q_ared_exercise",
    title: "Complete 45-Min Resistance Countermeasure",
    description:
      "Mitigate bone mineral density loss and cardiovascular deconditioning.",
    xpReward: 75,
    completed: false,
  },
  {
    id: "q_hydration",
    title: "Electrolyte Hydration Protocol (500 mL)",
    description:
      "Maintain plasma volume prior to scheduled Extravehicular Activity (EVA).",
    xpReward: 35,
    completed: false,
  },
];

const INITIAL_BADGES: CrewBadge[] = [
  {
    id: "b_vitals_vanguard",
    title: "Vitals Vanguard",
    description: "Logged manual Blood Pressure & Glucose readings on schedule.",
    unlocked: false,
  },
  {
    id: "b_atmo_guardian",
    title: "Atmosphere Guardian",
    description: "Maintained safe CO2 and SpO2 levels across habitat transitions.",
    unlocked: true,
  },
  {
    id: "b_eva_cleared",
    title: "EVA Ready Level 2",
    description: "Reached 200+ Crew Health XP during the mission.",
    unlocked: false,
  },
];

// ==========================================
// 3. ZUSTAND STORE WITH LOCALSTORAGE PERSIST
// ==========================================

export const useHealthStore = create<HealthStoreState>()(
  persist(
    (set, get) => {
      const initialEvals = evaluateAllMetrics(INITIAL_VITALS, "station");

      return {
        environment: "station",
        esp32Ip: "192.168.4.1",
        isEsp32Connected: false,
        lastSyncTime: null,
        ntnOrbitMode: "LUNAR_GATEWAY",
  isSatelliteBlackout: false,
  ntnSequence: 101,
  lastNtnFrame: null,
  dtnBufferQueue: [],

  setNtnOrbitMode: (mode) => set({ ntnOrbitMode: mode }),
  toggleSatelliteBlackout: () => {
    const { isSatelliteBlackout, dtnBufferQueue, updateEsp32Telemetry } = get();
    const nextBlackoutState = !isSatelliteBlackout;

    // إذا عاد الاتصال (AOS) وكان هناك قراءات مخزنة في طابور DTN، نفرغها فوراً للواجهة!
    if (!nextBlackoutState && dtnBufferQueue.length > 0) {
      const latestBuffered = dtnBufferQueue[dtnBufferQueue.length - 1];
      updateEsp32Telemetry(latestBuffered.data);
      set({
        isSatelliteBlackout: false,
        lastNtnFrame: { ...latestBuffered, linkState: "AOS_LOCKED" },
        dtnBufferQueue: [],
      });
    } else {
      set({ isSatelliteBlackout: nextBlackoutState });
    }
  },
        vitals: INITIAL_VITALS,
        evaluations: initialEvals,
        overallStatus: computeOverallStatus(initialEvals),
        history: [INITIAL_VITALS],

        xp: 120,
        level: 1,
        streakDays: 4,
        readinessScore: computeReadinessScore(initialEvals, INITIAL_QUESTS),
        quests: INITIAL_QUESTS,
        badges: INITIAL_BADGES,

        // Switch Mission Environment (Spacecraft, Station, Rover, Base)
        setEnvironment: (env) => {
          const { vitals, quests } = get();
          const newEvals = evaluateAllMetrics(vitals, env);
          set({
            environment: env,
            evaluations: newEvals,
            overallStatus: computeOverallStatus(newEvals),
            readinessScore: computeReadinessScore(newEvals, quests),
          });
        },

        // Set custom ESP32 Local IP
        setEsp32Ip: (ip) => set({ esp32Ip: ip }),

        // Update 3 Live Sensor Metrics from ESP32 (Preserves Manual BP, GLO, CO2)
        updateEsp32Telemetry: ({ hr, spo2, temp }) => {
          const { vitals, environment, history, quests } = get();
          const now = new Date().toLocaleTimeString([], {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });

          const updatedVitals: VitalsSnapshot = {
            ...vitals,
            timestamp: now,
            hr: Number(hr.toFixed(0)),
            spo2: Number(spo2.toFixed(1)),
            temp: Number(temp.toFixed(1)),
          };

          const newEvals = evaluateAllMetrics(updatedVitals, environment);

          set({
            vitals: updatedVitals,
            evaluations: newEvals,
            overallStatus: computeOverallStatus(newEvals),
            readinessScore: computeReadinessScore(newEvals, quests),
            history: [...history.slice(-29), updatedVitals],
            lastSyncTime: now,
          });
        },

        // Poll ESP32 HTTP Endpoint (or fallback gracefully if offline)
        // استبدل دالة pollEsp32 داخل store/useHealthStore.ts بهذا الكود:
pollEsp32: async () => {
  const {
    esp32Ip,
    ntnOrbitMode,
    isSatelliteBlackout,
    ntnSequence,
    dtnBufferQueue,
    updateEsp32Telemetry,
  } = get();

  try {
    const data = await fetchEsp32Telemetry(esp32Ip);
    const nextSeq = ntnSequence + 1;

    // تغليف قراءات الـ ESP32 داخل حزمة NTN فضائية
    const frame = encapsulateNtnFrame(
      data,
      ntnOrbitMode,
      nextSeq,
      isSatelliteBlackout
    );

    // إذا كان القمر الصناعي في حالة انقطاع (LOS Blackout)، نخزن قراءة الـ ESP32 في طابور DTN
    if (isSatelliteBlackout) {
      set({
        isEsp32Connected: true,
        ntnSequence: nextSeq,
        lastNtnFrame: frame,
        dtnBufferQueue: [...dtnBufferQueue.slice(-19), frame],
      });
      return;
    }

    set({
      isEsp32Connected: true,
      ntnSequence: nextSeq,
      lastNtnFrame: frame,
    });

    updateEsp32Telemetry({
      hr: data.hr,
      spo2: data.spo2,
      temp: data.temp,
    });
  } catch {
    set({ isEsp32Connected: false });
  }
},

        // Crew Manual Input for Blood Pressure, Glucose & Cabin CO2
        logCrewManualVitals: (bpSys, bpDia, glo, co2) => {
          const { vitals, environment, history, quests, xp, badges } = get();
          const now = new Date().toLocaleTimeString([], {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });

          const updatedVitals: VitalsSnapshot = {
            ...vitals,
            timestamp: now,
            bpSys: Number(bpSys),
            bpDia: Number(bpDia),
            glo: Number(glo),
            co2: Number(co2),
          };

          const newEvals = evaluateAllMetrics(updatedVitals, environment);

          // Auto-complete Morning BP/Glucose & CO2 Check Quests if not completed
          let earnedXp = 25;
          const updatedQuests = quests.map((q) => {
            if (
              (q.id === "q_morning_bp" || q.id === "q_co2_check") &&
              !q.completed
            ) {
              earnedXp += q.xpReward;
              return { ...q, completed: true };
            }
            return q;
          });

          const newXp = xp + earnedXp;
          const newLevel = Math.floor(newXp / 150) + 1;

          const updatedBadges = badges.map((b) => {
            if (b.id === "b_vitals_vanguard") return { ...b, unlocked: true };
            if (b.id === "b_eva_cleared" && newXp >= 200) {
              return { ...b, unlocked: true };
            }
            return b;
          });

          set({
            vitals: updatedVitals,
            evaluations: newEvals,
            overallStatus: computeOverallStatus(newEvals),
            history: [...history.slice(-29), updatedVitals],
            quests: updatedQuests,
            xp: newXp,
            level: newLevel,
            badges: updatedBadges,
            readinessScore: computeReadinessScore(newEvals, updatedQuests),
          });
        },

        // Instant Demo Scenarios for Hackathon Judges
        triggerDemoScenario: (scenario) => {
          const { history, quests } = get();
          const now = new Date().toLocaleTimeString([], {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });

          let targetEnv: MissionEnvironment = "station";
          let preset: VitalsSnapshot = { ...INITIAL_VITALS, timestamp: now };

          if (scenario === "co2_pocket") {
            targetEnv = "station";
            preset = {
              timestamp: now,
              hr: 89,
              spo2: 96.4,
              temp: 37.1,
              co2: 1850, // Triggers YELLOW/RED CO2 Alert in 0g
              bpSys: 122,
              bpDia: 78,
              glo: 92,
            };
          } else if (scenario === "eva_hypoxia") {
            targetEnv = "base";
            preset = {
              timestamp: now,
              hr: 116, // RED Tachycardia
              spo2: 90.8, // RED Hypoxia
              temp: 37.7, // YELLOW Exertion Temp
              co2: 980,
              bpSys: 132,
              bpDia: 84,
              glo: 76,
            };
          } else if (scenario === "fluid_shift_bp") {
            targetEnv = "spacecraft";
            preset = {
              timestamp: now,
              hr: 82,
              spo2: 97.8,
              temp: 36.9,
              co2: 840,
              bpSys: 144, // RED Hypertensive Cephalad Shift
              bpDia: 92,
              glo: 118, // YELLOW Spaceflight Insulin Resistance
            };
          }

          const newEvals = evaluateAllMetrics(preset, targetEnv);

          set({
            environment: targetEnv,
            vitals: preset,
            evaluations: newEvals,
            overallStatus: computeOverallStatus(newEvals),
            history: [...history.slice(-29), preset],
            readinessScore: computeReadinessScore(newEvals, quests),
          });
        },

        // Complete a Gamification Quest
        completeQuest: (questId) => {
          const { quests, xp, evaluations, badges } = get();
          const target = quests.find((q) => q.id === questId);
          if (!target || target.completed) return;

          const updatedQuests = quests.map((q) =>
            q.id === questId ? { ...q, completed: true } : q
          );
          const newXp = xp + target.xpReward;
          const newLevel = Math.floor(newXp / 150) + 1;

          const updatedBadges = badges.map((b) =>
            b.id === "b_eva_cleared" && newXp >= 200
              ? { ...b, unlocked: true }
              : b
          );

          set({
            quests: updatedQuests,
            xp: newXp,
            level: newLevel,
            badges: updatedBadges,
            readinessScore: computeReadinessScore(evaluations, updatedQuests),
          });
        },

        // Reset Store to Default State
        resetMissionData: () => {
          const defaultEvals = evaluateAllMetrics(INITIAL_VITALS, "station");
          set({
            environment: "station",
            vitals: INITIAL_VITALS,
            evaluations: defaultEvals,
            overallStatus: "GREEN",
            history: [INITIAL_VITALS],
            xp: 120,
            level: 1,
            streakDays: 4,
            quests: INITIAL_QUESTS,
            badges: INITIAL_BADGES,
            readinessScore: computeReadinessScore(defaultEvals, INITIAL_QUESTS),
          });
        },
      };
    },
    {
      name: "astro-vitals-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);