import React from 'react';
import {
  Move,
  MousePointer,
  Type,
  Award,
  Square,
  Hand,
  Layers,
  Flame,
  Smartphone,
  Grid,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Plus
} from 'lucide-react';
import { EditorTool } from '../../types/postStudio';

interface PhotoshopToolbarProps {
  currentTool: EditorTool;
  onSelectTool: (tool: EditorTool) => void;
  showBlueprint: boolean;
  onToggleBlueprint: () => void;
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
  showSafeZones: boolean;
  onToggleSafeZones: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  onAddNewLayer: (type: 'text' | 'badge' | 'button' | 'shape') => void;
}

export const PhotoshopToolbar: React.FC<PhotoshopToolbarProps> = ({
  currentTool,
  onSelectTool,
  showBlueprint,
  onToggleBlueprint,
  showHeatmap,
  onToggleHeatmap,
  showSafeZones,
  onToggleSafeZones,
  showGrid,
  onToggleGrid,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onAddNewLayer
}) => {
  return (
    <aside className="w-14 bg-[#111216] border-r border-white/[0.08] flex flex-col items-center py-2.5 gap-1 select-none z-20 shrink-0">
      {/* PRIMARY SELECTION / TRANSFORMATION TOOLS */}
      <div className="flex flex-col items-center gap-1 w-full px-1.5 pb-2 border-b border-white/[0.06]">
        <button
          onClick={() => onSelectTool('move')}
          title="Ferramenta Mover (V)"
          className={`w-9 h-9 rounded flex items-center justify-center transition-all cursor-pointer relative ${
            currentTool === 'move'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-950/60 ring-1 ring-purple-400/50'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          <Move className="w-4 h-4" />
        </button>

        <button
          onClick={() => onSelectTool('select')}
          title="Ferramenta Seleção & Caixa (M)"
          className={`w-9 h-9 rounded flex items-center justify-center transition-all cursor-pointer ${
            currentTool === 'select'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-950/60 ring-1 ring-purple-400/50'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          <MousePointer className="w-4 h-4" />
        </button>
      </div>

      {/* CREATION TOOLS */}
      <div className="flex flex-col items-center gap-1 w-full px-1.5 py-2 border-b border-white/[0.06]">
        <button
          onClick={() => onAddNewLayer('text')}
          title="Adicionar Texto (T)"
          className={`w-9 h-9 rounded flex items-center justify-center transition-all cursor-pointer ${
            currentTool === 'text'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-950/60'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          <Type className="w-4 h-4" />
        </button>

        <button
          onClick={() => onAddNewLayer('badge')}
          title="Adicionar Selo de Autoridade / Badge"
          className={`w-9 h-9 rounded flex items-center justify-center transition-all cursor-pointer ${
            currentTool === 'badge'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-950/60'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          <Award className="w-4 h-4" />
        </button>

        <button
          onClick={() => onAddNewLayer('button')}
          title="Adicionar Botão CTA"
          className="w-9 h-9 rounded flex items-center justify-center transition-all cursor-pointer text-slate-400 hover:text-white hover:bg-white/[0.06]"
        >
          <Plus className="w-4 h-4 text-purple-400" />
        </button>

        <button
          onClick={() => onAddNewLayer('shape')}
          title="Adicionar Forma Geométrica / Caixa (U)"
          className={`w-9 h-9 rounded flex items-center justify-center transition-all cursor-pointer ${
            currentTool === 'shape'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-950/60'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          <Square className="w-4 h-4" />
        </button>
      </div>

      {/* STRATEGIC OVERLAY TOGGLES (BLUEPRINT, HEATMAP, SAFE-ZONE) */}
      <div className="flex flex-col items-center gap-1 w-full px-1.5 py-2 border-b border-white/[0.06]">
        <button
          onClick={onToggleBlueprint}
          title={showBlueprint ? 'Ocultar Blueprint 3 Zonas' : 'Exibir Blueprint 3 Zonas'}
          className={`w-9 h-9 rounded flex items-center justify-center transition-all cursor-pointer relative ${
            showBlueprint
              ? 'bg-purple-950/80 text-purple-300 border border-purple-500/50'
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
          }`}
        >
          <Layers className="w-4 h-4" />
          {showBlueprint && (
            <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-purple-400" />
          )}
        </button>

        <button
          onClick={onToggleHeatmap}
          title={showHeatmap ? 'Ocultar Mapa de Calor' : 'Exibir Mapa de Calor de Atenção'}
          className={`w-9 h-9 rounded flex items-center justify-center transition-all cursor-pointer relative ${
            showHeatmap
              ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50'
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
          }`}
        >
          <Flame className="w-4 h-4" />
          {showHeatmap && (
            <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
          )}
        </button>

        <button
          onClick={onToggleSafeZones}
          title={showSafeZones ? 'Ocultar Safe-Zones Instagram' : 'Exibir Safe-Zones Instagram'}
          className={`w-9 h-9 rounded flex items-center justify-center transition-all cursor-pointer relative ${
            showSafeZones
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50'
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          {showSafeZones && (
            <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
          )}
        </button>

        <button
          onClick={onToggleGrid}
          title={showGrid ? 'Ocultar Grid / Guias' : 'Exibir Grid de Alinhamento'}
          className={`w-9 h-9 rounded flex items-center justify-center transition-all cursor-pointer relative ${
            showGrid
              ? 'bg-blue-950/80 text-blue-300 border border-blue-500/50'
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
          }`}
        >
          <Grid className="w-4 h-4" />
        </button>
      </div>

      {/* ZOOM CONTROLS */}
      <div className="mt-auto flex flex-col items-center gap-1 w-full px-1.5 pt-2">
        <button
          onClick={onZoomIn}
          title="Aumentar Zoom (+)"
          className="w-8 h-8 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <span className="font-mono text-[9px] text-slate-400 select-none py-0.5">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={onZoomOut}
          title="Diminuir Zoom (-)"
          className="w-8 h-8 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onZoomFit}
          title="Ajustar à Tela (Fit)"
          className="w-8 h-8 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
