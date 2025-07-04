import { Global, Module } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { EventEmitterService } from '../../../event/event.emitter.service';
import { CustomLoggerService } from './custom-logger.service';
import { LoggerFactory } from './logger-factory.service';

@Global()
@Module({
  providers: [
    {
      provide: CustomLoggerService,
      useFactory: (moduleRef: ModuleRef) => {
        return new CustomLoggerService(moduleRef);
      },
      inject: [ModuleRef],
    },
    LoggerFactory,
    EventEmitterService,
  ],
  exports: [CustomLoggerService, LoggerFactory],
})
export class LoggerModule {}
