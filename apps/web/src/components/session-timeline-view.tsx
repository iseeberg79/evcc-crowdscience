import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { EChartsOption } from "echarts";
import type * as echarts from "echarts";
import ReactECharts from "echarts-for-react";

import { LoadingSpinnerCard } from "~/components/loading-spinner-card";
import { SessionInfo } from "~/components/session-info";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { getChartColor, sharedChartOptions } from "~/constants";
import { orpc } from "~/orpc/client";
import type { ExtractedSession } from "~/orpc/loadingSessions/types";

export const excludedFields = [
  "planProjectedEnd",
  "planProjectedStart",
  "smartCostNextStart",
  "smartCostNextEnd",
  "effectivePlanTime",
];

interface SessionTimelineViewProps {
  session: ExtractedSession;
}

export function SessionTimelineView({ session }: SessionTimelineViewProps) {
  // Fetch historical sessions for comparison
  const { data: historicalSessions } = useQuery(
    orpc.loadingSessions.getExtractedSessions.queryOptions({
      input: {
        instanceIds: [session.instanceId],
      },
    }),
  );

  // Compute historical averages
  const historicalAverage = historicalSessions
    ? (() => {
      const sessionsWithPrice = historicalSessions.filter(
        (s) =>
          s.price != null && s.chargedEnergy != null && s.chargedEnergy > 0,
      );

      const avgPrice =
        sessionsWithPrice.length > 0
          ? sessionsWithPrice.reduce((sum, s) => {
            const energyKwh = (s.chargedEnergy ?? 0) / 1000;
            return sum + (s.price ?? 0) / energyKwh;
          }, 0) / sessionsWithPrice.length
          : undefined;

      // Note: sessionCo2PerKWh is not in the database schema yet,
      // so we skip CO2 comparison for now
      return { avgPrice, avgCo2PerKwh: undefined };
    })()
    : undefined;

  const { data, isLoading } = useQuery(
    orpc.timeSeries.getData.queryOptions({
      input: {
        measurement: "loadpoints",
        instanceId: session.instanceId,
        componentId: session.componentId,
        timeRange: {
          start: session.startTime,
          end: session.endTime,
          windowMinutes: 0,
        },
      },
      select: (data) =>
        data.filter((table) => !excludedFields.includes(table.field)),
    }),
  );

  const option: EChartsOption = {
    ...sharedChartOptions,
    tooltip: {
      trigger: "item",
      triggerOn: "mousemove",
      axisPointer: {
        type: "cross",
        animation: false,
        label: {
          backgroundColor: "#6a7985",
        },
      },
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderColor: "#ccc",
      borderWidth: 1,
      textStyle: {
        color: "#333",
      },
    },
    dataZoom: [
      {
        type: "inside",
        xAxisIndex: 0,
        zoomOnMouseWheel: "shift",
      },
      {
        type: "slider",
        xAxisIndex: 0,
        startValue: session.startTime,
        endValue: session.endTime,
      },
    ],
    xAxis: {
      type: "time",
      min: session.startTime,
      max: session.endTime,
      axisLabel: {
        formatter: {
          year: "{yyyy}",
          month: "{MMM}",
          day: "{MMM} {d}",
          hour: "{HH}:{mm}",
          minute: "{HH}:{mm}",
          second: "{HH}:{mm}:{ss}",
        },
        hideOverlap: true,
        rotate: 0,
      },
      axisLine: {
        lineStyle: {
          color: "#999",
        },
      },
      splitLine: {
        show: true,
        lineStyle: {
          type: "dashed",
          color: "#eee",
        },
      },
    },
    yAxis: {
      type: "value",
      scale: true,
      axisLine: {
        lineStyle: {
          color: "#999",
        },
      },
      splitLine: {
        lineStyle: {
          type: "dashed",
          color: "#eee",
        },
      },
    },
    series: (data ?? []).map((table, index) => {
      const color = getChartColor(index);

      return {
        name: table.field,
        type: "scatter",

        itemStyle: {
          color: color.stroke,
        },
        emphasis: {
          focus: "series",
        },

        data: table.data,
      } satisfies echarts.SeriesOption;
    }),
  };

  return (
    <div className="flex flex-col gap-6">
      <SessionInfo session={session} historicalAverage={historicalAverage} />
      <Card>
        <CardHeader>
          <CardTitle>Session Timeline</CardTitle>
          <CardDescription>
            {format(new Date(session.startTime), "PPpp")} -{" "}
            {format(new Date(session.endTime), "PPpp")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative aspect-video max-h-[1000px] min-h-[300px]">
            {isLoading && <LoadingSpinnerCard message="Loading chart data" />}
            {data?.length && data.length > 0 ? (
              <ReactECharts
                option={option}
                autoResize={true}
                className="size-full"
                style={{ height: "100%", width: "100%" }}
                notMerge={true}
                lazyUpdate={true}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
