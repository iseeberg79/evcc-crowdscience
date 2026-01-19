import * as z from "zod";

import { instanceCountsAsActiveDays } from "~/constants";
import { influxDb } from "~/db/client";
import { env } from "~/env";
import { buildFluxQuery } from "~/lib/influx-query";
import { instanceQuerySchema } from "~/schema/instances";
import { publicProcedure } from "../middleware";
import { influxRowBaseSchema, type MetaData } from "../types";

const vehicleMetadataRowSchema = influxRowBaseSchema.extend({
  vehicleId: z.string().optional(),
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
          values: z.record(
            z.string(),
            z.record(
              z.string(),
              z.object({
                value: z.union([z.number(), z.string(), z.boolean()]),
                lastUpdate: z.number(),
              }),
            ),
          ),
          count: z.number(),
        })
        .describe(
          "Vehicle metadata including values per vehicle ID and total count",
        ),
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
