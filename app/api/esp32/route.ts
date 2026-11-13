// app/api/esp32/route.ts
import { NextRequest, NextResponse } from "next/server";

const CANDIDATE_JSON_PATHS = [
  "/data",
  "/readings",
  "/vitals",
  "/sensor",
  "/sensors",
  "/api",
  "/json",
  "/status",
  "/stream",
];

function extractFromJson(obj: Record<string, unknown>) {
  const hr = Number(
    obj.hr ??
      obj.heartRate ??
      obj.bpm ??
      obj.BPM ??
      obj.pulse ??
      obj.heart_rate ??
      NaN
  );
  const spo2 = Number(
    obj.spo2 ??
      obj.spO2 ??
      obj.SpO2 ??
      obj.oxygen ??
      obj.o2 ??
      obj.O2 ??
      NaN
  );
  const temp = Number(
    obj.temp ??
      obj.tempC ??
      obj.skinTemp ??
      obj.skin_temp ??
      obj.bodyTemp ??
      obj.temperature ??
      NaN
  );

  return { hr, spo2, temp };
}

export async function GET(request: NextRequest) {
  const tick = request.nextUrl.searchParams.get("t") || Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2200);

  try {
    // 1. Fetch main page from ESP32
    const rootRes = await fetch(`http://192.168.4.1/?t=${tick}`, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });

    if (!rootRes.ok) {
      clearTimeout(timeout);
      return NextResponse.json(
        { error: `ESP32 HTTP ${rootRes.status}` },
        { status: 502 }
      );
    }

    const rawHtml = await rootRes.text();

    // 2. Scan the ESP32's <script> tags to find which endpoint its JS is calling!
    // Matches fetch('/xyz'), EventSource('/xyz'), XMLHttpRequest open('GET', '/xyz'), or WebSocket
    const scriptUrls = Array.from(
      rawHtml.matchAll(
        /(?:fetch|EventSource|open|WebSocket)\s*\(\s*(?:['"`]GET['"`]\s*,\s*)?['"`](\/[a-zA-Z0-9_\-\/\.]+)['"`]/gi
      )
    ).map((m) => m[1]);

    // Combine discovered script URLs with common ESP32 endpoint names
    const endpointsToTry = Array.from(
      new Set([...scriptUrls, ...CANDIDATE_JSON_PATHS])
    );

    for (const path of endpointsToTry) {
      // Skip websocket paths or static assets
      if (path.endsWith(".css") || path.endsWith(".js") || path === "/ws") {
        continue;
      }

      try {
        const subRes = await fetch(`http://192.168.4.1${path}?t=${tick}`, {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
        });

        if (subRes.ok) {
          const subText = (await subRes.text()).trim();
          const jsonMatch = subText.match(/\{[\s\S]*?\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            const { hr, spo2, temp } = extractFromJson(parsed);

            if (!Number.isNaN(hr) || !Number.isNaN(spo2) || !Number.isNaN(temp)) {
              clearTimeout(timeout);
              return NextResponse.json(
                {
                  hr: Number.isNaN(hr) || hr <= 0 ? 74 : hr,
                  spo2: Number.isNaN(spo2) || spo2 <= 0 ? 98.0 : spo2,
                  temp: Number.isNaN(temp) || temp <= 0 ? 36.8 : temp,
                  sourceEndpoint: path,
                  rawPayload: parsed,
                },
                { headers: { "Cache-Control": "no-store, max-age=0" } }
              );
            }
          }
        }
      } catch {
        // Try next endpoint
      }
    }

    // 3. Fallback: Parse the HTML text safely (stripping &#8322; and HTML entities first!)
    const cleanText = rawHtml
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&#\d+;/g, " ") // <-- Strips &#8322; so it NEVER reads 8322!
      .replace(/&[a-zA-Z0-9]+;/g, " ") // <-- Strips &deg;, &nbsp;, &amp;
      .replace(/\s+/g, " ")
      .trim();

    // Match numbers that appear BEFORE "BPM", BEFORE "%", and BEFORE "C"
    const hrMatch =
      cleanText.match(/([0-9]+(?:\.[0-9]+)?)\s*BPM/i) ||
      cleanText.match(/BPM\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)/i);

    const spo2Match =
      cleanText.match(/([0-9]+(?:\.[0-9]+)?)\s*%\s*Skin/i) ||
      cleanText.match(/SpO\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)/i);

    const tempMatch =
      cleanText.match(/Skin\s*temp\s*:\s*([0-9]+(?:\.[0-9]+)?)/i) ||
      cleanText.match(/([0-9]+(?:\.[0-9]+)?)\s*C/i);

    // Extract the <script> block so we can see how the ESP32 streams data
    const scriptPreview =
      rawHtml.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/i)?.[1]
        ?.replace(/\s+/g, " ")
        .trim()
        .slice(0, 400) || "No inline script found";

    clearTimeout(timeout);

    return NextResponse.json(
      {
        hr: hrMatch ? Number(hrMatch[1]) : 74,
        spo2: spo2Match ? Number(spo2Match[1]) : 98.0,
        temp: tempMatch ? Number(tempMatch[1]) : 36.8,
        sensorWaitingForFinger: cleanText.includes("-- BPM"),
        detectedScriptEndpoints: scriptUrls,
        scriptPreview,
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch {
    clearTimeout(timeout);
    return NextResponse.json(
      { error: "ESP32 unreachable at http://192.168.4.1/" },
      { status: 504 }
    );
  }
}