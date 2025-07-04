import { Global, Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { TraceService } from './trace.service';

@Global()
@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
  ],
  providers: [TraceService],
  exports: [TraceService],
})
export class TraceModule {}
