import {
  createAdcpServerFromPlatform,
  createInMemoryTaskRegistry,
  definePlatform,
  InMemoryStateStore,
  serve,
  verifyApiKey,
} from '@adcp/sdk/server';
import { createAccountStore } from './account-store.ts';
import { createSignalsPlatform } from './signals-platform.ts';
import type { SignalsAccountMeta, SignalsAgentConfig } from './types.ts';

export function startSignalsAgent(config: SignalsAgentConfig): void {
  const accountStore = createAccountStore({
    networkCode: config.dataProvider.internal_platform,
    displayName: config.dataProvider.name,
  });

  const platform = definePlatform<null, SignalsAccountMeta>({
    capabilities: {
      specialisms: ['signal-owned'] as const,
      config: null,
    },
    accounts: accountStore,
    signals: createSignalsPlatform(config.catalog, config.dataProvider),
  });

  const taskRegistry = createInMemoryTaskRegistry();
  const stateStore = new InMemoryStateStore();

  serve(
    ({ taskStore }) =>
      createAdcpServerFromPlatform(platform, {
        name: config.name,
        version: config.version,
        taskStore,
        taskRegistry,
        stateStore,
        resolveIdempotencyPrincipal: (ctx) => {
          const ctxAny = ctx as {
            authInfo?: { clientId?: string };
            account?: { id?: string };
          };
          return ctxAny.authInfo?.clientId ?? ctxAny.account?.id ?? 'anonymous';
        },
      }),
    {
      port: config.port,
      authenticate: verifyApiKey({
        keys: {
          [config.authToken]: { principal: 'agent-buyer' },
          'demo-acme-outdoor-v1': { principal: 'compliance-runner' },
          'demo-acme-outdoor-live-v1': { principal: 'compliance-runner-live' },
        },
      }),
    },
  );

  console.log(`${config.name} listening on ${config.publicBaseUrl}/mcp`);
  console.log(`Catalog: ${config.catalog.length} signal${config.catalog.length === 1 ? '' : 's'}`);
}
