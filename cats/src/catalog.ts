import type { SignalDefinition } from '@signals/core';

// Catalog record publication date. Bump when changing any signal's
// definition fields (description, subject_type, etc.) — surfaces as
// `last_updated` on every record so buyer agents can detect drift.
const CATALOG_PUBLISHED_AT = '2026-06-05T00:00:00Z';

export const CATALOG: readonly SignalDefinition[] = [
  {
    id: 'purr_cat_owner',
    name: 'Cat owner',
    description: 'Visitors who completed a feline-personality quiz.',
    signal_type: 'owned',
    coverage_percentage: 100,
    subject_type: 'individual',
    resolution_method: 'browser',
    last_updated: CATALOG_PUBLISHED_AT,
  },
  {
    id: 'purr_persona_angel',
    name: 'Cat owner — calm cat',
    description: 'Result: low-arousal, sociable cat (The Velvet Whisper).',
    signal_type: 'owned',
    coverage_percentage: 22,
    subject_type: 'contextual',
    resolution_method: 'content_signal',
    last_updated: CATALOG_PUBLISHED_AT,
  },
  {
    id: 'purr_persona_hunter',
    name: 'Cat owner — adventurous cat',
    description: 'Result: bold, exploratory cat (The Daring Explorer).',
    signal_type: 'owned',
    coverage_percentage: 18,
    subject_type: 'contextual',
    resolution_method: 'content_signal',
    last_updated: CATALOG_PUBLISHED_AT,
  },
  {
    id: 'purr_persona_tornado',
    name: 'Cat owner — high-energy cat',
    description: 'Result: chaotic, hyperactive cat (The Tiny Tornado).',
    signal_type: 'owned',
    coverage_percentage: 17,
    subject_type: 'contextual',
    resolution_method: 'content_signal',
    last_updated: CATALOG_PUBLISHED_AT,
  },
  {
    id: 'purr_persona_trickster',
    name: 'Cat owner — mischievous cat',
    description: 'Result: clever, rule-breaking cat (The Sly Trickster).',
    signal_type: 'owned',
    coverage_percentage: 23,
    subject_type: 'contextual',
    resolution_method: 'content_signal',
    last_updated: CATALOG_PUBLISHED_AT,
  },
  {
    id: 'purr_persona_tyrant',
    name: 'Cat owner — assertive cat',
    description: 'Result: dominant, defensive cat (The Tiny Tyrant).',
    signal_type: 'owned',
    coverage_percentage: 20,
    subject_type: 'contextual',
    resolution_method: 'content_signal',
    last_updated: CATALOG_PUBLISHED_AT,
  },
] as const;
