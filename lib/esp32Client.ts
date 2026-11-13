// lib/esp32Client.ts
import { VitalsSnapshot, MissionEnvironment } from "@/store/useHealthStore";

export interface Esp32RawPayload {
  hr: number;
  spo2: number;
  temp: number;
}

/**
 * Fetches live sensor readings from http://192.168.4.1/
 * Uses the local Next.js proxy (/api/esp32) to bypass browser CORS issues.
 */
// Inside lib/esp32Client.ts -> replace fetchEsp32Telemetry with this:
export async function fetchEsp32Telemetry(): Promise<Esp32RawPayload> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2000);

  try {
    // ?t=Date.now() forces a fresh request every 2 seconds
    const response = await fetch(`/api/esp32?t=${Date.now()}`, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`ESP32 offline (${response.status})`);
    }

    const data = await response.json();

    return {
      hr: Number(data.hr ?? 75),
      spo2: Number(data.spo2 ?? 98.0),
      temp: Number(data.temp ?? 36.8),
    };
  } finally {
    clearTimeout(timer);
  }
}

export function simulateNextTelemetryTick(
  current: VitalsSnapshot
): Esp32RawPayload {
  const clamp = (val: number, min: number, max: number) =>
    Math.min(max, Math.max(min, val));

  const hrDelta = (Math.random() - 0.48) * 2.4;
  const spo2Delta = (Math.random() - 0.49) * 0.3;
  const tempDelta = (Math.random() - 0.5) * 0.06;

  return {
    hr: Math.round(clamp(current.hr + hrDelta, 52, 130)),
    spo2: Number(clamp(current.spo2 + spo2Delta, 88.0, 100.0).toFixed(1)),
    temp: Number(clamp(current.temp + tempDelta, 35.5, 39.2).toFixed(1)),
  };
}

export function generateSimulatedCrewInput(env: MissionEnvironment): {
  bpSys: number;
  bpDia: number;
  glo: number;
  co2: number;
} {
  const baseSys = env === "station" || env === "spacecraft" ? 121 : 115;
  const baseDia = env === "station" || env === "spacecraft" ? 79 : 74;
  const baseCo2 = env === "station" ? 890 : 720;

  return {
    bpSys: Math.round(baseSys + (Math.random() * 10 - 4)),
    bpDia: Math.round(baseDia + (Math.random() * 6 - 3)),
    glo: Math.round(89 + (Math.random() * 14 - 6)),
    co2: Math.round(baseCo2 + (Math.random() * 180 - 60)),
  };
}

export function exportTelemetryDownlinkPacket(payload: {
  environment: MissionEnvironment;
  readinessScore: number;
  vitals: VitalsSnapshot;
  history: VitalsSnapshot[];
}) {
  if (typeof window === "undefined") return;

  const report = {
    missionHeader: "NASA_SPACE_APPS_ASTRO_VITALS_DOWNLINK",
    exportedAtIso: new Date().toISOString(),
    habitatEnvironment: payload.environment,
    crewReadinessScore: `${payload.readinessScore}%`,
    sensorArchitecture: {
      esp32LiveSensors: ["hr (BPM)", "spo2 (%)", "temp (°C)"],
      crewManualInputs: [
        "bpSys (mmHg)",
        "bpDia (mmHg)",
        "glo (mg/dL)",
        "co2 (ppm)",
      ],
    },
    latestSnapshot: payload.vitals,
    historicalLogCount: payload.history.length,
    telemetryHistory: payload.history,
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `astro-vitals-downlink-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}