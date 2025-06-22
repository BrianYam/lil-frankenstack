import { Injectable, Logger, LoggerService, Optional } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { TraceService } from '@/trace/trace.service';

interface CallerInfo {
  functionName: string;
  fileName: string;
  lineNumber: number;
}

@Injectable()
export class CustomLoggerService extends Logger implements LoggerService {
  private traceService: TraceService;

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

      // Skip the first few lines that represent this function and the logger methods
      // Usually, we need to skip 3-4 lines to get to the actual caller
      const callerLine = stackLines[4]; // Index may need adjustment based on your stack trace format

      if (callerLine) {
        // Parse the line to extract function name and location
        // Stack trace format varies by environment but typically looks like:
        // "    at FunctionName (/path/to/file.ts:line:column)"
        const match =
          RegExp(/at\s+(.*)\s+\((.*):(\d+):(\d+)\)/).exec(callerLine) ||
          RegExp(/at\s+()(.*):(\d+):(\d+)/).exec(callerLine);

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

  log(message: any, context?: string): void {
    const tracePrefix = this.getTracePrefix();
    const formattedMessage = this.formatWithCallerInfo(message);
    super.log(`${tracePrefix}${formattedMessage}`, context || this.context);
  }

  error(message: any, trace?: string, context?: string): void {
    const tracePrefix = this.getTracePrefix();
    const formattedMessage = this.formatWithCallerInfo(message);

    // Call the original error method with trace ID
    super.error(`${tracePrefix}${formattedMessage}`);

    // Add your custom logic here with trace ID
    this.notifyTelegram(formattedMessage, trace, context);
  }

  warn(message: any, _context?: string): void {
    const tracePrefix = this.getTracePrefix();
    const formattedMessage = this.formatWithCallerInfo(message);
    super.warn(`${tracePrefix}${formattedMessage}`);
  }

  debug(message: any, _context?: string): void {
    const tracePrefix = this.getTracePrefix();
    const formattedMessage = this.formatWithCallerInfo(message);
    super.debug(`${tracePrefix}${formattedMessage}`);
  }

  verbose(message: any, _context?: string): void {
    const tracePrefix = this.getTracePrefix();
    const formattedMessage = this.formatWithCallerInfo(message);
    super.verbose(`${tracePrefix}${formattedMessage}`);
  }

  private notifyTelegram(message: any, trace?: string, context?: string): void {
    // Get context from this.context if not provided (handles class instantiation context)
    const logContext = context ?? this.context;
    const traceId = this.getTraceService()?.getTraceId() || 'no-trace-id';
    const timestamp = new Date().toISOString();

    //TODO to implement
    // Implement your Telegram notification logic here
    console.log('Sending to Telegram:', {
      message,
      trace,
      context: logContext,
      traceId,
      timestamp,
    });
    // Actual implementation would use Telegram API
  }
}
