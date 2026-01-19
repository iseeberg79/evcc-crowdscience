import * as z from "zod";

import { instanceCountsAsActiveDays } from "~/constants";
import { influxDb } from "~/db/client";
import { env } from "~/env";
import { buildFluxQuery } from "~/lib/influx-query";
import { instanceQuerySchema } from "~/schema/instances";
import { publicProcedure } from "../middleware";
import { influxRowBaseSchema, type MetaData } from "../types";

const pvMetadataRowSchema = influxRowBaseSchema
  .extend({
    _field: z
      .enum(["energy", "power", "excessDCPower", "currents", "powers"])
      .or(z.string()),
    _value: z.union([z.number(), z.string(), z.boolean()]),
    componentId: z.string().optional().describe("Unique component ID (pv-*)"),
  })
  .meta({
    examples: [
      {
        componentId: "pv-1",
        _field: "power",
        _value: 4500.5,
        _time: "2024-01-01T12:00:00Z",
      },
    ],
  });

export const pvRouter = {
  getMetaData: publicProcedure
    .errors({
      INFLUX_QUERY_ERROR: {
        message: "Failed to query PV metadata",
        status: 500,
      },
    })
    .route({
      tags: ["PV Systems"],
      summary: "Get PV system metadata",
      description:
        "Retrieves metadata for all photovoltaic components of a specific instance, including energy, power, and current information",
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
            .describe(
              "Nested map of componentId -> field -> {value, lastUpdate}",
            ),
          count: z.number().describe("Total number of PV components"),
        })
        .meta({
          examples: [
            {
              values: {
                "pv-1": {
                  power: { value: 4500, lastUpdate: 1704110400000 },
                  energy: { value: 120000, lastUpdate: 1704110400000 },
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
          |> filter(fn: (r) => r["_measurement"] == "pv")
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

      const res = pvMetadataRowSchema.array().safeParse(rows);
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
