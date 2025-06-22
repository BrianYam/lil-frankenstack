import { Injectable, Logger, LoggerService } from '@nestjs/common';

@Injectable()
export class CustomLoggerService extends Logger implements LoggerService {
  error(message: any): void {
    // Call the original error method
    super.error(message);

    // Add your custom logic here
    this.notifyTelegram(message);
  }

  private notifyTelegram(message: any, trace?: string): void {
    //log both context
    // Get context from this.context if not provided (handles class instantiation context)
    const logContext = this.context;

    // Implement your Telegram notification logic here
    //TODO need time
    console.log('Sending to Telegram:', {
      message,
      trace,
      context: logContext,
    });
    // Actual implementation would use Telegram API
  }
}
