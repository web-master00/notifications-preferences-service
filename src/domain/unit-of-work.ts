import {
  QuietHoursRepository,
  UserPreferenceRepository,
} from "./repositories";

export interface TransactionalRepositories {
  userPrefs: UserPreferenceRepository;
  quietHours: QuietHoursRepository;
}

export interface UnitOfWork {
  run<T>(fn: (repos: TransactionalRepositories) => Promise<T>): Promise<T>;
}
