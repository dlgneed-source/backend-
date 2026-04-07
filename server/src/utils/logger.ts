const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL as keyof typeof LOG_LEVELS] ?? LOG_LEVELS.info;

function formatLog(level: string, message: string, meta?: any) {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

export const logger = {
  debug: (msg: string, meta?: any) => {
    if (CURRENT_LEVEL <= LOG_LEVELS.debug) console.log(formatLog('debug', msg, meta));
  },
  info: (msg: string, meta?: any) => {
    if (CURRENT_LEVEL <= LOG_LEVELS.info) console.log(formatLog('info', msg, meta));
  },
  warn: (msg: string, meta?: any) => {
    if (CURRENT_LEVEL <= LOG_LEVELS.warn) console.warn(formatLog('warn', msg, meta));
  },
  error: (msg: string, meta?: any) => {
    if (CURRENT_LEVEL <= LOG_LEVELS.error) console.error(formatLog('error', msg, meta));
  },
};
