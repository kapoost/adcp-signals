import { describe, expect, test } from 'bun:test';
import { CATALOG } from './catalog.ts';

describe('cats catalog scope discriminators', () => {
  test('all persona signals are contextual / content_signal', () => {
    const personas = CATALOG.filter((s) => s.id.startsWith('purr_persona_'));
    expect(personas.length).toBe(5);
    for (const p of personas) {
      expect(p.subject_type).toBe('contextual');
      expect(p.resolution_method).toBe('content_signal');
    }
  });

  test('purr_cat_owner is an individual-scope audience signal', () => {
    const owner = CATALOG.find((s) => s.id === 'purr_cat_owner');
    expect(owner).toBeDefined();
    expect(owner!.subject_type).toBe('individual');
    expect(owner!.resolution_method).toBe('browser');
  });

  test('catalog is hybrid — contains both contextual and individual subjects', () => {
    const subjects = new Set(CATALOG.map((s) => s.subject_type));
    expect(subjects.has('contextual')).toBe(true);
    expect(subjects.has('individual')).toBe(true);
  });
});
