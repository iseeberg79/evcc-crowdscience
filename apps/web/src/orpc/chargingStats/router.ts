import { sum } from "simple-statistics";
import * as z from "zod";

import { env } from "~/env";
import { instanceIdsFilterSchema } from "~/lib/globalSchemas";
import {
  buildFluxInstanceFilter,
  buildFluxQuery,
  queryInflux,
} from "~/lib/influx-query";
import { authedProcedure } from "../middleware";

export const chargingStatsRouter = {
  getChargingHourHistogram: authedProcedure
    .route({
      tags: ["Analytics"],
      summary: "Get charging hour histogram",
      description:
        "Retrieves a histogram of charging activity by hour of day for the past 30 days, showing when charging typically occurs",
    })
    .input(instanceIdsFilterSchema)
    .output(
      z
        .record(
          z.string().describe("Instance ID"),
          z
            .array(z.number())
            .length(24)
            .describe("Array of counts per hour (0-23)"),
        )
        .describe(
          "Histogram data organized by instance ID with array of counts per hour (0-23)",
        )
        .meta({
          examples: [
            {
              "018f3d4a-5b6c-7d8e-af01-23456789abcd": [
                0, 0, 0, 0, 0, 0, 2, 5, 10, 8, 4, 2, 1, 0, 0, 0, 3, 7, 12, 15,
                8, 4, 1, 0,
              ],
            },
          ],
        }),
    )
    .handler(async ({ input }) => {
      const res: Record<string, number[]> = {};
      const rowSchema = z.object({
        _time: z.coerce.date(),
        instance: z.string(),
      });
      const { fluxFilter, instanceIdsSet } = buildFluxInstanceFilter(
        input.instanceIds,
      );

      const query = buildFluxQuery(
        `
      from(bucket: {{bucket}})
        |> range(start: -30d)
        |> filter(fn: (r) => r["_measurement"] == "loadpoints" and r["_field"] == "chargeCurrents" and not exists r.phase)
        ${fluxFilter}
        |> aggregateWindow(every: 1h, fn: max, createEmpty: false)
        |> filter(fn: (r) => r["_value"] > 0)
        |> keep(columns: ["_time", "instance"])
    `,
        {
          bucket: env.INFLUXDB_BUCKET,
        },
      );

      await queryInflux(query, rowSchema, (row) => {
        if (instanceIdsSet && !instanceIdsSet.has(row.instance)) {
          return;
        }

        if (!res[row.instance]) {
          res[row.instance] = Array.from({ length: 24 }, () => 0);
        }

        res[row.instance][row._time.getUTCHours()] += 1;
      });

      return Object.fromEntries(
        Object.entries(res).sort((a, b) => sum(b[1]) - sum(a[1])),
      );
    }),
};
