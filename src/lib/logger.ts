import * as fs from 'fs'
import * as path from 'path'

type LogLevel = 'INFO' | 'ERROR' | 'DEBUG' | 'WARN'

interface LogEntry {
  timestamp: string
  level: LogLevel
  userId?: string
  message: string
  data?: unknown
}

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

/**
 * Get log file path for a specific user and date
 */
function getLogFilePath(userId?: string): string {
  const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const filename = userId ? `${userId}-${date}.log` : `app-${date}.log`
  return path.join(logsDir, filename)
}

/**
 * Write log entry to file
 */
function writeToFile(entry: LogEntry): void {
  try {
    const filePath = getLogFilePath(entry.userId)
    const logLine = formatLogEntry(entry)
    fs.appendFileSync(filePath, logLine + '\n', 'utf8')
  } catch (err) {
    console.error('Failed to write log:', err)
  }
}

/**
 * Format log entry as readable string
 */
function formatLogEntry(entry: LogEntry): string {
  const parts = [
    `[${entry.timestamp}]`,
    `[${entry.level}]`,
    entry.userId ? `[${entry.userId}]` : '[APP]',
    entry.message,
  ]

  let line = parts.join(' ')

  if (entry.data) {
    line += ` | ${JSON.stringify(entry.data)}`
  }

  return line
}

/**
 * Main logger function
 */
export function log(
  level: LogLevel,
  message: string,
  userId?: string,
  data?: unknown
): void {
  const timestamp = new Date().toISOString()
  const entry: LogEntry = {
    timestamp,
    level,
    userId,
    message,
    data,
  }

  // Write to file
  writeToFile(entry)

  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    const consoleMessage = formatLogEntry(entry)
    if (level === 'ERROR') {
      console.error(consoleMessage)
    } else if (level === 'WARN') {
      console.warn(consoleMessage)
    } else if (level === 'DEBUG') {
      console.debug(consoleMessage)
    } else {
      console.log(consoleMessage)
    }
  }
}

/**
 * Convenience methods
 */
export const logger = {
  info: (message: string, userId?: string, data?: unknown) =>
    log('INFO', message, userId, data),
  error: (message: string, userId?: string, data?: unknown) =>
    log('ERROR', message, userId, data),
  warn: (message: string, userId?: string, data?: unknown) =>
    log('WARN', message, userId, data),
  debug: (message: string, userId?: string, data?: unknown) =>
    log('DEBUG', message, userId, data),
}
