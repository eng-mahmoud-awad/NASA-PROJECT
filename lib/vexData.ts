// lib/vexData.ts
import {
  MetricKey,
  MissionEnvironment,
  WebsiteSectionId,
} from "@/store/useHealthStore";
import { NtnOrbitMode } from "@/lib/ntnLayer";

export interface TutorialStepSpec {
  step: number;
  id: WebsiteSectionId;
  domId: string;
  shortLabel: string;
  title: string;
  code: string;
  sectionIdentification: string;
  vexStory: string;
  vexInstruction: string;
  vexWarning: string;
  focusMetric?: MetricKey;
}

export interface VexStoryChapter {
  chapter: number;
  actTitle: string;
  subtitle: string;
  locationBadge: string;
  targetSectionId: WebsiteSectionId;
  targetDomId: string;
  env: MissionEnvironment;
  orbitMode?: NtnOrbitMode;
  metricFocus: MetricKey;
  storyNarrative: (vitals: {
    hr: number;
    spo2: number;
    temp: number;
    co2: number;
    bpSys: number;
    bpDia: number;
    glo: number;
  }) => string;
  vexInstruction: string;
  vexWarning: string;
  astronautReply: string;
}

export const WEBSITE_TUTORIAL_STEPS: TutorialStepSpec[] = [
  {
    step: 1,
    id: "mission-header",
    domId: "mission-header",
    shortLabel: "1. Header & Habitat",
    title: "Mission Control Header & Habitat Selector",
    code: "SECTION 01/07 · TOP HELM & GRAVITY PROFILE",
    sectionIdentification:
      "Located sticky at the very top of the console. Contains the Mission Elapsed Time (MET) clock, section jump links, overall crew status dot, readiness percentage bar, scenario injector, Habitat gravity selector (Transit 0g, Station 0g, Rover 0.16g, Base 0.38g), and ESP32 node IP.",
    vexStory:
      "I wired this top helm into your ship's navigation computer. Human physiology changes drastically between 0g orbit and a 0.16g lunar rover—switching habitats here lets me recalibrate your biological safety thresholds automatically.",
    vexInstruction:
      "Select your current Habitat Environment on the lower-left segmented bar, check your Readiness % in the top-right, or click the IP address to connect a physical ESP32-S3 sensor node.",
    vexWarning:
      "Using 0g Station thresholds while inside a cramped Surface Rover or Planetary Base will fail to catch early CO₂ buildup or post-EVA dust hypoxia.",
    focusMetric: "hr",
  },
  {
    step: 2,
    id: "vex-bridge",
    domId: "vex-bridge",
    shortLabel: "2. Vex Command Bridge",
    title: "Commander Vex — Main Story, Tutorial & Warning Bridge",
    code: "SECTION 02/07 · XENO-MEDICAL AI CO-PILOT",
    sectionIdentification:
      "The primary command deck right below the header. Left side houses my live avionics hologram and 6-channel quick-scan radar; right side holds the 5-Act Story Campaign, this 7-Section Website Tutorial, Live Guardian warnings, 0g Sensor Coach, and Emergency Drills.",
    vexStory:
      "I am Commander Zyx-9 ('Vex'), your Xeno-Medical Flight Surgeon and lead narrator. Because radio signals to Earth take up to 20 minutes in deep space, I ride inside your suit telemetry loop to guide our story and protect your life in real time.",
    vexInstruction:
      "Use the top segmented tabs to switch between our 5-Chapter Story Campaign, this 7-Section Website Tutorial, 0g Sensor Instructions, and Emergency Hazard Drills.",
    vexWarning:
      "Whenever any vital enters CAUTION (Amber) or CRITICAL (Red)—or if satellite link is lost—I will automatically switch to Live Guardian mode and issue emergency countermeasure orders.",
    focusMetric: "hr",
  },
  {
    step: 3,
    id: "vitals",
    domId: "vitals",
    shortLabel: "3. Vitals Grid (6 Ch)",
    title: "6-Channel Real-Time Vitals Telemetry Grid",
    code: "SECTION 03/07 · PRIMARY BIOMETRIC CHANNELS",
    sectionIdentification:
      "A 6-card horizontal grid displaying Heart Rate (HR), Blood Oxygen (SpO₂), Core Temperature (TEMP), Blood Pressure (BP), Glucose (GLO), and Cabin CO₂. Each card shows its source (Sensor vs Crew log), hotkey number (1–6), live reading, 12-sample mini bar sparkline, and status label.",
    vexStory:
      "Think of these six cards as the instrument cluster of your body. Channels 1–3 stream every 2 seconds from your wearable ESP32 I2C sensors; Channels 4–6 combine cuff, glucometer, and ambient gas logs into a single risk matrix.",
    vexInstruction:
      "Click any card (or press keys 1–6 on your keyboard) to select that channel. Selecting a channel updates the Trend Waveform, Spacesuit Sensor Map, and my 0g Measurement Coach.",
    vexWarning:
      "Watch for cards whose border turns Amber or Red—never ignore an abnormal status dot, especially SpO₂ drops below 95% or CO₂ spikes above 1,000 ppm.",
    focusMetric: "spo2",
  },
  {
    step: 4,
    id: "trend",
    domId: "trend",
    shortLabel: "4. Trend & Quests",
    title: "Live Telemetry Waveform & Crew Readiness Tasks",
    code: "SECTION 04/07 · TEMPORAL TREND & GAMIFIED PROTOCOLS",
    sectionIdentification:
      "Split into two panels: Left (8 cols) is the SVG time-series chart plotting your last 30 readings against a shaded green safe corridor; Right (4 cols) is the Crew Tasks checklist with XP progress, mission level, streak, and unlockable badges.",
    vexStory:
      "A single normal number can hide a slow, deadly drift. By plotting your last 30 telemetry ticks against NASA's green safe band, we spot microgravity deconditioning early—while daily quests keep your readiness score near 100%.",
    vexInstruction:
      "Use the metric switcher in the chart header to compare waveforms across channels, and click any uncompleted task under 'Crew tasks' on the right to earn XP and raise Crew Readiness.",
    vexWarning:
      "If the plotted line trends toward the dashed upper or lower safe boundary over multiple ticks, initiate preventive hydration or airflow adjustments before an alarm sounds.",
    focusMetric: "co2",
  },
  {
    step: 5,
    id: "sensor-map",
    domId: "sensor-map",
    shortLabel: "5. Suit Sensor Map",
    title: "Anatomical Spacesuit Sensor Map & NASA HRP Guide",
    code: "SECTION 05/07 · BIOMEDICAL HARDWARE TOPOLOGY",
    sectionIdentification:
      "The left panel of the middle row ('Sensor map'). Shows an interactive spacesuit silhouette with 6 clickable sensor nodes (CO₂ on helmet, O₂/HR on chest, BP on arm, TEMP/GLO on core), plus a 'How to measure' overlay and official NASA HRP hazard citations.",
    vexStory:
      "In microgravity, fluids shift upward and sensors slip if not anchored properly. I mapped all six hardware nodes onto your suit diagram and linked each one to NASA's Human Research Program (RIDGE) hazard database.",
    vexInstruction:
      "Click any node on the suit diagram to inspect that organ system, and click the 'How to measure' button in the top-right of the panel for step-by-step 0g sensor placement instructions.",
    vexWarning:
      "Pressing too hard on the MAX30102 optical sensor or holding the BP cuff below heart level in 0g will corrupt your telemetry readings.",
    focusMetric: "bp",
  },
  {
    step: 6,
    id: "crew-log-link",
    domId: "crew-log-link",
    shortLabel: "6. Crew Log & NTN Link",
    title: "Manual Crew Reading Log & CCSDS-DTN Satellite Relay",
    code: "SECTION 06/07 · PERIPHERAL LOGGING & DEEP-SPACE COMMS",
    sectionIdentification:
      "The center and right panels of the middle row: 'Log crew readings' (range sliders for Systolic BP, Diastolic BP, Glucose, and Cabin CO₂ + BLE sync) and 'Telemetry link' (Orbit relay selector + CCSDS-DTN Store-and-Forward blackout queue).",
    vexStory:
      "When our spacecraft passes behind the far side of the Moon, 3,200 km of rock blocks our signal to Earth. Here you log peripheral medical readings and watch my CCSDS-DTN bundle buffer store every packet until signal returns.",
    vexInstruction:
      "Drag the sliders and click 'Save reading (+25 XP)' or 'Simulate BLE sync' to log vitals. In the Telemetry Link panel, click 'Simulate signal loss' to test autonomous DTN packet buffering.",
    vexWarning:
      "During a satellite blackout ('No signal, buffering'), Earth flight surgeons cannot monitor you—rely on my onboard autonomous warnings until you click 'Restore signal'.",
    focusMetric: "glo",
  },
  {
    step: 7,
    id: "countermeasures",
    domId: "countermeasures",
    shortLabel: "7. Countermeasures",
    title: "Countermeasures & Symptom Check (Oslo Pulse Protocol)",
    code: "SECTION 07/07 · ACTIVE MEDICAL INTERVENTIONS",
    sectionIdentification:
      "The 4-column bottom deck ('Countermeasures and symptom check') containing four specialized modules: (1) Hypoxia & 10-second reaction test, (2) Cardiovascular paced breathing, (3) Bone loss ARED exercise checklist, and (4) Radiation dosimeter & symptom sliders.",
    vexStory:
      "Telemetry only saves lives when paired with countermeasures. This final deck is where we test your brain's psychomotor speed for early hypoxia, pace your breathing to lower 0g heart rate, log ARED bone workouts, and track radiation mSv.",
    vexInstruction:
      "Click 'Start' in the Hypoxia module to run the 10-second reaction test, check off your 2h ARED exercise under Bone Loss, and update your radiation badge reading and symptom sliders.",
    vexWarning:
      "If average reaction time exceeds 550 ms, SpO₂ drops below the 92% dashed floor, or Nausea/Fatigue/Radiation cross safety limits, report to the flight surgeon immediately.",
    focusMetric: "spo2",
  },
];

export const VEX_STORY_CHAPTERS: VexStoryChapter[] = [
  {
    chapter: 1,
    actTitle: "Act I: First Contact in Low Orbit",
    subtitle: "Linking Commander Vex to Your Wearable ESP32 Biometrics",
    locationBadge: "ACT 01/05 · ORBITAL STATION (0g) · SECTION: VITALS GRID",
    targetSectionId: "vitals",
    targetDomId: "vitals",
    env: "station",
    orbitMode: "LEO_RELAY",
    metricFocus: "hr",
    storyNarrative: (v) =>
      `Greetings, Astronaut. I am Commander Zyx-9—"Vex," your Xeno-Medical AI co-pilot. My scout ship intercepted your telemetry beacon entering orbital insertion. Human bodies were built for 1g Earth gravity: up here, your heart unloads, fluids shift toward your head, and Earth can't rescue you in real time. I've linked my neural core directly into your suit's ESP32-S3 sensors (current HR: ${v.hr} BPM, SpO₂: ${v.spo2}%).`,
    vexInstruction:
      "Inspect Section 03 (Vitals Grid) below: click the HR card (or press Key 1) and keep your fingertip resting lightly on the MAX30102 optical window.",
    vexWarning:
      "Never press too hard on the optical pulse sensor—squeezing capillary blood out of your fingertip skews both HR and SpO₂ readings.",
    astronautReply: "Lock HR Telemetry & Advance to Act II →",
  },
  {
    chapter: 2,
    actTitle: "Act II: The Invisible 0g CO₂ Bubble",
    subtitle: "Detecting Stagnant Air Pockets on the Trend Waveform",
    locationBadge: "ACT 02/05 · SLEEP QUARTERS (0g) · SECTION: TREND & QUESTS",
    targetSectionId: "trend",
    targetDomId: "trend",
    env: "station",
    orbitMode: "LEO_RELAY",
    metricFocus: "co2",
    storyNarrative: (v) =>
      `Night cycle on the station. On Earth, warm exhaled breath rises away from your face. In 0g microgravity, convection vanishes—every breath you exhale forms a stagnant bubble of CO₂ around your helmet or bunk (currently ${v.co2} ppm). Let's check the Trend Waveform in Section 04 to ensure your CO₂ curve stays inside the shaded green corridor.`,
    vexInstruction:
      "Check Section 04 (Trend & Crew Tasks): verify Cabin CO₂ stays below 1,000 ppm inside the green band, and check off 'Verify Habitat CO2 Scrubber & Airflow' in Crew Tasks.",
    vexWarning:
      "CO₂ above 1,000–1,500 ppm in 0g dilates cerebral blood vessels, causing morning headaches and dangerous cognitive slowdown during docking maneuvers.",
    astronautReply: "Verify CO₂ Trend & Enter Act III →",
  },
  {
    chapter: 3,
    actTitle: "Act III: Shadow of the Far Side",
    subtitle: "Cephalad Fluid Shift & Lunar Blackout DTN Buffering",
    locationBadge: "ACT 03/05 · CISLUNAR TRANSIT · SECTION: LOG & NTN LINK",
    targetSectionId: "crew-log-link",
    targetDomId: "crew-log-link",
    env: "spacecraft",
    orbitMode: "LUNAR_GATEWAY",
    metricFocus: "bp",
    storyNarrative: (v) =>
      `We are crossing behind the far side of the Moon! Two liters of blood have shifted from your legs toward your head (${v.bpSys}/${v.bpDia} mmHg), increasing pressure behind your eyes (SANS). At the same time, 3,200 km of lunar rock blocks our radio line-of-sight to Earth. In Section 06, my CCSDS-DTN Store-and-Forward buffer keeps every packet safe until AOS.`,
    vexInstruction:
      "Go to Section 06 (Crew Log & Telemetry Link): strap the BP cuff at exact heart level before saving a reading, and click 'Simulate signal loss' to test DTN packet spooling.",
    vexWarning:
      "If Systolic BP exceeds 135 mmHg in 0g, initiate a Lower Body Negative Pressure (LBNP) session to draw fluid back toward your lower extremities.",
    astronautReply: "Log Vascular BP & Descend to Act IV →",
  },
  {
    chapter: 4,
    actTitle: "Act IV: Red Dust on the Crater Floor",
    subtitle: "Post-EVA Regolith Screening & Oslo Pulse Countermeasures",
    locationBadge: "ACT 04/05 · PLANETARY BASE (0.38g) · SECTION: COUNTERMEASURES",
    targetSectionId: "countermeasures",
    targetDomId: "countermeasures",
    env: "base",
    orbitMode: "MARS_DSN",
    metricFocus: "spo2",
    storyNarrative: (v) =>
      `Touchdown at the surface habitat! You've just re-entered the airlock after a 4-hour surface walk. Razor-sharp electrostatic regolith dust clings to your suit—if ultrafine particles enter your lungs while doffing your helmet, your SpO₂ (${v.spo2}%) will drop while cosmic radiation bombards the surface. Let's run our active countermeasures in Section 07.`,
    vexInstruction:
      "Scroll to Section 07 (Countermeasures): run the 10-second Hypoxia reaction test, check off your 2h ARED bone exercise, and update your radiation dosimeter badge.",
    vexWarning:
      "Any post-EVA SpO₂ drop below 92% or reaction time slower than 550 ms signals acute dust inhalation or hypoxia—don 100% O₂ immediately.",
    astronautReply: "Complete Surface Checks & Face Act V Final Trial →",
  },
  {
    chapter: 5,
    actTitle: "Act V: Solar Storm Emergency Qualification",
    subtitle: "Live Red-Alert Bio-Hazard Response with Commander Vex",
    locationBadge: "ACT 05/05 · RED ALERT DRILL · SECTION: ALL SYSTEMS",
    targetSectionId: "vex-bridge",
    targetDomId: "vex-bridge",
    env: "base",
    orbitMode: "MARS_DSN",
    metricFocus: "spo2",
    storyNarrative: () =>
      `Final qualification trial, Astronaut! A coronal mass ejection just struck our sector while an airlock pressure drop triggered an EVA Hypoxia crisis. When a real emergency hits, my ocular reticles lock onto the failing channel, every section banner turns crimson/amber, and I issue immediate life-saving countermeasure directives.`,
    vexInstruction:
      "Click the button below to trigger the live EVA Hypoxia emergency scenario—then follow my warning callouts across the console to stabilize the crew back to Nominal!",
    vexWarning:
      "During a RED alert, prioritize airway oxygen (SpO₂ < 92%) and tachycardia (HR > 110 BPM) before secondary tasks—use my 1-click countermeasure button to stabilize.",
    astronautReply: "Trigger Live EVA Hypoxia Trial & Test Warnings",
  },
];
