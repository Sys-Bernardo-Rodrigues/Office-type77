# Type77 Multi-Agent Pixel Office Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-featured, gamified multi-agent AI orchestration platform (`Type77 Multi-Agent Pixel Office`) merging autonomous ReAct execution and task delegation with a 2D top-down pixel art virtual office in Phaser 3 and a 100% frontend-driven Multi-Provider LLM hub.

**Architecture:** Next.js 15 (App Router) + React 19 + Tailwind CSS frontend embedding a Phaser 3 canvas with A* grid pathfinding, synchronized via Zustand and WebSocket/SSE event streams to a Node.js ReAct agent runtime. Local SQLite database managed via Prisma ORM persists provider credentials, agents, tasks, logs, and tycoon blueprints without external backend infrastructure.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Tailwind CSS, Lucide React, Phaser 3, Prisma ORM, SQLite, Zustand, Socket.io / SSE, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-24-pixel-agent-office-design.md`

## Global Constraints

- Platform: Node.js 20+, Next.js 15, React 19, Prisma with SQLite.
- Multi-Provider Engines: `openclaude-omni`, `openclaude`, `hermes`, `openroute`, `codex`, `claude`, `antigravity`, `custom` (No Ollama or Groq).
- Zero-config credentials: 100% in-browser frontend configuration stored locally in SQLite `ProviderSetting`.
- Game Viewport: Phaser 3 Canvas with Top-Down 2D Grid, A* pathfinding, dynamic speech/thought bubbles, and Tycoon furniture placement.
- Clean TypeScript compilation (`tsc --noEmit`) and zero missing types.

## Review Focus

1. Provider API key / endpoint test fails or returns invalid credentials -> System shows clear inline error badge without crashing.
2. Agent navigates to an occupied or walled tile -> Pathfinding finds closest accessible adjacent tile or falls back to idle safely.
3. Sub-task recursive delegation -> Parent task automatically updates status based on sub-task resolution state without infinite recursion loops.
4. Tycoon furniture placement overlaps -> Grid editor highlights invalid placement in red and prevents placement on occupied walkable paths.
5. High-frequency LLM token streaming for thought bubbles -> Text auto-truncates and cleans up gracefully without lagging Phaser 3 canvas loop.

---

### Task 1: Project Scaffolding & Next.js 15 + Tailwind CSS Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Create: `vitest.config.ts`
- Test: `tests/scaffold.test.ts`

**Interfaces:**
- Consumes: Node.js runtime environment.
- Produces: Runnable Next.js 15 App Router application with Vitest test harness.

- [ ] **Step 1: Write scaffold unit test**

```typescript
// tests/scaffold.test.ts
import { describe, it, expect } from 'vitest';

describe('Project Scaffolding', () => {
  it('loads environment and basic config correctly', () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails before setup**

Run: `npx vitest run tests/scaffold.test.ts`
Expected: FAIL (no vitest config or package dependencies)

- [ ] **Step 3: Create package.json and project configuration files**

Configure `package.json` with Next.js 15, React 19, Lucide React, Zustand, Prisma, Phaser, Socket.io-client, and Vitest. Configure TypeScript and Tailwind CSS.

- [ ] **Step 4: Install dependencies and run tests**

Run: `npm install && npx vitest run tests/scaffold.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json next.config.ts tailwind.config.ts postcss.config.mjs vitest.config.ts src/ tests/
git commit -m "chore: scaffold Next.js 15, Tailwind CSS, TypeScript and Vitest"
```

---

### Task 2: Prisma ORM Schema & Local SQLite Persistence

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/db/prisma.ts`
- Create: `src/lib/db/seed.ts`
- Test: `tests/db/prisma.test.ts`

**Interfaces:**
- Consumes: SQLite database connection.
- Produces: Strongly-typed Prisma client models: `ProviderSetting`, `Agent`, `OfficeLayout`, `FurnitureItem`, `Task`, `AgentLog`, `Meeting`, `MeetingMember`.

- [ ] **Step 1: Write failing Prisma schema test**

```typescript
// tests/db/prisma.test.ts
import { describe, it, expect } from 'vitest';
import { prisma } from '../../src/lib/db/prisma';

describe('Prisma Schema & SQLite Persistence', () => {
  it('can query provider settings and agents', async () => {
    const providers = await prisma.providerSetting.findMany();
    expect(Array.isArray(providers)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/db/prisma.test.ts`
Expected: FAIL (Prisma client not generated)

- [ ] **Step 3: Define schema in `prisma/schema.prisma` and generate client**

Create complete schema with tables for `ProviderSetting`, `Agent`, `OfficeLayout`, `FurnitureItem`, `Task`, `AgentLog`, `Meeting`, and `MeetingMember`. Initialize `prisma.ts` singleton and seed defaults.

- [ ] **Step 4: Run migration and test**

Run: `npx prisma migrate dev --name init && npx vitest run tests/db/prisma.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add prisma/ src/lib/db/ tests/db/
git commit -m "feat(db): configure Prisma ORM SQLite schema and seed defaults"
```

---

### Task 3: Curated Multi-Provider LLM Hub & Live Connection Testing

**Files:**
- Create: `src/lib/providers/types.ts`
- Create: `src/lib/providers/registry.ts`
- Create: `src/lib/providers/adapters/openclaude.ts`
- Create: `src/lib/providers/adapters/hermes.ts`
- Create: `src/lib/providers/adapters/openroute.ts`
- Create: `src/lib/providers/adapters/codex.ts`
- Create: `src/lib/providers/adapters/claude.ts`
- Create: `src/lib/providers/adapters/antigravity.ts`
- Create: `src/lib/providers/adapters/custom.ts`
- Create: `src/app/api/providers/route.ts`
- Create: `src/app/api/providers/test/route.ts`
- Test: `tests/providers/registry.test.ts`

**Interfaces:**
- Consumes: `ProviderSetting` database records and frontend credentials.
- Produces: Unified `LLMProviderAdapter` interface with `generateCompletion()`, `streamCompletion()`, and `testConnection()`.

- [ ] **Step 1: Write failing Multi-Provider Registry test**

```typescript
// tests/providers/registry.test.ts
import { describe, it, expect } from 'vitest';
import { getProviderAdapter, listSupportedProviders } from '../../src/lib/providers/registry';

describe('Multi-Provider Hub Registry', () => {
  it('registers all 8 required provider engines', () => {
    const list = listSupportedProviders();
    expect(list).toContain('openclaude-omni');
    expect(list).toContain('openclaude');
    expect(list).toContain('hermes');
    expect(list).toContain('openroute');
    expect(list).toContain('codex');
    expect(list).toContain('claude');
    expect(list).toContain('antigravity');
    expect(list).toContain('custom');
    expect(list).not.toContain('ollama');
    expect(list).not.toContain('groq');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/providers/registry.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement Provider Adapters and API Routes**

Implement adapter classes conforming to `LLMProviderAdapter`, unified registry dispatch, and API routes for saving and testing credentials in-browser.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/providers/registry.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/providers/ src/app/api/providers/ tests/providers/
git commit -m "feat(providers): implement curated Multi-Provider LLM adapter hub"
```

---

### Task 4: Sandboxed Tools Engine (Filesystem, Terminal, Web & Delegation)

**Files:**
- Create: `src/lib/tools/types.ts`
- Create: `src/lib/tools/registry.ts`
- Create: `src/lib/tools/filesystem.ts`
- Create: `src/lib/tools/terminal.ts`
- Create: `src/lib/tools/web.ts`
- Create: `src/lib/tools/collaboration.ts`
- Test: `tests/tools/tools.test.ts`

**Interfaces:**
- Consumes: Task parameters and agent execution requests.
- Produces: `ToolDefinition` list and `executeTool(name, params, context)` dispatcher with workspace scoping.

- [ ] **Step 1: Write failing Sandboxed Tools test**

```typescript
// tests/tools/tools.test.ts
import { describe, it, expect } from 'vitest';
import { executeTool, listAvailableTools } from '../../src/lib/tools/registry';

describe('Sandboxed Tools Engine', () => {
  it('exposes core tools including filesystem, terminal, web and delegation', () => {
    const tools = listAvailableTools();
    const names = tools.map(t => t.name);
    expect(names).toContain('read_file');
    expect(names).toContain('write_file');
    expect(names).toContain('execute_bash');
    expect(names).toContain('delegate_task');
    expect(names).toContain('call_meeting');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/tools/tools.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement Tool execution engine with path sanitization**

Implement workspace path sandboxing, safe bash execution timeouts, web fetching, and multi-agent delegation tools.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/tools/tools.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/tools/ tests/tools/
git commit -m "feat(tools): implement sandboxed filesystem, terminal, web and collaboration tools"
```

---

### Task 5: ReAct Agent Runtime, Task Delegation & Meeting Room Protocol

**Files:**
- Create: `src/lib/runtime/react-loop.ts`
- Create: `src/lib/runtime/task-manager.ts`
- Create: `src/lib/runtime/meeting-protocol.ts`
- Create: `src/app/api/agents/route.ts`
- Create: `src/app/api/tasks/route.ts`
- Create: `src/app/api/tasks/execute/route.ts`
- Create: `src/app/api/meetings/route.ts`
- Test: `tests/runtime/react-loop.test.ts`

**Interfaces:**
- Consumes: Provider adapters, sandboxed tools, and agent records.
- Produces: Autonomous execution loop (`Thought -> Action -> Observation -> Final Answer`), sub-task decomposition, and meeting consensus deliberation.

- [ ] **Step 1: Write failing ReAct loop and delegation test**

```typescript
// tests/runtime/react-loop.test.ts
import { describe, it, expect } from 'vitest';
import { parseReActOutput, executeReActStep } from '../../src/lib/runtime/react-loop';

describe('ReAct Runtime Engine', () => {
  it('correctly parses thought, action, and final answer tokens', () => {
    const sample = 'Thought: Need to read file\nAction: read_file({"path": "test.txt"})';
    const parsed = parseReActOutput(sample);
    expect(parsed.thought).toContain('Need to read file');
    expect(parsed.action?.tool).toBe('read_file');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/runtime/react-loop.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement ReAct loop, Task Scheduler & Meeting Protocol**

Implement step execution, delegation tree tracking, meeting consensus synthesis, and API routes.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/runtime/react-loop.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/runtime/ src/app/api/agents/ src/app/api/tasks/ src/app/api/meetings/ tests/runtime/
git commit -m "feat(runtime): implement ReAct loop, task delegation, and meeting consensus engine"
```

---

### Task 6: Phaser 3 Office Engine, A* Pathfinding & Sprite Animations

**Files:**
- Create: `src/game/config.ts`
- Create: `src/game/scenes/OfficeScene.ts`
- Create: `src/game/grid/AStarPathfinder.ts`
- Create: `src/game/entities/AgentSprite.ts`
- Create: `src/game/entities/ThoughtBubble.ts`
- Create: `src/game/assets/spritesheet-generator.ts`
- Create: `src/components/game/OfficeCanvas.tsx`
- Test: `tests/game/pathfinding.test.ts`

**Interfaces:**
- Consumes: Office grid matrix, agent state events.
- Produces: Interactive 2D Phaser 3 canvas with A* navmesh, sprite movement, contextual animations (`idle`, `walking`, `typing`, `drinking_coffee`, `meeting`, `error`), and live floating speech bubbles.

- [ ] **Step 1: Write failing A* Pathfinding test**

```typescript
// tests/game/pathfinding.test.ts
import { describe, it, expect } from 'vitest';
import { AStarGrid } from '../../src/game/grid/AStarPathfinder';

describe('A* Grid Pathfinding', () => {
  it('calculates optimal path avoiding obstacles', () => {
    const grid = new AStarGrid(10, 10);
    grid.setWalkable(2, 2, false); // Obstacle
    const path = grid.findPath({ x: 0, y: 2 }, { x: 4, y: 2 });
    expect(path.length).toBeGreaterThan(0);
    expect(path.some(p => p.x === 2 && p.y === 2)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/game/pathfinding.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement A* pathfinder, Phaser Office Scene, Agent Sprites & Speech Bubbles**

Build procedural pixel art spritesheet generator for zero external asset dependencies, A* navmesh, dynamic bubble rendering, and React `OfficeCanvas` component with dynamic import (`ssr: false`).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/game/pathfinding.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/game/ src/components/game/ tests/game/
git commit -m "feat(game): implement Phaser 3 office scene, A* pathfinding, and speech bubbles"
```

---

### Task 7: Office Tycoon Builder Mode (Grid Editor & Furniture Catalog)

**Files:**
- Create: `src/game/builder/TycoonBuilder.ts`
- Create: `src/game/builder/furnitureCatalog.ts`
- Create: `src/components/game/TycoonCatalogModal.tsx`
- Create: `src/app/api/office/layout/route.ts`
- Test: `tests/game/tycoon.test.ts`

**Interfaces:**
- Consumes: Tilemap grid and user placement/rotation events.
- Produces: Real-time furniture placement, collision navmesh update, desk assignment to agents, and blueprint saving to SQLite.

- [ ] **Step 1: Write failing Tycoon grid editor test**

```typescript
// tests/game/tycoon.test.ts
import { describe, it, expect } from 'vitest';
import { canPlaceFurniture, rotateItem } from '../../src/game/builder/furnitureCatalog';

describe('Office Tycoon Builder', () => {
  it('validates bounds and handles rotation properly', () => {
    const item = { type: 'desk', width: 2, height: 1, rotation: 0 };
    const rotated = rotateItem(item);
    expect(rotated.width).toBe(1);
    expect(rotated.height).toBe(2);
    expect(rotated.rotation).toBe(90);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/game/tycoon.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement Tycoon mode, Catalog UI, Rotation & Blueprint persistence API**

Build placement preview cursor, rotation via `R` key, collision mask synchronization with A* pathfinder, and layout save/load endpoints.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/game/tycoon.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/game/builder/ src/components/game/TycoonCatalogModal.tsx src/app/api/office/ tests/game/
git commit -m "feat(tycoon): implement Office Tycoon grid builder and furniture catalog"
```

---

### Task 8: React HUD, Kanban Board, Agent Hiring & In-Browser Settings

**Files:**
- Create: `src/store/useOfficeStore.ts`
- Create: `src/components/layout/HeaderNav.tsx`
- Create: `src/components/modals/HireAgentModal.tsx`
- Create: `src/components/modals/ProviderSettingsModal.tsx`
- Create: `src/components/modals/MeetingModal.tsx`
- Create: `src/components/kanban/KanbanBoard.tsx`
- Create: `src/components/logs/AgentLogDrawer.tsx`
- Create: `src/app/page.tsx`
- Test: `tests/ui/store.test.ts`

**Interfaces:**
- Consumes: Zustand store, Prisma API routes, Phaser event emitters.
- Produces: Complete, responsive desktop UI dashboard with top navigation, modal dialogs, Kanban board, and live log terminal.

- [ ] **Step 1: Write failing Zustand store test**

```typescript
// tests/ui/store.test.ts
import { describe, it, expect } from 'vitest';
import { useOfficeStore } from '../../src/store/useOfficeStore';

describe('Office Zustand Store', () => {
  it('manages active mode and selected agent state', () => {
    useOfficeStore.getState().setBuilderMode(true);
    expect(useOfficeStore.getState().isBuilderMode).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ui/store.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement Zustand store and complete React HUD components**

Implement `useOfficeStore`, `HeaderNav`, `HireAgentModal`, `ProviderSettingsModal` (with live API key test connection), `MeetingModal`, `KanbanBoard`, `AgentLogDrawer`, and assemble everything in `src/app/page.tsx`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/ui/store.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/store/ src/components/ src/app/page.tsx tests/ui/
git commit -m "feat(ui): implement React HUD, Kanban board, Agent Hiring and Provider Settings UI"
```

---

### Task 9: End-to-End Integration, Sound FX & Production Build Validation

**Files:**
- Create: `src/game/audio/soundEffects.ts`
- Modify: `src/components/game/OfficeCanvas.tsx`
- Create: `tests/e2e/workflow.test.ts`

**Interfaces:**
- Consumes: Full stack components (Phaser 3, React 19, Prisma SQLite, ReAct Runtime, Multi-Provider Hub).
- Produces: Verified production build (`npm run build`), retro 8-bit sound synthesizers (using Web Audio API for zero external audio files), and end-to-end integration tests.

- [ ] **Step 1: Write failing End-to-End workflow test**

```typescript
// tests/e2e/workflow.test.ts
import { describe, it, expect } from 'vitest';
import { listSupportedProviders } from '../../src/lib/providers/registry';
import { listAvailableTools } from '../../src/lib/tools/registry';

describe('End-to-End Platform Integration', () => {
  it('integrates providers and tools seamlessly', () => {
    expect(listSupportedProviders().length).toBeGreaterThan(0);
    expect(listAvailableTools().length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/e2e/workflow.test.ts`
Expected: FAIL (sound synthesis not implemented yet)

- [ ] **Step 3: Implement 8-bit Web Audio synthesizers and build checks**

Implement Web Audio API synthesizer for retro typing, coffee, meeting, and alert sounds. Run TypeScript check and production Next.js build.

- [ ] **Step 4: Run all test suites and build check**

Run: `npm run test && npm run build`
Expected: PASS with 0 type errors.

- [ ] **Step 5: Commit**

```bash
git add src/game/audio/ tests/e2e/
git commit -m "feat(audio): add retro 8-bit Web Audio synthesizer and validate production build"
```
