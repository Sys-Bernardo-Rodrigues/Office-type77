/**
 * Importers/Callers: Vitest
 * Affected API: ThoughtBubble constructor, show(), destroy()
 * Data Schemas: BubbleKind and parent world coordinates
 * User Instruction: "vamos continuar"
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({
  default: { Scenes: { Events: { UPDATE: 'update' } } },
}));

import { ThoughtBubble } from '../../src/game/entities/ThoughtBubble';

function createScene(labelHeight = 10) {
  let update: (() => void) | undefined;
  let updateContext: unknown;
  const container = {
    scene: undefined as unknown,
    x: 0,
    y: 0,
    setDepth: vi.fn().mockReturnThis(),
    setVisible: vi.fn().mockReturnThis(),
    setPosition: vi.fn(function (this: { x: number; y: number }, x: number, y: number) {
      this.x = x;
      this.y = y;
      return this;
    }),
    setY: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
  };
  const background = {
    setStrokeStyle: vi.fn().mockReturnThis(),
    setFillStyle: vi.fn().mockReturnThis(),
    setSize: vi.fn().mockReturnThis(),
  };
  const label = {
    height: labelHeight,
    setOrigin: vi.fn().mockReturnThis(),
    setText: vi.fn().mockReturnThis(),
  };
  const scene = {
    add: {
      rectangle: vi.fn(() => background),
      text: vi.fn(() => label),
      container: vi.fn(() => container),
    },
    events: {
      on: vi.fn((_event: string, callback: () => void, context: unknown) => {
        update = callback;
        updateContext = context;
      }),
      off: vi.fn(),
    },
    time: { delayedCall: vi.fn(() => ({ remove: vi.fn() })) },
  };
  container.scene = scene;
  return { scene, container, runUpdate: () => update?.call(updateContext) };
}

describe('ThoughtBubble world overlay', () => {
  it('stays at root depth and follows its parent world position', () => {
    const { scene, container, runUpdate } = createScene();
    const parent = { x: 40, y: 80 };

    new ThoughtBubble(scene as never, parent as never);
    parent.x = 70;
    parent.y = 100;
    runUpdate();

    expect(scene.add.container).toHaveBeenCalledWith(40, 32, expect.any(Array));
    expect(container.setDepth).toHaveBeenCalledWith(10_000);
    expect(container.setPosition).toHaveBeenCalledWith(70, 52);
  });

  it('preserves its content-height offset while following its parent', () => {
    const { scene, container, runUpdate } = createScene(60);
    const parent = { x: 40, y: 80 };
    const bubble = new ThoughtBubble(scene as never, parent as never);

    bubble.show('A wrapped message');
    parent.x = 70;
    parent.y = 100;
    runUpdate();

    expect(container.setPosition).toHaveBeenLastCalledWith(70, 20);
  });

  it('removes its scene update listener when destroyed', () => {
    const { scene } = createScene();
    const bubble = new ThoughtBubble(scene as never, { x: 40, y: 80 } as never);

    bubble.destroy();

    expect(scene.events.off).toHaveBeenCalledWith(
      'update',
      expect.any(Function),
      expect.any(Object),
    );
  });
});
