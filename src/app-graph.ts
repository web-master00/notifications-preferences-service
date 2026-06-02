import {
  DefaultPreferenceRepository,
  GlobalPolicyRepository,
  QuietHoursRepository,
  UserPreferenceRepository,
} from "./domain/repositories";
import { UnitOfWork } from "./domain/unit-of-work";
import { NotificationEvaluatorService } from "./domain/services/notification-evaluator.service";
import { QuietHoursService } from "./domain/services/quiet-hours.service";
import { EvaluateUseCase } from "./application/use-cases/evaluate.use-case";
import { GetUserPreferencesUseCase } from "./application/use-cases/get-user-preferences.use-case";
import { UpdateUserPreferencesUseCase } from "./application/use-cases/update-user-preferences.use-case";
import { PreferencesController } from "./api/controllers/preferences.controller";
import { EvaluateController } from "./api/controllers/evaluate.controller";
import { Logger } from "./infrastructure/logger";

export interface AppRepositories {
  defaults: DefaultPreferenceRepository;
  userPrefs: UserPreferenceRepository;
  quietHours: QuietHoursRepository;
  globalPolicies: GlobalPolicyRepository;
}

export interface AppGraph {
  getPrefsUseCase: GetUserPreferencesUseCase;
  updatePrefsUseCase: UpdateUserPreferencesUseCase;
  evaluateUseCase: EvaluateUseCase;
  preferencesController: PreferencesController;
  evaluateController: EvaluateController;
}

export function buildAppGraph(
  repos: AppRepositories,
  uow: UnitOfWork,
  logger: Logger,
): AppGraph {
  const evaluator = new NotificationEvaluatorService();
  const quietHoursService = new QuietHoursService();

  const getPrefsUseCase = new GetUserPreferencesUseCase(
    repos.defaults,
    repos.userPrefs,
    repos.quietHours,
  );
  const updatePrefsUseCase = new UpdateUserPreferencesUseCase(uow, logger);
  const evaluateUseCase = new EvaluateUseCase(
    repos.defaults,
    repos.userPrefs,
    repos.quietHours,
    repos.globalPolicies,
    evaluator,
    quietHoursService,
    logger,
  );

  const preferencesController = new PreferencesController(
    getPrefsUseCase,
    updatePrefsUseCase,
  );
  const evaluateController = new EvaluateController(evaluateUseCase);

  return {
    getPrefsUseCase,
    updatePrefsUseCase,
    evaluateUseCase,
    preferencesController,
    evaluateController,
  };
}
