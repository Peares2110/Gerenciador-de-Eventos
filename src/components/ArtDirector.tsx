import React, { useState } from 'react';
import { 
  Palette, 
  Sparkles, 
  Check, 
  X, 
  Copy, 
  ShieldCheck, 
  Zap, 
  Image as ImageIcon,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { EventData } from '../types';
import { SheetsExportButton } from './SheetsExportButton';
import { PostEngineeringStudio } from './PostEngineeringStudio';
import { Target } from 'lucide-react';

interface ArtDirectorProps {
  event: EventData;
}

export const ArtDirector: React.FC<ArtDirectorProps> = ({ event }) => {
  const [activeMode, setActiveMode] = useState<'post_engineering' | 'classic_dna'>('post_engineering');

  const [assetType, setAssetType] = useState('Arte de Feed 4:5 & Story 9:16 para Virada de Lote');
  const [customStyleRequest, setCustomStyleRequest] = useState('Preservar estética roxo e preto, granulação 35mm analógica, contraluz ultravioleta e tipografia brutalista refinada.');
  const [isLoading, setIsLoading] = useState(false);
  const [directorOutput, setDirectorOutput] = useState<any>(null);
  const [copiedPromptIndex, setCopiedPromptIndex] = useState<number | null>(null);
  const [copiedColorHex, setCopiedColorHex] = useState<string | null>(null);

  // Generate Token-Optimized Prompts and Visual Guidelines
  const handleGenerateBrief = async () => {
    setIsLoading(true);

    try {
      const res = await fetch('/api/agent/art-director', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          assetType,
          themeRequest: customStyleRequest
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setDirectorOutput(data.data);
      }
    } catch (err) {
      console.error('Art director error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyText = (text: string, type: 'prompt' | 'hex', index?: number) => {
    navigator.clipboard.writeText(text);
    if (type === 'prompt' && index !== undefined) {
      setCopiedPromptIndex(index);
      setTimeout(() => setCopiedPromptIndex(null), 2000);
    } else if (type === 'hex') {
      setCopiedColorHex(text);
      setTimeout(() => setCopiedColorHex(null), 1800);
    }
  };

  // Google Sheets Export Data
  const sheetsHeaders = ['Categoria', 'Identificador', 'Diretriz / Valor', 'Economia de Tokens / Detalhes'];
  const sheetsRows: (string | number)[][] = [
    ['DNA Visual', 'Tema do Evento', event.artDirection.themeName, event.artDirection.visualStyle],
    ['Paleta de Cores', 'Cor Primária', event.artDirection.colorPalette.primary, 'Roxo Vibrante de Destaque'],
    ['Paleta de Cores', 'Cor Secundária', event.artDirection.colorPalette.secondary, 'Preto Profundo Noturno'],
    ['Paleta de Cores', 'Cor de Acento', event.artDirection.colorPalette.accent, 'Violeta Neon para CTAs'],
    ['Paleta de Cores', 'Background', event.artDirection.colorPalette.background, 'Obsidiana Midnight'],
  ];

  event.artDirection.dosList.forEach((d, i) => {
    sheetsRows.push(['Diretriz Aprovada (DO)', `Regra #${i+1}`, d, 'Consistência de Elite']);
  });

  event.artDirection.dontsList.forEach((d, i) => {
    sheetsRows.push(['Diretriz Vetada (DON\'T)', `Veto #${i+1}`, d, 'Anti-Clichê / Slop']);
  });

  if (directorOutput?.tokenOptimizedPrompts) {
    directorOutput.tokenOptimizedPrompts.forEach((p: any) => {
      sheetsRows.push(['Prompt Otimizado', `${p.name} (${p.aspectRatio})`, p.prompt, `~${p.tokenCountEstimate} tokens | Negativo: ${p.negativePromptConstraints}`]);
    });
  }

  return (
    <div className="space-y-6">
      {/* SELETOR DE MODO: ENGENHARIA DE POST VS DNA VISUAL CLÁSSICO */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3 flex-wrap">
        <button
          onClick={() => setActiveMode('post_engineering')}
          className={'px-3.5 py-1.5 rounded-[2px] font-mono text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ' + (
            activeMode === 'post_engineering'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white bg-[#1c1c21]'
          )}
        >
          <Target className="w-3.5 h-3.5 text-purple-300" />
          <span>Engenharia de Post & Conversão Visual</span>
          <span className="badge-tech bg-purple-950/80 text-purple-200 border-purple-400/40">
            Matriz 3 Zonas + Heatmap
          </span>
        </button>

        <button
          onClick={() => setActiveMode('classic_dna')}
          className={'px-3.5 py-1.5 rounded-[2px] font-mono text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ' + (
            activeMode === 'classic_dna'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white bg-[#1c1c21]'
          )}
        >
          <Palette className="w-3.5 h-3.5 text-purple-300" />
          <span>Manual de DNA Visual & Prompts de IA</span>
        </button>
      </div>

      {/* RENDERIZAÇÃO DO MODO SELECIONADO */}
      {activeMode === 'post_engineering' ? (
        <PostEngineeringStudio event={event} />
      ) : (
        <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header Banner - Purple & Black */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0b0816] p-5 sm:p-6 rounded-2xl border border-purple-950/70 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-300 mb-1">
            <Palette className="w-3.5 h-3.5 text-purple-400" />
            <span>DIRETOR DE ARTE & IDENTIDADE VISUAL</span>
            <span>·</span>
            <span className="text-slate-400">Padrão de Elite & Economia de Tokens</span>
          </div>
          <h2 className="font-display text-xl font-black text-white">
            DNA da Festa & Prompts de Alta Densidade
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Garante consistência estética inquebrável, veta clichês de IA e constrói diretrizes visuais precisas sem desperdício de tokens.
          </p>
        </div>

        <SheetsExportButton
          filename={`DNA_Visual_${event.id}`}
          title={`Manual de Identidade Visual e Prompts - ${event.name}`}
          headers={sheetsHeaders}
          rows={sheetsRows}
          label="Exportar Guia de Arte"
        />
      </div>

      {/* Visual DNA Grid: Theme, Palette, Do's & Don'ts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Style Summary & Palette */}
        <div className="bg-[#0b0816] border border-purple-950/70 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-400" />
              DNA Cromático & Estilo
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/50">
              {event.artDirection.themeName}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-[#120d24] p-3 rounded-xl border border-purple-900/40">
            {event.artDirection.visualStyle}
          </p>

          {/* Color Palette Swatches */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">
              Paleta Oficial (Clique para Copiar HEX):
            </span>
            <div className="grid grid-cols-5 gap-2">
              {[
                { label: 'Primária', hex: event.artDirection.colorPalette.primary || '#a855f7' },
                { label: 'Secundária', hex: event.artDirection.colorPalette.secondary || '#06050a' },
                { label: 'Acento', hex: event.artDirection.colorPalette.accent || '#c084fc' },
                { label: 'Fundo', hex: event.artDirection.colorPalette.background || '#06050a' },
                { label: 'Card', hex: event.artDirection.colorPalette.surface || '#120d24' },
              ].map((c) => (
                <button
                  key={c.label}
                  onClick={() => copyText(c.hex, 'hex')}
                  className="group text-center space-y-1 cursor-pointer focus:outline-none"
                  title={`Copiar ${c.hex}`}
                >
                  <div 
                    className="h-10 rounded-lg border border-purple-900/60 shadow-md group-hover:scale-105 transition-transform flex items-center justify-center"
                    style={{ backgroundColor: c.hex }}
                  >
                    {copiedColorHex === c.hex && (
                      <Check className="w-3.5 h-3.5 text-white drop-shadow" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 block font-medium">{c.label}</span>
                  <span className="text-[9px] font-mono text-purple-400 block">{c.hex}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* O que é APROVADO (Do's) */}
        <div className="bg-[#0b0816] border border-purple-900/50 rounded-2xl p-5 space-y-3 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>O QUE É APROVADO (PADRÃO DE ELITE)</span>
          </div>

          <div className="space-y-2 text-xs">
            {event.artDirection.dosList.map((item, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-800/40 text-slate-200 flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* O que é VETADO (Don'ts) */}
        <div className="bg-[#0b0816] border border-red-500/30 rounded-2xl p-5 space-y-3 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-red-400">
            <X className="w-4 h-4" />
            <span>O QUE É EXPRESSAMENTE VETADO (DON'TS)</span>
          </div>

          <div className="space-y-2 text-xs">
            {event.artDirection.dontsList.map((item, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-red-950/20 border border-red-500/20 text-slate-200 flex items-start gap-2">
                <X className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Token-Optimized Creative Brief Generator */}
      <div className="bg-[#0b0816] border border-purple-950/70 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-purple-950/60 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">
              Gerador de Prompts e Briefings com Economia Estrita de Tokens
            </h3>
          </div>
          <span className="text-[11px] text-purple-300 font-mono bg-purple-950/80 px-2.5 py-0.5 rounded-lg border border-purple-800/50">
            Sem palavras vazias
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Tipo de Peça Publicitária:</label>
            <input
              value={assetType}
              onChange={(e) => setAssetType(e.target.value)}
              className="w-full bg-[#120d24] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Diretriz Específica do Time:</label>
            <input
              value={customStyleRequest}
              onChange={(e) => setCustomStyleRequest(e.target.value)}
              className="w-full bg-[#120d24] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerateBrief}
              disabled={isLoading}
              className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-purple-950/50 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sintetizando Briefing Otimizado...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gerar Prompts Ultracompactos</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Prompts Output */}
      {directorOutput?.tokenOptimizedPrompts && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-300 flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
              PROMPTS DE ALTA PRECISÃO (MIDJOURNEY / IMAGEN / STABLE DIFFUSION):
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {directorOutput.tokenOptimizedPrompts.map((p: any, idx: number) => (
              <div key={idx} className="bg-[#0b0816] border border-purple-900/50 rounded-2xl p-5 space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{p.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/40">
                      {p.aspectRatio}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/50">
                    ~{p.tokenCountEstimate} tokens (Econômico)
                  </span>
                </div>

                <div className="text-[11px] text-slate-400">
                  Uso Recomendado: <strong className="text-purple-300">{p.intendedUse}</strong>
                </div>

                {/* Prompt Box */}
                <div className="p-3 rounded-xl bg-[#120d24] border border-purple-950/60 space-y-2 relative group">
                  <p className="font-mono text-xs text-purple-200 leading-relaxed pr-8">
                    {p.prompt}
                  </p>
                  <button
                    onClick={() => copyText(p.prompt, 'prompt', idx)}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900 text-purple-300 hover:text-white transition-colors cursor-pointer border border-purple-800/40"
                    title="Copiar Prompt"
                  >
                    {copiedPromptIndex === idx ? (
                      <Check className="w-3.5 h-3.5 text-purple-300" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Negative Constraints */}
                {p.negativePromptConstraints && (
                  <div className="text-[11px] text-red-300 bg-red-950/20 p-2.5 rounded-xl border border-red-500/20 space-y-0.5">
                    <span className="font-semibold block text-[10px] uppercase text-red-400">Prompt Negativo (Vetos):</span>
                    <p className="font-mono text-[10px] text-red-200">{p.negativePromptConstraints}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preset Reference Prompts from Event Data */}
      {(!directorOutput || !directorOutput.tokenOptimizedPrompts) && event.artDirection.samplePrompts?.length > 0 && (
        <div className="space-y-4">
          <span className="text-xs font-bold text-purple-300 flex items-center gap-2">
            <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
            PROMPTS PRÉ-CONFIGURADOS NO DNA DE "{event.name.toUpperCase()}":
          </span>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {event.artDirection.samplePrompts.map((p, idx) => (
              <div key={idx} className="bg-[#0b0816] border border-purple-900/50 rounded-2xl p-5 space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{p.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/40">
                    {p.ratio}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#120d24] border border-purple-950/60 relative group">
                  <p className="font-mono text-xs text-purple-200 leading-relaxed pr-8">
                    {p.prompt}
                  </p>
                  <button
                    onClick={() => copyText(p.prompt, 'prompt', idx + 100)}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900 text-purple-300 hover:text-white transition-colors cursor-pointer border border-purple-800/40"
                    title="Copiar Prompt"
                  >
                    {copiedPromptIndex === idx + 100 ? (
                      <Check className="w-3.5 h-3.5 text-purple-300" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
};
