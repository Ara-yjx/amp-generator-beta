import {
  BedrockAgentCoreClient,
  InvokeAgentRuntimeCommand,
} from '@aws-sdk/client-bedrock-agentcore';
import type { AwsCredentialIdentity, Provider } from '@aws-sdk/types';
import {
  AGENTCORE_QUALIFIER,
  AGENTCORE_REGION,
  AGENTCORE_RUNTIME_ARN,
  AgentInvokePayload,
  AgentInvokeResponse,
  COGNITO_IDENTITY_POOL_ID,
  COGNITO_UNAUTH_ROLE_ARN,
} from './agentcoreConfig';
import { fromCognitoIdentityPoolClassic } from './cognitoClassicCredentials';

function ensureRuntimeSessionId(sessionId: string): string {
  const id = String(sessionId || '').trim();
  if (id.length >= 33) {
    return id;
  }
  return `${id || 'session'}-123456789012345678901234567890`.slice(0, 256);
}

function resolveCredentialsProvider(): Provider<AwsCredentialIdentity> {
  if (COGNITO_IDENTITY_POOL_ID && COGNITO_UNAUTH_ROLE_ARN) {
    return fromCognitoIdentityPoolClassic({
      identityPoolId: COGNITO_IDENTITY_POOL_ID,
      roleArn: COGNITO_UNAUTH_ROLE_ARN,
      region: AGENTCORE_REGION,
    });
  }

  if (COGNITO_IDENTITY_POOL_ID && !COGNITO_UNAUTH_ROLE_ARN) {
    throw new Error(
      'Set REACT_APP_COGNITO_UNAUTH_ROLE_ARN for AgentCore access. Cognito enhanced flow blocks bedrock-agentcore for unauthenticated sessions.',
    );
  }

  const accessKeyId = process.env.REACT_APP_AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.REACT_APP_AWS_SECRET_ACCESS_KEY?.trim();
  const sessionToken = process.env.REACT_APP_AWS_SESSION_TOKEN?.trim();

  if (accessKeyId && secretAccessKey) {
    return async () => ({
      accessKeyId,
      secretAccessKey,
      sessionToken,
    });
  }

  throw new Error(
    'AgentCore credentials missing. Set REACT_APP_COGNITO_IDENTITY_POOL_ID and REACT_APP_COGNITO_UNAUTH_ROLE_ARN in .env',
  );
}

let client: BedrockAgentCoreClient | null = null;

function getClient(): BedrockAgentCoreClient {
  if (!client) {
    client = new BedrockAgentCoreClient({
      region: AGENTCORE_REGION,
      credentials: resolveCredentialsProvider(),
    });
  }
  return client;
}

async function readResponseBody(responseBody: unknown): Promise<string> {
  if (!responseBody) {
    return '';
  }

  const body = responseBody as {
    transformToString?: () => Promise<string>;
    [Symbol.asyncIterator]?: () => AsyncIterator<Uint8Array | string>;
  };

  if (typeof body.transformToString === 'function') {
    return body.transformToString();
  }

  if (body instanceof Uint8Array) {
    return new TextDecoder().decode(body);
  }

  if (typeof body === 'string') {
    return body;
  }

  if (typeof body[Symbol.asyncIterator] === 'function') {
    const chunks: string[] = [];
    for await (const chunk of body as AsyncIterable<Uint8Array | string>) {
      chunks.push(typeof chunk === 'string' ? chunk : new TextDecoder().decode(chunk));
    }
    return chunks.join('');
  }

  return '';
}

function parseAgentCorePayload(rawText: string, contentType?: string): AgentInvokeResponse {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return { result: '' };
  }

  if (contentType?.includes('text/event-stream')) {
    const dataLines = trimmed
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trim())
      .filter(Boolean);

    if (dataLines.length > 0) {
      try {
        return JSON.parse(dataLines[dataLines.length - 1]) as AgentInvokeResponse;
      } catch {
        return { result: dataLines.join('\n') };
      }
    }
  }

  try {
    return JSON.parse(trimmed) as AgentInvokeResponse;
  } catch {
    return { result: trimmed };
  }
}

/**
 * Invokes the deployed AWS Bedrock AgentCore Runtime using SigV4 credentials.
 * @param payload - Prompt, session ID, user ID, and image attachments
 * @param signal - Optional AbortSignal to cancel in-flight request
 */
export async function invokeAgentCore(
  payload: AgentInvokePayload,
  signal?: AbortSignal,
): Promise<AgentInvokeResponse> {
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const requestBody = JSON.stringify({
    prompt: payload.prompt,
    sessionId: payload.sessionId,
    userId: payload.userId,
    images: Array.isArray(payload.images) ? payload.images : [],
  });

  const command = new InvokeAgentRuntimeCommand({
    agentRuntimeArn: AGENTCORE_RUNTIME_ARN,
    qualifier: AGENTCORE_QUALIFIER,
    runtimeSessionId: ensureRuntimeSessionId(payload.sessionId),
    runtimeUserId: payload.userId,
    contentType: 'application/json',
    accept: 'application/json',
    payload: new TextEncoder().encode(requestBody),
  });

  const abortController = new AbortController();
  const onAbort = () => abortController.abort();
  if (signal) {
    signal.addEventListener('abort', onAbort, { once: true });
  }

  try {
    const response = await getClient().send(command, { abortSignal: abortController.signal });
    const rawText = await readResponseBody(response.response);
    return parseAgentCorePayload(rawText, response.contentType);
  } finally {
    signal?.removeEventListener('abort', onAbort);
  }
}
