import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CustomLoggerService } from '@/logger/custom-logger.service';
import { LoggerFactory } from '@/logger/logger-factory.service';
import { TraceService } from '@/trace/trace.service';

@Injectable()
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger: CustomLoggerService;

  constructor(
    private readonly traceService: TraceService,
    private readonly loggerFactory: LoggerFactory,
  ) {
    // Get a dedicated logger instance with this class's context
    this.logger = this.loggerFactory.getLogger(AllExceptionsFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const { method, url, body } = request;
    const traceId = this.traceService.getTraceId();

    // Get status code and message
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorMessage =
      exception instanceof HttpException
        ? exception.message
        : exception instanceof Error
          ? exception.message
          : 'Internal server error';

    // Log the error with context
    this.logger.error(
      `[${method}] ${url} - Exception filter caught error: ${JSON.stringify({
        statusCode: status,
        error: errorMessage,
        requestBody: this.maskSensitiveData(body),
        traceId,
      })}`,
    );

    // Respond with error
    response.status(status).json({
      statusCode: status,
      message: errorMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
      traceId, // Include traceId in response for easier debugging
    });
  }

  // Helper method to mask sensitive data
  private maskSensitiveData(data: any) {
    if (!data || typeof data !== 'object') return data;

    const sensitiveFields = ['password', 'currentPassword', 'newPassword'];
    const maskedData = Array.isArray(data) ? [...data] : { ...data };

    // Mask sensitive fields at current level
    for (const field of sensitiveFields) {
      if (field in maskedData) {
        maskedData[field] = '********';
      }
    }

    // Process nested objects and arrays
    for (const key in maskedData) {
      if (typeof maskedData[key] === 'object' && maskedData[key] !== null) {
        maskedData[key] = this.maskSensitiveData(maskedData[key]);
      }
    }

    return maskedData;
  }
}
