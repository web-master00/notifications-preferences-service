import { buildAppGraph } from "../app-graph";
import {
  DEFAULT_PREFERENCES_SEED,
  InMemoryDefaultPreferenceRepository,
  InMemoryGlobalPolicyRepository,
  InMemoryQuietHoursRepository,
  InMemoryUnitOfWork,
  InMemoryUserPreferenceRepository,
  silentLogger,
} from "./in-memory-repositories";

export function buildTestContainer() {
  const defaults = new InMemoryDefaultPreferenceRepository();
  defaults.seed(DEFAULT_PREFERENCES_SEED);
  const userPrefs = new InMemoryUserPreferenceRepository();
  const quietHours = new InMemoryQuietHoursRepository();
  const globalPolicies = new InMemoryGlobalPolicyRepository();
  const uow = new InMemoryUnitOfWork(userPrefs, quietHours);

  const graph = buildAppGraph(
    { defaults, userPrefs, quietHours, globalPolicies },
    uow,
    silentLogger,
  );

  return {
    defaults,
    userPrefs,
    quietHours,
    globalPolicies,
    uow,
    getPrefs: graph.getPrefsUseCase,
    updatePrefs: graph.updatePrefsUseCase,
    evaluate: graph.evaluateUseCase,
  };
}
