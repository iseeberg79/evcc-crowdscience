import * as z from "zod";

/**
 * Reusable schemas for user-related API endpoints
 */

export const getUserInputSchema = z
  .object({
    email: z.email().describe("User email address"),
    mode: z.literal("email").prefault("email"),
  })
  .or(
    z.object({
      id: z.string().describe("User ID"),
      mode: z.literal("id").prefault("id"),
    }),
  );

export const getMultipleUsersInputSchema = z
  .object({
    ids: z
      .array(z.string())
      .optional()
      .describe("Optional array of user IDs to filter by"),
  })
  .optional();

export const updateUserInputSchema = z.object({
  id: z.string().optional().describe("User ID (required for updates)"),
  email: z.email().describe("Email address"),
  firstName: z.string().describe("First name"),
  lastName: z.string().describe("Last name"),
  isAdmin: z.boolean().describe("Whether user has admin privileges"),
  password: z
    .string()
    .nullable()
    .describe("New password (null to keep existing)"),
  deletedAt: z.date().nullable().optional().describe("Soft deletion timestamp"),
});

export const createUserInputSchema = z.object({
  email: z.email().describe("Email address"),
  firstName: z.string().describe("First name"),
  lastName: z.string().describe("Last name"),
  isAdmin: z.boolean().describe("Whether user has admin privileges"),
  password: z.string().describe("Initial password"),
});

export const deleteUserInputSchema = z.object({
  id: z.string().describe("User ID to delete"),
});

export const undoDeleteUserInputSchema = z.object({
  id: z.string().describe("User ID to restore"),
});

export const userOutputSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  isAdmin: z.boolean(),
});
