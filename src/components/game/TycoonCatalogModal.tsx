/**
 * Importers/Callers: src/app/page.tsx (Task 8 HUD assembly)
 * Affected API: TycoonCatalogModal React component
 * Data Schemas: FurnitureItem { type, width, height, rotation } from game/builder/furnitureCatalog
 * User Instruction: Task 8 ruling — changed from a full-viewport blocking backdrop to a docked,
 *   non-blocking side panel. The original `fixed inset-0 bg-black/60` backdrop intercepted every
 *   pointer event across the whole page, including over the Phaser canvas, making it impossible
 *   to click a grid cell to place furniture while the catalog was open (found via in-browser
 *   testing once Task 8 finally wired this component into a real page).
 */
'use client';

import { useState } from 'react';
import { FURNITURE_CATALOG, type FurnitureItem } from '../../game/builder/furnitureCatalog';

const FURNITURE_LABEL: Record<string, string> = {
  desk: 'Mesa de trabalho',
  chair: 'Cadeira',
  plant: 'Planta decorativa',
  whiteboard: 'Quadro branco',
  sofa: 'Sofá',
};

export interface TycoonCatalogModalProps {
  isOpen: boolean;
  catalog?: FurnitureItem[];
  selectedType: string | null;
  selectedRotation?: number;
  statusMessage?: string | null;
  onSelectItem: (type: string) => void;
  onRotate: () => void;
  onSave: (name: string) => void;
  onLoad: (name: string) => void;
  onClose: () => void;
}

export default function TycoonCatalogModal({
  isOpen,
  catalog = FURNITURE_CATALOG,
  selectedType,
  selectedRotation = 0,
  statusMessage = null,
  onSelectItem,
  onRotate,
  onSave,
  onLoad,
  onClose,
}: TycoonCatalogModalProps) {
  const [layoutName, setLayoutName] = useState('Default Office');

  if (!isOpen) return null;

  return (
    <div
      className="fixed right-4 top-20 z-50 w-80 rounded-lg border-2 border-slate-700 bg-slate-900 p-4 text-white shadow-2xl"
      role="dialog"
      aria-modal="false"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight">Catálogo do Escritório</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar catálogo"
          className="rounded px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          ✕
        </button>
      </div>

      <ul className="mb-4 flex flex-col gap-1">
        {catalog.map((item) => (
          <li key={item.type}>
            <button
              type="button"
              onClick={() => onSelectItem(item.type)}
              aria-pressed={selectedType === item.type}
              className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                selectedType === item.type
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              {FURNITURE_LABEL[item.type] ?? item.type} ({item.width}×{item.height})
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onRotate}
        disabled={!selectedType}
        className="mb-4 w-full rounded bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Girar (R) · {selectedRotation}°
      </button>

      <div className="flex flex-col gap-2 border-t border-slate-700 pt-3">
        <input
          type="text"
          value={layoutName}
          onChange={(event) => setLayoutName(event.target.value)}
          placeholder="Nome do layout"
          className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-white placeholder:text-slate-500"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onSave(layoutName)}
            disabled={!layoutName.trim()}
            className="flex-1 rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Salvar
          </button>
          <button
            type="button"
            onClick={() => onLoad(layoutName)}
            disabled={!layoutName.trim()}
            className="flex-1 rounded bg-slate-700 px-3 py-1.5 text-sm font-medium hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Carregar
          </button>
        </div>
        {statusMessage ? <p className="text-xs text-slate-400">{statusMessage}</p> : null}
      </div>
    </div>
  );
}
