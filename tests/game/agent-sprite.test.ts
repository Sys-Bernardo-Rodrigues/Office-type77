/**
 * Importers/Callers: Vitest
 * Affected API: AgentSprite.moveAlong(), setAgentState(), destroy()
 * Data Schemas: GridPosition[] movement paths and AgentAnimationState
 * User Instruction: "vamos continuar"
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const chain = vi.fn();
const bubbleDestroy = vi.fn();

vi.mock('phaser', () => {
  class Container {
    scene: any;
    x: number;
    y: number;

    constructor(scene: any, x: number, y: number) {
      this.scene = scene;
      this.x = x;
      this.y = y;
    }

    add(): this { return this; }
    setDepth(): this { return this; }
    destroy(): void {}
  }

  return {
    default: {
      GameObjects: { Container },
    },
  };
});

vi.mock('../../src/game/entities/ThoughtBubble', () => ({
  ThoughtBubble: class {
    destroy = bubbleDestroy;
    show(): void {}
  },
}));

import { AgentSprite } from '../../src/game/entities/AgentSprite';

function createScene() {
  const sprite = {
    clearTint: vi.fn().mockReturnThis(),
    setTint: vi.fn().mockReturnThis(),
    setOrigin: vi.fn().mockReturnThis(),
    setTexture: vi.fn().mockReturnThis(),
    play: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
  };

  return {
    add: {
      sprite: vi.fn(() => sprite),
      existing: vi.fn(),
    },
    tweens: { chain },
    sprite,
  };
}

describe('AgentSprite movement lifecycle', () => {
  beforeEach(() => {
    chain.mockReset();
    bubbleDestroy.mockReset();
  });

  it('stops the previous route before starting a replacement route', () => {
    const first = { stop: vi.fn() };
    const second = { stop: vi.fn() };
    chain.mockReturnValueOnce(first).mockReturnValueOnce(second);
    const scene = createScene();
    const agent = new AgentSprite(scene as never, 'agent-1', 1, 1);

    agent.moveAlong([{ x: 1, y: 1 }, { x: 2, y: 1 }]);
    agent.moveAlong([{ x: 2, y: 1 }, { x: 3, y: 1 }]);

    expect(first.stop).toHaveBeenCalledOnce();
    expect(second.stop).not.toHaveBeenCalled();
  });

  it('does not let an obsolete route completion overwrite a newer state', () => {
    const movement = { stop: vi.fn() };
    chain.mockReturnValue(movement);
    const scene = createScene();
    const agent = new AgentSprite(scene as never, 'agent-1', 1, 1);

    agent.moveAlong([{ x: 1, y: 1 }, { x: 2, y: 1 }]);
    const completion = chain.mock.calls[0][0].onComplete as () => void;
    agent.setAgentState('typing');
    completion();

    expect(movement.stop).toHaveBeenCalledOnce();
    expect(agent.getAgentState()).toBe('typing');
  });

  it('plays the animation for each contextual state', () => {
    const scene = createScene();
    const agent = new AgentSprite(scene as never, 'agent-1', 1, 1);

    agent.setAgentState('typing');
    agent.setAgentState('meeting');
    agent.setAgentState('drinking_coffee');
    agent.setAgentState('error');

    expect(scene.sprite.play).toHaveBeenNthCalledWith(1, 'office-agent-typing', true);
    expect(scene.sprite.play).toHaveBeenNthCalledWith(2, 'office-agent-meeting', true);
    expect(scene.sprite.play).toHaveBeenNthCalledWith(3, 'office-agent-drinking_coffee', true);
    expect(scene.sprite.play).toHaveBeenNthCalledWith(4, 'office-agent-error', true);
  });

  it('stops active movement when destroyed', () => {
    const movement = { stop: vi.fn() };
    chain.mockReturnValue(movement);
    const scene = createScene();
    const agent = new AgentSprite(scene as never, 'agent-1', 1, 1);

    agent.moveAlong([{ x: 1, y: 1 }, { x: 2, y: 1 }]);
    agent.destroy();

    expect(movement.stop).toHaveBeenCalledOnce();
    expect(bubbleDestroy).toHaveBeenCalledOnce();
  });
});
