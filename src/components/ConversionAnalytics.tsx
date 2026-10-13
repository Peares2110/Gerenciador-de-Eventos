import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  ExternalLink, 
  MousePointerClick, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  Flame, 
  ShoppingCart, 
  Send, 
  BarChart3, 
  ArrowRight, 
  Layers, 
  Filter, 
  RefreshCw, 
  Sliders, 
  Sparkles, 
  Check, 
  HelpCircle,
  Percent,
  Play
} from 'lucide-react';
import { EventData, CrmMessageTemplate, GandayaAbandonedCart, CrmCartOverride } from '../types';
import { SheetsExportButton } from './SheetsExportButton';

interface ConversionAnalyticsProps {
  event: EventData;
  onUpdateEvent: (updated: EventData) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const ConversionAnalytics: React.FC<ConversionAnalyticsProps> = ({
  event,
  onUpdateEvent,
  onNavigateToTab
}) => {
  // Filters & State
  const [selectedTemplateFilter, setSelectedTemplateFilter] = useState<string>('all');
  const [timeWindowFilter, setTimeWindowFilter] = useState<'all' | '24h' | '7d'>('all');
  const [searchLeadTerm, setSearchLeadTerm] = useState('');
  const [isSimulatingClick, setIsSimulatingClick] = useState<string | null>(null);
  const [conversionLiftSlider, setConversionLiftSlider] = useState<number>(15);
  const [activeViewMode, setActiveViewMode] = useState<'funnel' | 'templates' | 'leads'>('funnel');

  const abandonedCarts: GandayaAbandonedCart[] = useMemo(() => {
    return event.gandayaReport?.abandonedCarts || [];
  }, [event.gandayaReport?.abandonedCarts]);

  const cartOverrides: Record<string, CrmCartOverride> = useMemo(() => {
    return event.crm?.abandonedCartOverrides || {};
  }, [event.crm?.abandonedCartOverrides]);

  const templates: CrmMessageTemplate[] = useMemo(() => {
    return event.crm?.templates || [];
  }, [event.crm?.templates]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalCarts = abandonedCarts.length;
    const totalRetainedValue = abandonedCarts.reduce((acc, c) => acc + (c.total || 0), 0);

    let totalDispatches = 0;
    let contactedCartsCount = 0;
    let totalClicks = 0;
    let cartsWithClicksCount = 0;
    let recoveredCartsCount = 0;
    let recoveredRevenue = 0;
    let droppedOffCount = 0;

    // Per template stats
    const templateStatsMap: Record<string, {
      title: string;
      dispatches: number;
      clicks: number;
      conversions: number;
      revenue: number;
    }> = {};

    abandonedCarts.forEach(c => {
      const override = cartOverrides[c.userId];
      const status = override?.status || 'Pendente';
      const clicks = override?.linkClicks || 0;
      const dispatches = override?.dispatchedCount || (override?.status && override.status !== 'Pendente' ? 1 : 0);
      const tplId = override?.templateId || 'tpl-recuperacao-carrinho';
      const tplTitle = override?.templateTitle || 
        templates.find(t => t.id === tplId)?.title || 
        'Recuperação Padrão';

      if (!templateStatsMap[tplId]) {
        templateStatsMap[tplId] = {
          title: tplTitle,
          dispatches: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0
        };
      }

      if (dispatches > 0) {
        totalDispatches += dispatches;
        contactedCartsCount += 1;
        templateStatsMap[tplId].dispatches += dispatches;
      }

      if (clicks > 0) {
        totalClicks += clicks;
        cartsWithClicksCount += 1;
        templateStatsMap[tplId].clicks += clicks;
      }

      if (status === 'Recuperado') {
        recoveredCartsCount += 1;
        recoveredRevenue += (c.total || 0);
        templateStatsMap[tplId].conversions += 1;
        templateStatsMap[tplId].revenue += (c.total || 0);
      } else if (status === 'Desistiu') {
        droppedOffCount += 1;
      }
    });

    // Taxa de cliques dos disparos (CTR)
    const clickThroughRate = contactedCartsCount > 0 
      ? (cartsWithClicksCount / contactedCartsCount) * 100 
      : 0;

    // TAXA PRINCIPAL SOLICITADA: Conversão em relação aos links de pagamento clicados
    const conversionRateFromClicks = cartsWithClicksCount > 0 
      ? (recoveredCartsCount / cartsWithClicksCount) * 100 
      : 0;

    // Taxa de Conversão Global dos disparos
    const overallConversionRate = contactedCartsCount > 0 
      ? (recoveredCartsCount / contactedCartsCount) * 100 
      : 0;

    // Receita por Link Clicado (R$ / clique)
    const revenuePerClick = cartsWithClicksCount > 0 
      ? recoveredRevenue / cartsWithClicksCount 
      : 0;

    // Drop-off pós clique (leads que clicaram mas não pagaram)
    const postClickDropoffRate = cartsWithClicksCount > 0 
      ? ((cartsWithClicksCount - recoveredCartsCount) / cartsWithClicksCount) * 100 
      : 0;

    return {
      totalCarts,
      totalRetainedValue,
      totalDispatches,
      contactedCartsCount,
      totalClicks,
      cartsWithClicksCount,
      recoveredCartsCount,
      recoveredRevenue,
      droppedOffCount,
      clickThroughRate,
      conversionRateFromClicks,
      overallConversionRate,
      revenuePerClick,
      postClickDropoffRate,
      templateStats: Object.entries(templateStatsMap).map(([id, data]) => ({
        id,
        ...data,
        ctr: data.dispatches > 0 ? (data.clicks / data.dispatches) * 100 : 0,
        crFromClicks: data.clicks > 0 ? (data.conversions / data.clicks) * 100 : 0
      }))
    };
  }, [abandonedCarts, cartOverrides, templates]);

  // Action: Track/Simulate Link Click for a cart
  const handleSimulateClick = async (cartId: string) => {
    setIsSimulatingClick(cartId);
    try {
      const res = await fetch(`/api/events/${event.id}/crm/track-click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartId,
          templateId: cartOverrides[cartId]?.templateId || 'tpl-recuperacao-carrinho'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.crm) {
          onUpdateEvent({
            ...event,
            crm: data.crm
          });
        }
      }
    } catch (e) {
      console.error('Error tracking click:', e);
    } finally {
      setIsSimulatingClick(null);
    }
  };

  // Action: Fast mark as Recovered / Converted
  const handleToggleRecovered = async (cart: GandayaAbandonedCart) => {
    const isCurrentlyRecovered = cartOverrides[cart.userId]?.status === 'Recuperado';
    const newStatus = isCurrentlyRecovered ? 'Contatado' : 'Recuperado';

    try {
      const res = await fetch(`/api/events/${event.id}/crm/abandoned-cart-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartId: cart.userId,
          status: newStatus,
          recoveredAmount: cart.total,
          ticketQuantity: cart.quantity,
          linkClicks: Math.max(1, cartOverrides[cart.userId]?.linkClicks || 1),
          recoveryNotes: isCurrentlyRecovered 
            ? 'Status revertido para em negociação' 
            : 'Convertido e pago com sucesso após clique no link'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.event) {
          onUpdateEvent(data.event);
        }
      }
    } catch (e) {
      console.error('Error updating status:', e);
    }
  };

  // Filtered Leads Table
  const filteredLeadRows = useMemo(() => {
    return abandonedCarts.filter(c => {
      const override = cartOverrides[c.userId];
      const matchesSearch = searchLeadTerm === '' ||
        c.userName.toLowerCase().includes(searchLeadTerm.toLowerCase()) ||
        c.userPhone.includes(searchLeadTerm) ||
        c.batchDescription.toLowerCase().includes(searchLeadTerm.toLowerCase());
      
      const matchesTemplate = selectedTemplateFilter === 'all' || 
        override?.templateId === selectedTemplateFilter;

      return matchesSearch && matchesTemplate;
    });
  }, [abandonedCarts, cartOverrides, searchLeadTerm, selectedTemplateFilter]);

  // Projected incremental revenue calculator
  const projectedExtraRevenue = useMemo(() => {
    const unrecoveredValue = metrics.totalRetainedValue - metrics.recoveredRevenue;
    const additionalConversionFraction = conversionLiftSlider / 100;
    return Math.round(unrecoveredValue * additionalConversionFraction);
  }, [metrics.totalRetainedValue, metrics.recoveredRevenue, conversionLiftSlider]);

  // Export data for Google Sheets
  const exportHeaders = [
    'Cliente', 
    'Telefone', 
    'Lote', 
    'Valor (R$)', 
    'Disparos', 
    'Cliques no Link', 
    'Último Clique', 
    'Status Conversão',
    'Modelo Utilizado'
  ];

  const exportRows = useMemo(() => {
    return abandonedCarts.map(c => {
      const override = cartOverrides[c.userId];
      return [
        c.userName,
        c.userPhone,
        c.batchDescription,
        `R$ ${c.total.toFixed(2)}`,
        override?.dispatchedCount || (override?.status && override.status !== 'Pendente' ? '1' : '0'),
        override?.linkClicks || '0',
        override?.lastClickedAt ? new Date(override.lastClickedAt).toLocaleTimeString('pt-BR') : 'Sem clique',
        override?.status || 'Pendente',
        override?.templateTitle || 'Padrão'
      ];
    });
  }, [abandonedCarts, cartOverrides]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* ============================================================== */}
      {/* 1. HEADER & CONTROLES DO ANALYTICS */}
      {/* ============================================================== */}
      <div className="bg-[#141417] border border-white/[0.08] rounded-[4px] p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 rounded-[3px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Analytics de Conversão dos Disparos
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] text-[10px] font-mono uppercase font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <MousePointerClick className="w-3 h-3 text-emerald-400" />
                  Rastreamento de Links de Checkout
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-mono uppercase font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  Gandaya Checkout Connect
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitoramento determinístico da taxa de conversão dos disparos de WhatsApp e e-mail em relação aos links de pagamento clicados.
              </p>
            </div>
          </div>

          {/* Quick Action / View Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-[#1c1c21] rounded-[2px] border border-white/[0.08] p-0.5 text-xs font-mono">
              <button
                onClick={() => setActiveViewMode('funnel')}
                className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
                  activeViewMode === 'funnel'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Funil de Conversão
              </button>
              <button
                onClick={() => setActiveViewMode('templates')}
                className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
                  activeViewMode === 'templates'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Por Modelo
              </button>
              <button
                onClick={() => setActiveViewMode('leads')}
                className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
                  activeViewMode === 'leads'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Leads & Cliques ({metrics.totalCarts})
              </button>
            </div>

            <SheetsExportButton
              filename={`Analytics_Conversao_Carrinhos_${event.id}`}
              title={`Métricas de Conversão e Cliques - ${event.name}`}
              headers={exportHeaders}
              rows={exportRows}
              label="EXPORTAR ANALYTICS"
            />
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. KPI CARDS PRINCIPAIS (COM FOCO NA TAXA CLIQUE -> CONVERSÃO) */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: TAXA PRINCIPAL - CONVERSÃO PÓS-CLIQUE */}
        <div className="bg-[#141417] border border-emerald-500/30 p-4 rounded-[4px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-emerald-400 flex items-center gap-1.5">
              <MousePointerClick className="w-3.5 h-3.5" />
              Conversão pós-clique
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
              OFICIAL
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-mono font-bold text-white tracking-tight">
              {metrics.conversionRateFromClicks.toFixed(1)}%
            </span>
            <span className="text-xs text-emerald-400 font-mono font-semibold">
              ({metrics.recoveredCartsCount} de {metrics.cartsWithClicksCount} leads)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Participantes que clicaram no link de checkout e <strong>concluíram a compra</strong>.
          </p>
          <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-500">Drop-off no checkout:</span>
            <span className="text-amber-400 font-semibold">{metrics.postClickDropoffRate.toFixed(1)}%</span>
          </div>
        </div>

        {/* KPI 2: TAXA DE CLIQUE (CTR DOS DISPAROS) */}
        <div className="bg-[#141417] border border-white/[0.08] p-4 rounded-[4px]">
          <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-purple-400 flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5" />
            CTR do Link de Pagamento
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-mono font-bold text-white tracking-tight">
              {metrics.clickThroughRate.toFixed(1)}%
            </span>
            <span className="text-xs text-purple-300 font-mono">
              ({metrics.totalClicks} cliques totais)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            {metrics.cartsWithClicksCount} dos {metrics.contactedCartsCount} leads contatados abriram a página de pagamento.
          </p>
          <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-500">Média de cliques/lead:</span>
            <span className="text-white font-semibold">
              {metrics.cartsWithClicksCount > 0 ? (metrics.totalClicks / metrics.cartsWithClicksCount).toFixed(1) : '0'}x
            </span>
          </div>
        </div>

        {/* KPI 3: RECEITA RECUPERADA & VALOR POR CLIQUE */}
        <div className="bg-[#141417] border border-white/[0.08] p-4 rounded-[4px]">
          <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-amber-400 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5" />
            Receita Resgatada
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-mono font-bold text-emerald-400 tracking-tight">
              R$ {metrics.recoveredRevenue.toLocaleString('pt-BR')}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            De um total retido de R$ {metrics.totalRetainedValue.toLocaleString('pt-BR')} em {metrics.totalCarts} carrinhos.
          </p>
          <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-500">Valor médio / clique:</span>
            <span className="text-emerald-400 font-semibold">R$ {metrics.revenuePerClick.toFixed(2)}</span>
          </div>
        </div>

        {/* KPI 4: EFICIÊNCIA END-TO-END (GLOBAL) */}
        <div className="bg-[#141417] border border-white/[0.08] p-4 rounded-[4px]">
          <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-cyan-400 flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5" />
            Conversão Geral dos Disparos
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-mono font-bold text-white tracking-tight">
              {metrics.overallConversionRate.toFixed(1)}%
            </span>
            <span className="text-xs text-cyan-300 font-mono">
              ({metrics.recoveredCartsCount}/{metrics.contactedCartsCount || metrics.totalCarts})
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Do total de leads acionados por WhatsApp ou e-mail até a conversão final.
          </p>
          <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-500">Taxa de Resgate Global:</span>
            <span className="text-cyan-400 font-semibold">
              {metrics.totalCarts > 0 ? ((metrics.recoveredCartsCount / metrics.totalCarts) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. FUNIL VISUAL DE CONVERSÃO INTERATIVO */}
      {/* ============================================================== */}
      <div className="bg-[#141417] border border-white/[0.08] rounded-[4px] p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                FUNIL DETERMINÍSTICO DE RECUPERAÇÃO
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300 border border-white/[0.08]">
                Disparo ➔ Clique ➔ Pagamento
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualize a retenção de cada fase e identifique gargalos de abandono no link de pagamento.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              Disparos
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
              Links Clicados
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Convertidos
            </div>
          </div>
        </div>

        {/* FUNNEL STAGES */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
          
          {/* Estágio 1: Disparos Enviados */}
          <div className="bg-[#18181c] border border-white/[0.08] p-4 rounded-[4px] relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                1. Disparos Enviados
              </span>
              <Send className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-mono font-bold text-white mt-2">
              {metrics.contactedCartsCount} leads
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              100% da base acionada
            </p>
            <div className="mt-3 w-full bg-white/[0.06] h-2 rounded-full overflow-hidden">
              <div className="bg-purple-500 h-full w-full rounded-full" />
            </div>
            <div className="mt-3 text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>Entrega estimada:</span>
              <span className="text-purple-300 font-bold">98.5%</span>
            </div>
          </div>

          {/* Estágio 2: Mensagens Abertas / Lidas */}
          <div className="bg-[#18181c] border border-white/[0.08] p-4 rounded-[4px] relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                2. Mensagens Lidas
              </span>
              <Check className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-mono font-bold text-white mt-2">
              {Math.max(metrics.cartsWithClicksCount, Math.round(metrics.contactedCartsCount * 0.92))} leads
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              ~92% taxa de abertura WhatsApp
            </p>
            <div className="mt-3 w-full bg-white/[0.06] h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full w-[92%] rounded-full" />
            </div>
            <div className="mt-3 text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>Perda no disparo:</span>
              <span className="text-slate-400">~8%</span>
            </div>
          </div>

          {/* Estágio 3: Links de Pagamento Clicados */}
          <div className="bg-[#18181c] border border-cyan-500/30 p-4 rounded-[4px] relative bg-cyan-950/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-cyan-400">
                3. Links Clicados (CTR)
              </span>
              <MousePointerClick className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-mono font-bold text-cyan-300 mt-2">
              {metrics.cartsWithClicksCount} leads
            </div>
            <p className="text-[11px] text-cyan-400 mt-1 font-mono font-semibold">
              {metrics.clickThroughRate.toFixed(1)}% taxa de cliques
            </p>
            <div className="mt-3 w-full bg-white/[0.06] h-2 rounded-full overflow-hidden">
              <div 
                className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(10, metrics.clickThroughRate))}%` }}
              />
            </div>
            <div className="mt-3 text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>Total de cliques:</span>
              <span className="text-cyan-300 font-bold">{metrics.totalClicks} acessos</span>
            </div>
          </div>

          {/* Estágio 4: Carrinhos Recuperados & Pagos */}
          <div className="bg-[#18181c] border border-emerald-500/40 p-4 rounded-[4px] relative bg-emerald-950/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-emerald-400">
                4. Pagamento Concluído
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-mono font-bold text-emerald-400 mt-2">
              {metrics.recoveredCartsCount} vendas
            </div>
            <p className="text-[11px] text-emerald-300 mt-1 font-mono font-bold">
              {metrics.conversionRateFromClicks.toFixed(1)}% dos cliques viraram venda!
            </p>
            <div className="mt-3 w-full bg-white/[0.06] h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(10, metrics.conversionRateFromClicks))}%` }}
              />
            </div>
            <div className="mt-3 text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>Receita resgatada:</span>
              <span className="text-emerald-400 font-bold">R$ {metrics.recoveredRevenue.toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </div>

        {/* FUNNEL STEP INSIGHT CALLOUT */}
        <div className="p-3.5 rounded-[3px] bg-[#1a1a20] border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-300">
              <strong>Diagnóstico de Conversão:</strong> A cada <strong>10 participantes</strong> que clicam no link de pagamento exclusivo, aproximadamente <strong>{Math.round(metrics.conversionRateFromClicks / 10)}</strong> concluem a compra imediatamente.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-[11px] text-slate-400">
              Drop-off pós-clique: <strong className="text-amber-400">{metrics.postClickDropoffRate.toFixed(1)}%</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. PERFORMANCE COMPARATIVA POR MODELO DE MENSAGEM */}
      {/* ============================================================== */}
      <div className="bg-[#141417] border border-white/[0.08] rounded-[4px] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Taxa de Conversão por Modelo de Mensagem
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Compare qual copy e gancho psicológico gerou maior taxa de cliques e conversões efetivas de pagamento.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-[10px] font-mono uppercase text-slate-400 bg-white/[0.02]">
                <th className="py-2.5 px-3">Modelo / Copy</th>
                <th className="py-2.5 px-3">Disparos</th>
                <th className="py-2.5 px-3">Cliques no Link</th>
                <th className="py-2.5 px-3">CTR (Taxa de Clique)</th>
                <th className="py-2.5 px-3">Vendas (Convertidos)</th>
                <th className="py-2.5 px-3 text-emerald-400 font-bold">Taxa Conversão dos Cliques</th>
                <th className="py-2.5 px-3">Receita Resgatada</th>
                <th className="py-2.5 px-3 text-right">Classificação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {metrics.templateStats.map(stat => {
                const isBestCR = stat.crFromClicks > 40;
                return (
                  <tr key={stat.id} className="hover:bg-white/[0.02] transition-colors font-mono">
                    <td className="py-3 px-3 font-sans text-white font-medium max-w-xs truncate">
                      {stat.title}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {stat.dispatches} envios
                    </td>
                    <td className="py-3 px-3 text-cyan-300">
                      {stat.clicks} cliques
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-purple-500 h-full rounded-full" 
                            style={{ width: `${Math.min(100, stat.ctr)}%` }} 
                          />
                        </div>
                        <span>{stat.ctr.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-emerald-300 font-bold">
                      {stat.conversions} vendas
                    </td>
                    <td className="py-3 px-3 text-emerald-400 font-bold">
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 bg-white/[0.06] h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full" 
                            style={{ width: `${Math.min(100, stat.crFromClicks)}%` }} 
                          />
                        </div>
                        <span className="text-sm">{stat.crFromClicks.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-white font-bold">
                      R$ {stat.revenue.toLocaleString('pt-BR')},00
                    </td>
                    <td className="py-3 px-3 text-right">
                      {isBestCR ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] uppercase font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <Flame className="w-3 h-3 text-emerald-400" />
                          Top Conversão
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] uppercase font-semibold bg-white/[0.06] text-slate-400 border border-white/[0.08]">
                          Estável
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. TABELA DE RASTREAMENTO LEAD A LEAD (COM SIMULADOR DE CLIQUE) */}
      {/* ============================================================== */}
      <div className="bg-[#141417] border border-white/[0.08] rounded-[4px] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MousePointerClick className="w-4 h-4 text-emerald-400" />
              Detalhamento de Cliques no Link por Lead
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Acompanhe quem já acessou o link do carrinho, número de cliques registrados e status do pagamento.
            </p>
          </div>

          {/* Search Lead */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou lote..."
              value={searchLeadTerm}
              onChange={(e) => setSearchLeadTerm(e.target.value)}
              className="bg-[#1c1c21] border border-white/[0.08] text-xs text-white rounded-[2px] px-3 py-1.5 focus:outline-none focus:border-emerald-500/50 w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-[10px] font-mono uppercase text-slate-400 bg-white/[0.02]">
                <th className="py-2.5 px-3">Cliente / Contato</th>
                <th className="py-2.5 px-3">Lote</th>
                <th className="py-2.5 px-3">Valor Total</th>
                <th className="py-2.5 px-3">Disparo</th>
                <th className="py-2.5 px-3 text-cyan-300 font-bold">Cliques no Link</th>
                <th className="py-2.5 px-3">Último Acesso</th>
                <th className="py-2.5 px-3">Status Pagamento</th>
                <th className="py-2.5 px-3 text-right">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredLeadRows.map(cart => {
                const override = cartOverrides[cart.userId];
                const status = override?.status || 'Pendente';
                const clicks = override?.linkClicks || 0;
                const isRecovered = status === 'Recuperado';

                return (
                  <tr key={cart.userId} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white">{cart.userName}</div>
                      <div className="text-[11px] font-mono text-slate-400">{cart.userPhone}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">
                      {cart.batchDescription}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-white">
                      R$ {cart.total.toFixed(2)}
                    </td>
                    <td className="py-3 px-3">
                      {override?.dispatchedCount || (status !== 'Pendente' ? 1 : 0) ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                          <Check className="w-2.5 h-2.5" />
                          Enviado via WhatsApp
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-slate-400 border border-white/[0.08]">
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {clicks > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] font-mono text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                          <MousePointerClick className="w-3 h-3 text-cyan-400" />
                          {clicks} clique{clicks > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-slate-500">
                          0 cliques
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[11px] font-mono text-slate-400">
                      {override?.lastClickedAt ? (
                        <span className="text-slate-300">
                          {new Date(override.lastClickedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {isRecovered ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Recuperado
                        </span>
                      ) : clicks > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          <Clock className="w-3 h-3 text-amber-400" />
                          Clicou / No Checkout
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-slate-400">
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Simular/Registrar Clique no Link */}
                        <button
                          onClick={() => handleSimulateClick(cart.userId)}
                          disabled={isSimulatingClick === cart.userId}
                          title="Simular ou registrar clique no link exclusivo deste lead"
                          className="px-2 py-1 rounded-[2px] text-[10px] font-mono font-bold bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <MousePointerClick className="w-3 h-3" />
                          <span>+1 Clique</span>
                        </button>

                        {/* Marcar Recuperado / Pago */}
                        <button
                          onClick={() => handleToggleRecovered(cart)}
                          title={isRecovered ? "Desmarcar recuperação" : "Confirmar pagamento e registrar conversão"}
                          className={`px-2 py-1 rounded-[2px] text-[10px] font-mono font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                            isRecovered
                              ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                              : 'bg-white/[0.06] hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-white/[0.08]'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{isRecovered ? 'Pago ✓' : 'Converter'}</span>
                        </button>

                        {/* Abrir Link do Carrinho Diretamente */}
                        <a
                          href={`https://gandaya.com/eventos/${event.id}/checkout?cartId=${cart.userId}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Abrir página oficial de checkout deste carrinho"
                          className="p-1 rounded-[2px] bg-white/[0.04] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 6. CALCULADORA DE IMPACTO: CENÁRIO DE ALAVANCAGEM DE CONVERSÃO */}
      {/* ============================================================== */}
      <div className="bg-[#141417] border border-white/[0.08] rounded-[4px] p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                Simulador de Alavancagem: Impacto do Aumento de Conversão
              </h4>
            </div>
            <p className="text-xs text-slate-400">
              Veja a receita incremental estimada se otimizarmos a taxa de conversão pós-clique dos carrinhos ainda pendentes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400">Aumento da Taxa:</span>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={conversionLiftSlider}
              onChange={(e) => setConversionLiftSlider(Number(e.target.value))}
              className="accent-emerald-500 cursor-pointer w-32"
            />
            <span className="font-mono text-xs font-bold text-emerald-400 w-12 text-right">
              +{conversionLiftSlider}%
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[#18181c] p-3 rounded-[3px] border border-white/[0.06]">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Receita Pendente em Risco</span>
            <div className="text-base font-mono font-bold text-amber-400 mt-1">
              R$ {(metrics.totalRetainedValue - metrics.recoveredRevenue).toLocaleString('pt-BR')},00
            </div>
          </div>

          <div className="bg-[#18181c] p-3 rounded-[3px] border border-white/[0.06]">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Ganho Adicional Estimado</span>
            <div className="text-base font-mono font-bold text-emerald-400 mt-1">
              + R$ {projectedExtraRevenue.toLocaleString('pt-BR')},00
            </div>
          </div>

          <div className="bg-[#18181c] p-3 rounded-[3px] border border-white/[0.06]">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Ingressos Adicionais Resgatados</span>
            <div className="text-base font-mono font-bold text-white mt-1">
              + {Math.round(projectedExtraRevenue / (event.ticketPriceLote || 90))} ingressos
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
