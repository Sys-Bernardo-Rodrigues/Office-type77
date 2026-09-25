/**
 * Importers/Callers: src/game/config.ts, Phaser scene manager, src/components/game/OfficeCanvas.tsx event bridge
 * Affected API: OfficeScene, addAgent(), moveAgent(), updateAgentState(), showAgentBubble()
 * Data Schemas: OfficeAgentEvent payloads with agentId, state/text, and grid coordinates
 * User Instruction: "vamos continuar"
 */
import Phaser from 'phaser';
import { generateOfficeTextures } from '../assets/spritesheet-generator';
import { GRID_SIZE, OFFICE_HEIGHT, OFFICE_WIDTH } from '../constants';
import { AgentSprite, type AgentAnimationState } from '../entities/AgentSprite';
import type { BubbleKind } from '../entities/ThoughtBubble';
import { AStarGrid } from '../grid/AStarPathfinder';

export const OFFICE_EVENT = {
  addAgent: 'office:add-agent',
  moveAgent: 'office:move-agent',
  stateChange: 'agent:state_change',
  thought: 'agent:thought',
  speech: 'agent:speech',
} as const;

const AGENT_STATES: ReadonlySet<AgentAnimationState> = new Set([
  'idle',
  'walking',
  'typing',
  'drinking_coffee',
  'meeting',
  'error',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isAgentId(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isCoordinate(value: unknown): value is number {
  return Number.isInteger(value);
}

function isInteriorCell(x: number, y: number): boolean {
  return x > 0 && x < OFFICE_WIDTH - 1 && y > 0 && y < OFFICE_HEIGHT - 1;
}

export class OfficeScene extends Phaser.Scene {
  private readonly navigation = new AStarGrid(OFFICE_WIDTH, OFFICE_HEIGHT);
  private readonly agents = new Map<string, AgentSprite>();

  constructor() {
    super('OfficeScene');
  }

  create(): void {
    generateOfficeTextures(this);
    this.drawOffice();
    this.addAgent('demo-agent', 3, 6);

    this.game.events.on(OFFICE_EVENT.addAgent, this.handleAddAgent, this);
    this.game.events.on(OFFICE_EVENT.moveAgent, this.handleMoveAgent, this);
    this.game.events.on(OFFICE_EVENT.stateChange, this.handleStateChange, this);
    this.game.events.on(OFFICE_EVENT.thought, this.handleThought, this);
    this.game.events.on(OFFICE_EVENT.speech, this.handleSpeech, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.removeEventListeners, this);
  }

  addAgent(agentId: string, gridX: number, gridY: number): AgentSprite {
    this.agents.get(agentId)?.destroy();
    const agent = new AgentSprite(this, agentId, gridX, gridY);
    this.agents.set(agentId, agent);
    return agent;
  }

  moveAgent(agentId: string, targetX: number, targetY: number): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;
    const start = {
      x: Math.floor(agent.x / GRID_SIZE),
      y: Math.floor(agent.y / GRID_SIZE),
    };
    agent.moveAlong(this.navigation.findPath(start, { x: targetX, y: targetY }));
  }

  updateAgentState(agentId: string, state: AgentAnimationState): void {
    this.agents.get(agentId)?.setAgentState(state);
  }

  showAgentBubble(agentId: string, text: string, kind: BubbleKind): void {
    this.agents.get(agentId)?.showBubble(text, kind);
  }

  private drawOffice(): void {
    for (let y = 0; y < OFFICE_HEIGHT; y += 1) {
      for (let x = 0; x < OFFICE_WIDTH; x += 1) {
        this.add.image(x * GRID_SIZE, y * GRID_SIZE, 'office-floor').setOrigin(0);
        const border = x === 0 || y === 0 || x === OFFICE_WIDTH - 1 || y === OFFICE_HEIGHT - 1;
        if (border) {
          this.add.image(x * GRID_SIZE, y * GRID_SIZE, 'office-wall').setOrigin(0);
          this.navigation.setWalkable(x, y, false);
        }
      }
    }

    const desks = [[6, 4], [11, 4], [6, 9], [11, 9]];
    for (const [x, y] of desks) {
      this.add.image(x * GRID_SIZE, y * GRID_SIZE, 'office-desk').setOrigin(0).setDepth(y * GRID_SIZE);
      this.navigation.setWalkable(x, y, false);
      this.navigation.setWalkable(x + 1, y, false);
    }
    this.add.image(17 * GRID_SIZE, 2 * GRID_SIZE, 'office-coffee').setOrigin(0).setDepth(3 * GRID_SIZE);
    this.navigation.setWalkable(17, 2, false);
  }

  private handleAddAgent(payload: unknown): void {
    if (!isRecord(payload) || !isAgentId(payload.agentId)
      || !isCoordinate(payload.x) || !isCoordinate(payload.y)
      || !isInteriorCell(payload.x, payload.y)
      || !this.navigation.isWalkable(payload.x, payload.y)) return;
    this.addAgent(payload.agentId, payload.x, payload.y);
  }

  private handleMoveAgent(payload: unknown): void {
    if (!isRecord(payload) || !isAgentId(payload.agentId)
      || !isCoordinate(payload.targetX) || !isCoordinate(payload.targetY)
      || !isInteriorCell(payload.targetX, payload.targetY)
      || !this.navigation.isWalkable(payload.targetX, payload.targetY)) return;
    this.moveAgent(payload.agentId, payload.targetX, payload.targetY);
  }

  private handleStateChange(payload: unknown): void {
    if (!isRecord(payload) || !isAgentId(payload.agentId)
      || typeof payload.state !== 'string'
      || !AGENT_STATES.has(payload.state as AgentAnimationState)) return;
    this.updateAgentState(payload.agentId, payload.state as AgentAnimationState);
  }

  private handleThought(payload: unknown): void {
    if (!isRecord(payload) || !isAgentId(payload.agentId) || typeof payload.text !== 'string') return;
    this.showAgentBubble(payload.agentId, payload.text, 'thought');
  }

  private handleSpeech(payload: unknown): void {
    if (!isRecord(payload) || !isAgentId(payload.agentId) || typeof payload.text !== 'string') return;
    this.showAgentBubble(payload.agentId, payload.text, 'speech');
  }

  private removeEventListeners(): void {
    this.game.events.off(OFFICE_EVENT.addAgent, this.handleAddAgent, this);
    this.game.events.off(OFFICE_EVENT.moveAgent, this.handleMoveAgent, this);
    this.game.events.off(OFFICE_EVENT.stateChange, this.handleStateChange, this);
    this.game.events.off(OFFICE_EVENT.thought, this.handleThought, this);
    this.game.events.off(OFFICE_EVENT.speech, this.handleSpeech, this);
    for (const agent of this.agents.values()) agent.destroy();
    this.agents.clear();
  }
}
