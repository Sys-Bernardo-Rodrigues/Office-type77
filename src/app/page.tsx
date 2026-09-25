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

import { useCallback, useEffect, useRef } from 'react';
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
import type { OfficeScene } from '../game/scenes/OfficeScene';

interface FurniturePayload {
  furnitureId: string;
  itemType: string;
  gridX: number;
  gridY: number;
  width?: number;
  height?: number;
  rotation?: number;
}

export default function Home() {
  const gameRef = useRef<import('phaser').Game | null>(null);

  const isBuilderMode = useOfficeStore((state) => state.isBuilderMode);
  const setBuilderMode = useOfficeStore((state) => state.setBuilderMode);
  const builderSelectedType = useOfficeStore((state) => state.builderSelectedType);
  const setBuilderSelectedItem = useOfficeStore((state) => state.setBuilderSelectedItem);
  const builderRotation = useOfficeStore((state) => state.builderRotation);
  const rotateBuilderSelection = useOfficeStore((state) => state.rotateBuilderSelection);
  const isCatalogModalOpen = useOfficeStore((state) => state.isCatalogModalOpen);
  const setCatalogModalOpen = useOfficeStore((state) => state.setCatalogModalOpen);

  const handleGameReady = useCallback((game: import('phaser').Game) => {
    gameRef.current = game;
  }, []);

  const getScene = useCallback((): OfficeScene | null => {
    const game = gameRef.current;
    if (!game) return null;
    return (game.scene.getScene('OfficeScene') as unknown as OfficeScene) ?? null;
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
    const furniture: FurniturePayload[] = placements.map((placement) => ({
      furnitureId: placement.id,
      itemType: placement.furniture.type,
      gridX: placement.x,
      gridY: placement.y,
      width: placement.furniture.width,
      height: placement.furniture.height,
      rotation: placement.furniture.rotation,
    }));

    await fetch('/api/office/layout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, furniture }),
    });
  }

  async function handleLoad(name: string) {
    const scene = getScene();
    if (!scene) return;

    const response = await fetch(`/api/office/layout?name=${encodeURIComponent(name)}`);
    const data = await response.json();
    const furniture: FurniturePayload[] = data.layout?.furniture ?? [];

    scene.setBuilderMode('build');
    for (const item of furniture) {
      scene.selectBuilderItem(item.itemType);
      const targetRotation = ((item.rotation ?? 0) % 360 + 360) % 360;
      for (let guard = 0; guard < 4 && (scene.getBuilderState().selectedItem?.rotation ?? 0) !== targetRotation; guard += 1) {
        scene.rotateBuilderSelection();
      }
      scene.placeBuilderItem(item.gridX, item.gridY);
    }
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
