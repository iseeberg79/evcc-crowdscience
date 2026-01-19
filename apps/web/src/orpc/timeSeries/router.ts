import { min } from "date-fns";
import * as z from "zod";

import { env } from "~/env";
import { timeRangeInputSchema } from "~/lib/globalSchemas";
import { buildFluxQuery, queryInflux } from "~/lib/influx-query";
import { possibleChartTopicsConfig } from "~/lib/time-series-config";
import { publicProcedure } from "../middleware";

const validChartTopics = Object.keys(possibleChartTopicsConfig);

export const timeSeriesRouter = {
  getData: publicProcedure
    .errors({
      INFLUX_QUERY_ERROR: {
        message: "Failed to query time series data",
        status: 500,
      },
    })
    .route({
      tags: ["Time Series"],
      summary: "Get time series data",
      description:
        "Retrieves time series data for a specific chart topic and instance, with optional filtering by component and field",
    })
    .input(
      z
        .object({
          chartTopic: z
            .string()
            .describe(
              `Chart topic to query (e.g., ${Object.keys(possibleChartTopicsConfig).slice(0, 5).join(", ")}, etc.)`,
            )
            .refine((val) => validChartTopics.includes(val), {
              message: `chartTopic must be one of: ${validChartTopics.join(", ")}`,
            }),
          instanceId: z
            .string()
            .min(1)
            .describe("Unique instance identifier (UUIDv7 format)"),
          timeRange: timeRangeInputSchema,
          chartTopicField: z
            .string()
            .optional()
            .describe("Optional field name to filter within the chart topic"),
          componentId: z
            .string()
            .optional()
            .describe("Optional component ID to filter data"),
        })
        .meta({
          examples: [
            {
              chartTopic: "pv",
              instanceId: "018f3d4a-5b6c-7d8e-af01-23456789abcd",
              timeRange: { start: 1704067200000, end: 1704153600000 },
            },
          ],
        }),
    )
    .output(
      z
        .array(
          z.object({
            field: z.string().describe("Field name"),
            data: z
              .array(
                z
                  .tuple([
                    z.number().describe("Timestamp in milliseconds"),
                    z
                      .union([z.number(), z.string()])
                      .nullable()
                      .describe("Value"),
                  ])
                  .describe("[timestamp, value] pair"),
              )
              .describe("Array of data points"),
            metadata: z.object({
              componentId: z.string().optional().describe("Component ID"),
              vehicleId: z.string().optional().describe("Vehicle ID"),
              phase: z.string().optional().describe("Phase number"),
              circuitId: z.string().optional().describe("Circuit ID"),
              gridId: z.string().optional().describe("Grid ID"),
            }),
          }),
        )
        .describe(
          "Time series data grouped by field with timestamps and values",
        )
        .meta({
          examples: [
            [
              {
                field: "power",
                data: [
                  [1704110400000, 1500.5],
                  [1704110460000, 1600.2],
                ],
                metadata: { componentId: "pv-1" },
              },
            ],
          ],
        }),
    )
    .handler(async ({ input }) => {
      const tables = new Map<
        number,
        {
          field: string;
          data: [number, number | string | null][];
          metadata: {
            componentId?: string;
            vehicleId?: string;
            phase?: string;
            circuitId?: string;
            gridId?: string;
          };
        }
      >();

      const rowSchema = z.object({
        _field: z.string(),
        _value: z.union([z.number(), z.string()]).nullable().catch(null),
        _time: z.coerce.date().transform((v) => v.getTime()),
        table: z.number(),
        // optional metadata fields
        componentId: z.string().optional(),
        vehicleId: z.string().optional(),
        phase: z.string().optional(),
        circuitId: z.string().optional(),
        gridId: z.string().optional(),
      });

      const query = buildFluxQuery(
        `from(bucket: {{bucket}})
          |> range(start: {{start}}, stop: {{stop}})
          |> filter(fn: (r) => r["instance"] == {{instanceId}})
          |> filter(fn: (r) => r["_measurement"] == {{chartTopic}})
          ${input.chartTopicField ? `|> filter(fn: (r) => r["_field"] == {{chartTopicField}})` : ""}
          ${input.componentId ? `|> filter(fn: (r) => r["componentId"] == {{componentId}})` : ""}
          ${input.timeRange.windowMinutes > 0
          ? `
          |> aggregateWindow(every: {{windowMinutes}}, fn: last, createEmpty: true)
          |> fill(column: "_value", usePrevious: true)`
          : ""
        }
          |> yield(name: "last")
          `,
        {
          bucket: env.INFLUXDB_BUCKET,
          start: input.timeRange.start,
          stop: min([input.timeRange.end, new Date()]),
          instanceId: input.instanceId,
          chartTopic: input.chartTopic,
          windowMinutes: `${input.timeRange.windowMinutes}m`,
          chartTopicField: input.chartTopicField ?? "",
          componentId: input.componentId ?? "",
        },
      );

      await queryInflux(query, rowSchema, (row) => {
        if (!tables.has(row.table)) {
          tables.set(row.table, {
            field: row._field,
            data: [],
            metadata: {
              componentId: row.componentId,
              vehicleId: row.vehicleId,
              phase: row.phase,
              circuitId: row.circuitId,
              gridId: row.gridId,
            },
          });
        }
        tables
          .get(row.table)!
          .data.push([
            new Date(row._time).getTime(),
            row._value ? Number(row._value) : null,
          ]);
      });

      return Array.from(tables.values());
    }),
};
