import { DateTime } from "luxon";
import { QuietHours } from "../entities/preference";

export class QuietHoursService {
  isWithin(quiet: QuietHours | null, isoDatetime: string): boolean {
    if (!quiet) return false;

    const moment = DateTime.fromISO(isoDatetime, { zone: "utc" }).setZone(
      quiet.timezone,
    );
    if (!moment.isValid) return false;

    const currentMinutes = moment.hour * 60 + moment.minute;
    const start = this.toMinutes(quiet.startTime);
    const end = this.toMinutes(quiet.endTime);
    if (start === null || end === null) return false;

    if (start === end) {
      return false;
    }

    if (start < end) {
      return currentMinutes >= start && currentMinutes < end;
    }

    return currentMinutes >= start || currentMinutes < end;
  }

  private toMinutes(value: string): number | null {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
    if (!match || match[1] === undefined || match[2] === undefined) return null;
    return Number(match[1]) * 60 + Number(match[2]);
  }
}
