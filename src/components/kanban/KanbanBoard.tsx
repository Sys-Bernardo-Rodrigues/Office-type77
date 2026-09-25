/**
 * Importers/Callers: src/app/page.tsx
 * Affected API: KanbanBoard React component
 * Data Schemas: reads useOfficeStore.tasks (GET /api/tasks, Task & { assignedTo, subTasks }),
 *   creates via createTask (POST /api/tasks), runs via runTask (POST /api/tasks/execute)
 * User Instruction: Task 8 — docs/superpowers/plans/2026-09-24-pixel-agent-office-plan.md
 */
'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useOfficeStore, type TaskWithRelations } from '../../store/useOfficeStore';

const COLUMNS: { status: string; label: string }[] = [
  { status: 'backlog', label: 'Backlog' },
  { status: 'in_progress', label: 'Em Progresso' },
  { status: 'completed', label: 'Concluído' },
  { status: 'failed', label: 'Falhou' },
];

const PRIORITY_COLOR: Record<string, string> = {
  low: 'bg-slate-700 text-slate-200',
  medium: 'bg-sky-700 text-sky-100',
  high: 'bg-amber-600 text-amber-50',
  urgent: 'bg-red-600 text-red-50',
};

function TaskCard({ task }: { task: TaskWithRelations }) {
  const runTask = useOfficeStore((state) => state.runTask);
  const [running, setRunning] = useState(false);

  async function handleRun() {
    // No default value: a blank field (or "." resolving to the server's own working
    // directory) would let the agent's filesystem/terminal tools run inside this app's
    // own source tree. The user must type an explicit workspace path.
    const workspacePath = window.prompt('Caminho do workspace para execução (ex: ./workspaces/meu-projeto):', '');
    if (!workspacePath) return;
    setRunning(true);
    try {
      await runTask(task.id, workspacePath);
    } finally {
      setRunning(false);
    }
  }

  const canRun = Boolean(task.assignedToId) && (task.status === 'backlog' || task.status === 'failed');

  return (
    <li className="rounded border border-slate-700 bg-slate-800/60 p-2.5 text-sm">
      <div className="mb-1 flex items-start justify-between gap-2">
        <p className="font-medium text-slate-100">{task.title}</p>
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${PRIORITY_COLOR[task.priority] ?? PRIORITY_COLOR.medium}`}>
          {task.priority}
        </span>
      </div>
      <p className="mb-2 line-clamp-2 text-xs text-slate-400">{task.description}</p>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{task.assignedTo ? `${task.assignedTo.avatar} ${task.assignedTo.name}` : 'Não atribuído'}</span>
        {task.subTasks.length > 0 ? <span>{task.subTasks.length} subtarefa(s)</span> : null}
      </div>
      {canRun ? (
        <button
          type="button"
          onClick={handleRun}
          disabled={running}
          className="mt-2 w-full rounded bg-emerald-600 px-2 py-1 text-xs font-medium hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? 'Executando…' : 'Executar'}
        </button>
      ) : null}
    </li>
  );
}

function QuickAddForm() {
  const agents = useOfficeStore((state) => state.agents);
  const createTask = useOfficeStore((state) => state.createTask);
  const error = useOfficeStore((state) => state.error);
  const clearError = useOfficeStore((state) => state.clearError);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [priority, setPriority] = useState('medium');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    clearError();
    try {
      await createTask({
        title,
        description,
        assignedToId: assignedToId || undefined,
        priority,
      });
      setTitle('');
      setDescription('');
    } catch {
      // error already recorded in useOfficeStore.error and rendered below
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-3 flex flex-wrap items-center gap-2 rounded border border-slate-800 bg-slate-900 p-2">
      {error ? <p className="w-full text-xs text-red-400">{error}</p> : null}
      <input
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Título da tarefa"
        required
        className="min-w-[10rem] flex-1 rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm placeholder:text-slate-500"
      />
      <input
        type="text"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Descrição"
        required
        className="min-w-[12rem] flex-[2] rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm placeholder:text-slate-500"
      />
      <select
        value={assignedToId}
        onChange={(event) => setAssignedToId(event.target.value)}
        className="rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-white"
      >
        <option value="">Sem atribuição</option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.avatar} {agent.name}
          </option>
        ))}
      </select>
      <select
        value={priority}
        onChange={(event) => setPriority(event.target.value)}
        className="rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-white"
      >
        <option value="low">low</option>
        <option value="medium">medium</option>
        <option value="high">high</option>
        <option value="urgent">urgent</option>
      </select>
      <button
        type="submit"
        disabled={submitting}
        className="flex items-center gap-1 rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus size={14} /> Adicionar
      </button>
    </form>
  );
}

export default function KanbanBoard() {
  const tasks = useOfficeStore((state) => state.tasks);
  const fetchTasks = useOfficeStore((state) => state.fetchTasks);
  const agents = useOfficeStore((state) => state.agents);
  const fetchAgents = useOfficeStore((state) => state.fetchAgents);

  useEffect(() => {
    void fetchTasks();
    if (agents.length === 0) void fetchAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border-2 border-slate-800 bg-slate-950/60 p-3">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">Kanban de Tarefas</h2>
      <QuickAddForm />
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.status);
          return (
            <div key={column.status} className="flex min-h-0 flex-col rounded border border-slate-800 bg-slate-900/60 p-2">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {column.label} ({columnTasks.length})
              </h3>
              <ul className="flex flex-col gap-2 overflow-y-auto">
                {columnTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
