import { Channel, NotificationType, Region } from "../enums";

export type EvaluationDecision = "allow" | "deny";

export type EvaluationReason =
  | "allowed"
  | "blocked_by_global_policy"
  | "blocked_by_user_preference"
  | "blocked_by_default_preference"
  | "blocked_by_quiet_hours"
  | "no_preference_configured";

export interface EvaluationResult {
  decision: EvaluationDecision;
  reason: EvaluationReason;
}

export interface EvaluateInput {
  userId: string;
  notificationType: NotificationType;
  channel: Channel;
  region: Region;
  datetime: string;
}
