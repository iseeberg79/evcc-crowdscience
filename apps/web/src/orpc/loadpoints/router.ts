import * as z from "zod";

import { instanceCountsAsActiveDays } from "~/constants";
import { influxDb } from "~/db/client";
import { env } from "~/env";
import { buildFluxQuery } from "~/lib/influx-query";
import { instanceQuerySchema } from "~/schema/instances";
import { publicProcedure } from "../middleware";
import { influxRowBaseSchema, type MetaData } from "../types";

const loadPointMetadataRowSchema = influxRowBaseSchema
  .extend({
    componentId: z.string().optional().describe("Unique component ID (lp-*)"),
  })
  .meta({
    examples: [
      {
        componentId: "lp-1",
        _field: "title",
        _value: "Wallbox",
        _time: "2024-01-01T12:00:00Z",
      },
    ],
  });

export const loadpointsRouter = {
  getMetaData: publicProcedure
    .errors({
      INFLUX_QUERY_ERROR: {
        message: "Failed to query loadpoint metadata",
        status: 500,
      },
    })
    .route({
      tags: ["Loadpoints"],
      summary: "Get loadpoint metadata",
      description:
        "Retrieves metadata for all charging loadpoints of a specific instance",
    })
    .input(instanceQuerySchema)
    .output(
      z
        .object({
          values: z
            .record(
              z.string(),
              z.record(
                z.string(),
                z.object({
                  value: z.union([z.number(), z.string(), z.boolean()]),
                  lastUpdate: z.number(),
                }),
              ),
            )
            .describe("Nested map of componentId -> field -> {value, lastUpdate}"),
          count: z.number().describe("Total number of loadpoint components"),
        })
        .meta({
          examples: [
            {
              values: {
                "lp-1": {
                  title: { value: "Main Charger", lastUpdate: 1704110400000 },
                  chargePower: { value: 11000, lastUpdate: 1704110400000 },
                },
              },
              count: 1,
            },
          ],
        }),
    )
    .handler(async ({ input }): Promise<MetaData> => {
      const metaData: MetaData = { values: {}, count: 0 };

      const query = buildFluxQuery(
        `from(bucket: {{bucket}})
          |> range(start: {{rangeStart}})
          |> filter(fn: (r) => r["_measurement"] == "loadpoints")
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
      const res = loadPointMetadataRowSchema.array().safeParse(rows);
      if (!res.success) {
        console.error(res.error);
        return metaData;
      }

      for (const item of res.data) {
        if (item._field === "count") metaData.count = Number(item._value);
        if (!item.componentId) continue;
        metaData.values[item.componentId] ??= {};
        metaData.values[item.componentId][item._field] = {
          value: item._value,
          lastUpdate: item._time,
        };
      }
      if (metaData.count === 0)
        metaData.count = Object.keys(metaData.values).length;

      return metaData;
    }),
};
