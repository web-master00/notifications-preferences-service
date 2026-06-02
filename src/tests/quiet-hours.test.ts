import { QuietHoursService } from "../domain/services/quiet-hours.service";

const svc = new QuietHoursService();

describe("QuietHoursService", () => {
  const quiet = {
    userId: "u1",
    timezone: "Europe/Berlin",
    startTime: "22:00",
    endTime: "08:00",
  };

  it("treats 21:30 Berlin (overnight) as within quiet hours", () => {
    expect(svc.isWithin(quiet, "2026-05-21T19:30:00Z")).toBe(false);
    expect(svc.isWithin(quiet, "2026-05-21T20:00:00Z")).toBe(true);
  });

  it("treats early-morning Berlin as within quiet hours", () => {
    expect(svc.isWithin(quiet, "2026-05-22T05:00:00Z")).toBe(true);
    expect(svc.isWithin(quiet, "2026-05-22T07:00:00Z")).toBe(false);
  });

  it("treats midday as outside quiet hours", () => {
    expect(svc.isWithin(quiet, "2026-05-22T12:00:00Z")).toBe(false);
  });

  it("returns false when no quiet hours configured", () => {
    expect(svc.isWithin(null, "2026-05-22T05:00:00Z")).toBe(false);
  });

  it("handles non-overnight quiet hours", () => {
    const daytime = {
      userId: "u",
      timezone: "UTC",
      startTime: "09:00",
      endTime: "17:00",
    };
    expect(svc.isWithin(daytime, "2026-05-22T08:59:00Z")).toBe(false);
    expect(svc.isWithin(daytime, "2026-05-22T09:00:00Z")).toBe(true);
    expect(svc.isWithin(daytime, "2026-05-22T17:00:00Z")).toBe(false);
  });
});
