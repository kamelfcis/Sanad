type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

const isDev = process.env.NODE_ENV === 'development';

function formatEntry(entry: LogEntry): string {
  const base = `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`;
  if (entry.context && Object.keys(entry.context).length > 0) {
    return `${base} ${JSON.stringify(entry.context)}`;
  }
  return base;
}

function createEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error,
): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
    error: error
      ? { name: error.name, message: error.message, stack: error.stack }
      : undefined,
  };
}

/** Structured logger — ready for Sentry integration later */
export const logger = {
  debug(message: string, context?: LogContext) {
    if (!isDev) return;
    const entry = createEntry('debug', message, context);
    console.debug(formatEntry(entry));
  },

  info(message: string, context?: LogContext) {
    const entry = createEntry('info', message, context);
    if (isDev) console.info(formatEntry(entry));
  },

  warn(message: string, context?: LogContext, error?: Error) {
    const entry = createEntry('warn', message, context, error);
    console.warn(formatEntry(entry), error ?? '');
    // Future: Sentry.captureMessage(message, { level: 'warning', extra: context })
  },

  error(message: string, error?: Error, context?: LogContext) {
    const entry = createEntry('error', message, context, error);
    console.error(formatEntry(entry), error ?? '');
    // Future: Sentry.captureException(error ?? new Error(message), { extra: context })
  },
};

/** Report client-side errors globally */
export function reportError(error: Error, context?: LogContext) {
  logger.error(error.message, error, context);
}
