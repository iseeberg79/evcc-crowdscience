import { eq } from "drizzle-orm";
import z from "zod";

import { sqliteDb } from "~/db/client";
import { csvImportLoadingSessions } from "~/db/schema";
import { parseLoadingSessionCsv } from "~/lib/import-export/parseLoadingSessionCsv";
import { authedProcedure } from "../middleware";
import { csvImportLoadingSessionSchema } from "./types";

export const importSessions = authedProcedure
  .route({
    tags: ["Loading Sessions"],
    summary: "Import sessions from CSV",
    description:
      "Imports loading sessions from a CSV file, automatically deduplicates based on line hash",
  })
  .input(
    z.object({
      csvFile: z
        .instanceof(File)
        .describe("CSV file containing loading session data"),
      instanceId: z
        .string()
        .describe("Instance ID to associate with imported sessions"),
    }),
  )
  .output(z.array(csvImportLoadingSessionSchema))
  .handler(async ({ input }) => {
    const instanceId = input.instanceId;

    // Parse CSV file
    const csvText = await input.csvFile.text();
    const rows = await parseLoadingSessionCsv(csvText);

    // Check existing records for this instance
    const existingData = await sqliteDb.query.csvImportLoadingSessions.findMany(
      {
        where: eq(csvImportLoadingSessions.instanceId, instanceId),
      },
    );

    const existingHashes = new Set(existingData.map((row) => row.lineHash));

    // Prepare rows with metadata and deduplication
    const rowsWithMetadata = rows
      .map((row) => ({
        ...row,
        startTime: new Date(row.startTime),
        endTime: new Date(row.endTime),
        instanceId,
        lineHash: String(Bun.hash(JSON.stringify({ row, instanceId }))),
      }))
      .filter((row) => !existingHashes.has(row.lineHash));

    // Insert new records
    if (rowsWithMetadata.length > 0) {
      await sqliteDb.insert(csvImportLoadingSessions).values(rowsWithMetadata);
    }

    // Return all imported sessions for this instance (sorted by startTime)
    const allImported = await sqliteDb
      .select()
      .from(csvImportLoadingSessions)
      .where(eq(csvImportLoadingSessions.instanceId, instanceId))
      .orderBy(csvImportLoadingSessions.startTime);

    return allImported;
  });
