// lib/ntnLayer.ts

export type NtnOrbitMode =
  | "DIRECT_LOCAL"
  | "LEO_RELAY"
  | "LUNAR_GATEWAY"
  | "MARS_DSN";

export type LinkState = "AOS_LOCKED" | "DEGRADED" | "LOS_BLACKOUT";

export interface NtnTelemetryFrame {
  frameId: string;
  sequenceNumber: number;
  orbitMode: NtnOrbitMode;
  frequencyBand: "2.4GHz Local" | "Ku-Band (LEO)" | "Ka-Band (Lunar)" | "X-Band (DSN)";
  protocol: "HTTP/REST" | "3GPP-NTN-NB" | "CCSDS-DTN-BPv7";
  latencyMs: number;
  snrDb: number; // Signal-to-Noise Ratio (dB)
  packetLossPct: number;
  payloadBytes: number;
  linkState: LinkState;
  txTimestamp: string;
  rxTimestamp: string;
  data: {
    hr: number;
    spo2: number;
    temp: number;
  };
}

export interface OrbitModeSpec {
  id: NtnOrbitMode;
  name: string;
  shortLabel: string;
  band: NtnTelemetryFrame["frequencyBand"];
  protocol: NtnTelemetryFrame["protocol"];
  baseLatencyMs: number;
  baseSnrDb: number;
  description: string;
}

export const NTN_ORBIT_SPECS: Record<NtnOrbitMode, OrbitModeSpec> = {
  DIRECT_LOCAL: {
    id: "DIRECT_LOCAL",
    name: "Direct Suit/Cabin Wi-Fi",
    shortLabel: "Local WLAN",
    band: "2.4GHz Local",
    protocol: "HTTP/REST",
    baseLatencyMs: 12,
    baseSnrDb: 42.0,
    description: "Direct intra-habitat link between ESP32 wearable node and crew console.",
  },
  LEO_RELAY: {
    id: "LEO_RELAY",
    name: "LEO Satellite Relay (TDRS/ISS)",
    shortLabel: "LEO 550km",
    band: "Ku-Band (LEO)",
    protocol: "3GPP-NTN-NB",
    baseLatencyMs: 65,
    baseSnrDb: 28.5,
    description: "Low-Earth Orbit non-terrestrial relay for orbital stations and capsules.",
  },
  LUNAR_GATEWAY: {
    id: "LUNAR_GATEWAY",
    name: "Lunar Gateway Relay (Artemis)",
    shortLabel: "Lunar 384k km",
    band: "Ka-Band (Lunar)",
    protocol: "CCSDS-DTN-BPv7",
    baseLatencyMs: 1280,
    baseSnrDb: 19.2,
    description: "Cislunar satellite relay bridging surface rovers/bases with Lunar Gateway.",
  },
  MARS_DSN: {
    id: "MARS_DSN",
    name: "Mars Orbiter + Deep Space Net",
    shortLabel: "Mars DSN",
    band: "X-Band (DSN)",
    protocol: "CCSDS-DTN-BPv7",
    baseLatencyMs: 2100, // Scaled for real-time interactive demo
    baseSnrDb: 12.4,
    description: "Deep-space DTN Bundle Protocol with store-and-forward queue during orbital blackout.",
  },
};

/**
 * تغليف قراءات الـ ESP32 الثلاث داخل حزمة اتصالات فضائية (CCSDS / NTN Frame)
 */
export function encapsulateNtnFrame(
  rawData: { hr: number; spo2: number; temp: number },
  orbitMode: NtnOrbitMode,
  sequenceNumber: number,
  forceBlackout: boolean = false
): NtnTelemetryFrame {
  const spec = NTN_ORBIT_SPECS[orbitMode];
  const now = new Date();

  // إضافة تذبذب واقعي في زمن التأخير وجودة الإشارة (SNR)
  const jitter = Math.round((Math.random() - 0.5) * (spec.baseLatencyMs * 0.15));
  const latencyMs = forceBlackout ? 0 : Math.max(5, spec.baseLatencyMs + jitter);

  const snrJitter = (Math.random() - 0.5) * 2.2;
  const snrDb = forceBlackout
    ? 0
    : Number(Math.max(3, spec.baseSnrDb + snrJitter).toFixed(1));

  let linkState: LinkState = "AOS_LOCKED";
  if (forceBlackout) {
    linkState = "LOS_BLACKOUT";
  } else if (snrDb < 14) {
    linkState = "DEGRADED";
  }

  const txTime = new Date(now.getTime() - latencyMs).toLocaleTimeString([], {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const rxTime = now.toLocaleTimeString([], {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return {
    frameId: `CCSDS-${orbitMode.slice(0, 3)}-${String(sequenceNumber).padStart(4, "0")}`,
    sequenceNumber,
    orbitMode,
    frequencyBand: spec.band,
    protocol: spec.protocol,
    latencyMs,
    snrDb,
    packetLossPct: forceBlackout ? 100 : orbitMode === "MARS_DSN" ? 1.8 : 0.1,
    payloadBytes: 64,
    linkState,
    txTimestamp: txTime,
    rxTimestamp: rxTime,
    data: rawData,
  };
}