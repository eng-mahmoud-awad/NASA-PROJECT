// lib/medicalGuides.ts
import { MetricKey, MissionEnvironment } from "@/store/useHealthStore";

export interface MetricGuide {
  key: MetricKey;
  title: string;
  shortTitle: string;
  unit: string;
  source: "ESP32_SENSOR" | "CREW_MANUAL";
  hardwareName: string;
  bodyRegion: "head_lungs" | "heart_chest" | "arm_vessels" | "core_abdomen";
  normalRangeText: string;
  whatItMeans: string;
  spaceflightRisk: string;
  howToMeasureSteps: string[];
  chartConfig: {
    minDomain: number;
    maxDomain: number;
    safeMin: number;
    safeMax: number;
  };
}

export interface EnvironmentProfile {
  id: MissionEnvironment;
  name: string;
  gravityLabel: string;
  tagline: string;
  primaryHazards: string[];
  routineCheckIntervalMins: number;
}

export const ENVIRONMENT_PROFILES: Record<
  MissionEnvironment,
  EnvironmentProfile
> = {
  spacecraft: {
    id: "spacecraft",
    name: "Deep-Space Spacecraft",
    gravityLabel: "0g Transit",
    tagline: "Confined transit capsule en route to lunar or Martian orbit.",
    primaryHazards: [
      "Solar particle radiation & immune system suppression",
      "Circadian rhythm disruption & spaceflight insulin resistance",
      "Limited air volume requiring continuous CO2 scrubbing",
    ],
    routineCheckIntervalMins: 240,
  },
  station: {
    id: "station",
    name: "Orbital Space Station",
    gravityLabel: "0g Microgravity",
    tagline: "Long-duration orbital research laboratory.",
    primaryHazards: [
      "Cephalad fluid shift (blood pooling in upper body & optic nerve)",
      "Localized CO2 pockets forming around the head due to zero convection",
      "Aerobic & musculoskeletal deconditioning",
    ],
    routineCheckIntervalMins: 360,
  },
  rover: {
    id: "rover",
    name: "Pressurized Surface Rover",
    gravityLabel: "0.16g / 0.38g Mobile",
    tagline: "Small-cabin mobile exploration vehicle on lunar or Martian terrain.",
    primaryHazards: [
      "Rapid CO2 accumulation in compact cabin volume",
      "Whole-body vibration fatigue & elevated stress heart rate",
      "Hypoglycemia risk during extended surface driving shifts",
    ],
    routineCheckIntervalMins: 120,
  },
  base: {
    id: "base",
    name: "Planetary / Lunar Base",
    gravityLabel: "Partial Gravity Habitat",
    tagline: "Surface habitat supporting frequent Extravehicular Activities (EVAs).",
    primaryHazards: [
      "Toxic lunar/Martian regolith dust inhalation after airlock ingress",
      "Post-EVA dehydration, thermal strain, and decompression stress",
      "Physical exhaustion from pressurized suit operations",
    ],
    routineCheckIntervalMins: 180,
  },
};

export const METRIC_GUIDES: Record<MetricKey, MetricGuide> = {
  hr: {
    key: "hr",
    title: "Heart Rate",
    shortTitle: "HR",
    unit: "BPM",
    source: "ESP32_SENSOR",
    hardwareName: "MAX30102 Optical Pulse Sensor (I2C)",
    bodyRegion: "heart_chest",
    normalRangeText: "60 – 90 BPM (Resting)",
    whatItMeans:
      "Measures how many times your heart beats per minute to pump oxygenated blood through your body.",
    spaceflightRisk:
      "In microgravity, the heart works less against gravity and can shrink over time (cardiovascular deconditioning), causing dizziness or rapid heart rate during surface EVAs.",
    howToMeasureSteps: [
      "Sit or float in a relaxed, neutral body posture for 60 seconds.",
      "Place your index fingertip gently over the glowing red LED on the ESP32 MAX30102 sensor.",
      "Do not press too hard—excessive pressure blocks capillary blood flow and skews the reading.",
      "Hold still for 10 seconds until the waveform stabilizes on the dashboard.",
    ],
    chartConfig: {
      minDomain: 45,
      maxDomain: 135,
      safeMin: 60,
      safeMax: 95,
    },
  },

  spo2: {
    key: "spo2",
    title: "Blood Oxygen Saturation",
    shortTitle: "SpO2 / O2",
    unit: "%",
    source: "ESP32_SENSOR",
    hardwareName: "MAX30102 Red & IR Photodetector (I2C)",
    bodyRegion: "head_lungs",
    normalRangeText: "96% – 100%",
    whatItMeans:
      "Shows the percentage of hemoglobin in your red blood cells that is carrying oxygen from your lungs to your brain and muscles.",
    spaceflightRisk:
      "Drops in SpO2 warn of cabin/suit depressurization, hypoxia, or lung irritation caused by inhaling microscopic lunar or Martian dust after a spacewalk.",
    howToMeasureSteps: [
      "Ensure your hand is warm; cold fingers restrict blood flow and cause false low readings.",
      "Cover the MAX30102 optical window completely with your fingertip to block ambient cabin light.",
      "Breathe normally and wait 15 seconds for the infrared/red absorption ratio to lock.",
    ],
    chartConfig: {
      minDomain: 85,
      maxDomain: 100,
      safeMin: 95,
      safeMax: 100,
    },
  },

  temp: {
    key: "temp",
    title: "Core Body Temperature",
    shortTitle: "TEMP",
    unit: "°C",
    source: "ESP32_SENSOR",
    hardwareName: "MLX90614 IR / DS18B20 Thermal Probe",
    bodyRegion: "core_abdomen",
    normalRangeText: "36.3°C – 37.3°C",
    whatItMeans:
      "Indicates your body's internal thermal balance and metabolic heat production.",
    spaceflightRisk:
      "Lack of convective air cooling in 0g causes astronauts to overheat faster during exercise (" +
      "space fever), while immune changes can trigger infections.",
    howToMeasureSteps: [
      "Wipe any sweat from your forehead or temple before measurement.",
      "Hold the ESP32 thermal sensor 2 cm from the center of the forehead (or strap the probe to the axilla/temple).",
      "Wait 5 seconds for thermal equilibrium to register.",
    ],
    chartConfig: {
      minDomain: 35.0,
      maxDomain: 39.5,
      safeMin: 36.2,
      safeMax: 37.4,
    },
  },

  // داخل lib/medicalGuides.ts -> قسم co2:
co2: {
  key: "co2",
  title: "Ambient Cabin / Suit CO2",
  shortTitle: "CO2",
  unit: "ppm",
  source: "CREW_MANUAL", // <-- تم التعديل من ESP32_SENSOR إلى CREW_MANUAL
  hardwareName: "Cabin Wall / Suit Portable CO2 Meter + Crew Input",
  bodyRegion: "head_lungs",
  normalRangeText: "400 – 1,000 ppm",
  whatItMeans:
    "Measures the concentration of exhaled carbon dioxide gas in the air immediately surrounding you.",
  spaceflightRisk:
    "In microgravity, warm exhaled air does not rise. Without fan airflow, a toxic bubble of CO2 forms around your face, causing headaches, slow thinking, and vision changes.",
  howToMeasureSteps: [
    "Read the current CO2 ppm value displayed on your cabin bulkhead monitor or wrist portable gauge.",
    "Enter the ppm value into the Crew Routine Input form on the dashboard.",
    "If reading exceeds 1,000 ppm, immediately switch on your personal ventilation fan.",
  ],
  chartConfig: {
    minDomain: 350,
    maxDomain: 2600,
    safeMin: 400,
    safeMax: 1000,
  },
},

  bp: {
    key: "bp",
    title: "Arterial Blood Pressure",
    shortTitle: "BP (Sys/Dia)",
    unit: "mmHg",
    source: "CREW_MANUAL",
    hardwareName: "Oscillometric Arm Cuff + Crew Input",
    bodyRegion: "arm_vessels",
    normalRangeText: "95–120 / 60–80 mmHg",
    whatItMeans:
      "Systolic (top number) measures arterial pressure when the heart beats; Diastolic (bottom number) measures pressure when the heart rests between beats.",
    spaceflightRisk:
      "In 0g, nearly 2 liters of fluid shift from the legs toward the head, altering blood pressure and increasing pressure behind the eyes (SANS).",
    howToMeasureSteps: [
      "Rest quietly for 5 minutes before measuring; avoid caffeine or exercise for 30 minutes prior.",
      "Wrap the cuff snugly around your bare upper left arm, 2 cm above the elbow crease.",
      "CRITICAL IN 0g: Use the torso positioning strap to hold your arm at exact heart level so fluid shifts do not skew the sensor.",
      "Press START on the cuff, remain silent while it inflates, and enter both Systolic and Diastolic numbers into the dashboard.",
    ],
    chartConfig: {
      minDomain: 70,
      maxDomain: 165,
      safeMin: 95,
      safeMax: 125,
    },
  },

  glo: {
    key: "glo",
    title: "Blood Glucose",
    shortTitle: "GLO",
    unit: "mg/dL",
    source: "CREW_MANUAL",
    hardwareName: "Capillary Glucometer + Crew Input",
    bodyRegion: "core_abdomen",
    normalRangeText: "70 – 100 mg/dL (Fasting)",
    whatItMeans:
      "Measures the amount of glucose (sugar) circulating in your bloodstream—your brain's primary fuel source for complex mission tasks.",
    spaceflightRisk:
      "Microgravity muscle inactivity, radiation, and disrupted sleep schedules cause spaceflight-induced insulin resistance (high sugar) or sudden fatigue drops (low sugar).",
    howToMeasureSteps: [
      "Wash and dry hands or sanitize the side of your ring fingertip with an alcohol swab.",
      "Insert a fresh test strip into the handheld glucometer.",
      "Use the safety lancet on the side of the fingertip and touch the strip edge to the blood drop (in 0g, surface tension keeps the droplet in place).",
      "Enter the displayed mg/dL value into the Crew Input panel.",
    ],
    chartConfig: {
      minDomain: 50,
      maxDomain: 170,
      safeMin: 70,
      safeMax: 105,
    },
  },
};