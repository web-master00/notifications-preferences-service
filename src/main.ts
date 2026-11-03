import "dotenv/config";
import http from "node:http";
import { buildContainer } from "./composition-root";

const { router, logger, prisma } = buildContainer();

const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("PORT must be an integer between 1 and 65535");
}

const server = http.createServer(router);

server.listen(port, () => {
  logger.info("server_started", { port });
});

let isShuttingDown = false;

async function shutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info("server_shutdown_started", { signal });

  const forceCloseTimer = setTimeout(() => {
    logger.warn("server_shutdown_timeout", { signal });
    server.closeAllConnections();
  }, 10_000);
  forceCloseTimer.unref();

  server.close(async (error) => {
    clearTimeout(forceCloseTimer);
    if (error) {
      logger.error("server_close_failed", {
        message: error.message,
      });
      process.exitCode = 1;
    }

    try {
      await prisma.$disconnect();
      logger.info("server_shutdown_complete");
    } catch (disconnectError) {
      logger.error("database_disconnect_failed", {
        message:
          disconnectError instanceof Error
            ? disconnectError.message
            : "unknown_error",
      });
      process.exitCode = 1;
    }
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

server.on("error", (error) => {
  logger.error("server_error", { message: error.message });
  process.exitCode = 1;
});
