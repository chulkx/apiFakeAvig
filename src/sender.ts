import axios, { AxiosError } from 'axios';
import { config } from './config';
import { sign } from './signer';
import { AvigilonPayload } from './payloads';

export interface SendResult {
  success: boolean;
  forwarded: AvigilonPayload;
  targetResponse: { status: number; data: unknown };
  error?: string;
}

export async function sendToTarget(payload: AvigilonPayload): Promise<SendResult> {
  // Serialize once — the same string must be signed and transmitted
  const body = JSON.stringify(payload);
  const authorization = sign(body, config.avigilonToken);

  try {
    const response = await axios.post(config.targetUrl, body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization,
      },
    });
    return {
      success: true,
      forwarded: payload,
      targetResponse: { status: response.status, data: response.data },
    };
  } catch (err) {
    const axiosErr = err as AxiosError;
    const status = axiosErr.response?.status ?? 0;
    const data = axiosErr.response?.data ?? axiosErr.message;
    return {
      success: false,
      forwarded: payload,
      targetResponse: { status, data },
      error: axiosErr.message,
    };
  }
}
