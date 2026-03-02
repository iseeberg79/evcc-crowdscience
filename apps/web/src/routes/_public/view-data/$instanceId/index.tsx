import React from "react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { StateTimelineChart } from "~/components/charts/state-timeline-chart";
import { InstanceTimeSeriesEcharts } from "~/components/charts/time-series-chart";
import { MetadataGraph } from "~/components/dashboard-graph";
import { PageTitle } from "~/components/ui/typography";
import { useTimeSeriesSettings } from "~/hooks/use-timeseries-settings";
import { singleInstanceRouteSearchSchema } from "~/lib/globalSchemas";
import { formatCount, formatUnit } from "~/lib/utils";
import { ensureDefaultMeasurementField } from "~/middleware/searchValidationHelpers";
import { orpc } from "~/orpc/client";

export const Route = createFileRoute("/_public/view-data/$instanceId/")({
  component: RouteComponent,
  validateSearch: singleInstanceRouteSearchSchema,
  beforeLoad: ({ search }) => {
    ensureDefaultMeasurementField(search.measurement, search.field);
  },
  loader: async ({ context, params }) => {
    const queryOptions = [
      orpc.sites.getMetaDataValues.queryOptions({
        input: { instanceId: params.instanceId },
      }),
    ];
    await Promise.allSettled(
      queryOptions.map((queryOption) =>
        // @ts-ignore
        context.queryClient.ensureQueryData(queryOption),
      ),
    );
  },
});

function RouteComponent() {
  const { instanceId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { timeRange } = useTimeSeriesSettings();

  const siteMetaData = useSuspenseQuery(
    orpc.sites.getMetaDataValues.queryOptions({ input: { instanceId } }),
  );
  const vehicleMetaData = useSuspenseQuery(
    orpc.vehicles.getMetaData.queryOptions({ input: { instanceId } }),
  );
  const loadpointMetaData = useSuspenseQuery(
    orpc.loadpoints.getMetaData.queryOptions({ input: { instanceId } }),
  );
  const pvMetaData = useSuspenseQuery(
    orpc.pv.getMetaData.queryOptions({ input: { instanceId } }),
  );
  const batteryMetaData = useSuspenseQuery(
    orpc.batteries.getMetaData.queryOptions({ input: { instanceId } }),
  );
  const statistics = useSuspenseQuery(
    orpc.sites.getStatistics.queryOptions({ input: { instanceId } }),
  );

  const gaps = useQuery(
    orpc.instances.getGaps.queryOptions({
      input: { instanceId, timeRange: search.timeRange },
    }),
  );

  const extractedSessions = useQuery(
    orpc.loadingSessions.getExtractedSessions.queryOptions({
      input: { instanceIds: [instanceId] },
    }),
  );

  const activeSeries = React.useMemo(() => {
    if (search.series && search.series.length > 0) {
      return search.series;
    }
    return [
      {
        id: "default",
        measurement: search.measurement,
        field: search.field,
      },
    ];
  }, [search.series, search.measurement, search.field]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <PageTitle>Deine Datenübersicht</PageTitle>
        <div className="flex flex-wrap items-center gap-2"></div>
      </div>

      <div className="grid w-full grid-cols-2 gap-2 md:grid-cols-4 md:gap-4 lg:grid-cols-8 xl:grid-cols-12">
        <StateTimelineChart
          timeRange={timeRange}
          gaps={gaps.data}
          className="col-span-2 h-[10px] overflow-hidden rounded-md border shadow-xs md:col-span-4 md:h-[20px] lg:col-span-8 xl:col-span-12"
        />
        <InstanceTimeSeriesEcharts
          className="col-span-full"
          instanceId={instanceId}
          series={activeSeries}
          onSeriesChange={(series) =>
            navigate({
              replace: true,
              search: (prev) => ({ ...prev, series }),
            })
          }
          extractedSessions={extractedSessions.data}
          gaps={gaps.data}
          pvMetaData={pvMetaData.data}
          loadPointMetaData={loadpointMetaData.data}
          batteryMetaData={batteryMetaData.data}
          vehicleMetaData={vehicleMetaData.data}
        />
        <MetadataGraph
          title="Site Metadata"
          expandKey="site-metadata"
          mainContent={<div>{siteMetaData.data?.version?.value}</div>}
          metaData={{
            count: 1,
            values: { "Instance Site": siteMetaData.data },
          }}
          className="col-span-2"
        />
        <MetadataGraph
          title="Vehicle Metadata"
          expandKey="vehicle-metadata"
          mainContent={
            <div>
              {formatCount(vehicleMetaData.data.count, "Vehicle", "Vehicles")}
            </div>
          }
          metaData={vehicleMetaData.data}
          className="col-span-2"
        />
        <MetadataGraph
          title="Loadpoint Metadata"
          expandKey="loadpoints-metadata"
          mainContent={
            <div>
              {formatCount(
                loadpointMetaData.data.count,
                "Loadpoint",
                "Loadpoints",
              )}
            </div>
          }
          metaData={loadpointMetaData.data}
          className="col-span-2"
        />
        <MetadataGraph
          title="PV Metadata"
          expandKey="pv-metadata"
          mainContent={
            <div>{formatCount(pvMetaData.data.count, "PV", "PVs")}</div>
          }
          metaData={pvMetaData.data}
          className="col-span-2"
        />
        <MetadataGraph
          title="Battery Metadata"
          expandKey="battery-metadata"
          mainContent={
            <div>
              {formatCount(batteryMetaData.data.count, "Battery", "Batteries")}
            </div>
          }
          metaData={batteryMetaData.data}
          className="col-span-2"
        />
        <MetadataGraph
          title="Statistics"
          expandKey="statistics"
          mainContent={
            <div>
              {formatUnit(
                statistics.data.values["30d"]?.chargedKWh?.value,
                "kWh",
              )}{" "}
              Usage{" "}
              <span className="text-sm text-muted-foreground">
                (last 30 days)
              </span>
            </div>
          }
          metaData={statistics.data}
          className="col-span-2"
        />
      </div>
    </div>
  );
}
