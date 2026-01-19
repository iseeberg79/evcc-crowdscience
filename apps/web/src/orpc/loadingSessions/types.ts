import z from "zod";

import type { interestingSessionFields } from "./extractRanges";

export const extractedSessionRangeSchema = z
  .object({
    startTime: z.number().describe("Session start timestamp in milliseconds"),
    endTime: z.number().describe("Session end timestamp in milliseconds"),
    componentId: z.string().describe("Unique component ID (e.g. lp-1)"),
    instanceId: z.string().describe("Unique instance identifier (UUIDv7)"),
  })
  .meta({
    examples: [
      {
        startTime: 1704110400000,
        endTime: 1704117600000,
        componentId: "lp-1",
        instanceId: "018f3d4a-5b6c-7d8e-af01-23456789abcd",
      },
    ],
  });

export type ExtractedSessionRange = z.infer<typeof extractedSessionRangeSchema>;

type InterestingFields = typeof interestingSessionFields;
type GroupTypes = keyof InterestingFields;
type FieldsByGroup<G extends GroupTypes> = InterestingFields[G][number];

export type ExtractedFields = Partial<{
  [G in GroupTypes]: Record<FieldsByGroup<G>, number | string | boolean | null>;
}>;

export const extractedSessionSchema = z
  .object({
    id: z.string().describe("Internal session ID"),
    sessionRangeHash: z
      .string()
      .describe("Unique hash identifying this session's time range"),
    instanceId: z.string().describe("Unique instance identifier"),
    startTime: z.coerce
      .number()
      .describe("Session start timestamp in milliseconds"),
    endTime: z.coerce
      .number()
      .describe("Session end timestamp in milliseconds"),
    duration: z.number().describe("Session duration in seconds"),
    componentId: z.string().describe("Component ID (e.g. loadpoint)"),
    startSoc: z.number().nullish().describe("State of charge at start in %"),
    endSoc: z.number().nullish().describe("State of charge at end in %"),
    startRange: z.number().nullish().describe("Vehicle range at start in km"),
    endRange: z.number().nullish().describe("Vehicle range at end in km"),
    limitSoc: z.number().nullish().describe("Set SOC limit in %"),
    chargedEnergy: z.number().nullish().describe("Energy charged in kWh"),
    sessionEnergy: z.number().nullish().describe("Total session energy in kWh"),
    maxChargePower: z.number().nullish().describe("Maximum charge power in W"),
    maxPhasesActive: z
      .number()
      .nullish()
      .describe("Maximum number of active phases"),
    mode: z.string().nullish().describe("Charge mode (e.g. 'pv', 'now')"),
    price: z.number().nullish().describe("Total session price"),
    solarPercentage: z.number().nullish().describe("Solar energy percentage"),
    sessionCo2PerKWh: z.number().nullish().describe("Average CO2 per kWh"),
  })
  .meta({
    examples: [
      {
        id: "sess_1",
        sessionRangeHash: "abc123hash",
        instanceId: "018f3d4a-5b6c-7d8e-af01-23456789abcd",
        startTime: 1704110400000,
        endTime: 1704117600000,
        duration: 7200,
        componentId: "lp-1",
        chargedEnergy: 11.5,
        mode: "pv",
      },
    ],
  });

export type ExtractedSession = z.infer<typeof extractedSessionSchema>;

export const csvImportLoadingSessionSchema = z
  .object({
    id: z.string().describe("Internal import ID"),
    instanceId: z.string().describe("Unique instance identifier"),
    startTime: z.coerce
      .number()
      .describe("Session start timestamp in milliseconds"),
    endTime: z.coerce
      .number()
      .describe("Session end timestamp in milliseconds"),
    startKwh: z.number().nullish().describe("Meter reading at start in kWh"),
    endKwh: z.number().nullish().describe("Meter reading at end in kWh"),
    kilometers: z.number().nullish().describe("Vehicle odometer reading in km"),
    loadpoint: z.string().nullish().describe("Loadpoint name"),
    vehicle: z.string().nullish().describe("Vehicle name"),
    energy: z.number().nullish().describe("Charged energy in kWh"),
    duration: z.number().nullish().describe("Duration in seconds"),
  })
  .meta({
    examples: [
      {
        id: "imp_1",
        instanceId: "018f3d4a-5b6c-7d8e-af01-23456789abcd",
        startTime: 1704110400000,
        endTime: 1704117600000,
        energy: 15.0,
        vehicle: "Model 3",
      },
    ],
  });

export type CsvImportLoadingSession = z.infer<
  typeof csvImportLoadingSessionSchema
>;
