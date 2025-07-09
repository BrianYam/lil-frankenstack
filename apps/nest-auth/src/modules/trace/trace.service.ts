import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TraceService {
  constructor(private readonly cls: ClsService) {}

  // Keys for the CLS store
  private static readonly TRACE_ID_KEY = 'traceId';
  private static readonly REQUEST_ID_KEY = 'requestId';

  /**
   * Create a new trace ID for a request
   */
  createTraceId(): string {
    const traceId = uuidv4();
    this.cls.set(TraceService.TRACE_ID_KEY, traceId);
    return traceId;
  }

  /**
   * Get the current trace ID
   */
  getTraceId(): string {
    return this.cls.get(TraceService.TRACE_ID_KEY) || 'no-trace-id';
  }

  /**
   * Set a request ID (could be used for correlation with external systems)
   */
  setRequestId(requestId: string): void {
    this.cls.set(TraceService.REQUEST_ID_KEY, requestId);
  }

  /**
   * Get the current request ID
   */
  getRequestId(): string {
    return this.cls.get(TraceService.REQUEST_ID_KEY);
  }
}
