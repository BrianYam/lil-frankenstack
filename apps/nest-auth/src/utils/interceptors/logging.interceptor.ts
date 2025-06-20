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

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, headers } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: (response) => {
          const delay = Date.now() - now;
          this.logger.log(
            `[${method}] ${url} ${JSON.stringify({
              request: {
                body,
                headers,
              },
              response,
              duration: `${delay}ms`,
            })}`,
          );
        },
        error: (error) => {
          const delay = Date.now() - now;
          this.logger.error(
            `[${method}] ${url} ${JSON.stringify({
              request: {
                body,
                headers,
              },
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
