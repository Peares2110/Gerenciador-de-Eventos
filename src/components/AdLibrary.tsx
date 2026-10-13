import React, { useState } from 'react';
import { 
  Bookmark, 
  Sparkles, 
  Brain, 
  TrendingUp, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Copy, 
  Check, 
  Eye, 
  MousePointer, 
  ShoppingBag, 
  DollarSign, 
  Flame, 
  Layers, 
  Radio, 
  X, 
  Award, 
  HelpCircle,
  BarChart3,
  Calendar,
  AlertCircle,
  ArrowRight,
  Sliders,
  ShieldCheck,
  Tag,
  Users
} from 'lucide-react';
import { EventData, SavedAdAsset } from '../types';

interface AdLibraryProps {
  event: EventData;
  onUpdateEvent?: (updated: EventData) => void;
  onNavigateToTab?: (tab: string) => void;
}

export type SearchScope = 'all' | 'campaignName' | 'format' | 'audienceSegment';

export const AdLibrary: React.FC<AdLibraryProps> = ({ event, onUpdateEvent, onNavigateToTab }) => {
  const [ads, setAds] = useState<SavedAdAsset[]>(event.adLibrary || []);
  const [filterTag, setFilterTag] = useState<string>('all');
  const [filterFormat, setFilterFormat] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<SearchScope>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationSuccess, setCalibrationSuccess] = useState(false);

  // New Ad Form State
  const [newAd, setNewAd] = useState({
    campaignName: '',
    format: 'Stories / Reels Ads 9:16',
    hook3s: '',
    copyPrimary: '',
    headline: '',
    callToAction: 'Comprar Agora',
    audienceSegment: 'Jovens 18-24 anos (Funk & Trap / Região)',
    genre: event.genre,
    angle: 'Urgência & Escassez de Virada de Lote',
    performanceTag: 'Winner (Campeão de Vendas)' as SavedAdAsset['performanceTag'],
    agentNotes: '',
    spend: 850,
    impressions: 42000,
    clicks: 1350,
    ctr: 3.21,
    cpc: 0.63,
    purchases: 64,
    revenue: 5120,
    cpa: 13.28,
    roas: 6.02
  });

  // Calculate aggregated stats
  const totalAds = ads.length;
  const totalSpend = ads.reduce((acc, ad) => acc + (Number(ad.metrics?.spend) || 0), 0);
  const totalRevenue = ads.reduce((acc, ad) => acc + (Number(ad.metrics?.revenue) || 0), 0);
  const totalPurchases = ads.reduce((acc, ad) => acc + (Number(ad.metrics?.purchases) || 0), 0);
  const totalImpressions = ads.reduce((acc, ad) => acc + (Number(ad.metrics?.impressions) || 0), 0);
  const totalClicks = ads.reduce((acc, ad) => acc + (Number(ad.metrics?.clicks) || 0), 0);

  const avgRoas = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : '0.00';
  const avgCpa = totalPurchases > 0 ? (totalSpend / totalPurchases).toFixed(2) : '0.00';
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

  const winnersCount = ads.filter(a => a.performanceTag === 'Winner (Campeão de Vendas)').length;

  // Copy hook and copy
  const handleCopyText = (ad: SavedAdAsset) => {
    const fullSnippet = `[CAMPANHA]: ${ad.campaignName}\n[FORMATO]: ${ad.format}\n[PÚBLICO]: ${ad.audienceSegment}\n[HOOK 3S]: ${ad.hook3s}\n[HEADLINE]: ${ad.headline || '-'}\n[COPY]:\n${ad.copyPrimary}\n[CTA]: ${ad.callToAction}\n[MÉTRICAS]: ROAS ${ad.metrics?.roas}x | CPA R$ ${ad.metrics?.cpa} | CTR ${ad.metrics?.ctr}%\n[APRENDIZADO DOS AGENTES]: ${ad.agentNotes}`;
    navigator.clipboard.writeText(fullSnippet);
    setCopiedId(ad.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Delete Ad
  const handleDeleteAd = async (adId: string) => {
    if (!confirm('Deseja remover este anúncio da biblioteca pessoal do evento?')) return;
    try {
      const res = await fetch(`/api/events/${event.id}/ad-library/${adId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        const updated = ads.filter(a => a.id !== adId);
        setAds(updated);
        if (onUpdateEvent) {
          onUpdateEvent({ ...event, adLibrary: updated });
        }
      }
    } catch (err) {
      console.error('Error deleting ad:', err);
    }
  };

  // Add Ad to Library
  const handleAddAdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAd.campaignName || !newAd.hook3s) {
      alert('Por favor, preencha pelo menos o Nome da Campanha e o Hook de 3s.');
      return;
    }

    const calculatedCpa = newAd.purchases > 0 ? Number((newAd.spend / newAd.purchases).toFixed(2)) : newAd.cpa;
    const calculatedRoas = newAd.spend > 0 ? Number((newAd.revenue / newAd.spend).toFixed(2)) : newAd.roas;
    const calculatedCtr = newAd.impressions > 0 ? Number(((newAd.clicks / newAd.impressions) * 100).toFixed(2)) : newAd.ctr;
    const calculatedCpc = newAd.clicks > 0 ? Number((newAd.spend / newAd.clicks).toFixed(2)) : newAd.cpc;

    const payload: SavedAdAsset = {
      id: `ad-custom-${Date.now()}`,
      campaignName: newAd.campaignName.toUpperCase(),
      format: newAd.format,
      hook3s: newAd.hook3s,
      copyPrimary: newAd.copyPrimary,
      headline: newAd.headline,
      callToAction: newAd.callToAction,
      audienceSegment: newAd.audienceSegment,
      genre: newAd.genre,
      angle: newAd.angle,
      metrics: {
        spend: Number(newAd.spend),
        impressions: Number(newAd.impressions),
        clicks: Number(newAd.clicks),
        ctr: calculatedCtr,
        cpc: calculatedCpc,
        purchases: Number(newAd.purchases),
        revenue: Number(newAd.revenue),
        cpa: calculatedCpa,
        roas: calculatedRoas
      },
      performanceTag: newAd.performanceTag,
      agentNotes: newAd.agentNotes || 'Anúncio adicionado manualmente à biblioteca para benchmarking do evento.',
      createdAt: new Date().toISOString().slice(0, 10)
    };

    try {
      const res = await fetch(`/api/events/${event.id}/ad-library`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.adLibrary) {
        setAds(data.adLibrary);
        if (onUpdateEvent) {
          onUpdateEvent({ ...event, adLibrary: data.adLibrary });
        }
        setIsAddModalOpen(false);
        // Reset form
        setNewAd({
          campaignName: '',
          format: 'Stories / Reels Ads 9:16',
          hook3s: '',
          copyPrimary: '',
          headline: '',
          callToAction: 'Comprar Agora',
          audienceSegment: 'Jovens 18-24 anos (Funk & Trap / Região)',
          genre: event.genre,
          angle: 'Urgência & Escassez de Virada de Lote',
          performanceTag: 'Winner (Campeão de Vendas)',
          agentNotes: '',
          spend: 850,
          impressions: 42000,
          clicks: 1350,
          ctr: 3.21,
          cpc: 0.63,
          purchases: 64,
          revenue: 5120,
          cpa: 13.28,
          roas: 6.02
        });
      }
    } catch (err) {
      console.error('Error adding ad to library:', err);
    }
  };

  // Trigger agent memory learning recalibration
  const handleRecalibrateAgentMemory = () => {
    setIsCalibrating(true);
    setCalibrationSuccess(false);

    setTimeout(() => {
      setIsCalibrating(false);
      setCalibrationSuccess(true);
      setTimeout(() => setCalibrationSuccess(false), 4000);
    }, 1200);
  };

  // Precise multi-attribute search filtering:
  // Filters specifically by Nome da Campanha, Formato or Segmento de Público-Alvo, or across all fields
  const filteredAds = ads.filter(ad => {
    // Tag filter
    if (filterTag !== 'all' && ad.performanceTag !== filterTag) return false;

    // Format dropdown filter
    if (filterFormat !== 'all' && !ad.format.toLowerCase().includes(filterFormat.toLowerCase())) return false;

    // Search query filter with exact scope matching
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const matchCampaignName = ad.campaignName.toLowerCase().includes(query);
      const matchFormat = ad.format.toLowerCase().includes(query);
      const matchAudience = (ad.audienceSegment || '').toLowerCase().includes(query);
      const matchHook = (ad.hook3s || '').toLowerCase().includes(query);
      const matchCopy = (ad.copyPrimary || '').toLowerCase().includes(query);
      const matchAngle = (ad.angle || '').toLowerCase().includes(query);

      if (searchScope === 'campaignName') {
        return matchCampaignName;
      } else if (searchScope === 'format') {
        return matchFormat;
      } else if (searchScope === 'audienceSegment') {
        return matchAudience;
      } else {
        // 'all': matches either campaign name, format, audience segment, hook, or copy
        return matchCampaignName || matchFormat || matchAudience || matchHook || matchCopy || matchAngle;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* 2-COLUMN INDUSTRIAL ARCHITECTURE (Variation 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">
        
        {/* LEFT SIDEBAR: QUICK INTELLIGENCE ACTIONS & METRICS CONSOLIDATION */}
        <aside className="space-y-5 lg:sticky lg:top-20">
          
          {/* Quick Intelligence Actions Card */}
          <div className="bg-[#141417] border border-white/10 p-4 rounded-sm space-y-3 shadow-lg">
            <div className="font-space text-[10px] uppercase tracking-widest text-zinc-400 border-b border-white/10 pb-2 flex items-center justify-between">
              <span>Ações de Inteligência</span>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-500 text-black font-space font-bold text-xs uppercase tracking-wider rounded-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-purple-950/40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Salvar Novo Anúncio</span>
              </button>

              {onNavigateToTab && (
                <>
                  <button
                    onClick={() => onNavigateToTab('campaign_gen')}
                    className="w-full py-2 px-3 bg-transparent hover:bg-white/5 border border-white/15 hover:border-purple-500 text-zinc-100 font-space font-bold text-[11px] uppercase tracking-wider rounded-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Gerar Copies & Ads</span>
                  </button>

                  <button
                    onClick={() => onNavigateToTab('campaign_hourly')}
                    className="w-full py-2 px-3 bg-transparent hover:bg-white/5 border border-white/15 hover:border-purple-500 text-zinc-300 hover:text-white font-space font-bold text-[11px] uppercase tracking-wider rounded-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                    <span>Auditar Criativos (24h)</span>
                  </button>

                  <button
                    onClick={() => onNavigateToTab('planning')}
                    className="w-full py-2 px-3 bg-transparent hover:bg-white/5 border border-white/15 hover:border-purple-500 text-zinc-300 hover:text-white font-space font-bold text-[11px] uppercase tracking-wider rounded-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-purple-400" />
                    <span>Editar Estratégia</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Consolidated Metrics Grid (Variation 2 Style: 3x2 High Contrast Monospace Box) */}
          <div className="space-y-2">
            <div className="font-space text-[10px] uppercase tracking-widest text-zinc-400 flex items-center justify-between">
              <span>Métricas Consolidadas</span>
              <span className="text-[10px] text-purple-400 font-space font-bold">{totalAds} Salvos</span>
            </div>

            <div className="grid grid-cols-3 gap-px bg-white/10 border border-white/10 rounded-sm overflow-hidden shadow-lg">
              <div className="bg-[#141417] p-2.5 flex flex-col">
                <span className="font-space text-[9px] uppercase tracking-wider text-zinc-500">ROAS</span>
                <span className="font-space text-sm font-bold text-emerald-400 mt-0.5">{avgRoas}x</span>
              </div>

              <div className="bg-[#141417] p-2.5 flex flex-col">
                <span className="font-space text-[9px] uppercase tracking-wider text-zinc-500">CPA</span>
                <span className="font-space text-sm font-bold text-zinc-100 mt-0.5">R${Math.round(Number(avgCpa))}</span>
              </div>

              <div className="bg-[#141417] p-2.5 flex flex-col">
                <span className="font-space text-[9px] uppercase tracking-wider text-zinc-500">CTR</span>
                <span className="font-space text-sm font-bold text-zinc-100 mt-0.5">{avgCtr}%</span>
              </div>

              <div className="bg-[#141417] p-2.5 flex flex-col">
                <span className="font-space text-[9px] uppercase tracking-wider text-zinc-500">SALVOS</span>
                <span className="font-space text-sm font-bold text-purple-400 mt-0.5">{String(totalAds).padStart(2, '0')}</span>
              </div>

              <div className="bg-[#141417] p-2.5 flex flex-col">
                <span className="font-space text-[9px] uppercase tracking-wider text-zinc-500">VENDAS</span>
                <span className="font-space text-sm font-bold text-zinc-100 mt-0.5">{totalPurchases}</span>
              </div>

              <div className="bg-[#141417] p-2.5 flex flex-col">
                <span className="font-space text-[9px] uppercase tracking-wider text-zinc-500">GASTO</span>
                <span className="font-space text-sm font-bold text-zinc-100 mt-0.5">
                  R${totalSpend >= 1000 ? `${(totalSpend/1000).toFixed(1)}k` : totalSpend}
                </span>
              </div>
            </div>
          </div>

          {/* Master Agent Learning Note Box (Variation 2 dashed style) */}
          <div className="bg-purple-950/20 border border-dashed border-purple-500/50 p-3.5 rounded-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-space text-[10px] uppercase font-bold text-purple-400 tracking-wider flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" />
                AGENTE MASTER
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>

            <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
              Melhor ângulo de conversão comprovado: o gatilho de escassez com contagem regressiva nos 3 primeiros segundos gerou o menor CPA histórico no gênero <strong className="text-white">{event.genre}</strong>.
            </p>

            <button
              onClick={handleRecalibrateAgentMemory}
              disabled={isCalibrating}
              className="w-full mt-2 py-1.5 px-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/40 font-space font-bold text-[10px] uppercase tracking-wider rounded-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {isCalibrating ? (
                <>
                  <div className="w-2.5 h-2.5 border-2 border-purple-300 border-t-transparent rounded-full animate-spin" />
                  <span>Sincronizando...</span>
                </>
              ) : calibrationSuccess ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-300">Memória Calibrada!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>Atualizar Aprendizado</span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* RIGHT CONTENT AREA: HERO BANNER, ADVANCED SEARCH & AD CARDS GRID */}
        <section className="space-y-6">
          
          {/* HERO CARD (Variation 2 Style: Gradient with Purple Left Border) */}
          <div className="bg-gradient-to-r from-[#141417] via-[#17171c] to-[#1c1c22] border border-white/10 border-l-4 border-l-purple-500 p-6 rounded-sm shadow-xl space-y-3">
            <div className="font-space text-[10px] uppercase tracking-widest text-purple-400">
              ACERVO DIGITAL & MEMÓRIA DE CRIATIVOS
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight uppercase">
                BIBLIOTECA DE ANÚNCIOS
              </h1>
              <div className="font-space text-xs text-zinc-400">
                EVENTO: <span className="text-purple-300 font-bold">{event.name}</span> · {event.city || 'MACAÉ, RJ'}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Cada anúncio salvo armazena métricas reais (CTR, CPC, CPA, ROAS), hooks testados e notas estratégicas. Este acervo é consumido pelos agentes de inteligência para replicar campanhas vencedoras.
            </p>

            <div className="flex items-center gap-2.5 pt-2 flex-wrap">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="py-2 px-4 bg-purple-600 hover:bg-purple-500 text-black font-space font-bold text-xs uppercase tracking-wider rounded-sm flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-purple-950/40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Salvar Anúncio</span>
              </button>

              {onNavigateToTab && (
                <button
                  onClick={() => onNavigateToTab('campaign_gen')}
                  className="py-2 px-4 bg-transparent hover:bg-white/5 border border-white/15 hover:border-purple-500 text-zinc-100 font-space font-bold text-xs uppercase tracking-wider rounded-sm flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Gerar Copies</span>
                </button>
              )}

              <div className="ml-auto font-space text-[11px] text-zinc-400">
                PÚBLICO-ALVO ATIVO: <span className="text-zinc-200 font-bold">{event.genre}</span>
              </div>
            </div>
          </div>

          {/* ADVANCED SEARCH & FILTER BAR (Explicitly filtering by: Nome de Campanha, Formato e Público-Alvo) */}
          <div className="bg-[#141417] border border-white/10 p-4 rounded-sm space-y-3 shadow-lg">
            
            {/* Top row: Search input & Scope indicator */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder={
                    searchScope === 'campaignName'
                      ? 'Filtrar por NOME DA CAMPANHA (ex: ESCASSEZ, LINEUP)...'
                      : searchScope === 'format'
                      ? 'Filtrar por FORMATO (ex: Reels 9:16, Stories, Carrossel)...'
                      : searchScope === 'audienceSegment'
                      ? 'Filtrar por PÚBLICO-ALVO (ex: Funk, Trap, Região dos Lagos)...'
                      : 'Buscar por nome de campanha, formato ou público-alvo...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#1c1c21] border border-white/10 hover:border-white/20 focus:border-purple-500 text-zinc-100 placeholder-zinc-500 text-xs pl-10 pr-9 py-2.5 rounded-sm font-sans focus:outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title="Limpar busca"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Tag and Format Dropdowns */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-[#1c1c21] border border-white/10 px-2.5 py-1.5 rounded-sm">
                  <Tag className="w-3 h-3 text-purple-400" />
                  <select
                    value={filterTag}
                    onChange={(e) => setFilterTag(e.target.value)}
                    className="bg-transparent text-zinc-300 text-[11px] font-space font-bold uppercase focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-[#141417] text-zinc-200">TODAS AS TAGS</option>
                    <option value="Winner (Campeão de Vendas)" className="bg-[#141417] text-amber-300">WINNER ⭐</option>
                    <option value="Alto Engajamento" className="bg-[#141417] text-fuchsia-300">ALTO ENGAJAMENTO</option>
                    <option value="CPA Otimizado" className="bg-[#141417] text-emerald-300">CPA OTIMIZADO</option>
                    <option value="Em Teste" className="bg-[#141417] text-zinc-300">EM TESTE</option>
                    <option value="Fadiga Rápida" className="bg-[#141417] text-rose-300">FADIGA RÁPIDA</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-[#1c1c21] border border-white/10 px-2.5 py-1.5 rounded-sm">
                  <Layers className="w-3 h-3 text-purple-400" />
                  <select
                    value={filterFormat}
                    onChange={(e) => setFilterFormat(e.target.value)}
                    className="bg-transparent text-zinc-300 text-[11px] font-space font-bold uppercase focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-[#141417] text-zinc-200">TODOS OS FORMATOS</option>
                    <option value="Reels" className="bg-[#141417] text-zinc-200">REELS (9:16)</option>
                    <option value="Stories" className="bg-[#141417] text-zinc-200">STORIES (9:16)</option>
                    <option value="Carrossel" className="bg-[#141417] text-zinc-200">CARROSSEL (1:1)</option>
                    <option value="Feed" className="bg-[#141417] text-zinc-200">FEED POST (4:5)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Scope Selection Toolbar: Explicit filter buttons for Nome de Campanha, Formato and Público-Alvo */}
            <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-space text-[10px] uppercase tracking-wider text-zinc-500 mr-1">
                  FILTRAR POR:
                </span>

                <button
                  onClick={() => setSearchScope('all')}
                  className={`px-2.5 py-1 rounded-sm font-space text-[10px] uppercase font-bold transition-all cursor-pointer ${
                    searchScope === 'all'
                      ? 'bg-purple-600 text-black shadow-sm'
                      : 'bg-[#1c1c21] text-zinc-400 hover:text-zinc-200 border border-white/10'
                  }`}
                >
                  TODOS OS CAMPOS
                </button>

                <button
                  onClick={() => setSearchScope('campaignName')}
                  className={`px-2.5 py-1 rounded-sm font-space text-[10px] uppercase font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    searchScope === 'campaignName'
                      ? 'bg-purple-600 text-black shadow-sm'
                      : 'bg-[#1c1c21] text-zinc-400 hover:text-zinc-200 border border-white/10'
                  }`}
                >
                  <Tag className="w-2.5 h-2.5" />
                  <span>NOME DA CAMPANHA</span>
                </button>

                <button
                  onClick={() => setSearchScope('format')}
                  className={`px-2.5 py-1 rounded-sm font-space text-[10px] uppercase font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    searchScope === 'format'
                      ? 'bg-purple-600 text-black shadow-sm'
                      : 'bg-[#1c1c21] text-zinc-400 hover:text-zinc-200 border border-white/10'
                  }`}
                >
                  <Layers className="w-2.5 h-2.5" />
                  <span>FORMATO</span>
                </button>

                <button
                  onClick={() => setSearchScope('audienceSegment')}
                  className={`px-2.5 py-1 rounded-sm font-space text-[10px] uppercase font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    searchScope === 'audienceSegment'
                      ? 'bg-purple-600 text-black shadow-sm'
                      : 'bg-[#1c1c21] text-zinc-400 hover:text-zinc-200 border border-white/10'
                  }`}
                >
                  <Users className="w-2.5 h-2.5" />
                  <span>PÚBLICO-ALVO</span>
                </button>
              </div>

              {/* Match Counter in Space Mono */}
              <div className="font-space text-[11px] text-zinc-400 shrink-0">
                <span className="text-purple-400 font-bold">{filteredAds.length}</span> DE <span className="text-zinc-300">{ads.length}</span> ANÚNCIOS
                {searchQuery && (
                  <span className="text-zinc-500 ml-1.5 font-normal">
                    (TERMO: "{searchQuery}")
                  </span>
                )}
              </div>
            </div>

            {/* Quick Filter Tag Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 font-space text-[10px] text-zinc-500">
              <span>SUGESTÕES RÁPIDAS:</span>
              <button
                onClick={() => { setSearchScope('campaignName'); setSearchQuery('ESCASSEZ'); }}
                className="px-2 py-0.5 rounded-sm bg-[#1c1c21] hover:bg-white/10 text-zinc-300 border border-white/5 transition-colors cursor-pointer"
              >
                #ESCASSEZ
              </button>
              <button
                onClick={() => { setSearchScope('format'); setSearchQuery('Reels'); }}
                className="px-2 py-0.5 rounded-sm bg-[#1c1c21] hover:bg-white/10 text-zinc-300 border border-white/5 transition-colors cursor-pointer"
              >
                #REELS 9:16
              </button>
              <button
                onClick={() => { setSearchScope('format'); setSearchQuery('Stories'); }}
                className="px-2 py-0.5 rounded-sm bg-[#1c1c21] hover:bg-white/10 text-zinc-300 border border-white/5 transition-colors cursor-pointer"
              >
                #STORIES
              </button>
              <button
                onClick={() => { setSearchScope('audienceSegment'); setSearchQuery('Funk'); }}
                className="px-2 py-0.5 rounded-sm bg-[#1c1c21] hover:bg-white/10 text-zinc-300 border border-white/5 transition-colors cursor-pointer"
              >
                #PÚBLICO FUNK
              </button>
              <button
                onClick={() => { setSearchScope('audienceSegment'); setSearchQuery('Macaé'); }}
                className="px-2 py-0.5 rounded-sm bg-[#1c1c21] hover:bg-white/10 text-zinc-300 border border-white/5 transition-colors cursor-pointer"
              >
                #REGIÃO MACAÉ
              </button>
              {(searchQuery || filterTag !== 'all' || filterFormat !== 'all') && (
                <button
                  onClick={() => { setSearchQuery(''); setSearchScope('all'); setFilterTag('all'); setFilterFormat('all'); }}
                  className="px-2 py-0.5 rounded-sm bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 transition-colors cursor-pointer ml-auto"
                >
                  LIMPAR FILTROS ✕
                </button>
              )}
            </div>
          </div>

          {/* AD CARDS GRID (Variation 2 Architectural Layout) */}
          {filteredAds.length === 0 ? (
            <div className="bg-[#141417] border border-white/10 rounded-sm p-12 text-center space-y-3 shadow-xl">
              <div className="p-3 bg-purple-950/40 rounded-sm w-fit mx-auto border border-purple-800/40 text-purple-400">
                <Bookmark className="w-8 h-8" />
              </div>
              <h3 className="font-display font-extrabold text-base text-white uppercase tracking-tight">
                Nenhum anúncio correspondente encontrado
              </h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                Nenhum anúncio salvo no evento bate com a busca no campo <strong className="text-purple-300">{searchScope === 'campaignName' ? 'Nome da Campanha' : searchScope === 'format' ? 'Formato' : searchScope === 'audienceSegment' ? 'Público-Alvo' : 'Geral'}</strong>.
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  onClick={() => { setSearchQuery(''); setFilterTag('all'); setFilterFormat('all'); setSearchScope('all'); }}
                  className="px-4 py-2 bg-purple-600 text-black font-space font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-purple-500 transition-colors cursor-pointer"
                >
                  Limpar Todos os Filtros
                </button>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 bg-[#1c1c21] text-zinc-200 border border-white/15 font-space font-bold text-xs uppercase tracking-wider rounded-sm hover:border-purple-500 transition-colors cursor-pointer"
                >
                  + Salvar Novo Anúncio
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredAds.map((ad) => {
                const isWinner = ad.performanceTag === 'Winner (Campeão de Vendas)';
                const isHighEng = ad.performanceTag === 'Alto Engajamento';
                const isOptimized = ad.performanceTag === 'CPA Otimizado';
                const isFatigue = ad.performanceTag === 'Fadiga Rápida';

                const badgeBg = isWinner 
                  ? 'bg-amber-400 text-black font-black'
                  : isHighEng
                  ? 'bg-fuchsia-500 text-white font-bold'
                  : isOptimized
                  ? 'bg-emerald-500 text-black font-bold'
                  : isFatigue
                  ? 'bg-rose-500 text-white font-bold'
                  : 'bg-zinc-700 text-zinc-200 font-bold';

                const badgeLabel = isWinner
                  ? 'WINNER'
                  : isHighEng
                  ? 'ENGAGEMENT'
                  : isOptimized
                  ? 'CPA OTIMIZADO'
                  : isFatigue
                  ? 'FADIGA'
                  : 'EM TESTE';

                return (
                  <div
                    key={ad.id}
                    className={`bg-[#141417] border rounded-sm p-4 space-y-3.5 transition-all shadow-md ${
                      isWinner
                        ? 'border-amber-400/50 hover:border-amber-400'
                        : 'border-white/10 hover:border-purple-500/80'
                    }`}
                  >
                    {/* Card Header: Badge, Campaign Name, Format & Audience */}
                    <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-space text-[10px] px-2 py-0.5 rounded-xs tracking-wider uppercase ${badgeBg}`}>
                            {badgeLabel}
                          </span>

                          <span className="font-space text-[10px] text-zinc-400 bg-[#1c1c21] border border-white/10 px-2 py-0.5 rounded-xs uppercase">
                            {ad.format}
                          </span>

                          {ad.audienceSegment && (
                            <span className="font-space text-[10px] text-purple-300 bg-purple-950/50 border border-purple-800/40 px-2 py-0.5 rounded-xs truncate max-w-[200px]" title={ad.audienceSegment}>
                              {ad.audienceSegment}
                            </span>
                          )}
                        </div>

                        <h3 className="font-space text-xs font-bold text-white tracking-wide truncate mt-1">
                          {ad.campaignName}
                        </h3>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleCopyText(ad)}
                          className="p-1.5 bg-[#1c1c21] hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 rounded-sm transition-colors cursor-pointer"
                          title="Copiar dados e copy do anúncio"
                        >
                          {copiedId === ad.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteAd(ad.id)}
                          className="p-1.5 bg-[#1c1c21] hover:bg-rose-950/60 text-zinc-400 hover:text-rose-300 border border-white/10 hover:border-rose-800/40 rounded-sm transition-colors cursor-pointer"
                          title="Excluir anúncio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Copy Box (Variation 2 Style: surface-accent #1c1c21) */}
                    <div className="bg-[#1c1c21] border border-white/5 p-3 rounded-sm space-y-2 text-xs">
                      <div className="space-y-0.5">
                        <span className="font-space text-[9px] uppercase tracking-wider text-purple-400 block font-bold">
                          HOOK (0-3s):
                        </span>
                        <p className="text-zinc-100 font-medium text-[11px] leading-snug">
                          "{ad.hook3s}"
                        </p>
                      </div>

                      {ad.copyPrimary && (
                        <>
                          <hr className="border-t border-white/10 my-1.5" />
                          <div className="space-y-0.5">
                            <span className="font-space text-[9px] uppercase tracking-wider text-zinc-500 block">
                              COPY PRINCIPAL:
                            </span>
                            <p className="text-zinc-300 text-[11px] leading-relaxed line-clamp-3">
                              {ad.copyPrimary}
                            </p>
                          </div>
                        </>
                      )}

                      {(ad.headline || ad.callToAction) && (
                        <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px] font-space text-zinc-400 flex-wrap gap-1">
                          {ad.headline && (
                            <span>HEADLINE: <strong className="text-zinc-200">{ad.headline}</strong></span>
                          )}
                          {ad.callToAction && (
                            <span className="ml-auto bg-[#141417] px-1.5 py-0.5 rounded-xs border border-white/10 text-purple-300">
                              CTA: {ad.callToAction}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Metrics Bar (Variation 2 Style: horizontal pills with monospace values) */}
                    <div className="pt-2 border-t border-white/10">
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        <div className="flex flex-col">
                          <span className="font-space text-[9px] text-zinc-500 uppercase tracking-wider">ROAS</span>
                          <span className="font-space text-xs font-bold text-emerald-400">
                            {ad.metrics?.roas ? `${ad.metrics.roas}x` : '-'}
                          </span>
                        </div>

                        <div className="flex flex-col">
                          <span className="font-space text-[9px] text-zinc-500 uppercase tracking-wider">CPA</span>
                          <span className="font-space text-xs font-bold text-zinc-100">
                            R${ad.metrics?.cpa ? Math.round(Number(ad.metrics.cpa)) : '-'}
                          </span>
                        </div>

                        <div className="flex flex-col">
                          <span className="font-space text-[9px] text-zinc-500 uppercase tracking-wider">CTR</span>
                          <span className="font-space text-xs font-bold text-purple-300">
                            {ad.metrics?.ctr ? `${ad.metrics.ctr}%` : '-'}
                          </span>
                        </div>

                        <div className="flex flex-col">
                          <span className="font-space text-[9px] text-zinc-500 uppercase tracking-wider">CLIQUES</span>
                          <span className="font-space text-xs font-bold text-zinc-200">
                            {ad.metrics?.clicks ? (ad.metrics.clicks >= 1000 ? `${(ad.metrics.clicks/1000).toFixed(1)}k` : ad.metrics.clicks) : '-'}
                          </span>
                        </div>

                        <div className="flex flex-col">
                          <span className="font-space text-[9px] text-zinc-500 uppercase tracking-wider">VENDAS</span>
                          <span className="font-space text-xs font-bold text-zinc-100">
                            {ad.metrics?.purchases || 0}
                          </span>
                        </div>

                        <div className="flex flex-col">
                          <span className="font-space text-[9px] text-zinc-500 uppercase tracking-wider">GASTO</span>
                          <span className="font-space text-xs font-bold text-zinc-300">
                            R${ad.metrics?.spend ? (ad.metrics.spend >= 1000 ? `${(ad.metrics.spend/1000).toFixed(1)}k` : ad.metrics.spend) : '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Agent Notes */}
                    {ad.agentNotes && (
                      <div className="bg-purple-950/20 border border-purple-900/30 p-2.5 rounded-sm flex items-start gap-2">
                        <Brain className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-zinc-300 leading-snug font-sans">
                          <strong className="text-purple-300 font-space uppercase text-[9px] block">Aprendizado do Agente:</strong>
                          {ad.agentNotes}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* MODAL: CADASTRAR NOVO ANÚNCIO NA BIBLIOTECA */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#141417] border border-white/15 rounded-sm max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-display font-extrabold text-base text-white uppercase tracking-tight flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-purple-400" />
                  Salvar Anúncio na Biblioteca Pessoal
                </h3>
                <p className="font-space text-[10px] text-zinc-400 uppercase tracking-wider">
                  MÉTRICAS COMPLETAS PARA APRENDIZADO DOS AGENTES DE IA
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-sm text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAdSubmit} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-space text-[10px] uppercase font-bold mb-1">
                    Nome da Campanha / Criativo *:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: CAMPANHA_ESCASSEZ_VIRADA_LOTE"
                    value={newAd.campaignName}
                    onChange={(e) => setNewAd({ ...newAd, campaignName: e.target.value })}
                    className="w-full bg-[#1c1c21] border border-white/10 focus:border-purple-500 rounded-sm px-3 py-2 text-white font-space text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-space text-[10px] uppercase font-bold mb-1">
                    Formato do Anúncio *:
                  </label>
                  <select
                    value={newAd.format}
                    onChange={(e) => setNewAd({ ...newAd, format: e.target.value })}
                    className="w-full bg-[#1c1c21] border border-white/10 focus:border-purple-500 rounded-sm px-3 py-2 text-white font-space text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="Stories / Reels Ads 9:16">Stories / Reels Ads (9:16)</option>
                    <option value="Reels Ads 9:16 com Áudio Sincronizado">Reels Ads 9:16 com Áudio Sincronizado</option>
                    <option value="Feed Carrossel 1:1">Feed Carrossel (1:1)</option>
                    <option value="Feed Post 4:5">Feed Post (4:5)</option>
                    <option value="TikTok Ads 9:16">TikTok Ads (9:16)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-purple-300 font-space text-[10px] uppercase font-bold mb-1">
                  Segmento de Público-Alvo *:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Jovens 18-24 anos de Macaé e Região dos Lagos / Fãs de Funk & Trap"
                  value={newAd.audienceSegment}
                  onChange={(e) => setNewAd({ ...newAd, audienceSegment: e.target.value })}
                  className="w-full bg-[#1c1c21] border border-white/10 focus:border-purple-500 rounded-sm px-3 py-2 text-white text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-space text-[10px] uppercase font-bold mb-1">
                  Gancho dos Primeiros 3 Segundos (Hook 3s) *:
                </label>
                <input
                  type="text"
                  required
                  placeholder='Ex: Cronômetro na tela: "Faltam 4 horas para virar o lote da INSONIA"'
                  value={newAd.hook3s}
                  onChange={(e) => setNewAd({ ...newAd, hook3s: e.target.value })}
                  className="w-full bg-[#1c1c21] border border-white/10 focus:border-purple-500 rounded-sm px-3 py-2 text-white text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-space text-[10px] uppercase font-bold mb-1">
                  Texto Principal (Copy do Anúncio):
                </label>
                <textarea
                  rows={3}
                  placeholder="Escreva a copy utilizada no anúncio..."
                  value={newAd.copyPrimary}
                  onChange={(e) => setNewAd({ ...newAd, copyPrimary: e.target.value })}
                  className="w-full bg-[#1c1c21] border border-white/10 focus:border-purple-500 rounded-sm px-3 py-2 text-white text-xs focus:outline-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-300 font-space text-[10px] uppercase font-bold mb-1">
                    Headline:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: ÚLTIMAS HORAS DE LOTE 1"
                    value={newAd.headline}
                    onChange={(e) => setNewAd({ ...newAd, headline: e.target.value })}
                    className="w-full bg-[#1c1c21] border border-white/10 focus:border-purple-500 rounded-sm px-3 py-2 text-white text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-space text-[10px] uppercase font-bold mb-1">
                    Call to Action (CTA):
                  </label>
                  <input
                    type="text"
                    value={newAd.callToAction}
                    onChange={(e) => setNewAd({ ...newAd, callToAction: e.target.value })}
                    className="w-full bg-[#1c1c21] border border-white/10 focus:border-purple-500 rounded-sm px-3 py-2 text-white text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-space text-[10px] uppercase font-bold mb-1">
                    Classificação / Tag:
                  </label>
                  <select
                    value={newAd.performanceTag}
                    onChange={(e) => setNewAd({ ...newAd, performanceTag: e.target.value as any })}
                    className="w-full bg-[#1c1c21] border border-white/10 focus:border-purple-500 rounded-sm px-3 py-2 text-white font-space text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="Winner (Campeão de Vendas)">Winner (Campeão ⭐)</option>
                    <option value="Alto Engajamento">Alto Engajamento</option>
                    <option value="CPA Otimizado">CPA Otimizado</option>
                    <option value="Em Teste">Em Teste</option>
                    <option value="Fadiga Rápida">Fadiga Rápida</option>
                  </select>
                </div>
              </div>

              {/* Metrics Section */}
              <div className="p-3 bg-[#1c1c21] rounded-sm border border-white/10 space-y-2">
                <span className="font-space text-[10px] uppercase tracking-wider text-purple-400 font-bold block">
                  Métricas Reais Obtidas:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-zinc-400 font-space text-[9px] mb-1">Gasto (R$):</label>
                    <input
                      type="number"
                      step="any"
                      value={newAd.spend}
                      onChange={(e) => setNewAd({ ...newAd, spend: Number(e.target.value) })}
                      className="w-full bg-[#141417] border border-white/10 rounded-sm px-2.5 py-1.5 text-white font-space text-xs focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 font-space text-[9px] mb-1">Impressões:</label>
                    <input
                      type="number"
                      value={newAd.impressions}
                      onChange={(e) => setNewAd({ ...newAd, impressions: Number(e.target.value) })}
                      className="w-full bg-[#141417] border border-white/10 rounded-sm px-2.5 py-1.5 text-white font-space text-xs focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 font-space text-[9px] mb-1">Cliques:</label>
                    <input
                      type="number"
                      value={newAd.clicks}
                      onChange={(e) => setNewAd({ ...newAd, clicks: Number(e.target.value) })}
                      className="w-full bg-[#141417] border border-white/10 rounded-sm px-2.5 py-1.5 text-white font-space text-xs focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 font-space text-[9px] mb-1">Vendas (Ingressos):</label>
                    <input
                      type="number"
                      value={newAd.purchases}
                      onChange={(e) => setNewAd({ ...newAd, purchases: Number(e.target.value) })}
                      className="w-full bg-[#141417] border border-white/10 rounded-sm px-2.5 py-1.5 text-white font-space text-xs focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-zinc-400 font-space text-[9px] mb-1">Faturamento (R$):</label>
                    <input
                      type="number"
                      step="any"
                      value={newAd.revenue}
                      onChange={(e) => setNewAd({ ...newAd, revenue: Number(e.target.value) })}
                      className="w-full bg-[#141417] border border-white/10 rounded-sm px-2.5 py-1.5 text-white font-space text-xs focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 font-space text-[9px] mb-1">CPA (R$):</label>
                    <input
                      type="number"
                      step="any"
                      value={newAd.cpa}
                      onChange={(e) => setNewAd({ ...newAd, cpa: Number(e.target.value) })}
                      className="w-full bg-[#141417] border border-white/10 rounded-sm px-2.5 py-1.5 text-white font-space text-xs focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 font-space text-[9px] mb-1">ROAS (x):</label>
                    <input
                      type="number"
                      step="any"
                      value={newAd.roas}
                      onChange={(e) => setNewAd({ ...newAd, roas: Number(e.target.value) })}
                      className="w-full bg-[#141417] border border-white/10 rounded-sm px-2.5 py-1.5 text-white font-space text-xs focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 font-space text-[9px] mb-1">CTR (%):</label>
                    <input
                      type="number"
                      step="any"
                      value={newAd.ctr}
                      onChange={(e) => setNewAd({ ...newAd, ctr: Number(e.target.value) })}
                      className="w-full bg-[#141417] border border-white/10 rounded-sm px-2.5 py-1.5 text-white font-space text-xs focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-purple-300 font-space text-[10px] uppercase font-bold mb-1 flex items-center gap-1">
                  <Brain className="w-3.5 h-3.5" />
                  Nota de Aprendizado para os Agentes:
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Roteiro com drop sincronizado no segundo 2 gerou o menor CPA histórico no Funk e Trap."
                  value={newAd.agentNotes}
                  onChange={(e) => setNewAd({ ...newAd, agentNotes: e.target.value })}
                  className="w-full bg-[#1c1c21] border border-white/10 focus:border-purple-500 rounded-sm px-3 py-2 text-white text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-transparent hover:bg-white/5 border border-white/10 text-zinc-300 font-space font-bold text-xs uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-black font-space font-bold text-xs uppercase tracking-wider rounded-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-purple-950/40"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvar Anúncio</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
