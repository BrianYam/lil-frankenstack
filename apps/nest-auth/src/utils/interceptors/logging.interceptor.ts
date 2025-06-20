import {
  ExecutionContext,
  CallHandler,
  Logger,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);
  // Define sensitive fields to be masked
  private readonly sensitiveFields = [
    'password',
    'currentPassword',
    'newPassword',
  ];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, headers } = request;
    const now = Date.now();

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
    };

    return next.handle().pipe(
      tap({
        next: (response) => {
          const delay = Date.now() - now;
          this.logger.log(
            `[${method}] ${url} ${JSON.stringify({
              ...serializedRequest,
              response,
              duration: `${delay}ms`,
            })}`,
          );
        },
        error: (error) => {
          const delay = Date.now() - now;
          this.logger.error(
            `[${method}] ${url} ${JSON.stringify({
              ...serializedRequest,
              error: {
                message: error.message,
                code: error.status,
              },
              duration: `${delay}ms`,
            })}`,
          );
        },
      }),
    );
  }
}
