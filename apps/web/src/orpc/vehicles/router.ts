import * as z from "zod";

import { instanceCountsAsActiveDays } from "~/constants";
import { influxDb } from "~/db/client";
import { env } from "~/env";
import { buildFluxQuery } from "~/lib/influx-query";
import { instanceQuerySchema } from "~/schema/instances";
import { publicProcedure } from "../middleware";
import { influxRowBaseSchema, type MetaData } from "../types";

const vehicleMetadataRowSchema = influxRowBaseSchema
  .extend({
    vehicleId: z.string().optional().describe("Unique vehicle identifier"),
  })
  .meta({
    examples: [
      {
        vehicleId: "ev-1",
        _field: "title",
        _value: "Model 3",
        _time: "2024-01-01T12:00:00Z",
      },
    ],
  });

export const vehiclesRouter = {
  getMetaData: publicProcedure
    .errors({
      INFLUX_QUERY_ERROR: {
        message: "Failed to query vehicle metadata",
        status: 500,
      },
    })
    .route({
      tags: ["Vehicles"],
      summary: "Get vehicle metadata",
      description:
        "Retrieves metadata for all vehicles connected to a specific instance",
    })
    .input(instanceQuerySchema)
    .output(
      z
        .object({
          values: z
            .record(
              z.string().describe("Vehicle ID"),
              z.record(
                z.string().describe("Field name"),
                z.object({
                  value: z.union([z.number(), z.string(), z.boolean()]),
                  lastUpdate: z.number(),
                }),
              ),
            )
            .describe("Nested map of vehicleId -> field -> {value, lastUpdate}"),
          count: z.number().describe("Total number of vehicles"),
        })
        .meta({
          examples: [
            {
              values: {
                "ev-1": {
                  title: { value: "Blue Tesla", lastUpdate: 1704110400000 },
                  capacity: { value: 75, lastUpdate: 1704110400000 },
                },
              },
              count: 1,
            },
          ],
        }),
    )
    .handler(async ({ input }) => {
      const metaData: MetaData = { values: {}, count: 0 };
      const query = buildFluxQuery(
        `from(bucket: {{bucket}})
          |> range(start: {{rangeStart}})
          |> filter(fn: (r) => r["_measurement"] == "vehicles")
          |> filter(fn: (r) => r["instance"] == {{instanceId}})
          |> last()`,
        {
          bucket: env.INFLUXDB_BUCKET,
          rangeStart: `-${instanceCountsAsActiveDays}d`,
          instanceId: input.instanceId,
        },
      );
      const rows = await influxDb.collectRows(query);
      const res = vehicleMetadataRowSchema.array().safeParse(rows);
      if (!res.success) {
        console.error(res.error);
        return metaData;
      }

      for (const item of res.data) {
        if (item._field === "count") metaData.count = Number(item._value);
        if (!item.vehicleId) continue;
        metaData.values[item.vehicleId] ??= {};
        metaData.values[item.vehicleId][item._field] = {
          value: item._value,
          lastUpdate: item._time,
        };
      }

      metaData.count ??= Object.keys(metaData.values).length;

      return metaData;
    }),
};
