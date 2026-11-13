// lib/healthRules.ts
import {
  HealthQuest,
  HealthStatus,
  MetricEvaluation,
  MetricKey,
  MissionEnvironment,
  VitalsSnapshot,
} from "@/store/useHealthStore";

// ==========================================
// 1. ENVIRONMENT THRESHOLD MATRIX
// ==========================================

export interface ThresholdRange {
  greenMin: number;
  greenMax: number;
  yellowMin: number;
  yellowMax: number;
}

export interface EnvironmentThresholds {
  hr: ThresholdRange;
  spo2: ThresholdRange;
  temp: ThresholdRange;
  co2: ThresholdRange;
  bpSys: ThresholdRange;
  bpDia: ThresholdRange;
  glo: ThresholdRange;
}

/**
 * Dynamic thresholds tailored to each mission environment:
 * - station (0g): Stricter CO2 threshold (1000 ppm) due to lack of natural convection.
 * - rover: Stricter HR caution ceiling (88 BPM) to catch confinement/vibration stress early.
 * - base: Stricter SpO2 floor (96%) to screen for post-EVA lunar/Martian regolith dust inhalation.
 * - spacecraft: Stricter Glucose (100 mg/dL) to monitor deep-space insulin sensitivity shifts.
 */
export const ENVIRONMENT_THRESHOLDS: Record<
  MissionEnvironment,
  EnvironmentThresholds
> = {
  spacecraft: {
    hr: { greenMin: 58, greenMax: 92, yellowMin: 50, yellowMax: 110 },
    spo2: { greenMin: 95, greenMax: 100, yellowMin: 92, yellowMax: 100 },
    temp: { greenMin: 36.2, greenMax: 37.3, yellowMin: 35.8, yellowMax: 37.9 },
    co2: { greenMin: 400, greenMax: 1200, yellowMin: 350, yellowMax: 2000 },
    bpSys: { greenMin: 95, greenMax: 122, yellowMin: 90, yellowMax: 138 },
    bpDia: { greenMin: 60, greenMax: 80, yellowMin: 55, yellowMax: 89 },
    glo: { greenMin: 72, greenMax: 100, yellowMin: 65, yellowMax: 135 },
  },
  station: {
    hr: { greenMin: 58, greenMax: 95, yellowMin: 50, yellowMax: 110 },
    spo2: { greenMin: 95, greenMax: 100, yellowMin: 92, yellowMax: 100 },
    temp: { greenMin: 36.2, greenMax: 37.4, yellowMin: 35.8, yellowMax: 38.0 },
    co2: { greenMin: 400, greenMax: 1000, yellowMin: 350, yellowMax: 2000 }, // Stricter in 0g
    bpSys: { greenMin: 95, greenMax: 125, yellowMin: 90, yellowMax: 139 },
    bpDia: { greenMin: 60, greenMax: 82, yellowMin: 55, yellowMax: 89 },
    glo: { greenMin: 72, greenMax: 105, yellowMin: 65, yellowMax: 140 },
  },
  rover: {
    hr: { greenMin: 58, greenMax: 88, yellowMin: 50, yellowMax: 108 }, // Stricter for confinement fatigue
    spo2: { greenMin: 95, greenMax: 100, yellowMin: 92, yellowMax: 100 },
    temp: { greenMin: 36.2, greenMax: 37.4, yellowMin: 35.8, yellowMax: 38.0 },
    co2: { greenMin: 400, greenMax: 1100, yellowMin: 350, yellowMax: 1900 },
    bpSys: { greenMin: 95, greenMax: 125, yellowMin: 90, yellowMax: 139 },
    bpDia: { greenMin: 60, greenMax: 82, yellowMin: 55, yellowMax: 89 },
    glo: { greenMin: 75, greenMax: 105, yellowMin: 68, yellowMax: 140 },
  },
  base: {
    hr: { greenMin: 58, greenMax: 95, yellowMin: 50, yellowMax: 112 },
    spo2: { greenMin: 96, greenMax: 100, yellowMin: 93, yellowMax: 100 }, // Stricter for post-EVA dust checks
    temp: { greenMin: 36.2, greenMax: 37.4, yellowMin: 35.8, yellowMax: 38.0 },
    co2: { greenMin: 400, greenMax: 1200, yellowMin: 350, yellowMax: 2200 },
    bpSys: { greenMin: 95, greenMax: 125, yellowMin: 90, yellowMax: 139 },
    bpDia: { greenMin: 60, greenMax: 82, yellowMin: 55, yellowMax: 89 },
    glo: { greenMin: 72, greenMax: 105, yellowMin: 65, yellowMax: 140 },
  },
};

// ==========================================
// 2. INDIVIDUAL METRIC EVALUATORS
// ==========================================

export function evaluateHeartRate(
  hr: number,
  env: MissionEnvironment
): MetricEvaluation {
  const t = ENVIRONMENT_THRESHOLDS[env].hr;

  if (hr < t.yellowMin || hr > t.yellowMax) {
    return {
      status: "RED",
      label: hr > t.yellowMax ? "Critical Tachycardia" : "Severe Bradycardia",
      insight:
        "Heart rate is outside safe operational limits. High risk of syncope, acute cardiac strain, or severe dehydration.",
      actions: [
        "Abort high-exertion tasks immediately and assume a seated or neutral posture.",
        "Keep finger still on the ESP32 MAX30102 optical sensor for a 2-minute continuous lock.",
        "Transmit priority medical telemetry packet to Earth Flight Surgeon.",
      ],
    };
  }

  if (hr < t.greenMin || hr > t.greenMax) {
    return {
      status: "YELLOW",
      label:
        env === "rover"
          ? "Rover Confinement Stress"
          : "Elevated Cardiovascular Strain",
      insight:
        env === "rover"
          ? "Elevated resting heart rate detected during rover confinement. Cabin vibration and fatigue may be contributing."
          : "Mildly abnormal heart rate. Often linked to plasma volume loss (dehydration) or microgravity fluid shift.",
      actions: [
        "Drink 250 mL water with an electrolyte packet.",
        "Perform 5 minutes of paced box-breathing (4s inhale, 4s hold, 4s exhale).",
      ],
    };
  }

  return {
    status: "GREEN",
    label: "Nominal Sinus Rhythm",
    insight: "Cardiovascular rate is stable for the active mission environment.",
    actions: ["Continue scheduled aerobic countermeasure exercise routine."],
  };
}

export function evaluateSpO2(
  spo2: number,
  env: MissionEnvironment
): MetricEvaluation {
  const t = ENVIRONMENT_THRESHOLDS[env].spo2;

  if (spo2 < t.yellowMin) {
    return {
      status: "RED",
      label: "Acute Hypoxia Alert",
      insight:
        env === "base"
          ? "Critical post-EVA SpO2 drop! High risk of lunar/Martian regolith dust inhalation or suit decompression stress."
          : "Dangerously low arterial oxygen saturation. Immediate cabin/suit atmosphere check required.",
      actions: [
        "Don supplemental 100% O2 mask immediately.",
        "Verify cabin total pressure and O2 partial pressure (ppO2).",
        "If returning from surface EVA, run respiratory dust-exposure protocol.",
      ],
    };
  }

  if (spo2 < t.greenMin) {
    return {
      status: "YELLOW",
      label: "Mild Desaturation",
      insight:
        env === "base"
          ? "Slight post-EVA oxygen dip detected under planetary base thresholds."
          : "Blood oxygen is slightly below optimal target range.",
      actions: [
        "Warm hand and re-position fingertip over the ESP32 MAX30102 sensor to rule out low perfusion.",
        "Take 10 slow diaphragmatic breaths and verify local cabin airflow.",
      ],
    };
  }

  return {
    status: "GREEN",
    label: "Optimal Oxygenation",
    insight: "Arterial oxygen saturation is optimal for cognitive and physical tasks.",
    actions: ["No respiratory intervention required."],
  };
}

export function evaluateTemperature(
  temp: number,
  env: MissionEnvironment
): MetricEvaluation {
  const t = ENVIRONMENT_THRESHOLDS[env].temp;

  if (temp < t.yellowMin || temp > t.yellowMax) {
    return {
      status: "RED",
      label: temp > t.yellowMax ? "Hyperthermia / Fever" : "Hypothermia Hazard",
      insight:
        "Core temperature deviation indicates acute thermal stress, suit cooling failure, or spaceflight immune dysregulation.",
      actions: [
        "Adjust Liquid Cooling and Ventilation Garment (LCVG) or cabin thermostat immediately.",
        "Halt physical exercise, hydrate orally, and consult onboard medical kit antipyretic protocol.",
      ],
    };
  }

  if (temp < t.greenMin || temp > t.greenMax) {
    return {
      status: "YELLOW",
      label: "Mild Thermal Drift",
      insight:
        "Slight core temperature shift. In microgravity, lack of convective heat loss slows down natural sweat cooling.",
      actions: [
        "Pause heavy workloads for 20 minutes and increase cabin fan speed.",
        "Re-verify skin contact on the ESP32 thermal probe.",
      ],
    };
  }

  return {
    status: "GREEN",
    label: "Normothermic",
    insight: "Core thermal regulation is balanced.",
    actions: ["Maintain standard suit and cabin thermal settings."],
  };
}

export function evaluateCO2(
  co2: number,
  env: MissionEnvironment
): MetricEvaluation {
  const t = ENVIRONMENT_THRESHOLDS[env].co2;

  if (co2 > t.yellowMax) {
    return {
      status: "RED",
      label: "Hypercapnia Hazard",
      insight:
        "Toxic CO2 accumulation! High risk of severe headache, lethargy, tunnel vision, and impaired crew decision-making.",
      actions: [
        "Activate backup LiOH CO2 scrubber canister immediately.",
        "Switch cabin ventilation fans to maximum flow to disperse stagnant gas.",
        "Relocate to secondary pressurized module if CO2 stays above 2,000 ppm for 5 minutes.",
      ],
    };
  }

  if (co2 > t.greenMax) {
    return {
      status: "YELLOW",
      label:
        env === "station" ? "0g CO2 Pocket Detected" : "Elevated Cabin CO2",
      insight:
        env === "station"
          ? "Microgravity Alert: Without buoyancy convection in 0g, exhaled CO2 has formed a stagnant pocket around your head."
          : "CO2 concentration is rising inside the enclosed cabin volume.",
      actions: [
        "Turn on personal air circulation fan near your workstation or sleep station.",
        "Check air intake ducts for debris or blockage.",
      ],
    };
  }

  return {
    status: "GREEN",
    label: "Clean Atmosphere",
    insight: "Ambient CO2 levels are low and safe for peak cognitive performance.",
    actions: ["Life support CDRA / LiOH scrubbers operating nominally."],
  };
}

export function evaluateBloodPressure(
  bpSys: number,
  bpDia: number,
  env: MissionEnvironment
): MetricEvaluation {
  const sysT = ENVIRONMENT_THRESHOLDS[env].bpSys;
  const diaT = ENVIRONMENT_THRESHOLDS[env].bpDia;

  if (
    bpSys > sysT.yellowMax ||
    bpDia > diaT.yellowMax ||
    bpSys < sysT.yellowMin ||
    bpDia < diaT.yellowMin
  ) {
    return {
      status: "RED",
      label:
        bpSys > sysT.yellowMax ? "Hypertensive Spike" : "Hypotensive Drop",
      insight:
        "Significant arterial pressure abnormality. In microgravity, elevated upper-body pressure increases Spaceflight-Associated Neuro-ocular Syndrome (SANS) risk.",
      actions: [
        "Rest quietly for 5 minutes and repeat oscillometric cuff reading at exact heart level.",
        "If confirmed, initiate Lower Body Negative Pressure (LBNP) countermeasure session.",
        "Flag log for Earth Flight Surgeon review.",
      ],
    };
  }

  if (
    bpSys > sysT.greenMax ||
    bpDia > diaT.greenMax ||
    bpSys < sysT.greenMin ||
    bpDia < diaT.greenMin
  ) {
    return {
      status: "YELLOW",
      label: "Cephalad Fluid Shift",
      insight:
        "Mild blood pressure shift caused by ~2L of fluid migrating toward the chest and head in reduced gravity.",
      actions: [
        "Confirm arm cuff is strapped at heart level and reduce sodium in next meal ration.",
        "Complete scheduled 30-minute resistive exercise protocol (ARED).",
      ],
    };
  }

  return {
    status: "GREEN",
    label: "Normotensive",
    insight: "Arterial blood pressure is stable.",
    actions: ["Log next scheduled cuff reading per mission routine."],
  };
}

export function evaluateGlucose(
  glo: number,
  env: MissionEnvironment
): MetricEvaluation {
  const t = ENVIRONMENT_THRESHOLDS[env].glo;

  if (glo < t.yellowMin || glo > t.yellowMax) {
    return {
      status: "RED",
      label: glo > t.yellowMax ? "Hyperglycemia Alert" : "Hypoglycemia Alert",
      insight:
        glo < t.yellowMin
          ? "Critically low blood glucose threatens immediate cognitive focus and motor coordination during mission tasks."
          : "Marked spaceflight-induced insulin resistance spike.",
      actions:
        glo < t.yellowMin
          ? [
              "Consume 15–20g fast-acting oral glucose gel from suit/cabin medical pouch immediately.",
              "Re-test blood glucose with finger-stick glucometer after 15 minutes.",
            ]
          : [
              "Drink 400 mL water and perform 20 minutes of light aerobic cycling.",
              "Avoid high-glycemic carbohydrate rations on next meal.",
            ],
    };
  }

  if (glo < t.greenMin || glo > t.greenMax) {
    return {
      status: "YELLOW",
      label: "Subclinical Insulin Shift",
      insight:
        "Microgravity muscle unloading and circadian disruption mildly shifted fasting blood sugar.",
      actions: [
        "Prioritize protein and dietary fiber in next meal pouch.",
        "Align sleep/wake cycle with Mission Elapsed Time schedule.",
      ],
    };
  }

  return {
    status: "GREEN",
    label: "Euglycemic (Balanced)",
    insight: "Blood glucose is within optimal metabolic range.",
    actions: ["Maintain standard spaceflight nutritional schedule."],
  };
}

// ==========================================
// 3. AGGREGATE EVALUATION & READINESS HELPERS
// ==========================================

export function evaluateAllMetrics(
  v: VitalsSnapshot,
  env: MissionEnvironment
): Record<MetricKey, MetricEvaluation> {
  return {
    hr: evaluateHeartRate(v.hr, env),
    spo2: evaluateSpO2(v.spo2, env),
    temp: evaluateTemperature(v.temp, env),
    co2: evaluateCO2(v.co2, env),
    bp: evaluateBloodPressure(v.bpSys, v.bpDia, env),
    glo: evaluateGlucose(v.glo, env),
  };
}

export function computeOverallStatus(
  evals: Record<MetricKey, MetricEvaluation>
): HealthStatus {
  const list = Object.values(evals);
  if (list.some((item) => item.status === "RED")) return "RED";
  if (list.some((item) => item.status === "YELLOW")) return "YELLOW";
  return "GREEN";
}

export function computeReadinessScore(
  evals: Record<MetricKey, MetricEvaluation>,
  quests: HealthQuest[]
): number {
  let vitalsScore = 70;
  Object.values(evals).forEach((e) => {
    if (e.status === "YELLOW") vitalsScore -= 8;
    if (e.status === "RED") vitalsScore -= 20;
  });

  const completedCount = quests.filter((q) => q.completed).length;
  const questScore =
    quests.length > 0 ? Math.round((completedCount / quests.length) * 30) : 30;

  return Math.max(0, Math.min(100, vitalsScore + questScore));
}