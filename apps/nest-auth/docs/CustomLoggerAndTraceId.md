# Custom Logger and Trace ID System

## Overview

The logging and tracing system in this NestJS application provides enhanced visibility into application execution with features like:

- Contextual logging with class/module names
- Request tracing with unique trace IDs
- Centralized logger instance management
- Integration with error notification systems (e.g., Telegram)
- Correlation IDs for tracking requests across microservices

This document explains how the system works, its architecture, and the design decisions behind it.

## Architecture Components

The logging and tracing system consists of three main components:

1. **Custom Logger Service** - Extends NestJS's built-in logger with trace ID integration
2. **Logger Factory** - Manages logger instances across the application
3. **Trace Service** - Handles trace ID generation and storage

### Component Interactions

```ascii
┌─────────────────┐     Creates     ┌─────────────────┐
│                 │────────────────▶│                 │
│  LoggerFactory  │                 │ CustomLogger(s) │
│                 │◀────────────────│                 │
└────────┬────────┘   References    └────────┬────────┘
         │                                    │
         │                                    │ Uses
         │                                    ▼
         │                           ┌─────────────────┐
         │       References          │                 │
         └───────────────────────────▶   TraceService  │
                                     │                 │
                                     └─────────────────┘
```

## Custom Logger Service

The `CustomLoggerService` extends NestJS's built-in `Logger` class to add tracing capabilities and additional features.

### Custom Logger Features

1. **Trace ID Integration**: Automatically prepends trace IDs to log messages
2. **Context-Aware Logging**: Captures the class/module name for better log organization
3. **Notification Integration**: Error logs can trigger external notifications (e.g., Telegram)
4. **Standard Log Levels**: Supports all standard NestJS log levels (error, warn, log, debug, verbose)
5. **Caller Information**: Automatically captures and displays the calling function name and line number

### Custom Logger Implementation

The `CustomLoggerService` uses lazy loading to access the `TraceService` through NestJS's `ModuleRef`. This design prevents circular dependencies during application initialization.

```typescript
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
    // TraceService is lazily initialized when needed
  }
  
  // Other methods...
}
```

Each log method (log, error, warn, debug, verbose) calls two key helper methods:

1. `getTracePrefix()` - Retrieves the current trace ID
2. `formatWithCallerInfo()` - Analyzes the stack trace to extract information about the caller (function name and line number)

These are combined to create highly contextual log messages that include both the trace ID for request tracking and caller information for pinpointing the exact source of each log message.

### Stack Trace Analysis

The logger includes a `getCallerInfo()` method that parses the JavaScript stack trace to extract metadata about the calling code:

```typescript
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
    
    // Process the stack trace to extract caller information
    // ...
  } catch (error) {
    // Return default info if stack trace can't be parsed
    return defaultInfo;
  }
}
```

This extracted information is then formatted and prepended to log messages:

```typescript
private formatWithCallerInfo(message: any): string {
  const { functionName, lineNumber } = this.getCallerInfo();
  return `[${functionName.split('.').pop()}():${lineNumber}] ${message}`;
}
```

The result is logs that clearly show exactly which function and line generated each message, making debugging much more efficient.

### Custom Logger Design Decisions

1. **Extending NestJS Logger**: We extended the built-in logger rather than creating one from scratch to maintain compatibility with NestJS's ecosystem while adding custom functionality.

2. **ModuleRef Injection**: Using ModuleRef allows us to lazily access the TraceService, preventing circular dependencies during application startup.

3. **Optional Context Parameter**: The constructor accepts an optional context parameter, allowing easy instance creation with or without context.

4. **Stack Trace Analysis**: By automatically extracting caller information, we eliminate the need for developers to manually add this context to their log messages.

## Logger Factory

The `LoggerFactory` provides a centralized way to create and manage logger instances across the application.

### Logger Factory Features

1. **Singleton Logger Instances**: Maintains a single logger instance per context (class/module)
2. **Automatic Context Setting**: Sets the appropriate context for each logger
3. **On-Demand Creation**: Creates loggers only when needed

### Logger Factory Implementation

The factory stores logger instances in a Map, keyed by context name:

```typescript
@Injectable()
export class LoggerFactory {
  private loggers: Map<string, CustomLoggerService> = new Map();

  constructor(private readonly moduleRef: ModuleRef) {}

  getLogger(context: string): CustomLoggerService {
    if (!this.loggers.has(context)) {
      const logger = new CustomLoggerService(this.moduleRef, context);
      logger.setContext(context);
      this.loggers.set(context, logger);
    }

    return this.loggers.get(context);
  }
}
```

### Logger Factory Design Decisions

1. **Cache Pattern**: The factory uses a cache pattern to avoid recreating logger instances for the same context.

2. **Global Availability**: The `LoggerModule` is marked as `@Global()`, making the factory available throughout the application without needing to import the module in each feature module.

3. **Context-Based Organization**: Organizing loggers by context name helps with log filtering and makes troubleshooting easier.

## Trace Service

The `TraceService` manages trace IDs for request tracking across the application.

### Trace Service Features

1. **Unique Trace ID Generation**: Creates UUIDs for each request
2. **Continuation-Local Storage**: Uses the `nestjs-cls` package to store trace IDs in a request-scoped storage
3. **Request ID Support**: Can store and retrieve additional request IDs for correlation with external systems

### Trace Service Implementation

The service uses the `ClsService` (Continuation-Local Storage) to store trace data in a way that's accessible throughout the request lifecycle:

```typescript
@Injectable()
export class TraceService {
  constructor(private readonly cls: ClsService) {}

  private static readonly TRACE_ID_KEY = 'traceId';
  private static readonly REQUEST_ID_KEY = 'requestId';

  createTraceId(): string {
    const traceId = uuidv4();
    this.cls.set(TraceService.TRACE_ID_KEY, traceId);
    return traceId;
  }

  getTraceId(): string {
    return this.cls.get(TraceService.TRACE_ID_KEY) || 'no-trace-id';
  }

  // Additional methods...
}
```

### Trace Service Design Decisions

1. **UUID for Trace IDs**: We use UUIDs to ensure globally unique trace IDs, making them suitable for distributed systems.

2. **nestjs-cls for Storage**: The `nestjs-cls` package provides request-scoped storage that works seamlessly with NestJS's request lifecycle.

3. **Fallback Trace ID**: The `getTraceId()` method returns 'no-trace-id' if no trace ID is found, ensuring logs are still meaningful even if the trace context is missing.

## Request-Response Interceptor

The `ReqResInterceptor` ties the logger and trace systems together at the HTTP request level.

### Request-Response Interceptor Features

1. **Automatic Trace ID Generation**: Creates a trace ID for each incoming request
2. **Request/Response Logging**: Logs the details of incoming requests and outgoing responses
3. **Sensitive Data Masking**: Masks sensitive information like passwords in logs
4. **Performance Measurement**: Tracks and logs request duration

### Interceptor Implementation

The interceptor creates a trace ID at the beginning of each request and makes it available to the logger:

```typescript
intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
  const request = context.switchToHttp().getRequest();
  const { method, url, body, headers } = request;
  const start = Date.now();

  // Generate trace ID for this request
  const traceId = this.traceService.createTraceId();
  request.traceId = traceId;
  
  // Log request and response...
}
```

### Interceptor Design Decisions

1. **NestJS Interceptor**: Using NestJS's interceptor pattern ensures our logging happens in a consistent way for all routes.

2. **RxJS Operators**: The use of RxJS's `tap` operator allows us to intercept the response without modifying it.

3. **Error Handling**: The interceptor handles both successful responses and errors, ensuring comprehensive logging.

## Usage Examples

### Using the Logger in a Service

```typescript
@Injectable()
export class AuthService {
  private readonly logger: CustomLoggerService;

  constructor(
    private readonly loggerFactory: LoggerFactory,
    // Other dependencies...
  ) {
    this.logger = this.loggerFactory.getLogger(AuthService.name);
  }

  async validateUser(username: string, password: string) {
    this.logger.log(`Validating user: ${username}`);
    // The log will automatically include:
    // 1. The trace ID (e.g., [5f2c0e73-1234-5678-90ab-cdef01234567])
    // 2. The caller information (e.g., [validateUser():42])
    // 3. The class context (AuthService)
    // Result: [5f2c0e73-1234-5678-90ab-cdef01234567] [validateUser():42] Validating user: john.doe@example.com
  }
}
```

### Trace ID in HTTP Response Headers

You can add the trace ID to HTTP response headers to help with client-side debugging:

```typescript
@Get()
findAll(@Res() response: Response) {
  const traceId = this.traceService.getTraceId();
  
  // Add trace ID to response headers
  response.setHeader('X-Trace-ID', traceId);
  
  // Return data
  return response.json({ data: [...] });
}
```

## Benefits of This Approach

1. **Distributed Tracing**: The trace ID allows tracking requests across multiple services and components
2. **Simplified Debugging**: Context, trace IDs, and caller information make it easier to follow request flows and pinpoint the exact source of logs
3. **Centralized Logger Management**: The factory pattern ensures consistent logger behavior across the application
4. **Better Error Monitoring**: Error notifications with trace IDs help quickly identify and fix issues
5. **Developer Productivity**: Automatic inclusion of caller information (function and line number) eliminates the need for manual logging context, saving development time

## Potential Improvements

1. **OpenTelemetry Integration**: Extend the tracing system to work with OpenTelemetry for more comprehensive distributed tracing
2. **Structured Logging**: Enhance the logger to output structured JSON logs for better parsing by log management tools
3. **Log Rotation**: Implement log rotation to manage log file sizes
4. **Performance Metrics**: Add more detailed performance metrics and application health indicators
5. **Sampling**: Implement trace sampling to reduce log volume in high-traffic environments

## Conclusion

The custom logging and tracing system provides a solid foundation for application monitoring, debugging, and troubleshooting. Its modular design allows for easy extension and customization as the application grows, while the integration with NestJS's built-in features ensures compatibility with the broader ecosystem.
