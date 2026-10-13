import React from 'react';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  ArrowUpRight,
  Clock,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { EventData } from '../types';
import { SheetsExportButton } from './SheetsExportButton';
import { InteractiveCharts } from './InteractiveCharts';

interface MetricsDashboardProps {
  event: EventData;
  onNavigateToTab: (tabId: string) => void;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ event, onNavigateToTab }) => {
  const percentSold = event.capacity > 0 ? Math.round((event.soldTickets / event.capacity) * 100) : 0;
  const percentRevenue = event.revenueTarget > 0 ? Math.round((event.currentRevenue / event.revenueTarget) * 100) : 0;
  const remainingTickets = Math.max(0, event.capacity - event.soldTickets);

  // Projections
  const daysUntilEvent = Math.max(1, Math.ceil((new Date(event.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
  const estimatedDailySales = Math.max(1, Math.round(event.soldTickets / Math.max(1, 45 - daysUntilEvent)));
  const projectedFinalSales = Math.min(event.capacity, event.soldTickets + (estimatedDailySales * daysUntilEvent));

  const sheetsHeaders = ['Métrica', 'Atual', 'Meta', 'Status'];
  const sheetsRows = [
    ['Evento', event.name, '-', event.genre],
    ['Ingressos Vendidos', event.soldTickets, event.capacity, `${percentSold}% da capacidade`],
    ['Ingressos Restantes', remainingTickets, '-', `${remainingTickets} disponíveis`],
    ['Faturamento', `R$ ${event.currentRevenue.toLocaleString('pt-BR')}`, `R$ ${event.revenueTarget.toLocaleString('pt-BR')}`, `${percentRevenue}% da meta`],
    ['Lote Ativo', event.currentLote, `R$ ${event.ticketPriceLote}`, `Virada em ~${event.loteCountdownHours}h`],
    ['ROAS Blended', `${event.blendedRoas}x`, '4.0x', event.blendedRoas >= 4 ? 'Saudável' : 'Atenção'],
    ['CPA Médio', `R$ ${event.currentCpa.toFixed(2)}`, `R$ ${event.targetCpa.toFixed(2)}`, event.currentCpa <= event.targetCpa ? 'Dentro da meta' : 'Acima']
  ];

  return (
    <div className="space-y-6">
      {/* 1. Variation 2 Hero Card: Gradient with Accent Border & Syne 800 Typography */}
      <div className="hero-card-v2 p-6 sm:p-8 space-y-4 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
          <div className="label-tech flex items-center gap-2">
            <span>VISÃO ESTRATÉGICA</span>
            <span className="text-white/20">·</span>
            <span style={{ color: 'var(--accent)' }} className="font-bold">{event.currentLote.toUpperCase()}</span>
            <span className="text-white/20">·</span>
            <span>{event.genre.toUpperCase()}</span>
            <span className="text-white/20">·</span>
            <span>{event.venue || event.city}</span>
          </div>

          <div className="label-tech text-slate-400">
            DATA DO EVENTO: <span className="text-white font-bold">{event.date}</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <h1 className="hero-title-v2 text-3xl sm:text-4xl lg:text-5xl text-[#f8f8f8] leading-none uppercase">
              {event.name}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--ink-dim)] leading-relaxed">
              {event.tagline || 'Sistema de inteligência tática para venda de ingressos, calibração determinística de tráfego pago e proteção de margem operacional.'} Concentração máxima em criativos de escassez e tração com CPA teto de R$ {event.targetCpa.toFixed(2)}.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() => onNavigateToTab('campaign_hourly')}
              className="btn-v2 btn-v2-primary"
            >
              AUDITAR CRIATIVOS
            </button>
            <button
              onClick={() => onNavigateToTab('planning')}
              className="btn-v2 btn-v2-outline"
            >
              EDITAR ESTRATÉGIA
            </button>
            <button
              onClick={() => onNavigateToTab('costs')}
              className="btn-v2 btn-v2-outline text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 flex items-center gap-1.5"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>CUSTOS & RECEITAS</span>
            </button>
            <SheetsExportButton
              filename={`Relatorio_Executivo_${event.id}`}
              title={`Relatório Executivo - ${event.name}`}
              headers={sheetsHeaders}
              rows={sheetsRows}
              label="EXPORTAR PLANILHA"
            />
          </div>
        </div>

        {/* AI Strategic Note (Variation 2 dashed style) */}
        <div className="ai-note-v2 text-xs text-purple-200 mt-2">
          <span className="font-mono font-bold text-[#8b5cf6] shrink-0 uppercase tracking-wider">
            [AUDITORIA DO AGENTE]:
          </span>
          <span>
            {percentSold}% da lotação atingida ({event.soldTickets.toLocaleString('pt-BR')} de {event.capacity.toLocaleString('pt-BR')} ingressos). 
            Virada do <strong>{event.currentLote}</strong> prevista para as próximas ~{event.loteCountdownHours} horas. 
            ROAS consolidado em <strong>{event.blendedRoas}x</strong> com CPA médio de R$ {event.currentCpa.toFixed(2)}.
            {event.audience?.peakEngagementHours && event.audience.peakEngagementHours.length > 0 && (
              <> Manter pressão máxima nos horários de pico ({event.audience.peakEngagementHours.slice(0, 3).join(', ')}).</>
            )}
          </span>
        </div>
      </div>

      {/* 2. Variation 2 Consolidated Grid Stats: High-contrast 6-metric box */}
      <div className="space-y-2">
        <div className="label-tech flex items-center justify-between">
          <span>MÉTRICAS CONSOLIDADAS DO EVENTO</span>
          <span className="text-[#8b5cf6] font-bold">TEMPO REAL</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-white/[0.08] border border-white/[0.08] rounded-[4px] overflow-hidden shadow-xl">
          <div className="stat-item-v2">
            <span className="label-tech text-slate-400">ROAS BLENDED</span>
            <span className="stat-value-v2 text-emerald-400 mt-1">{event.blendedRoas}x</span>
            <span className="text-[10px] font-mono text-slate-500 mt-0.5">Meta: 4.0x</span>
          </div>

          <div className="stat-item-v2">
            <span className="label-tech text-slate-400">CPA MÉDIO</span>
            <span className="stat-value-v2 text-white mt-1">R$ {event.currentCpa.toFixed(0)}</span>
            <span className="text-[10px] font-mono text-slate-500 mt-0.5">Teto R$ {event.targetCpa.toFixed(0)}</span>
          </div>

          <div className="stat-item-v2">
            <span className="label-tech text-slate-400">INGRESSOS</span>
            <span className="stat-value-v2 text-white mt-1">{event.soldTickets.toLocaleString('pt-BR')}</span>
            <span className="text-[10px] font-mono text-slate-500 mt-0.5">de {event.capacity.toLocaleString('pt-BR')}</span>
          </div>

          <div className="stat-item-v2">
            <span className="label-tech text-slate-400">RECEITA ATUAL</span>
            <span className="stat-value-v2 text-purple-300 mt-1">
              R$ {event.currentRevenue >= 1000 ? `${(event.currentRevenue / 1000).toFixed(0)}k` : event.currentRevenue}
            </span>
            <span className="text-[10px] font-mono text-slate-500 mt-0.5">Meta: R$ {(event.revenueTarget / 1000).toFixed(0)}k</span>
          </div>

          <div className="stat-item-v2">
            <span className="label-tech text-slate-400">LOTAÇÃO</span>
            <span className="stat-value-v2 text-white mt-1">{percentSold}%</span>
            <span className="text-[10px] font-mono text-slate-500 mt-0.5">{remainingTickets} restantes</span>
          </div>

          <div className="stat-item-v2">
            <span className="label-tech text-slate-400">ATINGIMENTO</span>
            <span className="stat-value-v2 text-emerald-400 mt-1">{percentRevenue}%</span>
            <span className="text-[10px] font-mono text-slate-500 mt-0.5">da meta faturada</span>
          </div>
        </div>
      </div>

      {/* 3. Central Telemetry & Charts Component */}
      <div>
        <InteractiveCharts event={event} />
      </div>

      {/* 4. Strategic Briefing: Variation 2 Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Left: Lote Status & Projection */}
        <div className="card-v2 space-y-4">
          <div className="border-b border-white/[0.08] pb-2 flex items-center justify-between">
            <h2 className="label-tech text-[#8b5cf6] font-bold">
              SITUAÇÃO DO LOTE & BILHETERIA
            </h2>
            <span className="badge-tech">{event.currentLote}</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
              <span className="text-slate-400">Lote Ativo</span>
              <span className="font-semibold text-white">{event.currentLote}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
              <span className="text-slate-400">Preço do Lote Atual</span>
              <span className="font-mono text-white">R$ {event.ticketPriceLote},00</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
              <span className="text-slate-400">Previsão de Virada</span>
              <span className="font-mono text-purple-300">~{event.loteCountdownHours} horas restantes</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
              <span className="text-slate-400">Ritmo Estimado de Vendas</span>
              <span className="font-mono text-white">~{estimatedDailySales} ingressos / dia</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
              <span className="text-slate-400">Projeção Final de Fechamento</span>
              <span className="font-mono text-emerald-400 font-bold">
                {projectedFinalSales.toLocaleString('pt-BR')} ingressos
              </span>
            </div>
          </div>
        </div>

        {/* Right: Lineup & Audience Peak Hours */}
        <div className="card-v2 space-y-4">
          <div className="border-b border-white/[0.08] pb-2 flex items-center justify-between">
            <h2 className="label-tech text-[#8b5cf6] font-bold">
              LINEUP & PICOS DE ENGAJAMENTO
            </h2>
            <span className="label-tech text-slate-400">GRADE ARTÍSTICA</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="label-tech block mb-2 text-slate-400">
                ATRAÇÕES CONFIRMADAS:
              </span>
              <div className="space-y-1.5">
                {event.lineup?.map((dj) => (
                  <div key={dj.id} className="flex items-center justify-between py-1.5 border-b border-white/[0.06]">
                    <div>
                      <span className="font-medium text-white">{dj.name}</span>
                      <span className="text-slate-500 ml-2">({dj.role})</span>
                    </div>
                    <span className="font-mono text-[#8b5cf6] text-[11px]">{dj.timeSlot}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <span className="label-tech block mb-1.5 text-slate-400">
                HORÁRIOS NOBRES DA AUDIÊNCIA:
              </span>
              <div className="flex gap-2 flex-wrap text-slate-300 font-mono text-[11px]">
                {event.audience?.peakEngagementHours?.map((h) => (
                  <span key={h} className="badge-tech">
                    {h}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
