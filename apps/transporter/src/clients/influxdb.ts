import ky, { HTTPError } from "ky";
import type { StorageValue } from "unstorage";

import type { Metric } from "~/lib/topic-parser";

const DEFAULT_FLUSH_INTERVAL_MS = 10_000;
const DEFAULT_FLUSH_THRESHOLD = 1000;

export class InfluxWriter {
  private buffer: string[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly flushThreshold: number;
  private readonly flushIntervalMs: number;

  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
    private readonly org: string,
    private readonly bucket: string,
    options?: {
      flushIntervalMs?: number;
      flushThreshold?: number;
    },
  ) {
    this.flushThreshold = options?.flushThreshold ?? DEFAULT_FLUSH_THRESHOLD;
    this.flushIntervalMs =
      options?.flushIntervalMs ?? DEFAULT_FLUSH_INTERVAL_MS;
    this.schedulePeriodicFlush();
  }

  /** Schedule a single periodic flush. Reschedules itself after each run. */
  private schedulePeriodicFlush(): void {
    this.flushTimer = setTimeout(() => {
      this.flush()
        .catch(async (error) => {
          console.error(
            "[influx-batch] periodic flush failed:",
            error instanceof Error ? error.message : error,
          );
          if (error instanceof HTTPError) {
            const body = await error.response
              .text()
              .catch(() => "(unreadable)");
            console.error(`[influx-batch] InfluxDB error body:`, body);
          }
        })
        .finally(() => {
          this.schedulePeriodicFlush();
        });
    }, this.flushIntervalMs);

    // allow the process to exit even if the timer is still pending
    if (this.flushTimer && "unref" in this.flushTimer) {
      (this.flushTimer as { unref(): void }).unref();
    }
  }

  /** Add lines to the internal buffer. Triggers a flush and resets the timer when the threshold is reached. */
  addLines(lines: string[]): void {
    this.buffer.push(...lines);

    if (this.buffer.length >= this.flushThreshold) {
      // cancel the pending periodic flush so the next one starts fresh after this flush
      if (this.flushTimer) {
        clearTimeout(this.flushTimer);
        this.flushTimer = null;
      }

      this.flush()
        .catch(async (error) => {
          console.error(
            "[influx-batch] threshold flush failed:",
            error instanceof Error ? error.message : error,
          );
          if (error instanceof HTTPError) {
            const body = await error.response
              .text()
              .catch(() => "(unreadable)");
            console.error(`[influx-batch] InfluxDB error body:`, body);
          }
        })
        .finally(() => {
          this.schedulePeriodicFlush();
        });
    }
  }

  /** Flush buffered lines to InfluxDB. Returns the number of lines flushed. */
  async flush(): Promise<number> {
    if (this.buffer.length === 0) return 0;

    // swap buffer so new lines don't interfere with the in-flight request
    const lines = this.buffer;
    this.buffer = [];

    const lineProtocol = lines.join("\n") + "\n";

    try {
      await this.write(lineProtocol);
      console.log(`[influx-batch] flushed ${lines.length} lines`);
      return lines.length;
    } catch (error) {
      if (error instanceof HTTPError) {
        const body = await error.response.text().catch(() => "(unreadable)");
        if (error.response.status < 500) {
          // 4xx = bad data; retrying will never succeed, drop the lines
          console.error(
            `[influx-batch] dropping ${lines.length} lines due to client error (${error.response.status}): ${body}`,
          );
          return 0;
        }
        console.error(
          `[influx-batch] server error (${error.response.status}): ${body}`,
        );
      }
      // put lines back at the front of the buffer so they are retried
      this.buffer.unshift(...lines);
      throw error;
    }
  }

  /** Stop the periodic flush timer. */
  dispose(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }

  get bufferedLineCount(): number {
    return this.buffer.length;
  }

  async write(
    lineProtocol: string,
    precision: "ns" | "us" | "ms" | "s" | "m" | "h" = "s",
  ) {
    return await ky
      .post(`${this.baseUrl}/api/v2/write`, {
        searchParams: {
          org: this.org,
          bucket: this.bucket,
          precision,
        },
        headers: {
          Authorization: `Token ${this.token}`,
          "Content-Type": "text/plain; charset=utf-8",
          Accept: "application/json",
        },
        body: lineProtocol,
        retry: 1,
      })
      .text();
  }

  async delete(start: string, stop: string) {
    return await ky
      .post(`${this.baseUrl}/api/v2/delete`, {
        searchParams: {
          org: this.org,
          bucket: this.bucket,
        },
        json: {
          start,
          stop,
        },

        headers: {
          Authorization: `Token ${this.token}`,
        },
      })
      .text();
  }
}

export function toLineProtocol({
  metric,
  value,
  instanceId,
  timestamp,
}: {
  metric: Metric;
  value?: StorageValue;
  instanceId: string;
  timestamp: string;
}): string | null {
  // Arrays and plain objects cannot be represented as line protocol field values
  if (typeof value === "object" && value !== null) {
    console.warn(
      `[influx-batch] dropping line due to invalid value type: ${typeof value} (${JSON.stringify(metric)} ${JSON.stringify(value)})`,
    );
    return null;
  }

  let line = `${metric.measurement},instance=${instanceId}`;
  const field = metric.field;

  for (const [key, value] of Object.entries(metric.tags)) {
    if (key === "field" || key === "value") {
      continue;
    }
    line += `,${key}=${value}`;
  }

  if (field) {
    const valueString =
      typeof value === "string" ? `"${value}"` : value?.toString();
    line += ` ${field}=${valueString}`;
  }

  line += ` ${timestamp}`;

  return line;
}

export const influxWriter = new InfluxWriter(
  Bun.env.INFLUXDB_URL!,
  Bun.env.INFLUXDB_TOKEN!,
  Bun.env.INFLUXDB_ORG!,
  Bun.env.INFLUXDB_BUCKET!,
);
