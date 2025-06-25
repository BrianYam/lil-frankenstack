import { Injectable, Logger, LoggerService, Optional } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { EventEmitterService } from '../../event/event.emitter.service';
import { LogEvents, SentinelAlertPayload } from '../../event/logs.events';
import { TraceService } from '@/trace/trace.service';

interface CallerInfo {
  functionName: string;
  fileName: string;
  lineNumber: number;
}
//TODO move to types ?
// Define log levels that support sentinel alerting
export enum LogLevel {
  LOG = 'log',
  ERROR = 'error',
  WARN = 'warn',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

// Define options for log methods that need sentinel alerting
export interface LogOptions {
  sentinelAlert?: boolean;
  trace?: string;
  context?: string;
}

@Injectable()
export class CustomLoggerService extends Logger implements LoggerService {
  private traceService: TraceService;
  private eventEmitter: EventEmitterService;

  constructor(
    private readonly moduleRef: ModuleRef,
    @Optional() private readonly contextName?: string,
  ) {
    super(contextName);
    // Will be lazily initialized when needed
  }

  private getTraceService(): TraceService | null {
    if (!this.traceService) {
      try {
        this.traceService = this.moduleRef.get(TraceService, { strict: false });
      } catch (error) {
        // If TraceService is not available, we will return undefined
        // This can happen during application initialization
        console.log(`TraceService not available: ${error.message}`);
      }
    }
    return this.traceService;
  }

  private getEventEmitter(): EventEmitterService | null {
    if (!this.eventEmitter) {
      try {
        this.eventEmitter = this.moduleRef.get(EventEmitterService, {
          strict: false,
        });
      } catch (error) {
        // If EventEmitterService is not available, we will return undefined
        console.log(`EventEmitterService not available: ${error.message}`);
      }
    }
    return this.eventEmitter;
  }

  /**
   * Sets the context for this logger instance
   * @param context The context (typically the class name)
   */
  setContext(context: string): void {
    this.context = context;
  }

  private getTracePrefix(): string {
    const traceService = this.getTraceService();
    if (!traceService) return '';

    const traceId = traceService.getTraceId();
    return traceId ? `[${traceId}] ` : '';
  }

  /**
   * Extract the caller information from the stack trace
   * @returns Information about the caller (function name, file name, line number)
   */
  private getCallerInfo(): CallerInfo {
    const defaultInfo: CallerInfo = {
      functionName: 'unknown',
      fileName: 'unknown',
      lineNumber: 0,
    };

    try {
      // Create an error to capture the stack trace
      const err = new Error();
      const stackLines = err.stack?.split('\n') || [];

      // Define a pattern to match internal logger method calls
      const loggerMethodRegex =
        /at\s+CustomLoggerService\.(getCallerInfo|formatWithCallerInfo|processLog|log|error|warn|debug|verbose|errorAlert|warnAlert|sentinelAlert)/;

      // Skip the first line (Error constructor)
      let callerLine = null;
      for (let i = 1; i < stackLines.length; i++) {
        const line = stackLines[i];

        // Skip internal logger methods
        if (loggerMethodRegex.test(line)) {
          continue;
        }

        callerLine = line;
        break;
      }

      if (callerLine) {
        // Parse the line to extract function name and location
        // Format 1: "at ClassName.methodName (/path/to/file.ts:line:col)"
        // Format 2: "at /path/to/file.ts:line:col"
        const methodMatch = /at\s+([\w.]+)\s+\((.*):(\d+):(\d+)\)/.exec(
          callerLine,
        );
        const fileOnlyMatch = /at\s+()(.*):(\d+):(\d+)/.exec(callerLine);

        const match = methodMatch || fileOnlyMatch;

        if (match) {
          const [, fnName, fileName, line] = match;
          return {
            functionName: fnName || 'anonymous',
            fileName: fileName.split('/').pop() || 'unknown',
            lineNumber: parseInt(line, 10) || 0,
          };
        }
      }

      return defaultInfo;
    } catch (error) {
      console.warn(`Failed to extract caller info: ${error.message}`);
      return defaultInfo;
    }
  }

  /**
   * Formats a message with caller information
   */
  private formatWithCallerInfo(message: any): string {
    const { functionName, lineNumber } = this.getCallerInfo();
    // return `[${fileName}:${lineNumber} ${functionName}()] ${message}`;
    return `[${functionName.split('.').pop()}():${lineNumber}] ${message}`;
  }

  /**
   * New simplified method for error logs with sentinel alerts
   * @param message The message to log
   * @param sentinelAlert Whether to send a sentinel alert (defaults to true)
   * @param trace Optional stack trace
   * @param context Optional context
   */
  errorAlert(
    message: any,
    sentinelAlert = true,
    trace?: string,
    context?: string,
  ): void {
    this.processLog(LogLevel.ERROR, message, {
      sentinelAlert,
      trace,
      context,
    });
  }

  /**
   * Similar method for warnings with sentinel alerts
   * @param message The message to log
   * @param sentinelAlert Whether to send a sentinel alert (defaults to true)
   * @param context Optional context
   */
  warnAlert(message: any, sentinelAlert = true, context?: string): void {
    this.processLog(LogLevel.WARN, message, {
      sentinelAlert,
      context,
    });
  }

  // Standard logger methods that properly override the base Logger methods
  log(message: any, context?: string): void;
  log(message: any, options?: LogOptions): void;
  log(message: any, contextOrOptions?: string | LogOptions): void {
    this.processLog(LogLevel.LOG, message, contextOrOptions);
  }

  error(message: any, trace?: string, context?: string): void;
  error(message: any, options?: LogOptions): void;
  error(
    message: any,
    traceOrOptions?: string | LogOptions,
    context?: string,
  ): void {
    if (typeof traceOrOptions === 'string') {
      // Handle the standard Logger.error signature
      this.processLog(LogLevel.ERROR, message, {
        trace: traceOrOptions,
        context,
      });
    } else {
      // Handle our custom options signature
      this.processLog(LogLevel.ERROR, message, traceOrOptions);
    }
  }

  warn(message: any, context?: string): void;
  warn(message: any, options?: LogOptions): void;
  warn(message: any, contextOrOptions?: string | LogOptions): void {
    this.processLog(LogLevel.WARN, message, contextOrOptions);
  }

  debug(message: any, context?: string): void;
  debug(message: any, options?: LogOptions): void;
  debug(message: any, contextOrOptions?: string | LogOptions): void {
    this.processLog(LogLevel.DEBUG, message, contextOrOptions);
  }

  verbose(message: any, context?: string): void;
  verbose(message: any, options?: LogOptions): void;
  verbose(message: any, contextOrOptions?: string | LogOptions): void {
    this.processLog(LogLevel.VERBOSE, message, contextOrOptions);
  }

  /**
   * Central method to process logs with optional sentinel alerts
   */
  private processLog(
    level: LogLevel,
    message: any,
    contextOrOptions?: string | LogOptions,
  ): void {
    const tracePrefix = this.getTracePrefix();
    const formattedMessage = this.formatWithCallerInfo(message);
    const prefixedMessage = `${tracePrefix}${formattedMessage}`;

    let options: LogOptions | undefined;

    // Parse contextOrOptions parameter
    if (typeof contextOrOptions === 'object' && contextOrOptions !== null) {
      options = contextOrOptions;
    }

    // Call the appropriate Logger method
    switch (level) {
      case LogLevel.ERROR:
        if (options?.trace) {
          super.error(prefixedMessage, options.trace);
        } else {
          super.error(prefixedMessage);
        }
        break;
      case LogLevel.WARN:
        super.warn(prefixedMessage);
        break;
      case LogLevel.DEBUG:
        super.debug(prefixedMessage);
        break;
      case LogLevel.VERBOSE:
        super.verbose(prefixedMessage);
        break;
      default:
        super.log(prefixedMessage);
    }

    // If sentinel alert is enabled, trigger it
    if (options?.sentinelAlert) {
      this.sentinelAlert(formattedMessage, options.trace);
    }
  }

  private sentinelAlert(message: any, trace?: string, context?: string) {
    try {
      // Get context from this.context if not provided (handles class instantiation context)
      const logContext = context ?? this.context;
      const traceId = this.getTraceService()?.getTraceId() || 'no-trace-id';
      const timestamp = new Date().toISOString();

      // Create a properly structured payload using the interface
      const alertPayload: SentinelAlertPayload = {
        message,
        trace,
        context: logContext,
        traceId,
        timestamp,
      };

      console.log('Sending to Telegram:', alertPayload);

      // Get event emitter and safely emit the event
      const eventEmitter = this.getEventEmitter();
      if (eventEmitter) {
        eventEmitter.emit(LogEvents.SENTINEL_ALERT, alertPayload);
      } else {
        console.log('EventEmitter not available, skipping event emission');
      }

      // Actual implementation would use Telegram API
    } catch (error) {
      // Log any errors that occur while trying to send the notification
      console.error('Failed to send Telegram notification:', error);
    }
  }
}
