import { os } from "@orpc/server";
import * as z from "zod";

import { instanceCountsAsActiveDays } from "~/constants";
import { influxDb } from "~/db/client";
import { env } from "~/env";
import { buildFluxQuery } from "~/lib/influx-query";
import { instanceQuerySchema } from "~/schema/instances";
import {
  influxRowBaseSchema,
  type InfluxFieldValues,
  type MetaData,
} from "../types";

const siteMetadataRowSchema = influxRowBaseSchema;

const siteStatisticsRowSchema = influxRowBaseSchema.extend({
  _field: z.enum(["avgCo2", "avgPrice", "chargedKWh", "solarPercentage"]),
  period: z.enum(["30d", "365d", "thisYear", "total"]),
  _value: z.number(),
});

type StatisticsKeys = z.infer<typeof siteStatisticsRowSchema>["period"];
type StatisticsFields = z.infer<typeof siteStatisticsRowSchema>["_field"];

export const sitesRouter = {
  getMetaDataValues: os
    .route({
      tags: ["Sites"],
      summary: "Get site metadata values",
      description: "Retrieves current field values for a site instance",
    })
    .input(instanceQuerySchema)
    .output(
      z
        .record(
          z.string(),
          z.object({
            value: z.union([z.number(), z.string(), z.boolean()]),
            lastUpdate: z.number(),
          }),
        )
        .describe("Site field values with timestamps"),
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
  getStatistics: os
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
          values: z.record(
            z.string(),
            z.record(
              z.string(),
              z.object({
                value: z.number(),
                lastUpdate: z.number(),
              }),
            ),
          ),
          count: z.number(),
        })
        .describe(
          "Site statistics organized by time period (30d, 365d, thisYear, total)",
        ),
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
