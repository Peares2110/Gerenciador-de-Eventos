import React from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Type,
  Award,
  Square,
  Image as ImageIcon,
  Layers,
  Plus
} from 'lucide-react';
import { PostLayer, StrategicZone } from '../../types/postStudio';

interface PhotoshopLayersPanelProps {
  layers: PostLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayer: (id: string, updates: Partial<PostLayer>) => void;
  onDeleteLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onMoveLayerZ: (id: string, direction: 'up' | 'down') => void;
  onAddNewLayer: (type: 'text' | 'badge' | 'button' | 'shape') => void;
}

export const PhotoshopLayersPanel: React.FC<PhotoshopLayersPanelProps> = ({
  layers,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  onDeleteLayer,
  onDuplicateLayer,
  onMoveLayerZ,
  onAddNewLayer
}) => {
  // Sort from top (highest zIndex) to bottom (lowest zIndex) like Photoshop layer stack
  const reversedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  const getZoneBadge = (zone: StrategicZone) => {
    switch (zone) {
      case 'zone1_hook':
        return (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/40">
            Z1: Gancho
          </span>
        );
      case 'zone2_proof':
        return (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/40">
            Z2: Prova
          </span>
        );
      case 'zone3_cta':
        return (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/40">
            Z3: CTA
          </span>
        );
      case 'background':
        return (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-700/40">
            Fundo
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">
            Livre
          </span>
        );
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <Type className="w-3.5 h-3.5 text-blue-400" />;
      case 'badge':
        return <Award className="w-3.5 h-3.5 text-amber-400" />;
      case 'button':
        return <Square className="w-3.5 h-3.5 text-purple-400" />;
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />;
      case 'shape':
        return <Square className="w-3.5 h-3.5 text-cyan-400" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#121316] text-white select-none">
      {/* PANEL HEADER WITH ACTIONS */}
      <div className="px-3.5 py-2.5 border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Camadas ({layers.length})
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onAddNewLayer('text')}
            title="Nova Camada de Texto"
            className="p-1 hover:bg-white/[0.08] rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* LAYERS LIST */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04] p-1.5 space-y-0.5">
        {reversedLayers.map((layer) => {
          const isSelected = layer.id === selectedLayerId;

          return (
            <div
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              className={`group flex items-center justify-between px-2.5 py-2 rounded transition-all cursor-pointer ${
                isSelected
                  ? 'bg-purple-900/30 border border-purple-500/50 text-white'
                  : 'hover:bg-white/[0.04] text-slate-300'
              }`}
            >
              {/* LEFT: VISIBILITY & ICON & NAME */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {/* Visibility Toggle */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateLayer(layer.id, { visible: !layer.visible });
                  }}
                  title={layer.visible ? 'Ocultar camada' : 'Exibir camada'}
                  className="text-slate-500 hover:text-white transition-colors p-0.5"
                >
                  {layer.visible ? (
                    <Eye className="w-3.5 h-3.5 text-purple-400" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                  )}
                </button>

                {/* Type icon */}
                <span className="shrink-0">{getTypeIcon(layer.type)}</span>

                {/* Name & Strategic Zone */}
                <div className="flex flex-col min-w-0 flex-1">
                  <span
                    className={`text-xs truncate font-medium ${
                      layer.visible ? 'text-slate-200' : 'text-slate-600 line-through'
                    }`}
                  >
                    {layer.name}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {getZoneBadge(layer.zone)}
                  </div>
                </div>
              </div>

              {/* RIGHT: QUICK ACTIONS (LOCK, REORDER, DUPLICATE, DELETE) */}
              <div className="flex items-center gap-1 shrink-0 ml-2">
                {/* Lock Toggle */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateLayer(layer.id, { locked: !layer.locked });
                  }}
                  title={layer.locked ? 'Desbloquear camada' : 'Bloquear camada'}
                  className="p-1 text-slate-500 hover:text-white rounded hover:bg-white/[0.08] transition-colors"
                >
                  {layer.locked ? (
                    <Lock className="w-3 h-3 text-amber-400" />
                  ) : (
                    <Unlock className="w-3 h-3 text-slate-600 group-hover:text-slate-400" />
                  )}
                </button>

                {/* Move Up */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveLayerZ(layer.id, 'up');
                  }}
                  title="Subir camada (z-index)"
                  className="p-1 text-slate-500 hover:text-white rounded hover:bg-white/[0.08] transition-colors"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>

                {/* Move Down */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveLayerZ(layer.id, 'down');
                  }}
                  title="Descer camada (z-index)"
                  className="p-1 text-slate-500 hover:text-white rounded hover:bg-white/[0.08] transition-colors"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>

                {/* Duplicate */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateLayer(layer.id);
                  }}
                  title="Duplicar camada"
                  className="p-1 text-slate-500 hover:text-purple-300 rounded hover:bg-white/[0.08] transition-colors"
                >
                  <Copy className="w-3 h-3" />
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteLayer(layer.id);
                  }}
                  title="Excluir camada"
                  className="p-1 text-slate-500 hover:text-red-400 rounded hover:bg-white/[0.08] transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* QUICK FOOTER: ADD LAYER SHORTCUTS */}
      <div className="p-2 border-t border-white/[0.08] bg-[#0d0e11] grid grid-cols-4 gap-1">
        <button
          onClick={() => onAddNewLayer('text')}
          className="px-2 py-1.5 text-[11px] font-mono bg-[#1c1d22] hover:bg-purple-900/40 text-slate-300 hover:text-purple-200 border border-white/[0.08] rounded flex items-center justify-center gap-1 transition-colors cursor-pointer"
        >
          <Type className="w-3 h-3 text-blue-400" />
          <span>Texto</span>
        </button>

        <button
          onClick={() => onAddNewLayer('badge')}
          className="px-2 py-1.5 text-[11px] font-mono bg-[#1c1d22] hover:bg-purple-900/40 text-slate-300 hover:text-purple-200 border border-white/[0.08] rounded flex items-center justify-center gap-1 transition-colors cursor-pointer"
        >
          <Award className="w-3 h-3 text-amber-400" />
          <span>Selo</span>
        </button>

        <button
          onClick={() => onAddNewLayer('button')}
          className="px-2 py-1.5 text-[11px] font-mono bg-[#1c1d22] hover:bg-purple-900/40 text-slate-300 hover:text-purple-200 border border-white/[0.08] rounded flex items-center justify-center gap-1 transition-colors cursor-pointer"
        >
          <Square className="w-3 h-3 text-purple-400" />
          <span>CTA</span>
        </button>

        <button
          onClick={() => onAddNewLayer('shape')}
          className="px-2 py-1.5 text-[11px] font-mono bg-[#1c1d22] hover:bg-purple-900/40 text-slate-300 hover:text-purple-200 border border-white/[0.08] rounded flex items-center justify-center gap-1 transition-colors cursor-pointer"
        >
          <Square className="w-3 h-3 text-cyan-400" />
          <span>Forma</span>
        </button>
      </div>
    </div>
  );
};
