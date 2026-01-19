import { os } from "@orpc/server";
import * as z from "zod";

import { instanceCountsAsActiveDays } from "~/constants";
import { influxDb } from "~/db/client";
import { env } from "~/env";
import { buildFluxQuery } from "~/lib/influx-query";
import { instanceQuerySchema } from "~/schema/instances";
import { influxRowBaseSchema, type MetaData } from "../types";

const loadPointMetadataRowSchema = influxRowBaseSchema.extend({
  componentId: z.string().optional(),
});

export const loadpointsRouter = {
  getMetaData: os
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
          "Loadpoint metadata including values per component and total count",
        ),
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
