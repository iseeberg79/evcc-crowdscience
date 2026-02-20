import { redirect } from "@tanstack/react-router";

import { possibleMeasurementsConfig } from "~/lib/time-series-config";

export function ensureDefaultMeasurementField(
  measurement: string,
  field?: string,
) {
  const measurementConfig = possibleMeasurementsConfig[measurement];
  if (!measurementConfig) return;

  const availableFields = Object.keys(measurementConfig.fields);
  if (availableFields.length === 0) return;

  // If no field is selected or the selected field doesn't exist, redirect to default
  if (!field || !availableFields.includes(field)) {
    throw redirect({
      to: ".",
      search: (prev) => ({
        ...prev,
        field: availableFields[0],
      }),
    });
  }
}
