import { OpenAPIGenerator } from "@orpc/openapi";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";

import { router } from "./router";

const generator = new OpenAPIGenerator({
  schemaConverters: [new ZodToJsonSchemaConverter()],
});

export const spec = await generator.generate(router, {
  info: {
    title: "EVCC CrowdScience API",
    version: "1.0.0",
    description: "API for solar charging analytics and data collection",
    contact: {
      name: "EVCC CrowdScience",
      url: "https://github.com/evcc-io/evcc",
    },
  },
  servers: [
    {
      url: "http://localhost:3000/api",
      description: "Development",
    },
    {
      url: "/api",
      description: "Production",
    },
  ],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Bearer token for authenticated requests",
      },
    },
  },
});
