import React, { useState, useEffect, useCallback } from 'react';
import {
  Download,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Target,
  Sliders,
  Layers,
  ShieldCheck,
  Undo2,
  Redo2,
  Maximize2,
  Smartphone,
  Eye,
  Flame,
  Layout,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { EventData } from '../types';
import {
  PostLayer,
  CanvasFormat,
  EditorTool,
  FORMAT_DIMENSIONS,
  PostEngineeringData
} from '../types/postStudio';
import { createDefaultLayersForEvent } from '../utils/defaultLayers';
import { exportCanvasToPng } from '../utils/canvasRenderer';
import { PhotoshopToolbar } from './post-studio/PhotoshopToolbar';
import { PhotoshopCanvas } from './post-studio/PhotoshopCanvas';
import { PhotoshopLayersPanel } from './post-studio/PhotoshopLayersPanel';
import { PhotoshopPropertiesPanel } from './post-studio/PhotoshopPropertiesPanel';
import { PhotoshopAuditPanel } from './post-studio/PhotoshopAuditPanel';
import { PhotoshopDnaPanel, DNA_PRESETS } from './post-studio/PhotoshopDnaPanel';
import { Palette } from 'lucide-react';

interface PostEngineeringStudioProps {
  event: EventData;
}

export const PostEngineeringStudio: React.FC<PostEngineeringStudioProps> = ({ event }) => {
  const [format, setFormat] = useState<CanvasFormat>('feed_4_5');
  const [postObjective, setPostObjective] = useState<
    'virada_lote' | 'lineup_drop' | 'abertura_vendas' | 'd_day'
  >('virada_lote');

  const [currentTool, setCurrentTool] = useState<EditorTool>('select');
  const [showBlueprint, setShowBlueprint] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [zoom, setZoom] = useState(0.48);

  const [activeRightTab, setActiveRightTab] = useState<'layers' | 'properties' | 'dna' | 'audit'>('layers');
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [isGeneratingBg, setIsGeneratingBg] = useState(false);
  const [copiedBriefing, setCopiedBriefing] = useState(false);

  // Layers and undo/redo history
  const [layers, setLayers] = useState<PostLayer[]>(() =>
    createDefaultLayersForEvent(event, 'feed_4_5', 'virada_lote')
  );
  const [history, setHistory] = useState<PostLayer[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Strategic Post Engineering Data
  const [engineeringData, setEngineeringData] = useState<PostEngineeringData>(() => {
    const isStory = format === 'story_9_16';
    const lineupNames =
      (event.lineup || []).map((a) => a.name).join(', ') ||
      'Dennis DJ, MC Caverinha, Illusionize, KVSH';
    return {
      objectiveTitle: 'Virada de Lote Iminente',
      formatDimensions: isStory ? '1080x1920 (9:16 Stories/Reels)' : '1080x1350 (4:5 Feed)',
      zone1_hook: {
        eyebrow: 'AVISO IMPORTANTE · VIRADA PROGRAMADA',
        mainHook: 'A VIRADA É HOJE',
        visualFocalPoint: 'Contraste volumétrico com feixes de luz ultravioleta e silhueta',
        contrastRatio: '8.2:1 (Conformidade WCAG AAA)',
        readingTimeMs: 380
      },
      zone2_proof: {
        headlinerText:
          lineupNames.split(',').slice(0, 2).join(' + ').toUpperCase() || 'DENNIS + MC CAVERINHA',
        supportingActs: lineupNames.split(',').slice(2).join(' · ') || 'ILLUSIONIZE · KVSH · DJ Guga',
        authorityBadge: '3 PALCOS · MAIS DE 10 HORAS DE SOM',
        hierarchyScale: 'Headliner 42px / Suportes 16px / Info 12px',
        eyeFlowPattern: 'Z-Pattern cruzando headliner até o botão de ação'
      },
      zone3_cta: {
        urgencyTrigger: 'MENOS DE 50 UNIDADES DO ' + (event.currentLote || '2º LOTE'),
        primaryCta: 'GARANTA SEU INGRESSO NO GANDAYA',
        dateAndVenue: (event.date || '10 OUT') + ' · ' + (event.venue || 'Macaé, RJ'),
        safeZoneBottomPadding: isStory
          ? 'Margem de 220px para não colidir com direct'
          : 'Margem de 60px para respiro de feed'
      },
      heatmap: {
        primaryHotspot: {
          x: 50,
          y: isStory ? 44 : 40,
          intensity: 0.95,
          label: 'Ponto Focal Headliner (Autoridade)'
        },
        secondaryHotspot: {
          x: 50,
          y: isStory ? 84 : 88,
          intensity: 0.92,
          label: 'Ponto Focal CTA (Ação Imediata)'
        },
        entryHotspot: {
          x: 50,
          y: 14,
          intensity: 0.88,
          label: 'Ponto de Entrada Gancho (Interrupção de Scroll)'
        },
        eyeTrackingFlow:
          'Entrada pelo topo em 300ms -> Varredura central de artistas -> Fixação na escassez e comando de compra'
      },
      scorecard: {
        mobileReadability: 98,
        contrastSafety: 95,
        purchaseIntentIndex: 96,
        scrollStopProbability: 'Alta (89% retenção estimada nos 3 primeiros segundos)',
        conversionAuditNotes: [
          'Proporção tipográfica entre Headliner e CTA respeita a regra 2.5x para zero sobrecarga cognitiva.',
          'Área de respiro periférico garante que a peça funcione tanto no modo escuro quanto no feed do Instagram.',
          'Gatilho de escassez explícito com prazo e lote elimina hesitação de checkout.'
        ]
      },
      colorSystem: {
        primaryHex: '#8B5CF6',
        secondaryHex: '#F59E0B',
        accentHex: '#10B981',
        backgroundHex: '#090B10'
      },
      aiImagePrompt: {
        cinematicPrompt:
          'Ultra-cinematic electronic festival stage at ' +
          (event.venue || 'Macaé beach') +
          ', dramatic ultraviolet and amber rim lights, atmospheric fog, silhouette of enthusiastic festival crowd with raised hands, analog 35mm grain, 8k resolution, Leica M6 look',
        lightingStyle: 'Contraluz volumétrico roxo com recorte âmbar e fumaça cinematográfica',
        negativeConstraints:
          'No cheesy party photos, no low-res flyer text, no distorted neon saturation'
      }
    };
  });

  // Automatically fit zoom on format change
  useEffect(() => {
    if (format === 'story_9_16') {
      setZoom(0.38);
    } else {
      setZoom(0.48);
    }
  }, [format]);

  // Helper to record history state
  const pushToHistory = useCallback(
    (newLayers: PostLayer[]) => {
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        return [...sliced, newLayers];
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex]
  );

  // Update a layer
  const handleUpdateLayer = (id: string, updates: Partial<PostLayer>) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
    );
  };

  // Delete a layer
  const handleDeleteLayer = (id: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== id));
    if (selectedLayerId === id) {
      setSelectedLayerId(null);
    }
  };

  // Duplicate a layer
  const handleDuplicateLayer = (id: string) => {
    const target = layers.find((l) => l.id === id);
    if (!target) return;

    const newLayer: PostLayer = {
      ...target,
      id: `layer-${Date.now()}`,
      name: `${target.name} (Cópia)`,
      x: target.x + 20,
      y: target.y + 20,
      zIndex: Math.max(...layers.map((l) => l.zIndex), 0) + 1
    };

    setLayers((prev) => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
  };

  // Move layer Z-index up or down
  const handleMoveLayerZ = (id: string, direction: 'up' | 'down') => {
    setLayers((prev) => {
      const target = prev.find((l) => l.id === id);
      if (!target) return prev;

      const delta = direction === 'up' ? 1 : -1;
      const newZ = Math.max(1, target.zIndex + delta);

      return prev.map((l) => (l.id === id ? { ...l, zIndex: newZ } : l));
    });
  };

  // Add a new layer
  const handleAddNewLayer = (type: 'text' | 'badge' | 'button' | 'shape') => {
    const dim = FORMAT_DIMENSIONS[format];
    const newZ = Math.max(...layers.map((l) => l.zIndex), 0) + 1;

    let newLayer: PostLayer;

    if (type === 'text') {
      newLayer = {
        id: `layer-text-${Date.now()}`,
        name: 'Novo Texto',
        type: 'text',
        zone: 'free',
        x: Math.round(dim.width * 0.1),
        y: Math.round(dim.height * 0.4),
        width: Math.round(dim.width * 0.8),
        height: 60,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        zIndex: newZ,
        content: 'NOVA FRASE DE IMPACTO',
        fontFamily: 'Inter, sans-serif',
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 2
      };
    } else if (type === 'badge') {
      newLayer = {
        id: `layer-badge-${Date.now()}`,
        name: 'Novo Selo de Autoridade',
        type: 'badge',
        zone: 'zone2_proof',
        x: Math.round(dim.width * 0.2),
        y: Math.round(dim.height * 0.35),
        width: Math.round(dim.width * 0.6),
        height: 40,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        zIndex: newZ,
        content: '★ SELO DE QUALIDADE PREMIUM',
        fontFamily: 'Inter, sans-serif',
        fontSize: 16,
        fontWeight: '700',
        color: '#FDE047',
        backgroundColor: 'rgba(234, 179, 8, 0.15)',
        borderColor: 'rgba(234, 179, 8, 0.4)',
        borderWidth: 1,
        borderRadius: 20
      };
    } else if (type === 'button') {
      newLayer = {
        id: `layer-btn-${Date.now()}`,
        name: 'Novo Botão de Conversão',
        type: 'button',
        zone: 'zone3_cta',
        x: Math.round(dim.width * 0.15),
        y: Math.round(dim.height * 0.78),
        width: Math.round(dim.width * 0.7),
        height: 70,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        zIndex: newZ,
        content: 'CLIQUE AQUI E COMPRE AGORA',
        fontFamily: 'Inter, sans-serif',
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
        backgroundColor: '#9333EA',
        borderColor: '#C084FC',
        borderWidth: 2,
        borderRadius: 8,
        shadowColor: 'rgba(147, 51, 234, 0.5)',
        shadowBlur: 16
      };
    } else {
      newLayer = {
        id: `layer-shape-${Date.now()}`,
        name: 'Nova Forma / Glow',
        type: 'shape',
        zone: 'background',
        x: Math.round(dim.width * 0.2),
        y: Math.round(dim.height * 0.25),
        width: 300,
        height: 300,
        rotation: 0,
        opacity: 0.4,
        visible: true,
        locked: false,
        zIndex: newZ,
        backgroundColor: '#7C3AED',
        borderRadius: 150,
        shapeType: 'rectangle'
      };
    }

    setLayers((prev) => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
    setActiveRightTab('properties');
  };

  // Reset to default strategic layers
  const handleResetToStrategicDefault = () => {
    const fresh = createDefaultLayersForEvent(event, format, postObjective);
    setLayers(fresh);
    setSelectedLayerId(null);
  };

  // Run AI Post Engineering recalculation
  const handleRunAiEngineering = async () => {
    setIsLoadingAi(true);
    try {
      const res = await fetch('/api/agent/post-engineer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          postObjective,
          format,
          customDirective:
            'Engenharia de post brutalista de alta conversão, foco em escassez e autoridade de artistas.'
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setEngineeringData(json.data);
      }
    } catch (e) {
      console.error('Error running AI post engineer:', e);
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Generate Conceptual AI Image and set as background
  const handleGenerateConceptualBg = async () => {
    setIsGeneratingBg(true);
    try {
      const res = await fetch('/api/agent/generate-conceptual-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: engineeringData.aiImagePrompt.cinematicPrompt,
          aspectRatio: format === 'story_9_16' ? '9:16' : '4:3'
        })
      });
      const json = await res.json();
      if (json.success && json.imageUrl) {
        const dim = FORMAT_DIMENSIONS[format];
        // Check if an image layer exists, else insert right above base canvas
        setLayers((prev) => {
          const existingImg = prev.find((l) => l.type === 'image');
          if (existingImg) {
            return prev.map((l) =>
              l.id === existingImg.id ? { ...l, imageUrl: json.imageUrl, visible: true } : l
            );
          } else {
            const newImgLayer: PostLayer = {
              id: `layer-ai-bg-${Date.now()}`,
              name: 'Imagem Conceitual IA',
              type: 'image',
              zone: 'background',
              x: 0,
              y: 0,
              width: dim.width,
              height: dim.height,
              rotation: 0,
              opacity: 0.7,
              visible: true,
              locked: false,
              zIndex: 3,
              imageUrl: json.imageUrl,
              strategicRole: 'Atmosfera imersiva gerada por inteligência artificial'
            };
            return [...prev, newImgLayer];
          }
        });
      }
    } catch (e) {
      console.error('Error generating AI conceptual image:', e);
    } finally {
      setIsGeneratingBg(false);
    }
  };

  // Export high-res PNG
  const handleExportPng = async () => {
    setIsExportingPng(true);
    try {
      const dim = FORMAT_DIMENSIONS[format];
      const filename = `arte-${event.name.toLowerCase().replace(/\s+/g, '-')}-${format}.png`;
      await exportCanvasToPng(layers, dim, filename);
    } catch (e) {
      console.error('Export error:', e);
    } finally {
      setIsExportingPng(false);
    }
  };

  // Copy designer technical briefing
  const handleCopyBriefing = () => {
    const briefingText = [
      '# BRIEFING TÉCNICO DE ENGENHARIA DE POST - INSOMNIA FESTIVAL',
      `Evento: ${event.name}`,
      `Objetivo: ${engineeringData.objectiveTitle}`,
      `Formato: ${FORMAT_DIMENSIONS[format].label}`,
      '',
      '============================================================',
      '1. MATRIZ DE 3 ZONAS E HIERARQUIA VISUAL',
      '============================================================',
      '[ZONA 1: GANCHO VISUAL - TOPO 35%]',
      `- Eyebrow: ${engineeringData.zone1_hook.eyebrow}`,
      `- Headline de Impacto: ${engineeringData.zone1_hook.mainHook}`,
      `- Ponto Focal: ${engineeringData.zone1_hook.visualFocalPoint}`,
      `- Tempo de Leitura: < ${engineeringData.zone1_hook.readingTimeMs}ms`,
      '',
      '[ZONA 2: PROVA DE LINEUP & AUTORIDADE - CENTRO 40%]',
      `- Headliners: ${engineeringData.zone2_proof.headlinerText}`,
      `- Suportes: ${engineeringData.zone2_proof.supportingActs}`,
      `- Selo de Autoridade: ${engineeringData.zone2_proof.authorityBadge}`,
      `- Escala Hierárquica: ${engineeringData.zone2_proof.hierarchyScale}`,
      '',
      '[ZONA 3: CTA & CONVERSÃO - BASE 25%]',
      `- Gatilho de Escassez: ${engineeringData.zone3_cta.urgencyTrigger}`,
      `- Botão de Compra: ${engineeringData.zone3_cta.primaryCta}`,
      `- Data e Local: ${engineeringData.zone3_cta.dateAndVenue}`,
      `- Safe Zone: ${engineeringData.zone3_cta.safeZoneBottomPadding}`,
      '',
      '============================================================',
      '2. AUDITORIA DE CONVERSÃO',
      '============================================================',
      `- Mobile UX: ${engineeringData.scorecard.mobileReadability}%`,
      `- Contraste WCAG AAA: ${engineeringData.scorecard.contrastSafety}%`,
      `- Intenção de Compra: ${engineeringData.scorecard.purchaseIntentIndex}%`,
      `- Scroll Stop: ${engineeringData.scorecard.scrollStopProbability}`
    ].join('\n');

    navigator.clipboard.writeText(briefingText);
    setCopiedBriefing(true);
    setTimeout(() => setCopiedBriefing(false), 2000);
  };

  // Apply a color palette across all layers
  const handleApplyGlobalPalette = (palette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface?: string;
  }) => {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id === 'layer-bg-canvas') {
          return { ...l, backgroundColor: palette.background };
        }
        if (l.id === 'layer-ambient-glow') {
          return { ...l, backgroundColor: palette.primary };
        }
        if (l.id === 'layer-z1-eyebrow') {
          return {
            ...l,
            color: palette.primary,
            borderColor: `${palette.primary}66`,
            backgroundColor: `${palette.primary}26`
          };
        }
        if (l.id === 'layer-z1-hook-title') {
          return {
            ...l,
            shadowColor: `${palette.primary}80`
          };
        }
        if (l.id === 'layer-z2-authority-badge') {
          return {
            ...l,
            color: palette.secondary,
            borderColor: `${palette.secondary}66`,
            backgroundColor: `${palette.secondary}26`
          };
        }
        if (l.id === 'layer-z3-urgency') {
          return { ...l, color: palette.accent };
        }
        if (l.id === 'layer-z3-cta-btn') {
          return {
            ...l,
            backgroundColor: palette.primary,
            borderColor: palette.secondary,
            shadowColor: `${palette.primary}80`
          };
        }
        return l;
      })
    );
  };

  // Load a complete visual preset (palette + typography + styling)
  const handleApplyPreset = (presetKey: string) => {
    const preset = DNA_PRESETS.find((p) => p.key === presetKey);
    if (!preset) return;

    handleApplyGlobalPalette(preset.palette);

    setLayers((prev) =>
      prev.map((l) => {
        if (l.id === 'layer-z1-hook-title') {
          return { ...l, fontFamily: preset.fonts.hook };
        }
        if (l.id === 'layer-z2-headliners') {
          return { ...l, fontFamily: preset.fonts.lineup };
        }
        if (
          l.id === 'layer-z1-eyebrow' ||
          l.id === 'layer-z3-urgency' ||
          l.id === 'layer-z3-date-venue'
        ) {
          return { ...l, fontFamily: preset.fonts.meta };
        }
        return l;
      })
    );
  };

  // Set conceptual AI image prompt
  const handleSetAiPrompt = (prompt: string) => {
    setEngineeringData((prev) => ({
      ...prev,
      aiImagePrompt: {
        ...prev.aiImagePrompt,
        cinematicPrompt: prompt
      }
    }));
  };

  const selectedLayer = layers.find((l) => l.id === selectedLayerId) || null;
  const dim = FORMAT_DIMENSIONS[format];

  return (
    <div className="flex flex-col h-[820px] bg-[#0c0d10] border border-white/[0.08] rounded-[6px] overflow-hidden select-none shadow-2xl">
      {/* 1. TOP CONTROL BAR (PHOTOSHOP DARK DOCK) */}
      <header className="h-13 bg-[#14151a] border-b border-white/[0.08] px-4 flex items-center justify-between gap-4 z-30 shrink-0">
        {/* LEFT: TITLE & OBJECTIVE */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span className="font-mono text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-purple-400" />
              <span>Estúdio de Engenharia de Post</span>
            </span>
          </div>

          <div className="h-4 w-[1px] bg-white/[0.1]" />

          {/* Objective preset dropdown */}
          <select
            value={postObjective}
            onChange={(e) => {
              const val = e.target.value as any;
              setPostObjective(val);
              setLayers(createDefaultLayersForEvent(event, format, val));
            }}
            className="bg-[#1e1f26] border border-white/[0.1] rounded px-2.5 py-1 text-xs text-slate-200 font-medium focus:outline-none focus:border-purple-500"
          >
            <option value="virada_lote">Virada de Lote Iminente</option>
            <option value="lineup_drop">Lineup Oficial Revelado</option>
            <option value="abertura_vendas">Abertura de Vendas Lote Promo</option>
            <option value="d_day">D-Day Portões Abertos</option>
          </select>
        </div>

        {/* CENTER: FORMAT SELECTOR (FEED 4:5 VS STORIES 9:16) */}
        <div className="flex items-center gap-1 bg-[#1e1f26] p-1 rounded border border-white/[0.08]">
          <button
            onClick={() => {
              setFormat('feed_4_5');
              setLayers(createDefaultLayersForEvent(event, 'feed_4_5', postObjective));
            }}
            className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              format === 'feed_4_5'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>Feed 4:5 (1080×1350)</span>
          </button>

          <button
            onClick={() => {
              setFormat('story_9_16');
              setLayers(createDefaultLayersForEvent(event, 'story_9_16', postObjective));
            }}
            className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              format === 'story_9_16'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Stories 9:16 (1080×1920)</span>
          </button>
        </div>

        {/* RIGHT: STRATEGIC ACTIONS & EXPORT */}
        <div className="flex items-center gap-2">
          {/* Reset Template */}
          <button
            onClick={handleResetToStrategicDefault}
            title="Restaurar Padrão Estratégico de Camadas"
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer border border-white/[0.06]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* AI Recalculate */}
          <button
            onClick={handleRunAiEngineering}
            disabled={isLoadingAi}
            className="px-3 py-1.5 rounded font-mono text-xs font-semibold bg-[#1e1f26] hover:bg-[#272832] text-purple-300 border border-purple-500/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>{isLoadingAi ? 'Calculando...' : 'IA Estratégica'}</span>
          </button>

          {/* Export PNG */}
          <button
            onClick={handleExportPng}
            disabled={isExportingPng}
            className="px-3.5 py-1.5 rounded font-mono text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-950/60 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExportingPng ? 'Exportando PNG...' : 'Baixar PNG HD'}</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN 3-COLUMN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT TOOLBAR */}
        <PhotoshopToolbar
          currentTool={currentTool}
          onSelectTool={setCurrentTool}
          showBlueprint={showBlueprint}
          onToggleBlueprint={() => setShowBlueprint((p) => !p)}
          showHeatmap={showHeatmap}
          onToggleHeatmap={() => setShowHeatmap((p) => !p)}
          showSafeZones={showSafeZones}
          onToggleSafeZones={() => setShowSafeZones((p) => !p)}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid((p) => !p)}
          zoom={zoom}
          onZoomIn={() => setZoom((z) => Math.min(1.2, z + 0.05))}
          onZoomOut={() => setZoom((z) => Math.max(0.2, z - 0.05))}
          onZoomFit={() => setZoom(format === 'story_9_16' ? 0.38 : 0.48)}
          onAddNewLayer={handleAddNewLayer}
        />

        {/* CENTER INTERACTIVE CANVAS VIEWPORT */}
        <PhotoshopCanvas
          layers={layers}
          selectedLayerId={selectedLayerId}
          onSelectLayer={(id) => {
            setSelectedLayerId(id);
            if (id && activeRightTab === 'audit') {
              setActiveRightTab('properties');
            }
          }}
          onUpdateLayer={handleUpdateLayer}
          dimensions={dim}
          zoom={zoom}
          showBlueprint={showBlueprint}
          showHeatmap={showHeatmap}
          showSafeZones={showSafeZones}
          showGrid={showGrid}
          engineeringData={engineeringData}
        />

        {/* RIGHT DOCKED SIDEBAR (CAMADAS | PROPRIEDADES | DNA VISUAL | AUDITORIA) */}
        <aside className="w-88 bg-[#121316] border-l border-white/[0.08] flex flex-col shrink-0 z-20">
          {/* TAB HEADERS */}
          <div className="flex items-center border-b border-white/[0.08] bg-[#16171c]">
            <button
              onClick={() => setActiveRightTab('layers')}
              title="Árvore de Camadas"
              className={`flex-1 py-2.5 text-[11px] font-mono font-bold uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeRightTab === 'layers'
                  ? 'border-purple-500 text-purple-300 bg-[#121316]'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="truncate">Camadas</span>
            </button>

            <button
              onClick={() => setActiveRightTab('properties')}
              title="Propriedades da Camada"
              className={`flex-1 py-2.5 text-[11px] font-mono font-bold uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeRightTab === 'properties'
                  ? 'border-purple-500 text-purple-300 bg-[#121316]'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="truncate">Props</span>
            </button>

            <button
              onClick={() => setActiveRightTab('dna')}
              title="DNA Visual & Presets de Estilo"
              className={`flex-1 py-2.5 text-[11px] font-mono font-bold uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeRightTab === 'dna'
                  ? 'border-purple-500 text-purple-300 bg-[#121316]'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="truncate">DNA</span>
            </button>

            <button
              onClick={() => setActiveRightTab('audit')}
              title="Auditoria de Conversão"
              className={`flex-1 py-2.5 text-[11px] font-mono font-bold uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeRightTab === 'audit'
                  ? 'border-purple-500 text-purple-300 bg-[#121316]'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="truncate">Auditoria</span>
            </button>
          </div>

          {/* TAB CONTENTS */}
          <div className="flex-1 overflow-hidden">
            {activeRightTab === 'layers' && (
              <PhotoshopLayersPanel
                layers={layers}
                selectedLayerId={selectedLayerId}
                onSelectLayer={(id) => {
                  setSelectedLayerId(id);
                }}
                onUpdateLayer={handleUpdateLayer}
                onDeleteLayer={handleDeleteLayer}
                onDuplicateLayer={handleDuplicateLayer}
                onMoveLayerZ={handleMoveLayerZ}
                onAddNewLayer={handleAddNewLayer}
              />
            )}

            {activeRightTab === 'properties' && (
              <PhotoshopPropertiesPanel
                selectedLayer={selectedLayer}
                onUpdateLayer={handleUpdateLayer}
                canvasDimensions={dim}
              />
            )}

            {activeRightTab === 'dna' && (
              <PhotoshopDnaPanel
                event={event}
                layers={layers}
                selectedLayer={selectedLayer}
                onUpdateLayer={handleUpdateLayer}
                onApplyGlobalPalette={handleApplyGlobalPalette}
                onApplyPreset={handleApplyPreset}
                onSetAiPrompt={handleSetAiPrompt}
              />
            )}

            {activeRightTab === 'audit' && (
              <PhotoshopAuditPanel
                engineeringData={engineeringData}
                onGenerateConceptualBg={handleGenerateConceptualBg}
                isGeneratingBg={isGeneratingBg}
                onCopyBriefing={handleCopyBriefing}
                copiedBriefing={copiedBriefing}
              />
            )}
          </div>
        </aside>
      </div>

      {/* 3. BOTTOM WORKSPACE STATUS BAR */}
      <footer className="h-7 bg-[#0f1013] border-t border-white/[0.06] px-4 flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <span>
            Resolução Nativa: <strong className="text-slate-200">{dim.width} × {dim.height}px ({dim.aspectRatio})</strong>
          </span>
          <span>·</span>
          <span>
            Camadas Ativas: <strong className="text-purple-400">{layers.filter((l) => l.visible).length} / {layers.length}</strong>
          </span>
          {selectedLayer && (
            <>
              <span>·</span>
              <span>
                Selecionado: <strong className="text-white">{selectedLayer.name}</strong> ({selectedLayer.x}px, {selectedLayer.y}px · {selectedLayer.width}×{selectedLayer.height}px)
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400">Atalhos: [V] Mover · [Setas] Ajuste fino · [Shift+Setas] 10px</span>
        </div>
      </footer>
    </div>
  );
};
