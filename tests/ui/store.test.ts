/**
 * Importers/Callers: Vitest UI suite; exercises the Task 8 Zustand office store
 * Affected API: useOfficeStore
 * Data Schemas: Office HUD client state (builder mode, agents, tasks, meetings, providers, logs)
 * User Instruction: Task 8 plan brief, Step 1 (failing store test) — docs/superpowers/plans/2026-09-24-pixel-agent-office-plan.md
 */
import { describe, it, expect } from 'vitest';
import { useOfficeStore } from '../../src/store/useOfficeStore';

describe('Office Zustand Store', () => {
  it('manages active mode and selected agent state', () => {
    useOfficeStore.getState().setBuilderMode(true);
    expect(useOfficeStore.getState().isBuilderMode).toBe(true);
  });
});
