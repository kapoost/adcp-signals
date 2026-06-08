import { describe, expect, test } from 'bun:test';
import { createSignalsPlatform } from './signals-platform.ts';
import type { DataProvider, SignalDefinition } from './types.ts';

const PROVIDER: DataProvider = {
  name: 'Test Provider',
  domain: 'test.example',
  internal_platform: 'test_internal',
};

const minimalReq = {} as Parameters<ReturnType<typeof createSignalsPlatform>['getSignals']>[0];
const minimalCtx = {} as Parameters<ReturnType<typeof createSignalsPlatform>['getSignals']>[1];

// SDK 9.0.0-beta.27's getSignals returns GetSignalsHandlerResult — a union
// of the sync payload (what Cats actually returns) and a TaskHandoff branch
// (for async semantic discovery, which we don't use). expectPayload() narrows
// to the payload variant at runtime via `'signals' in resp`. The static type
// is a hand-rolled shape because Exclude<…, TaskHandoff<unknown>> resolves
// to `never` on some test sites due to SDK type-gen quirks; the wire shape
// (signals + pagination) is stable and small enough to declare directly.
//
// SignalResponseExt also covers spec-shipped optional fields that the
// generated TS GetSignalsResponse type lags on (subject_type,
// resolution_method, last_updated ship as Zod schemas but not yet in the
// TS interfaces). Drop the helper when SDK type-gen catches up.
type SignalItemView = {
  signal_agent_segment_id: string;
  value_type?: string;
  subject_type?: string;
  resolution_method?: string;
  last_updated?: string;
  [key: string]: unknown;
};
type PayloadView = { signals: SignalItemView[]; pagination: { has_more: boolean; total_count: number; cursor?: string } };
function expectPayload(resp: unknown): PayloadView {
  if (resp == null || typeof resp !== 'object' || !('signals' in resp)) {
    throw new Error('expected sync GetSignalsPayload, got TaskHandoff');
  }
  return resp as PayloadView;
}
type SignalResponseExt = SignalItemView;

describe('signals-platform get_signals response shape', () => {
  test('emits subject_type and resolution_method when present in catalog entry', async () => {
    const catalog: readonly SignalDefinition[] = [
      {
        id: 'ctx_sig',
        name: 'Contextual',
        description: 'page-based',
        signal_type: 'owned',
        coverage_percentage: 100,
        subject_type: 'contextual',
        resolution_method: 'content_signal',
      },
    ];
    const platform = createSignalsPlatform(catalog, PROVIDER);
    const resp = expectPayload(await platform.getSignals(minimalReq, minimalCtx));
    const sig = resp.signals[0]! as SignalResponseExt;
    expect(sig.subject_type).toBe('contextual');
    expect(sig.resolution_method).toBe('content_signal');
  });

  test('omits subject_type and resolution_method when absent in catalog entry', async () => {
    const catalog: readonly SignalDefinition[] = [
      {
        id: 'plain_sig',
        name: 'Plain',
        description: 'no scope declared',
        signal_type: 'owned',
        coverage_percentage: 100,
      },
    ];
    const platform = createSignalsPlatform(catalog, PROVIDER);
    const resp = expectPayload(await platform.getSignals(minimalReq, minimalCtx));
    const sig = resp.signals[0]! as SignalResponseExt;
    expect('subject_type' in sig).toBe(false);
    expect('resolution_method' in sig).toBe(false);
  });

  test('emits last_updated when present (adcp #5249)', async () => {
    const ts = '2026-06-05T00:00:00Z';
    const catalog: readonly SignalDefinition[] = [
      {
        id: 'dated',
        name: 'Dated',
        description: 'has last_updated',
        signal_type: 'owned',
        coverage_percentage: 100,
        last_updated: ts,
      },
      {
        id: 'undated',
        name: 'Undated',
        description: 'no last_updated',
        signal_type: 'owned',
        coverage_percentage: 100,
      },
    ];
    const platform = createSignalsPlatform(catalog, PROVIDER);
    const resp = expectPayload(await platform.getSignals(minimalReq, minimalCtx));
    const dated = resp.signals.find((s) => s.signal_agent_segment_id === 'dated')! as SignalResponseExt;
    const undated = resp.signals.find((s) => s.signal_agent_segment_id === 'undated')! as SignalResponseExt;
    expect(dated.last_updated).toBe(ts);
    expect('last_updated' in undated).toBe(false);
  });

  test('always emits value_type: binary (spec-required field)', async () => {
    const catalog: readonly SignalDefinition[] = [
      { id: 'x', name: 'X', description: 'x', signal_type: 'owned', coverage_percentage: 50 },
    ];
    const platform = createSignalsPlatform(catalog, PROVIDER);
    const resp = expectPayload(await platform.getSignals(minimalReq, minimalCtx));
    expect(resp.signals[0]!.value_type).toBe('binary');
  });

  test('mixed catalog — emits scope fields per-entry independently', async () => {
    const catalog: readonly SignalDefinition[] = [
      {
        id: 'with_scope',
        name: 'Scoped',
        description: 'declares scope',
        signal_type: 'owned',
        coverage_percentage: 100,
        subject_type: 'individual',
        resolution_method: 'browser',
      },
      {
        id: 'without_scope',
        name: 'Bare',
        description: 'no scope',
        signal_type: 'owned',
        coverage_percentage: 100,
      },
    ];
    const platform = createSignalsPlatform(catalog, PROVIDER);
    const resp = expectPayload(await platform.getSignals(minimalReq, minimalCtx));
    const withScope = resp.signals.find((s) => s.signal_agent_segment_id === 'with_scope')! as SignalResponseExt;
    const withoutScope = resp.signals.find((s) => s.signal_agent_segment_id === 'without_scope')! as SignalResponseExt;
    expect(withScope.subject_type).toBe('individual');
    expect(withScope.resolution_method).toBe('browser');
    expect('subject_type' in withoutScope).toBe(false);
    expect('resolution_method' in withoutScope).toBe(false);
  });
});
