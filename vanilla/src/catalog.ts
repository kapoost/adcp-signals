import type { SignalDefinition } from '@signals/core';

export const CATALOG: readonly SignalDefinition[] = [
  {
    id: 'example_visitor',
    name: 'Example visitor',
    description: 'Reference signal for AdCP spec conformance testing.',
    signal_type: 'owned',
    coverage_percentage: 100,
    cpm: 1.0,
    currency: 'USD',
  },
] as const;
