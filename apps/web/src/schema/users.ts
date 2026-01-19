import * as z from "zod";

/**
 * Reusable schemas for user-related API endpoints
 */

export const getUserInputSchema = z
  .object({
    email: z.string().email().describe("User email address"),
    mode: z.literal("email").default("email"),
  })
  .or(
    z.object({
      id: z.string().describe("User ID"),
      mode: z.literal("id").default("id"),
    }),
  )
  .meta({
    examples: [
      { email: "john@example.com", mode: "email" },
      { id: "user_123", mode: "id" },
    ],
  });

export const getMultipleUsersInputSchema = z
  .object({
    ids: z
      .array(z.string())
      .optional()
      .describe("Optional array of user IDs to filter by"),
  })
  .optional()
  .meta({
    examples: [{ ids: ["user_1", "user_2"] }, {}],
  });

export const updateUserInputSchema = z
  .object({
    id: z.string().optional().describe("User ID (required for updates)"),
    email: z.string().email().describe("Email address"),
    firstName: z.string().describe("First name"),
    lastName: z.string().describe("Last name"),
    isAdmin: z.boolean().describe("Whether user has admin privileges"),
    password: z
      .string()
      .nullable()
      .describe("New password (null to keep existing)"),
    deletedAt: z.date().nullable().optional().describe("Soft deletion timestamp"),
  })
  .meta({
    examples: [
      {
        id: "user_123",
        email: "john@example.com",
        firstName: "John",
        lastName: "Doe",
        isAdmin: false,
        password: "new-password",
      },
    ],
  });

export const createUserInputSchema = z
  .object({
    email: z.string().email().describe("Email address"),
    firstName: z.string().describe("First name"),
    lastName: z.string().describe("Last name"),
    isAdmin: z.boolean().describe("Whether user has admin privileges"),
    password: z.string().describe("Initial password"),
  })
  .meta({
    examples: [
      {
        email: "jane@example.com",
        firstName: "Jane",
        lastName: "Smith",
        isAdmin: true,
        password: "secure-password",
      },
    ],
  });

export const deleteUserInputSchema = z
  .object({
    id: z.string().describe("User ID to delete"),
  })
  .meta({
    examples: [{ id: "user_123" }],
  });

export const undoDeleteUserInputSchema = z
  .object({
    id: z.string().describe("User ID to restore"),
  })
  .meta({
    examples: [{ id: "user_123" }],
  });

export const userOutputSchema = z
  .object({
    id: z.string(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    isAdmin: z.boolean(),
  })
  .meta({
    examples: [
      {
        id: "user_123",
        email: "john@example.com",
        firstName: "John",
        lastName: "Doe",
        isAdmin: false,
      },
    ],
  });
