// store/useHealthStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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
  hr: number; // Heart Rate (BPM) - ESP32
  spo2: number; // Blood Oxygen (%) - ESP32
  temp: number; // Body Temperature (°C) - ESP32
  co2: number; // Cabin/Suit CO2 (ppm) - ESP32
  bpSys: number; // Systolic Blood Pressure (mmHg) - Crew Input
  bpDia: number; // Diastolic Blood Pressure (mmHg) - Crew Input
  glo: number; // Blood Glucose (mg/dL) - Crew Input
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
    co2: number;
  }) => void;
  pollEsp32: () => Promise<void>;
  logCrewManualVitals: (bpSys: number, bpDia: number, glo: number) => void;
  triggerDemoScenario: (scenario: DemoScenario) => void;
  completeQuest: (questId: string) => void;
  resetMissionData: () => void;
}

// ==========================================
// 2. ENVIRONMENT-ADAPTIVE RISK ENGINE
// ==========================================

export function evaluateAllMetrics(
  v: VitalsSnapshot,
  env: MissionEnvironment
): Record<MetricKey, MetricEvaluation> {
  // 1. Heart Rate (HR)
  const hrUpperCaution = env === "rover" ? 88 : 95;
  let hrEval: MetricEvaluation = {
    status: "GREEN",
    label: "Nominal Rhythm",
    insight: "Resting cardiovascular rate is stable for current mission profile.",
    actions: ["Continue scheduled aerobic countermeasure routine."],
  };
  if (v.hr > 110 || v.hr < 50) {
    hrEval = {
      status: "RED",
      label: "Critical Arrhythmia / Tachycardia",
      insight:
        "Heart rate is outside safe operational limits. Risk of syncope or acute cardiac strain.",
      actions: [
        "Abort high-exertion tasks immediately and assume seated/neutral posture.",
        "Perform 2-minute continuous ECG/optical lock on ESP32 sensor.",
        "Transmit priority telemetry packet to Earth Flight Surgeon.",
      ],
    };
  } else if (v.hr > hrUpperCaution || v.hr < 58) {
    hrEval = {
      status: "YELLOW",
      label: "Elevated Stress / Deconditioning",
      insight:
        env === "rover"
          ? "Elevated HR detected during rover confinement. Vibration and stress may be contributing."
          : "Mildly elevated heart rate. Could indicate dehydration or microgravity fluid shift.",
      actions: [
        "Drink 250 mL water with electrolyte solution.",
        "Complete 5 minutes of box-breathing (4s inhale, 4s hold, 4s exhale).",
      ],
    };
  }

  // 2. Blood Oxygen (SpO2)
  const spo2CautionFloor = env === "base" ? 96 : 95;
  let spo2Eval: MetricEvaluation = {
    status: "GREEN",
    label: "Optimal Oxygenation",
    insight: "Arterial oxygen saturation is optimal.",
    actions: ["No respiratory intervention required."],
  };
  if (v.spo2 < 92) {
    spo2Eval = {
      status: "RED",
      label: "Hypoxia Alert",
      insight:
        env === "base"
          ? "Critical post-EVA SpO2 drop! High risk of lunar/Martian regolith dust inhalation or decompression stress."
          : "Dangerously low blood oxygen saturation. Immediate cabin/suit O2 check required.",
      actions: [
        "Connect to supplemental 100% O2 mask immediately.",
        "Verify suit/cabin pressure and O2 partial pressure (ppO2).",
        "Screen for respiratory irritation if returning from surface EVA.",
      ],
    };
  } else if (v.spo2 < spo2CautionFloor) {
    spo2Eval = {
      status: "YELLOW",
      label: "Mild Desaturation",
      insight: "SpO2 is slightly below target threshold for this habitat mode.",
      actions: [
        "Warm finger and re-seat MAX30102 optical sensor to rule out poor perfusion.",
        "Perform 10 deep diaphragmatic breaths and check cabin air circulation.",
      ],
    };
  }

  // 3. Body Temperature (Temp)
  let tempEval: MetricEvaluation = {
    status: "GREEN",
    label: "Normothermic",
    insight: "Core thermal regulation is balanced.",
    actions: ["Maintain standard liquid cooling garment / cabin settings."],
  };
  if (v.temp > 38.0 || v.temp < 35.8) {
    tempEval = {
      status: "RED",
      label: v.temp > 38.0 ? "Hyperthermia / Fever" : "Hypothermia Risk",
      insight:
        "Core temperature deviation indicates acute thermal stress or spaceflight immune dysregulation.",
      actions: [
        "Adjust Liquid Cooling and Ventilation Garment (LCVG) temperature.",
        "Log immune check-in and administer antipyretic / oral hydration per medical kit.",
      ],
    };
  } else if (v.temp > 37.4 || v.temp < 36.2) {
    tempEval = {
      status: "YELLOW",
      label: "Mild Thermal Drift",
      insight: "Slight shift in body temperature detected.",
      actions: [
        "Reduce physical exertion for 20 minutes.",
        "Re-verify skin temperature sensor contact.",
      ],
    };
  }

  // 4. Cabin / Suit CO2
  const co2YellowThreshold = env === "station" ? 1000 : 1300;
  let co2Eval: MetricEvaluation = {
    status: "GREEN",
    label: "Clean Atmosphere",
    insight: "Ambient CO2 levels are low and safe for cognitive performance.",
    actions: ["Life support CDRA / LiOH scrubbers operating nominally."],
  };
  if (v.co2 > 2200) {
    co2Eval = {
      status: "RED",
      label: "Hypercapnia Hazard",
      insight:
        "Toxic CO2 accumulation! High risk of headache, lethargy, vision tunnel, and impaired decision-making.",
      actions: [
        "Activate emergency LiOH CO2 scrubber canister immediately.",
        "Turn on high-flow cabin ventilation fans to disperse localized CO2.",
        "Relocate to secondary pressurized module if levels do not drop in 5 minutes.",
      ],
    };
  } else if (v.co2 > co2YellowThreshold) {
    co2Eval = {
      status: "YELLOW",
      label: "Localized CO2 Pocket",
      insight:
        env === "station"
          ? "Microgravity Alert: Lack of natural convection in 0g has formed a stagnant CO2 bubble around your head."
          : "Elevated CO2 in enclosed cabin volume.",
      actions: [
        "Turn on personal air circulation fan near crew quarters/workstation.",
        "Inspect air intake vents for blockage.",
      ],
    };
  }

  // 5. Blood Pressure (BP Sys/Dia)
  let bpEval: MetricEvaluation = {
    status: "GREEN",
    label: "Normotensive",
    insight: "Arterial blood pressure is stable.",
    actions: ["Log next scheduled cuff reading per mission routine."],
  };
  if (v.bpSys >= 140 || v.bpDia >= 90 || v.bpSys < 90 || v.bpDia < 55) {
    bpEval = {
      status: "RED",
      label: v.bpSys >= 140 ? "Hypertensive Spike" : "Hypotensive Drop",
      insight:
        "Significant arterial pressure abnormality. In microgravity, upper-body fluid pressure increases SANS (optic nerve edema) risk.",
      actions: [
        "Rest quietly for 5 minutes and repeat oscillometric cuff reading at heart level.",
        "If confirmed, perform Lower Body Negative Pressure (LBNP) countermeasure session.",
      ],
    };
  } else if (v.bpSys > 125 || v.bpDia > 82 || v.bpSys < 95) {
    bpEval = {
      status: "YELLOW",
      label: "Cephalad Fluid Shift",
      insight:
        "Mild blood pressure elevation linked to cephalad fluid shift toward the head and chest.",
      actions: [
        "Ensure cuff is strapped at heart level and reduce sodium intake on next ration.",
        "Complete 30-minute resistive exercise protocol (ARED).",
      ],
    };
  }

  // 6. Blood Glucose (GLO)
  let gloEval: MetricEvaluation = {
    status: "GREEN",
    label: "Euglycemic (Balanced)",
    insight: "Blood glucose is within optimal metabolic range.",
    actions: ["Maintain standard spaceflight nutritional schedule."],
  };
  if (v.glo > 140 || v.glo < 65) {
    gloEval = {
      status: "RED",
      label: v.glo > 140 ? "Hyperglycemia Alert" : "Hypoglycemia Alert",
      insight:
        v.glo < 65
          ? "Low blood glucose threatens immediate cognitive and motor coordination during mission tasks."
          : "Marked spaceflight-induced insulin resistance spike.",
      actions:
        v.glo < 65
          ? [
              "Consume 15–20g fast-acting glucose gel from suit/cabin medical pouch.",
              "Re-test blood glucose in 15 minutes.",
            ]
          : [
              "Hydrate with 400 mL water and perform 20 minutes of light cycling.",
              "Avoid high-glycemic carbohydrate rations for next meal.",
            ],
    };
  } else if (v.glo > 105 || v.glo < 72) {
    gloEval = {
      status: "YELLOW",
      label: "Subclinical Insulin Shift",
      insight:
        "Microgravity and circadian disruption mildly elevated fasting blood sugar.",
      actions: [
        "Prioritize protein and fiber in next meal pouch.",
        "Verify sleep schedule alignment with Mission Elapsed Time.",
      ],
    };
  }

  return {
    hr: hrEval,
    spo2: spo2Eval,
    temp: tempEval,
    co2: co2Eval,
    bp: bpEval,
    glo: gloEval,
  };
}

function computeOverallStatus(
  evals: Record<MetricKey, MetricEvaluation>
): HealthStatus {
  const values = Object.values(evals);
  if (values.some((e) => e.status === "RED")) return "RED";
  if (values.some((e) => e.status === "YELLOW")) return "YELLOW";
  return "GREEN";
}

function computeReadinessScore(
  evals: Record<MetricKey, MetricEvaluation>,
  quests: HealthQuest[]
): number {
  let vitalsPoints = 70;
  Object.values(evals).forEach((e) => {
    if (e.status === "YELLOW") vitalsPoints -= 8;
    if (e.status === "RED") vitalsPoints -= 20;
  });

  const completedQuests = quests.filter((q) => q.completed).length;
  const questPoints =
    quests.length > 0 ? Math.round((completedQuests / quests.length) * 30) : 30;

  return Math.max(0, Math.min(100, vitalsPoints + questPoints));
}

// ==========================================
// 3. INITIAL DEFAULT DATA
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
// 4. ZUSTAND STORE WITH LOCALSTORAGE PERSIST
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

        // Update 4 Live Sensor Metrics from ESP32
        updateEsp32Telemetry: ({ hr, spo2, temp, co2 }) => {
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
            co2: Number(co2.toFixed(0)),
          };

          const newEvals = evaluateAllMetrics(updatedVitals, environment);

          set({
            vitals: updatedVitals,
            evaluations: newEvals,
            overallStatus: computeOverallStatus(newEvals),
            readinessScore: computeReadinessScore(newEvals, quests),
            history: [...history.slice(-29), updatedVitals], // Keep last 30 points for dynamic charts
            lastSyncTime: now,
          });
        },

        // Poll ESP32 HTTP Endpoint (or fallback gracefully if offline)
        pollEsp32: async () => {
          const { esp32Ip, updateEsp32Telemetry } = get();
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 1800);

            const res = await fetch(`http://${esp32Ip}/api/health`, {
              signal: controller.signal,
            });
            clearTimeout(timeout);

            if (!res.ok) throw new Error("ESP32 non-200 response");
            const data = await res.json();

            set({ isEsp32Connected: true });
            updateEsp32Telemetry({
              hr: Number(data.heartRate ?? data.hr ?? 75),
              spo2: Number(data.spO2 ?? data.spo2 ?? 98),
              temp: Number(data.bodyTemp ?? data.temp ?? 36.8),
              co2: Number(data.co2 ?? 750),
            });
          } catch {
            set({ isEsp32Connected: false });
          }
        },

        // Crew Manual Input for Blood Pressure & Blood Glucose
        logCrewManualVitals: (bpSys, bpDia, glo) => {
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
          };

          const newEvals = evaluateAllMetrics(updatedVitals, environment);

          // Auto-complete Morning BP & Glucose Quest if not already completed
          let earnedXp = 25;
          const updatedQuests = quests.map((q) => {
            if (q.id === "q_morning_bp" && !q.completed) {
              earnedXp += q.xpReward;
              return { ...q, completed: true };
            }
            return q;
          });

          const newXp = xp + earnedXp;
          const newLevel = Math.floor(newXp / 150) + 1;

          const updatedBadges = badges.map((b) => {
            if (b.id === "b_vitals_vanguard") return { ...b, unlocked: true };
            if (b.id === "b_eva_cleared" && newXp >= 200)
              return { ...b, unlocked: true };
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
      name: "astro-vitals-storage", // Key in browser localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);