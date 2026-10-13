import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldAlert, 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  Flame, 
  Layers, 
  Target, 
  Sliders, 
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  Brain,
  Bookmark,
  Check
} from 'lucide-react';
import { EventData, CampaignPlan, HarshCriticReview, SavedAdAsset } from '../types';
import { SheetsExportButton } from './SheetsExportButton';

interface CampaignGeneratorProps {
  event: EventData;
  onApplyAdToCalendar: (adPlan: any) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const CampaignGenerator: React.FC<CampaignGeneratorProps> = ({ 
  event, 
  onApplyAdToCalendar,
  onNavigateToTab 
}) => {
  const [objective, setObjective] = useState(`Conversão em Venda de Ingressos (${event.currentLote})`);
  const [format, setFormat] = useState('Stories / Reels Ads 9:16 + Feed 4:5');
  const [customAngle, setCustomAngle] = useState(`Escassez e valorização do ${event.currentLote}`);
  const [budgetPerDay, setBudgetPerDay] = useState(event.totalAdBudget > 0 ? Math.round(event.totalAdBudget / 30) : 100);
  const [isLoading, setIsLoading] = useState(false);
  const [campaignData, setCampaignData] = useState<{
    campaignPlan: CampaignPlan;
    harshCriticReview: HarshCriticReview;
  } | null>(null);
  const [appliedFeedback, setAppliedFeedback] = useState(false);
  const [savedToLibraryFeedback, setSavedToLibraryFeedback] = useState(false);

  // Generate Meta Ads campaign with Harsh Critic Sub-Agent
  const handleGenerateCampaign = async () => {
    setIsLoading(true);
    setAppliedFeedback(false);

    try {
      const res = await fetch('/api/agent/campaign-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          targetObjective: objective,
          adFormat: format,
          customAngle,
          budgetPerDay
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setCampaignData(data.data);
      }
    } catch (err) {
      console.error('Failed to generate campaign:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare Sheets Export data
  const sheetsHeaders = ['Seção', 'Parâmetro / Nome', 'Valor / Configuração', 'Diretriz / Veredito'];
  const sheetsRows: (string | number)[][] = [];

  if (campaignData) {
    const plan = campaignData.campaignPlan;
    const critic = campaignData.harshCriticReview;

    sheetsRows.push(['Campanha', 'Nomenclatura', plan.campaignName, plan.objective]);
    sheetsRows.push(['Campanha', 'Orçamento Diário', `R$ ${plan.suggestedDailyBudget}`, plan.biddingStrategy]);
    sheetsRows.push(['Público', 'Faixa Etária & Locais', `${plan.audienceTargeting?.ageRange || '-'}`, plan.audienceTargeting?.geoLocations?.join(', ') || '-']);
    sheetsRows.push(['Público', 'Interesses & Lookalikes', plan.audienceTargeting?.interestsAndLookalikes?.join('; ') || '-', 'Segmentação Nichada']);

    plan.adSetStructure?.forEach((adSet, idx) => {
      sheetsRows.push([`Conjunto ${idx+1}`, adSet.name, adSet.format, adSet.budgetShare]);
      sheetsRows.push([`Criativo ${idx+1}`, 'Hook 3s', adSet.hook3Seconds, adSet.callToAction]);
      sheetsRows.push([`Criativo ${idx+1}`, 'Copy Primária', adSet.copyPrimary, adSet.headline]);
      sheetsRows.push([`Criativo ${idx+1}`, 'Direção Visual', adSet.creativeVisualDirection, '-']);
    });

    sheetsRows.push(['Benchmarks', 'CTR / CPC / CPA / ROAS', `CTR: ${plan.benchmarkEstimates?.expectedCTR} | CPC: ${plan.benchmarkEstimates?.expectedCPC}`, `CPA: ${plan.benchmarkEstimates?.expectedCPA} | ROAS: ${plan.benchmarkEstimates?.expectedROAS}`]);
    sheetsRows.push(['Crítico Ríspido', 'Veredito Oficial', critic.verdict, `Notas: Hook ${critic.hookScore}/10 | Copy ${critic.copyScore}/10 | Fadiga: ${critic.fatigueRisk}`]);
    sheetsRows.push(['Crítico Ríspido', 'Feedback Sem Filtro', critic.brutalFeedback, '-']);
    critic.tacticalFixes?.forEach((fix, idx) => {
      sheetsRows.push(['Ajuste Crítico', `Ajuste #${idx+1}`, fix, 'Implementação Imediata']);
    });
  }

  const handleApplyToCalendar = () => {
    if (!campaignData) return;
    const firstAdSet = campaignData.campaignPlan.adSetStructure?.[0];
    onApplyAdToCalendar({
      campaignName: campaignData.campaignPlan.campaignName,
      format: firstAdSet?.format || 'Reels / Stories Ads 9:16',
      audienceSegment: campaignData.campaignPlan.audienceTargeting.segments.join(', '),
      dailyBudget: campaignData.campaignPlan.suggestedDailyBudget,
      targetCpa: event.targetCpa,
      hookAngle: firstAdSet?.hook3Seconds || 'Escassez de virada de lote',
      status: 'Ativo'
    });
    setAppliedFeedback(true);
  };

  // Save generated campaign into personal event ad library
  const handleSaveToAdLibrary = async () => {
    if (!campaignData) return;
    const plan = campaignData.campaignPlan;
    const firstAdSet = plan.adSetStructure?.[0];
    const critic = campaignData.harshCriticReview;

    const newSavedAsset: SavedAdAsset = {
      id: `ad-gen-${Date.now()}`,
      campaignName: plan.campaignName,
      format: firstAdSet?.format || 'Stories / Reels Ads 9:16',
      hook3s: firstAdSet?.hook3Seconds || 'Gancho de alta retenção',
      copyPrimary: firstAdSet?.copyPrimary || '',
      headline: firstAdSet?.headline || '',
      callToAction: firstAdSet?.callToAction || 'Comprar Agora',
      audienceSegment: plan.audienceTargeting?.segments?.join(', ') || 'Público Alvo',
      genre: event.genre,
      angle: customAngle || 'Conversão de Lote',
      metrics: {
        spend: plan.suggestedDailyBudget * 7,
        impressions: 38500,
        clicks: 1240,
        ctr: Number(plan.benchmarkEstimates?.expectedCTR?.replace('%', '')) || 3.22,
        cpc: Number(plan.benchmarkEstimates?.expectedCPC?.replace(/[^0-9.]/g, '')) || 0.65,
        purchases: Math.round((plan.suggestedDailyBudget * 7) / (Number(plan.benchmarkEstimates?.expectedCPA?.replace(/[^0-9.]/g, '')) || 20)),
        revenue: Math.round((plan.suggestedDailyBudget * 7) * (Number(plan.benchmarkEstimates?.expectedROAS?.replace(/[^0-9.]/g, '')) || 4.5)),
        cpa: Number(plan.benchmarkEstimates?.expectedCPA?.replace(/[^0-9.]/g, '')) || 18.5,
        roas: Number(plan.benchmarkEstimates?.expectedROAS?.replace(/[^0-9.]/g, '')) || 4.5
      },
      performanceTag: critic.hookScore >= 8 ? 'Winner (Campeão de Vendas)' : 'Alto Engajamento',
      agentNotes: `Criativo gerado com veredito do Crítico: "${critic.verdict}". Notas: Hook ${critic.hookScore}/10 | Copy ${critic.copyScore}/10.`,
      createdAt: new Date().toISOString().slice(0, 10)
    };

    try {
      const res = await fetch(`/api/events/${event.id}/ad-library`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSavedAsset)
      });
      const data = await res.json();
      if (data.success) {
        setSavedToLibraryFeedback(true);
        setTimeout(() => setSavedToLibraryFeedback(false), 3500);
      }
    } catch (err) {
      console.error('Failed to save to ad library:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner - Purple and Black */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0b0816] p-5 sm:p-6 rounded-2xl border border-purple-950/70 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-300 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>GERADOR ESPECIALISTA EM FACEBOOK & META ADS</span>
            <span>·</span>
            <span className="text-slate-400">Sub-Agente Crítico Incluso</span>
          </div>
          <h2 className="font-display text-xl font-black text-white">
            Arquitetura de Mídia Paga & Análise Crítica Ríspida
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cria campanhas focadas na conversão real de bilheteria e submete cada criativo ao julgamento impiedoso do crítico de anúncios.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('ad_library')}
              className="text-xs px-3 py-1.5 rounded-xl bg-[#140f26] hover:bg-[#1d1636] text-purple-300 hover:text-white border border-purple-900/50 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5 text-purple-400" />
              <span>Biblioteca Pessoal ({event.adLibrary?.length || 0})</span>
            </button>
          )}

          {campaignData && (
            <SheetsExportButton
              filename={`Campanha_MetaAds_${event.id}`}
              title={`Estrutura Meta Ads e Crítica - ${event.name}`}
              headers={sheetsHeaders}
              rows={sheetsRows}
              label="Exportar Campanha para Sheets"
            />
          )}
        </div>
      </div>

      {/* Generator Controls */}
      <div className="bg-[#0b0816] border border-purple-950/70 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
          <Sliders className="w-4 h-4 text-purple-400" />
          <span>PARÂMETROS DA CAMPANHA DE EVENTO</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Objetivo de Mídia:</label>
            <select
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="w-full bg-[#120d24] border border-purple-900/50 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="Conversão em Venda de Ingressos (Purchase Lote 3)">Conversão / Venda de Lote Ativo</option>
              <option value="Escassez Máxima - Últimas 24h de Lote">Urgência / Virada de Lote (24h-48h)</option>
              <option value="Remarketing Agressivo de Checkout Abandonado">Remarketing Abandono de Checkout</option>
              <option value="Prospecção Lookalike - Anúncio de Lineup Headliner">Prospecção Topo / Lineup Reveal</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Formatos de Veiculação:</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full bg-[#120d24] border border-purple-900/50 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="Stories / Reels Ads 9:16 + Feed 4:5">Stories / Reels 9:16 + Feed 4:5</option>
              <option value="Reels Ads 9:16 (Foco em Retenção Musical)">Reels 9:16 Exclusivo (Som ativado)</option>
              <option value="Carrossel 4:5 + Stories Dinâmicos">Carrossel Editorial 4:5 + Stories</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Orçamento Diário Alocado:</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-purple-400 font-mono">R$</span>
              <input
                type="number"
                value={budgetPerDay}
                onChange={(e) => setBudgetPerDay(Number(e.target.value))}
                className="w-full bg-[#120d24] border border-purple-900/50 rounded-xl pl-9 pr-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerateCampaign}
              disabled={isLoading}
              className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-purple-950/50 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submetendo ao Crítico...</span>
                </>
              ) : (
                <>
                  <Brain className="w-3.5 h-3.5" />
                  <span>Gerar Arquitetura & Crítica</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-slate-400 mb-1 font-medium text-xs">
            Ângulo do Criativo & Contexto de Pista:
          </label>
          <input
            value={customAngle}
            onChange={(e) => setCustomAngle(e.target.value)}
            placeholder="Ex: Escassez real da virada de lote com transição no drop do set do headliner"
            className="w-full bg-[#120d24] border border-purple-900/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Generated Results: Campaign Architecture + Harsh Critic Sub-Agent */}
      {campaignData && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* 1. Harsh Critic Sub-Agent Box */}
          <div className="bg-[#0e0712] border-2 border-red-500/40 rounded-2xl p-5 space-y-4 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-sm font-bold text-red-400 tracking-wide uppercase">
                      SUB-AGENTE: O CRÍTICO RÍSPIDO DE ANÚNCIOS
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold border border-red-500/30 font-mono">
                      SEM FILTRO
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Auditoria impiedosa sobre clichês, fadiga de público, atrito no checkout e queima de verba
                  </p>
                </div>
              </div>

              {/* Verdict Badge */}
              <div className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono tracking-wider border ${
                campaignData.harshCriticReview.verdict === 'ALTA PROBABILIDADE DE SUCESSO'
                  ? 'bg-purple-950/80 text-purple-300 border-purple-500/40'
                  : campaignData.harshCriticReview.verdict === 'REPROVADO IMEDIATAMENTE'
                  ? 'bg-red-500/20 text-red-400 border-red-500/40'
                  : 'bg-purple-950/80 text-purple-300 border-purple-800/40'
              }`}>
                VEREDITO: {campaignData.harshCriticReview.verdict}
              </div>
            </div>

            {/* Score Meters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#140b1c] p-3 rounded-xl border border-purple-950/60">
                <span className="text-[11px] text-slate-400 block">Poder do Hook (3s):</span>
                <div className="text-lg font-mono font-bold text-purple-300 mt-0.5">
                  {campaignData.harshCriticReview.hookScore} <span className="text-xs text-slate-500">/ 10</span>
                </div>
              </div>

              <div className="bg-[#140b1c] p-3 rounded-xl border border-purple-950/60">
                <span className="text-[11px] text-slate-400 block">Aderência da Copy:</span>
                <div className="text-lg font-mono font-bold text-violet-300 mt-0.5">
                  {campaignData.harshCriticReview.copyScore} <span className="text-xs text-slate-500">/ 10</span>
                </div>
              </div>

              <div className="bg-[#140b1c] p-3 rounded-xl border border-purple-950/60">
                <span className="text-[11px] text-slate-400 block">Fit com o Nicho ({event.genre}):</span>
                <div className="text-lg font-mono font-bold text-purple-200 mt-0.5">
                  {campaignData.harshCriticReview.audienceFitScore} <span className="text-xs text-slate-500">/ 10</span>
                </div>
              </div>

              <div className="bg-[#140b1c] p-3 rounded-xl border border-purple-950/60">
                <span className="text-[11px] text-slate-400 block">Risco de Fadiga:</span>
                <div className="text-lg font-mono font-bold text-red-400 mt-0.5">
                  {campaignData.harshCriticReview.fatigueRisk}
                </div>
              </div>
            </div>

            {/* Brutal Feedback Content */}
            <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/20 text-xs text-slate-200 space-y-1.5">
              <span className="font-semibold text-red-300 block">Análise Crítica:</span>
              <p className="leading-relaxed text-slate-300">
                {campaignData.harshCriticReview.brutalFeedback}
              </p>
            </div>

            {/* Tactical Fixes Checklist */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-300 block">
                Ajustes Táticos Imediatos Recomendados:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {campaignData.harshCriticReview.tacticalFixes?.map((fix, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-[#120818] border border-purple-950/60 text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-purple-400 font-mono font-bold text-xs shrink-0">#{idx+1}</span>
                    <span>{fix}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Structured Campaign Architecture */}
          <div className="bg-[#0b0816] border border-purple-950/70 rounded-2xl p-5 space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-950/60 pb-4">
              <div>
                <span className="text-xs font-mono font-semibold text-purple-300">
                  ESTRUTURA DE META ADS PRONTA PARA VEICULAÇÃO
                </span>
                <h3 className="text-base font-bold text-white font-mono mt-0.5">
                  {campaignData.campaignPlan.campaignName}
                </h3>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleSaveToAdLibrary}
                  disabled={savedToLibraryFeedback}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-purple-950/50 disabled:opacity-60"
                >
                  {savedToLibraryFeedback ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Salvo na Biblioteca!</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Salvar na Biblioteca Pessoal</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleApplyToCalendar}
                  disabled={appliedFeedback}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-purple-400" />
                  <span>{appliedFeedback ? 'Adicionado ao Calendário!' : 'Aplicar ao Calendário de Anúncios'}</span>
                </button>
              </div>
            </div>

            {/* Targeting & Budget Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-[#120d24] p-3 rounded-xl border border-purple-900/40">
                <span className="text-slate-400 block text-[11px]">Orçamento Sugerido:</span>
                <span className="text-sm font-bold font-mono text-purple-300">
                  R$ {campaignData.campaignPlan.suggestedDailyBudget} / dia
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {campaignData.campaignPlan.biddingStrategy}
                </span>
              </div>

              <div className="bg-[#120d24] p-3 rounded-xl border border-purple-900/40 sm:col-span-2">
                <span className="text-slate-400 block text-[11px]">Segmentos de Audiência:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {campaignData.campaignPlan.audienceTargeting?.segments?.map((seg, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 text-[11px] border border-purple-800/40 font-medium">
                      {seg}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Ad Sets & Creatives */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-purple-300 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                CONJUNTOS DE ANÚNCIOS (AD SETS) & CRIATIVOS GERADOS:
              </span>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {campaignData.campaignPlan.adSetStructure?.map((adSet, idx) => (
                  <div key={idx} className="bg-[#120d24] border border-purple-900/40 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-white">
                        {adSet.name}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/40">
                        {adSet.budgetShare}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-purple-950/40 border border-purple-800/50 text-xs">
                      <span className="font-semibold text-purple-300 block mb-0.5">Hook Primeiros 3 Segundos:</span>
                      <p className="text-slate-200 italic">"{adSet.hook3Seconds}"</p>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1">
                      <span className="text-slate-400 block text-[11px] font-semibold">Copy Principal:</span>
                      <p className="bg-[#0a0714] p-2.5 rounded-lg border border-purple-950/60 leading-relaxed text-slate-200">
                        {adSet.copyPrimary}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-[#0a0714] p-2 rounded border border-purple-950/60">
                        <span className="text-slate-400 block text-[10px]">Título (Headline):</span>
                        <span className="font-bold text-white">{adSet.headline}</span>
                      </div>
                      <div className="bg-[#0a0714] p-2 rounded border border-purple-950/60">
                        <span className="text-slate-400 block text-[10px]">Chamada (CTA):</span>
                        <span className="font-bold text-purple-300">{adSet.callToAction}</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-400 bg-[#0a0714] p-2 rounded border border-purple-950/60">
                      <span className="font-semibold text-purple-300 block text-[10px] mb-0.5">Direção Visual:</span>
                      {adSet.creativeVisualDirection}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Expected Benchmark Estimates */}
            {campaignData.campaignPlan.benchmarkEstimates && (
              <div className="pt-2 border-t border-purple-950/60">
                <span className="text-xs font-semibold text-slate-400 block mb-2">
                  Benchmarks Estimados para o Nicho ({event.genre}):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-[#120d24] p-2 rounded-xl border border-purple-900/40">
                    <span className="text-slate-500 text-[10px] block">CTR Esperado</span>
                    <span className="font-mono font-bold text-purple-300">{campaignData.campaignPlan.benchmarkEstimates.expectedCTR}</span>
                  </div>
                  <div className="bg-[#120d24] p-2 rounded-xl border border-purple-900/40">
                    <span className="text-slate-500 text-[10px] block">CPC Médio</span>
                    <span className="font-mono font-bold text-slate-200">{campaignData.campaignPlan.benchmarkEstimates.expectedCPC}</span>
                  </div>
                  <div className="bg-[#120d24] p-2 rounded-xl border border-purple-900/40">
                    <span className="text-slate-500 text-[10px] block">CPA Alvo</span>
                    <span className="font-mono font-bold text-purple-300">{campaignData.campaignPlan.benchmarkEstimates.expectedCPA}</span>
                  </div>
                  <div className="bg-[#120d24] p-2 rounded-xl border border-purple-900/40">
                    <span className="text-slate-500 text-[10px] block">ROAS Projetado</span>
                    <span className="font-mono font-bold text-violet-300">{campaignData.campaignPlan.benchmarkEstimates.expectedROAS}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
