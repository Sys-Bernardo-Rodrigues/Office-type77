/**
 * Importers/Callers: src/app/page.tsx and every HUD component (HeaderNav, HireAgentModal,
 *   ProviderSettingsModal, MeetingModal, KanbanBoard, AgentLogDrawer), tests/ui/store.test.ts
 * Affected API: useOfficeStore — builder-mode/modal UI state plus fetch/CRUD actions wrapping
 *   GET/POST /api/agents, GET/POST /api/tasks, POST /api/tasks/execute, GET/POST /api/meetings,
 *   GET/PUT /api/providers, POST /api/providers/test, GET /api/logs
 * Data Schemas: Prisma Agent/Task/Meeting/MeetingMember/AgentLog records; ProviderSummary and
 *   ProviderConnectionResult shapes returned by the provider routes
 * User Instruction: Task 8 — docs/superpowers/plans/2026-09-24-pixel-agent-office-plan.md
 *   ("React HUD, Kanban Board, Agent Hiring & In-Browser Settings")
 */
import { create } from 'zustand';
import type { Agent, AgentLog, Meeting, MeetingMember, Task } from '@prisma/client';
import type { ProviderConnectionResult } from '@/lib/providers/types';

export type TaskWithRelations = Task & { assignedTo: Agent | null; subTasks: Task[] };
export type MeetingWithMembers = Meeting & { members: (MeetingMember & { agent: Agent })[] };
export type AgentLogEntry = AgentLog & { agent: Agent; task: Task | null };

export interface ProviderSummary {
  providerId: string;
  name: string;
  defaultBaseUrl: string;
  defaultModel: string;
  apiKey: string | null;
  baseUrl: string;
  model: string;
  isActive: boolean;
  customHeaders: Record<string, string> | null;
}

export interface HireAgentInput {
  name: string;
  role: string;
  systemPrompt: string;
  provider: string;
  model: string;
  avatar: string;
  temperature?: number;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  assignedToId?: string;
  parentId?: string;
  priority?: string;
}

export interface CreateMeetingInput {
  title: string;
  topic: string;
  participantIds: string[];
}

export interface ProviderSettingInput {
  providerId: string;
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
  customHeaders?: Record<string, string>;
  isActive?: boolean;
}

export interface FetchLogsParams {
  agentId?: string;
  taskId?: string;
  limit?: number;
}

interface OfficeStoreState {
  isBuilderMode: boolean;
  builderSelectedType: string | null;
  builderRotation: number;
  setBuilderMode: (mode: boolean) => void;
  setBuilderSelectedItem: (type: string | null) => void;
  rotateBuilderSelection: () => void;

  isCatalogModalOpen: boolean;
  isHireAgentModalOpen: boolean;
  isProviderSettingsModalOpen: boolean;
  isMeetingModalOpen: boolean;
  isLogDrawerOpen: boolean;
  setCatalogModalOpen: (open: boolean) => void;
  setHireAgentModalOpen: (open: boolean) => void;
  setProviderSettingsModalOpen: (open: boolean) => void;
  setMeetingModalOpen: (open: boolean) => void;
  setLogDrawerOpen: (open: boolean) => void;

  agents: Agent[];
  agentsLoading: boolean;
  selectedAgentId: string | null;
  setSelectedAgentId: (id: string | null) => void;
  fetchAgents: () => Promise<void>;
  hireAgent: (input: HireAgentInput) => Promise<Agent>;

  tasks: TaskWithRelations[];
  tasksLoading: boolean;
  fetchTasks: () => Promise<void>;
  createTask: (input: CreateTaskInput) => Promise<TaskWithRelations>;
  runTask: (taskId: string, workspacePath: string) => Promise<void>;

  meetings: MeetingWithMembers[];
  meetingsLoading: boolean;
  fetchMeetings: () => Promise<void>;
  createMeeting: (input: CreateMeetingInput) => Promise<MeetingWithMembers>;

  providers: ProviderSummary[];
  providersLoading: boolean;
  fetchProviders: () => Promise<void>;
  saveProviderSetting: (input: ProviderSettingInput) => Promise<void>;
  testProviderConnection: (providerId: string) => Promise<ProviderConnectionResult>;

  logs: AgentLogEntry[];
  logsLoading: boolean;
  fetchLogs: (params?: FetchLogsParams) => Promise<void>;

  error: string | null;
  clearError: () => void;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function parseJsonOrThrow<T = unknown>(response: Response): Promise<T> {
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof data === 'object' && data !== null && 'error' in data && typeof (data as { error?: unknown }).error === 'string'
        ? (data as { error: string }).error
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return data as T;
}

export const useOfficeStore = create<OfficeStoreState>((set, get) => ({
  isBuilderMode: false,
  builderSelectedType: null,
  builderRotation: 0,
  setBuilderMode: (mode) =>
    set(mode ? { isBuilderMode: true } : { isBuilderMode: false, builderSelectedType: null, builderRotation: 0 }),
  setBuilderSelectedItem: (type) => set({ builderSelectedType: type, builderRotation: 0 }),
  rotateBuilderSelection: () => set((state) => ({ builderRotation: (state.builderRotation + 90) % 360 })),

  isCatalogModalOpen: false,
  isHireAgentModalOpen: false,
  isProviderSettingsModalOpen: false,
  isMeetingModalOpen: false,
  isLogDrawerOpen: false,
  setCatalogModalOpen: (open) => set({ isCatalogModalOpen: open }),
  setHireAgentModalOpen: (open) => set({ isHireAgentModalOpen: open }),
  setProviderSettingsModalOpen: (open) => set({ isProviderSettingsModalOpen: open }),
  setMeetingModalOpen: (open) => set({ isMeetingModalOpen: open }),
  setLogDrawerOpen: (open) => set({ isLogDrawerOpen: open }),

  agents: [],
  agentsLoading: false,
  selectedAgentId: null,
  setSelectedAgentId: (id) => set({ selectedAgentId: id }),
  fetchAgents: async () => {
    set({ agentsLoading: true, error: null });
    try {
      const data = await parseJsonOrThrow<{ agents: Agent[] }>(await fetch('/api/agents'));
      set({ agents: data.agents ?? [], agentsLoading: false });
    } catch (error) {
      set({ error: toErrorMessage(error), agentsLoading: false });
    }
  },
  hireAgent: async (input) => {
    const data = await parseJsonOrThrow<{ agent: Agent }>(
      await fetch('/api/agents', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      }),
    );
    set((state) => ({ agents: [...state.agents, data.agent] }));
    return data.agent;
  },

  tasks: [],
  tasksLoading: false,
  fetchTasks: async () => {
    set({ tasksLoading: true, error: null });
    try {
      const data = await parseJsonOrThrow<{ tasks: TaskWithRelations[] }>(await fetch('/api/tasks'));
      set({ tasks: data.tasks ?? [], tasksLoading: false });
    } catch (error) {
      set({ error: toErrorMessage(error), tasksLoading: false });
    }
  },
  createTask: async (input) => {
    const data = await parseJsonOrThrow<{ task: TaskWithRelations }>(
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      }),
    );
    await get().fetchTasks();
    return data.task;
  },
  runTask: async (taskId, workspacePath) => {
    try {
      await parseJsonOrThrow(
        await fetch('/api/tasks/execute', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ taskId, workspacePath }),
        }),
      );
    } catch (error) {
      set({ error: toErrorMessage(error) });
    } finally {
      await get().fetchTasks();
      await get().fetchLogs({ taskId });
    }
  },

  meetings: [],
  meetingsLoading: false,
  fetchMeetings: async () => {
    set({ meetingsLoading: true, error: null });
    try {
      const data = await parseJsonOrThrow<{ meetings: MeetingWithMembers[] }>(await fetch('/api/meetings'));
      set({ meetings: data.meetings ?? [], meetingsLoading: false });
    } catch (error) {
      set({ error: toErrorMessage(error), meetingsLoading: false });
    }
  },
  createMeeting: async (input) => {
    const data = await parseJsonOrThrow<{ meeting: MeetingWithMembers }>(
      await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      }),
    );
    await get().fetchMeetings();
    return data.meeting;
  },

  providers: [],
  providersLoading: false,
  fetchProviders: async () => {
    set({ providersLoading: true, error: null });
    try {
      const data = await parseJsonOrThrow<{ providers: ProviderSummary[] }>(await fetch('/api/providers'));
      set({ providers: data.providers ?? [], providersLoading: false });
    } catch (error) {
      set({ error: toErrorMessage(error), providersLoading: false });
    }
  },
  saveProviderSetting: async (input) => {
    await parseJsonOrThrow(
      await fetch('/api/providers', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      }),
    );
    await get().fetchProviders();
  },
  testProviderConnection: async (providerId) => {
    return parseJsonOrThrow<ProviderConnectionResult>(
      await fetch('/api/providers/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ providerId }),
      }),
    );
  },

  logs: [],
  logsLoading: false,
  fetchLogs: async (params) => {
    set({ logsLoading: true, error: null });
    try {
      const query = new URLSearchParams();
      if (params?.agentId) query.set('agentId', params.agentId);
      if (params?.taskId) query.set('taskId', params.taskId);
      if (params?.limit) query.set('limit', String(params.limit));
      const qs = query.toString();
      const data = await parseJsonOrThrow<{ logs: AgentLogEntry[] }>(await fetch(`/api/logs${qs ? `?${qs}` : ''}`));
      set({ logs: data.logs ?? [], logsLoading: false });
    } catch (error) {
      set({ error: toErrorMessage(error), logsLoading: false });
    }
  },

  error: null,
  clearError: () => set({ error: null }),
}));
