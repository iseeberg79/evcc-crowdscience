import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import z from "zod";

import { SessionTimelineView } from "~/components/session-timeline-view";
import { orpc } from "~/orpc/client";

export const Route = createFileRoute(
  "/dashboard/instances/$instanceId/session",
)({
  validateSearch: z.object({
    sessionRangeHash: z.string(),
  }),
  loaderDeps: ({ search }) => ({ search }),
  component: RouteComponent,
  beforeLoad: async ({ search }) => {
    const session = await orpc.loadingSessions.getSessionByHash.call({
      sessionRangeHash: search.sessionRangeHash,
    });

    if (!session) {
      throw new Error("Session not found");
    }

    return {
      session,
      routeTitle: (() => {
        const start = session.startTime;
        const end = session.endTime;
        const durationMin = Math.round(
          (end - start) / 60000,
        );
        const durationStr =
          durationMin >= 60
            ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`
            : `${durationMin}m`;
        return `${format(new Date(start), "MMM d, HH:mm")} · ${durationStr}`;
      })(),
    };
  },
});

function RouteComponent() {
  const { session } = Route.useRouteContext();

  return <SessionTimelineView session={session} />;
}
