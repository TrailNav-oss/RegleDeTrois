import { File, Paths } from 'expo-file-system';
import * as Sentry from '@sentry/react-native';

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const LEVEL_PRIORITY: Record<LogLevel, number> = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
let minLevel: LogLevel = __DEV__ ? 'DEBUG' : 'WARN';
const logFile = new File(Paths.document, 'debug.log');
const MAX_LINES = 500;

function ts(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

let writeQueue: Promise<void> = Promise.resolve();

function enqueueWrite(line: string) {
  writeQueue = writeQueue.then(async () => {
    try {
      let existing = '';
      try { existing = await logFile.text(); } catch { /* new file */ }
      const lines = existing ? existing.split('\n') : [];
      lines.push(line);
      const trimmed = lines.length > MAX_LINES ? lines.slice(-MAX_LINES) : lines;
      logFile.write(trimmed.join('\n'));
    } catch { /* best-effort */ }
  });
}

let _isLogging = false;

function log(level: LogLevel, tag: string, message: string, ...args: unknown[]) {
  if (_isLogging) return;
  _isLogging = true;
  try {
    const extra = args.length
      ? ' ' + args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')
      : '';
    const line = `[${ts()}] [${level}] [${tag.toLowerCase()}] ${message}${extra}`;
    if (LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[minLevel]) {
      (level === 'WARN' ? console.warn : console.log)(line);
    }
    enqueueWrite(line);
    if (level === 'ERROR') {
      try { Sentry.captureMessage(`[${tag}] ${message}`, { level: 'error' }); } catch {}
    }
  } finally {
    _isLogging = false;
  }
}

export const logger = {
  debug: (tag: string, msg: string, ...a: unknown[]) => log('DEBUG', tag, msg, ...a),
  info: (tag: string, msg: string, ...a: unknown[]) => log('INFO', tag, msg, ...a),
  warn: (tag: string, msg: string, ...a: unknown[]) => log('WARN', tag, msg, ...a),
  error: (tag: string, msg: string, ...a: unknown[]) => log('ERROR', tag, msg, ...a),
  getLogPath: () => logFile.uri,
};
