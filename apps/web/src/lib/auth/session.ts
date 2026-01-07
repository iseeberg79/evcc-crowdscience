import { createServerOnlyFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";

import { env } from "~/env";

export type SessionUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
};

export type Session = {
  user: SessionUser;
};

export async function hashPassword(password: string) {
  return await Bun.password.hash(password);
}

export async function verifyPassword(password: string, hash: string) {
  return await Bun.password.verify(password, hash);
}

export const useServerSideAppSession = createServerOnlyFn(async () => {
  return useSession<Session>({
    password: env.AUTH_SECRET,
  });
});

export type DefaultContext = {
  session: Partial<Session>;
  internal?: boolean;
};
