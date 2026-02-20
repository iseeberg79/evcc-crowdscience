import * as z from "zod";

export type InfluxPrimitive = string | number | boolean;

export type InfluxValue<TValue = InfluxPrimitive> = {
  value: TValue;
  lastUpdate: number;
};

type LooseRecord<K extends string, V> = Partial<Record<K, V>> &
  Record<string, V>;

export type InfluxFieldValues<
  TProbableFields extends string = string,
  TValue = InfluxPrimitive,
> = LooseRecord<TProbableFields, InfluxValue<TValue>>;

export type MetaData<
  TProbableKeys extends string = string,
  TProbableFields extends string = string,
  TValue = InfluxPrimitive,
> = {
  count: number;
  values: LooseRecord<
    TProbableKeys,
    InfluxFieldValues<TProbableFields, TValue>
  >;
};

// Base schema for common InfluxDB row fields
export const influxRowBaseSchema = z
  .object({
    _field: z.string().describe("Field name in InfluxDB"),
    _value: z
      .union([z.string(), z.number(), z.boolean()])
      .describe("Field value"),
    _time: z
      .string()
      .transform((v) => new Date(v).getTime())
      .describe("Timestamp in ISO format (transformed to milliseconds)"),
  })
  .meta({
    examples: [
      { _field: "power", _value: 1500.5, _time: "2024-01-01T12:00:00Z" },
    ],
  });
