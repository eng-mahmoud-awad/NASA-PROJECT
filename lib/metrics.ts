import type { MetricKey, VitalsSnapshot } from "@/store/useHealthStore";

export interface MetricInfo {
  name: string;
  short: string;
  unit: string;
  manual: boolean;
  range: string;
  whyItMatters: string;
  howTo: string[];
  chart: { min: number; max: number; safeMin: number; safeMax: number };
}

export const METRIC_ORDER: MetricKey[] = ["hr", "spo2", "temp", "bp", "glo", "co2"];

export const METRICS: Record<MetricKey, MetricInfo> = {
  hr: {
    name: "Heart rate",
    short: "HR",
    unit: "bpm",
    manual: false,
    range: "60–90",
    whyItMatters:
      "The heart does less work in microgravity and slowly deconditions, so a fast pulse during surface EVAs is common.",
    howTo: [
      "Sit or float still for a minute.",
      "Rest your fingertip lightly on the MAX30102 LED. Pressing hard skews the reading.",
      "Hold still for about 10 seconds.",
    ],
    chart: { min: 45, max: 135, safeMin: 60, safeMax: 95 },
  },
  spo2: {
    name: "Blood oxygen",
    short: "SpO₂",
    unit: "%",
    manual: false,
    range: "96–100",
    whyItMatters:
      "A drop can mean a pressure problem, hypoxia, or lungs irritated by lunar or Martian dust after an EVA.",
    howTo: [
      "Warm your hand first. Cold fingers read low.",
      "Cover the sensor window fully to block cabin light.",
      "Breathe normally and wait 15 seconds.",
    ],
    chart: { min: 85, max: 100, safeMin: 95, safeMax: 100 },
  },
  temp: {
    name: "Body temperature",
    short: "Temp",
    unit: "°C",
    manual: false,
    range: "36.3–37.3",
    whyItMatters:
      "Without convection, sweat doesn't evaporate well in 0g, so body heat builds up quickly during exercise.",
    howTo: [
      "Wipe sweat off your forehead.",
      "Hold the probe about 2 cm from your forehead, or strap it to your temple.",
      "Wait 5 seconds.",
    ],
    chart: { min: 35, max: 39.5, safeMin: 36.2, safeMax: 37.4 },
  },
  bp: {
    name: "Blood pressure",
    short: "BP",
    unit: "mmHg",
    manual: true,
    range: "95–120 / 60–80",
    whyItMatters:
      "About 2 L of fluid moves toward the head in 0g. That changes blood pressure and pushes on the back of the eyes (SANS).",
    howTo: [
      "Rest 5 minutes. No caffeine or exercise for 30 minutes before.",
      "Wrap the cuff on the bare upper arm, 2 cm above the elbow.",
      "Strap the arm at heart level. This matters a lot in 0g.",
      "Stay quiet while it inflates, then enter both numbers.",
    ],
    chart: { min: 70, max: 165, safeMin: 95, safeMax: 125 },
  },
  glo: {
    name: "Blood glucose",
    short: "Glucose",
    unit: "mg/dL",
    manual: true,
    range: "70–100",
    whyItMatters:
      "Muscle unloading and broken sleep cycles make the body handle sugar worse during long missions.",
    howTo: [
      "Clean the side of your fingertip with an alcohol swab.",
      "Put a new strip in the meter.",
      "Lance the finger and touch the strip to the drop.",
      "Enter the value.",
    ],
    chart: { min: 50, max: 170, safeMin: 70, safeMax: 105 },
  },
  co2: {
    name: "Cabin CO₂",
    short: "CO₂",
    unit: "ppm",
    manual: true,
    range: "under 1000",
    whyItMatters:
      "Exhaled air doesn't rise in 0g. Without airflow a CO₂ bubble forms around your face and causes headaches and slow thinking.",
    howTo: [
      "Read the value off the cabin monitor or your wrist gauge.",
      "Enter it in the log.",
      "Over 1000 ppm, turn on your personal fan.",
    ],
    chart: { min: 350, max: 2600, safeMin: 400, safeMax: 1000 },
  },
};

export function metricValue(v: VitalsSnapshot, key: MetricKey) {
  return key === "bp" ? v.bpSys : v[key];
}
