import { prisma } from '@/lib/prisma';
import type { NotificationType } from '@/generated/prisma/client';

const KAKAO_API_KEY = process.env.KAKAO_ALIMTALK_API_KEY || '';
const KAKAO_SENDER_KEY = process.env.KAKAO_SENDER_KEY || '';
const KAKAO_API_URL = process.env.KAKAO_API_URL || 'https://api.kakao.com/alimtalk/send';

interface AlimtalkMessage {
  type: NotificationType;
  templateCode: string;
  recipientPhone: string;
  recipientName: string;
  variables: Record<string, string>;
}

interface AlimtalkResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendAlimtalk(message: AlimtalkMessage): Promise<AlimtalkResult> {
  try {
    if (!KAKAO_API_KEY || !KAKAO_SENDER_KEY) {
      console.warn('[AlimTalk] API key not configured, skipping notification');
      await logNotification(message, false, 'API key not configured');
      return { success: false, error: 'API key not configured' };
    }

    const res = await fetch(KAKAO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KAKAO_API_KEY}`,
      },
      body: JSON.stringify({
        senderKey: KAKAO_SENDER_KEY,
        templateCode: message.templateCode,
        recipientNo: message.recipientPhone.replace(/\D/g, ''),
        templateParameter: message.variables,
      }),
    });

    const data = await res.json();

    if (res.ok && data.resultCode === '0') {
      await logNotification(message, true, undefined, data.messageId);
      return { success: true, messageId: data.messageId };
    }

    await logNotification(message, false, data.message || 'Unknown error');
    return { success: false, error: data.message };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await logNotification(message, false, errorMessage);
    return { success: false, error: errorMessage };
  }
}

async function logNotification(
  message: AlimtalkMessage,
  success: boolean,
  error?: string,
  kakaoMessageId?: string,
) {
  try {
    await prisma.notificationLog.create({
      data: {
        type: message.type,
        recipientPhone: message.recipientPhone,
        recipientName: message.recipientName,
        templateCode: message.templateCode,
        templateVars: message.variables,
        kakaoMessageId,
        sent: success,
        sentAt: success ? new Date() : undefined,
        errorMessage: error,
      },
    });
  } catch (e) {
    console.error('[AlimTalk] Failed to log notification:', e);
  }
}
