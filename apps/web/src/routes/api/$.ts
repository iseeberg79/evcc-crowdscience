import { SmartCoercionPlugin } from "@orpc/json-schema";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { onError } from "@orpc/server";
import { CORSPlugin } from "@orpc/server/plugins";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { createFileRoute } from "@tanstack/react-router";

import { getClientSession } from "~/auth";
import { router } from "~/orpc/router";

const handler = new OpenAPIHandler(router, {
  plugins: [
    new CORSPlugin(),
    new SmartCoercionPlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
  ],
  interceptors: [onError(console.error)],
});

async function handle({ request }: { request: Request }) {
  const session = await getClientSession();
  const { matched, response } = await handler.handle(request, {
    prefix: "/api",
    context: { session },
  });

  if (matched) {
    return response;
  }

  return new Response("Not Found", { status: 404 });
}

export const Route = createFileRoute("/api/$")({
  server: { handlers: { ANY: handle } },
});
