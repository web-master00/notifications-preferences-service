import { NotificationEvaluatorService } from "../../domain/services/notification-evaluator.service";
import { QuietHoursService } from "../../domain/services/quiet-hours.service";
import {
  DefaultPreferenceRepository,
  GlobalPolicyRepository,
  QuietHoursRepository,
  UserPreferenceRepository,
} from "../../domain/repositories";
import {
  EvaluateInput,
  EvaluationResult,
} from "../../domain/types/evaluation";
import { Logger, pseudonymize } from "../../infrastructure/logger";

export class EvaluateUseCase {
  constructor(
    private readonly defaults: DefaultPreferenceRepository,
    private readonly userPrefs: UserPreferenceRepository,
    private readonly quietHoursRepo: QuietHoursRepository,
    private readonly globalPolicies: GlobalPolicyRepository,
    private readonly evaluator: NotificationEvaluatorService,
    private readonly quietHoursService: QuietHoursService,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: EvaluateInput,
    requestLogger?: Logger,
  ): Promise<EvaluationResult> {
    const log = requestLogger ?? this.logger;
    const [globalPolicy, userPref, defaultPref, quiet] = await Promise.all([
      this.globalPolicies.findOne(
        input.region,
        input.notificationType,
        input.channel,
      ),
      this.userPrefs.findOne(
        input.userId,
        input.notificationType,
        input.channel,
      ),
      this.defaults.findOne(input.notificationType, input.channel),
      this.quietHoursRepo.findOne(input.userId),
    ]);

    const isQuietHours = this.quietHoursService.isWithin(quiet, input.datetime);

    const result = this.evaluator.evaluate({
      notificationType: input.notificationType,
      globalPolicyEnabled: globalPolicy?.enabled ?? null,
      userPreferenceEnabled: userPref?.enabled ?? null,
      defaultPreferenceEnabled: defaultPref?.enabled ?? null,
      isQuietHours,
    });

    log.info("evaluate_decision", {
      userIdHash: pseudonymize(input.userId),
      notificationType: input.notificationType,
      channel: input.channel,
      region: input.region,
      datetime: input.datetime,
      decision: result.decision,
      reason: result.reason,
    });

    return result;
  }
}
