type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_PRIORITIES: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private currentLevel: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

  private formatMessage(level: LogLevel, message: string, meta?: unknown): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` | ${typeof meta === 'object' ? JSON.stringify(meta) : String(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
  }

  debug(message: string, meta?: unknown): void {
    if (LEVEL_PRIORITIES[this.currentLevel] <= LEVEL_PRIORITIES.debug) {
      console.debug(this.formatMessage('debug', message, meta));
    }
  }

  info(message: string, meta?: unknown): void {
    if (LEVEL_PRIORITIES[this.currentLevel] <= LEVEL_PRIORITIES.info) {
      console.log(this.formatMessage('info', message, meta));
    }
  }

  warn(message: string, meta?: unknown): void {
    if (LEVEL_PRIORITIES[this.currentLevel] <= LEVEL_PRIORITIES.warn) {
      console.warn(this.formatMessage('warn', message, meta));
    }
  }

  error(message: string, meta?: unknown): void {
    if (LEVEL_PRIORITIES[this.currentLevel] <= LEVEL_PRIORITIES.error) {
      console.error(this.formatMessage('error', message, meta));
    }
  }
}

export const logger = new Logger();
