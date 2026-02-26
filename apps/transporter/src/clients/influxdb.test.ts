import { afterEach, describe, expect, mock, test } from "bun:test";
import { HTTPError } from "ky";

import { InfluxWriter, toLineProtocol } from "./influxdb";

function createHTTPError(status: number, body = "{}") {
  return new HTTPError(
    new Response(body, { status }),
    new Request("http://localhost:8086"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    {} as any,
  );
}

describe("toLineProtocol", () => {
  describe("basic line protocol generation", () => {
    test("generates line with measurement, instance tag, and numeric value", () => {
      const metric = {
        measurement: "loadpoints",
        field: "chargePower",
        tags: { componentId: "1" },
      };
      const result = toLineProtocol({
        metric,
        value: "500",
        instanceId: "019f547a-re3b6-7000-b65b-0347fa593d64",
        timestamp: "1762170321",
      });

      expect(result).toBe(
        'loadpoints,instance=019f547a-re3b6-7000-b65b-0347fa593d64,componentId=1 chargePower="500" 1762170321',
      );
    });

    test("generates line with site measurement", () => {
      const metric = {
        measurement: "site",
        field: "battery",
        tags: {},
      };
      const result = toLineProtocol({
        metric,
        value: "3",
        instanceId: "019f547a-re3b6-7000-b65b-0347fa593d64",
        timestamp: "1762170321",
      });

      expect(result).toBe(
        'site,instance=019f547a-re3b6-7000-b65b-0347fa593d64 battery="3" 1762170321',
      );
    });

    test("generates line with battery measurement", () => {
      const metric = {
        measurement: "battery",
        field: "soc",
        tags: { componentId: "1" },
      };
      const result = toLineProtocol({
        metric,
        value: "50",
        instanceId: "019f547a-re3b6-7000-b65b-0347fa593d64",
        timestamp: "1762170321",
      });

      expect(result).toBe(
        'battery,instance=019f547a-re3b6-7000-b65b-0347fa593d64,componentId=1 soc="50" 1762170321',
      );
    });
  });

  describe("string vs numeric value handling", () => {
    test("quotes string values", () => {
      const metric = {
        measurement: "loadpoints",
        field: "mode",
        tags: { componentId: "1" },
      };
      const result = toLineProtocol({
        metric,
        value: "pv",
        instanceId: "019f547a-re3b6-7000-b65b-0347fa593d64",
        timestamp: "1762170321",
      });

      expect(result).toContain('mode="pv"');
    });

    test("handles numeric string values as numbers", () => {
      const metric = {
        measurement: "battery",
        field: "power",
        tags: { componentId: "1" },
      };
      const result = toLineProtocol({
        metric,
        value: 2000,
        instanceId: "019f547a-re3b6-7000-b65b-0347fa593d64",
        timestamp: "1762170321",
      });

      expect(result).toContain("power=2000");
      expect(result).not.toContain('"2000"');
    });

    test("handles boolean-like strings", () => {
      const metric = {
        measurement: "battery",
        field: "controllable",
        tags: { componentId: "1" },
      };
      const result = toLineProtocol({
        metric,
        value: "true",
        instanceId: "019f547a-re3b6-7000-b65b-0347fa593d64",
        timestamp: "1762170321",
      });

      expect(result).toContain('controllable="true"');
    });
  });

  describe("multiple tags handling", () => {
    test("includes all tags except field", () => {
      const metric = {
        measurement: "loadpoints",
        field: "chargePower",
        tags: { componentId: "1", vehicleId: "456" },
      };
      const result = toLineProtocol({
        metric,
        value: "500",
        instanceId: "019f547a-re3b6-7000-b65b-0347fa593d64",
        timestamp: "1762170321",
      });

      expect(result).toContain("instance=");
      expect(result).toContain("componentId=1");
      expect(result).toContain("vehicleId=456");
      expect(result).toContain("chargePower=");
    });

    test("does not include value or field in tags section", () => {
      const metric = {
        measurement: "site",
        field: "battery",
        tags: { value: "shouldIgnore" },
      };
      const result = toLineProtocol({
        metric,
        value: "3",
        instanceId: "019f547a-re3b6-7000-b65b-0347fa593d64",
        timestamp: "1762170321",
      });

      expect(result).not.toContain("value=");
    });
  });

  describe("complex scenarios", () => {
    test("handles PV metrics from real MQTT output", () => {
      const metric = {
        measurement: "pv",
        field: "power",
        tags: { componentId: "1" },
      };
      const result = toLineProtocol({
        metric,
        value: "200",
        instanceId: "019f547a-re3b6-7000-b65b-0347fa593d64",
        timestamp: "1762170321",
      });

      expect(result).toBe(
        'pv,instance=019f547a-re3b6-7000-b65b-0347fa593d64,componentId=1 power="200" 1762170321',
      );
    });

    test("handles updated signal", () => {
      const metric = {
        measurement: "updated",
        field: "updated",
        tags: {},
      };
      const result = toLineProtocol({
        metric,
        value: "1762170351",
        instanceId: "019f547a-re3b6-7000-b65b-0347fa593d64",
        timestamp: "1762170351",
      });

      expect(result).toContain("updated=");
      expect(result).toContain("1762170351");
    });

    test("handles grid metrics", () => {
      const metric = {
        measurement: "grid",
        field: "power",
        tags: {},
      };
      const result = toLineProtocol({
        metric,
        value: "300",
        instanceId: "019f547a-re3b6-7000-b65b-0347fa593d64",
        timestamp: "1762170321",
      });

      expect(result).toBe(
        'grid,instance=019f547a-re3b6-7000-b65b-0347fa593d64 power="300" 1762170321',
      );
    });
  });

  describe("undefined value handling", () => {
    test("includes measurement without field value when value is undefined", () => {
      const metric = {
        measurement: "site",
        field: "battery",
        tags: {},
      };
      const result = toLineProtocol({
        metric,
        value: undefined,
        instanceId: "019f547a-re3b6-7000-b65b-0347fa593d64",
        timestamp: "1762170321",
      });

      expect(result).toContain("site,instance=");
      expect(result).toContain("1762170321");
    });
  });

  describe("object and array value handling", () => {
    test("returns null for plain object values", () => {
      const metric = {
        measurement: "loadpoints",
        field: "plan",
        tags: { componentId: "1" },
      };
      const result = toLineProtocol({
        metric,
        value: { soc: 80, time: "2024-01-01T00:00:00Z" },
        instanceId: "019f547a-re3b6-7000-b65b-0347fa593d64",
        timestamp: "1762170321",
      });

      expect(result).toBeNull();
    });

    test("returns null for array values", () => {
      const metric = {
        measurement: "loadpoints",
        field: "plan",
        tags: { componentId: "1" },
      };
      const result = toLineProtocol({
        metric,
        value: [
          { soc: 80, time: "2024-01-01T00:00:00Z" },
          { soc: 90, time: "2024-01-02T00:00:00Z" },
        ],
        instanceId: "019f547a-re3b6-7000-b65b-0347fa593d64",
        timestamp: "1762170321",
      });

      expect(result).toBeNull();
    });
  });

  describe("timestamp formatting", () => {
    test("includes correct timestamp", () => {
      const metric = {
        measurement: "battery",
        field: "soc",
        tags: { componentId: "1" },
      };
      const result = toLineProtocol({
        metric,
        value: "50",
        instanceId: "test-instance",
        timestamp: "1234567890",
      });

      expect(result!.endsWith("1234567890")).toBe(true);
    });

    test("handles different timestamp formats", () => {
      const metric = {
        measurement: "site",
        field: "power",
        tags: {},
      };
      const result = toLineProtocol({
        metric,
        value: "100",
        instanceId: "test-instance",
        timestamp: "9999999999999",
      });

      expect(result!.endsWith("9999999999999")).toBe(true);
    });
  });
});

describe("InfluxWriter batching", () => {
  function createWriter(options?: {
    flushIntervalMs?: number;
    flushThreshold?: number;
  }) {
    const writer = new InfluxWriter(
      "http://localhost:8086",
      "test-token",
      "test-org",
      "test-bucket",
      {
        // disable periodic flush by default so tests are deterministic
        flushIntervalMs: options?.flushIntervalMs ?? 999_999,
        flushThreshold: options?.flushThreshold ?? 1000,
      },
    );
    // mock the HTTP write method
    writer.write = mock(() => Promise.resolve(""));
    return writer;
  }

  afterEach(() => {
    // nothing shared, each test creates its own writer
  });

  test("addLines buffers lines without flushing", () => {
    const writer = createWriter();
    writer.addLines(["line1", "line2"]);
    expect(writer.bufferedLineCount).toBe(2);
    expect(writer.write).not.toHaveBeenCalled();
    writer.dispose();
  });

  test("flush sends all buffered lines and clears buffer", async () => {
    const writer = createWriter();
    writer.addLines(["line1", "line2", "line3"]);

    const flushed = await writer.flush();

    expect(flushed).toBe(3);
    expect(writer.bufferedLineCount).toBe(0);
    expect(writer.write).toHaveBeenCalledTimes(1);
    expect(writer.write).toHaveBeenCalledWith("line1\nline2\nline3\n");
    writer.dispose();
  });

  test("flush returns 0 when buffer is empty", async () => {
    const writer = createWriter();
    const flushed = await writer.flush();

    expect(flushed).toBe(0);
    expect(writer.write).not.toHaveBeenCalled();
    writer.dispose();
  });

  test("addLines triggers flush when threshold is reached", async () => {
    const writer = createWriter({ flushThreshold: 3 });
    writer.addLines(["line1", "line2", "line3"]);

    // flush is async fire-and-forget, give it a tick to complete
    await new Promise((r) => setTimeout(r, 10));

    expect(writer.write).toHaveBeenCalledTimes(1);
    expect(writer.bufferedLineCount).toBe(0);
    writer.dispose();
  });

  test("addLines does not flush when below threshold", () => {
    const writer = createWriter({ flushThreshold: 5 });
    writer.addLines(["line1", "line2"]);

    expect(writer.write).not.toHaveBeenCalled();
    expect(writer.bufferedLineCount).toBe(2);
    writer.dispose();
  });

  test("failed flush restores lines to buffer for retry", async () => {
    const writer = createWriter();
    writer.write = mock(() => Promise.reject(new Error("network error")));

    writer.addLines(["line1", "line2"]);

    await expect(writer.flush()).rejects.toThrow("network error");
    expect(writer.bufferedLineCount).toBe(2);
    writer.dispose();
  });

  test("failed flush drops lines on 4xx error (bad data, no retry)", async () => {
    const writer = createWriter();
    writer.write = mock(() =>
      Promise.reject(
        createHTTPError(
          400,
          '{"code":"invalid","message":"bad line protocol"}',
        ),
      ),
    );

    writer.addLines(["line1", "line2"]);

    const flushed = await writer.flush(); // should not throw for 4xx
    expect(flushed).toBe(0);
    expect(writer.bufferedLineCount).toBe(0); // lines were dropped, not re-buffered
    writer.dispose();
  });

  test("failed flush re-buffers lines on 5xx error", async () => {
    const writer = createWriter();
    writer.write = mock(() =>
      Promise.reject(createHTTPError(503, '{"code":"unavailable"}')),
    );

    writer.addLines(["line1", "line2"]);

    await expect(writer.flush()).rejects.toThrow();
    expect(writer.bufferedLineCount).toBe(2); // lines preserved for retry
    writer.dispose();
  });

  test("failed flush preserves order when new lines were added", async () => {
    const writer = createWriter();
    let callCount = 0;
    writer.write = mock(() => {
      callCount++;
      if (callCount === 1) return Promise.reject(new Error("fail"));
      return Promise.resolve("");
    });

    writer.addLines(["line1", "line2"]);
    await expect(writer.flush()).rejects.toThrow("fail");

    // add more lines after the failure
    writer.addLines(["line3"]);
    expect(writer.bufferedLineCount).toBe(3);

    // second flush should include the original lines first
    const flushed = await writer.flush();
    expect(flushed).toBe(3);
    expect(writer.write).toHaveBeenLastCalledWith("line1\nline2\nline3\n");
    writer.dispose();
  });

  test("periodic flush fires on interval", async () => {
    const writer = createWriter({ flushIntervalMs: 50 });
    writer.addLines(["line1"]);

    await new Promise((r) => setTimeout(r, 100));

    expect(writer.write).toHaveBeenCalled();
    expect(writer.bufferedLineCount).toBe(0);
    writer.dispose();
  });

  test("threshold flush resets the 10-second timer", async () => {
    // interval = 80ms; threshold = 2 lines
    // at t=30ms we push 2 lines → threshold flush fires and resets the timer
    // the periodic timer would have fired at t=80ms without the reset
    // after reset it should fire at t=30ms + 80ms = t=110ms, not t=80ms
    const writer = createWriter({ flushIntervalMs: 80, flushThreshold: 2 });

    // wait 30ms, then trigger a threshold flush
    await new Promise((r) => setTimeout(r, 30));
    writer.addLines(["line1", "line2"]);

    // give the threshold flush a tick to complete and reschedule
    await new Promise((r) => setTimeout(r, 10));
    expect(writer.write).toHaveBeenCalledTimes(1);

    // at t=80ms the old timer would have fired; verify it did NOT fire again
    await new Promise((r) => setTimeout(r, 45)); // now ~85ms total
    expect(writer.write).toHaveBeenCalledTimes(1); // still just the one threshold flush

    writer.dispose();
  });

  test("periodic flush does not send if buffer is empty", async () => {
    const writer = createWriter({ flushIntervalMs: 50 });

    await new Promise((r) => setTimeout(r, 100));

    expect(writer.write).not.toHaveBeenCalled();
    writer.dispose();
  });

  test("dispose stops periodic flush", async () => {
    const writer = createWriter({ flushIntervalMs: 50 });
    writer.addLines(["line1"]);
    writer.dispose();

    await new Promise((r) => setTimeout(r, 100));

    expect(writer.write).not.toHaveBeenCalled();
    expect(writer.bufferedLineCount).toBe(1);
  });

  test("multiple addLines calls accumulate in buffer", () => {
    const writer = createWriter();
    writer.addLines(["line1"]);
    writer.addLines(["line2", "line3"]);
    writer.addLines(["line4"]);

    expect(writer.bufferedLineCount).toBe(4);
    writer.dispose();
  });
});
