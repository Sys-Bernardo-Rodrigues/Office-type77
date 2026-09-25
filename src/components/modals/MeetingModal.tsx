/**
 * Importers/Callers: src/app/page.tsx
 * Affected API: MeetingModal React component
 * Data Schemas: submits { title, topic, participantIds } to useOfficeStore.createMeeting
 *   (POST /api/meetings); lists useOfficeStore.meetings (GET /api/meetings)
 * User Instruction: Task 8 — docs/superpowers/plans/2026-09-24-pixel-agent-office-plan.md
 */
'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useOfficeStore } from '../../store/useOfficeStore';

export default function MeetingModal() {
  const isOpen = useOfficeStore((state) => state.isMeetingModalOpen);
  const close = useOfficeStore((state) => state.setMeetingModalOpen);
  const agents = useOfficeStore((state) => state.agents);
  const fetchAgents = useOfficeStore((state) => state.fetchAgents);
  const meetings = useOfficeStore((state) => state.meetings);
  const fetchMeetings = useOfficeStore((state) => state.fetchMeetings);
  const createMeeting = useOfficeStore((state) => state.createMeeting);
  const error = useOfficeStore((state) => state.error);
  const clearError = useOfficeStore((state) => state.clearError);

  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (agents.length === 0) void fetchAgents();
    void fetchMeetings();
  }, [isOpen, agents.length, fetchAgents, fetchMeetings]);

  if (!isOpen) return null;

  function toggleParticipant(agentId: string) {
    setParticipantIds((current) =>
      current.includes(agentId) ? current.filter((id) => id !== agentId) : [...current, agentId],
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || !topic.trim() || participantIds.length === 0) return;
    setSubmitting(true);
    clearError();
    try {
      await createMeeting({ title, topic, participantIds });
      setTitle('');
      setTopic('');
      setParticipantIds([]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" role="dialog" aria-modal="true">
      <div className="max-h-[80vh] w-[28rem] overflow-y-auto rounded-lg border-2 border-slate-700 bg-slate-900 p-4 text-white shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">Nova Reunião</h2>
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
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Título"
            required
            className="rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm placeholder:text-slate-500"
          />
          <input
            type="text"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="Pauta"
            required
            className="rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm placeholder:text-slate-500"
          />

          <fieldset className="flex flex-col gap-1 rounded border border-slate-700 p-2">
            <legend className="px-1 text-xs text-slate-400">Participantes</legend>
            {agents.length === 0 ? (
              <p className="px-1 py-1 text-xs text-slate-500">Nenhum agente contratado ainda.</p>
            ) : (
              agents.map((agent) => (
                <label key={agent.id} className="flex items-center gap-2 px-1 py-1 text-sm">
                  <input
                    type="checkbox"
                    checked={participantIds.includes(agent.id)}
                    onChange={() => toggleParticipant(agent.id)}
                  />
                  {agent.avatar} {agent.name} — {agent.role}
                </label>
              ))
            )}
          </fieldset>

          {error ? <p className="text-xs text-red-400">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting || participantIds.length === 0}
            className="rounded bg-emerald-600 px-3 py-2 text-sm font-medium hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Convocando…' : 'Convocar Reunião'}
          </button>
        </form>

        {meetings.length > 0 ? (
          <div className="mt-4 border-t border-slate-700 pt-3">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Reuniões recentes
            </h3>
            <ul className="flex flex-col gap-2">
              {meetings
                .slice()
                .reverse()
                .slice(0, 5)
                .map((meeting) => (
                  <li key={meeting.id} className="rounded bg-slate-800/50 px-2 py-1.5 text-xs">
                    <p className="font-medium text-slate-200">{meeting.title}</p>
                    <p className="text-slate-400">
                      {meeting.status} · {meeting.members.length} participante(s)
                    </p>
                  </li>
                ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
