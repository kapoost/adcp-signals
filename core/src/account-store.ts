import type { Account, AccountStore } from '@adcp/sdk/server';
import type { SignalsAccountMeta } from './types.ts';

const SANDBOX_PRINCIPALS: ReadonlySet<string> = new Set([
  'purrsonality-test',
  'compliance-runner',
]);

const SANDBOX_ID_PREFIX = 'sandbox_';

export function createAccountStore(opts: {
  networkCode: string;
  displayName: string;
}): AccountStore<SignalsAccountMeta> {
  const buildAccount = (
    overrides?: Partial<Account<SignalsAccountMeta>>,
  ): Account<SignalsAccountMeta> => ({
    id: opts.networkCode,
    name: opts.displayName,
    status: 'active',
    ctx_metadata: { network_code: opts.networkCode },
    ...overrides,
  });

  return {
    resolution: 'explicit',
    resolve: async (ref, ctx) => {
      const principal = ctx?.authInfo?.clientId;
      const isSandbox = principal !== undefined && SANDBOX_PRINCIPALS.has(principal);

      if (isSandbox) {
        const brand = (ref as { brand?: { domain?: string } } | undefined)?.brand;
        const operator = (ref as { operator?: string } | undefined)?.operator;
        return buildAccount({
          id: `${SANDBOX_ID_PREFIX}${opts.networkCode}`,
          name: `Sandbox: ${opts.displayName}`,
          mode: 'sandbox',
          ...(operator !== undefined && { operator }),
          ...(brand?.domain !== undefined && { brand: { domain: brand.domain } }),
        } as Partial<Account<SignalsAccountMeta>>);
      }

      return buildAccount({ mode: 'live' } as Partial<Account<SignalsAccountMeta>>);
    },
  };
}
