const LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
} as const;

export type LogLevel = keyof typeof LEVELS;

const REDACTED_KEY = /token|authorization|password|secret|credential|api[_-]?key/i;

let overrideLevel: LogLevel | undefined;

export function setLogLevel(level: LogLevel): void {
  overrideLevel = level;
}

function configuredLevel(): number {
  const raw = overrideLevel ?? process.env.LOG_LEVEL ?? "info";
  if (raw in LEVELS) return LEVELS[raw as LogLevel];
  return LEVELS.info;
}

function sanitize(fields: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    output[key] = REDACTED_KEY.test(key) ? "[redacted]" : value;
  }
  return output;
}

/** Write one JSON log line to stderr. Never writes to stdout. */
export function log(level: LogLevel, message: string, fields?: Record<string, unknown>): void {
  if (LEVELS[level] > configuredLevel()) return;
  const payload: Record<string, unknown> = {
    time: new Date().toISOString(),
    level,
    message,
  };
  if (fields) Object.assign(payload, sanitize(fields));
  process.stderr.write(`${JSON.stringify(payload)}\n`);
}
