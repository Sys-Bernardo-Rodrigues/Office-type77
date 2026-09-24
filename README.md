# 🏢 Type77 Multi-Agent Pixel Office

<div align="center">

![Type77 Multi-Agent Pixel Office](https://img.shields.io/badge/Type77-Pixel_Office-ff6b6b?style=for-the-badge&logo=electron&logoColor=white)
![Next.js 15](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React 19](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Phaser 3](https://img.shields.io/badge/Phaser_3-8B0000?style=for-the-badge&logo=gamedeveloper&logoColor=white)
![Prisma ORM](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)

**A gamified, multi-agent AI orchestration platform merging 2D top-down pixel art virtual offices with autonomous ReAct execution, hierarchical delegation, and an extensible Multi-Provider LLM Hub.**

[Features](#-key-features) • [Architecture](#-system-architecture) • [Multi-Provider Hub](#-curated-multi-provider-llm-hub) • [Office Tycoon](#-office-tycoon--simulation-engine) • [Quickstart](#-getting-started) • [Roadmap](#-roadmap)

---

</div>

## 🌟 Overview & Inspirations

**Type77 Multi-Agent Pixel Office** merges the deep autonomous agent delegation and team management workflows of **AgentFleet** with the nostalgic, interactive spatial simulation of **pixel-agents**.

Instead of viewing agent outputs as plain terminal text streams, your AI employees come to life inside an interactive 2D pixel art office:
- 🧑💻 **Hire & Configure Agents:** Define roles, custom system prompts, temperatures, and model engines.
- 🏢 **Office Tycoon / Builder Mode:** Design and expand your virtual office in real-time with desks, coffee machines, water coolers, meeting rooms, and decorative furniture.
- 🚶 **Dynamic Spatial Simulation:** Agents physically walk using A* pathfinding to their assigned desks, sit down to write code, walk to coffee machines on break, and gather in conference rooms for group meetings.
- 💬 **Live Speech & Thought Bubbles:** Watch real-time reasoning (`thought`), terminal actions (`action`), and inter-agent dialogues (`speech`) rendered above pixel avatars and in dedicated logs.
- 🔑 **100% Frontend-Driven Configuration:** Zero complicated `.env` setups for end users. Manage all provider API keys, custom base URLs, tokens, and model mappings directly from the in-app settings HUD.

---

## 🚀 Key Features

### 1. 🎮 2D Pixel Art Virtual Office Simulation
- **Phaser 3 Powered Grid:** Top-down orthographic/isometric pixel art viewport with smooth camera panning, zoom controls, and layered rendering (Floors, Walls, Furniture, Characters, Dynamic FX).
- **A\* Pathfinding & Real-time Collision:** Dynamic navmesh recalculation whenever furniture is placed, rotated, or relocated.
- **Agent State Animations:** Character sprites with contextual animation states: `idle`, `walking`, `typing` (working at desk), `drinking_coffee`, `meeting`, and `error`.
- **Live Spatial Speech & Thought Bubbles:** Floating comic-style thought clouds and speech balloons over agents in real-time as LLM tokens stream.

### 2. 🏗️ Real-Time Office Tycoon Mode (Grid Builder)
- **Interactive Drag-and-Drop / Click Placement:** Place walls, hardwood/carpet floors, single & executive desks, ergonomic chairs, conference tables, coffee machines, water coolers, and plants.
- **Rotation & Customization:** Rotate furniture (`R` key), inspect tile properties, and assign specific desks to individual agents.
- **Persistent Layouts:** Save and load custom office blueprints to local SQLite.

### 3. 🤖 Autonomous ReAct Multi-Agent Engine
- **Event-Driven Execution Loop:** Agents operate on an autonomous `Thought -> Action -> Observation -> Final Answer` cycle.
- **Hierarchical Task Delegation:** Manager agents (e.g. Lead Architect) can decompose tasks and delegate sub-tasks to subordinate agents (e.g. Frontend Dev, QA Engineer, Copywriter).
- **Conference Room Consensus Protocol:** Trigger multi-agent group meetings where agents debate, deliberate, and formulate action plans with shared blackboard memory.
- **Interactive Kanban Board:** Real-time tracking of tasks across `Backlog`, `In Progress`, `Review`, and `Completed`.

### 4. 🧰 Sandboxed Local & Web Tooling
- 📁 **Filesystem Operations:** `read_file`, `write_file`, `list_directory`, `search_files` (scoped to workspace).
- 💻 **Terminal Execution:** Scoped shell commands with stdout/stderr capture.
- 🌐 **Web Tools:** Real-time search and web page fetching.
- 👥 **Agent Collaboration Tools:** `delegate_task`, `call_meeting`, `request_agent_review`, `broadcast_office_message`.

---

## ⚡ Curated Multi-Provider LLM Hub

Type77 Pixel Office features a provider-agnostic adapter layer with **100% in-browser configuration and connection testing**. No restarts or terminal edits required.

| Provider Engine | Description & Best Use Case | Auth / Config via UI |
| :--- | :--- | :---: |
| `openclaude-omni` | Full multimodal reasoning, large context windows & comprehensive planning | API Key / Custom URL |
| `openclaude` | High-throughput code synthesis, bash execution & tool calling | API Key / Custom URL |
| `hermes` | Function calling, tool dispatch & specialized reasoning loops | API Key / Base URL |
| `openroute` | Aggregated multi-model gateway & fallback routing | OpenRouter API Key |
| `codex` | Scripting, refactoring, and code analysis specialist | API Key / Base URL |
| `claude` | Direct Anthropic Claude 3.5 / 3.7 Sonnet & Opus integration | Anthropic API Key |
| `antigravity` | Google DeepMind advanced agentic coding engine endpoints | Auth Token / Custom URL |
| `custom` | Any OpenAI or Anthropic compatible self-hosted proxy or endpoint | Endpoint + Headers |

---

## 📐 System Architecture

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

---

## 🛠️ Tech Stack

- **Frontend & App Framework:** [Next.js 15](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/)
- **Game Engine & Rendering:** [Phaser 3](https://phaser.io/) (WebGL / Canvas) with custom pixel art spritesheets & tilemaps
- **State Management & UI Bridge:** [Zustand](https://github.com/pmndrs/zustand)
- **Real-Time Communication:** [Socket.io](https://socket.io/) (WebSockets)
- **ORM & Database:** [Prisma ORM](https://www.prisma.io/) with [SQLite](https://www.sqlite.org/) (Zero-setup local persistence)
- **Language & Tooling:** [TypeScript 5](https://www.typescriptlang.org/), Node.js 20+

---

## 📦 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or higher
- **npm** or **pnpm** or **yarn**
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/Gitlawb/Office-type77.git
cd Office-type77
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Initialize the Database
```bash
npx prisma migrate dev --name init
```

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Configure Your LLM Providers
1. Click the **⚙️ Settings** icon in the top-right header.
2. Select your desired engine (`openclaude-omni`, `openclaude`, `hermes`, `openroute`, `codex`, `claude`, `antigravity`, etc.).
3. Enter your API Key or custom endpoint URL and click **Test Connection**.
4. Save settings and start hiring agents!

---

## 🎮 Office Tycoon & Controls

| Action | Control / Keybinding |
| :--- | :--- |
| **Pan Camera** | Click + Drag on Canvas / Arrow Keys / WASD |
| **Zoom In / Out** | Mouse Scroll Wheel / `+` & `-` keys |
| **Toggle Tycoon Builder** | Click **"🏗️ Build Office"** in HUD |
| **Rotate Selected Furniture** | Press `R` |
| **Delete / Remove Object** | Select item and press `Delete` or `Backspace` |
| **Select Agent / View HUD** | Left-click on any pixel avatar in the office |
| **Call Emergency Meeting** | Click **"📢 Call Meeting"** in Meeting Room |

---

## 🗄️ Database Schema Summary

The local SQLite schema managed by Prisma includes:
- `ProviderSetting`: Secure local storage of API keys, base URLs, custom headers, and model aliases.
- `Agent`: Agent profile, assigned desk, avatar sprite, provider engine, model name, and status.
- `OfficeLayout` & `FurnitureItem`: Grid dimensions, tile matrices, furniture coordinates, rotation, and interaction spots.
- `Task`: Kanban task status, priority, assignee, delegation hierarchies (`parentId` / `subTasks`).
- `AgentLog`: Granular execution traces (`thought`, `action`, `observation`, `speech`, `error`).
- `Meeting` & `MeetingMember`: Conference rooms, participants, and synthesized deliberation transcripts.

---

## 🗺️ Roadmap

- [x] Comprehensive Architecture & Multi-Agent Specification
- [ ] Next.js 15 & Phaser 3 Game Engine Integration
- [ ] In-Browser Provider Auth & Settings Hub
- [ ] Real-time A* Pathfinding & Collision Grid Engine
- [ ] Office Tycoon Builder Mode with Custom Furniture Catalog
- [ ] ReAct Agent Runtime with Hierarchical Delegation & Sub-tasks
- [ ] Interactive Meeting Room & Shared Blackboard Protocol
- [ ] Audio FX (retro 8-bit sound effects for typing, coffee, and alerts)

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<div align="center">
Built with ❤️ by the Type77 Community.
</div>
