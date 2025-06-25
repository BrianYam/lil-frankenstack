import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EventEmitterService {
  private readonly logger = new Logger(EventEmitterService.name);
  constructor(private readonly eventEmitter: EventEmitter2) {}

  emit<T>(event: string, payload: T) {
    this.logger.log(`Emitting event: ${event}: ${JSON.stringify(payload)}`);
    this.eventEmitter.emit(event, payload);
  }
}
