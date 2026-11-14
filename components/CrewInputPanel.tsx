"use client";

import React from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useHealthStore, HealthStatus } from "@/store/useHealthStore";
import { manualVitalsSchema, ManualVitalsFormValues } from "@/lib/validations";
import { generateSimulatedCrewInput } from "@/lib/esp32Client";
import { Panel, button, primaryButton } from "@/components/ui";
import VexSectionBanner from "@/components/VexSectionBanner";

const FIELDS = [
  {
    name: "bpSys",
    label: "Systolic BP",
    normal: "95–120",
    unit: "mmHg",
    min: 75,
    max: 190,
    step: 1,
  },
  {
    name: "bpDia",
    label: "Diastolic BP",
    normal: "60–80",
    unit: "mmHg",
    min: 45,
    max: 125,
    step: 1,
  },
  {
    name: "glo",
    label: "Glucose",
    normal: "70–100",
    unit: "mg/dL",
    min: 50,
    max: 200,
    step: 1,
  },
  {
    name: "co2",
    label: "Cabin CO₂",
    normal: "under 1000",
    unit: "ppm",
    min: 400,
    max: 3000,
    step: 25,
  },
] as const;

export default function CrewInputPanel() {
  const { vitals, environment, logCrewManualVitals } = useHealthStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ManualVitalsFormValues>({
    resolver: zodResolver(
      manualVitalsSchema
    ) as unknown as Resolver<ManualVitalsFormValues>,
    defaultValues: {
      bpSys: vitals.bpSys,
      bpDia: vitals.bpDia,
      glo: vitals.glo,
      co2: vitals.co2,
    },
  });

  const watched = watch();

  const onSubmit = (data: ManualVitalsFormValues) => {
    logCrewManualVitals(data.bpSys, data.bpDia, data.glo, data.co2);
  };

  const simulateBleSync = () => {
    const sim = generateSimulatedCrewInput(environment);
    setValue("bpSys", sim.bpSys, { shouldValidate: true });
    setValue("bpDia", sim.bpDia, { shouldValidate: true });
    setValue("glo", sim.glo, { shouldValidate: true });
    setValue("co2", sim.co2, { shouldValidate: true });
    logCrewManualVitals(sim.bpSys, sim.bpDia, sim.glo, sim.co2);
  };

  const error =
    errors.bpSys?.message ||
    errors.bpDia?.message ||
    errors.glo?.message ||
    errors.co2?.message;

  // Live Vex pre-submission check on watched slider values
  const draftSys = Number(watched.bpSys ?? vitals.bpSys);
  const draftCo2 = Number(watched.co2 ?? vitals.co2);
  const draftGlo = Number(watched.glo ?? vitals.glo);

  let draftStatus: HealthStatus = "GREEN";
  let draftWarning =
    "Hold BP cuff at exact heart level in 0g and switch on your bunk fan if CO₂ exceeds 1,000 ppm.";

  if (draftCo2 > 2000 || draftSys > 140 || draftGlo < 65 || draftGlo > 140) {
    draftStatus = "RED";
    draftWarning =
      draftCo2 > 2000
        ? `Draft CO₂ (${draftCo2} ppm) is in Hypercapnia range—activate LiOH scrubber and fan immediately!`
        : draftSys > 140
        ? `Draft Systolic BP (${draftSys} mmHg) indicates severe 0g cephalad fluid shift—prep LBNP protocol!`
        : `Draft Glucose (${draftGlo} mg/dL) is critical—check metabolic countermeasure pouch!`;
  } else if (draftCo2 > 1000 || draftSys > 125 || draftGlo > 105) {
    draftStatus = "YELLOW";
    draftWarning =
      draftCo2 > 1000
        ? `Draft CO₂ (${draftCo2} ppm) exceeds 1,000 ppm 0g ceiling—stagnant air pocket forming.`
        : `Draft reading is entering caution range—verify cuff/sensor positioning before logging.`;
  }

  return (
    <div className="flex h-full flex-col gap-2.5">
      <VexSectionBanner
        sectionId="crew-log-link"
        sectionBadge="SEC 06A · CREW PERIPHERAL LOG"
        status={draftStatus}
        compact
        instruction="Adjust sliders for cuff BP, glucometer, and cabin CO₂, then click 'Save reading' (+25 XP)."
        warning={draftWarning}
      />

      <Panel
        title="Log crew readings"
        aside="Cuff, glucometer, cabin CO₂"
        className="flex-1"
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex h-full flex-col gap-3"
        >
          {FIELDS.map((f) => (
            <label key={f.name} className="block">
              <span className="flex items-baseline justify-between text-sm">
                <span className="text-slate-200">
                  {f.label}{" "}
                  <span className="text-xs text-slate-500">
                    normal {f.normal}
                  </span>
                </span>
                <span className="font-tabular font-mono text-slate-50">
                  {watched[f.name]}{" "}
                  <span className="text-xs text-slate-400">{f.unit}</span>
                </span>
              </span>
              <input
                type="range"
                min={f.min}
                max={f.max}
                step={f.step}
                {...register(f.name)}
                className="mt-1.5 h-1.5 w-full cursor-pointer accent-sky-400"
              />
            </label>
          ))}

          {error && (
            <p role="alert" className="text-xs text-rose-400">
              {error}
            </p>
          )}

          <div className="mt-auto flex flex-wrap gap-2 pt-1">
            <button type="submit" className={primaryButton}>
              Save reading (+25 XP)
            </button>
            <button
              type="button"
              onClick={simulateBleSync}
              className={button}
            >
              Simulate BLE sync
            </button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
