import React, { useState } from 'react';
import { 
  Megaphone, 
  Sliders, 
  Play, 
  Pause, 
  Save, 
  Check, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Layers, 
  Sparkles, 
  Clock, 
  Trash2, 
  Edit3,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { EventData, DailyAdPlan, DayPlan } from '../types';

interface CampaignManagerEditProps {
  event: EventData;
  onUpdateEventCalendar: (date: string, dayPlan: DayPlan) => void;
  onNavigateToTab: (tab: string) => void;
}

export const CampaignManagerEdit: React.FC<CampaignManagerEditProps> = ({
  event,
  onUpdateEventCalendar,
  onNavigateToTab
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'Ativo' | 'Pausado'>('all');
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Extract all campaigns across all dates in event.calendar
  const allCampaignsWithDate: { date: string; ad: DailyAdPlan }[] = [];
  
  if (event.calendar) {
    Object.keys(event.calendar).sort().forEach((dateKey) => {
      const dayPlan = event.calendar[dateKey];
      if (dayPlan?.ads) {
        dayPlan.ads.forEach((ad) => {
          allCampaignsWithDate.push({ date: dateKey, ad });
        });
      }
    });
  }

  // Fallback initial campaigns if calendar has none yet
  const effectiveCampaigns = allCampaignsWithDate.length > 0 
    ? allCampaignsWithDate 
    : [
        {
          date: '2026-10-10',
          ad: {
            id: 'camp-default-1',
            campaignName: `TRAFEGO_CONVERSAO_LOTE1_${event.genre.toUpperCase().replace(/\s+/g, '_')}`,
            format: 'Stories / Reels Ads 9:16',
            audienceSegment: 'Público 18-28 anos com afinidade musical',
            dailyBudget: Math.round(event.totalAdBudget > 0 ? (event.totalAdBudget / 30) : 150),
            targetCpa: event.targetCpa || 25,
            hookAngle: 'Últimas unidades de Lote 1 com virada confirmada.',
            status: 'Ativo' as const
          }
        },
        {
          date: '2026-10-10',
          ad: {
            id: 'camp-default-2',
            campaignName: 'REMARKETING_ENG_INSTAGRAM_7D',
            format: 'Feed Carrossel + Stories',
            audienceSegment: 'Envolvidos com Instagram nos últimos 7 dias',
            dailyBudget: Math.round(event.totalAdBudget > 0 ? (event.totalAdBudget / 40) : 100),
            targetCpa: event.targetCpa ? event.targetCpa * 0.8 : 20,
            hookAngle: 'Seu lugar na pista já tem data marcada.',
            status: 'Ativo' as const
          }
        }
      ];

  // Local draft state for editing
  const [campaignList, setCampaignList] = useState<{ date: string; ad: DailyAdPlan }[]>(effectiveCampaigns);

  // Update a campaign property
  const handleUpdateField = (id: string, field: keyof DailyAdPlan, value: any) => {
    setCampaignList((prev) =>
      prev.map((item) =>
        item.ad.id === id ? { ...item, ad: { ...item.ad, [field]: value } } : item
      )
    );
  };

  // Toggle status between Ativo and Pausado
  const handleToggleStatus = (id: string) => {
    setCampaignList((prev) =>
      prev.map((item) => {
        if (item.ad.id === id) {
          const nextStatus = item.ad.status === 'Ativo' ? 'Pausado' : 'Ativo';
          return { ...item, ad: { ...item.ad, status: nextStatus } };
        }
        return item;
      })
    );
  };

  // Quick actions: Scale Budget (+20%)
  const handleScaleBudget = () => {
    setCampaignList((prev) =>
      prev.map((item) => ({
        ...item,
        ad: {
          ...item.ad,
          dailyBudget: Math.round(item.ad.dailyBudget * 1.2)
        }
      }))
    );
  };

  // Quick actions: Pause All
  const handlePauseAll = () => {
    setCampaignList((prev) =>
      prev.map((item) => ({
        ...item,
        ad: {
          ...item.ad,
          status: 'Pausado'
        }
      }))
    );
  };

  // Quick actions: Activate All
  const handleActivateAll = () => {
    setCampaignList((prev) =>
      prev.map((item) => ({
        ...item,
        ad: {
          ...item.ad,
          status: 'Ativo'
        }
      }))
    );
  };

  // Save all changes back to event.calendar
  const handleSaveAll = () => {
    // Group campaigns by date
    const groupedByDate: Record<string, DailyAdPlan[]> = {};
    campaignList.forEach(({ date, ad }) => {
      if (!groupedByDate[date]) groupedByDate[date] = [];
      groupedByDate[date].push(ad);
    });

    Object.keys(groupedByDate).forEach((dateKey) => {
      const existingDay = event.calendar?.[dateKey] || {
        date: dateKey,
        posts: [],
        stories: [],
        reels: [],
        ads: []
      };
      onUpdateEventCalendar(dateKey, {
        ...existingDay,
        ads: groupedByDate[dateKey]
      });
    });

    setEditingCampaignId(null);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  const filteredCampaigns = campaignList.filter(({ ad }) => {
    if (filterStatus === 'all') return true;
    return ad.status === filterStatus;
  });

  const totalDailySpend = campaignList
    .filter((c) => c.ad.status === 'Ativo')
    .reduce((acc, curr) => acc + (Number(curr.ad.dailyBudget) || 0), 0);

  const activeCount = campaignList.filter((c) => c.ad.status === 'Ativo').length;
  const pausedCount = campaignList.filter((c) => c.ad.status === 'Pausado').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0b0816] p-5 rounded-2xl border border-purple-950/70 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-300 mb-0.5">
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-mono uppercase">PAINEL DE MODIFICAÇÃO DE CAMPANHAS</span>
            <span>·</span>
            <span className="text-slate-400">Editar & Ajustar Anúncios Ativos</span>
          </div>
          <h2 className="font-display text-xl font-black text-white">
            Gerenciador de Campanhas Existentes
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Modifique orçamentos diários, pause/ative conjuntos e ajuste hooks de conversão para {event.name}.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => onNavigateToTab('campaign_gen')}
            className="py-2 px-3 rounded-xl bg-purple-950/80 hover:bg-purple-900/60 text-purple-200 border border-purple-800/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Criar Nova Campanha</span>
          </button>

          <button
            onClick={handleSaveAll}
            className="py-2 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:brightness-110 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-purple-950/50 cursor-pointer transition-all"
          >
            {savedFeedback ? (
              <>
                <Check className="w-4 h-4 text-green-300" />
                <span>Alterações Salvas!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Modificações</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary KPI Strips */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-[#0b0816] p-4 rounded-xl border border-purple-950/60 flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[11px]">Orçamento Diário Ativo</span>
            <span className="font-mono text-base font-bold text-white mt-0.5 block">
              R$ {totalDailySpend.toLocaleString('pt-BR')} / dia
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-purple-950/80 text-purple-300 border border-purple-800/40 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#0b0816] p-4 rounded-xl border border-purple-950/60 flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[11px]">Campanhas em Execução</span>
            <span className="font-mono text-base font-bold text-green-400 mt-0.5 block">
              {activeCount} Ativas
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-green-950/40 text-green-400 border border-green-800/40 flex items-center justify-center">
            <Play className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#0b0816] p-4 rounded-xl border border-purple-950/60 flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[11px]">Campanhas Pausadas</span>
            <span className="font-mono text-base font-bold text-amber-400 mt-0.5 block">
              {pausedCount} Pausadas
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-950/40 text-amber-400 border border-amber-800/40 flex items-center justify-center">
            <Pause className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#0b0816] p-4 rounded-xl border border-purple-950/60 flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[11px]">Lote em Conversão</span>
            <span className="font-mono text-base font-bold text-purple-300 mt-0.5 block">
              {event.currentLote} (R$ {event.ticketPriceLote})
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-purple-950/80 text-purple-300 border border-purple-800/40 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Control Actions & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d091c] p-3 rounded-xl border border-purple-950/60 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 text-[11px] mr-1">Filtrar:</span>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-purple-600/40 text-white border border-purple-500/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todas ({campaignList.length})
          </button>
          <button
            onClick={() => setFilterStatus('Ativo')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              filterStatus === 'Ativo'
                ? 'bg-green-600/40 text-green-200 border border-green-500/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Ativas ({activeCount})
          </button>
          <button
            onClick={() => setFilterStatus('Pausado')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              filterStatus === 'Pausado'
                ? 'bg-amber-600/40 text-amber-200 border border-amber-500/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pausadas ({pausedCount})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleScaleBudget}
            className="px-2.5 py-1 rounded-lg bg-[#140f26] hover:bg-purple-900/40 text-purple-300 border border-purple-900/50 text-[11px] font-semibold transition-colors cursor-pointer"
            title="Aumentar orçamento em 20% em todas as campanhas"
          >
            +20% Orçamento
          </button>
          <button
            onClick={handlePauseAll}
            className="px-2.5 py-1 rounded-lg bg-[#140f26] hover:bg-amber-950/60 text-amber-300 border border-amber-900/50 text-[11px] font-semibold transition-colors cursor-pointer"
          >
            Pausar Todas
          </button>
          <button
            onClick={handleActivateAll}
            className="px-2.5 py-1 rounded-lg bg-[#140f26] hover:bg-green-950/60 text-green-300 border border-green-900/50 text-[11px] font-semibold transition-colors cursor-pointer"
          >
            Ativar Todas
          </button>
        </div>
      </div>

      {/* Campaigns Modification Table / Cards */}
      <div className="space-y-3">
        {filteredCampaigns.length === 0 ? (
          <div className="bg-[#0b0816] border border-purple-950/60 rounded-2xl p-8 text-center text-slate-400 text-xs space-y-3">
            <p>Nenhuma campanha encontrada com o filtro selecionado.</p>
            <button
              onClick={() => onNavigateToTab('campaign_gen')}
              className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gerar Primeira Campanha</span>
            </button>
          </div>
        ) : (
          filteredCampaigns.map(({ date, ad }) => {
            const isEditing = editingCampaignId === ad.id;
            return (
              <div
                key={ad.id}
                className={`bg-[#0b0816] rounded-2xl border transition-all p-4 space-y-3 shadow-lg ${
                  ad.status === 'Ativo'
                    ? 'border-purple-900/60 shadow-purple-950/20'
                    : 'border-purple-950/40 opacity-80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-950/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => handleToggleStatus(ad.id)}
                      className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[10px] flex items-center gap-1.5 cursor-pointer transition-colors ${
                        ad.status === 'Ativo'
                          ? 'bg-green-950 text-green-400 border border-green-800/50 hover:bg-green-900/60'
                          : 'bg-amber-950 text-amber-400 border border-amber-800/50 hover:bg-amber-900/60'
                      }`}
                    >
                      {ad.status === 'Ativo' ? (
                        <>
                          <Play className="w-2.5 h-2.5" />
                          <span>ATIVO</span>
                        </>
                      ) : (
                        <>
                          <Pause className="w-2.5 h-2.5" />
                          <span>PAUSADO</span>
                        </>
                      )}
                    </button>

                    <div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={ad.campaignName}
                          onChange={(e) => handleUpdateField(ad.id, 'campaignName', e.target.value)}
                          className="bg-[#120d24] border border-purple-800 rounded px-2 py-0.5 font-mono text-xs font-bold text-white focus:outline-none"
                        />
                      ) : (
                        <span className="font-mono font-bold text-xs text-white">
                          {ad.campaignName}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 ml-2 font-mono">
                        ({ad.format})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-purple-400" />
                      <span>{date}</span>
                    </span>

                    <button
                      onClick={() => setEditingCampaignId(isEditing ? null : ad.id)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-purple-950/60 transition-colors cursor-pointer"
                      title={isEditing ? 'Concluir edição' : 'Editar parâmetros'}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* Budget Modifier */}
                  <div className="bg-[#120d24] p-3 rounded-xl border border-purple-900/40 space-y-1">
                    <span className="text-slate-400 block text-[10px] font-semibold">Orçamento Diário:</span>
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 text-xs">R$</span>
                        <input
                          type="number"
                          value={ad.dailyBudget}
                          onChange={(e) => handleUpdateField(ad.id, 'dailyBudget', Number(e.target.value) || 0)}
                          className="w-full bg-[#0a0714] border border-purple-800 rounded px-2 py-1 text-xs text-white font-mono font-bold"
                        />
                      </div>
                    ) : (
                      <span className="font-mono font-bold text-sm text-purple-200">
                        R$ {ad.dailyBudget.toLocaleString('pt-BR')}/dia
                      </span>
                    )}
                  </div>

                  {/* Target CPA Modifier */}
                  <div className="bg-[#120d24] p-3 rounded-xl border border-purple-900/40 space-y-1">
                    <span className="text-slate-400 block text-[10px] font-semibold">CPA Alvo Máximo:</span>
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 text-xs">R$</span>
                        <input
                          type="number"
                          value={ad.targetCpa}
                          onChange={(e) => handleUpdateField(ad.id, 'targetCpa', Number(e.target.value) || 0)}
                          className="w-full bg-[#0a0714] border border-purple-800 rounded px-2 py-1 text-xs text-white font-mono font-bold"
                        />
                      </div>
                    ) : (
                      <span className="font-mono font-bold text-sm text-slate-200">
                        R$ {ad.targetCpa?.toFixed(2) || '25.00'}
                      </span>
                    )}
                  </div>

                  {/* Audience Segment Modifier */}
                  <div className="bg-[#120d24] p-3 rounded-xl border border-purple-900/40 space-y-1">
                    <span className="text-slate-400 block text-[10px] font-semibold">Público / Segmentação:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={ad.audienceSegment}
                        onChange={(e) => handleUpdateField(ad.id, 'audienceSegment', e.target.value)}
                        className="w-full bg-[#0a0714] border border-purple-800 rounded px-2 py-1 text-xs text-white font-mono"
                      />
                    ) : (
                      <span className="text-xs text-slate-300 block truncate" title={ad.audienceSegment}>
                        {ad.audienceSegment}
                      </span>
                    )}
                  </div>
                </div>

                {/* Hook / Creative Angle */}
                <div className="bg-[#0a0714] p-3 rounded-xl border border-purple-950/60 text-xs space-y-1">
                  <span className="text-purple-400 block text-[10px] font-semibold">Ângulo do Criativo (Hook):</span>
                  {isEditing ? (
                    <textarea
                      rows={2}
                      value={ad.hookAngle}
                      onChange={(e) => handleUpdateField(ad.id, 'hookAngle', e.target.value)}
                      className="w-full bg-[#120d24] border border-purple-800 rounded p-2 text-xs text-slate-200 focus:outline-none"
                    />
                  ) : (
                    <p className="text-slate-200 text-xs leading-relaxed italic">
                      "{ad.hookAngle}"
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
