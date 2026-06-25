import { describe, expect, it } from 'vitest';

import * as api from './index';

describe('package entry point', () => {
  it('exports exactly the documented public surface', () => {
    expect(Object.keys(api).sort()).toStrictEqual(['isAsciiString']);
  });

  it('exports each member as a function', () => {
    for (const name of Object.keys(api)) {
      expect(typeof api[name as keyof typeof api]).toBe('function');
    }
  });
});
