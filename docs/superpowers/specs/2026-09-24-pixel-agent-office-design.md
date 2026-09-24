# Specification: Multi-Agent Pixel Office Orchestrator

**Status:** Draft / Pending Review  
**Date:** 2026-09-24  
**Project:** Type77 Multi-Agent Pixel Office (`Office-type77`)  
**Inspirations:** AgentFleet (Agent Management & Task Delegation) + pixel-agents (2D Pixel Art Office Simulation & Tycoon Editor)

---

## 1. Executive Summary & Goals

### 1.1 Overview
The **Multi-Agent Pixel Office Orchestrator** is an interactive, gamified AI orchestration platform. It merges full-featured multi-agent task execution and delegation (Kanban, employee hiring, role/prompt configuration, and tool sandboxing) with a 2D top-down pixel art virtual office built in Phaser 3.

Users can hire, customize, and direct autonomous AI agents. As agents work, deliberate, or hold meetings, they physically navigate the office grid, sit at desks, interact with office furniture (e.g., grab coffee during breaks), and display live thought/speech bubbles. Users can also edit and expand the office space in real-time (Tycoon/Sims-style).

### 1.2 Key Objectives
1. **Interactive Pixel Art Office:** 2D grid-based interactive office with pathfinding (A*), collision detection, customizable furniture, and visual agent state animations (typing, drinking coffee, meeting, idling).
2. **Office Layout Builder (Tycoon Mode):** Real-time grid editor allowing users to place walls, floors, desks, chairs, meeting tables, coffee machines, and decorative objects.
3. **Multi-Agent Orchestration & ReAct Loop:** Event-driven agent execution supporting autonomous task resolution, tool usage, hierarchical delegation, and group meetings.
4. **Extensible Multi-Provider LLM & Auth Hub (Configurable via Frontend):** Native support for standard and custom AI engines with 100% in-browser credential/API management:
   - `openclaude-omni` (Full multimodal reasoning & large context agent workflows)
   - `openclaude` (Fast high-throughput code synthesis & tool calling)
   - `hermes` (Function calling & specialized reasoning models)
   - `openroute` (Multi-model aggregation and flexible routing)
   - `codex` (Code generation, scripting, and code analysis)
   - `claude` (Direct Anthropic Claude models & API keys)
   - `antigravity` (Advanced Agentic Coding & DeepMind engine endpoints)
   - `custom` (OpenAI / Anthropic compatible custom endpoints & local proxy servers)
5. **Zero-Config Frontend Auth & Settings:** Complete UI-based management of API keys, custom base URLs, tokens, and model overrides directly from the frontend settings modal (persisted locally in SQLite with instant connection testing).
6. **Real-time Synchronization:** Low-latency bi-directional WebSocket (Socket.io) communication bridging React UI, Phaser 3 game canvas, and backend agent runtimes.
7. **Zero-Config Local Storage:** Local-first architecture using SQLite with Prisma ORM for agent rosters, provider settings, layouts, task queues, and logs.

---

## 2. System Architecture

### 2.1 High-Level Architecture Diagram

```
+-------------------------------------------------------------------------------+
|                                  BROWSER CLIENT                               |
|                                                                               |
|  +-------------------------------------+  +--------------------------------+  |
|  |           React 19 / Next.js UI     |  |         Phaser 3 Canvas        |  |
|  | - Agent Hiring & Config Modal       |  | - 2D Tilemap & Isometric Grid  |  |
|  | - Provider & API Key Settings UI    |  | - A* Grid Pathfinding          |  |
|  | - Kanban Task Board & Logs Drawer   |  | - Sprite Animations & Bubbles  |  |
|  | - Office Builder & Furniture Catalog|  |                                |  |
|  +-------------------------------------+  +--------------------------------+  |
|                     ^                                    ^                    |
|                     |              Zustand Bridge        |                    |
|                     +-----------------+------------------+                    |
|                                       |                                       |
|                                       v                                       |
|                             Socket.io Client / REST                           |
+---------------------------------------+---------------------------------------+
                                        |  (WebSockets / HTTP)
                                        v
+-------------------------------------------------------------------------------+
|                            NODE.JS / NEXT.JS SERVER                           |
|                                                                               |
|  +---------------------------+  +-------------------------------------------+ |
|  |     Socket.io Gateway     |  |          Agent Runtime Engine             | |
|  | - Position & Path Sync    |  | - ReAct Event Loop (Thought->Act->Observe)| |
|  | - Speech/Thought Streams  |  | - Task Scheduler & Delegation Tree        | |
|  | - State Transitions       |  | - Group Meeting Protocol Manager          | |
|  +---------------------------+  +-------------------------------------------+ |
|                                       |                                       |
|                                       v                                       |
|  +--------------------------------------------------------------------------+ |
|  |                         Multi-Provider Adapter Hub                       | |
|  |   [openclaude-omni]  [openclaude]  [hermes]  [openroute]  [codex]        | |
|  +--------------------------------------------------------------------------+ |
|                                       |                                       |
|                                       v                                       |
|  +---------------------------+  +-------------------------------------------+ |
|  |       Tool Sandbox        |  |            Persistence Layer              | |
|  | - File I/O (Workspace)    |  | - Prisma Client                           | |
|  | - Terminal / Bash Exec    |  | - SQLite Database (agents, tasks, logs,   | |
|  | - Web Search & Fetch      |  |   layouts, meeting transcripts)           | |
|  +---------------------------+  +-------------------------------------------+ |
+-------------------------------------------------------------------------------+
```

### 2.2 Component Responsibilities

1. **Frontend UI (Next.js & Tailwind CSS):**
   - Renders overlay panels: Agent Manager, Kanban Board, Office Furniture Catalog, Execution Terminal Drawer, and Meeting Room HUD.
   - Communicates with the game instance via a centralized `useOfficeStore` (Zustand) bridge.

2. **Game Engine (Phaser 3):**
   - Manages the rendering loop, camera zoom/pan, tilemap layers (Floor, Walls, Objects, Collision).
   - Runs the A* pathfinding algorithm on top of the dynamic navigation grid.
   - Manages agent sprite states (Idle, Walk, Sit, Type, Drink, Talk) and overlays speech/thought bubble DOM elements or textures.

3. **Agent Runtime Engine:**
   - Runs asynchronous ReAct execution loops for each active agent.
   - Manages sub-task spawning and hierarchical delegation (e.g. Lead Developer delegates to Frontend Agent).
   - Coordinates meeting rooms where multiple agents converse with a shared blackboard context.

4. **Multi-Provider Adapter Hub:**
   - Standardizes request/response formats across `openclaude-omni`, `openclaude`, `hermes`, `openroute`, and `codex`.
   - Handles streaming tokens, tool call formatting, JSON schema validation, and retry backoff.

5. **Tool Sandbox:**
   - Secure local tool executor: `read_file`, `write_file`, `list_directory`, `execute_bash`, `web_search`, `fetch_webpage`, `delegate_task`, `call_meeting`.

---

## 3. Data Models & Database Schema

The database is managed with SQLite and Prisma ORM.

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

model ProviderSetting {
  id          String      @id @default(uuid())
  providerId  String      @unique // "openclaude-omni" | "openclaude" | "hermes" | "openroute" | "codex" | "claude" | "antigravity" | "custom"
  displayName String      // e.g. "Anthropic Claude", "Antigravity Engine"
  apiKey      String?     // Stored locally in SQLite
  baseUrl     String?     // Optional custom endpoint URL
  customHeaders String?   // Optional JSON string of extra headers/tokens
  models      String?     // JSON array of available model IDs for this provider
  isEnabled   Boolean     @default(true)
  isDefault   Boolean     @default(false)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model Agent {
  id           String      @id @default(uuid())
  name         String
  role         String      // e.g. "Lead Architect", "Frontend Engineer", "Copywriter"
  avatarSprite String      // e.g. "char_01", "char_02", "char_cyber_01"
  provider     String      // "openclaude-omni" | "openclaude" | "hermes" | "openroute" | "codex" | "claude" | "antigravity" | "custom"
  modelName    String      // specific model ID or endpoint alias
  systemPrompt String
  temperature  Float       @default(0.7)
  status       String      @default("idle") // "idle" | "walking" | "working" | "meeting" | "break"
  assignedDeskId String?   // References FurnitureItem ID
  
  tasks        Task[]      @relation("AssignedTasks")
  createdTasks Task[]      @relation("DelegatedTasks")
  logs         AgentLog[]
  meetingMembers MeetingMember[]
  
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
}

model OfficeLayout {
  id          String          @id @default(uuid())
  name        String          @default("Main Office")
  width       Int             @default(32) // Grid tiles width
  height      Int             @default(24) // Grid tiles height
  tileData    String          // JSON encoded tile layer matrix (floors, walls)
  furniture   FurnitureItem[]
  isDefault   Boolean         @default(true)
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}

model FurnitureItem {
  id          String        @id @default(uuid())
  layoutId    String
  layout      OfficeLayout  @relation(fields: [layoutId], references: [id], onDelete: Cascade)
  type        String        // "desk" | "chair" | "meeting_table" | "coffee_machine" | "plant" | "water_cooler" | "wall_decor"
  gridX       Int
  gridY       Int
  width       Int           @default(1)
  height      Int           @default(1)
  rotation    Int           @default(0) // 0, 90, 180, 270
  isCollidable Boolean      @default(true)
  interactX   Int?          // Tile coordinate agent stands on to interact
  interactY   Int?
  customProps String?       // JSON string for desk bindings, etc.
}

model Task {
  id          String      @id @default(uuid())
  title       String
  description String
  status      String      @default("todo") // "todo" | "in_progress" | "review" | "done" | "failed"
  priority    String      @default("medium") // "low" | "medium" | "high" | "critical"
  
  assigneeId  String?
  assignee    Agent?      @relation("AssignedTasks", fields: [assigneeId], references: [id])
  creatorId   String?
  creator     Agent?      @relation("DelegatedTasks", fields: [creatorId], references: [id])
  parentId    String?
  parentTask  Task?       @relation("SubTasks", fields: [parentId], references: [id])
  subTasks    Task[]      @relation("SubTasks")
  
  logs        AgentLog[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model AgentLog {
  id          String      @id @default(uuid())
  agentId     String
  agent       Agent       @relation(fields: [agentId], references: [id], onDelete: Cascade)
  taskId      String?
  task        Task?       @relation(fields: [taskId], references: [id], onDelete: SetNull)
  type        String      // "thought" | "action" | "observation" | "speech" | "error" | "status"
  content     String
  toolName    String?
  toolInput   String?     // JSON string
  toolOutput  String?     // JSON string
  createdAt   DateTime    @default(now())
}

model Meeting {
  id          String          @id @default(uuid())
  title       String
  topic       String
  status      String          @default("pending") // "pending" | "in_progress" | "completed"
  transcript  String?         // Full meeting log summary
  members     MeetingMember[]
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}

model MeetingMember {
  id          String      @id @default(uuid())
  meetingId   String
  meeting     Meeting     @relation(fields: [meetingId], references: [id], onDelete: Cascade)
  agentId     String
  agent       Agent       @relation(fields: [agentId], references: [id], onDelete: Cascade)
}
```

---

## 4. Game Engine, Pixel Art Simulation & Office Tycoon Editor

### 4.1 Grid & Rendering Specifications
- **Grid Size:** 16x16 or 32x32 pixels per tile.
- **Layers:**
  1. `FloorLayer`: Carpet, wood, tiles, concrete.
  2. `WallLayer`: North/South/East/West walls, windows, doors.
  3. `FurnitureLayer`: Desks, computers, chairs, meeting tables, coffee bars, plants.
  4. `EntityLayer`: Agent sprites with depth sorting (`y-sorting` based on feet position).
  5. `OverlayLayer`: Thought/speech bubbles, selection outlines, path markers, grid guidelines.

### 4.2 Interactive Tycoon Mode (Office Builder)
- **Tool Modes:**
  - `Select / Inspect`: Click agents or furniture to view details, inspect tasks, or reassign desks.
  - `Build Floor / Wall`: Click and drag to lay tiles with instant collision grid updates.
  - `Place Furniture`: Choose from the furniture catalog, rotate with `R`, and place.
  - `Move / Erase`: Pick up placed items or delete them back into inventory.
- **Dynamic A* Collision Grid:**
  - Whenever furniture is placed, moved, or deleted, the Phaser collision matrix recalculates impassable cells and updates interaction points (e.g. Chair interaction point adjacent to Desk).

### 4.3 Agent Navigation & State Machine
Agents follow an autonomous state machine connected to their real-world task execution:

```
                  +--------------------------------+
                  |              IDLE              |
                  |  (Wandering, water cooler,     |
                  |   resting in lounge area)      |
                  +---------------+----------------+
                                  |
               Task Assigned /    | Meeting Called
               Break Ended        |
                                  v
                  +--------------------------------+
                  |         WALKING (A*)           |
                  |  (Calculating path to target   |
                  |   desk or meeting seat)        |
                  +---------------+----------------+
                                  |
                                  v
                  +--------------------------------+
                  |            WORKING             |
                  |  (Typing at desk, executing    |
                  |   tools, thought bubbles)      |
                  +-------+--------------+---------+
                          |              |
           Task Done /    |              | Needs Meeting /
           Break Trigger  |              | Break
                          v              v
                  +---------------+  +-------------------+
                  | COFFEE BREAK  |  |  IN MEETING ROOM  |
                  | (Goes to bar) |  | (Group dialogue)  |
                  +---------------+  +-------------------+
```

---

## 5. Multi-Provider Integration, Frontend Auth Hub & Agent Engine

### 5.1 Extensible Multi-Provider Hub with In-Browser Configuration

The platform provides a unified adapter interface allowing full dynamic registration and configuration of providers directly via the Frontend UI:

```typescript
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: LLMToolCall[];
}

export interface LLMToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface ProviderResponseStream {
  textStream: AsyncIterable<string>;
  thoughtStream?: AsyncIterable<string>;
  toolCallsStream?: AsyncIterable<LLMToolCall>;
  getFinalResponse: () => Promise<{
    content: string;
    toolCalls?: LLMToolCall[];
    finishReason: string;
  }>;
}

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  customHeaders?: Record<string, string>;
  model: string;
  temperature: number;
  maxTokens?: number;
}

export interface ProviderAdapter {
  providerId: string;
  displayName: string;
  testConnection(config: ProviderConfig): Promise<{ success: boolean; message: string }>;
  generateCompletion(
    messages: LLMMessage[],
    tools: ToolDefinition[],
    config: ProviderConfig
  ): Promise<ProviderResponseStream>;
}
```

#### Provider Ecosystem & Roles:
1. **`openclaude-omni`**:
   - Optimized for full-spectrum reasoning, broad context analysis, and orchestration leads.
   - Supports native multimodal & long context tokens.
2. **`openclaude`**:
   - High-speed code generation, tool parsing, and rapid single-task execution.
3. **`hermes`**:
   - Advanced function calling, structured output adherence, and local/remote endpoint support.
4. **`openroute`**:
   - Dynamic multi-model routing, fallback failover, and access to specialized open/frontier models.
5. **`codex`**:
   - Precision code generation, refactoring, and AST-driven coding tasks.
6. **`claude` (Anthropic Direct)**:
   - Direct integration with Anthropic Claude API (Opus, Sonnet, Haiku) with streaming tool-use.
7. **`antigravity` (DeepMind Agent Engine)**:
   - Advanced Agentic Coding and autonomous reasoning workflows.
8. **`custom` (OpenAI / Anthropic Compatible)**:
   - Allows users to enter any custom base URL, endpoint path, auth headers, and model IDs (e.g. vLLM, LiteLLM, LMStudio, local proxies).

### 5.2 Frontend Auth & Settings Management
- **No Manual `.env` Editing Required:** Users configure API keys, custom base URLs, tokens, and model mappings directly inside the Frontend "Provider Settings" modal (`/settings/providers` or floating HUD).
- **Live Connection Testing:** Clicking "Test Connection" performs an instant ping/dry-run against the configured provider and shows immediate latency / success indicator in the UI.
- **Secure Local Storage:** Credentials are saved directly into the local SQLite database via Prisma (`ProviderSetting` table).

### 5.3 Agent Execution (ReAct Loop)
When a task is triggered:
1. **Context Formulation:** Agent loads its persona, assigned system prompt, available tools, task requirements, and recent execution history.
2. **Thought Phase:** Agent generates internal reasoning (emitted via WebSocket as a `thought` event and rendered as a thought cloud `💭` above the sprite).
3. **Action Phase:** Agent chooses a tool (e.g. `write_file`, `execute_bash`, `delegate_task`).
4. **Observation Phase:** Tool executes in the sandbox, returning output (success/failure) back to the LLM context.
5. **Iteration / Completion:** The loop continues until the agent produces a final answer or marks the Kanban task as `done`.

### 5.4 Tool Sandbox Catalog
- **`workspace_fs`**:
  - `read_file(path: string)`
  - `write_file(path: string, content: string)`
  - `list_files(directory: string)`
- **`system_terminal`**:
  - `execute_command(command: string, timeout_ms?: number)`
- **`web_network`**:
  - `web_search(query: string)`
  - `fetch_page(url: string)`
- **`agent_collaboration`**:
  - `delegate_task(target_agent_id: string, task_title: string, task_instructions: string)`
  - `call_meeting(participant_agent_ids: string[], topic: string)`
  - `broadcast_office_message(message: string)`

---

## 6. Real-Time Communication & WebSocket Protocol

### 6.1 Event Contract (Socket.io)

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `agent:state_change` | Server -> Client | `{ agentId, status, targetX?, targetY? }` | Triggers sprite movement and animation states |
| `agent:thought` | Server -> Client | `{ agentId, text, taskId }` | Displays live thought bubble above sprite and updates log |
| `agent:speech` | Server -> Client | `{ agentId, text, channel }` | Displays chat bubble and posts to Office/Meeting chat |
| `task:updated` | Server -> Client | `{ task: Task }` | Updates Kanban column in real-time |
| `office:layout_change` | Bi-directional | `{ layout: OfficeLayout }` | Syncs modified walls/furniture between editor and game |
| `meeting:started` | Server -> Client | `{ meetingId, members, tableId }` | Sends member agents walking to the meeting table |
| `task:create` | Client -> Server | `{ title, description, assigneeId? }` | User dispatches a new task |
| `agent:hire` | Client -> Server | `{ name, role, provider, model, prompt }` | Spawns a new employee in the office |

---

## 7. Frontend User Experience & Layout

### 7.1 Main Screen Breakdown
```
+------------------------------------------------------------------------------------+
|  [Logo] Type77 Pixel Office    [+ Hire Agent] [+ New Task] [Build Office] [Config] |
+-----------------------------------------------------+------------------------------+
|                                                     |  SIDEBAR / FLOATING PANELS   |
|                                                     |                              |
|                                                     |  +-- [Tab: Agents] --------+ |
|                  PHASER 3 CANVAS                    |  | - Lead Dev (OpenClaude) | |
|                                                     |  | - Architect (Omni)      | |
|     (2D Virtual Office Viewport)                    |  | - Coder (Hermes)        | |
|                                                     |  +-------------------------+ |
|     - Agents moving between desks                   |                              |
|     - Speech & Thought bubbles                      |  +-- [Tab: Kanban] --------+ |
|     - Coffee bar & Meeting room                     |  | [Todo] [Doing] [Done]   | |
|     - Interactive furniture & hover inspection      |  |                           | |
|                                                     |  +-------------------------+ |
|                                                     |                              |
|                                                     |  +-- [Tab: Live Logs] -----+ |
|                                                     |  | [10:42] Agent1: ReAct.. | |
|                                                     |  +-------------------------+ |
+-----------------------------------------------------+------------------------------+
|  [Office Builder Toolbar: Floor | Walls | Desks | Chairs | Decor | Clear] [Save]   |
+------------------------------------------------------------------------------------+
```

---

## 8. Implementation Phases & Milestones

1. **Phase 1: Project Foundation & Schema Setup**
   - Initialize Next.js project with Tailwind CSS, Lucide icons, Prisma, and SQLite.
   - Configure database models and run initial migrations.

2. **Phase 2: Multi-Provider Adapter Core, In-Browser Auth & Tool Sandbox**
   - Implement unified LLM adapter interface supporting `openclaude-omni`, `openclaude`, `hermes`, `openroute`, `codex`, `claude`, `antigravity`, and custom providers.
   - Build Provider Settings UI & API routes to configure, test, and save credentials via SQLite.
   - Implement tool registry with file sandbox, bash execution, web fetch, and delegation.

3. **Phase 3: Agent Orchestrator & ReAct Execution Engine**
   - Build ReAct execution engine with event streaming.
   - Build task scheduler, delegation hierarchy, and meeting manager.

4. **Phase 4: Phaser 3 Virtual Office & Tycoon Editor**
   - Set up Phaser 3 canvas with custom pixel art tilesets (floors, walls, furniture, characters).
   - Implement A* pathfinding and dynamic collision mesh.
   - Build interactive office editor with real-time grid placement.

5. **Phase 5: Real-Time Bridge & UI Integration**
   - Wire Socket.io server and client state via Zustand.
   - Connect live thought/speech bubbles, agent sprite animations, and Kanban updates.

6. **Phase 6: Multi-Agent Collaboration & Meeting Rooms**
   - Implement multi-agent group meeting dynamics (agents walk to table, take turns speaking, summarize decisions).

---

## 9. Non-Functional Requirements & Security

1. **Local-First & In-Browser Credential Security:**
   - Keys and tokens for all configured providers (`openclaude-omni`, `openclaude`, `hermes`, `openroute`, `codex`, `claude`, `antigravity`, `custom`) are managed directly through the Frontend UI and stored locally in SQLite without third-party leakage.
2. **Command Sandbox Safety:**
   - Shell commands executed by agents are scoped to designated workspace folders with execution timeouts and cancellation tokens.
3. **Smooth Canvas Performance:**
   - Phaser 3 game loop optimized for 60 FPS on standard desktop browsers with sprite batching and efficient tilemap rendering.
