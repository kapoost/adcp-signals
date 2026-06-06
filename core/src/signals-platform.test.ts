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

// SDK 7.11.0's generated GetSignalsResponse type lags behind HEAD spec —
// `subject_type`, `resolution_method`, and `last_updated` aren't yet in the
// emitted signal-item shape. Extend the test view so assertions stay typed
// without `as any` everywhere. Drop this when the SDK type-gen catches up.
type SignalResponseExt = Awaited<
  ReturnType<ReturnType<typeof createSignalsPlatform>['getSignals']>
>['signals'][number] & {
  subject_type?: string;
  resolution_method?: string;
  last_updated?: string;
};

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
    const resp = await platform.getSignals(minimalReq, minimalCtx);
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
    const resp = await platform.getSignals(minimalReq, minimalCtx);
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
    const resp = await platform.getSignals(minimalReq, minimalCtx);
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
    const resp = await platform.getSignals(minimalReq, minimalCtx);
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
    const resp = await platform.getSignals(minimalReq, minimalCtx);
    const withScope = resp.signals.find((s) => s.signal_agent_segment_id === 'with_scope')! as SignalResponseExt;
    const withoutScope = resp.signals.find((s) => s.signal_agent_segment_id === 'without_scope')! as SignalResponseExt;
    expect(withScope.subject_type).toBe('individual');
    expect(withScope.resolution_method).toBe('browser');
    expect('subject_type' in withoutScope).toBe(false);
    expect('resolution_method' in withoutScope).toBe(false);
  });
});
