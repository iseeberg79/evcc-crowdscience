import { appendFile } from "node:fs/promises";

/** Tracks failed topics in memory and persists new ones to a log file. */
export class FailedTopicLogger {
  private topicsInFile = new Set<string>();
  private topicsSeen = new Set<string>();

  constructor(private readonly filePath: string) {}

  /** Load previously logged topics from the file on disk. */
  async load(): Promise<void> {
    try {
      const content = await Bun.file(this.filePath).text();
      this.topicsInFile = new Set(
        content.split("\n").map((line) => line.trim()),
      );
    } catch {
      // File doesn't exist yet
    }
  }

  /** Log a topic that failed to parse. Skips duplicates. */
  async log(topic: string): Promise<void> {
    if (this.topicsSeen.has(topic)) return;
    this.topicsSeen.add(topic);
    try {
      await appendFile(this.filePath, topic + "\n");
    } catch (error) {
      console.error(`[failed-topic-logger] write failed for ${topic}:`, error);
    }
  }

  getSeenFailedTopics(): string[] {
    return Array.from(this.topicsSeen);
  }
}
