/**
 * Importers/Callers: Vitest UI suite; exercises useOfficeStore's error-handling fix
 * Affected API: useOfficeStore (hireAgent, fetchAgents, error)
 * Data Schemas: mocked fetch Response bodies matching /api/agents' real shape
 * User Instruction: Task 8 final-review fix pass — code review found mutation actions
 *   (hireAgent, createTask, createMeeting, saveProviderSetting) swallow failures without
 *   recording them in store.error, and background fetch* actions reset error:null on every
 *   poll, wiping a just-set error within seconds.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useOfficeStore } from '../../src/store/useOfficeStore';

const initialState = useOfficeStore.getState();

afterEach(() => {
  useOfficeStore.setState(initialState, true);
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, ok: boolean, status = ok ? 200 : 400): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

describe('useOfficeStore error handling', () => {
  it('records a failed hireAgent call in error instead of swallowing it', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: 'Missing required agent fields' }, false)));

    await expect(
      useOfficeStore.getState().hireAgent({
        name: '',
        role: '',
        systemPrompt: '',
        provider: 'openclaude',
        model: 'm',
        avatar: 'a',
      }),
    ).rejects.toThrow('Missing required agent fields');

    expect(useOfficeStore.getState().error).toBe('Missing required agent fields');
  });

  it('does not let a background fetchAgents poll wipe an existing error', async () => {
    useOfficeStore.setState({ error: 'stale error from another action' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ agents: [] }, true)));

    await useOfficeStore.getState().fetchAgents();

    expect(useOfficeStore.getState().error).toBe('stale error from another action');
  });
});
