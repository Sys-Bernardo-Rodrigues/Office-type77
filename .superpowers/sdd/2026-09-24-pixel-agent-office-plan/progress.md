# SDD ledger — plan: docs/superpowers/plans/2026-09-24-pixel-agent-office-plan.md

## Pre-flight scan
- Task 1 -> Task 2: Scaffold provides Node.js / TypeScript environment for Prisma.
- Task 2 -> Task 3: Prisma schema (`ProviderSetting`) feeds Multi-Provider Registry.
- Task 3 -> Task 4 & 5: Multi-Provider adapters consumed by ReAct agent runtime.
- Task 4 -> Task 5: Sandboxed tools consumed by ReAct loop execution.
- Task 5 -> Task 6: ReAct runtime events stream into Phaser 3 scene and speech bubbles.
- Task 6 -> Task 7: Phaser scene grid and collision map shared with Tycoon Builder.
- Task 7 -> Task 8: Tycoon catalog and builder state bridged to React HUD via Zustand.
- Task 8 -> Task 9: All UI and game elements validated under end-to-end suite and build.
Pre-flight status: Clean, all interfaces strongly aligned.

## Progress
- Task 1: complete (Scaffolding Next.js 15, Tailwind, TS, Vitest -> 1/1 pass)
- Task 2: complete (Prisma ORM SQLite schema & client -> 3/3 pass)
- Task 3: complete (Multi-Provider Hub Registry & API -> 3/3 pass, build green).
  Note: types.ts + adapters/ were implemented on disk during the same session
  but never `git add`-ed, so registry.ts referenced files absent from history
  since commit ea33aad. Fixed in commit a32ced8 (2026-09-25).
- Task 4: complete (Sandboxed filesystem/terminal/web/delegation tools -> tests pass).
  Implemented same session as Task 3/5 but likewise left uncommitted; committed
  in 57ebb83 (2026-09-25) together with the ESLint flat-config migration
  (`next lint` is deprecated on Next 15) needed to keep `npm run lint` working.
- Task 5: complete (ReAct loop, meeting protocol, /api/agents, /api/tasks,
  /api/tasks/execute, /api/meetings -> tests pass). Same uncommitted-files
  situation as Task 3/4; committed in 7531300 (2026-09-25).
  Note: an earlier, narrower pass at this task also landed as commit 1b20192
  (src/lib/agent/react-runtime.ts + src/lib/runtime/task-manager.ts) — both
  implementations currently coexist; task-manager.ts is reused by
  src/app/api/tasks/route.ts for subtask creation.
- Task 6: complete (commits 5269ae4, Phaser 3 office scene A* pathfinding speech bubbles -> 79/79 pass, build green; tests: npm test -- game → 18/18 pass)
- Task 7: complete (2026-09-25).
  - TycoonBuilder + furnitureCatalog + tests/game/tycoon.test.ts: commit f04118e (prior session).
  - Wired TycoonBuilder into OfficeScene via builder:* game events (set-mode,
    select-item, rotate, place, remove, save, load), pointer placement, 'R'
    rotate shortcut, per-type furniture textures (chair/plant/whiteboard/sofa
    added to spritesheet-generator.ts): commit e0bf17c.
  - GET/POST /api/office/layout (upsert OfficeLayout + replace FurnitureItem
    rows) and presentational TycoonCatalogModal.tsx: commit 5a679f9.
  - Full suite: 104/104 pass, `npx tsc --noEmit` clean, `npm run build` green.

## MCP Server (User Addition - Before Task 6, extended 2026-09-25)
- Created Type77MCPServer class exposing provider hub as MCP tools
- 4 core tools: list_providers, get_provider_settings, update_provider, + 8 per-provider test_*_connection tools
- Full Prisma integration for state sync
- Tests: 4/4 pass, build green
- Commit: 0a74a87 (feat(mcp): add Type77 MCP server for provider hub exposure)
- 2026-09-25: the class had no real MCP transport — it was only reachable as
  an in-repo TS class, not attachable to another AI as the original request
  intended ("crie um mcp que vai ser sempre mantido atualizado para podermos
  usar em outra ia se necessario"). Added `src/lib/mcp/stdio-server.ts`
  wiring it to `@modelcontextprotocol/sdk`'s `Server` + `StdioServerTransport`
  (list_tools/call_tool handlers delegate 1:1 to Type77MCPServer), `npm run
  mcp` script, root `.mcp.json` for Claude Code/Desktop auto-discovery, and
  `tests/mcp/stdio-server.test.ts` (spawns the real process, verifies the
  `initialize` -> `tools/list` handshake). Documented in README under a new
  "Servidor MCP" section. Manually smoke-tested end-to-end.

## Next up
- Task 8: React HUD, Kanban board, Agent hiring, Provider settings UI,
  `useOfficeStore` (Zustand) wiring OfficeCanvas <-> TycoonCatalogModal <->
  the office/agents/tasks/meetings API routes.
- Task 9: end-to-end integration, sound FX, production build validation.
## Task 8
- Task 8: Ruling: added `src/app/api/logs/route.ts` (+ `tests/runtime/logs-route.test.ts`) —
  no existing route exposed AgentLog rows, and AgentLogDrawer's "live log terminal" needs one.
  Cost if wrong: an unused route, easy to delete.
- Task 8: Ruling: extracted `OFFICE_EVENT`/`BUILDER_EVENT` out of `OfficeScene.ts` into a new
  `src/game/events.ts` (re-exported from OfficeScene.ts for compatibility) so `page.tsx` can
  emit builder events without importing the phaser-dependent OfficeScene module at build time
  (breaks SSR otherwise). Cost if wrong: one file to merge back.
- Task 8: Ruling: added `onReady` callback prop to `OfficeCanvas.tsx` so the HUD can obtain the
  live `Phaser.Game` instance (needed to wire TycoonCatalogModal and office/layout persistence).
  Cost if wrong: prop is additive/optional, trivially revertable.
- Task 8: Ruling: changed `TycoonCatalogModal.tsx`'s wrapper from a full-viewport blocking
  backdrop (`fixed inset-0 bg-black/60`) to a docked non-blocking side panel. Found via the
  in-browser testing this task's own instructions required: the original backdrop intercepted
  every pointer event across the whole page, including over the Phaser canvas, making it
  impossible to click a grid cell to place furniture while the catalog was open. Cost if wrong:
  a CSS-only revert.
- Task 8: complete (commits e46c030..c36a630, tests: npx vitest run tests/ui/store.test.ts →
  1/1 pass; full suite: npx vitest run → 108/108 pass; npx tsc --noEmit clean; npm run build
  green; manually verified in-browser: hire agent, create/run-ready task, meeting modal, builder
  mode + furniture placement + save/load round-trip via GET/POST /api/office/layout, provider
  connection test).

## Task 8 — final review fix pass
Fresh-context reviewer (Opus, general-purpose subagent) reviewed e46c030..c36a630. No Critical
findings; 8 Important, 8 Minor. Fixed the following, each with a failing test first:
- Final: fixed mutation actions (hireAgent, createTask, createMeeting, saveProviderSetting)
  swallowing failures instead of recording them in store.error, and background fetch* actions
  wiping error:null on every poll (masking a just-set error within ~4s of AgentLogDrawer
  polling) — tests/ui/store-error-handling.test.ts RED→GREEN, suite 115/115.
- Final: fixed "Testar conexão" always testing the DB-saved provider settings instead of the
  apiKey/baseUrl/model the user had just typed but not yet saved — extracted
  `resolveProviderTestConfig` to src/lib/providers/resolveTestConfig.ts (had to live outside
  route.ts: a Next.js route module may only export HTTP handlers, tsc failed otherwise),
  threaded overrides through useOfficeStore.testProviderConnection and
  ProviderSettingsModal.handleTest — tests/providers/test-config.test.ts RED→GREEN, suite
  115/115.
- Final: fixed a provider that had never been saved defaulting its "Ativo" checkbox to false,
  so clicking Salvar persisted isActive:false and overrode the API route's own create default
  of true — the provider could never run a task even right after the user added a key.
  draftFrom now defaults isActive:true when provider.apiKey is null (never saved) —
  tests/ui/provider-settings-draft.test.ts RED→GREEN, suite 117/117.
- Final: fixed page.tsx's Tycoon "Carregar" merging loaded furniture onto whatever was already
  placed (silently dropping colliding pieces) instead of replacing it, and leaving the
  selected-item/rotation state out of step with the scene afterward. Extracted the scene
  mutation into a scene-agnostic src/game/builder/layoutSync.ts
  (placementsToFurniture/applyFurnitureToScene, unit tested against a fake scene) —
  tests/game/layout-sync.test.ts RED→GREEN, suite 121/121.
- Final: fixed "Salvar"/"Carregar" giving no success/failure feedback (same layoutSync.ts
  change; page.tsx now checks response.ok and shows a status line in the catalog panel).
- Final: fixed a pre-existing Task 7 bug in `TycoonBuilder.getGridState()`, found while
  browser-verifying the layoutSync.ts replace-not-merge fix above: after replacing a layout
  twice in the same session, the second load reported "0 placed, 1 skipped" and the piece
  vanished entirely. Root cause: `getGridState()` rebuilt its "occupied" base grid from
  `this.grid.getGrid()` — the shared AStarGrid's *current*, already-mutated walkability — rather
  than a pristine static snapshot, so `recomputeWalkability()` could only ever shrink the
  walkable set (mark more cells blocked for new placements) and never restore a cell to
  walkable once *any* furniture had ever occupied it, even after that furniture was removed.
  Fixed by lazily snapshotting `this.grid.getGrid()` once, on first use of getGridState()
  (safe: builder methods are only reachable via builder:* event listeners registered at the end
  of OfficeScene.create(), after drawOffice() has already marked walls/desks unwalkable) —
  tests/game/tycoon.test.ts RED→GREEN (new case: "allows placing at a cell again after the item
  that occupied it is removed"), suite 120/120. This was pre-existing, latent, and unexercised
  by Task 7's own tests (which only check getPlacements().length after removeItem, never
  re-place at the same cell); it directly blocked issue #4's replace-not-merge fix from working
  correctly, so I fixed it in-scope rather than deferring it. Re-verified in-browser afterward:
  clicking Carregar twice in the same session now correctly reloads the same single chair both
  times (previously the second click made it vanish).
- Final: Ruling: attempted, then reverted, an auto-load of the saved layout on page mount
  (review finding #6 — the saved office layout never reloads after a refresh). First attempt
  had handleGameReady attach `scene.events.once('create', ...)` right after `new Phaser.Game()`;
  verified in-browser via Chrome network-request tracking that GET /api/office/layout never
  fired. Root cause: `game.scene.getScene('OfficeScene')` returns undefined immediately after
  construction — Phaser's SceneManager doesn't register the scene until later in its async boot
  sequence (Game.boot() itself waits for DOMContentLoaded before even starting), so the `?.`
  optional-chain silently no-ops. A reliable fix needs a real hook into that boot sequence
  (Phaser.Core.Events.READY at the game level, then a scene-existence check, with a fallback for
  the case where create() already ran by the time the listener attaches) — verified the pieces
  exist in node_modules/phaser/dist/phaser.js but ran out of fix-pass budget to build and verify
  a reliable version. Reverted handleGameReady to just storing the game ref (its pre-review-fix
  behavior); "Carregar" still works fully (manually verified in-browser: save persists, reload
  page, click Modo Construção → Carregar → furniture reappears correctly, replacing rather than
  merging per the layoutSync.ts fix above). Cost if wrong: the saved office is invisible until
  the user manually opens the builder and clicks Carregar — a real but scoped gap, not a
  regression (this was already the pre-review-fix behavior for the whole session up to now).
  Deferred to Task 9 alongside the agent-spawn ruling below.
- Final: fixed KanbanBoard's "Executar" button defaulting the workspacePath prompt to '.',
  which resolves to the server's own working directory (this app's source tree) — an agent's
  filesystem/terminal tools would then run inside the orchestrator itself. Default changed to
  an empty string, which the existing `if (!workspacePath) return;` guard already treats as
  cancelled.
- Final: Ruling: hired agents never appear in the Phaser office (no code sends
  OFFICE_EVENT.addAgent for fetched/hired agents; only the hard-coded demo-agent renders) —
  reviewer graded this Important (spec §6/§1 name it as the product's core promise) but it
  requires desk-assignment/spawn-position logic beyond this task's "HUD assembly" scope, and
  the reviewer itself offered deferral to Task 9 as an acceptable alternative. Task 9's own
  brief is "End-to-End Integration, Sound FX & Production Build Validation" — a better-scoped
  home for wiring live agent state onto the canvas than a further HUD-task patch. Cost if
  wrong: Task 9 needs to budget for this; the gap is visible (only the demo agent renders) so
  it won't be silently missed.
- Deferred minors (not fixed, no ruling needed — see reviewer's Minor section for detail):
  rotation-display drift when 'R' is pressed directly on the canvas; typed API key not cleared
  from the field after save (now fixed as a 2-line addition alongside the isActive fix, folded
  into that commit); customHeaders returned unmasked from GET /api/providers (pre-existing,
  outside this diff); runTask's finally-block re-fetch racing the log drawer's own poll; the
  docked catalog panel covering part of the canvas at narrow widths; store.test.ts's shallow
  coverage matching the plan's own minimal Step 1 test exactly.
- Final: full suite after all fixes (including the TycoonBuilder walkability fix above): npx
  vitest run → 120/120 pass (24 files); npx tsc --noEmit clean; npm run build green (Next
  regenerated .next/types/.../providers/test/route.ts cleanly after resolveProviderTestConfig
  moved out of the route file). Manually re-verified in-browser: hire agent (with the
  isActive:true-by-default provider now runnable), create task, "Testar conexão" now exercises
  the real network path with draft overrides (confirmed via a genuine HTTP 404 from the live
  endpoint), builder mode + place furniture + Salvar/Carregar shows a status line and correctly
  replaces (not merges) on repeated loads.
