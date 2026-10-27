import { describe, expect, it } from "vitest";
import { getNextReminderAt, isReminderDue, type ReminderCycle } from "@/lib/reminderPolicy";

const receiptAt = "2026-10-01T09:00:00.000Z";
const baseCycle: ReminderCycle = {
  receipt: {
    kind: "receipt",
    occurredAt: receiptAt,
    status: 40,
    recipientId: "11111111-1111-4111-8111-111111111111",
    actorRole: 1,
  },
  currentStatus: 40,
  events: [],
  initialDelayDays: 7,
  repeatIntervalDays: 1,
};

describe("reminder policy", () => {
  it("waits seven full days before the first message", () => {
    const dueAt = getNextReminderAt(baseCycle);
    expect(dueAt?.toISOString()).toBe("2026-10-08T09:00:00.000Z");
    expect(isReminderDue(baseCycle, new Date("2026-10-08T08:59:59.999Z"))).toBe(false);
    expect(isReminderDue(baseCycle, new Date("2026-10-08T09:00:00.000Z"))).toBe(true);
  });

  it("schedules the next message one day after the last reminder to the same recipient and role", () => {
    const cycle = {
      ...baseCycle,
      events: [
        {
          kind: "reminder" as const,
          occurredAt: "2026-10-08T09:00:00.000Z",
          status: 40,
          recipientId: baseCycle.receipt.recipientId,
          actorRole: 1,
        },
        {
          kind: "reminder" as const,
          occurredAt: "2026-10-08T10:00:00.000Z",
          status: 40,
          recipientId: "22222222-2222-4222-8222-222222222222",
          actorRole: 1,
        },
      ],
    };
    expect(getNextReminderAt(cycle)?.toISOString()).toBe("2026-10-09T09:00:00.000Z");
  });

  it("stops the cycle after any status change, even if the dossier later returns to the same status", () => {
    const cycle = {
      ...baseCycle,
      events: [{
        kind: "status-change" as const,
        occurredAt: "2026-10-05T10:00:00.000Z",
        previousStatus: 40,
        status: 50,
      }],
    };
    expect(getNextReminderAt(cycle)).toBeUndefined();
    expect(isReminderDue(cycle, new Date("2026-10-09T09:00:00.000Z"))).toBe(false);
  });

  it("stops when the current dossier status differs from the acknowledged stage", () => {
    expect(getNextReminderAt({ ...baseCycle, currentStatus: 60 })).toBeUndefined();
  });

  it("does not schedule for invalid reminder intervals", () => {
    expect(getNextReminderAt({ ...baseCycle, repeatIntervalDays: 0 })).toBeUndefined();
  });
});
