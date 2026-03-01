export function filterTopic(topic: string): boolean {
  // Filter configuration and metadata topics
  const configPrefixes = [
    "site/config",
    "site/database",
    "site/eebus/",
    "site/hems/",
    "site/influx/",
    "site/messaging/",
    "site/modbusproxy/",
    "site/mqtt/",
    "site/network/",
    "site/ocpp/",
    "site/shm/",
    "site/sponsor/",
    "site/tariffs/",
    "site/authProviders/",
  ];
  const topicSuffix = topic.replace(/^evcc\/[^/]+\//, "");
  if (configPrefixes.some((prefix) => topicSuffix.startsWith(prefix))) return true;

  // Filter invalid substrings
  const invalidSubstrings = [
    "title",
    "vehicleodometer",
    "tariffprice",
    "tariffco2",
    "forecast",
    "evopt",
  ];
  if (
    invalidSubstrings.some((substring) =>
      topic.toLowerCase().includes(substring),
    )
  )
    return true;

  return false;
}
