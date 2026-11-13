// lib/nasaHrpData.ts
import { MetricKey } from "@/store/useHealthStore";

export type NasaHazardCode = "R" | "I" | "D" | "G" | "E";

export interface NasaHazardInfo {
  code: NasaHazardCode;
  name: string;
  shortDesc: string;
  nasaUrl: string;
  badgeColor: string;
}

export interface NasaMetricResearch {
  metric: MetricKey;
  primaryHazard: NasaHazardCode;
  secondaryHazard: NasaHazardCode;
  officialHrpRiskName: string;
  hrpRiskSummary: string;
  ongoingResearchCountermeasure: string;
  referenceLinks: {
    title: string;
    url: string;
  }[];
}

export const NASA_RIDGE_HAZARDS: Record<NasaHazardCode, NasaHazardInfo> = {
  R: {
    code: "R",
    name: "Space Radiation",
    shortDesc: "Galactic cosmic rays & solar particle events causing cellular & immune stress.",
    nasaUrl: "https://www.nasa.gov/hrp/hazards/",
    badgeColor: "border-purple-500/40 bg-purple-500/10 text-purple-300",
  },
  I: {
    code: "I",
    name: "Isolation & Confinement",
    shortDesc: "Circadian disruption, behavioral stress, and sleep loss in enclosed habitats.",
    nasaUrl: "https://www.nasa.gov/hrp/hazards/",
    badgeColor: "border-indigo-500/40 bg-indigo-500/10 text-indigo-300",
  },
  D: {
    code: "D",
    name: "Distance from Earth",
    shortDesc: "Communication latency up to 20 mins requiring autonomous onboard medical care.",
    nasaUrl: "https://www.nasa.gov/hrp/hazards/",
    badgeColor: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
  },
  G: {
    code: "G",
    name: "Gravity Fields",
    shortDesc: "Fluid shifts (SANS), orthostatic intolerance, and cardiovascular deconditioning.",
    nasaUrl: "https://www.nasa.gov/hrp/hazards/",
    badgeColor: "border-blue-500/40 bg-blue-500/10 text-blue-300",
  },
  E: {
    code: "E",
    name: "Hostile/Closed Environments",
    shortDesc: "Stagnant 0g CO2 pockets, cabin pressure shifts, and toxic planetary regolith dust.",
    nasaUrl: "https://www.nasa.gov/hrp/hazards/",
    badgeColor: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  },
};

export const NASA_METRIC_RESEARCH: Record<MetricKey, NasaMetricResearch> = {
  hr: {
    metric: "hr",
    primaryHazard: "G",
    secondaryHazard: "I",
    officialHrpRiskName:
      "Risk of Cardiovascular Adaptations & Behavioral Conditions",
    hrpRiskSummary:
      "NASA HRP research shows microgravity unloads the cardiovascular system, reducing plasma volume and aerobic capacity while confinement elevates sympathetic stress.",
    ongoingResearchCountermeasure:
      "Combined aerobic/resistive exercise (CEVIS/ARED) and heart-rate variability biofeedback breathing.",
    referenceLinks: [
      { title: "NASA HRP Hazards Overview", url: "https://www.nasa.gov/hrp/hazards/" },
      { title: "NASA HRP Cardiovascular Risks", url: "https://www.nasa.gov/hrp/risks/" },
    ],
  },

  spo2: {
    metric: "spo2",
    primaryHazard: "E",
    secondaryHazard: "D",
    officialHrpRiskName:
      "Risk of Celestial Dust Exposure & Hypobaric Hypoxia",
    hrpRiskSummary:
      "During lunar and Martian base operations, ultrafine sharp regolith dust clings to spacesuits and can enter the airlock, causing acute airway inflammation and reduced oxygen transfer.",
    ongoingResearchCountermeasure:
      "ESP32 continuous pulse oximetry lock immediately post-EVA plus suit-port dust mitigation.",
    referenceLinks: [
      { title: "NASA HRP Celestial Dust & EVA Risks", url: "https://www.nasa.gov/hrp/risks/" },
      { title: "Ongoing HRP Research", url: "https://www.nasa.gov/hrp/ongoing-hrp-research/" },
    ],
  },

  temp: {
    metric: "temp",
    primaryHazard: "R",
    secondaryHazard: "G",
    officialHrpRiskName:
      "Risk of Altered Immune Response & Thermoregulatory Strain",
    hrpRiskSummary:
      "NASA ongoing research on 'Space Fever' shows that without convective air currents in 0g, sweat pools on the skin instead of evaporating, causing core temperature to spike rapidly during exercise or immune reactivation.",
    ongoingResearchCountermeasure:
      "Liquid Cooling and Ventilation Garment (LCVG) thermal loop modulation and immune biomarker tracking.",
    referenceLinks: [
      { title: "NASA HRP Ongoing Research", url: "https://www.nasa.gov/hrp/ongoing-hrp-research/" },
      { title: "NASA HRP Immune System Risks", url: "https://www.nasa.gov/hrp/risks/" },
    ],
  },

  co2: {
    metric: "co2",
    primaryHazard: "E",
    secondaryHazard: "I",
    officialHrpRiskName:
      "Risk of CO2 Exposure Related Adverse Health & Performance Effects",
    hrpRiskSummary:
      "In a closed spacecraft or station, even mild CO2 elevations (1,000–2,000 ppm) combined with cephalad fluid shifts increase cerebral blood flow, triggering headaches and slower cognitive reaction times.",
    ongoingResearchCountermeasure:
      "Personal crew ventilation fans in sleep quarters and Carbon Dioxide Removal Assembly (CDRA) scrubber verification.",
    referenceLinks: [
      { title: "NASA HRP Hostile Environment Hazards", url: "https://www.nasa.gov/hrp/hazards/" },
      { title: "NASA HRP CO2 Exposure Risks", url: "https://www.nasa.gov/hrp/risks/" },
    ],
  },

  bp: {
    metric: "bp",
    primaryHazard: "G",
    secondaryHazard: "D",
    officialHrpRiskName:
      "Risk of Spaceflight Associated Neuro-ocular Syndrome (SANS)",
    hrpRiskSummary:
      "In microgravity, roughly 2 liters of fluid shift from the lower body toward the head, altering vascular pressure and flattening the back of the eyeball.",
    ongoingResearchCountermeasure:
      "Lower Body Negative Pressure (LBNP) device sessions and thigh occlusion cuffs (Braslet/Chibis) to draw fluid back toward the legs.",
    referenceLinks: [
      { title: "NASA HRP SANS & Gravity Risks", url: "https://www.nasa.gov/hrp/risks/" },
      { title: "Ongoing HRP SANS Countermeasures", url: "https://www.nasa.gov/hrp/ongoing-hrp-research/" },
    ],
  },

  glo: {
    metric: "glo",
    primaryHazard: "I",
    secondaryHazard: "R",
    officialHrpRiskName:
      "Risk of Inadequate Nutrition & Subclinical Insulin Resistance",
    hrpRiskSummary:
      "NASA HRP studies reveal that muscle unloading, radiation oxidative stress, and 90-minute orbital sunrise/sunset cycles impair glucose uptake.",
    ongoingResearchCountermeasure:
      "Dynamic circadian solid-state lighting schedules and nutrient-dense low-glycemic ration packs.",
    referenceLinks: [
      { title: "NASA HRP Ongoing Research", url: "https://www.nasa.gov/hrp/ongoing-hrp-research/" },
      { title: "NASA HRP Nutrition & Metabolism Risks", url: "https://www.nasa.gov/hrp/risks/" },
    ],
  },
};