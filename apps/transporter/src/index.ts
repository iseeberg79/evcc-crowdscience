import { createStorage, type StorageValue } from "unstorage";
import memoryDriver from "unstorage/drivers/memory";

import { influxWriter, toLineProtocol } from "~/clients/influxdb";
import { mqttClient } from "~/clients/mqtt";
import { parseEvccTopic } from "~/lib/evcc-topic-parser";
import { filterTopic } from "./lib/filtering";
import { isUuidV7 } from "./lib/uuid";

const TOO_OLD_MILLISECONDS = 1000 * 60 * 10;
const FILTER_INSTANCE_IDS = Bun.env.FILTER_INSTANCE_IDS !== "false";

const invalidInstanceIds = new Set<string>();

const storage = createStorage();
storage.mount("cache", memoryDriver());
storage.mount("collect", memoryDriver());

mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker");
});

mqttClient.subscribe("evcc/#");
mqttClient.on("message", async (topic, rawMessage, packet) => {
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
      console.warn("Invalid instance id", instanceId);
      invalidInstanceIds.add(instanceId);
    }

    return;
  }

  await storage.setItem(`collect/${topic}`, message);

  // when the "updated" signal is received, schedule writing
  if (topic.endsWith("/updated")) {
    setTimeout(() => handleInstanceUpdate(instanceId, message), 1000);
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
  // generate line protocol text for all items
  const lineProtocol =
    items
      .map((item) => {
        // parse the metric from the key (topic)
        const metric = parseEvccTopic(item.key.split(":").slice(3).join("/"));
        if (!metric || !item.value) return null;

        return toLineProtocol({
          metric,
          value: item.value,
          instanceId,
          timestamp,
        });
      })
      // filter out values where parsing failed or the value is null
      .filter(Boolean)
      // join all line protocol texts with a newline
      .join("\n") + "\n";

  console.log(lineProtocol);
  return influxWriter.write(lineProtocol);
}
