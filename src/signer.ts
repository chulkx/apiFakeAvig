import { createHmac } from 'crypto';

/**
 * Computes the Authorization header value expected by the real parking service.
 * Mirrors the verification logic in avigilon-webhook.controller.ts:
 *   signature = Base64( HMAC-SHA256( rawBodyString, Buffer.from(base64Token, 'base64') ) )
 */
export function sign(body: string, base64Token: string): string {
  const keyBuffer = Buffer.from(base64Token, 'base64');
  return createHmac('sha256', keyBuffer).update(body, 'utf8').digest('base64');
}
