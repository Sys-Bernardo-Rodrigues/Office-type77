/**
 * Importers/Callers: src/app/page.tsx and future office dashboard layouts
 * Affected API: OfficeCanvas React component
 * Data Schemas: Phaser.Game instance mounted into a div ref
 * User Instruction: "vamos continuar"
 */
'use client';

import { useEffect, useRef } from 'react';

export default function OfficeCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let game: import('phaser').Game | undefined;
    let disposed = false;

    void Promise.all([import('phaser'), import('../../game/config')]).then(([{ default: Phaser }, { createGameConfig }]) => {
      if (!disposed && containerRef.current) game = new Phaser.Game(createGameConfig(containerRef.current));
    });

    return () => {
      disposed = true;
      game?.destroy(true);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-full min-h-0 w-full overflow-hidden rounded-lg border-2 border-slate-700 bg-slate-900 shadow-2xl"
      aria-label="Interactive pixel office"
    />
  );
}
