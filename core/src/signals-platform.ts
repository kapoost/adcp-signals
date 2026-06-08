import { defineSignalsPlatform, type SignalsPlatform } from '@adcp/sdk/server';
import type {
  GetSignalsRequest,
  ActivateSignalRequest,
  Deployment,
} from '@adcp/sdk';
import type { DataProvider, SignalDefinition, SignalsAccountMeta } from './types.ts';

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const DEFAULT_CPM = 0.5;
const DEFAULT_CURRENCY = 'USD';

function matchesSpec(spec: string, name: string, description: string): boolean {
  if (!spec) return true;
  const tokens = spec
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2);
  if (tokens.length === 0) return true;
  const hay = `${name} ${description}`.toLowerCase();
  return tokens.some((t) => hay.includes(t));
}

function decodeCursor(raw: string | undefined): number {
  if (!raw) return 0;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

const encodeCursor = (offset: number): string => String(offset);

export function createSignalsPlatform(
  catalog: readonly SignalDefinition[],
  dataProvider: DataProvider,
): SignalsPlatform<SignalsAccountMeta> {
  const buildDeployment = (isLive = true): Deployment => ({
    type: 'platform',
    platform: dataProvider.internal_platform,
    is_live: isLive,
  });

  return defineSignalsPlatform<SignalsAccountMeta>({
    async getSignals(req: GetSignalsRequest, _ctx) {
      const r = req as unknown as {
        signal_spec?: string;
        signal_ids?: Array<
          | { source: 'catalog'; data_provider_domain: string; id: string }
          | { source: 'agent'; agent_url: string; id: string }
        >;
        max_results?: number;
        pagination?: { max_results?: number; cursor?: string };
      };

      const idFilter = new Set(
        (r.signal_ids ?? [])
          .filter(
            (ref) => ref.source !== 'catalog' || ref.data_provider_domain === dataProvider.domain,
          )
          .map((ref) => ref.id),
      );
      const spec = r.signal_spec ?? '';

      let filtered = catalog.filter((s) => {
        if (idFilter.size > 0) return idFilter.has(s.id);
        return matchesSpec(spec, s.name, s.description);
      });

      if (filtered.length === 0 && idFilter.size === 0) {
        filtered = [...catalog];
      }

      const pageSize = Math.max(
        1,
        Math.min(MAX_PAGE_SIZE, r.pagination?.max_results ?? r.max_results ?? DEFAULT_PAGE_SIZE),
      );
      const offset = decodeCursor(r.pagination?.cursor);
      const page = filtered.slice(offset, offset + pageSize);
      const nextOffset = offset + page.length;
      const hasMore = nextOffset < filtered.length;

      return {
        pagination: {
          has_more: hasMore,
          ...(hasMore && { cursor: encodeCursor(nextOffset) }),
          total_count: filtered.length,
        },
        signals: page.map((s) => ({
          signal_id: {
            source: 'catalog' as const,
            data_provider_domain: dataProvider.domain,
            id: s.id,
          },
          signal_agent_segment_id: s.id,
          name: s.name,
          description: s.description,
          value_type: 'binary' as const,
          signal_type: s.signal_type,
          data_provider: dataProvider.name,
          coverage_percentage: s.coverage_percentage,
          ...(s.subject_type && { subject_type: s.subject_type }),
          ...(s.resolution_method && { resolution_method: s.resolution_method }),
          ...(s.last_updated && { last_updated: s.last_updated }),
          deployments: [buildDeployment(true)],
          pricing_options: [
            {
              pricing_option_id: 'po_cpm_default',
              model: 'cpm' as const,
              cpm: s.cpm ?? DEFAULT_CPM,
              currency: s.currency ?? DEFAULT_CURRENCY,
            },
          ],
        })),
      };
    },

    async activateSignal(_req: ActivateSignalRequest, _ctx) {
      return {
        deployments: [buildDeployment(true)],
      };
    },
  });
}
