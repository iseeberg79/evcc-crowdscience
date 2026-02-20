import * as z from "zod";

import { instanceCountsAsActiveDays } from "~/constants";
import { influxDb } from "~/db/client";
import { env } from "~/env";
import { buildFluxQuery } from "~/lib/influx-query";
import { instanceQuerySchema } from "~/schema/instances";
import { publicProcedure } from "../middleware";
import {
  influxRowBaseSchema,
  type InfluxFieldValues,
  type MetaData,
} from "../types";

const siteMetadataRowSchema = influxRowBaseSchema;

const siteStatisticsRowSchema = influxRowBaseSchema
  .extend({
    _field: z.enum(["avgCo2", "avgPrice", "chargedKWh", "solarPercentage"]),
    period: z.enum(["30d", "365d", "thisYear", "total"]),
    _value: z.number(),
  })
  .meta({
    examples: [
      {
        _field: "chargedKWh",
        period: "30d",
        _value: 450.5,
        _time: "2024-01-01T12:00:00Z",
      },
    ],
  });

type StatisticsKeys = z.infer<typeof siteStatisticsRowSchema>["period"];
type StatisticsFields = z.infer<typeof siteStatisticsRowSchema>["_field"];

export const sitesRouter = {
  getMetaDataValues: publicProcedure
    .errors({
      INFLUX_QUERY_ERROR: {
        message: "Failed to query site metadata",
        status: 500,
      },
    })
    .route({
      tags: ["Sites"],
      summary: "Get site metadata values",
      description: "Retrieves current field values for a site instance",
    })
    .input(instanceQuerySchema)
    .output(
      z
        .record(
          z.string().describe("Field name"),
          z.object({
            value: z.union([z.number(), z.string(), z.boolean()]),
            lastUpdate: z.number(),
          }),
        )
        .describe("Site field values with timestamps")
        .meta({
          examples: [
            {
              gridPower: { value: 2500, lastUpdate: 1704110400000 },
              housePower: { value: 800, lastUpdate: 1704110400000 },
            },
          ],
        }),
    )
    .handler(async ({ input }): Promise<InfluxFieldValues> => {
      const query = buildFluxQuery(
        `from(bucket: {{bucket}})
          |> range(start: {{rangeStart}})
          |> filter(fn: (r) => r["_measurement"] == "site")
          |> filter(fn: (r) => r["instance"] == {{instanceId}})
          |> last()`,
        {
          bucket: env.INFLUXDB_BUCKET,
          rangeStart: `-${instanceCountsAsActiveDays}d`,
          instanceId: input.instanceId,
        },
      );
      let rows;
      try {
        rows = await influxDb.collectRows(query);
      } catch (error) {
        console.error("InfluxDB query error:", error);
        return {};
      }

      const res = siteMetadataRowSchema.array().safeParse(rows);
      if (!res.success) {
        console.error(res.error);
        return {};
      }

      const metaData: InfluxFieldValues = {};

      for (const item of res.data) {
        metaData[item._field] = {
          value: item._value,
          lastUpdate: item._time,
        };
      }

      return metaData;
    }),
  getStatistics: publicProcedure
    .errors({
      INFLUX_QUERY_ERROR: {
        message: "Failed to query site statistics",
        status: 500,
      },
    })
    .route({
      tags: ["Sites"],
      summary: "Get site statistics",
      description:
        "Retrieves statistical data for a site including CO2, pricing, and solar percentage by time period",
    })
    .input(instanceQuerySchema)
    .output(
      z
        .object({
          values: z
            .record(
              z.string().describe("Time period (30d, 365d, etc)"),
              z.record(
                z.string().describe("Field name (avgPrice, chargedKWh, etc)"),
                z.object({
                  value: z.number(),
                  lastUpdate: z.number(),
                }),
              ),
            )
            .describe("Statistics organized by period and field"),
          count: z.number().describe("Total number of statistics records"),
        })
        .meta({
          examples: [
            {
              values: {
                "30d": {
                  chargedKWh: { value: 450.5, lastUpdate: 1704110400000 },
                  avgPrice: { value: 0.32, lastUpdate: 1704110400000 },
                },
              },
              count: 2,
            },
          ],
        }),
    )
    .handler(async ({ input }) => {
      const metaData: MetaData<StatisticsKeys, StatisticsFields, number> = {
        values: {},
        count: 0,
      };

      const query = buildFluxQuery(
        `from(bucket: {{bucket}})
          |> range(start: {{rangeStart}})
          |> filter(fn: (r) => r["_measurement"] == "statistics")
          |> filter(fn: (r) => r["instance"] == {{instanceId}})
          |> last()`,
        {
          bucket: env.INFLUXDB_BUCKET,
          rangeStart: `-${instanceCountsAsActiveDays}d`,
          instanceId: input.instanceId,
        },
      );
      let rows;
      try {
        rows = await influxDb.collectRows(query);
      } catch (error) {
        console.error("InfluxDB query error:", error);
        return metaData;
      }

      const res = siteStatisticsRowSchema.array().safeParse(rows);
      if (!res.success) {
        console.error(res.error);
        return metaData;
      }

      for (const row of res.data) {
        metaData.values[row.period] ??= {};
        metaData.values[row.period]![row._field] = {
          value: row._value,
          lastUpdate: row._time,
        };
      }

      return metaData;
    }),
};
