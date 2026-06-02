import "dotenv/config";
import http from "node:http";
import { buildContainer } from "./composition-root";

const { router, logger, prisma } = buildContainer();

const port = Number(process.env.PORT ?? 3000);
const server = http.createServer(router);

server.listen(port, () => {
  logger.info("server_started", { port });
});

async function shutdown(signal: string) {
  logger.info("server_shutdown_started", { signal });
  server.close(async () => {
    await prisma.$disconnect();
    logger.info("server_shutdown_complete");
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
