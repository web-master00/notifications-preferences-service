import { EvaluationResult } from "../types/evaluation";
import { NotificationType, isMarketing } from "../enums";

export interface EvaluatorInput {
  notificationType: NotificationType;
  globalPolicyEnabled: boolean | null;
  userPreferenceEnabled: boolean | null;
  defaultPreferenceEnabled: boolean | null;
  isQuietHours: boolean;
}

export class NotificationEvaluatorService {
  evaluate(input: EvaluatorInput): EvaluationResult {
    if (input.globalPolicyEnabled === false) {
      return {
        decision: "deny",
        reason: "blocked_by_global_policy",
      };
    }

    if (input.isQuietHours && isMarketing(input.notificationType)) {
      return {
        decision: "deny",
        reason: "blocked_by_quiet_hours",
      };
    }

    if (input.userPreferenceEnabled === false) {
      return {
        decision: "deny",
        reason: "blocked_by_user_preference",
      };
    }

    if (input.userPreferenceEnabled === true) {
      return { decision: "allow", reason: "allowed" };
    }

    if (input.defaultPreferenceEnabled === false) {
      return {
        decision: "deny",
        reason: "blocked_by_default_preference",
      };
    }

    if (input.defaultPreferenceEnabled === true) {
      return { decision: "allow", reason: "allowed" };
    }

    return {
      decision: "deny",
      reason: "no_preference_configured",
    };
  }
}
