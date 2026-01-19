import { os } from "@orpc/server";
import { desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { sqliteDb } from "~/db/client";
import {
  csvImportLoadingSessions,
  extractedLoadingSessions,
} from "~/db/schema";
import { instanceIdsFilterSchema } from "~/lib/globalSchemas";
import { authedProcedure, publicProcedure } from "../middleware";
import { extractSessionDetails } from "./extractDetails";
import { extractSessionRanges } from "./extractRanges";
import { importSessions } from "./import";
import { csvImportLoadingSessionSchema, extractedSessionSchema } from "./types";

export const loadingSessionsRouter = {
  getExtractedSessions: os
    .route({
      tags: ["Loading Sessions"],
      summary: "Get extracted sessions",
      description:
        "Retrieves automatically extracted loading sessions from InfluxDB time series data",
    })
    .input(instanceIdsFilterSchema)
    .output(z.array(extractedSessionSchema))
    .handler(({ input }) => {
      return sqliteDb.query.extractedLoadingSessions.findMany({
        where: input.instanceIds?.length
          ? inArray(extractedLoadingSessions.instanceId, input.instanceIds)
          : undefined,
        orderBy: [desc(extractedLoadingSessions.startTime)],
      });
    }),
  getSessionByHash: publicProcedure
    .route({
      tags: ["Loading Sessions"],
      summary: "Get session by hash",
      description:
        "Retrieves a specific loading session from the db by its unique session range hash",
    })
    .input(
      z.object({
        sessionRangeHash: z
          .string()
          .describe("Unique hash identifying a session time range"),
      }),
    )
    .output(extractedSessionSchema)
    .handler(async ({ input, errors }) => {
      const session = await sqliteDb.query.extractedLoadingSessions.findFirst({
        where: eq(
          extractedLoadingSessions.sessionRangeHash,
          input.sessionRangeHash,
        ),
      });
      if (!session) {
        throw errors.NOT_FOUND({ message: "Session not found" });
      }
      return session;
    }),
  getImportedSessions: os
    .route({
      tags: ["Loading Sessions"],
      summary: "Get imported sessions",
      description:
        "Retrieves loading sessions that were manually imported from CSV files",
    })
    .input(instanceIdsFilterSchema)
    .output(z.array(csvImportLoadingSessionSchema))
    .handler(({ input }) => {
      return sqliteDb.query.csvImportLoadingSessions.findMany({
        where: input.instanceIds?.length
          ? inArray(csvImportLoadingSessions.instanceId, input.instanceIds)
          : undefined,
      });
    }),
  deleteImportedSessions: authedProcedure
    .route({
      tags: ["Loading Sessions"],
      summary: "Delete imported sessions",
      description:
        "Deletes CSV-imported loading sessions for specified instances",
    })
    .input(instanceIdsFilterSchema)
    .output(
      z.void().describe("No return value - deletion completed successfully"),
    )
    .handler(async ({ input }) => {
      return sqliteDb
        .delete(csvImportLoadingSessions)
        .where(
          input.instanceIds?.length
            ? inArray(csvImportLoadingSessions.instanceId, input.instanceIds)
            : undefined,
        );
    }),
  deleteExtractedSessions: authedProcedure
    .route({
      tags: ["Loading Sessions"],
      summary: "Delete extracted sessions",
      description:
        "Deletes automatically extracted loading sessions for specified instances",
    })
    .input(instanceIdsFilterSchema)
    .output(
      z.void().describe("No return value - deletion completed successfully"),
    )
    .handler(async ({ input }) => {
      return sqliteDb
        .delete(extractedLoadingSessions)
        .where(
          input.instanceIds?.length
            ? inArray(extractedLoadingSessions.instanceId, input.instanceIds)
            : undefined,
        );
    }),
  importSessions,
  extractSessionRanges,
  extractSessionDetails,
};
