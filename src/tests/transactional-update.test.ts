import {
  TransactionalRepositories,
  UnitOfWork,
} from "../domain/unit-of-work";
import { UpdateUserPreferencesUseCase } from "../application/use-cases/update-user-preferences.use-case";
import {
  InMemoryQuietHoursRepository,
  InMemoryUserPreferenceRepository,
} from "./in-memory-repositories";

function makeLogger() {
  const events: string[] = [];
  const logger = {
    info: (event: string) => events.push(event),
    warn: () => {},
    error: () => {},
    child() {
      return this;
    },
  };
  return { events, logger };
}

describe("UpdateUserPreferencesUseCase transactional behavior", () => {
  it("propagates errors from UoW and does not log success events", async () => {
    const userPrefs = new InMemoryUserPreferenceRepository();
    const quietHours = new InMemoryQuietHoursRepository();
    quietHours.upsert = async () => {
      throw new Error("simulated_db_failure");
    };

    const uow: UnitOfWork = {
      run<T>(fn: (repos: TransactionalRepositories) => Promise<T>): Promise<T> {
        return fn({ userPrefs, quietHours });
      },
    };

    const { events, logger } = makeLogger();
    const useCase = new UpdateUserPreferencesUseCase(uow, logger);

    await expect(
      useCase.execute({
        userId: "user-x",
        preferences: [
          {
            notificationType: "marketing_email",
            channel: "email",
            enabled: false,
          },
        ],
        quietHours: {
          timezone: "UTC",
          startTime: "22:00",
          endTime: "08:00",
        },
      }),
    ).rejects.toThrow("simulated_db_failure");

    expect(events).toEqual([]);
  });

  it("commits all changes and logs after the transaction succeeds", async () => {
    const userPrefs = new InMemoryUserPreferenceRepository();
    const quietHours = new InMemoryQuietHoursRepository();

    const uow: UnitOfWork = {
      run<T>(fn: (repos: TransactionalRepositories) => Promise<T>): Promise<T> {
        return fn({ userPrefs, quietHours });
      },
    };

    const { events, logger } = makeLogger();
    const useCase = new UpdateUserPreferencesUseCase(uow, logger);

    await useCase.execute({
      userId: "user-y",
      preferences: [
        {
          notificationType: "marketing_email",
          channel: "email",
          enabled: false,
        },
      ],
      quietHours: {
        timezone: "UTC",
        startTime: "22:00",
        endTime: "08:00",
      },
    });

    expect(events).toContain("user_preference_changed");
    expect(events).toContain("quiet_hours_changed");

    const stored = await userPrefs.findAllForUser("user-y");
    expect(stored).toHaveLength(1);
    const qh = await quietHours.findOne("user-y");
    expect(qh).not.toBeNull();
  });

  it("uses the request-scoped logger when provided", async () => {
    const userPrefs = new InMemoryUserPreferenceRepository();
    const quietHours = new InMemoryQuietHoursRepository();
    const uow: UnitOfWork = {
      run<T>(fn: (repos: TransactionalRepositories) => Promise<T>): Promise<T> {
        return fn({ userPrefs, quietHours });
      },
    };

    const defaultLogger = makeLogger();
    const requestLogger = makeLogger();

    const useCase = new UpdateUserPreferencesUseCase(uow, defaultLogger.logger);

    await useCase.execute(
      {
        userId: "u",
        preferences: [
          {
            notificationType: "marketing_sms",
            channel: "sms",
            enabled: true,
          },
        ],
      },
      requestLogger.logger,
    );

    expect(defaultLogger.events).toEqual([]);
    expect(requestLogger.events).toContain("user_preference_changed");
  });
});
