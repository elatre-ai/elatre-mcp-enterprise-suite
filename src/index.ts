#!/usr/bin/env node
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadConfig } from "./config.js";
import { startHttp } from "./http.js";
import { startStdio } from "./stdio.js";
import { log } from "./utils/logger.js";

export async function main(): Promise<void> {
  const config = loadConfig();
  if (config.transport === "http") {
    const handle = await startHttp(config);
    const shutdown = async (signal: string): Promise<void> => {
      log("info", "shutdown requested", { signal });
      await handle.close();
      process.exit(0);
    };
    process.on("SIGINT", () => {
      void shutdown("SIGINT");
    });
    process.on("SIGTERM", () => {
      void shutdown("SIGTERM");
    });
    return;
  }
  await startStdio(config.logLevel);
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(path.resolve(entry)).href) {
  main().catch((error: unknown) => {
    log("error", "server failed to start", { error: error instanceof Error ? error.message : "unknown" });
    process.exit(1);
  });
}
