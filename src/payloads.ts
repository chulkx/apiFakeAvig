import { randomUUID } from 'crypto';

export interface EventInput extends Record<string, unknown> {
  analyticEventName: string;
  cameraId: string;
  id?: string;
  timestamp?: string;
  type?: string;
  thisId?: string;
  linkedEventId?: string;
  originatingEventId?: string;
}

export interface AvigilonPayload {
  type: string;
  notifications?: Array<{
    event: EventInput & {
      id: string;
      timestamp: string;
    };
  }>;
}

export function buildNotification(events: EventInput[]): AvigilonPayload {
  return {
    type: 'NOTIFICATION',
    notifications: events.map((e) => {
      const event: EventInput & { id: string; timestamp: string } = {
        ...e,
        id: typeof e.id === 'string' && e.id ? e.id : randomUUID(),
        timestamp: typeof e.timestamp === 'string' && e.timestamp ? e.timestamp : new Date().toISOString(),
      };

      return { event };
    }),
  };
}

export function buildHello(): AvigilonPayload {
  return { type: 'HELLO' };
}

export function buildHeartbeat(): AvigilonPayload {
  return { type: 'HEARTBEAT' };
}
