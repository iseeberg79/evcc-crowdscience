import * as z from "zod";

import { instanceCountsAsActiveDays } from "~/constants";
import { influxDb } from "~/db/client";
import { env } from "~/env";
import { instanceIdsFilterSchema } from "~/lib/globalSchemas";
import { buildFluxInstanceFilter, buildFluxQuery } from "~/lib/influx-query";
import { instanceQuerySchema } from "~/schema/instances";
import { publicProcedure } from "../middleware";
import { influxRowBaseSchema, type MetaData } from "../types";

const batteryMetadataRowSchema = influxRowBaseSchema
  .extend({
    _field: z
      .enum(["capacity", "energy", "soc", "power", "controllable"])
      .or(z.string()),
    _value: z.union([z.number(), z.boolean(), z.string()]),
    componentId: z.string().optional(),
  })
  .meta({
    examples: [
      {
        _field: "capacity",
        _value: 10000,
        _time: "2024-01-01T12:00:00Z",
        componentId: "8934572903847029348",
      },
    ],
  });

export const batteriesRouter = {
  getMetaData: publicProcedure
    .errors({
      INFLUX_QUERY_ERROR: {
        message: "Failed to query battery metadata",
        status: 500,
      },
    })
    .route({
      tags: ["Batteries"],
      summary: "Get battery metadata",
      description:
        "Retrieves metadata for all batteries of a specific instance, including capacity, energy, state of charge, and power information",
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
                  value: z.union([z.number(), z.boolean(), z.string()]),
                  lastUpdate: z.number(),
                }),
              ),
            )
            .describe(
              "Nested map of componentId -> field -> {value, lastUpdate}",
            ),
          count: z.number().describe("Total number of battery components"),
        })
        .meta({
          examples: [
            {
              values: {
                "8934572903847029348": {
                  capacity: { value: 10000, lastUpdate: 1704110400000 },
                  soc: { value: 85, lastUpdate: 1704110400000 },
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
          |> filter(fn: (r) => r["_measurement"] == "battery")
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
      const res = batteryMetadataRowSchema.array().safeParse(rows);

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
  getData: publicProcedure
    .errors({
      INFLUX_QUERY_ERROR: {
        message: "Failed to query battery data",
        status: 500,
      },
    })
    .route({
      tags: ["Batteries"],
      summary: "Get battery data",
      description:
        "Retrieves current battery data for multiple instances, organized by instance and component",
    })
    .input(instanceIdsFilterSchema)
    .output(
      z
        .record(
          z.string(),
          z.record(
            z.string(),
            z.object({
              capacity: z.number().optional().describe("Capacity in Wh"),
              energy: z.number().optional().describe("Energy in Wh"),
              soc: z.number().optional().describe("State of charge in %"),
              controllable: z
                .boolean()
                .optional()
                .describe("Whether the battery is controllable"),
              power: z.number().optional().describe("Current power in W"),
            }),
          ),
        )
        .meta({
          examples: [
            {
              "018f3d4a-5b6c-7d8e-af01-23456789abcd": {
                "8934572903847029348": {
                  capacity: 10000,
                  soc: 85,
                  power: 1500,
                },
              },
            },
          ],
        }),
    )
    .handler(async ({ input }) => {
      const rowSchema = z.object({
        componentId: z.string(),
        instance: z.string(),
        _field: z
          .enum(["capacity", "energy", "soc", "power", "controllable"])
          .or(z.string()),
        _value: z.union([z.number(), z.boolean(), z.string()]),
        _time: z.string().transform((v) => new Date(v).getTime()),
      });

      const res: Record<
        string,
        Record<
          string,
          Partial<{
            capacity: number;
            energy: number;
            soc: number;
            controllable: boolean;
            power: number;
          }>
        >
      > = {};

      const { fluxFilter, instanceIdsSet } = buildFluxInstanceFilter(
        input.instanceIds,
      );
      const query = buildFluxQuery(
        `
      from(bucket: {{bucket}})
        |> range(start: {{rangeStart}})
        |> filter(fn: (r) => r["_measurement"] == "battery" and exists r["componentId"])
        |> last()
        ${fluxFilter}
      `,
        {
          bucket: env.INFLUXDB_BUCKET,
          rangeStart: `-${instanceCountsAsActiveDays}d`,
        },
      );

      try {
        for await (const { values, tableMeta } of influxDb.iterateRows(query)) {
          const row = tableMeta.toObject(values);

          const parsedRow = rowSchema.safeParse(row);
          if (!parsedRow.success) {
            console.error(parsedRow.error, row);
            continue;
          }

          if (instanceIdsSet && !instanceIdsSet.has(parsedRow.data.instance)) {
            continue;
          }

          if (!res[parsedRow.data.instance]) {
            res[parsedRow.data.instance] = {};
          }

          if (!res[parsedRow.data.instance][parsedRow.data.componentId]) {
            res[parsedRow.data.instance][parsedRow.data.componentId] = {};
          }

          // @ts-expect-error problem with assignment to partial and field types
          // but zod makes sure that the field is valid
          res[parsedRow.data.instance][parsedRow.data.componentId][
            parsedRow.data._field
          ] = parsedRow.data._value;
        }
      } catch (error) {
        console.error("InfluxDB query error:", error);
        return res;
      }

      return res;
    }),
};
