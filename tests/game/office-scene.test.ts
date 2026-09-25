/**
 * Importers/Callers: Vitest
 * Affected API: OfficeScene event handlers and shutdown lifecycle
 * Data Schemas: office add/move/state/bubble event payloads
 * User Instruction: "vamos continuar"
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const createdAgents: Array<{
  agentId: string;
  x: number;
  y: number;
  destroy: ReturnType<typeof vi.fn>;
  moveAlong: ReturnType<typeof vi.fn>;
  setAgentState: ReturnType<typeof vi.fn>;
  showBubble: ReturnType<typeof vi.fn>;
}> = [];

vi.mock('phaser', () => {
  class Scene {
    game = { events: { on: vi.fn(), off: vi.fn() } };
    events = { once: vi.fn() };
    add = {};

    constructor(key: string) {
      void key;
    }
  }

  return {
    default: {
      Scene,
      Scenes: { Events: { SHUTDOWN: 'shutdown' } },
    },
  };
});

vi.mock('../../src/game/assets/spritesheet-generator', () => ({
  generateOfficeTextures: vi.fn(),
}));

vi.mock('../../src/game/entities/AgentSprite', () => ({
  AgentSprite: class {
    agentId: string;
    x: number;
    y: number;
    destroy = vi.fn();
    moveAlong = vi.fn();
    setAgentState = vi.fn();
    showBubble = vi.fn();

    constructor(_scene: unknown, agentId: string, gridX: number, gridY: number) {
      this.agentId = agentId;
      this.x = gridX * 32 + 16;
      this.y = gridY * 32 + 16;
      createdAgents.push(this);
    }
  },
}));

import { OfficeScene } from '../../src/game/scenes/OfficeScene';

type EventHandlers = {
  handleAddAgent(payload: unknown): void;
  handleMoveAgent(payload: unknown): void;
  handleStateChange(payload: unknown): void;
  handleThought(payload: unknown): void;
  removeEventListeners(): void;
};

function handlers(scene: OfficeScene): EventHandlers {
  return scene as unknown as EventHandlers;
}

describe('OfficeScene event boundaries', () => {
  beforeEach(() => createdAgents.splice(0));

  it('rejects malformed add and movement payloads', () => {
    const scene = new OfficeScene();
    const subject = handlers(scene);

    subject.handleAddAgent({ agentId: '', x: 2, y: 2 });
    subject.handleAddAgent({ agentId: 'bad', x: 2.5, y: 2 });
    subject.handleAddAgent({ agentId: 'wall', x: 0, y: 2 });
    expect(createdAgents).toHaveLength(0);

    subject.handleAddAgent({ agentId: 'agent-1', x: 2, y: 2 });
    subject.handleMoveAgent({ agentId: 'agent-1', targetX: Number.NaN, targetY: 3 });
    subject.handleMoveAgent({ agentId: 'agent-1', targetX: 0, targetY: 3 });

    expect(createdAgents).toHaveLength(1);
    expect(createdAgents[0].moveAlong).not.toHaveBeenCalled();
  });

  it('rejects invalid state and bubble payloads', () => {
    const scene = new OfficeScene();
    const subject = handlers(scene);
    subject.handleAddAgent({ agentId: 'agent-1', x: 2, y: 2 });

    subject.handleStateChange({ agentId: 'agent-1', state: 'teleporting' });
    subject.handleThought({ agentId: 'agent-1', text: 42 });

    expect(createdAgents[0].setAgentState).not.toHaveBeenCalled();
    expect(createdAgents[0].showBubble).not.toHaveBeenCalled();
  });

  it('destroys and forgets every agent during shutdown', () => {
    const scene = new OfficeScene();
    const subject = handlers(scene);
    subject.handleAddAgent({ agentId: 'agent-1', x: 2, y: 2 });
    subject.removeEventListeners();
    subject.handleStateChange({ agentId: 'agent-1', state: 'typing' });

    expect(createdAgents[0].destroy).toHaveBeenCalledOnce();
    expect(createdAgents[0].setAgentState).not.toHaveBeenCalled();
  });
});
