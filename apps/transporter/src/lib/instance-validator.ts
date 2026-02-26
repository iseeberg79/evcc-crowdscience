import { isUuidV7 } from "~/lib/uuid";

/** Validates instance IDs and deduplicates warning logs for invalid ones. */
export class InstanceValidator {
  private readonly invalidIds = new Set<string>();

  constructor(private readonly filterInstanceIds: boolean) {}

  /** Returns true if the instance ID is valid (or filtering is disabled). */
  isValid(instanceId: string): boolean {
    if (!this.filterInstanceIds) return true;
    if (isUuidV7(instanceId)) return true;

    if (!this.invalidIds.has(instanceId)) {
      console.warn("[mqtt] invalid instance id:", instanceId);
      this.invalidIds.add(instanceId);
    }

    return false;
  }

  getInvalidInstanceIds(): string[] {
    return Array.from(this.invalidIds);
  }
}
