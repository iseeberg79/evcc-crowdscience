import { os } from "@orpc/server";
import { subSeconds } from "date-fns";
import { eq } from "drizzle-orm";
import * as z from "zod";

import { influxDb, sqliteDb } from "~/db/client";
import { instances } from "~/db/schema";
import { env } from "~/env";
import { timeRangeInputSchema } from "~/lib/globalSchemas";
import { buildFluxQuery, queryInflux } from "~/lib/influx-query";
import { generatePublicName } from "~/lib/publicNameGenerator";
import {
  instanceIdInputSchema,
  instanceQuerySchema,
  setIgnoredInputSchema,
} from "~/schema/instances";
import { adminProcedure, authedProcedure } from "../middleware";
import type { Gap } from "../timeSeries/types";
import { getInstancesOverview } from "./getOverview";

export const instancesRouter = {
  generateId: os
    .route({
      tags: ["Instances"],
      summary: "Generate new instance ID",
      description:
        "Creates a new instance with a unique UUIDv7 identifier and a human-readable public name",
    })
    .output(
      z
        .object({
          id: z.string().describe("Unique instance identifier (UUIDv7)"),
          publicName: z
            .string()
            .describe("Human-readable public name for the instance"),
        })
        .meta({
          examples: [
            {
              id: "018f3d4a-5b6c-7d8e-af01-23456789abcd",
              publicName: "shiny-mountain-123",
            },
          ],
        }),
    )
    .handler(async () => {
      // generate a new instance id and public name
      const instanceIdPair = {
        id: Bun.randomUUIDv7(),
        publicName: generatePublicName(),
      };

      await sqliteDb.insert(instances).values(instanceIdPair);

      return instanceIdPair;
    }),
  getById: authedProcedure
    .route({
      tags: ["Instances"],
      summary: "Get instance by ID",
      description:
        "Retrieves detailed information about a specific instance including all metadata and timestamps",
    })
    .input(instanceIdInputSchema)
    .output(
      z
        .object({
          id: z.string().describe("Unique instance identifier"),
          publicName: z
            .string()
            .nullable()
            .describe("Human-readable public name"),
          ignored: z.boolean().describe("Whether this instance is ignored"),
          firstReceivedDataAt: z.coerce
            .date()
            .nullable()
            .describe("Timestamp of first received data"),
          lastReceivedDataAt: z.coerce
            .date()
            .nullable()
            .describe("Timestamp of last received data"),
          lastExtractedDataAt: z.coerce
            .date()
            .nullable()
            .describe("Timestamp of last data extraction"),
          createdAt: z.coerce
            .date()
            .nullable()
            .describe("Instance creation timestamp"),
          updatedAt: z.coerce
            .date()
            .nullable()
            .describe("Last update timestamp"),
          deletedAt: z.coerce
            .date()
            .nullable()
            .describe("Deletion timestamp if soft-deleted"),
        })
        .meta({
          examples: [
            {
              id: "018f3d4a-5b6c-7d8e-af01-23456789abcd",
              publicName: "shiny-mountain-123",
              ignored: false,
              firstReceivedDataAt: new Date("2024-01-01T10:00:00Z"),
              lastReceivedDataAt: new Date("2024-01-02T10:00:00Z"),
              createdAt: new Date("2024-01-01T09:00:00Z"),
              updatedAt: new Date("2024-01-02T10:00:00Z"),
              lastExtractedDataAt: null,
              deletedAt: null,
            },
          ],
        }),
    )
    .handler(async ({ input, errors }) => {
      const instance = await sqliteDb.query.instances.findFirst({
        where: eq(instances.id, input.id),
      });

      if (!instance) {
        throw errors.NOT_FOUND({ message: "Instance not found" });
      }

      return instance;
    }),
  getOverview: getInstancesOverview,
  getLatestUpdate: os
    .route({
      tags: ["Instances"],
      summary: "Get latest update timestamp",
      description:
        "Retrieves the timestamp of the most recent data update for a specific instance from the past year",
    })
    .input(instanceQuerySchema)
    .output(
      z
        .number()
        .nullable()
        .describe(
          "Timestamp in milliseconds of the last update for this instance, or null if no data found",
        )
        .meta({
          examples: [1704110400000, null],
        }),
    )
    .handler(async ({ input }) => {
      const query = buildFluxQuery(
        `from(bucket: {{bucket}})
          |> range(start: -1y)
          |> filter(fn: (r) => r["_measurement"] == "updated")
          |> filter(fn: (r) => r["instance"] == {{instanceId}})
          |> last()`,
        {
          bucket: env.INFLUXDB_BUCKET,
          instanceId: input.instanceId,
        },
      );
      let rows;
      try {
        rows = await influxDb.collectRows(query);
      } catch (error) {
        console.error("InfluxDB query error:", error);
        return null;
      }

      // if no data was found, return null
      if (!rows?.[0]) return null;

      const res = z.object({ _value: z.number() }).safeParse(rows?.[0]);
      if (!res.success) {
        console.error(res.error);
        return null;
      }

      return res.data._value * 1000;
    }),
  getGaps: os
    .route({
      tags: ["Instances"],
      summary: "Get data gaps",
      description:
        "Identifies time periods where data updates were missing for more than 40 seconds within a specified time range",
    })
    .input(
      z
        .object({
          instanceId: z
            .string()
            .describe("Unique instance identifier (UUIDv7 format)"),
          timeRange: timeRangeInputSchema,
        })
        .meta({
          examples: [
            {
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
            start: z.number().describe("Gap start timestamp in milliseconds"),
            end: z.number().describe("Gap end timestamp in milliseconds"),
          }),
        )
        .describe(
          "Array of time gaps where data updates were missing for more than 40 seconds",
        )
        .meta({
          examples: [[{ start: 1704080000000, end: 1704080100000 }]],
        }),
    )
    .handler(async ({ input }) => {
      const query = buildFluxQuery(
        `from(bucket: {{bucket}})
          |> range(start: {{start}}, stop: {{stop}})
          |> filter(fn: (r) => r["_measurement"] == "updated")
          |> filter(fn: (r) => r["instance"] == {{instanceId}})
          |> difference()
          |> filter(fn: (r)=> r["_value"] > 40)`,
        {
          bucket: env.INFLUXDB_BUCKET,
          start: input.timeRange.start,
          stop: input.timeRange.end,
          instanceId: input.instanceId,
        },
      );

      const gaps: Gap[] = [];
      await queryInflux(
        query,
        z.object({ _time: z.coerce.date(), _value: z.number() }),
        (row) => {
          const start = subSeconds(row._time, row._value);

          if (gaps.length > 0 && gaps[gaps.length - 1].end > start.getTime()) {
            gaps[gaps.length - 1].end = row._time.getTime();
            return;
          }

          gaps.push({
            start: start.getTime(),
            end: row._time.getTime(),
          });
        },
      );

      return gaps;
    }),
  setIgnored: adminProcedure
    .route({
      tags: ["Instances"],
      summary: "Set instance ignored status",
      description:
        "Updates whether an instance should be ignored. Requires admin privileges.",
    })
    .input(setIgnoredInputSchema)
    .output(
      z.void().describe("No return value - operation completed successfully"),
    )
    .handler(async ({ input }) => {
      await sqliteDb
        .update(instances)
        .set({ ignored: input.ignored })
        .where(eq(instances.id, input.instanceId));
    }),
};
