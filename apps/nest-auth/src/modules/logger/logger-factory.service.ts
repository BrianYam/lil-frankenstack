import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { CustomLoggerService } from './custom-logger.service';

@Injectable()
export class LoggerFactory {
  private readonly loggers: Map<string, CustomLoggerService> = new Map();

  constructor(private readonly moduleRef: ModuleRef) {}

  /**
   * Gets a logger instance for a specific context
   * @param context The context for the logger (typically the class name)
   * @returns A CustomLoggerService instance with the specified context
   */
  getLogger(context: string): CustomLoggerService {
    if (!this.loggers.has(context)) {
      const logger = new CustomLoggerService(this.moduleRef, context);
      logger.setContext(context);
      this.loggers.set(context, logger);
    }

    return this.loggers.get(context);
  }
}
