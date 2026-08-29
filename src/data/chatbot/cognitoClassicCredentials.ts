import {
  CognitoIdentityClient,
  GetIdCommand,
  GetOpenIdTokenCommand,
} from '@aws-sdk/client-cognito-identity';
import { AssumeRoleWithWebIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import type { AwsCredentialIdentity, Provider } from '@aws-sdk/types';

const IDENTITY_ID_STORAGE_KEY = 'stimulize_cognito_identity_id';

export type ClassicCognitoOptions = {
  /** Cognito Identity Pool ID */
  identityPoolId: string;
  /** Target IAM Role ARN to assume */
  roleArn: string;
  /** AWS Region */
  region: string;
};

function formatAssumeRoleError(error: unknown, roleArn: string, identityPoolId: string): Error {
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown Cognito auth error';

  if (!message.includes('AccessDenied') && !message.includes('AssumeRoleWithWebIdentity')) {
    return error instanceof Error ? error : new Error(message);
  }

  return new Error(
    [
      'STS could not assume the Cognito guest role (AssumeRoleWithWebIdentity).',
      `Role ARN: ${roleArn}`,
      `Identity pool: ${identityPoolId}`,
      'Please ensure Basic/Classic flow is enabled on the identity pool, and the role trust policy allows cognito-identity.amazonaws.com with aud = pool ID.',
    ].join(' '),
  );
}

/**
 * Creates an AWS Credential Provider using Cognito Classic Flow:
 * `GetId` -> `GetOpenIdToken` -> `AssumeRoleWithWebIdentity`.
 * This bypasses the default Enhanced Flow session scope-down policy which excludes Bedrock AgentCore.
 * @param options - Identity pool and IAM role configuration
 */
export function fromCognitoIdentityPoolClassic(
  options: ClassicCognitoOptions,
): Provider<AwsCredentialIdentity> {
  const cognito = new CognitoIdentityClient({ region: options.region });
  const sts = new STSClient({ region: options.region });

  let cachedCredentials: (AwsCredentialIdentity & { expiration?: Date }) | null = null;
  let identityId: string | null = null;

  const loadIdentityId = () => {
    if (identityId) {
      return identityId;
    }
    try {
      identityId = sessionStorage.getItem(IDENTITY_ID_STORAGE_KEY);
    } catch {
      identityId = null;
    }
    return identityId;
  };

  const persistIdentityId = (nextIdentityId: string) => {
    identityId = nextIdentityId;
    try {
      sessionStorage.setItem(IDENTITY_ID_STORAGE_KEY, nextIdentityId);
    } catch {
      /* ignore storage quota */
    }
  };

  const clearIdentityId = () => {
    identityId = null;
    try {
      sessionStorage.removeItem(IDENTITY_ID_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const resolveIdentityId = async () => {
    const existing = loadIdentityId();
    if (existing) {
      return existing;
    }

    const response = await cognito.send(
      new GetIdCommand({
        IdentityPoolId: options.identityPoolId,
      }),
    );

    if (!response.IdentityId) {
      throw new Error('Cognito GetId did not return an identity ID.');
    }

    persistIdentityId(response.IdentityId);
    return response.IdentityId;
  };

  const assumeGuestRole = async (resolvedIdentityId: string) => {
    const openIdResponse = await cognito.send(
      new GetOpenIdTokenCommand({
        IdentityId: resolvedIdentityId,
      }),
    );

    if (!openIdResponse.Token) {
      throw new Error('Cognito GetOpenIdToken did not return a token.');
    }

    const assumed = await sts.send(
      new AssumeRoleWithWebIdentityCommand({
        RoleArn: options.roleArn,
        RoleSessionName: 'stimulize-agent-web',
        WebIdentityToken: openIdResponse.Token,
      }),
    );

    const credentials = assumed.Credentials;
    if (!credentials?.AccessKeyId || !credentials.SecretAccessKey || !credentials.SessionToken) {
      throw new Error('STS AssumeRoleWithWebIdentity did not return credentials.');
    }

    cachedCredentials = {
      accessKeyId: credentials.AccessKeyId,
      secretAccessKey: credentials.SecretAccessKey,
      sessionToken: credentials.SessionToken,
      expiration: credentials.Expiration,
    };

    return cachedCredentials;
  };

  return async () => {
    if (
      cachedCredentials?.expiration &&
      cachedCredentials.expiration.getTime() > Date.now() + 60_000
    ) {
      return cachedCredentials;
    }

    let resolvedIdentityId = await resolveIdentityId();

    try {
      return await assumeGuestRole(resolvedIdentityId);
    } catch (error) {
      clearIdentityId();
      cachedCredentials = null;
      resolvedIdentityId = await resolveIdentityId();
      try {
        return await assumeGuestRole(resolvedIdentityId);
      } catch (retryError) {
        throw formatAssumeRoleError(retryError, options.roleArn, options.identityPoolId);
      }
    }
  };
}
