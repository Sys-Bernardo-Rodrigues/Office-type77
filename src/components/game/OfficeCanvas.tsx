/**
 * Importers/Callers: src/app/page.tsx (React HUD)
 * Affected API: OfficeCanvas React component, onReady(game) prop
 * Data Schemas: Phaser.Game instance mounted into a div ref
 * User Instruction: Task 8 ruling — added onReady so the HUD can emit BUILDER_EVENT/OFFICE_EVENT
 *   onto the live Phaser.Game instance (e.g. to wire TycoonCatalogModal), without page.tsx ever
 *   importing the 'phaser' module itself.
 */
'use client';

import { useEffect, useRef } from 'react';

export interface OfficeCanvasProps {
  onReady?: (game: import('phaser').Game) => void;
}

export default function OfficeCanvas({ onReady }: OfficeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let game: import('phaser').Game | undefined;
    let disposed = false;

    void Promise.all([import('phaser'), import('../../game/config')]).then(([{ default: Phaser }, { createGameConfig }]) => {
      if (!disposed && containerRef.current) {
        game = new Phaser.Game(createGameConfig(containerRef.current));
        onReady?.(game);
      }
    });

    return () => {
      disposed = true;
      game?.destroy(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-full min-h-0 w-full overflow-hidden rounded-lg border-2 border-slate-700 bg-slate-900 shadow-2xl"
      aria-label="Interactive pixel office"
    />
  );
}
