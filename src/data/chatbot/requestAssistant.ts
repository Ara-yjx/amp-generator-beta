import type { AgentInvokePayload } from './agentcoreConfig';
import { invokeAgentCore } from './invokeAgentCore';
import { extractAssistantText } from './chatbotUtils';
import type { PendingUpload } from './types';

/**
 * Sends a message request with prompt, images, and user/session identifiers to AgentCore.
 * Supports fallback to HTTP endpoint if configured.
 * @param prompt - Text prompt from user
 * @param sessionId - Active thread session ID
 * @param userId - ID of authenticated user
 * @param signal - AbortSignal for request cancellation
 * @param attachments - Image attachments
 * @param fallbackEndpoint - Optional secondary HTTP endpoint
 */
export async function requestAssistant(
  prompt: string,
  sessionId: string,
  userId: string,
  signal: AbortSignal,
  attachments: PendingUpload[] = [],
  fallbackEndpoint = '',
): Promise<string> {
  const payload: AgentInvokePayload = {
    prompt,
    sessionId,
    userId,
    images: attachments.map((item) => ({
      name: item.name,
      format: item.format,
      mediaType: item.mediaType,
      bytesBase64: item.bytesBase64,
    })),
  };

  try {
    const data = await invokeAgentCore(payload, signal);
    const text = extractAssistantText(data);
    if (!text) {
      throw new Error('AgentCore returned empty response');
    }
    return text;
  } catch (error) {
    if (!fallbackEndpoint) {
      throw error;
    }

    const resp = await fetch(fallbackEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }

    const data = await resp.json();
    const text = extractAssistantText(data);
    if (!text) {
      throw new Error('Fallback endpoint returned empty response');
    }
    return text;
  }
}
