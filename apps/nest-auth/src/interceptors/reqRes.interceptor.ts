import {
  ExecutionContext,
  CallHandler,
  Logger,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { TraceService } from '@/modules/trace/trace.service';

@Injectable()
export class ReqResInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ReqResInterceptor.name);
  // Define sensitive fields to be masked
  private readonly sensitiveFields = [
    'password',
    'currentPassword',
    'newPassword',
  ];

  constructor(private readonly traceService: TraceService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, headers } = request;
    const start = Date.now();

    // Generate trace ID for this request
    const traceId = this.traceService.createTraceId();
    request.traceId = traceId;

    // Function to mask password in the request body
    const maskSensitiveData = (data: any) => {
      if (!data || typeof data !== 'object') return data;

      // Create a shallow copy of the data
      const maskedData = Array.isArray(data) ? [...data] : { ...data };

      // Mask sensitive fields at current level
      for (const field of this.sensitiveFields) {
        if (field in maskedData) {
          maskedData[field] = '********';
        }
      }

      // Process nested objects and arrays
      for (const key in maskedData) {
        if (typeof maskedData[key] === 'object' && maskedData[key] !== null) {
          maskedData[key] = maskSensitiveData(maskedData[key]);
        }
      }

      return maskedData;
    };

    // Only mask the body if it exists
    const maskedBody = body ? maskSensitiveData(body) : body;

    // Create a serialized request object once to avoid duplicate work
    const serializedRequest = {
      request: {
        body: maskedBody,
        headers,
      },
      traceId,
    };

    // Log before processing the request
    this.logger.log(
      `[${method}] Request started: ${url} ${JSON.stringify({
        ...serializedRequest,
      })}`,
    );

    return next.handle().pipe(
      tap({
        next: (response) => {
          const delay = Date.now() - start;
          this.logger.log(
            `[${method}] ${url} - Request completed: ${JSON.stringify({
              response,
              duration: `${delay}ms`,
              traceId,
            })}`,
          );
        },
        error: (error) => {
          const delay = Date.now() - start;
          this.logger.error(
            `[${method}] ${url} - Error occurred: ${JSON.stringify({
              error: {
                message: error.message,
                code: error.status,
              },
              duration: `${delay}ms`,
              traceId,
            })}`,
          );
        },
      }),
    );
  }
}
