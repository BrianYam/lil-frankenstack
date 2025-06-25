export enum LogEvents {
  SENTINEL_ALERT = 'sentinel.alert',
}

export interface SentinelAlertPayload {
  message: any;
  trace?: string;
  context?: string;
  traceId: string;
  timestamp: string;
}
