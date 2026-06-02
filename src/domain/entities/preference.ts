import { Channel, NotificationType, Region } from "../enums";

export interface DefaultPreference {
  notificationType: NotificationType;
  channel: Channel;
  enabled: boolean;
}

export interface UserPreference {
  userId: string;
  notificationType: NotificationType;
  channel: Channel;
  enabled: boolean;
}

export interface QuietHours {
  userId: string;
  timezone: string;
  startTime: string;
  endTime: string;
}

export interface GlobalPolicy {
  region: Region;
  notificationType: NotificationType;
  channel: Channel;
  enabled: boolean;
}

export interface ResolvedPreference {
  notificationType: NotificationType;
  channel: Channel;
  enabled: boolean;
  source: "user" | "default";
}

export interface UserPreferencesView {
  userId: string;
  preferences: ResolvedPreference[];
  quietHours: QuietHours | null;
}
