import { Channel, NotificationType, Region } from "../domain/enums";
import {
  DefaultPreference,
  GlobalPolicy,
  QuietHours,
  UserPreference,
} from "../domain/entities/preference";
import {
  DefaultPreferenceRepository,
  GlobalPolicyRepository,
  QuietHoursRepository,
  UserPreferenceRepository,
} from "../domain/repositories";
import {
  TransactionalRepositories,
  UnitOfWork,
} from "../domain/unit-of-work";

const key = (...parts: string[]) => parts.join("::");

export class InMemoryDefaultPreferenceRepository
  implements DefaultPreferenceRepository
{
  private store = new Map<string, DefaultPreference>();

  seed(rows: DefaultPreference[]) {
    for (const row of rows) {
      this.store.set(key(row.notificationType, row.channel), { ...row });
    }
  }

  async findAll(): Promise<DefaultPreference[]> {
    return Array.from(this.store.values()).map((r) => ({ ...r }));
  }

  async findOne(
    notificationType: NotificationType,
    channel: Channel,
  ): Promise<DefaultPreference | null> {
    const row = this.store.get(key(notificationType, channel));
    return row ? { ...row } : null;
  }
}

export class InMemoryUserPreferenceRepository
  implements UserPreferenceRepository
{
  private store = new Map<string, UserPreference>();

  async findAllForUser(userId: string): Promise<UserPreference[]> {
    return Array.from(this.store.values())
      .filter((r) => r.userId === userId)
      .map((r) => ({ ...r }));
  }

  async findOne(
    userId: string,
    notificationType: NotificationType,
    channel: Channel,
  ): Promise<UserPreference | null> {
    const row = this.store.get(key(userId, notificationType, channel));
    return row ? { ...row } : null;
  }

  async upsert(pref: UserPreference): Promise<UserPreference> {
    this.store.set(
      key(pref.userId, pref.notificationType, pref.channel),
      { ...pref },
    );
    return { ...pref };
  }

  size(): number {
    return this.store.size;
  }
}

export class InMemoryQuietHoursRepository implements QuietHoursRepository {
  private store = new Map<string, QuietHours>();

  async findOne(userId: string): Promise<QuietHours | null> {
    const row = this.store.get(userId);
    return row ? { ...row } : null;
  }

  async upsert(quiet: QuietHours): Promise<QuietHours> {
    this.store.set(quiet.userId, { ...quiet });
    return { ...quiet };
  }

  async delete(userId: string): Promise<void> {
    this.store.delete(userId);
  }
}

export class InMemoryGlobalPolicyRepository implements GlobalPolicyRepository {
  private store = new Map<string, GlobalPolicy>();

  seed(rows: GlobalPolicy[]) {
    for (const row of rows) {
      this.store.set(
        key(row.region, row.notificationType, row.channel),
        { ...row },
      );
    }
  }

  async findOne(
    region: Region,
    notificationType: NotificationType,
    channel: Channel,
  ): Promise<GlobalPolicy | null> {
    const row = this.store.get(key(region, notificationType, channel));
    return row ? { ...row } : null;
  }
}

export class InMemoryUnitOfWork implements UnitOfWork {
  constructor(
    private readonly userPrefs: UserPreferenceRepository,
    private readonly quietHours: QuietHoursRepository,
  ) {}

  async run<T>(fn: (repos: TransactionalRepositories) => Promise<T>): Promise<T> {
    return fn({ userPrefs: this.userPrefs, quietHours: this.quietHours });
  }
}

export const silentLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  child: () => silentLogger,
};

export const DEFAULT_PREFERENCES_SEED: DefaultPreference[] = [
  {
    notificationType: "transactional_email",
    channel: "email",
    enabled: true,
  },
  {
    notificationType: "marketing_email",
    channel: "email",
    enabled: false,
  },
  {
    notificationType: "marketing_sms",
    channel: "sms",
    enabled: false,
  },
  {
    notificationType: "marketing_push",
    channel: "push",
    enabled: false,
  },
];
