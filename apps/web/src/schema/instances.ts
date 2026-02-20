import * as z from "zod";

/**
 * Reusable schemas for instance-related API endpoints
 */

// Instance ID as a string (UUIDv7)
export const instanceIdSchema = z
  .string()
  .describe("Unique instance identifier (UUIDv7 format)");

// Input schema for endpoints that need just an instance ID
export const instanceIdInputSchema = z
  .object({
    id: instanceIdSchema,
  })
  .meta({
    examples: [{ id: "018f3d4a-5b6c-7d8e-af01-23456789abcd" }],
  });

// Input schema for endpoints using 'instanceId' field name
export const instanceQuerySchema = z
  .object({
    instanceId: instanceIdSchema,
  })
  .meta({
    examples: [{ instanceId: "018f3d4a-5b6c-7d8e-af01-23456789abcd" }],
  });

// Input schema for setting ignored status
export const setIgnoredInputSchema = z
  .object({
    instanceId: instanceIdSchema,
    ignored: z
      .boolean()
      .describe("Whether to mark this instance as ignored or not"),
  })
  .meta({
    examples: [
      { instanceId: "018f3d4a-5b6c-7d8e-af01-23456789abcd", ignored: true },
    ],
  });

// Input schema for getOverview filters
export const instancesOverviewInputSchema = z
  .object({
    idFilter: z
      .string()
      .optional()
      .describe("Optional filter to search instances by ID substring"),
    showIgnored: z
      .boolean()
      .optional()
      .default(false)
      .describe("Whether to include ignored instances in the results"),
  })
  .optional()
  .meta({
    examples: [{ idFilter: "018f", showIgnored: true }, {}],
  });
