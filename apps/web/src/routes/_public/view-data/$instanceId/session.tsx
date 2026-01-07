import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { SessionTimelineView } from "~/components/session-timeline-view";
import { orpc } from "~/orpc/client";

export const Route = createFileRoute("/_public/view-data/$instanceId/session")({
  component: RouteComponent,
  validateSearch: z.object({
    sessionRangeHash: z.string(),
  }),
  loaderDeps: ({ search }) => ({ search }),
  beforeLoad: async ({ search }) => {
    const session = await orpc.loadingSessions.getSessionByHash.call({
      sessionRangeHash: search.sessionRangeHash,
    });

    if (!session) {
      throw new Error("Session not found");
    }
    return { session };
  },
});

function RouteComponent() {
  const { session } = Route.useRouteContext();

  return <SessionTimelineView session={session} />;
}
