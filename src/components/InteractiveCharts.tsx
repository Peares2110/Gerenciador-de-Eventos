import React, { useState } from 'react';
import { EventData, HourlyAdMetric } from '../types';
import { Activity, Clock, Users, Target, TrendingUp, AlertCircle } from 'lucide-react';

interface InteractiveChartsProps {
  event: EventData;
}

export const InteractiveCharts: React.FC<InteractiveChartsProps> = ({ event }) => {
  const [activeMetricTab, setActiveMetricTab] = useState<'revenue' | 'ticket_trajectory' | 'cpa_roas' | 'heatmap' | 'demographics'>('revenue');
  const [hoveredHour, setHoveredHour] = useState<HourlyAdMetric | null>(null);

  const hourlyData: HourlyAdMetric[] = event.hourlyMetrics && event.hourlyMetrics.length > 0
    ? event.hourlyMetrics
    : [];

  const maxRevenue = Math.max(...hourlyData.map(h => h.revenue), 100);
  const maxSpend = Math.max(...hourlyData.map(h => h.spend), 10);
  const maxRoas = Math.max(...hourlyData.map(h => h.roas), 1);

  // SVG Chart Dimensions
  const chartWidth = 720;
  const chartHeight = 200;
  const paddingX = 35;
  const paddingY = 20;
  const usableWidth = chartWidth - paddingX * 2;
  const usableHeight = chartHeight - paddingY * 2;

  const getX = (index: number) => paddingX + (index / (Math.max(1, hourlyData.length - 1))) * usableWidth;
  const getYRevenue = (rev: number) => chartHeight - paddingY - (rev / maxRevenue) * usableHeight;
  const getYSpend = (spend: number) => chartHeight - paddingY - (spend / maxSpend) * usableHeight;
  const getYRoas = (roas: number) => chartHeight - paddingY - (roas / maxRoas) * usableHeight;

  const revenuePoints = hourlyData.length > 1 ? hourlyData.map((h, i) => `${getX(i)},${getYRevenue(h.revenue)}`).join(' ') : '';
  const spendPoints = hourlyData.length > 1 ? hourlyData.map((h, i) => `${getX(i)},${getYSpend(h.spend)}`).join(' ') : '';
  const roasPoints = hourlyData.length > 1 ? hourlyData.map((h, i) => `${getX(i)},${getYRoas(h.roas)}`).join(' ') : '';

  const percentSold = event.capacity > 0 ? Math.round((event.soldTickets / event.capacity) * 100) : 0;

  return (
    <div className="card-v2 space-y-4">
      {/* Chart Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
        <div>
          <h2 className="label-tech text-[#8b5cf6] font-bold">
            PERFORMANCE DE MÍDIA & VENDAS (TELEMETRIA DETERMINÍSTICA)
          </h2>
          <p className="text-xs text-[var(--ink-dim)] mt-0.5">
            Métricas oficiais registradas e consolidação horário a horário
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#1c1c21] rounded-[2px] border border-white/[0.08] text-xs font-mono font-bold">
          <button
            onClick={() => setActiveMetricTab('revenue')}
            className={`px-3 py-1.5 rounded-[2px] transition-colors cursor-pointer text-[11px] uppercase tracking-wider ${
              activeMetricTab === 'revenue'
                ? 'bg-[#8b5cf6] text-black font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Receita vs Ads (24h)
          </button>

          <button
            onClick={() => setActiveMetricTab('ticket_trajectory')}
            className={`px-3 py-1.5 rounded-[2px] transition-colors cursor-pointer text-[11px] uppercase tracking-wider ${
              activeMetricTab === 'ticket_trajectory'
                ? 'bg-[#8b5cf6] text-black font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Curva de Lotação
          </button>

          <button
            onClick={() => setActiveMetricTab('cpa_roas')}
            className={`px-3 py-1.5 rounded-[2px] transition-colors cursor-pointer text-[11px] uppercase tracking-wider ${
              activeMetricTab === 'cpa_roas'
                ? 'bg-[#8b5cf6] text-black font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ROAS & CPA Alvo
          </button>

          <button
            onClick={() => setActiveMetricTab('heatmap')}
            className={`px-3 py-1.5 rounded-[2px] transition-colors cursor-pointer text-[11px] uppercase tracking-wider ${
              activeMetricTab === 'heatmap'
                ? 'bg-[#8b5cf6] text-black font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Picos de Audiência
          </button>

          <button
            onClick={() => setActiveMetricTab('demographics')}
            className={`px-3 py-1.5 rounded-[2px] transition-colors cursor-pointer text-[11px] uppercase tracking-wider ${
              activeMetricTab === 'demographics'
                ? 'bg-[#8b5cf6] text-black font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Público & Alvo
          </button>
        </div>
      </div>

      {/* GRAPH 1: Revenue vs Spend (24h) */}
      {activeMetricTab === 'revenue' && (
        <div className="space-y-3">
          {hourlyData.length === 0 ? (
            <div className="bg-[#07050d] rounded-lg p-8 border border-purple-950/30 text-center space-y-2">
              <Activity className="w-8 h-8 text-purple-400/50 mx-auto" />
              <h3 className="text-xs font-semibold text-white">Nenhum tráfego horário computado ainda</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                A curva de receita vs investimento em anúncios será desenhada em tempo real assim que os primeiros anúncios começarem a rodar.
              </p>
              <div className="pt-2 text-xs font-mono text-purple-300">
                Faturamento Atual: R$ {event.currentRevenue.toLocaleString('pt-BR')} · Investimento em Ads: R$ {event.spentAdBudget.toLocaleString('pt-BR')}
              </div>
            </div>
          ) : (
            <div className="relative bg-[#07050d] rounded-lg p-2 overflow-hidden border border-purple-950/30">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-44 sm:h-52 overflow-visible">
                {revenuePoints && (
                  <polyline points={revenuePoints} fill="none" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" />
                )}
                {spendPoints && (
                  <polyline points={spendPoints} fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="4 4" />
                )}
              </svg>
            </div>
          )}
        </div>
      )}

      {/* GRAPH 2: Capacity Trajectory */}
      {activeMetricTab === 'ticket_trajectory' && (
        <div className="space-y-3">
          <div className="bg-[#07050d] rounded-lg p-6 border border-purple-950/30 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Lotação do Evento:</span>
              <span className="font-mono text-purple-300 font-bold">
                {event.soldTickets.toLocaleString('pt-BR')} / {event.capacity.toLocaleString('pt-BR')} ingressos ({percentSold}%)
              </span>
            </div>

            {/* Real Progress Bar */}
            <div className="w-full bg-[#150f24] rounded-full h-4 p-0.5 border border-purple-900/40 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-600 to-violet-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(2, percentSold))}%` }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
              <div className="bg-[#0b0816] p-3 rounded-lg border border-purple-950/50">
                <span className="text-slate-500 block text-[10px]">Ingressos Restantes</span>
                <span className="text-white font-mono font-bold text-sm">
                  {Math.max(0, event.capacity - event.soldTickets).toLocaleString('pt-BR')}
                </span>
              </div>

              <div className="bg-[#0b0816] p-3 rounded-lg border border-purple-950/50">
                <span className="text-slate-500 block text-[10px]">Lote Atual</span>
                <span className="text-purple-300 font-mono font-bold text-sm">
                  {event.currentLote} (R$ {event.ticketPriceLote})
                </span>
              </div>

              <div className="bg-[#0b0816] p-3 rounded-lg border border-purple-950/50">
                <span className="text-slate-500 block text-[10px]">Faturamento Atual</span>
                <span className="text-white font-mono font-bold text-sm">
                  R$ {event.currentRevenue.toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GRAPH 3: ROAS & CPA */}
      {activeMetricTab === 'cpa_roas' && (
        <div className="space-y-3">
          {hourlyData.length === 0 ? (
            <div className="bg-[#07050d] rounded-lg p-8 border border-purple-950/30 text-center space-y-2">
              <Target className="w-8 h-8 text-purple-400/50 mx-auto" />
              <h3 className="text-xs font-semibold text-white">Nenhum anúncio veiculado ainda</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                O monitoramento de CPA e ROAS entrará em ação com o início das campanhas no Meta Ads.
              </p>
              <div className="pt-2 text-xs font-mono text-purple-300">
                Meta de CPA: R$ {event.targetCpa.toFixed(2)} · Orçamento Total: R$ {event.totalAdBudget.toLocaleString('pt-BR')}
              </div>
            </div>
          ) : (
            <div className="bg-[#07050d] rounded-lg p-4 border border-purple-950/30">
              <div className="text-xs text-purple-300 font-mono">
                ROAS Atual: {event.blendedRoas}x · CPA Atual: R$ {event.currentCpa.toFixed(2)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* GRAPH 4: Heatmap */}
      {activeMetricTab === 'heatmap' && (
        <div className="space-y-3">
          <div className="bg-[#07050d] rounded-lg p-6 border border-purple-950/30 space-y-3">
            <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              Picos de Audiência Cadastrados
            </h3>
            {event.audience?.peakEngagementHours?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {event.audience.peakEngagementHours.map((h, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-lg bg-purple-950/60 border border-purple-800/40 text-purple-300 font-mono text-xs">
                    {h}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Nenhum horário de pico customizado definido ainda. O sistema utilizará os picos padrão de eventos (12h, 18h45, 21h15, 23h30).
              </p>
            )}
          </div>
        </div>
      )}

      {/* GRAPH 5: Demographics */}
      {activeMetricTab === 'demographics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-[#07050d] p-4 rounded-xl border border-purple-950/40 space-y-2">
            <span className="font-semibold text-purple-300 block">Segmentação de Público</span>
            <div className="space-y-1 text-slate-300">
              <div><strong>Gênero do Evento:</strong> {event.genre}</div>
              <div><strong>Localidade Principal:</strong> {event.city || 'A definir'} ({event.venue || 'Local a definir'})</div>
              <div><strong>Faixa Etária:</strong> {event.audience?.primaryAge || 'A definir'}</div>
            </div>
          </div>

          <div className="bg-[#07050d] p-4 rounded-xl border border-purple-950/40 space-y-2">
            <span className="font-semibold text-purple-300 block">Lineup Cadastrado</span>
            {event.lineup?.length > 0 ? (
              <ul className="space-y-1 text-slate-300">
                {event.lineup.map((dj, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <span>{dj.name}</span>
                    <span className="font-mono text-purple-400">{dj.timeSlot}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500">Nenhum artista adicionado ainda ao lineup.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
