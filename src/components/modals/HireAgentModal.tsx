/**
 * Importers/Callers: src/app/page.tsx
 * Affected API: HireAgentModal React component
 * Data Schemas: submits { name, role, systemPrompt, provider, model, avatar, temperature } to
 *   useOfficeStore.hireAgent (POST /api/agents)
 * User Instruction: Task 8 — docs/superpowers/plans/2026-09-24-pixel-agent-office-plan.md
 */
'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useOfficeStore } from '../../store/useOfficeStore';

export default function HireAgentModal() {
  const isOpen = useOfficeStore((state) => state.isHireAgentModalOpen);
  const close = useOfficeStore((state) => state.setHireAgentModalOpen);
  const providers = useOfficeStore((state) => state.providers);
  const fetchProviders = useOfficeStore((state) => state.fetchProviders);
  const hireAgent = useOfficeStore((state) => state.hireAgent);
  const error = useOfficeStore((state) => state.error);
  const clearError = useOfficeStore((state) => state.clearError);

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [provider, setProvider] = useState('');
  const [model, setModel] = useState('');
  const [avatar, setAvatar] = useState('🤖');
  const [temperature, setTemperature] = useState(0.7);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && providers.length === 0) void fetchProviders();
  }, [isOpen, providers.length, fetchProviders]);

  useEffect(() => {
    if (!provider && providers.length > 0) {
      setProvider(providers[0].providerId);
      setModel(providers[0].model);
    }
  }, [provider, providers]);

  if (!isOpen) return null;

  function resetForm() {
    setName('');
    setRole('');
    setSystemPrompt('');
    setAvatar('🤖');
    setTemperature(0.7);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !role.trim() || !systemPrompt.trim() || !provider || !model.trim()) return;
    setSubmitting(true);
    clearError();
    try {
      await hireAgent({ name, role, systemPrompt, provider, model, avatar, temperature });
      resetForm();
      close(false);
    } catch {
      // error already recorded in useOfficeStore.error and rendered below
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" role="dialog" aria-modal="true">
      <div className="w-96 rounded-lg border-2 border-slate-700 bg-slate-900 p-4 text-white shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">Contratar Agente</h2>
          <button
            type="button"
            onClick={() => close(false)}
            aria-label="Fechar"
            className="rounded px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nome do agente"
            required
            className="rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm placeholder:text-slate-500"
          />
          <input
            type="text"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            placeholder="Cargo (ex: Engenheiro)"
            required
            className="rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm placeholder:text-slate-500"
          />
          <textarea
            value={systemPrompt}
            onChange={(event) => setSystemPrompt(event.target.value)}
            placeholder="Prompt de sistema"
            required
            rows={3}
            className="resize-none rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm placeholder:text-slate-500"
          />

          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Provedor
            <select
              value={provider}
              onChange={(event) => {
                const next = event.target.value;
                setProvider(next);
                const match = providers.find((p) => p.providerId === next);
                if (match) setModel(match.model);
              }}
              className="rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-white"
            >
              {providers.map((p) => (
                <option key={p.providerId} value={p.providerId}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <input
            type="text"
            value={model}
            onChange={(event) => setModel(event.target.value)}
            placeholder="Modelo"
            required
            className="rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm placeholder:text-slate-500"
          />

          <div className="flex items-center gap-3">
            <label className="flex flex-col gap-1 text-xs text-slate-400">
              Avatar
              <input
                type="text"
                value={avatar}
                onChange={(event) => setAvatar(event.target.value)}
                maxLength={4}
                className="w-16 rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-center text-sm"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-xs text-slate-400">
              Temperatura ({temperature.toFixed(1)})
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={temperature}
                onChange={(event) => setTemperature(Number.parseFloat(event.target.value))}
              />
            </label>
          </div>

          {error ? <p className="text-xs text-red-400">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 rounded bg-emerald-600 px-3 py-2 text-sm font-medium hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Contratando…' : 'Contratar'}
          </button>
        </form>
      </div>
    </div>
  );
}
