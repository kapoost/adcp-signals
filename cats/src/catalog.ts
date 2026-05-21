import type { SignalDefinition } from '@signals/core';

export const CATALOG: readonly SignalDefinition[] = [
  {
    id: 'purr_cat_owner',
    name: 'Cat owner',
    description: 'Visitors who completed a feline-personality quiz.',
    signal_type: 'owned',
    coverage_percentage: 100,
  },
  {
    id: 'purr_persona_angel',
    name: 'Cat owner — calm cat',
    description: 'Result: low-arousal, sociable cat (The Velvet Whisper).',
    signal_type: 'owned',
    coverage_percentage: 22,
  },
  {
    id: 'purr_persona_hunter',
    name: 'Cat owner — adventurous cat',
    description: 'Result: bold, exploratory cat (The Daring Explorer).',
    signal_type: 'owned',
    coverage_percentage: 18,
  },
  {
    id: 'purr_persona_tornado',
    name: 'Cat owner — high-energy cat',
    description: 'Result: chaotic, hyperactive cat (The Tiny Tornado).',
    signal_type: 'owned',
    coverage_percentage: 17,
  },
  {
    id: 'purr_persona_trickster',
    name: 'Cat owner — mischievous cat',
    description: 'Result: clever, rule-breaking cat (The Sly Trickster).',
    signal_type: 'owned',
    coverage_percentage: 23,
  },
  {
    id: 'purr_persona_tyrant',
    name: 'Cat owner — assertive cat',
    description: 'Result: dominant, defensive cat (The Tiny Tyrant).',
    signal_type: 'owned',
    coverage_percentage: 20,
  },
] as const;
