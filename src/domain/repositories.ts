import { Channel, NotificationType, Region } from "./enums";
import {
  DefaultPreference,
  GlobalPolicy,
  QuietHours,
  UserPreference,
} from "./entities/preference";

export interface DefaultPreferenceRepository {
  findAll(): Promise<DefaultPreference[]>;
  findOne(
    notificationType: NotificationType,
    channel: Channel,
  ): Promise<DefaultPreference | null>;
}

export interface UserPreferenceRepository {
  findAllForUser(userId: string): Promise<UserPreference[]>;
  findOne(
    userId: string,
    notificationType: NotificationType,
    channel: Channel,
  ): Promise<UserPreference | null>;
  upsert(pref: UserPreference): Promise<UserPreference>;
}

export interface QuietHoursRepository {
  findOne(userId: string): Promise<QuietHours | null>;
  upsert(quiet: QuietHours): Promise<QuietHours>;
  delete(userId: string): Promise<void>;
}

export interface GlobalPolicyRepository {
  findOne(
    region: Region,
    notificationType: NotificationType,
    channel: Channel,
  ): Promise<GlobalPolicy | null>;
}
