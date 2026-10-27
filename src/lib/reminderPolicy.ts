const DAY_MS = 24 * 60 * 60 * 1000;

export interface ReminderAuditRecord {
  occurredAt: string;
  kind: "receipt" | "status-change" | "reminder";
  status?: number;
  previousStatus?: number;
  recipientId?: string;
  actorRole?: number;
}

export interface ReminderCycle {
  receipt: ReminderAuditRecord;
  currentStatus: number;
  events: ReminderAuditRecord[];
  initialDelayDays: number;
  repeatIntervalDays: number;
}

/** Returns the next eligible send time, or undefined when this receipt cycle is no longer active. */
export function getNextReminderAt(cycle: ReminderCycle): Date | undefined {
  const receiptAt = Date.parse(cycle.receipt.occurredAt);
  if (!Number.isFinite(receiptAt)
    || cycle.receipt.kind !== "receipt"
    || !Number.isInteger(cycle.initialDelayDays)
    || cycle.initialDelayDays < 1
    || !Number.isInteger(cycle.repeatIntervalDays)
    || cycle.repeatIntervalDays < 1
    || cycle.receipt.status === undefined
    || cycle.currentStatus !== cycle.receipt.status) {
    return undefined;
  }

  const laterStatusChange = cycle.events.some((event) => {
    const eventAt = Date.parse(event.occurredAt);
    return event.kind === "status-change"
      && Number.isFinite(eventAt)
      && eventAt > receiptAt
      && event.previousStatus !== undefined
      && event.status !== undefined
      && event.previousStatus !== event.status;
  });
  if (laterStatusChange) return undefined;

  const targetId = cycle.receipt.recipientId;
  const targetRole = cycle.receipt.actorRole;
  const latestReminderAt = cycle.events
    .filter((event) => {
      const eventAt = Date.parse(event.occurredAt);
      return event.kind === "reminder"
        && Number.isFinite(eventAt)
        && eventAt >= receiptAt
        && event.status === cycle.receipt.status
        && (targetId === undefined || event.recipientId === targetId)
        && (targetRole === undefined || event.actorRole === targetRole);
    })
    .reduce((latest, event) => Math.max(latest, Date.parse(event.occurredAt)), 0);

  const nextAt = latestReminderAt
    ? latestReminderAt + cycle.repeatIntervalDays * DAY_MS
    : receiptAt + cycle.initialDelayDays * DAY_MS;
  return new Date(nextAt);
}

export function isReminderDue(cycle: ReminderCycle, now: Date = new Date()): boolean {
  const nextAt = getNextReminderAt(cycle);
  return nextAt !== undefined && now.getTime() >= nextAt.getTime();
}
