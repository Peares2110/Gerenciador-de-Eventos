import React from 'react';
import {
  Sliders,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  RotateCw,
  Eye,
  Palette,
  Sparkles,
  MoveHorizontal,
  MoveVertical
} from 'lucide-react';
import { PostLayer, CanvasDimensions, StrategicZone } from '../../types/postStudio';

interface PhotoshopPropertiesPanelProps {
  selectedLayer: PostLayer | null;
  onUpdateLayer: (id: string, updates: Partial<PostLayer>) => void;
  canvasDimensions: CanvasDimensions;
}

const AVAILABLE_FONTS = [
  { label: 'Inter (Moderno & Limpo)', value: 'Inter, sans-serif' },
  { label: 'Impact (Brutalista Alto Impacto)', value: 'Impact, sans-serif' },
  { label: 'Oswald (Condensado Headline)', value: 'Oswald, sans-serif' },
  { label: 'JetBrains Mono (Técnico / Data)', value: 'JetBrains Mono, monospace' },
  { label: 'Montserrat (Geométrico Elegante)', value: 'Montserrat, sans-serif' },
  { label: 'Syne (Vanguardista Festival)', value: 'Syne, sans-serif' }
];

export const PhotoshopPropertiesPanel: React.FC<PhotoshopPropertiesPanelProps> = ({
  selectedLayer,
  onUpdateLayer,
  canvasDimensions
}) => {
  if (!selectedLayer) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-slate-500 bg-[#121316]">
        <Sliders className="w-8 h-8 text-slate-600 mb-2" />
        <p className="text-xs font-semibold text-slate-400">Nenhuma camada selecionada</p>
        <p className="text-[11px] text-slate-600 mt-1 max-w-[200px]">
          Clique em qualquer elemento no canvas ou na lista de camadas para inspecionar e editar suas propriedades.
        </p>
      </div>
    );
  }

  // Quick alignment helpers
  const handleAlign = (type: 'center-h' | 'center-v' | 'top' | 'bottom' | 'left' | 'right') => {
    switch (type) {
      case 'center-h':
        onUpdateLayer(selectedLayer.id, {
          x: Math.round((canvasDimensions.width - selectedLayer.width) / 2)
        });
        break;
      case 'center-v':
        onUpdateLayer(selectedLayer.id, {
          y: Math.round((canvasDimensions.height - selectedLayer.height) / 2)
        });
        break;
      case 'top':
        onUpdateLayer(selectedLayer.id, { y: 60 });
        break;
      case 'bottom':
        onUpdateLayer(selectedLayer.id, {
          y: canvasDimensions.height - selectedLayer.height - 60
        });
        break;
      case 'left':
        onUpdateLayer(selectedLayer.id, { x: 40 });
        break;
      case 'right':
        onUpdateLayer(selectedLayer.id, {
          x: canvasDimensions.width - selectedLayer.width - 40
        });
        break;
    }
  };

  const isTextual = ['text', 'badge', 'button'].includes(selectedLayer.type);

  return (
    <div className="flex flex-col h-full bg-[#121316] text-white overflow-y-auto divide-y divide-white/[0.08] select-none text-xs">
      {/* 1. LAYER HEADER / NAME */}
      <div className="p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-purple-400 font-bold uppercase tracking-wider">
            Propriedades da Camada
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            ID: {selectedLayer.id.slice(-6)}
          </span>
        </div>

        <div>
          <label className="text-[10px] text-slate-400 font-mono">Nome da Camada</label>
          <input
            type="text"
            value={selectedLayer.name}
            onChange={(e) => onUpdateLayer(selectedLayer.id, { name: e.target.value })}
            className="w-full mt-1 bg-[#1a1b20] border border-white/[0.1] rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Quick alignment row */}
        <div className="pt-1">
          <label className="text-[10px] text-slate-400 font-mono mb-1 block">Alinhamento Rápido no Canvas</label>
          <div className="grid grid-cols-6 gap-1 bg-[#1a1b20] p-1 rounded border border-white/[0.06]">
            <button
              onClick={() => handleAlign('left')}
              title="Alinhar à Esquerda"
              className="py-1 hover:bg-white/[0.08] rounded text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleAlign('center-h')}
              title="Centralizar Horizontalmente"
              className="py-1 hover:bg-white/[0.08] rounded text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
            >
              <MoveHorizontal className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleAlign('right')}
              title="Alinhar à Direita"
              className="py-1 hover:bg-white/[0.08] rounded text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleAlign('top')}
              title="Alinhar ao Topo"
              className="py-1 hover:bg-white/[0.08] rounded text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
            >
              ↑
            </button>
            <button
              onClick={() => handleAlign('center-v')}
              title="Centralizar Verticalmente"
              className="py-1 hover:bg-white/[0.08] rounded text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
            >
              <MoveVertical className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleAlign('bottom')}
              title="Alinhar à Base"
              className="py-1 hover:bg-white/[0.08] rounded text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
            >
              ↓
            </button>
          </div>
        </div>
      </div>

      {/* 2. TRANSFORM (X, Y, W, H, ROTATION, OPACITY) */}
      <div className="p-3.5 space-y-3">
        <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider block">
          Transformação & Dimensões
        </span>

        {/* X and Y */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>X (px)</span>
            </label>
            <input
              type="number"
              value={selectedLayer.x}
              onChange={(e) => onUpdateLayer(selectedLayer.id, { x: parseInt(e.target.value) || 0 })}
              className="w-full mt-0.5 bg-[#1a1b20] border border-white/[0.1] rounded px-2 py-1 text-xs text-white font-mono"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>Y (px)</span>
            </label>
            <input
              type="number"
              value={selectedLayer.y}
              onChange={(e) => onUpdateLayer(selectedLayer.id, { y: parseInt(e.target.value) || 0 })}
              className="w-full mt-0.5 bg-[#1a1b20] border border-white/[0.1] rounded px-2 py-1 text-xs text-white font-mono"
            />
          </div>
        </div>

        {/* W and H */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>Largura (W)</span>
            </label>
            <input
              type="number"
              value={selectedLayer.width}
              onChange={(e) =>
                onUpdateLayer(selectedLayer.id, {
                  width: Math.max(10, parseInt(e.target.value) || 10)
                })
              }
              className="w-full mt-0.5 bg-[#1a1b20] border border-white/[0.1] rounded px-2 py-1 text-xs text-white font-mono"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>Altura (H)</span>
            </label>
            <input
              type="number"
              value={selectedLayer.height}
              onChange={(e) =>
                onUpdateLayer(selectedLayer.id, {
                  height: Math.max(10, parseInt(e.target.value) || 10)
                })
              }
              className="w-full mt-0.5 bg-[#1a1b20] border border-white/[0.1] rounded px-2 py-1 text-xs text-white font-mono"
            />
          </div>
        </div>

        {/* Rotation & Opacity */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>Rotação (°)</span>
              <span className="text-purple-400">{selectedLayer.rotation}°</span>
            </label>
            <input
              type="range"
              min="-180"
              max="180"
              value={selectedLayer.rotation}
              onChange={(e) =>
                onUpdateLayer(selectedLayer.id, { rotation: parseInt(e.target.value) || 0 })
              }
              className="w-full mt-1 accent-purple-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>Opacidade</span>
              <span className="text-purple-400">{Math.round(selectedLayer.opacity * 100)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={selectedLayer.opacity}
              onChange={(e) =>
                onUpdateLayer(selectedLayer.id, { opacity: parseFloat(e.target.value) })
              }
              className="w-full mt-1 accent-purple-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 3. TYPOGRAPHY (IF TEXT / BADGE / BUTTON) */}
      {isTextual && (
        <div className="p-3.5 space-y-3">
          <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider block">
            Tipografia & Texto
          </span>

          {/* Text Content */}
          <div>
            <label className="text-[10px] font-mono text-slate-400">Conteúdo do Texto</label>
            <textarea
              rows={2}
              value={selectedLayer.content || ''}
              onChange={(e) => onUpdateLayer(selectedLayer.id, { content: e.target.value })}
              className="w-full mt-1 bg-[#1a1b20] border border-white/[0.1] rounded p-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono resize-none"
            />
          </div>

          {/* Font Family */}
          <div>
            <label className="text-[10px] font-mono text-slate-400">Família da Fonte</label>
            <select
              value={selectedLayer.fontFamily || 'Inter, sans-serif'}
              onChange={(e) => onUpdateLayer(selectedLayer.id, { fontFamily: e.target.value })}
              className="w-full mt-1 bg-[#1a1b20] border border-white/[0.1] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              {AVAILABLE_FONTS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size & Weight */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-mono text-slate-400">Tamanho (px)</label>
              <input
                type="number"
                min="10"
                max="200"
                value={selectedLayer.fontSize || 24}
                onChange={(e) =>
                  onUpdateLayer(selectedLayer.id, { fontSize: parseInt(e.target.value) || 24 })
                }
                className="w-full mt-0.5 bg-[#1a1b20] border border-white/[0.1] rounded px-2 py-1 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400">Peso (Weight)</label>
              <select
                value={selectedLayer.fontWeight || '700'}
                onChange={(e) => onUpdateLayer(selectedLayer.id, { fontWeight: e.target.value })}
                className="w-full mt-0.5 bg-[#1a1b20] border border-white/[0.1] rounded px-2 py-1 text-xs text-white font-mono"
              >
                <option value="400">Normal (400)</option>
                <option value="600">Semibold (600)</option>
                <option value="700">Bold (700)</option>
                <option value="800">Extrabold (800)</option>
                <option value="900">Black (900)</option>
              </select>
            </div>
          </div>

          {/* Text Color & Alignment */}
          <div className="grid grid-cols-2 gap-2 items-center">
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-0.5">Cor do Texto</label>
              <div className="flex items-center gap-1.5 bg-[#1a1b20] border border-white/[0.1] rounded px-2 py-1">
                <input
                  type="color"
                  value={selectedLayer.color || '#ffffff'}
                  onChange={(e) => onUpdateLayer(selectedLayer.id, { color: e.target.value })}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                />
                <input
                  type="text"
                  value={selectedLayer.color || '#ffffff'}
                  onChange={(e) => onUpdateLayer(selectedLayer.id, { color: e.target.value })}
                  className="w-full bg-transparent text-[11px] font-mono text-slate-300 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-0.5">Alinhamento</label>
              <div className="grid grid-cols-3 gap-0.5 bg-[#1a1b20] p-0.5 rounded border border-white/[0.08]">
                <button
                  onClick={() => onUpdateLayer(selectedLayer.id, { textAlign: 'left' })}
                  className={`py-1 rounded flex items-center justify-center cursor-pointer ${
                    selectedLayer.textAlign === 'left' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <AlignLeft className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onUpdateLayer(selectedLayer.id, { textAlign: 'center' })}
                  className={`py-1 rounded flex items-center justify-center cursor-pointer ${
                    selectedLayer.textAlign === 'center' || !selectedLayer.textAlign ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <AlignCenter className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onUpdateLayer(selectedLayer.id, { textAlign: 'right' })}
                  className={`py-1 rounded flex items-center justify-center cursor-pointer ${
                    selectedLayer.textAlign === 'right' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <AlignRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. APPARANCE (BACKGROUND, BORDER, RADIUS, SHADOW) */}
      <div className="p-3.5 space-y-3">
        <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider block">
          Aparência & Estilo
        </span>

        {/* Background color */}
        <div>
          <label className="text-[10px] font-mono text-slate-400 block mb-0.5">Cor de Fundo / Preenchimento</label>
          <div className="flex items-center gap-1.5 bg-[#1a1b20] border border-white/[0.1] rounded px-2 py-1">
            <input
              type="color"
              value={selectedLayer.backgroundColor?.startsWith('#') ? selectedLayer.backgroundColor : '#1e1b4b'}
              onChange={(e) => onUpdateLayer(selectedLayer.id, { backgroundColor: e.target.value })}
              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
            />
            <input
              type="text"
              value={selectedLayer.backgroundColor || 'transparent'}
              onChange={(e) => onUpdateLayer(selectedLayer.id, { backgroundColor: e.target.value })}
              className="w-full bg-transparent text-[11px] font-mono text-slate-300 focus:outline-none"
            />
          </div>
        </div>

        {/* Border and Border Radius */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-mono text-slate-400">Espessura Borda (px)</label>
            <input
              type="number"
              min="0"
              max="20"
              value={selectedLayer.borderWidth || 0}
              onChange={(e) =>
                onUpdateLayer(selectedLayer.id, { borderWidth: parseInt(e.target.value) || 0 })
              }
              className="w-full mt-0.5 bg-[#1a1b20] border border-white/[0.1] rounded px-2 py-1 text-xs text-white font-mono"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400">Raio Borda (Radius)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={selectedLayer.borderRadius || 0}
              onChange={(e) =>
                onUpdateLayer(selectedLayer.id, { borderRadius: parseInt(e.target.value) || 0 })
              }
              className="w-full mt-0.5 bg-[#1a1b20] border border-white/[0.1] rounded px-2 py-1 text-xs text-white font-mono"
            />
          </div>
        </div>

        {/* Border Color */}
        {Boolean(selectedLayer.borderWidth) && (
          <div>
            <label className="text-[10px] font-mono text-slate-400 block mb-0.5">Cor da Borda</label>
            <div className="flex items-center gap-1.5 bg-[#1a1b20] border border-white/[0.1] rounded px-2 py-1">
              <input
                type="color"
                value={selectedLayer.borderColor?.startsWith('#') ? selectedLayer.borderColor : '#9333ea'}
                onChange={(e) => onUpdateLayer(selectedLayer.id, { borderColor: e.target.value })}
                className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={selectedLayer.borderColor || '#9333ea'}
                onChange={(e) => onUpdateLayer(selectedLayer.id, { borderColor: e.target.value })}
                className="w-full bg-transparent text-[11px] font-mono text-slate-300 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Glow / Drop Shadow Blur */}
        <div>
          <label className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>Intensidade de Glow / Sombra</span>
            <span className="text-purple-400">{selectedLayer.shadowBlur || 0}px</span>
          </label>
          <input
            type="range"
            min="0"
            max="50"
            value={selectedLayer.shadowBlur || 0}
            onChange={(e) =>
              onUpdateLayer(selectedLayer.id, { shadowBlur: parseInt(e.target.value) || 0 })
            }
            className="w-full mt-1 accent-purple-500 cursor-pointer"
          />
        </div>
      </div>

      {/* 5. STRATEGIC METADATA (ENGENHARIA DE POST) */}
      <div className="p-3.5 space-y-2 bg-[#0e0f12]">
        <div className="flex items-center gap-1.5 text-purple-400 font-mono font-bold text-[11px]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>ENGENHARIA ESTRATÉGICA</span>
        </div>

        <div>
          <label className="text-[10px] font-mono text-slate-400">Zona da Matriz de Conversão</label>
          <select
            value={selectedLayer.zone}
            onChange={(e) => onUpdateLayer(selectedLayer.id, { zone: e.target.value as StrategicZone })}
            className="w-full mt-1 bg-[#1a1b20] border border-white/[0.1] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
          >
            <option value="zone1_hook">Zona 1: Gancho Visual (Topo 35%)</option>
            <option value="zone2_proof">Zona 2: Prova & Autoridade (Centro 40%)</option>
            <option value="zone3_cta">Zona 3: CTA & Conversão (Base 25%)</option>
            <option value="background">Background & Iluminação</option>
            <option value="free">Elemento Livre</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-mono text-slate-400">Papel Estratégico no Post</label>
          <input
            type="text"
            value={selectedLayer.strategicRole || ''}
            onChange={(e) => onUpdateLayer(selectedLayer.id, { strategicRole: e.target.value })}
            placeholder="Ex: Interrupção de scroll <300ms"
            className="w-full mt-1 bg-[#1a1b20] border border-white/[0.1] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>
    </div>
  );
};
