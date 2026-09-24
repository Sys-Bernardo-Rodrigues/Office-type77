import { describe, it, expect } from 'vitest';

describe('Project Scaffolding', () => {
  it('loads environment and basic config correctly', () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });
});
