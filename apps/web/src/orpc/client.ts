import { createORPCClient, onError } from "@orpc/client";
import type { ContractRouterClient } from "@orpc/contract";
import { OpenAPILink } from "@orpc/openapi-client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import contractJson from "./contract.json";
import type { router } from "./router";

// Cast the contract JSON to the router type for type safety
const contract = contractJson as typeof router;

const getORPCClient = createIsomorphicFn()
  .server(() => {
    const link = new OpenAPILink(contract, {
      url: process.env.BASE_URL ?? "http://localhost:3000/api",
      headers: () => getRequestHeaders(),
      interceptors: [onError(console.error)],
      fetch: (request, init) => {
        return globalThis.fetch(request, {
          ...init,
          credentials: "include",
        });
      },
    });

    return createORPCClient(link);
  })
  .client(() => {
    const link = new OpenAPILink(contract, {
      url: `${window.location.origin}/api`,
      interceptors: [onError(console.error)],
      fetch: (request, init) => {
        return globalThis.fetch(request, {
          ...init,
          credentials: "include",
        });
      },
    });

    return createORPCClient(link);
  });

export const client: ContractRouterClient<typeof contract> = getORPCClient();
export const orpc = createTanstackQueryUtils(client);
