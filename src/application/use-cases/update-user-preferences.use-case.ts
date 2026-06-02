import { Channel, NotificationType } from "../../domain/enums";
import { UnitOfWork } from "../../domain/unit-of-work";
import { Logger } from "../../infrastructure/logger";

export interface PreferenceToggleCommand {
  notificationType: NotificationType;
  channel: Channel;
  enabled: boolean;
}

export interface QuietHoursCommand {
  timezone: string;
  startTime: string;
  endTime: string;
}

export interface UpdateUserPreferencesCommand {
  userId: string;
  preferences?: PreferenceToggleCommand[];
  quietHours?: QuietHoursCommand | null;
}

export class UpdateUserPreferencesUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly logger: Logger,
  ) {}

  async execute(
    command: UpdateUserPreferencesCommand,
    requestLogger?: Logger,
  ): Promise<void> {
    const log = requestLogger ?? this.logger;

    await this.uow.run(async (repos) => {
      if (command.preferences) {
        for (const toggle of command.preferences) {
          await repos.userPrefs.upsert({
            userId: command.userId,
            notificationType: toggle.notificationType,
            channel: toggle.channel,
            enabled: toggle.enabled,
          });
        }
      }

      if (command.quietHours === null) {
        await repos.quietHours.delete(command.userId);
      } else if (command.quietHours) {
        await repos.quietHours.upsert({
          userId: command.userId,
          timezone: command.quietHours.timezone,
          startTime: command.quietHours.startTime,
          endTime: command.quietHours.endTime,
        });
      }
    });

    if (command.preferences) {
      for (const toggle of command.preferences) {
        log.info("user_preference_changed", {
          userId: command.userId,
          notificationType: toggle.notificationType,
          channel: toggle.channel,
          enabled: toggle.enabled,
        });
      }
    }

    if (command.quietHours === null) {
      log.info("quiet_hours_cleared", { userId: command.userId });
    } else if (command.quietHours) {
      log.info("quiet_hours_changed", {
        userId: command.userId,
        timezone: command.quietHours.timezone,
        startTime: command.quietHours.startTime,
        endTime: command.quietHours.endTime,
      });
    }
  }
}
