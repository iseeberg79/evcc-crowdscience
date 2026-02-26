import { appendFile } from "node:fs/promises";
import { createStorage, type StorageValue } from "unstorage";
import memoryDriver from "unstorage/drivers/memory";

import { influxWriter, toLineProtocol } from "~/clients/influxdb";
import { mqttClient } from "~/clients/mqtt";
import { parseEvccTopic } from "~/lib/evcc-topic-parser";
import { filterTopic } from "./src/lib/filtering";
import { isUuidV7 } from "./src/lib/uuid";

const TOO_OLD_MILLISECONDS = 1000 * 60 * 10;
const FILTER_INSTANCE_IDS = Bun.env.FILTER_INSTANCE_IDS !== "false";
const FAILED_TOPICS_FILE = "failed-topics.log";

const invalidInstanceIds = new Set<string>();

// Track failed topics in memory to avoid duplicate file writes
const failedTopics = new Set<string>();

// Load existing failed topics from file on startup
try {
  const content = await Bun.file(FAILED_TOPICS_FILE).text();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed) failedTopics.add(trimmed);
  }
} catch {
  // File doesn't exist yet
}

async function logFailedTopic(topic: string): Promise<void> {
  if (failedTopics.has(topic)) return;
  failedTopics.add(topic);
  try {
    await appendFile(FAILED_TOPICS_FILE, topic + "\n");
  } catch (error) {
    console.error(`[log-failed-topic] failed for ${topic}:`, error);
  }
}

const storage = createStorage();
storage.mount("cache", memoryDriver());
storage.mount("collect", memoryDriver());

mqttClient.on("connect", () => {
  console.log("[mqtt] connected");
});

mqttClient.subscribe("evcc/#");
mqttClient.on("message", async (topic, rawMessage, packet) => {
  try {
    const message = rawMessage.toString();
    if (filterTopic(topic) || packet.retain) return;

    const topicSegments = topic.split("/");
    const instanceId = topicSegments[1];

    // skip messages without an instance id
    if (!instanceId) return;

    // make sure the instance id is a valid uuid v7
    // warn only once per instance id
    if (FILTER_INSTANCE_IDS && !isUuidV7(instanceId)) {
      if (!invalidInstanceIds.has(instanceId)) {
        console.warn("[mqtt] invalid instance id:", instanceId);
        invalidInstanceIds.add(instanceId);
      }

      return;
    }

    await storage.setItem(`collect/${topic}`, message);

    // when the "updated" signal is received, schedule writing
    if (topic.endsWith("/updated")) {
      setTimeout(() => {
        handleInstanceUpdate(instanceId, message).catch((error) => {
          console.error(
            `[instance-update] failed for ${instanceId}:`,
            error instanceof Error ? error.message : error,
          );
        });
      }, 1000);
    }
  } catch (error) {
    console.error(
      "[mqtt] failed to process message:",
      error instanceof Error ? error.message : error,
    );
  }
});

async function handleInstanceUpdate(
  instanceId: string,
  timestamp: string,
): Promise<void> {
  const seenItems = await storage
    .getItems(await storage.getKeys(`collect/evcc/${instanceId}`))
    .then((items) => items.sort((a, b) => a.key.localeCompare(b.key)));

  const itemsToWrite: { key: string; value: StorageValue }[] = [];

  for (const item of seenItems) {
    const cacheKey = item.key.replace("collect:", "cache:");
    const previousValue = await storage.getItem(cacheKey);
    const lastWriteTimestamp = (await storage.getMeta(cacheKey))?.lastWrite;

    const valueChanged = previousValue !== item.value;
    const lastWriteTooOld =
      lastWriteTimestamp &&
      typeof lastWriteTimestamp === "number" &&
      // write when then last write was too old
      Date.now() - lastWriteTimestamp > TOO_OLD_MILLISECONDS;

    if (valueChanged || lastWriteTooOld) {
      itemsToWrite.push({
        key: item.key,
        value: item.value,
      });

      // update cache
      await storage.setItem(cacheKey, item.value);
      await storage.setMeta(cacheKey, {
        lastWrite: Date.now(),
      });
    }
  }

  await writeItemsToInflux({ instanceId, items: itemsToWrite, timestamp });

  await Promise.all(seenItems.map((item) => storage.remove(item.key)));
}

async function writeItemsToInflux({
  instanceId,
  items,
  timestamp,
}: {
  instanceId: string;
  items: { key: string; value: StorageValue }[];
  timestamp: string;
}) {
  if (items.length === 0) return;

  // generate line protocol text for all items
  let parseFailures = 0;
  const lines = items
    .map((item) => {
      // parse the metric from the key (topic)
      // the key is in the format collect:evcc:instanceId:topic
      const topic = item.key
        .replace(`collect:evcc:${instanceId}:`, "")
        .replace(/:/g, "/");
      const metric = parseEvccTopic(topic);
      if (!metric) {
        parseFailures++;
        console.warn(`[topic-parsing] failed to parse topic: ${topic}`);
        void logFailedTopic(topic);
        return null;
      }

      if (!item.value) {
        return null;
      }

      return toLineProtocol({
        metric,
        value: item.value,
        instanceId,
        timestamp,
      });
    })
    // filter out values where parsing failed or the value is null
    .filter(Boolean);

  if (lines.length === 0) return;

  const lineProtocol = lines.join("\n") + "\n";

  try {
    await influxWriter.write(lineProtocol);
    console.log(
      `[influx-write] ${lines.length} items for instance ${instanceId}` +
        (parseFailures > 0 ? ` (${parseFailures} topics failed to parse)` : ""),
    );
  } catch (error) {
    console.error(
      `[influx-write] failed to write ${items.length} items for instance ${instanceId}:`,
      error instanceof Error ? error.message : error,
    );
  }
}

// Graceful shutdown
function shutdown(signal: string) {
  console.log(`[shutdown] received ${signal}, shutting down gracefully...`);
  mqttClient.end(false, () => {
    console.log("[shutdown] mqtt disconnected");
    process.exit(0);
  });

  // Force exit after 5 seconds if graceful shutdown hangs
  setTimeout(() => {
    console.warn("[shutdown] timed out, forcing exit");
    process.exit(1);
  }, 5000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
