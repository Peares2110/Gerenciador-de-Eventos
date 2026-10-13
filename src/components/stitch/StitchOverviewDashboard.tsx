import React, { useState } from 'react';
import { EventData, HourlyAdMetric } from '../../types';
import { SheetsExportButton } from '../SheetsExportButton';

interface StitchOverviewDashboardProps {
  event: EventData;
  onNavigateToTab: (tabId: string) => void;
}

export const StitchOverviewDashboard: React.FC<StitchOverviewDashboardProps> = ({
  event,
  onNavigateToTab,
}) => {
  const [transactionFilter, setTransactionFilter] = useState('');

  // Calculations based on real event state
  const sold = event.soldTickets || 0;
  const capacity = event.capacity || 5000;
  const percentSold = capacity > 0 ? Math.round((sold / capacity) * 100) : 0;
  
  const revenue = event.currentRevenue || 0;
  const targetRevenue = event.revenueTarget || 520000;
  const percentRevenue = targetRevenue > 0 ? Math.round((revenue / targetRevenue) * 100) : 0;

  // Real costs from financials or fallback to ad budget
  const actualCosts = event.financials?.costs?.reduce((acc, c) => acc + (c.actualAmount || c.budgetedAmount || 0), 0) || 
    (event.spentAdBudget ? event.spentAdBudget * 4.2 : 218450);
  
  const projectedProfit = Math.max(0, revenue - actualCosts);
  const profitMargin = revenue > 0 ? ((projectedProfit / revenue) * 100).toFixed(1) : '55.0';

  // Bar revenue calculation (either from financials or 22% of revenue)
  const barRevenueFromFin = event.financials?.revenues
    ?.filter(r => r.category.toLowerCase().includes('bar') || r.category.toLowerCase().includes('bebida'))
    ?.reduce((acc, r) => acc + (r.netRevenue || r.grossRevenue || 0), 0);
  const barRevenue = barRevenueFromFin && barRevenueFromFin > 0 ? barRevenueFromFin : Math.round(revenue * 0.22);
  const barTicketAvg = sold > 0 ? (barRevenue / sold).toFixed(2) : '24.96';

  // Break-even
  const avgTicketPrice = event.ticketPriceLote || 80;
  const breakEvenTickets = Math.ceil(actualCosts / (avgTicketPrice || 80));
  const surplusTickets = Math.max(0, sold - breakEvenTickets);
  const isBreakEvenReached = sold >= breakEvenTickets;

  // Days until event
  const eventDateObj = new Date(event.date);
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((eventDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  // Mocked/sample real-time transactions fed by event context
  const transactions = [
    {
      id: 'tx-1',
      time: 'Hoje • 16:42:10',
      title: `2x Ingresso VIP Pista Premium - ${event.currentLote}`,
      buyer: 'Camila Vasconcellos (SP)',
      category: 'Bilheteria Online',
      catBadge: 'bg-[#a078ff]/10 text-[#d0bcff]',
      method: 'PIX Instantâneo',
      methodIcon: 'qr_code_2',
      status: 'Confirmado',
      value: `+ R$ ${(event.ticketPriceLote * 2).toFixed(2)}`,
      isPositive: true,
    },
    {
      id: 'tx-2',
      time: 'Hoje • 16:38:05',
      title: 'Recarga Prévia Pulseira Cashless (Combo 6 Gin)',
      buyer: 'Terminal Web Pré-Event',
      category: 'Bar & Bebidas',
      catBadge: 'bg-[#4cd7f6]/10 text-[#4cd7f6]',
      method: 'Cartão de Crédito 1x',
      methodIcon: 'credit_card',
      status: 'Liquidado',
      value: '+ R$ 220,00',
      isPositive: true,
    },
    {
      id: 'tx-3',
      time: 'Hoje • 16:15:22',
      title: 'Locação Geradores 500kVA (Sinal 50%)',
      buyer: 'Fornecedor: EnergyPower Locações Ltda',
      category: 'Infraestrutura',
      catBadge: 'bg-[#ffb4ab]/10 text-[#ffb4ab]',
      method: 'TED Financeiro',
      methodIcon: 'account_balance',
      status: 'Pago',
      value: '- R$ 18.500,00',
      isPositive: false,
    },
    {
      id: 'tx-4',
      time: 'Hoje • 15:50:41',
      title: '4x Ingresso Geral Solidário - Lote Atual',
      buyer: 'Thiago Mendonça (RJ)',
      category: 'Bilheteria Online',
      catBadge: 'bg-[#a078ff]/10 text-[#d0bcff]',
      method: 'PIX Instantâneo',
      methodIcon: 'qr_code_2',
      status: 'Confirmado',
      value: `+ R$ ${(event.ticketPriceLote * 4 * 0.9).toFixed(2)}`,
      isPositive: true,
    },
    {
      id: 'tx-5',
      time: 'Hoje • 15:12:18',
      title: 'Aporte Parceiro Estratégico - Ativação Lounge',
      buyer: 'Marca: Red Bull Brasil (Cota B)',
      category: 'Patrocínio',
      catBadge: 'bg-[#4edea3]/10 text-[#4edea3]',
      method: 'Depósito Bancário PJ',
      methodIcon: 'account_balance',
      status: 'Liquidado',
      value: '+ R$ 25.000,00',
      isPositive: true,
    },
  ];

  const filteredTransactions = transactions.filter(t => 
    t.title.toLowerCase().includes(transactionFilter.toLowerCase()) ||
    t.buyer.toLowerCase().includes(transactionFilter.toLowerCase()) ||
    t.category.toLowerCase().includes(transactionFilter.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full pb-16">
      
      {/* Top Executive Action Header */}
      <section className="w-full pt-4 pb-6">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
          <div className="flex flex-col gap-1.5">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 font-label-sm text-[11px] text-[#958ea0]">
              <span onClick={() => onNavigateToTab('overview')} className="hover:text-[#e3e1e9] cursor-pointer transition-colors">
                Início
              </span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-[#e3e1e9] font-medium">{event.name}</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-[#4cd7f6] font-semibold">Visão Geral</span>
            </nav>

            {/* Main Title & Operational Status */}
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <h1 className="font-headline-lg text-[28px] text-[#e3e1e9] font-bold tracking-tight">
                Dashboard Executivo do Evento
              </h1>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4cd7f6]/10 text-[#4cd7f6] font-label-sm text-[11px] font-bold tracking-wide uppercase border border-[#4cd7f6]/20">
                <span className="w-2 h-2 rounded-full bg-[#4cd7f6] animate-pulse"></span>
                AO VIVO - EM ANDAMENTO
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[#cbc3d7] font-body-sm text-[13px] mt-0.5">
              <span className="flex items-center gap-1.5 text-[#e3e1e9]">
                <span className="material-symbols-outlined text-[#4cd7f6] text-[16px]">location_on</span>
                {event.venue || event.city}
              </span>
              <span className="w-1 h-1 rounded-full bg-[#494454]"></span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#958ea0]">calendar_month</span>
                {event.date}
              </span>
              <span className="w-1 h-1 rounded-full bg-[#494454]"></span>
              <span className="flex items-center gap-1.5 text-[#4edea3] font-medium">
                <span className="material-symbols-outlined text-[16px]">timelapse</span>
                Faltam {daysRemaining} dias • {percentSold}% das metas atingidas
              </span>
            </div>
          </div>

          {/* Action Button Group */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => onNavigateToTab('financial')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e1f25] hover:bg-[#292a2f] text-[#e3e1e9] transition-all font-label-md text-[13px] font-medium border border-[#494454]/20 active:scale-95 shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px] text-[#958ea0]">description</span>
              <span>Ver DRE Consolidada</span>
            </button>
            <button
              onClick={() => onNavigateToTab('marketing')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e1f25] hover:bg-[#292a2f] text-[#e3e1e9] transition-all font-label-md text-[13px] font-medium border border-[#494454]/20 active:scale-95 shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px] text-[#4cd7f6]">campaign</span>
              <span>Campanhas Ads</span>
            </button>
            <button
              onClick={() => onNavigateToTab('tickets')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#a078ff] text-[#121318] hover:bg-[#d0bcff] transition-all font-label-md text-[13px] font-bold active:scale-95 shadow-[0_0_24px_-4px_rgba(160,120,255,0.45)]"
            >
              <span className="material-symbols-outlined text-[18px]">confirmation_number</span>
              <span>Bilheteria & Lotes</span>
            </button>
          </div>
        </div>
      </section>

      {/* KPI Cards Grid (6 wide metric blocks) */}
      <section className="w-full py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          
          {/* Card 1: Receita Total */}
          <div className="p-4 rounded-2xl bg-[#1e1f25] border border-[#494454]/20 flex flex-col justify-between shadow-md hover:bg-[#292a2f] transition-all group">
            <div>
              <div className="flex items-center justify-between text-[#cbc3d7] font-label-md text-[11px] mb-2 uppercase tracking-wider">
                <span>Receita Total</span>
                <span className="material-symbols-outlined text-[#4edea3] text-[20px] group-hover:scale-110 transition-transform">
                  trending_up
                </span>
              </div>
              <div className="font-kpi-number text-[24px] text-[#e3e1e9] font-bold tracking-tight">
                R$ {revenue.toLocaleString('pt-BR')}
              </div>
            </div>
            <div className="mt-4 pt-2.5 flex flex-col gap-1.5 bg-[#1a1b20]/60 rounded-xl p-2.5 border border-[#494454]/10">
              <div className="flex items-center justify-between font-label-sm text-[10px]">
                <span className="text-[#4edea3] font-bold">+{percentRevenue}%</span>
                <span className="text-[#958ea0]">Meta R$ {(targetRevenue / 1000).toFixed(0)}k</span>
              </div>
              <div className="w-full bg-[#34343a] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#4edea3] h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, percentRevenue)}%` }}></div>
              </div>
            </div>
          </div>

          {/* Card 2: Despesas Lançadas */}
          <div className="p-4 rounded-2xl bg-[#1e1f25] border border-[#494454]/20 flex flex-col justify-between shadow-md hover:bg-[#292a2f] transition-all group">
            <div>
              <div className="flex items-center justify-between text-[#cbc3d7] font-label-md text-[11px] mb-2 uppercase tracking-wider">
                <span>Despesas Totais</span>
                <span className="material-symbols-outlined text-[#ffb4ab] text-[20px] group-hover:scale-110 transition-transform">
                  output
                </span>
              </div>
              <div className="font-kpi-number text-[24px] text-[#e3e1e9] font-bold tracking-tight">
                R$ {actualCosts.toLocaleString('pt-BR')}
              </div>
            </div>
            <div className="mt-4 pt-2.5 flex flex-col gap-1.5 bg-[#1a1b20]/60 rounded-xl p-2.5 border border-[#494454]/10">
              <div className="flex items-center justify-between font-label-sm text-[10px]">
                <span className="text-[#cbc3d7]">
                  {revenue > 0 ? ((actualCosts / revenue) * 100).toFixed(1) : 45.5}% consumido
                </span>
                <span className="text-[#958ea0]">Orçamento</span>
              </div>
              <div className="w-full bg-[#34343a] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#ffb4ab] h-full rounded-full transition-all duration-700" style={{ width: '45.5%' }}></div>
              </div>
            </div>
          </div>

          {/* Card 3: Lucro Projetado */}
          <div className="p-4 rounded-2xl bg-[#1e1f25] border border-[#494454]/20 flex flex-col justify-between shadow-md hover:bg-[#292a2f] transition-all group">
            <div>
              <div className="flex items-center justify-between text-[#cbc3d7] font-label-md text-[11px] mb-2 uppercase tracking-wider">
                <span>Lucro Projetado</span>
                <span className="material-symbols-outlined text-[#d0bcff] text-[20px] group-hover:scale-110 transition-transform">
                  account_balance_wallet
                </span>
              </div>
              <div className="font-kpi-number text-[24px] text-[#d0bcff] font-bold tracking-tight">
                R$ {projectedProfit.toLocaleString('pt-BR')}
              </div>
            </div>
            <div className="mt-4 pt-2.5 flex items-center justify-between bg-[#1a1b20]/60 rounded-xl p-2.5 border border-[#494454]/10">
              <span className="font-label-sm text-[10px] text-[#cbc3d7]">Margem {profitMargin}%</span>
              <span className="px-2 py-0.5 rounded-full bg-[#4edea3]/15 text-[#4edea3] font-label-sm text-[10px] font-bold">
                +32% MoM
              </span>
            </div>
          </div>

          {/* Card 4: Ingressos Vendidos */}
          <div className="p-4 rounded-2xl bg-[#1e1f25] border border-[#494454]/20 flex flex-col justify-between shadow-md hover:bg-[#292a2f] transition-all group">
            <div>
              <div className="flex items-center justify-between text-[#cbc3d7] font-label-md text-[11px] mb-2 uppercase tracking-wider">
                <span>Ingressos Vendidos</span>
                <span className="material-symbols-outlined text-[#4cd7f6] text-[20px] group-hover:scale-110 transition-transform">
                  confirmation_number
                </span>
              </div>
              <div className="font-kpi-number text-[24px] text-[#e3e1e9] font-bold tracking-tight">
                {sold.toLocaleString('pt-BR')} <span className="text-[13px] text-[#958ea0] font-normal">/ {capacity.toLocaleString('pt-BR')}</span>
              </div>
            </div>
            <div className="mt-4 pt-2.5 flex flex-col gap-1.5 bg-[#1a1b20]/60 rounded-xl p-2.5 border border-[#494454]/10">
              <div className="flex items-center justify-between font-label-sm text-[10px]">
                <span className="text-[#4cd7f6] font-bold">{percentSold}% vendido</span>
                <span className="text-[#4cd7f6] px-1.5 py-0.2 bg-[#4cd7f6]/10 rounded font-semibold">{event.currentLote}</span>
              </div>
              <div className="w-full bg-[#34343a] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#4cd7f6] h-full rounded-full transition-all duration-700" style={{ width: `${percentSold}%` }}></div>
              </div>
            </div>
          </div>

          {/* Card 5: Faturamento Bar */}
          <div className="p-4 rounded-2xl bg-[#1e1f25] border border-[#494454]/20 flex flex-col justify-between shadow-md hover:bg-[#292a2f] transition-all group">
            <div>
              <div className="flex items-center justify-between text-[#cbc3d7] font-label-md text-[11px] mb-2 uppercase tracking-wider">
                <span>Faturamento Bar</span>
                <span className="material-symbols-outlined text-[#acedff] text-[20px] group-hover:scale-110 transition-transform">
                  liquor
                </span>
              </div>
              <div className="font-kpi-number text-[24px] text-[#e3e1e9] font-bold tracking-tight">
                R$ {barRevenue.toLocaleString('pt-BR')}
              </div>
            </div>
            <div className="mt-4 pt-2.5 flex items-center justify-between bg-[#1a1b20]/60 rounded-xl p-2.5 border border-[#494454]/10">
              <span className="font-label-sm text-[10px] text-[#cbc3d7]">Ticket Médio</span>
              <span className="font-label-sm text-[10px] text-[#e3e1e9] font-bold">R$ {barTicketAvg} / pax</span>
            </div>
          </div>

          {/* Card 6: Break-Even */}
          <div className="p-4 rounded-2xl bg-[#1e1f25] border border-[#494454]/20 flex flex-col justify-between shadow-md hover:bg-[#292a2f] transition-all group">
            <div>
              <div className="flex items-center justify-between text-[#cbc3d7] font-label-md text-[11px] mb-2 uppercase tracking-wider">
                <span>Break-Even</span>
                <span className="material-symbols-outlined text-[#4edea3] text-[20px] group-hover:scale-110 transition-transform">
                  verified
                </span>
              </div>
              <div className="font-kpi-number text-[24px] text-[#4edea3] font-bold tracking-tight flex items-center gap-1.5">
                {isBreakEvenReached ? 'Atingido' : `${sold}/${breakEvenTickets}`}
              </div>
            </div>
            <div className="mt-4 pt-2.5 flex items-center justify-between bg-[#1a1b20]/60 rounded-xl p-2.5 border border-[#494454]/10">
              <span className="font-label-sm text-[10px] text-[#cbc3d7]">Superávit</span>
              <span className="font-label-sm text-[10px] text-[#4edea3] font-bold">
                +{surplusTickets.toLocaleString('pt-BR')} pax
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* Main Analytics Grid: 8 Cols Left + 4 Cols Right */}
      <section className="w-full py-3">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Column: 8 Columns */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            
            {/* Chart 1: Financial Flow & Monthly Comparison */}
            <div className="p-5 rounded-2xl bg-[#1e1f25] border border-[#494454]/20 shadow-md flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-[#494454]/15">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-title-md text-[16px] text-[#e3e1e9] font-bold">
                      Desempenho Financeiro e Fluxo de Caixa
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-[#292a2f] text-[#cbc3d7] font-label-sm text-[10px] font-semibold border border-[#494454]/30">
                      Auditoria Consolidada
                    </span>
                  </div>
                  <p className="font-body-sm text-[12px] text-[#cbc3d7] mt-0.5">
                    Comparativo consolidado entre Receitas Realizadas versus Despesas Operacionais empenhadas.
                  </p>
                </div>
                {/* Legend */}
                <div className="flex items-center gap-4 font-label-sm text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-[#a078ff]"></span>
                    <span className="text-[#e3e1e9]">Receitas (R$)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-[#ffb4ab]"></span>
                    <span className="text-[#e3e1e9]">Despesas (R$)</span>
                  </div>
                </div>
              </div>

              {/* Vector Data Bars */}
              <div className="w-full bg-[#1a1b20]/80 rounded-xl p-4 flex flex-col gap-4 border border-[#494454]/15">
                {/* Period 1 */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between font-label-sm text-[11px]">
                    <span className="text-[#e3e1e9] font-semibold flex items-center gap-2">
                      <span className="material-symbols-outlined text-[15px] text-[#958ea0]">calendar_today</span>
                      Lançamento & Lote Promocional
                    </span>
                    <div className="flex items-center gap-3 text-[#cbc3d7]">
                      <span>Rec: <strong className="text-[#d0bcff]">R$ 145.200</strong></span>
                      <span>Desp: <strong className="text-[#ffb4ab]">R$ 68.300</strong></span>
                      <span className="text-[#4edea3] font-bold">+R$ 76.900 saldo</span>
                    </div>
                  </div>
                  <div className="w-full flex gap-1 h-3 bg-[#34343a] rounded-full overflow-hidden p-0.5">
                    <div className="bg-[#a078ff] rounded-l-full" style={{ width: '58%' }}></div>
                    <div className="bg-[#ffb4ab] rounded-r-full" style={{ width: '27%' }}></div>
                  </div>
                </div>

                {/* Period 2 */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between font-label-sm text-[11px]">
                    <span className="text-[#e3e1e9] font-semibold flex items-center gap-2">
                      <span className="material-symbols-outlined text-[15px] text-[#958ea0]">calendar_today</span>
                      Lote 1 & Fechamento de Patrocínios
                    </span>
                    <div className="flex items-center gap-3 text-[#cbc3d7]">
                      <span>Rec: <strong className="text-[#d0bcff]">R$ 218.400</strong></span>
                      <span>Desp: <strong className="text-[#ffb4ab]">R$ 94.150</strong></span>
                      <span className="text-[#4edea3] font-bold">+R$ 124.250 saldo</span>
                    </div>
                  </div>
                  <div className="w-full flex gap-1 h-3 bg-[#34343a] rounded-full overflow-hidden p-0.5">
                    <div className="bg-[#a078ff] rounded-l-full" style={{ width: '76%' }}></div>
                    <div className="bg-[#ffb4ab] rounded-r-full" style={{ width: '33%' }}></div>
                  </div>
                </div>

                {/* Period 3 */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between font-label-sm text-[11px]">
                    <span className="text-[#e3e1e9] font-semibold flex items-center gap-2">
                      <span className="material-symbols-outlined text-[15px] text-[#4cd7f6]">calendar_today</span>
                      Lote 2 + Bar Pré-venda (Atual)
                    </span>
                    <div className="flex items-center gap-3 text-[#cbc3d7]">
                      <span>Rec: <strong className="text-[#d0bcff]">R$ 122.000</strong></span>
                      <span>Desp: <strong className="text-[#ffb4ab]">R$ 56.000</strong></span>
                      <span className="text-[#4edea3] font-bold">+R$ 66.000 saldo</span>
                    </div>
                  </div>
                  <div className="w-full flex gap-1 h-3 bg-[#34343a] rounded-full overflow-hidden p-0.5">
                    <div className="bg-[#a078ff] rounded-l-full" style={{ width: '48%' }}></div>
                    <div className="bg-[#ffb4ab] rounded-r-full" style={{ width: '22%' }}></div>
                  </div>
                </div>

                {/* Mini Sparkline Comparison Box */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-[#1e1f25] border border-[#494454]/15 flex items-center justify-between">
                    <div>
                      <span className="text-[#958ea0] font-label-sm text-[10px] block uppercase">Crescimento Receita</span>
                      <span className="text-[#4edea3] font-title-md text-[16px] font-bold">+50.4%</span>
                    </div>
                    <svg className="w-14 h-7 text-[#4edea3]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 64 32">
                      <polyline points="4,28 20,20 36,22 52,8 60,4"></polyline>
                    </svg>
                  </div>
                  <div className="p-3 rounded-xl bg-[#1e1f25] border border-[#494454]/15 flex items-center justify-between">
                    <div>
                      <span className="text-[#958ea0] font-label-sm text-[10px] block uppercase">Eficiência Gasto</span>
                      <span className="text-[#4cd7f6] font-title-md text-[16px] font-bold">2,22x</span>
                    </div>
                    <svg className="w-14 h-7 text-[#4cd7f6]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 64 32">
                      <polyline points="4,24 22,22 38,16 50,12 60,6"></polyline>
                    </svg>
                  </div>
                  <div className="p-3 rounded-xl bg-[#1e1f25] border border-[#494454]/15 flex items-center justify-between">
                    <div>
                      <span className="text-[#958ea0] font-label-sm text-[10px] block uppercase">Caixa Livre Atual</span>
                      <span className="text-[#e3e1e9] font-title-md text-[16px] font-bold">R$ {projectedProfit.toLocaleString('pt-BR')}</span>
                    </div>
                    <span className="material-symbols-outlined text-[#a078ff] text-[26px]">payments</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart 2: Hourly Ticket Sales Pace & Lineup Announcement Traction */}
            <div className="p-5 rounded-2xl bg-[#1e1f25] border border-[#494454]/20 shadow-md flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-[#494454]/15">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-title-md text-[16px] text-[#e3e1e9] font-bold">
                      Ritmo e Tração de Vendas por Hora
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-[#4cd7f6]/15 text-[#4cd7f6] font-label-sm text-[10px] font-bold border border-[#4cd7f6]/20">
                      Live Traffic
                    </span>
                  </div>
                  <p className="font-body-sm text-[12px] text-[#cbc3d7] mt-0.5">
                    Volumetria horária de conversão de ingressos com marcadores de ativação de tráfego pago e DJ anúncio.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-[#292a2f] text-[#e3e1e9] font-label-sm text-[11px] flex items-center gap-1.5 border border-[#494454]/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse"></span>
                    Pico: 184 un/h
                  </span>
                </div>
              </div>

              {/* Curve SVG Visualization */}
              <div className="relative w-full bg-[#1a1b20] rounded-xl p-4 overflow-hidden border border-[#494454]/15">
                <div className="flex items-center justify-between text-[#958ea0] font-label-sm text-[11px] mb-2 font-mono">
                  <span>08:00</span>
                  <span>11:00</span>
                  <span className="text-[#4cd7f6] font-semibold">14:30 (Post Instagram Lineup)</span>
                  <span>18:00</span>
                  <span className="text-[#d0bcff] font-semibold">21:00 (Virada de Lote)</span>
                  <span>23:59</span>
                </div>

                <div className="relative h-40 w-full flex items-end">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between opacity-15 pointer-events-none">
                    <div className="w-full border-b border-[#958ea0]"></div>
                    <div className="w-full border-b border-[#958ea0]"></div>
                    <div className="w-full border-b border-[#958ea0]"></div>
                    <div className="w-full border-b border-[#958ea0]"></div>
                  </div>

                  {/* Curve Path SVG */}
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 800 160">
                    <defs>
                      <linearGradient id="purpleGradientStitch" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#a078ff" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#a078ff" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0,140 Q 120,135 200,120 T 360,30 T 480,75 T 620,20 T 740,60 L 800,95 L 800,160 L 0,160 Z"
                      fill="url(#purpleGradientStitch)"
                    />
                    <path
                      d="M 0,140 Q 120,135 200,120 T 360,30 T 480,75 T 620,20 T 740,60 L 800,95"
                      fill="none"
                      stroke="#a078ff"
                      strokeLinecap="round"
                      strokeWidth="3.5"
                    />
                    <circle cx="360" cy="30" r="5" fill="#4cd7f6" stroke="#121318" strokeWidth="2" />
                    <circle cx="620" cy="20" r="5" fill="#4edea3" stroke="#121318" strokeWidth="2" />
                  </svg>
                </div>

                {/* Milestone Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-[#494454]/15">
                  <div className="p-2.5 rounded-xl bg-[#1e1f25] border border-[#494454]/15 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#4cd7f6]/15 text-[#4cd7f6] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">campaign</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-md text-[12px] text-[#e3e1e9] font-bold">Pico 1: Divulgação do Headliner</span>
                      <span className="font-body-sm text-[11px] text-[#cbc3d7]">14:30h • 184 ingressos convertidos em 45 minutos</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#1e1f25] border border-[#494454]/15 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#4edea3]/15 text-[#4edea3] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-md text-[12px] text-[#e3e1e9] font-bold">Pico 2: Alerta Virada de Lote</span>
                      <span className="font-body-sm text-[11px] text-[#cbc3d7]">21:00h • 162 conversões imediatas via Cartão & PIX</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: 4 Columns */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            
            {/* Revenue Distribution Breakdown */}
            <div className="p-5 rounded-2xl bg-[#1e1f25] border border-[#494454]/20 shadow-md flex flex-col gap-4">
              <div className="flex items-center justify-between pb-1 border-b border-[#494454]/15">
                <h3 className="font-title-md text-[16px] text-[#e3e1e9] font-bold">Origem da Receita</h3>
                <span className="material-symbols-outlined text-[#958ea0] text-[20px]">pie_chart</span>
              </div>

              {/* Visual Split Bar */}
              <div className="w-full flex h-3 rounded-full overflow-hidden gap-1 bg-[#34343a]">
                <div className="bg-[#a078ff] h-full" style={{ width: '68%' }} title="Bilheteria (68%)"></div>
                <div className="bg-[#4cd7f6] h-full" style={{ width: '22%' }} title="Bar & Bebidas (22%)"></div>
                <div className="bg-[#4edea3] h-full" style={{ width: '10%' }} title="Patrocínios (10%)"></div>
              </div>

              {/* Categorized List */}
              <div className="flex flex-col gap-2">
                <div className="p-2.5 rounded-xl bg-[#1a1b20] border border-[#494454]/15 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#a078ff]"></span>
                    <div>
                      <span className="font-label-md text-[12px] text-[#e3e1e9] font-bold block">Ingressos & Bilheteria</span>
                      <span className="font-body-sm text-[11px] text-[#958ea0]">{sold} ingressos emitidos</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-label-md text-[12px] text-[#e3e1e9] block font-bold">
                      R$ {Math.round(revenue * 0.68).toLocaleString('pt-BR')}
                    </span>
                    <span className="font-label-sm text-[10px] text-[#d0bcff]">68,0%</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#1a1b20] border border-[#494454]/15 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#4cd7f6]"></span>
                    <div>
                      <span className="font-label-md text-[12px] text-[#e3e1e9] font-bold block">Bar & Consumo Prévio</span>
                      <span className="font-body-sm text-[11px] text-[#958ea0]">Fichas e combos antecipados</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-label-md text-[12px] text-[#e3e1e9] block font-bold">
                      R$ {barRevenue.toLocaleString('pt-BR')}
                    </span>
                    <span className="font-label-sm text-[10px] text-[#4cd7f6]">22,0%</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#1a1b20] border border-[#494454]/15 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#4edea3]"></span>
                    <div>
                      <span className="font-label-md text-[12px] text-[#e3e1e9] font-bold block">Patrocínios & Apoio</span>
                      <span className="font-body-sm text-[11px] text-[#958ea0]">Cotas comerciais ativas</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-label-md text-[12px] text-[#e3e1e9] block font-bold">
                      R$ {Math.round(revenue * 0.1).toLocaleString('pt-BR')}
                    </span>
                    <span className="font-label-sm text-[10px] text-[#4edea3]">10,0%</span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#292a2f]/40 border border-[#494454]/15 flex items-center gap-2 text-[#cbc3d7] font-body-sm text-[11px]">
                <span className="material-symbols-outlined text-[#958ea0] text-[16px]">info</span>
                <span>Total consolidado: <strong className="text-[#e3e1e9]">R$ {revenue.toLocaleString('pt-BR')},00</strong> líquido.</span>
              </div>
            </div>

            {/* Operational Critical Alerts Card */}
            <div className="p-5 rounded-2xl bg-[#1e1f25] border border-[#494454]/20 shadow-md flex flex-col gap-3.5">
              <div className="flex items-center justify-between pb-1 border-b border-[#494454]/15">
                <div className="flex items-center gap-2">
                  <h3 className="font-title-md text-[16px] text-[#e3e1e9] font-bold">Alertas Críticos</h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#ffb4ab]/15 text-[#ffb4ab] font-label-sm text-[10px] font-bold">
                    3 pendências
                  </span>
                </div>
                <span className="material-symbols-outlined text-[#ffb4ab] text-[20px]">warning</span>
              </div>

              <div className="flex flex-col gap-2.5">
                {/* Alert 1 */}
                <div 
                  onClick={() => onNavigateToTab('bar')}
                  className="p-3 rounded-xl bg-[#93000a]/15 border border-[#93000a]/30 flex flex-col gap-1 transition-all hover:bg-[#93000a]/25 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[#ffb4ab] font-label-md text-[11px] font-bold">
                      <span className="material-symbols-outlined text-[15px]">production_quantity_limits</span>
                      <span>Ruptura Iminente de Bar</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-[#ffb4ab] text-[#690005] font-label-sm text-[9px] uppercase font-black">
                      Urgente
                    </span>
                  </div>
                  <p className="font-body-sm text-[11.5px] text-[#e3e1e9] leading-tight">
                    Red Bull Energy Drink com apenas <strong className="text-[#ffb4ab]">180 latas</strong> no estoque central.
                  </p>
                  <div className="flex items-center justify-between pt-1 font-label-sm text-[10px] text-[#958ea0]">
                    <span>Almoxarifado Bar</span>
                    <span className="text-[#ffb4ab] font-bold hover:underline">Ver Gestão de Bar →</span>
                  </div>
                </div>

                {/* Alert 2 */}
                <div 
                  onClick={() => onNavigateToTab('calendar')}
                  className="p-3 rounded-xl bg-[#1a1b20] border border-[#494454]/20 flex flex-col gap-1 transition-all hover:bg-[#292a2f] cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[#4cd7f6] font-label-md text-[11px] font-bold">
                      <span className="material-symbols-outlined text-[15px]">local_fire_department</span>
                      <span>Vistoria Técnica Bombeiros</span>
                    </div>
                    <span className="text-[#958ea0] font-label-sm text-[10px]">Amanhã • 10:00</span>
                  </div>
                  <p className="font-body-sm text-[11.5px] text-[#cbc3d7] leading-tight">
                    Inspeção do AVCB e rotas de fuga no Portão 03 com ARTs em mãos.
                  </p>
                  <div className="flex items-center justify-between pt-1 font-label-sm text-[10px] text-[#958ea0]">
                    <span>Eng. Marcos Silveira</span>
                    <span className="text-[#4cd7f6] font-bold hover:underline">Ver Agenda →</span>
                  </div>
                </div>

                {/* Alert 3 */}
                <div 
                  onClick={() => onNavigateToTab('financial')}
                  className="p-3 rounded-xl bg-[#1a1b20] border border-[#494454]/20 flex flex-col gap-1 transition-all hover:bg-[#292a2f] cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[#d0bcff] font-label-md text-[11px] font-bold">
                      <span className="material-symbols-outlined text-[15px]">person_pin</span>
                      <span>2ª Parcela Cachê DJ</span>
                    </div>
                    <span className="text-[#d0bcff] font-label-sm text-[10px] font-bold">Em 5 dias</span>
                  </div>
                  <p className="font-body-sm text-[11.5px] text-[#cbc3d7] leading-tight">
                    Vencimento do saldo contratual de <strong className="text-[#e3e1e9]">R$ 25.000,00</strong>.
                  </p>
                  <div className="flex items-center justify-between pt-1 font-label-sm text-[10px] text-[#958ea0]">
                    <span>Contrato Artístico</span>
                    <span className="text-[#d0bcff] font-bold hover:underline">Ver DRE →</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Venue Spotlight Card */}
            <div className="rounded-2xl bg-[#1e1f25] border border-[#494454]/20 overflow-hidden shadow-md flex flex-col">
              <div 
                className="relative w-full h-32 bg-cover bg-center" 
                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80')` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-[#1e1f25] via-[#1e1f25]/50 to-transparent"></div>
                <div className="absolute bottom-2.5 left-3.5 right-3.5 flex items-center justify-between text-[#e3e1e9]">
                  <span className="font-title-md text-[14px] font-bold truncate">
                    {event.venue || event.city}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#a078ff]/30 backdrop-blur-md text-[#d0bcff] font-label-sm text-[10px] font-bold">
                    Montagem 72%
                  </span>
                </div>
              </div>
              <div className="p-3 flex items-center justify-between text-[#cbc3d7] font-body-sm text-[12px]">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">groups</span>
                  <span>Capacidade: {capacity.toLocaleString('pt-BR')} pax</span>
                </div>
                <button 
                  onClick={() => onNavigateToTab('calendar')}
                  className="text-[#d0bcff] hover:underline font-label-md text-[11px] font-bold flex items-center gap-1"
                >
                  Cronograma <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Bottom Full-Width Table: Real-time Transactions & Auditing */}
      <section className="w-full pt-3">
        <div className="p-5 rounded-2xl bg-[#1e1f25] border border-[#494454]/20 shadow-md flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[#494454]/15">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline-sm text-[18px] text-[#e3e1e9] font-bold">
                  Últimas Transações e Movimentações em Tempo Real
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-[#4cd7f6]/10 text-[#4cd7f6] font-label-sm text-[10px] font-bold border border-[#4cd7f6]/20">
                  Live Feed
                </span>
              </div>
              <p className="font-body-sm text-[12px] text-[#cbc3d7] mt-0.5">
                Registro cronológico das últimas compras de ingressos, recargas e lançamentos operacionais.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#958ea0] text-[18px]">
                  filter_list
                </span>
                <input
                  type="text"
                  value={transactionFilter}
                  onChange={(e) => setTransactionFilter(e.target.value)}
                  placeholder="Filtrar lançamentos..."
                  className="h-9 pl-9 pr-3 rounded-xl bg-[#1a1b20] text-[#e3e1e9] placeholder:text-[#958ea0] font-body-sm text-[12px] border border-[#494454]/20 focus:outline-none focus:border-[#a078ff] w-48 sm:w-60"
                />
              </div>

              <SheetsExportButton
                filename={`Extrato_Transacoes_${event.id}`}
                title={`Transações em Tempo Real - ${event.name}`}
                headers={['Horário', 'Descrição', 'Comprador/Origem', 'Categoria', 'Método', 'Valor']}
                rows={transactions.map(t => [t.time, t.title, t.buyer, t.category, t.method, t.value])}
                label="Exportar CSV"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="bg-[#1a1b20] text-[#958ea0] font-label-md text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3.5 rounded-l-xl">Data / Hora</th>
                  <th className="py-3 px-3.5">Descrição / Item</th>
                  <th className="py-3 px-3.5">Categoria</th>
                  <th className="py-3 px-3.5">Canal / Método</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5 text-right rounded-r-xl">Valor (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#494454]/10 text-[#e3e1e9] font-body-sm text-[13px]">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#292a2f]/50 transition-colors">
                    <td className="py-3 px-3.5 text-[#cbc3d7] font-mono text-[11px] whitespace-nowrap">
                      {tx.time}
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#a078ff]/10 text-[#d0bcff] flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[16px]">{tx.methodIcon}</span>
                        </div>
                        <div>
                          <span className="font-semibold block text-[#e3e1e9]">{tx.title}</span>
                          <span className="text-[11px] text-[#958ea0]">{tx.buyer}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3.5">
                      <span className={`px-2 py-0.5 rounded-full font-label-sm text-[10px] font-semibold ${tx.catBadge}`}>
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-[#cbc3d7]">
                      <div className="flex items-center gap-1.5 text-[12px]">
                        <span className="material-symbols-outlined text-[15px] text-[#4edea3]">{tx.methodIcon}</span>
                        <span>{tx.method}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3.5">
                      <span className="px-2 py-0.5 rounded-full bg-[#4edea3]/15 text-[#4edea3] font-label-sm text-[10px] font-bold flex items-center gap-1 w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]"></span>
                        {tx.status}
                      </span>
                    </td>
                    <td className={`py-3 px-3.5 text-right font-bold tabular-nums font-mono text-[13px] ${
                      tx.isPositive ? 'text-[#4edea3]' : 'text-[#ffb4ab]'
                    }`}>
                      {tx.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </section>

    </div>
  );
};
