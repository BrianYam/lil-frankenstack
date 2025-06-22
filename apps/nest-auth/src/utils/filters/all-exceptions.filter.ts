import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const { method, url, body } = request;

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
      })}`,
    );

    // Respond with error
    response.status(status).json({
      statusCode: status,
      message: errorMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
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
