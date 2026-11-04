import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";
import { log, setLogLevel } from "./utils/logger.js";

export async function startStdio(logLevel: "error" | "warn" | "info" | "debug" = "info"): Promise<void> {
  setLogLevel(logLevel);
  const server = createServer();
  const transport = new StdioServerTransport();
  transport.onerror = (error) => {
    log("error", "stdio transport error", { error: error.message });
  };
  await server.connect(transport);
  log("info", "stdio transport connected");
}
