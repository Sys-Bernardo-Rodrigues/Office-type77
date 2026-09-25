/**
 * Importers/Callers: src/game/scenes/OfficeScene.ts
 * Affected API: AgentSprite, AgentAnimationState, moveAlong(path), setAgentState(state), showBubble(text, kind)
 * Data Schemas: AgentAnimationState union and GridPosition[] paths
 * User Instruction: "vamos continuar"
 */
import Phaser from 'phaser';
import { GRID_SIZE } from '../constants';
import type { GridPosition } from '../grid/AStarPathfinder';
import { ThoughtBubble, type BubbleKind } from './ThoughtBubble';

export type AgentAnimationState =
  | 'idle'
  | 'walking'
  | 'typing'
  | 'drinking_coffee'
  | 'meeting'
  | 'error';

export class AgentSprite extends Phaser.GameObjects.Container {
  readonly agentId: string;
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly bubble: ThoughtBubble;
  private animationState: AgentAnimationState = 'idle';
  private movement?: Phaser.Tweens.TweenChain;

  constructor(scene: Phaser.Scene, agentId: string, gridX: number, gridY: number) {
    super(scene, gridX * GRID_SIZE + GRID_SIZE / 2, gridY * GRID_SIZE + GRID_SIZE / 2);
    this.agentId = agentId;
    this.sprite = scene.add.sprite(0, 0, 'office-agent-idle-0').setOrigin(0.5, 0.8);
    this.add(this.sprite);
    this.bubble = new ThoughtBubble(scene, this);
    scene.add.existing(this);
    this.setDepth(this.y);
  }

  setAgentState(state: AgentAnimationState): void {
    if (state !== 'walking') this.stopMovement();
    this.animationState = state;
    this.sprite.clearTint();
    this.sprite.play(`office-agent-${state}`, true);
  }

  moveAlong(path: GridPosition[]): void {
    const steps = path.slice(1);
    if (steps.length === 0) return;
    this.stopMovement();
    this.setAgentState('walking');
    const movement = this.scene.tweens.chain({
      targets: this,
      tweens: steps.map((point) => ({
        x: point.x * GRID_SIZE + GRID_SIZE / 2,
        y: point.y * GRID_SIZE + GRID_SIZE / 2,
        duration: 160,
        ease: 'Linear',
        onUpdate: () => this.setDepth(this.y),
      })),
      onComplete: () => {
        if (this.movement !== movement) return;
        this.movement = undefined;
        this.setAgentState('idle');
      },
    });
    this.movement = movement;
  }

  showBubble(text: string, kind: BubbleKind = 'thought'): void {
    this.bubble.show(text, kind);
  }

  getAgentState(): AgentAnimationState {
    return this.animationState;
  }

  private stopMovement(): void {
    this.movement?.stop();
    this.movement = undefined;
  }

  destroy(fromScene?: boolean): void {
    this.stopMovement();
    this.bubble.destroy();
    super.destroy(fromScene);
  }
}
