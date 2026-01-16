import { createORPCClient, onError } from "@orpc/client";
import type { ContractRouterClient } from "@orpc/contract";
import { ResponseValidationPlugin } from "@orpc/contract/plugins";
import type { JsonifiedClient } from "@orpc/openapi-client";
import { OpenAPILink } from "@orpc/openapi-client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import contractJson from "./contract.json";
import type { router } from "./router";

// Cast the contract JSON to the router type for type safety
const contract = contractJson as unknown as typeof router;

const getHeaders = createIsomorphicFn()
  .server(() => getRequestHeaders)
  .client(() => undefined);

const getUrl = createIsomorphicFn()
  .server(() => (process.env.BASE_URL ?? "http://localhost:3000") + "/api")
  .client(() => `${window.location.origin}/api`);

const link = new OpenAPILink(contract, {
  interceptors: [onError(console.error)],
  plugins: [new ResponseValidationPlugin(contract)],
  fetch: (request, init) => {
    return globalThis.fetch(request, {
      ...init,
      credentials: "include",
    });
  },
  url: getUrl,
  headers: getHeaders(),
});

export const client: JsonifiedClient<ContractRouterClient<typeof contract>> =
  createORPCClient(link);
export const orpc = createTanstackQueryUtils(client);
