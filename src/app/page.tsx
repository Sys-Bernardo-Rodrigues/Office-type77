/**
 * Importers/Callers: Next.js App Router ("/" route) — top of the HUD render tree
 * Affected API: Home page component; assembles HeaderNav, OfficeCanvas, TycoonCatalogModal,
 *   HireAgentModal, ProviderSettingsModal, MeetingModal, KanbanBoard, AgentLogDrawer
 * Data Schemas: bridges useOfficeStore builder-mode state to the Phaser game via BUILDER_EVENT,
 *   and persists Tycoon layouts through GET/POST /api/office/layout
 * User Instruction: Task 8 — docs/superpowers/plans/2026-09-24-pixel-agent-office-plan.md
 *   ("React HUD, Kanban Board, Agent Hiring & In-Browser Settings")
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import OfficeCanvas from '../components/game/OfficeCanvas';
import TycoonCatalogModal from '../components/game/TycoonCatalogModal';
import HeaderNav from '../components/layout/HeaderNav';
import HireAgentModal from '../components/modals/HireAgentModal';
import ProviderSettingsModal from '../components/modals/ProviderSettingsModal';
import MeetingModal from '../components/modals/MeetingModal';
import KanbanBoard from '../components/kanban/KanbanBoard';
import AgentLogDrawer from '../components/logs/AgentLogDrawer';
import { BUILDER_EVENT } from '../game/events';
import { useOfficeStore } from '../store/useOfficeStore';
import { applyFurnitureToScene, placementsToFurniture, type FurniturePayload } from '../game/builder/layoutSync';
import type { OfficeScene } from '../game/scenes/OfficeScene';

export default function Home() {
  const gameRef = useRef<import('phaser').Game | null>(null);
  const [layoutStatus, setLayoutStatus] = useState<string | null>(null);

  const isBuilderMode = useOfficeStore((state) => state.isBuilderMode);
  const setBuilderMode = useOfficeStore((state) => state.setBuilderMode);
  const builderSelectedType = useOfficeStore((state) => state.builderSelectedType);
  const setBuilderSelectedItem = useOfficeStore((state) => state.setBuilderSelectedItem);
  const builderRotation = useOfficeStore((state) => state.builderRotation);
  const rotateBuilderSelection = useOfficeStore((state) => state.rotateBuilderSelection);
  const isCatalogModalOpen = useOfficeStore((state) => state.isCatalogModalOpen);
  const setCatalogModalOpen = useOfficeStore((state) => state.setCatalogModalOpen);

  const getScene = useCallback((): OfficeScene | null => {
    const game = gameRef.current;
    if (!game) return null;
    return (game.scene.getScene('OfficeScene') as unknown as OfficeScene) ?? null;
  }, []);

  const handleLoad = useCallback(
    async (name: string) => {
      const scene = getScene();
      if (!scene) return;

      const response = await fetch(`/api/office/layout?name=${encodeURIComponent(name)}`);
      if (!response.ok) {
        setLayoutStatus(`Falha ao carregar o layout "${name}".`);
        return;
      }
      const data = await response.json();
      const furniture: FurniturePayload[] = data.layout?.furniture ?? [];

      const { placed, skipped } = applyFurnitureToScene(scene, furniture);
      setBuilderSelectedItem(null);

      if (furniture.length === 0) setLayoutStatus(`Layout "${name}" não encontrado ou vazio.`);
      else if (skipped > 0) setLayoutStatus(`Carregado: ${placed} peça(s), ${skipped} ignorada(s) por colisão.`);
      else setLayoutStatus(`Layout "${name}" carregado (${placed} peça(s)).`);
    },
    [getScene, setBuilderSelectedItem],
  );

  // Deferred: auto-loading the default layout on mount needs a reliable hook into Phaser's
  // scene boot lifecycle (game.scene.getScene('OfficeScene') returns undefined immediately
  // after `new Phaser.Game()` — the scene isn't registered in the SceneManager until later in
  // its async boot sequence). See progress.md ledger, "Task 8 — final review fix pass" for the
  // investigation and the ruling to defer this to Task 9 rather than ship an unverified fix.
  const handleGameReady = useCallback((game: import('phaser').Game) => {
    gameRef.current = game;
  }, []);

  useEffect(() => {
    gameRef.current?.events.emit(BUILDER_EVENT.setMode, { mode: isBuilderMode ? 'build' : 'view' });
  }, [isBuilderMode]);

  function handleSelectItem(type: string) {
    setBuilderSelectedItem(type);
    gameRef.current?.events.emit(BUILDER_EVENT.selectItem, { type });
  }

  function handleRotate() {
    rotateBuilderSelection();
    gameRef.current?.events.emit(BUILDER_EVENT.rotate);
  }

  function handleCloseCatalog() {
    setCatalogModalOpen(false);
    setBuilderMode(false);
  }

  async function handleSave(name: string) {
    const scene = getScene();
    if (!scene) return;
    const { placements } = scene.getBuilderState();
    const furniture = placementsToFurniture(placements);

    const response = await fetch('/api/office/layout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, furniture }),
    });

    setLayoutStatus(
      response.ok ? `Layout "${name}" salvo (${furniture.length} peça(s)).` : `Falha ao salvar o layout "${name}".`,
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-950 text-white">
      <HeaderNav />

      <main className="flex min-h-0 flex-1 flex-col gap-3 p-3">
        <div className="h-[52vh] min-h-[16rem] shrink-0">
          <OfficeCanvas onReady={handleGameReady} />
        </div>
        <KanbanBoard />
      </main>

      <TycoonCatalogModal
        isOpen={isCatalogModalOpen}
        selectedType={builderSelectedType}
        selectedRotation={builderRotation}
        statusMessage={layoutStatus}
        onSelectItem={handleSelectItem}
        onRotate={handleRotate}
        onSave={handleSave}
        onLoad={handleLoad}
        onClose={handleCloseCatalog}
      />
      <HireAgentModal />
      <ProviderSettingsModal />
      <MeetingModal />
      <AgentLogDrawer />
    </div>
  );
}
