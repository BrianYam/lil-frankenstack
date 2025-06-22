import { Injectable, Logger, LoggerService } from '@nestjs/common';

@Injectable()
export class CustomLoggerService extends Logger implements LoggerService {
  error(message: any, trace?: string, context?: string): void {
    // Call the original error method
    super.error(message, trace, context);

    // Add your custom logic here
    this.notifyTelegram(message, trace, context);
  }

  private notifyTelegram(message: any, trace?: string, context?: string): void {
    //log both context
    console.log(`context: ${context}, this.context: ${this.context}`);
    // Get context from this.context if not provided (handles class instantiation context)
    const logContext = context || this.context;

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
