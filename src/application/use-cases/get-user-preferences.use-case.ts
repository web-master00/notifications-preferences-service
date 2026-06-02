import {
  DefaultPreferenceRepository,
  QuietHoursRepository,
  UserPreferenceRepository,
} from "../../domain/repositories";
import {
  ResolvedPreference,
  UserPreferencesView,
} from "../../domain/entities/preference";
import { Channel, NotificationType } from "../../domain/enums";

const pairKey = (type: NotificationType, channel: Channel) =>
  `${type}::${channel}`;

export class GetUserPreferencesUseCase {
  constructor(
    private readonly defaults: DefaultPreferenceRepository,
    private readonly userPrefs: UserPreferenceRepository,
    private readonly quietHours: QuietHoursRepository,
  ) {}

  async execute(userId: string): Promise<UserPreferencesView> {
    const [defaults, overrides, quiet] = await Promise.all([
      this.defaults.findAll(),
      this.userPrefs.findAllForUser(userId),
      this.quietHours.findOne(userId),
    ]);

    const resolved = new Map<string, ResolvedPreference>();

    for (const d of defaults) {
      resolved.set(pairKey(d.notificationType, d.channel), {
        notificationType: d.notificationType,
        channel: d.channel,
        enabled: d.enabled,
        source: "default",
      });
    }

    for (const o of overrides) {
      resolved.set(pairKey(o.notificationType, o.channel), {
        notificationType: o.notificationType,
        channel: o.channel,
        enabled: o.enabled,
        source: "user",
      });
    }

    return {
      userId,
      preferences: Array.from(resolved.values()),
      quietHours: quiet,
    };
  }
}
