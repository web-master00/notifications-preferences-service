export const NOTIFICATION_TYPES = [
  "transactional_email",
  "marketing_email",
  "marketing_sms",
  "marketing_push",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const CHANNELS = ["email", "sms", "push"] as const;
export type Channel = (typeof CHANNELS)[number];

export const REGIONS = ["EU", "US", "APAC"] as const;
export type Region = (typeof REGIONS)[number];

const TRANSACTIONAL_TYPES = new Set<NotificationType>(["transactional_email"]);

export function isTransactional(type: NotificationType): boolean {
  return TRANSACTIONAL_TYPES.has(type);
}

export function isMarketing(type: NotificationType): boolean {
  return !isTransactional(type);
}
