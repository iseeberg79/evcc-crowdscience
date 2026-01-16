import { useMemo } from "react";
import ReactECharts from "echarts-for-react";

import { cn, histogram } from "~/lib/utils";

export function HistogramPreview({
  data,
  range,
  binSize,
  className,
}: {
  data: number[];
  range: [number, number];
  binSize: number;
  className?: string;
}) {
  const histogramData = useMemo(
    () => histogram({ data, range, binSize }),
    [data, range, binSize],
  );

  const xAxisData = Array.from(
    { length: histogramData.length },
    (_, i) => range[0] + i * binSize,
  );

  const option = useMemo(
    () => ({
      animation: false,
      grid: {
        left: 0,
        right: 0,
        top: 5,
        bottom: 0,
        containLabel: false,
      },
      xAxis: {
        type: "category",
        data: xAxisData,
        show: false,
      },
      yAxis: {
        type: "value",
        show: false,
      },
      series: [
        {
          data: histogramData,
          type: "bar",
          itemStyle: {
            color: "hsl(173 58% 39% / 0.5)",
            borderColor: "hsl(173 58% 39% / 0.5)",
            borderWidth: 0,
          },
          barGap: 0,
          barCategoryGap: 0,
          smooth: false,
        },
      ],
    }),
    [xAxisData, histogramData],
  );

  return (
    <div className={cn("h-[20px]", className)}>
      <ReactECharts
        option={option}
        style={{ width: "100%", height: "100%" }}
        opts={{ renderer: "svg" }}
        notMerge={true}
        lazyUpdate={false}
      />
    </div>
  );
}
