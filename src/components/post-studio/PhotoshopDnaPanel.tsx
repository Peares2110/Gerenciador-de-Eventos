import React, { useState } from 'react';
import {
  Palette,
  Sparkles,
  Check,
  Copy,
  Layers,
  ShieldCheck,
  Zap,
  Sliders,
  Type,
  CheckCircle2,
  AlertCircle,
  Wand2
} from 'lucide-react';
import { EventData } from '../../types';
import { PostLayer } from '../../types/postStudio';

interface PhotoshopDnaPanelProps {
  event: EventData;
  layers: PostLayer[];
  selectedLayer: PostLayer | null;
  onUpdateLayer: (id: string, updates: Partial<PostLayer>) => void;
  onApplyGlobalPalette: (palette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface?: string;
  }) => void;
  onApplyPreset: (presetKey: string) => void;
  onSetAiPrompt?: (prompt: string) => void;
}

export const DNA_PRESETS = [
  {
    key: 'event_official',
    name: 'DNA Oficial do Evento',
    description: 'Paleta e regras mestras configuradas para o festival atual',
    palette: {
      primary: '#9333EA',
      secondary: '#F59E0B',
      accent: '#10B981',
      background: '#090B10',
      surface: '#151324'
    },
    fonts: {
      hook: 'Impact, sans-serif',
      lineup: 'Oswald, sans-serif',
      meta: 'JetBrains Mono, monospace'
    }
  },
  {
    key: 'ultraviolet_brutalist',
    name: 'Ultraviolet & Obsidian',
    description: 'Estética noturna densa com contraste extremo e feixe ultravioleta',
    palette: {
      primary: '#A855F7',
      secondary: '#EAB308',
      accent: '#F43F5E',
      background: '#05050A',
      surface: '#120E22'
    },
    fonts: {
      hook: 'Impact, sans-serif',
      lineup: 'Oswald, sans-serif',
      meta: 'JetBrains Mono, monospace'
    }
  },
  {
    key: 'cyber_acid',
    name: 'Cyber Rave Acid',
    description: 'Verde ácido fluorescente com ciano elétrico e preto absoluto',
    palette: {
      primary: '#84CC16',
      secondary: '#06B6D4',
      accent: '#E11D48',
      background: '#000000',
      surface: '#0A1208'
    },
    fonts: {
      hook: 'Syne, sans-serif',
      lineup: 'Montserrat, sans-serif',
      meta: 'JetBrains Mono, monospace'
    }
  },
  {
    key: 'sunset_festival',
    name: 'Sunset Golden Hour',
    description: 'Tons quentes de pôr do sol, dourado metálico e vinho profundo',
    palette: {
      primary: '#F59E0B',
      secondary: '#EC4899',
      accent: '#10B981',
      background: '#0D070B',
      surface: '#1E0E18'
    },
    fonts: {
      hook: 'Oswald, sans-serif',
      lineup: 'Inter, sans-serif',
      meta: 'JetBrains Mono, monospace'
    }
  }
];

export const PhotoshopDnaPanel: React.FC<PhotoshopDnaPanelProps> = ({
  event,
  layers,
  selectedLayer,
  onUpdateLayer,
  onApplyGlobalPalette,
  onApplyPreset,
  onSetAiPrompt
}) => {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);

  const eventPalette = event.artDirection?.colorPalette || {
    primary: '#9333EA',
    secondary: '#F59E0B',
    accent: '#10B981',
    background: '#090B10',
    surface: '#141126'
  };

  const handleCopyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
  };

  const triggerFeedback = (msg: string) => {
    setSuccessFeedback(msg);
    setTimeout(() => setSuccessFeedback(null), 2500);
  };

  const handleApplyColorToSelected = (hex: string, target: 'color' | 'backgroundColor' | 'borderColor') => {
    if (!selectedLayer) return;
    onUpdateLayer(selectedLayer.id, { [target]: hex });
    triggerFeedback(`Cor ${hex} aplicada ao ${target === 'color' ? 'texto' : target === 'backgroundColor' ? 'fundo' : 'borda'}!`);
  };

  const paletteItems = [
    { label: 'Primária (Identidade)', hex: eventPalette.primary, role: 'Headlines, destaques principais e botões' },
    { label: 'Secundária (Autoridade)', hex: eventPalette.secondary, role: 'Selos de lineup, badges e luzes de preenchimento' },
    { label: 'Acento (Conversão / Escassez)', hex: eventPalette.accent, role: 'Avisos de lote, urgência e gatilhos de checkout' },
    { label: 'Fundo Atmosférico', hex: eventPalette.background, role: 'Base escura de contraste profundo' },
    { label: 'Superfície / Cards', hex: eventPalette.surface || '#141126', role: 'Containers secundários e molduras' }
  ];

  return (
    <div className="flex flex-col h-full bg-[#121316] text-white overflow-y-auto divide-y divide-white/[0.08] select-none text-xs">
      {/* SUCCESS NOTIFICATION TOAST */}
      {successFeedback && (
        <div className="bg-purple-900/90 text-purple-100 px-3 py-2 text-[11px] font-mono flex items-center gap-1.5 animate-in fade-in sticky top-0 z-30 shadow-lg border-b border-purple-500/50">
          <CheckCircle2 className="w-3.5 h-3.5 text-purple-300 shrink-0" />
          <span>{successFeedback}</span>
        </div>
      )}

      {/* 1. BRAND DNA HEADER */}
      <div className="p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-purple-400 font-mono font-bold text-xs uppercase">
            <Palette className="w-4 h-4" />
            <span>DNA Visual Integrado</span>
          </div>
          <span className="text-[10px] font-mono text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/40">
            {event.genre}
          </span>
        </div>

        <div className="p-2.5 rounded bg-[#18191f] border border-white/[0.06] space-y-1">
          <div className="text-[11px] font-bold text-white flex items-center justify-between">
            <span>{event.artDirection?.themeName || 'Diretriz de Arte Gandaya'}</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            {event.artDirection?.visualStyle || 'Estética brutalista noturna para retenção acelerada no feed e stories.'}
          </p>
        </div>
      </div>

      {/* 2. OFFICIAL PALETTE SWATCHES & QUICK INJECTION */}
      <div className="p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-300 font-bold uppercase tracking-wider">
            Paleta de Cores do Evento
          </span>
          <button
            onClick={() => {
              onApplyGlobalPalette(eventPalette);
              triggerFeedback('Paleta oficial sincronizada em todas as camadas!');
            }}
            className="text-[10px] font-mono px-2 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
            title="Sincronizar todas as camadas com as cores do DNA"
          >
            <Wand2 className="w-3 h-3" />
            <span>Aplicar no Post</span>
          </button>
        </div>

        <div className="space-y-2">
          {paletteItems.map((item, idx) => (
            <div
              key={idx}
              className="p-2 rounded bg-[#18191f] border border-white/[0.06] flex items-center justify-between gap-2 hover:border-white/[0.12] transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-7 h-7 rounded shadow-inner ring-1 ring-white/20 shrink-0"
                  style={{ backgroundColor: item.hex }}
                />
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-slate-200 truncate flex items-center gap-1.5">
                    <span>{item.label.split('(')[0]}</span>
                    <span className="text-[10px] font-mono text-slate-400">{item.hex}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{item.role}</div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center gap-1 shrink-0">
                {selectedLayer ? (
                  <>
                    <button
                      onClick={() => handleApplyColorToSelected(item.hex, 'color')}
                      className="px-1.5 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.12] text-[10px] font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Aplicar como cor do texto na camada selecionada"
                    >
                      Texto
                    </button>
                    <button
                      onClick={() => handleApplyColorToSelected(item.hex, 'backgroundColor')}
                      className="px-1.5 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.12] text-[10px] font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Aplicar como fundo na camada selecionada"
                    >
                      Fundo
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleCopyColor(item.hex)}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                    title="Copiar código HEX"
                  >
                    {copiedHex === item.hex ? (
                      <Check className="w-3.5 h-3.5 text-purple-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {selectedLayer && (
          <div className="p-2 rounded bg-purple-950/20 border border-purple-800/30 text-[10px] text-purple-300 font-mono flex items-center justify-between">
            <span>Camada ativa: <strong>{selectedLayer.name}</strong></span>
            <span className="text-slate-400">Clique em "Texto" ou "Fundo" acima</span>
          </div>
        )}
      </div>

      {/* 3. ART DIRECTION PRESETS */}
      <div className="p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-300 font-bold uppercase tracking-wider">
            Presets Visuais Estratégicos
          </span>
          <span className="text-[10px] font-mono text-slate-500">4 Estilos</span>
        </div>

        <div className="space-y-2">
          {DNA_PRESETS.map((preset) => (
            <div
              key={preset.key}
              className="p-2.5 rounded bg-[#18191f] border border-white/[0.06] hover:border-purple-500/40 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[11px] font-bold text-white">{preset.name}</h4>
                  <p className="text-[10px] text-slate-400">{preset.description}</p>
                </div>
                <button
                  onClick={() => {
                    onApplyPreset(preset.key);
                    triggerFeedback(`Preset "${preset.name}" carregado nas camadas!`);
                  }}
                  className="px-2.5 py-1 rounded bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Zap className="w-3 h-3 text-purple-400" />
                  <span>Carregar</span>
                </button>
              </div>

              {/* Mini color swatches bar */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <div className="w-3.5 h-3.5 rounded-sm shadow-sm ring-1 ring-white/10" style={{ backgroundColor: preset.palette.primary }} />
                <div className="w-3.5 h-3.5 rounded-sm shadow-sm ring-1 ring-white/10" style={{ backgroundColor: preset.palette.secondary }} />
                <div className="w-3.5 h-3.5 rounded-sm shadow-sm ring-1 ring-white/10" style={{ backgroundColor: preset.palette.accent }} />
                <div className="w-3.5 h-3.5 rounded-sm shadow-sm ring-1 ring-white/10" style={{ backgroundColor: preset.palette.background }} />
                <span className="text-[10px] font-mono text-slate-500 ml-1">
                  {preset.fonts.hook.split(',')[0]} + {preset.fonts.lineup.split(',')[0]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. DO'S & DON'TS OF THE BRAND DNA */}
      {event.artDirection && (event.artDirection.dosList?.length > 0 || event.artDirection.dontsList?.length > 0) && (
        <div className="p-3.5 space-y-2.5">
          <span className="text-[11px] font-mono text-slate-300 font-bold uppercase tracking-wider block">
            Regras de Consistência Visual
          </span>

          {event.artDirection.dosList?.length > 0 && (
            <div className="p-2 rounded bg-emerald-950/20 border border-emerald-500/20 space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>O que Fazer (Padrão de Elite):</span>
              </span>
              <ul className="text-[10px] text-slate-300 space-y-0.5 list-disc pl-3.5">
                {event.artDirection.dosList.slice(0, 3).map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}

          {event.artDirection.dontsList?.length > 0 && (
            <div className="p-2 rounded bg-red-950/20 border border-red-500/20 space-y-1">
              <span className="text-[10px] font-bold text-red-400 uppercase font-mono flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>O que Vetar (Anticlichê):</span>
              </span>
              <ul className="text-[10px] text-slate-300 space-y-0.5 list-disc pl-3.5">
                {event.artDirection.dontsList.slice(0, 3).map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 5. PRE-CONFIGURED SAMPLE PROMPTS FROM DNA */}
      {event.artDirection?.samplePrompts && event.artDirection.samplePrompts.length > 0 && (
        <div className="p-3.5 space-y-2.5">
          <span className="text-[11px] font-mono text-slate-300 font-bold uppercase tracking-wider block">
            Prompts de IA Integrados ao DNA
          </span>

          <div className="space-y-2">
            {event.artDirection.samplePrompts.map((p, idx) => (
              <div key={idx} className="p-2 rounded bg-[#18191f] border border-white/[0.06] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-purple-300">{p.name}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/40">
                    {p.ratio}
                  </span>
                </div>
                <p className="font-mono text-[10px] text-slate-300 line-clamp-2 leading-relaxed">
                  {p.prompt}
                </p>
                <div className="flex items-center justify-end gap-1.5 pt-1">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(p.prompt);
                      triggerFeedback('Prompt copiado para a área de transferência!');
                    }}
                    className="px-2 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.1] text-[10px] text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copiar</span>
                  </button>
                  {onSetAiPrompt && (
                    <button
                      onClick={() => {
                        onSetAiPrompt(p.prompt);
                        triggerFeedback('Prompt definido para geração de fundo IA!');
                      }}
                      className="px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-500 text-[10px] text-white font-semibold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Usar no Gerador</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
