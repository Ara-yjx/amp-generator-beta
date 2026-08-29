/**
 * Configuration settings and types for AWS Bedrock AgentCore runtime invocation.
 */

/** Deployed Bedrock AgentCore runtime-endpoint ARN (DEFAULT qualifier). */
export const AGENTCORE_RUNTIME_ENDPOINT_ARN =
  'arn:aws:bedrock-agentcore:us-east-1:487957693199:runtime/stimulizeRuntime-P97f6t4edZ/runtime-endpoint/DEFAULT';

/** Deployed Bedrock AgentCore runtime base ARN. */
export const AGENTCORE_RUNTIME_ARN =
  'arn:aws:bedrock-agentcore:us-east-1:487957693199:runtime/stimulizeRuntime-P97f6t4edZ';

/** AgentCore endpoint qualifier. */
export const AGENTCORE_QUALIFIER = 'DEFAULT';

/** AWS region where Bedrock AgentCore is hosted. */
export const AGENTCORE_REGION = 'us-east-1';

/** Cognito Identity Pool used for browser SigV4 credentials. */
export const COGNITO_IDENTITY_POOL_ID =
  process.env.REACT_APP_COGNITO_IDENTITY_POOL_ID?.trim() || '';

/** Guest IAM role for Cognito classic auth flow. */
export const COGNITO_UNAUTH_ROLE_ARN =
  process.env.REACT_APP_COGNITO_UNAUTH_ROLE_ARN?.trim() || '';

/**
 * Payload sent to Bedrock AgentCore Runtime.
 */
export type AgentInvokePayload = {
  /** User text prompt */
  prompt: string;
  /** Unique session ID (matches conversation thread ID) */
  sessionId: string;
  /** Authenticated user ID */
  userId: string;
  /** Optional base64-encoded image attachments */
  images?: Array<{
    name: string;
    format: string;
    mediaType: string;
    bytesBase64: string;
  }>;
};

/**
 * Response returned from Bedrock AgentCore Runtime.
 */
export type AgentInvokeResponse = {
  /** Text response or structured output */
  result?: unknown;
  [key: string]: unknown;
};
