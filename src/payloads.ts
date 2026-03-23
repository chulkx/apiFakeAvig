import { randomUUID } from 'crypto';

export interface EventInput {
  analyticEventName: string;
  cameraId: string;
  id?: string;
  timestamp?: string;
}

export interface AvigilonPayload {
  type: string;
  notifications?: Array<{ event: { id: string; analyticEventName: string; cameraId: string; timestamp: string } }>;
}

export function buildNotification(events: EventInput[]): AvigilonPayload {
  return {
    type: 'NOTIFICATION',
    notifications: events.map((e) => ({
      event: {
        id: e.id ?? randomUUID(),
        analyticEventName: e.analyticEventName,
        cameraId: e.cameraId,
        timestamp: e.timestamp ?? new Date().toISOString(),
      },
    })),
  };
}

export function buildHello(): AvigilonPayload {
  return { type: 'HELLO' };
}

export function buildHeartbeat(): AvigilonPayload {
  return { type: 'HEARTBEAT' };
}
