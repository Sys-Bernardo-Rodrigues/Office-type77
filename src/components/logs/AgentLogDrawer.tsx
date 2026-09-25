/**
 * Importers/Callers: src/app/page.tsx
 * Affected API: AgentLogDrawer React component
 * Data Schemas: reads useOfficeStore.logs (GET /api/logs, AgentLog & { agent, task })
 * User Instruction: Task 8 — docs/superpowers/plans/2026-09-24-pixel-agent-office-plan.md
 *   ("live log terminal")
 */
'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useOfficeStore } from '../../store/useOfficeStore';

const TYPE_COLOR: Record<string, string> = {
  thought: 'text-sky-400',
  action: 'text-amber-400',
  observation: 'text-emerald-400',
  reflection: 'text-fuchsia-400',
};

const POLL_INTERVAL_MS = 4000;

export default function AgentLogDrawer() {
  const isOpen = useOfficeStore((state) => state.isLogDrawerOpen);
  const close = useOfficeStore((state) => state.setLogDrawerOpen);
  const logs = useOfficeStore((state) => state.logs);
  const fetchLogs = useOfficeStore((state) => state.fetchLogs);

  useEffect(() => {
    if (!isOpen) return;
    void fetchLogs();
    const interval = window.setInterval(() => void fetchLogs(), POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [isOpen, fetchLogs]);

  if (!isOpen) return null;

  return (
    <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l-2 border-slate-800 bg-slate-950/95 text-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-300">Terminal de Agentes</h2>
        <button
          type="button"
          onClick={() => close(false)}
          aria-label="Fechar terminal"
          className="rounded px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs">
        {logs.length === 0 ? (
          <p className="text-slate-500">Nenhuma atividade registrada ainda.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {logs.map((log) => (
              <li key={log.id} className="border-b border-slate-900 pb-1.5">
                <span className="text-slate-500">{new Date(log.createdAt).toLocaleTimeString()}</span>{' '}
                <span className="text-slate-300">{log.agent.avatar} {log.agent.name}</span>{' '}
                <span className={TYPE_COLOR[log.type] ?? 'text-slate-300'}>[{log.type}]</span>{' '}
                <span className="text-slate-200">{log.content}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
