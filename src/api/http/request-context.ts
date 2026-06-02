import { Logger } from "../../infrastructure/logger";

export interface RequestContext {
  logger: Logger;
  requestId: string;
}
