import React from 'react';
import {
  ShieldCheck,
  Zap,
  TrendingUp,
  AlertCircle,
  Sparkles,
  FileText,
  Copy,
  Check,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { PostEngineeringData } from '../../types/postStudio';

interface PhotoshopAuditPanelProps {
  engineeringData: PostEngineeringData;
  onGenerateConceptualBg: () => void;
  isGeneratingBg: boolean;
  onCopyBriefing: () => void;
  copiedBriefing: boolean;
}

export const PhotoshopAuditPanel: React.FC<PhotoshopAuditPanelProps> = ({
  engineeringData,
  onGenerateConceptualBg,
  isGeneratingBg,
  onCopyBriefing,
  copiedBriefing
}) => {
  const score = engineeringData.scorecard;

  return (
    <div className="flex flex-col h-full bg-[#121316] text-white overflow-y-auto divide-y divide-white/[0.08] select-none text-xs">
      {/* SCORECARD OVERVIEW */}
      <div className="p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-purple-400 font-mono font-bold text-xs uppercase">
            <ShieldCheck className="w-4 h-4" />
            <span>Auditoria de Conversão</span>
          </div>
          <span className="badge-tech bg-emerald-950/80 text-emerald-300 border-emerald-500/40">
            Padrão Elite
          </span>
        </div>

        {/* 3 Metrics Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#18191f] border border-white/[0.06] p-2 rounded flex flex-col items-center text-center">
            <span className="text-[10px] text-slate-400 font-mono">Mobile UX</span>
            <span className="text-base font-black text-emerald-400 font-mono mt-0.5">
              {score.mobileReadability}%
            </span>
            <span className="text-[9px] text-slate-400">Excelente</span>
          </div>

          <div className="bg-[#18191f] border border-white/[0.06] p-2 rounded flex flex-col items-center text-center">
            <span className="text-[10px] text-slate-400 font-mono">Contraste AAA</span>
            <span className="text-base font-black text-purple-400 font-mono mt-0.5">
              {score.contrastSafety}%
            </span>
            <span className="text-[9px] text-slate-400">WCAG Seguro</span>
          </div>

          <div className="bg-[#18191f] border border-white/[0.06] p-2 rounded flex flex-col items-center text-center">
            <span className="text-[10px] text-slate-400 font-mono">Intenção Compra</span>
            <span className="text-base font-black text-amber-400 font-mono mt-0.5">
              {score.purchaseIntentIndex}%
            </span>
            <span className="text-[9px] text-slate-400">Pico Alto</span>
          </div>
        </div>

        {/* Scroll-Stop Rating */}
        <div className="p-2.5 rounded bg-purple-950/30 border border-purple-800/40 space-y-1">
          <div className="flex items-center gap-1.5 text-purple-300 font-semibold text-[11px]">
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span>Capacidade de Interrupção de Scroll:</span>
          </div>
          <p className="text-[11px] text-slate-300">
            {score.scrollStopProbability}
          </p>
        </div>
      </div>

      {/* 3-ZONE DIAGNOSTICS */}
      <div className="p-3.5 space-y-2.5">
        <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider block">
          Diagnóstico das 3 Zonas
        </span>

        {/* Zone 1 */}
        <div className="p-2 rounded bg-[#18191f] border border-white/[0.06] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-300">Zona 1: Gancho Visual (35%)</span>
            <span className="text-[10px] font-mono text-slate-400">&lt; {engineeringData.zone1_hook.readingTimeMs}ms</span>
          </div>
          <p className="text-[11px] text-slate-300">
            Ponto Focal: <span className="text-white">{engineeringData.zone1_hook.visualFocalPoint}</span>
          </p>
        </div>

        {/* Zone 2 */}
        <div className="p-2 rounded bg-[#18191f] border border-white/[0.06] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-300">Zona 2: Prova & Autoridade (40%)</span>
            <span className="text-[10px] font-mono text-slate-400">Escala 2.5x</span>
          </div>
          <p className="text-[11px] text-slate-300">
            Fluxo Ocular: <span className="text-white">{engineeringData.zone2_proof.eyeFlowPattern}</span>
          </p>
        </div>

        {/* Zone 3 */}
        <div className="p-2 rounded bg-[#18191f] border border-white/[0.06] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-300">Zona 3: CTA & Conversão (25%)</span>
            <span className="text-[10px] font-mono text-emerald-400">Safe Zone OK</span>
          </div>
          <p className="text-[11px] text-slate-300">
            Gatilho: <span className="text-white">{engineeringData.zone3_cta.urgencyTrigger}</span>
          </p>
        </div>
      </div>

      {/* STRATEGIC CONVERSION NOTES */}
      <div className="p-3.5 space-y-2">
        <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider block">
          Notas de Engenharia
        </span>
        <ul className="space-y-1.5">
          {score.conversionAuditNotes.map((note, idx) => (
            <li key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* AI CONCEPTUAL BACKGROUND & BRIEFING EXPORT */}
      <div className="p-3.5 space-y-2.5 bg-[#0e0f12]">
        <span className="text-[11px] font-mono text-purple-400 font-bold uppercase tracking-wider block">
          Automação & IA
        </span>

        <button
          onClick={onGenerateConceptualBg}
          disabled={isGeneratingBg}
          className="w-full py-2 px-3 rounded bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-purple-900/40 disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isGeneratingBg ? 'Gerando Conceito com IA...' : 'Gerar Imagem Conceitual IA'}</span>
        </button>

        <button
          onClick={onCopyBriefing}
          className="w-full py-2 px-3 rounded bg-[#1c1d22] hover:bg-[#25262c] text-slate-200 border border-white/[0.08] font-mono text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {copiedBriefing ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Briefing Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-purple-400" />
              <span>Copiar Briefing para Designer</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
