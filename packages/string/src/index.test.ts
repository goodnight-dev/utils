import { describe, expect, it } from 'vitest';

import * as api from './index';

// Guards the package's public surface. The per-function tests import their
// module directly, so a function that is implemented and tested but never
// re-exported from this barrel would still pass them — and ship unreachable.
// This asserts the barrel itself, so a forgotten re-export fails `pnpm check`.
describe('package entry point', () => {
  it('exports exactly the documented public surface', () => {
    expect(Object.keys(api).sort()).toStrictEqual(['camelCase', 'capitalize']);
  });

  it('exports each member as a function', () => {
    for (const name of Object.keys(api)) {
      expect(typeof api[name as keyof typeof api]).toBe('function');
    }
  });
});
