"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useHealthStore } from "@/store/useHealthStore";
import { manualVitalsSchema, type ManualVitals } from "@/lib/validations";
import { clock } from "@/lib/utils";
import { Panel, button } from "@/components/ui";

const FIELDS: { name: keyof ManualVitals; label: string; step?: number }[] = [
  { name: "bpSys", label: "Systolic (mmHg)" },
  { name: "bpDia", label: "Diastolic (mmHg)" },
  { name: "glo", label: "Glucose (mg/dL)" },
  { name: "co2", label: "Cabin CO₂ (ppm)", step: 10 },
];

export default function ManualLog() {
  const { vitals, logManual } = useHealthStore();
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ManualVitals>({
    resolver: zodResolver(manualVitalsSchema),
    defaultValues: { bpSys: vitals.bpSys, bpDia: vitals.bpDia, glo: vitals.glo, co2: vitals.co2 },
  });

  const error = Object.values(errors)[0]?.message;

  return (
    <Panel title="Log a reading" aside={savedAt && `saved ${savedAt}`}>
      <form
        onSubmit={handleSubmit((data) => {
          logManual(data);
          setSavedAt(clock());
        })}
      >
        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map((f) => (
            <label key={f.name} className="text-xs text-zinc-400">
              {f.label}
              <input
                type="number"
                step={f.step ?? 1}
                {...register(f.name, { valueAsNumber: true })}
                className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 font-mono text-sm text-zinc-100 focus:border-zinc-400 focus:outline-none"
              />
            </label>
          ))}
        </div>
        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
        <button type="submit" className={`${button} mt-4 w-full`}>
          Save
        </button>
      </form>
    </Panel>
  );
}
