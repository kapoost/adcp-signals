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
      // Advertise release-precision AdCP versions we speak. Slot landed in
      // SDK 9.0.0 via PR #2201 closing #2199. AAO comply runner gates
      // prerelease eval (compliance_target=3.1-rc) on this advertisement —
      // without it `evaluate_agent_quality` refuses with "(none advertised)".
      // We honour 3.0 (badge-eligible) AND 3.1-rc (SDK 9.2.x natively emits
      // the rc14+ envelope shape with status / context echo / adcp_version).
      supported_versions: ['3.0', '3.1-rc'] as const,
      config: null,
    },
    accounts: accountStore,
    signals: createSignalsPlatform(config.catalog, config.dataProvider),
  });

  const taskRegistry = createInMemoryTaskRegistry();
  const stateStore = new InMemoryStateStore();

  // SDK's serve() only handles /mcp + /.well-known/oauth-protected-resource/mcp.
  // We need /.well-known/healthz too (Fly health checks, AAO probe liveness),
  // so we run the SDK on an internal port and front it with a Bun.serve proxy
  // on config.port that adds healthz and forwards everything else.
  const sdkPort = config.port + 100;
  const startedAt = Date.now();

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
      port: sdkPort,
      onListening: () => {
        startPublicProxy({
          publicPort: config.port,
          sdkPort,
          startedAt,
        });
      },
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

function startPublicProxy(opts: {
  publicPort: number;
  sdkPort: number;
  startedAt: number;
}): void {
  Bun.serve({
    port: opts.publicPort,
    async fetch(req): Promise<Response> {
      const url = new URL(req.url);

      // Liveness probe — unauthenticated, never touches the SDK.
      if (req.method === 'GET' && url.pathname === '/.well-known/healthz') {
        return Response.json(
          { ok: true, uptime_ms: Date.now() - opts.startedAt },
          { headers: { 'Cache-Control': 'no-store' } },
        );
      }

      // Forward everything else to the SDK on the internal port.
      const target = `http://127.0.0.1:${opts.sdkPort}${url.pathname}${url.search}`;
      const fwdHeaders = new Headers(req.headers);
      fwdHeaders.delete('host');
      fwdHeaders.delete('connection');
      fwdHeaders.delete('content-length');

      // Buffer body up-front rather than streaming with duplex:'half' — the
      // streamed forward to localhost has known issues on Linux Bun that
      // break MCP initialize POSTs (same workaround as seller proxy).
      const methodHasBody = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
      const fetchInit: RequestInit = {
        method: req.method,
        headers: fwdHeaders,
      };
      if (methodHasBody) {
        const bodyBuf = await req.arrayBuffer();
        if (bodyBuf.byteLength > 0) {
          fetchInit.body = bodyBuf;
        }
      }

      try {
        const upstream = await fetch(target, fetchInit);
        return new Response(upstream.body, {
          status: upstream.status,
          statusText: upstream.statusText,
          headers: upstream.headers,
        });
      } catch {
        return Response.json({ error: 'upstream_unavailable' }, { status: 502 });
      }
    },
  });
}
