"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bluetooth, Send, Sparkles } from "lucide-react";
import { useHealthStore } from "@/store/useHealthStore";
import {
  manualVitalsSchema,
  ManualVitalsFormValues,
} from "@/lib/validations";
import { generateSimulatedCrewInput } from "@/lib/esp32Client";

export default function CrewInputPanel() {
  const { vitals, environment, logCrewManualVitals } = useHealthStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ManualVitalsFormValues>({
    resolver: zodResolver(manualVitalsSchema),
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

  const handleSimulatedBleSync = () => {
    const sim = generateSimulatedCrewInput(environment);
    setValue("bpSys", sim.bpSys, { shouldValidate: true });
    setValue("bpDia", sim.bpDia, { shouldValidate: true });
    setValue("glo", sim.glo, { shouldValidate: true });
    setValue("co2", sim.co2, { shouldValidate: true });
    logCrewManualVitals(sim.bpSys, sim.bpDia, sim.glo, sim.co2);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
            Crew Routine Input
          </h3>
          <p className="font-mono text-[11px] text-slate-400">
            Manual Cuff, Glucometer & Cabin CO2 Log (+XP)
          </p>
        </div>

        <button
          type="button"
          onClick={handleSimulatedBleSync}
          className="flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 font-mono text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
        >
          <Bluetooth size={13} />
          <span>Auto-Sync BLE</span>
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* 1. Systolic BP Slider + Input */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300">Systolic BP</span>
              <span className="font-mono font-bold text-cyan-400">
                {watched.bpSys} mmHg
              </span>
            </div>
            <input
              type="range"
              min={75}
              max={190}
              {...register("bpSys")}
              className="mt-2 h-1.5 w-full cursor-pointer accent-cyan-400"
            />
          </div>

          {/* 2. Diastolic BP Slider + Input */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300">Diastolic BP</span>
              <span className="font-mono font-bold text-cyan-400">
                {watched.bpDia} mmHg
              </span>
            </div>
            <input
              type="range"
              min={45}
              max={125}
              {...register("bpDia")}
              className="mt-2 h-1.5 w-full cursor-pointer accent-cyan-400"
            />
          </div>

          {/* 3. Blood Glucose (GLO) Slider */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300">
                Glucose (GLO)
              </span>
              <span className="font-mono font-bold text-emerald-400">
                {watched.glo} mg/dL
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={200}
              {...register("glo")}
              className="mt-2 h-1.5 w-full cursor-pointer accent-emerald-400"
            />
          </div>

          {/* 4. Cabin CO2 Slider */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300">Cabin CO2</span>
              <span className="font-mono font-bold text-amber-400">
                {watched.co2} ppm
              </span>
            </div>
            <input
              type="range"
              min={400}
              max={3000}
              step={25}
              {...register("co2")}
              className="mt-2 h-1.5 w-full cursor-pointer accent-amber-400"
            />
          </div>
        </div>

        {/* Validation Error Toast if Systolic <= Diastolic */}
        {(errors.bpSys || errors.bpDia || errors.glo || errors.co2) && (
          <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300">
            {errors.bpSys?.message ||
              errors.bpDia?.message ||
              errors.glo?.message ||
              errors.co2?.message}
          </p>
        )}

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition hover:brightness-110"
        >
          <Send size={14} />
          <span>Log Crew Vitals</span>
          <span className="flex items-center gap-0.5 rounded bg-slate-950/20 px-1.5 py-0.5 font-mono text-[10px]">
            <Sparkles size={10} /> +25 XP
          </span>
        </button>
      </form>
    </div>
  );
}