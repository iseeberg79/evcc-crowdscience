import * as z from "zod";

import { getTimeRangeDefaults } from "~/constants";

export const instancesFilterSchema = z
  .object({
    id: z.string().optional(),
    updatedWithinHours: z.number().optional(),
    chargingBehaviour: z
      .enum(["daily", "multiplePerWeek", "weekly", "rarely"])
      .array()
      .optional(),
    pvPower: z.array(z.number()).optional(),
    loadpointPower: z.array(z.number()).optional(),
  })
  .meta({
    examples: [
      {
        id: "018f3d4a-5b6c-7d8e-af01-23456789abcd",
        updatedWithinHours: 24,
        chargingBehaviour: ["daily", "weekly"],
      },
    ],
  });

export const instanceIdsFilterSchema = z
  .object({
    instanceIds: z.array(z.string()).optional(),
  })
  .meta({
    examples: [{ instanceIds: ["id1", "id2"] }, {}],
  });

export const timeRangeRequiredSchema = z
  .object({
    start: z.number().describe("Start timestamp in milliseconds"),
    end: z.number().describe("End timestamp in milliseconds"),
    windowMinutes: z
      .number()
      .describe("Window size in minutes for aggregation"),
  })
  .meta({
    examples: [{ start: 1700000000000, end: 1700086400000, windowMinutes: 60 }],
  });

export const timeRangeUrlSchema = timeRangeRequiredSchema
  .partial()
  .optional()
  .meta({
    examples: [{ start: 1700000000000 }, {}],
  });
export type UrlTimeRange = z.infer<typeof timeRangeUrlSchema>;

export const timeRangeInputSchema = timeRangeUrlSchema
  .default({})
  .transform((data) => {
    const defaults = getTimeRangeDefaults();
    return {
      start: new Date(data.start ?? defaults.start),
      end: new Date(data.end ?? defaults.end),
      windowMinutes: data.windowMinutes ?? defaults.windowMinutes,
    };
  });
export type TimeRangeInput = z.infer<typeof timeRangeInputSchema>;

export type TimeSeriesData<TValue extends number | string | boolean | null> = {
  value: TValue;
  timeStamp: number;
};

export type WindowedTimeSeriesData<
  TValue extends number | string | boolean | null,
> = TimeSeriesData<TValue> & {
  startTimeStamp: number;
  endTimeStamp: number;
};

export const singleInstanceRouteSearchSchema = z
  .object({
    expandedKey: z.string().optional(),
    timeRange: timeRangeUrlSchema,
    chartTopic: z.string().default("pv"),
    chartTopicField: z.string().optional(),
  })
  .meta({
    examples: [
      {
        chartTopic: "pv",
        timeRange: { start: 1700000000000 },
      },
    ],
  });
