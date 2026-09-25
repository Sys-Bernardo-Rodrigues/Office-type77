/**
 * Importers/Callers: src/app/page.tsx
 * Affected API: ProviderSettingsModal React component
 * Data Schemas: reads useOfficeStore.providers (GET /api/providers), saves via
 *   saveProviderSetting (PUT /api/providers), tests via testProviderConnection (POST /api/providers/test)
 * User Instruction: Task 8 — docs/superpowers/plans/2026-09-24-pixel-agent-office-plan.md
 *   ("ProviderSettingsModal (with live API key test connection)")
 */
'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useOfficeStore, type ProviderSummary } from '../../store/useOfficeStore';

interface DraftState {
  apiKey: string;
  baseUrl: string;
  model: string;
  isActive: boolean;
}

interface TestState {
  pending: boolean;
  message?: string;
  success?: boolean;
}

export function draftFrom(provider: ProviderSummary): DraftState {
  return {
    apiKey: '',
    baseUrl: provider.baseUrl,
    model: provider.model,
    // A provider with no saved ProviderSetting row (apiKey: null) has never been configured,
    // so it defaults to active — otherwise the route's own create default (isActive: true) is
    // silently overridden by the draft's false and the provider can never run a task.
    isActive: provider.apiKey ? provider.isActive : true,
  };
}

export default function ProviderSettingsModal() {
  const isOpen = useOfficeStore((state) => state.isProviderSettingsModalOpen);
  const close = useOfficeStore((state) => state.setProviderSettingsModalOpen);
  const providers = useOfficeStore((state) => state.providers);
  const fetchProviders = useOfficeStore((state) => state.fetchProviders);
  const saveProviderSetting = useOfficeStore((state) => state.saveProviderSetting);
  const testProviderConnection = useOfficeStore((state) => state.testProviderConnection);
  const error = useOfficeStore((state) => state.error);
  const clearError = useOfficeStore((state) => state.clearError);

  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [tests, setTests] = useState<Record<string, TestState>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) void fetchProviders();
  }, [isOpen, fetchProviders]);

  useEffect(() => {
    setDrafts((current) => {
      const next = { ...current };
      for (const provider of providers) {
        if (!next[provider.providerId]) next[provider.providerId] = draftFrom(provider);
      }
      return next;
    });
  }, [providers]);

  if (!isOpen) return null;

  function updateDraft(providerId: string, patch: Partial<DraftState>) {
    setDrafts((current) => ({ ...current, [providerId]: { ...current[providerId], ...patch } }));
  }

  async function handleSave(providerId: string) {
    const draft = drafts[providerId];
    if (!draft) return;
    setSaving(providerId);
    clearError();
    try {
      await saveProviderSetting({
        providerId,
        apiKey: draft.apiKey || undefined,
        baseUrl: draft.baseUrl,
        defaultModel: draft.model,
        isActive: draft.isActive,
      });
      updateDraft(providerId, { apiKey: '' });
    } catch {
      // error already recorded in useOfficeStore.error and rendered below
    } finally {
      setSaving(null);
    }
  }

  async function handleTest(providerId: string) {
    const draft = drafts[providerId];
    setTests((current) => ({ ...current, [providerId]: { pending: true } }));
    try {
      const result = await testProviderConnection(providerId, {
        apiKey: draft?.apiKey || undefined,
        baseUrl: draft?.baseUrl,
        defaultModel: draft?.model,
      });
      setTests((current) => ({
        ...current,
        [providerId]: { pending: false, success: result.success, message: result.message },
      }));
    } catch (error) {
      setTests((current) => ({
        ...current,
        [providerId]: { pending: false, success: false, message: error instanceof Error ? error.message : String(error) },
      }));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" role="dialog" aria-modal="true">
      <div className="max-h-[80vh] w-[32rem] overflow-y-auto rounded-lg border-2 border-slate-700 bg-slate-900 p-4 text-white shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">Configuração de Provedores</h2>
          <button
            type="button"
            onClick={() => close(false)}
            aria-label="Fechar"
            className="rounded px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {error ? <p className="mb-3 text-xs text-red-400">{error}</p> : null}

        <ul className="flex flex-col gap-3">
          {providers.map((provider) => {
            const draft = drafts[provider.providerId] ?? draftFrom(provider);
            const test = tests[provider.providerId];
            return (
              <li key={provider.providerId} className="rounded border border-slate-700 bg-slate-800/50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold">{provider.name}</span>
                  <label className="flex items-center gap-1.5 text-xs text-slate-400">
                    <input
                      type="checkbox"
                      checked={draft.isActive}
                      onChange={(event) => updateDraft(provider.providerId, { isActive: event.target.checked })}
                    />
                    Ativo
                  </label>
                </div>

                <div className="flex flex-col gap-2">
                  <input
                    type="password"
                    value={draft.apiKey}
                    onChange={(event) => updateDraft(provider.providerId, { apiKey: event.target.value })}
                    placeholder={provider.apiKey ? `Chave salva: ${provider.apiKey}` : 'Chave de API'}
                    className="rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm placeholder:text-slate-500"
                  />
                  <input
                    type="text"
                    value={draft.baseUrl}
                    onChange={(event) => updateDraft(provider.providerId, { baseUrl: event.target.value })}
                    placeholder="Base URL"
                    className="rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm placeholder:text-slate-500"
                  />
                  <input
                    type="text"
                    value={draft.model}
                    onChange={(event) => updateDraft(provider.providerId, { model: event.target.value })}
                    placeholder="Modelo padrão"
                    className="rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm placeholder:text-slate-500"
                  />
                </div>

                {test?.message ? (
                  <p className={`mt-2 text-xs ${test.success ? 'text-emerald-400' : 'text-red-400'}`}>{test.message}</p>
                ) : null}

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleSave(provider.providerId)}
                    disabled={saving === provider.providerId}
                    className="flex-1 rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving === provider.providerId ? 'Salvando…' : 'Salvar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTest(provider.providerId)}
                    disabled={test?.pending}
                    className="flex-1 rounded bg-slate-700 px-3 py-1.5 text-sm font-medium hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {test?.pending ? 'Testando…' : 'Testar conexão'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
