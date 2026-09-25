/**
 * Importers/Callers: src/app/page.tsx
 * Affected API: HeaderNav React component
 * Data Schemas: reads/writes useOfficeStore UI flags (isBuilderMode, modal visibility)
 * User Instruction: Task 8 — docs/superpowers/plans/2026-09-24-pixel-agent-office-plan.md
 */
'use client';

import { Hammer, MessagesSquare, Settings, Terminal, UserPlus } from 'lucide-react';
import { useOfficeStore } from '../../store/useOfficeStore';

export default function HeaderNav() {
  const isBuilderMode = useOfficeStore((state) => state.isBuilderMode);
  const setBuilderMode = useOfficeStore((state) => state.setBuilderMode);
  const setCatalogModalOpen = useOfficeStore((state) => state.setCatalogModalOpen);
  const setHireAgentModalOpen = useOfficeStore((state) => state.setHireAgentModalOpen);
  const setProviderSettingsModalOpen = useOfficeStore((state) => state.setProviderSettingsModalOpen);
  const setMeetingModalOpen = useOfficeStore((state) => state.setMeetingModalOpen);
  const isLogDrawerOpen = useOfficeStore((state) => state.isLogDrawerOpen);
  const setLogDrawerOpen = useOfficeStore((state) => state.setLogDrawerOpen);

  function toggleBuilderMode() {
    const next = !isBuilderMode;
    setBuilderMode(next);
    setCatalogModalOpen(next);
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b-2 border-slate-800 bg-slate-950 px-4 text-white">
      <h1 className="text-sm font-bold tracking-tight text-red-500 sm:text-base">
        🏢 Type77 Multi-Agent Pixel Office
      </h1>

      <nav className="flex items-center gap-2" aria-label="Office HUD navigation">
        <button
          type="button"
          onClick={() => setHireAgentModalOpen(true)}
          className="flex items-center gap-1.5 rounded bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700"
        >
          <UserPlus size={16} aria-hidden="true" />
          Contratar Agente
        </button>

        <button
          type="button"
          onClick={() => setMeetingModalOpen(true)}
          className="flex items-center gap-1.5 rounded bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700"
        >
          <MessagesSquare size={16} aria-hidden="true" />
          Reunião
        </button>

        <button
          type="button"
          onClick={() => setProviderSettingsModalOpen(true)}
          className="flex items-center gap-1.5 rounded bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700"
        >
          <Settings size={16} aria-hidden="true" />
          Provedores
        </button>

        <button
          type="button"
          onClick={toggleBuilderMode}
          aria-pressed={isBuilderMode}
          className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
            isBuilderMode ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
        >
          <Hammer size={16} aria-hidden="true" />
          Modo Construção
        </button>

        <button
          type="button"
          onClick={() => setLogDrawerOpen(!isLogDrawerOpen)}
          aria-pressed={isLogDrawerOpen}
          className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
            isLogDrawerOpen ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
        >
          <Terminal size={16} aria-hidden="true" />
          Logs
        </button>
      </nav>
    </header>
  );
}
