import { useMemo } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";

import type { TimeSeriesConfig } from "~/lib/globalSchemas";
import { possibleMeasurementsConfig } from "~/lib/time-series-config";
import type { MetaData } from "~/orpc/types";
import { TimeSeriesSettingsPicker } from "./time-series-settings-picker";
import { Button } from "./ui/button";
import { Combobox } from "./ui/combo-box";
import { Label } from "./ui/label";

interface SeriesConfiguratorProps {
  series: TimeSeriesConfig[];
  onChange: (series: TimeSeriesConfig[]) => void;
  pvMetaData?: MetaData;
  loadPointMetaData?: MetaData;
  batteryMetaData?: MetaData;
  vehicleMetaData?: MetaData;
}

export function SeriesConfigurator({
  series,
  onChange,
  pvMetaData,
  loadPointMetaData,
  batteryMetaData,
  vehicleMetaData,
}: SeriesConfiguratorProps) {
  // Create metadata mapping for each measurement type
  const metadataByMeasurement = useMemo(
    () => ({
      pv: pvMetaData,
      loadpoints: loadPointMetaData,
      battery: batteryMetaData,
      vehicles: vehicleMetaData,
    }),
    [pvMetaData, loadPointMetaData, batteryMetaData, vehicleMetaData],
  );

  const handleAddSeries = () => {
    onChange([
      ...series,
      {
        id: crypto.randomUUID(),
        measurement: "pv",
        field: "power",
      },
    ]);
  };

  const handleUpdateSeries = (
    id: string,
    updates: Partial<TimeSeriesConfig>,
  ) => {
    onChange(series.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const handleRemoveSeries = (id: string) => {
    onChange(series.filter((s) => s.id !== id));
  };

  return (
    <div className="flex flex-col gap-4 border-t bg-muted/20 p-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h4 className="text-sm leading-none font-medium">Data Series</h4>
            <TimeSeriesSettingsPicker />
          </div>
          <Button variant="outline" size="sm" onClick={handleAddSeries}>
            <PlusIcon className="mr-2 size-4" /> Add Series
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          {series.map((s) => (
            <SeriesItem
              key={s.id}
              config={s}
              onUpdate={(updates) => handleUpdateSeries(s.id, updates)}
              onRemove={() => handleRemoveSeries(s.id)}
              metadataByMeasurement={metadataByMeasurement}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SeriesItem({
  config,
  onUpdate,
  onRemove,
  metadataByMeasurement,
}: {
  config: TimeSeriesConfig;
  onUpdate: (updates: Partial<TimeSeriesConfig>) => void;
  onRemove: () => void;
  metadataByMeasurement: Record<string, MetaData | undefined>;
}) {
  const measurementOptions = useMemo(
    () =>
      Object.entries(possibleMeasurementsConfig).map(([key, value]) => ({
        value: key,
        label: value.label,
      })),
    [],
  );

  const fieldOptions = useMemo(() => {
    const options: Record<string, { value: string; label: string }> = {};
    for (const [key, value] of Object.entries(
      possibleMeasurementsConfig?.[config.measurement]?.fields ?? {},
    )) {
      options[key] ??= {
        value: key,
        label: value.label,
      };
    }

    return Object.values(options);
  }, [config.measurement]);

  const componentIdOptions = useMemo(() => {
    const metadata = metadataByMeasurement[config.measurement];
    if (!metadata?.values) {
      return [];
    }

    const componentIds = Object.keys(metadata.values);
    if (componentIds.length === 0) {
      return [];
    }

    // Add "All" option at the beginning
    return [
      { value: "", label: "All Components" },
      ...componentIds.map((id) => ({
        value: id,
        label: id,
      })),
    ];
  }, [config.measurement, metadataByMeasurement]);

  const hasComponentIdOptions = componentIdOptions.length > 0;

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center">
      <div
        className={`grid flex-1 gap-2 ${hasComponentIdOptions ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2"}`}
      >
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground md:hidden">
            Measurement
          </Label>
          <Combobox
            className="w-full"
            options={measurementOptions}
            value={config.measurement}
            onChange={(value) => {
              const defaultField = Object.keys(
                possibleMeasurementsConfig[value].fields,
              )[0];
              onUpdate({
                measurement: value,
                field: defaultField,
                componentId: undefined,
              });
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground md:hidden">
            Field
          </Label>
          <Combobox
            className="w-full"
            options={fieldOptions}
            value={config.field}
            onChange={(value) => onUpdate({ field: value })}
          />
        </div>
        {hasComponentIdOptions && (
          <div className="col-span-2 flex flex-col gap-1 md:col-span-1">
            <Label className="text-xs text-muted-foreground md:hidden">
              Component ID
            </Label>
            <Combobox
              className="w-full"
              options={componentIdOptions}
              value={config.componentId ?? ""}
              onChange={(value) =>
                onUpdate({ componentId: value || undefined })
              }
            />
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
        title="Remove series"
      >
        <Trash2Icon className="size-4" />
      </Button>
    </div>
  );
}
