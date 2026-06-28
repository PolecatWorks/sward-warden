import { Inject, Injectable } from '@angular/core';
import { APP_CONFIG, AppConfig } from '../app-config';

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  private level: LogLevel;

  constructor(@Inject(APP_CONFIG) private config: AppConfig) {
    this.level = this.parseLogLevel(config.logLevel);
  }

  // No obvious PRD requirement
  private parseLogLevel(level: string): LogLevel {
    switch (level?.toUpperCase()) {
      case 'DEBUG':
        return LogLevel.DEBUG;
      case 'INFO':
        return LogLevel.INFO;
      case 'WARN':
        return LogLevel.WARN;
      case 'ERROR':
        return LogLevel.ERROR;
      default:
        return LogLevel.INFO;
    }
  }

  // No obvious PRD requirement
  log(message: any, ...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(message, ...args);
    }
  }

  // No obvious PRD requirement
  info(message: any, ...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      console.info(message, ...args);
    }
  }

  // No obvious PRD requirement
  warn(message: any, ...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(message, ...args);
    }
  }

  // No obvious PRD requirement
  error(message: any, ...args: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(message, ...args);
    }
  }
}
