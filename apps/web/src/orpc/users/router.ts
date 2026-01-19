import { and, eq, inArray, isNull } from "drizzle-orm";
import * as z from "zod";

import { sqliteDb } from "~/db/client";
import { users } from "~/db/schema";
import { hashPassword } from "~/lib/auth/session";
import {
  createUserInputSchema,
  deleteUserInputSchema,
  getMultipleUsersInputSchema,
  getUserInputSchema,
  undoDeleteUserInputSchema,
  updateUserInputSchema,
  userOutputSchema,
} from "~/schema/users";
import { adminProcedure, authedProcedure } from "../middleware";

async function checkUserExists(email: string) {
  const user = await sqliteDb.query.users.findFirst({
    where: eq(users.email, email),
  });

  const isActiveUser = user && !user.deletedAt;
  return { user, isActiveUser };
}

const userColumns = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  isAdmin: true,
} as const;

export const usersRouter = {
  get: authedProcedure
    .route({
      tags: ["Users"],
      summary: "Get user",
      description: "Retrieves a single user by email or ID",
    })
    .input(getUserInputSchema)
    .output(userOutputSchema.optional())
    .handler(async ({ input }) => {
      const user = await sqliteDb.query.users.findFirst({
        where: and(
          isNull(users.deletedAt),
          input.mode === "email"
            ? eq(users.email, input.email)
            : eq(users.id, input.id),
        ),
        columns: userColumns,
      });

      return user;
    }),

  getMultiple: authedProcedure
    .route({
      tags: ["Users"],
      summary: "Get multiple users",
      description: "Retrieves multiple users, optionally filtered by IDs",
    })
    .input(getMultipleUsersInputSchema)
    .output(z.array(userOutputSchema))
    .handler(async ({ input }) => {
      return await sqliteDb.query.users.findMany({
        where: and(
          isNull(users.deletedAt),
          input?.ids ? inArray(users.id, input.ids) : undefined,
        ),
        columns: userColumns,
      });
    }),

  update: adminProcedure
    .route({
      tags: ["Users"],
      summary: "Update user",
      description: "Updates user information. Requires admin privileges.",
    })
    .input(updateUserInputSchema)
    .output(
      z.void().describe("No return value - update completed successfully"),
    )
    .handler(async ({ input }) => {
      const { isActiveUser } = await checkUserExists(input.email);

      if (!isActiveUser) {
        throw new Error("User does not exist");
      }

      const newValues = {
        ...input,
        // only update password if it is provided
        passwordHash: input.password
          ? await hashPassword(input.password)
          : undefined,
        // only update email if id is provided
        email: input.id ? input.email : undefined,
      };

      return await sqliteDb
        .update(users)
        .set(newValues)
        .where(
          input.id ? eq(users.id, input.id) : eq(users.email, input.email),
        );
    }),

  create: adminProcedure
    .route({
      tags: ["Users"],
      summary: "Create user",
      description:
        "Creates a new user or restores a soft-deleted user. Requires admin privileges.",
    })
    .input(createUserInputSchema)
    .output(
      z.void().describe("No return value - creation completed successfully"),
    )
    .handler(async ({ input }) => {
      const { user, isActiveUser } = await checkUserExists(input.email);

      if (isActiveUser) {
        throw new Error("User already exists");
      }

      if (user?.deletedAt) {
        return await sqliteDb
          .update(users)
          .set({
            ...input,
            passwordHash: await hashPassword(input.password),
            deletedAt: null,
          })
          .where(eq(users.id, user.id));
      }

      return await sqliteDb
        .insert(users)
        .values({ ...input, passwordHash: await hashPassword(input.password) });
    }),

  delete: adminProcedure
    .route({
      tags: ["Users"],
      summary: "Delete user",
      description: "Soft deletes a user. Requires admin privileges.",
    })
    .input(deleteUserInputSchema)
    .output(
      z.void().describe("No return value - deletion completed successfully"),
    )
    .handler(async ({ input }) => {
      return await sqliteDb
        .update(users)
        .set({ deletedAt: new Date() })
        .where(eq(users.id, input.id));
    }),

  undoDelete: adminProcedure
    .route({
      tags: ["Users"],
      summary: "Restore user",
      description: "Restores a soft-deleted user. Requires admin privileges.",
    })
    .input(undoDeleteUserInputSchema)
    .output(
      z.void().describe("No return value - restoration completed successfully"),
    )
    .handler(async ({ input }) => {
      return await sqliteDb
        .update(users)
        .set({ deletedAt: null })
        .where(eq(users.id, input.id));
    }),
};
