// lib/validations.ts
import { z } from "zod";

export const manualVitalsSchema = z
  .object({
    bpSys: z.coerce
      .number({ error: "Enter a numeric Systolic pressure value." })
      .int("Systolic pressure must be a whole number.")
      .min(60, "Systolic reading below 60 mmHg indicates sensor error.")
      .max(240, "Systolic reading exceeds 240 mmHg limit."),

    bpDia: z.coerce
      .number({ error: "Enter a numeric Diastolic pressure value." })
      .int("Diastolic pressure must be a whole number.")
      .min(35, "Diastolic reading below 35 mmHg is outside valid range.")
      .max(150, "Diastolic reading exceeds 150 mmHg limit."),

    glo: z.coerce
      .number({ error: "Enter a numeric Blood Glucose reading." })
      .min(30, "Glucose reading below 30 mg/dL is outside range.")
      .max(400, "Glucose reading exceeds 400 mg/dL limit."),

    // إضافة CO2 كإدخال يدوي من شاشة الكابينة
    co2: z.coerce
      .number({ error: "Enter ambient cabin CO2 level in ppm." })
      .int("CO2 level must be a whole number.")
      .min(300, "CO2 reading cannot be below 300 ppm.")
      .max(5000, "CO2 reading exceeds 5000 ppm sensor scale."),

    notes: z.string().max(160).optional(),
  })
  .refine((data) => data.bpSys > data.bpDia + 10, {
    message: "Systolic pressure must be at least 10 mmHg higher than Diastolic.",
    path: ["bpSys"],
  });

export type ManualVitalsFormValues = z.infer<typeof manualVitalsSchema>;