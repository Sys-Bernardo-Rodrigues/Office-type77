/**
 * Importers/Callers: src/game/entities/AgentSprite.ts
 * Affected API: ThoughtBubble.show(text, kind, duration), clear(), destroy()
 * Data Schemas: BubbleKind = 'thought' | 'speech' | 'error'
 * User Instruction: "vamos continuar"
 */
import Phaser from 'phaser';

export type BubbleKind = 'thought' | 'speech' | 'error';

export class ThoughtBubble {
  private readonly container: Phaser.GameObjects.Container;
  private readonly background: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.Text;
  private hideTimer?: Phaser.Time.TimerEvent;
  private readonly parent: Phaser.GameObjects.Container;
  private verticalOffset = 48;

  constructor(scene: Phaser.Scene, parent: Phaser.GameObjects.Container) {
    this.parent = parent;
    this.background = scene.add.rectangle(0, 0, 150, 42, 0xf8fafc, 0.96)
      .setStrokeStyle(2, 0x0f172a);
    this.label = scene.add.text(0, 0, '', {
      color: '#0f172a',
      fontFamily: 'monospace',
      fontSize: '10px',
      align: 'center',
      wordWrap: { width: 136 },
    }).setOrigin(0.5);
    this.container = scene.add.container(parent.x, parent.y - 48, [this.background, this.label])
      .setDepth(10_000)
      .setVisible(false);
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.updatePosition, this);
  }

  show(text: string, kind: BubbleKind = 'thought', duration = 4_000): void {
    this.hideTimer?.remove(false);
    this.background.setFillStyle(kind === 'error' ? 0xfca5a5 : 0xf8fafc, 0.96);
    const prefix = kind === 'thought' ? '... ' : kind === 'speech' ? '> ' : '! ';
    this.label.setText(`${prefix}${text.slice(0, 120)}`);
    const height = Math.max(42, this.label.height + 16);
    this.verticalOffset = 42 + height / 2;
    this.background.setSize(150, height);
    this.updatePosition();
    this.container.setVisible(true);
    this.hideTimer = this.container.scene.time.delayedCall(duration, () => this.clear());
  }

  clear(): void {
    this.container.setVisible(false);
  }

  private updatePosition(): void {
    this.container.setPosition(this.parent.x, this.parent.y - this.verticalOffset);
  }

  destroy(): void {
    this.hideTimer?.remove(false);
    this.container.scene.events.off(Phaser.Scenes.Events.UPDATE, this.updatePosition, this);
    this.container.destroy(true);
  }
}
