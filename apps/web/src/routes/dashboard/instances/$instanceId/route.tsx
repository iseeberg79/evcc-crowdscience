import { createFileRoute, Outlet } from "@tanstack/react-router";

import { orpc } from "~/orpc/client";

export const Route = createFileRoute("/dashboard/instances/$instanceId")({
  component: RouteComponent,
  beforeLoad: async ({ params, context }) => {
    // load instance data
    const instance = await context.queryClient.ensureQueryData(
      orpc.instances.getById.queryOptions({
        input: { id: params.instanceId },
      }),
    );

    return {
      instance,
      routeTitle: instance.publicName ?? "Instance not found",
    };
  },
});

function RouteComponent() {
  return <Outlet />;
}
