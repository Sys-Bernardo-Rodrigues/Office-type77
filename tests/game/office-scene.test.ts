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

const createdSprites: Array<{ setOrigin: ReturnType<typeof vi.fn>; setDisplaySize: ReturnType<typeof vi.fn>; setDepth: ReturnType<typeof vi.fn>; destroy: ReturnType<typeof vi.fn> }> = [];

vi.mock('phaser', () => {
  class Scene {
    game = { events: { on: vi.fn(), off: vi.fn() } };
    events = { once: vi.fn() };
    add = {
      image: vi.fn(() => {
        const sprite = {
          setOrigin: vi.fn().mockReturnThis(),
          setDisplaySize: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        };
        createdSprites.push(sprite);
        return sprite;
      }),
    };
    input = { on: vi.fn(), off: vi.fn(), keyboard: { on: vi.fn(), off: vi.fn() } };

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
  handleSetBuilderMode(payload: unknown): void;
  handleSelectBuilderItem(payload: unknown): void;
  handleRotateBuilderSelection(): void;
  handlePlaceBuilderItem(payload: unknown): void;
  handleRemoveBuilderItem(payload: unknown): void;
  handleSaveBuilderLayout(payload: unknown): void;
  handleLoadBuilderLayout(payload: unknown): void;
};

function handlers(scene: OfficeScene): EventHandlers {
  return scene as unknown as EventHandlers;
}

describe('OfficeScene event boundaries', () => {
  beforeEach(() => {
    createdAgents.splice(0);
    createdSprites.splice(0);
  });

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

describe('OfficeScene Tycoon builder wiring', () => {
  beforeEach(() => createdSprites.splice(0));

  it('ignores builder events until in build mode with a selected item', () => {
    const scene = new OfficeScene();
    const subject = handlers(scene);

    subject.handlePlaceBuilderItem({ x: 3, y: 3 });
    expect(createdSprites).toHaveLength(0);

    subject.handleSetBuilderMode({ mode: 'build' });
    subject.handlePlaceBuilderItem({ x: 3, y: 3 });
    expect(createdSprites).toHaveLength(0);
  });

  it('places, renders, and removes furniture once an item is selected', () => {
    const scene = new OfficeScene();
    const subject = handlers(scene);

    subject.handleSetBuilderMode({ mode: 'build' });
    subject.handleSelectBuilderItem({ type: 'chair' });
    subject.handlePlaceBuilderItem({ x: 3, y: 3 });

    expect(createdSprites).toHaveLength(1);
    const [id] = scene.getBuilderState().placements.map((p) => p.id);
    expect(id).toBeDefined();

    subject.handleRemoveBuilderItem({ id: id! });
    expect(createdSprites[0].destroy).toHaveBeenCalledOnce();
    expect(scene.getBuilderState().placements).toHaveLength(0);
  });

  it('rotates the current selection via the R keyboard shortcut event', () => {
    const scene = new OfficeScene();
    const subject = handlers(scene);

    subject.handleSetBuilderMode({ mode: 'build' });
    subject.handleSelectBuilderItem({ type: 'desk' });
    subject.handleRotateBuilderSelection();

    expect(scene.getBuilderState().selectedItem?.rotation).toBe(90);
  });

  it('rejects malformed builder payloads without throwing', () => {
    const scene = new OfficeScene();
    const subject = handlers(scene);

    subject.handleSetBuilderMode({ mode: 'orbit' });
    subject.handleSelectBuilderItem({ type: 42 });
    subject.handlePlaceBuilderItem({ x: 'nope', y: 3 });
    subject.handleRemoveBuilderItem({ id: '' });
    subject.handleSaveBuilderLayout({ name: '' });
    subject.handleLoadBuilderLayout({ name: 42 });

    expect(scene.getBuilderState().mode).toBe('view');
    expect(createdSprites).toHaveLength(0);
  });

  it('round-trips a saved layout through load, restoring rendered placements', () => {
    const scene = new OfficeScene();
    const subject = handlers(scene);

    subject.handleSetBuilderMode({ mode: 'build' });
    subject.handleSelectBuilderItem({ type: 'plant' });
    subject.handlePlaceBuilderItem({ x: 5, y: 5 });
    subject.handleSaveBuilderLayout({ name: 'my-layout' });

    subject.handleRemoveBuilderItem({ id: scene.getBuilderState().placements[0].id });
    expect(scene.getBuilderState().placements).toHaveLength(0);

    subject.handleLoadBuilderLayout({ name: 'my-layout' });
    expect(scene.getBuilderState().placements).toHaveLength(1);
  });

  it('detaches builder and pointer listeners on shutdown', () => {
    const scene = new OfficeScene();
    const subject = handlers(scene);

    subject.removeEventListeners();

    expect(scene.game.events.off).toHaveBeenCalledWith('builder:place', expect.any(Function), scene);
    expect(scene.input.off).toHaveBeenCalledWith('pointerdown', expect.any(Function), scene);
  });
});
