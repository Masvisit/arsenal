import { describe, it, expect } from 'vitest';
import { createRng, hashSeed } from './random.js';

describe('random', () => {
  it('és determinista per a la mateixa seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    const sa = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(sa);
    sa.forEach((x) => expect(x).toBeGreaterThanOrEqual(0));
    sa.forEach((x) => expect(x).toBeLessThan(1));
  });
  it('accepta seeds de text', () => {
    expect(hashSeed('abc')).toBe(hashSeed('abc'));
    expect(hashSeed('abc')).not.toBe(hashSeed('abd'));
  });
});
