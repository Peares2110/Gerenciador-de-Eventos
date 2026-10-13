import React, { useState } from 'react';
import { EventData } from '../../types';
import { GandayaHub } from '../GandayaHub';
import { SheetsExportButton } from '../SheetsExportButton';

interface StitchTicketsViewProps {
  event: EventData;
  onUpdateEvent: (updated: EventData) => void;
  onNavigateToTab: (tabId: string) => void;
}

export const StitchTicketsView: React.FC<StitchTicketsViewProps> = ({
  event,
  onUpdateEvent,
  onNavigateToTab,
}) => {
  const [activeSubView, setActiveSubView] = useState<'batches' | 'gandaya'>('batches');
  const [orderSearch, setOrderSearch] = useState('');
  const [showNewBatchModal, setShowNewBatchModal] = useState(false);
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchPrice, setNewBatchPrice] = useState('90');
  const [newBatchCapacity, setNewBatchCapacity] = useState('1000');

  const sold = event.soldTickets || 4280;
  const capacity = event.capacity || 5000;
  const percentSold = capacity > 0 ? Math.round((sold / capacity) * 100) : 85;
  const remaining = Math.max(0, capacity - sold);
  const grossRevenue = event.currentRevenue || 330200;
  const netRevenue = Math.round(grossRevenue * 0.92);
  const avgTicket = sold > 0 ? (grossRevenue / sold).toFixed(2) : '77.15';

  const orders = [
    {
      id: 'ord-1',
      initials: 'MS',
      name: 'Mariana Silveira',
      email: 'mariana.silveira@gmail.com',
      sector: 'Área VIP Frontstage (2x)',
      sectorBadge: 'text-[#4cd7f6] bg-[#292a2f]',
      method: 'PIX Instantâneo',
      value: 'R$ 260,00',
      time: 'Há 2 min (22:48)',
    },
    {
      id: 'ord-2',
      initials: 'GF',
      name: 'Gabriel Fonseca',
      email: 'gabriel.fonseca@outlook.com',
      sector: 'Camarote Open Bar Premium',
      sectorBadge: 'text-[#d0bcff] bg-[#292a2f]',
      method: 'Cartão Crédito (3x)',
      value: 'R$ 250,00',
      time: 'Há 5 min (22:45)',
    },
    {
      id: 'ord-3',
      initials: 'BL',
      name: 'Beatriz Lima de Carvalho',
      email: 'b.carvalho@uol.com.br',
      sector: 'Pista Comum - 2º Lote (4x)',
      sectorBadge: 'text-[#e3e1e9] bg-[#292a2f]',
      method: 'PIX Instantâneo',
      value: 'R$ 320,00',
      time: 'Há 11 min (22:39)',
    },
    {
      id: 'ord-4',
      initials: 'RA',
      name: 'Rodrigo Antunes Sampaio',
      email: 'rodrigo.sampaio@techcorp.io',
      sector: 'Backstage Experience VIP',
      sectorBadge: 'text-[#4edea3] bg-[#292a2f]',
      method: 'Cartão Crédito (1x)',
      value: 'R$ 450,00',
      time: 'Há 18 min (22:32)',
    },
  ];

  const filteredOrders = orders.filter(o => 
    o.name.toLowerCase().includes(orderSearch.toLowerCase()) ||
    o.email.toLowerCase().includes(orderSearch.toLowerCase()) ||
    o.sector.toLowerCase().includes(orderSearch.toLowerCase())
  );

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchName.trim()) return;
    alert(`Lote "${newBatchName}" criado com sucesso! Preço: R$ ${newBatchPrice}, Capacidade: ${newBatchCapacity} un.`);
    setShowNewBatchModal(false);
    setNewBatchName('');
  };

  return (
    <div className="flex flex-col w-full pb-16">
      
      {/* Top Header & Sub-Navigation */}
      <div className="flex flex-col gap-4 pt-4 pb-6">
        <div className="flex items-center justify-between flex-wrap gap-2 text-[#958ea0] font-label-sm text-[11px]">
          <div className="flex items-center gap-1.5">
            <span onClick={() => onNavigateToTab('overview')} className="hover:text-[#e3e1e9] cursor-pointer transition-colors">
              Eventos
            </span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#e3e1e9]">{event.name}</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#d0bcff] font-bold">Bilheteria & Lotes</span>
          </div>

          {/* Sub-view toggle between Stitch Batches and Gandaya Hub */}
          <div className="flex items-center p-1 rounded-xl bg-[#1e1f25] border border-[#494454]/20">
            <button
              onClick={() => setActiveSubView('batches')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeSubView === 'batches'
                  ? 'bg-[#a078ff] text-[#121318] shadow-sm'
                  : 'text-[#cbc3d7] hover:text-[#e3e1e9]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">confirmation_number</span>
              <span>Lotes & Bilheteria</span>
            </button>
            <button
              onClick={() => setActiveSubView('gandaya')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeSubView === 'gandaya'
                  ? 'bg-[#a078ff] text-[#121318] shadow-sm'
                  : 'text-[#cbc3d7] hover:text-[#e3e1e9]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">analytics</span>
              <span>Gandaya Hub & CRM</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-headline-xl text-[28px] text-[#e3e1e9] font-bold tracking-tight">
                Gestão de Ingressos e Bilheteria Digital
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#292a2f] text-[#4edea3] font-label-sm text-[11px] font-bold border border-[#4edea3]/20">
                <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-ping"></span>
                Sincronização em Tempo Real
              </span>
            </div>
            <p className="font-body-md text-[13px] text-[#cbc3d7]">
              Monitoramento de capacidade nominal de {capacity.toLocaleString('pt-BR')} ingressos, precificação dinâmica e dispersão por ponto de venda.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <SheetsExportButton
              filename={`Relatorio_Bilheteria_${event.id}`}
              title={`Relatório de Ingressos e Lotes - ${event.name}`}
              headers={['Comprador', 'Setor/Lote', 'Forma Pagto', 'Valor', 'Horário']}
              rows={orders.map(o => [o.name, o.sector, o.method, o.value, o.time])}
              label="Relatório Contábil (CSV)"
            />
            <button
              onClick={() => alert('Interface de liberação de cortesias e credenciamento de staff acionada.')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e1f25] hover:bg-[#292a2f] text-[#e3e1e9] font-label-md text-[12px] font-semibold transition-all border border-[#494454]/20 shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px] text-[#4cd7f6]">badge</span>
              <span>Adicionar Cortesia/Staff</span>
            </button>
            <button
              onClick={() => setShowNewBatchModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#a078ff] text-[#121318] hover:bg-[#d0bcff] font-label-md text-[12px] font-bold transition-all shadow-[0_0_24px_-4px_rgba(160,120,255,0.35)] active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>+ Criar Novo Lote</span>
            </button>
          </div>
        </div>
      </div>

      {/* If Gandaya Hub is selected, render GandayaHub component */}
      {activeSubView === 'gandaya' ? (
        <GandayaHub
          event={event}
          onUpdateEvent={onUpdateEvent}
          onNavigateToTab={onNavigateToTab}
        />
      ) : (
        <div className="flex flex-col gap-6">
          
          {/* Row 1: KPI Summary (4 Metrics Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            
            {/* KPI 1 */}
            <div className="p-5 rounded-2xl bg-[#1e1f25] border border-[#494454]/20 flex flex-col justify-between gap-3 shadow-md hover:bg-[#292a2f] transition-all">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-[11px] text-[#958ea0] uppercase tracking-wider font-bold">
                  Ingressos Totais Vendidos
                </span>
                <span className="material-symbols-outlined text-[#4cd7f6] text-[22px]">confirmation_number</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-kpi-number text-[26px] text-[#e3e1e9] font-bold">
                    {sold.toLocaleString('pt-BR')}
                  </span>
                  <span className="font-body-sm text-[13px] text-[#958ea0] font-medium">
                    / {capacity.toLocaleString('pt-BR')} un
                  </span>
                </div>
                <div className="w-full bg-[#34343a] h-2 rounded-full overflow-hidden mt-1">
                  <div className="bg-[#4cd7f6] h-full rounded-full transition-all duration-700" style={{ width: `${percentSold}%` }}></div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[#cbc3d7] font-label-sm text-[11px]">
                <span className="text-[#4cd7f6] font-bold">{percentSold}% de ocupação</span>
                <span className="text-[#958ea0]">Meta: 90% até sex</span>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="p-5 rounded-2xl bg-[#1e1f25] border border-[#494454]/20 flex flex-col justify-between gap-3 shadow-md hover:bg-[#292a2f] transition-all">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-[11px] text-[#958ea0] uppercase tracking-wider font-bold">
                  Receita Bruta Bilheteria
                </span>
                <span className="material-symbols-outlined text-[#4edea3] text-[22px]">payments</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-kpi-number text-[26px] text-[#e3e1e9] font-bold">
                  R$ {grossRevenue.toLocaleString('pt-BR')}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center text-[#4edea3] font-label-sm text-[11px] font-bold">
                    <span className="material-symbols-outlined text-[15px]">trending_up</span> +14%
                  </span>
                  <span className="font-body-sm text-[11px] text-[#958ea0]">vs. meta orçada</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[#cbc3d7] font-label-sm text-[11px]">
                <span>Arrecadação Líquida</span>
                <span className="text-[#e3e1e9] font-bold">R$ {netRevenue.toLocaleString('pt-BR')},00</span>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="p-5 rounded-2xl bg-[#1e1f25] border border-[#494454]/20 flex flex-col justify-between gap-3 shadow-md hover:bg-[#292a2f] transition-all">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-[11px] text-[#958ea0] uppercase tracking-wider font-bold">
                  Ingressos Restantes
                </span>
                <span className="material-symbols-outlined text-[#d0bcff] text-[22px]">inventory_2</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-kpi-number text-[26px] text-[#e3e1e9] font-bold">
                    {remaining.toLocaleString('pt-BR')}
                  </span>
                  <span className="font-body-sm text-[13px] text-[#cbc3d7]">unidades</span>
                </div>
                <p className="font-body-sm text-[11px] text-[#ffb4ab] mt-0.5 flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[15px]">warning</span> Lotes finais em aceleração
                </p>
              </div>
              <div className="flex items-center justify-between text-[#cbc3d7] font-label-sm text-[11px]">
                <span>Carga Esgotada</span>
                <span className="text-[#e3e1e9] font-bold">2 de 5 lotes</span>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="p-5 rounded-2xl bg-[#1e1f25] border border-[#494454]/20 flex flex-col justify-between gap-3 shadow-md hover:bg-[#292a2f] transition-all">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-[11px] text-[#958ea0] uppercase tracking-wider font-bold">
                  Ticket Médio Ponderado
                </span>
                <span className="material-symbols-outlined text-[#acedff] text-[22px]">price_change</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-kpi-number text-[26px] text-[#e3e1e9] font-bold">
                  R$ {avgTicket}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center text-[#4edea3] font-label-sm text-[11px] font-bold">
                    <span className="material-symbols-outlined text-[15px]">arrow_upward</span> +R$ 8,40
                  </span>
                  <span className="font-body-sm text-[11px] text-[#958ea0]">vs. 1º lote base</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[#cbc3d7] font-label-sm text-[11px]">
                <span>Mix Premium</span>
                <span className="text-[#d0bcff] font-bold">23,1% faturamento</span>
              </div>
            </div>

          </div>

          {/* Row 2: Middle Layout (7 Cols Left / 5 Cols Right) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            
            {/* Left Column: Table of Batches & Sectors (7 cols) */}
            <div className="xl:col-span-7 flex flex-col gap-4 bg-[#1e1f25] border border-[#494454]/20 p-5 rounded-2xl shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-[#494454]/15">
                <div>
                  <h2 className="font-headline-sm text-[17px] text-[#e3e1e9] font-bold">Tabela de Lotes e Setores</h2>
                  <p className="font-body-sm text-[12px] text-[#cbc3d7]">Programação de cotas, precificação progressiva e esgotamento</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-label-sm text-[10px] px-2.5 py-1 rounded-full bg-[#292a2f] text-[#d0bcff] font-bold">
                    5 Lotes Ativos
                  </span>
                </div>
              </div>

              {/* Table Container */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[560px]">
                  <thead>
                    <tr className="bg-[#1a1b20] text-[#958ea0] font-label-md text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-3 rounded-l-xl">Setor / Lote</th>
                      <th className="py-2.5 px-2 text-right">Preço</th>
                      <th className="py-2.5 px-3">Ocupação / Carga</th>
                      <th className="py-2.5 px-2 text-right">Arrecadação</th>
                      <th className="py-2.5 px-2 text-center rounded-r-xl">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#494454]/10 text-[#e3e1e9] font-body-sm text-[12px]">
                    
                    {/* Row 1 */}
                    <tr className="hover:bg-[#292a2f]/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#e3e1e9]">Pista Comum</div>
                        <div className="text-[11px] text-[#958ea0]">1º Lote Antecipado</div>
                      </td>
                      <td className="py-3 px-2 text-right font-medium">R$ 60,00</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                          <span>1.500 / 1.500</span>
                          <span className="text-[#4edea3]">100%</span>
                        </div>
                        <div className="w-28 bg-[#34343a] h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#4edea3] h-full rounded-full" style={{ width: '100%' }}></div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-[#4edea3] tabular-nums">R$ 90.000,00</td>
                      <td className="py-3 px-2 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-[#93000a]/30 text-[#ffb4ab] font-label-sm text-[10px] font-bold">
                          Esgotado
                        </span>
                      </td>
                    </tr>

                    {/* Row 2 */}
                    <tr className="hover:bg-[#292a2f]/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#e3e1e9]">Pista Comum</div>
                        <div className="text-[11px] text-[#4cd7f6] font-semibold">2º Lote Oficial (Vigente)</div>
                      </td>
                      <td className="py-3 px-2 text-right font-medium">R$ 80,00</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                          <span>1.240 / 1.500</span>
                          <span className="text-[#4cd7f6]">82,6%</span>
                        </div>
                        <div className="w-28 bg-[#34343a] h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#4cd7f6] h-full rounded-full" style={{ width: '82.6%' }}></div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-[#4edea3] tabular-nums">R$ 99.200,00</td>
                      <td className="py-3 px-2 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-[#4cd7f6]/15 text-[#4cd7f6] font-label-sm text-[10px] font-bold">
                          Vendas Ativas
                        </span>
                      </td>
                    </tr>

                    {/* Row 3 */}
                    <tr className="hover:bg-[#292a2f]/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#e3e1e9]">Área VIP Frontstage</div>
                        <div className="text-[11px] text-[#d0bcff] font-semibold">2º Lote Exclusivo</div>
                      </td>
                      <td className="py-3 px-2 text-right font-medium">R$ 130,00</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                          <span>890 / 1.000</span>
                          <span className="text-[#d0bcff]">89,0%</span>
                        </div>
                        <div className="w-28 bg-[#34343a] h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#a078ff] h-full rounded-full" style={{ width: '89%' }}></div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-[#4edea3] tabular-nums">R$ 115.700,00</td>
                      <td className="py-3 px-2 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-[#4cd7f6]/15 text-[#4cd7f6] font-label-sm text-[10px] font-bold">
                          Vendas Ativas
                        </span>
                      </td>
                    </tr>

                    {/* Row 4 */}
                    <tr className="hover:bg-[#292a2f]/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#e3e1e9]">Camarote Open Bar</div>
                        <div className="text-[11px] text-[#ffb4ab] font-semibold">Lote Premium Único</div>
                      </td>
                      <td className="py-3 px-2 text-right font-medium">R$ 250,00</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                          <span>450 / 500</span>
                          <span className="text-[#ffb4ab]">90,0%</span>
                        </div>
                        <div className="w-28 bg-[#34343a] h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#ffb4ab] h-full rounded-full" style={{ width: '90%' }}></div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-[#4edea3] tabular-nums">R$ 112.500,00</td>
                      <td className="py-3 px-2 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-[#93000a]/20 text-[#ffb4ab] font-label-sm text-[10px] font-bold animate-pulse">
                          Últimos 50 un
                        </span>
                      </td>
                    </tr>

                    {/* Row 5 */}
                    <tr className="hover:bg-[#292a2f]/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#e3e1e9]">Backstage Experience</div>
                        <div className="text-[11px] text-[#958ea0]">All-Inclusive Credencial</div>
                      </td>
                      <td className="py-3 px-2 text-right font-medium">R$ 450,00</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                          <span>100 / 100</span>
                          <span className="text-[#4edea3]">100%</span>
                        </div>
                        <div className="w-28 bg-[#34343a] h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#4edea3] h-full rounded-full" style={{ width: '100%' }}></div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-[#4edea3] tabular-nums">R$ 45.000,00</td>
                      <td className="py-3 px-2 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-[#93000a]/30 text-[#ffb4ab] font-label-sm text-[10px] font-bold">
                          Esgotado
                        </span>
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-[#cbc3d7] font-label-sm text-[11px] border-t border-[#494454]/15">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#4cd7f6]"></span> Taxa Plataforma: 8%</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#4edea3]"></span> Repasse D+2 programado</span>
                </div>
                <button 
                  onClick={() => alert('Virada de lote acionada para todos os canais integrados!')}
                  className="text-[#d0bcff] hover:underline font-bold"
                >
                  Virar Lotes Manualmente →
                </button>
              </div>
            </div>

            {/* Right Column: Analytics & Channels (5 cols) */}
            <div className="xl:col-span-5 flex flex-col gap-5">
              
              {/* Sales Velocity Curve */}
              <div className="bg-[#1e1f25] border border-[#494454]/20 p-5 rounded-2xl shadow-md flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-headline-sm text-[16px] text-[#e3e1e9] font-bold">Curva de Vendas por Hora</h3>
                    <span className="font-body-sm text-[12px] text-[#cbc3d7]">Picos de conversão pós-campanhas</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#a078ff]/15 text-[#d0bcff] font-label-sm text-[10px] font-bold">
                    Últimas 24h
                  </span>
                </div>

                {/* SVG Curve */}
                <div className="relative w-full h-36 bg-[#0d0e13]/60 rounded-xl p-2.5 flex flex-col justify-end overflow-hidden border border-[#494454]/15">
                  <div className="absolute top-2 left-3 flex items-center gap-3 text-[10px] text-[#cbc3d7]">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#a078ff]"></span> Meta Ads (18h)</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#4cd7f6]"></span> TikTok Viral (21:30h)</span>
                  </div>
                  <svg className="w-full h-24 overflow-visible" preserveAspectRatio="none" viewBox="0 0 500 130">
                    <defs>
                      <linearGradient id="velocityGlowTickets" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#a078ff" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#a078ff" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path d="M 0 115 Q 60 110 110 95 T 220 85 T 280 20 T 340 70 T 420 15 T 500 45 L 500 130 L 0 130 Z" fill="url(#velocityGlowTickets)" />
                    <path d="M 0 115 Q 60 110 110 95 T 220 85 T 280 20 T 340 70 T 420 15 T 500 45" fill="none" stroke="#a078ff" strokeLinecap="round" strokeWidth="3" />
                    <circle cx="280" cy="20" r="4.5" fill="#a078ff" className="animate-pulse" />
                    <circle cx="420" cy="15" r="4.5" fill="#4cd7f6" />
                  </svg>
                  <div className="flex justify-between items-center text-[10px] text-[#958ea0] px-1 pt-1 font-mono">
                    <span>00:00</span>
                    <span>06:00</span>
                    <span className="text-[#d0bcff] font-bold">18:00 (Pico 1)</span>
                    <span className="text-[#4cd7f6] font-bold">21:30 (Pico 2)</span>
                    <span>Agora</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#292a2f]/50 border border-[#494454]/15 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-[#e3e1e9]">
                    <span className="material-symbols-outlined text-[#4cd7f6] text-[18px]">bolt</span>
                    <span>Pico máximo: <strong>142 tickets / min</strong></span>
                  </div>
                  <span className="text-[#958ea0] font-mono text-[10px]">21:42</span>
                </div>
              </div>

              {/* Channels Distribution */}
              <div className="bg-[#1e1f25] border border-[#494454]/20 p-5 rounded-2xl shadow-md flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-headline-sm text-[16px] text-[#e3e1e9] font-bold">Canais de Venda</h3>
                    <span className="font-body-sm text-[12px] text-[#cbc3d7]">Composição de arrecadação por canal</span>
                  </div>
                  <span className="material-symbols-outlined text-[#958ea0]">pie_chart</span>
                </div>

                <div className="w-full h-3 rounded-full bg-[#34343a] overflow-hidden flex gap-0.5">
                  <div className="bg-[#a078ff] h-full" style={{ width: '58%' }} title="Sympla: 58%"></div>
                  <div className="bg-[#4cd7f6] h-full" style={{ width: '32%' }} title="Site Oficial: 32%"></div>
                  <div className="bg-[#4edea3] h-full" style={{ width: '10%' }} title="Promoters: 10%"></div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl bg-[#1a1b20] border border-[#494454]/15 flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#a078ff]"></span>
                      <span className="font-label-md text-[11px] text-[#e3e1e9] font-bold">Sympla</span>
                    </div>
                    <span className="font-headline-sm text-[16px] text-[#e3e1e9] font-bold">58%</span>
                    <span className="text-[10px] text-[#958ea0]">2.482 ingressos</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#1a1b20] border border-[#494454]/15 flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#4cd7f6]"></span>
                      <span className="font-label-md text-[11px] text-[#e3e1e9] font-bold">Site Oficial</span>
                    </div>
                    <span className="font-headline-sm text-[16px] text-[#e3e1e9] font-bold">32%</span>
                    <span className="text-[10px] text-[#958ea0]">1.370 ingressos</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#1a1b20] border border-[#494454]/15 flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#4edea3]"></span>
                      <span className="font-label-md text-[11px] text-[#e3e1e9] font-bold">Promoters</span>
                    </div>
                    <span className="font-headline-sm text-[16px] text-[#e3e1e9] font-bold">10%</span>
                    <span className="text-[10px] text-[#958ea0]">428 ingressos</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Row 3: Bottom Section - Últimos Pedidos Emitidos (Live Log) */}
          <div className="bg-[#1e1f25] border border-[#494454]/20 p-5 rounded-2xl shadow-md flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[#494454]/15">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#4edea3] animate-pulse"></div>
                <div>
                  <h2 className="font-headline-sm text-[17px] text-[#e3e1e9] font-bold">Últimos Pedidos Emitidos</h2>
                  <span className="font-body-sm text-[12px] text-[#cbc3d7]">Transações ao vivo no gateway integrado</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#958ea0] text-[18px]">search</span>
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Filtrar por nome ou e-mail..."
                    className="h-9 pl-9 pr-3 rounded-xl bg-[#1a1b20] text-[#e3e1e9] text-xs placeholder:text-[#958ea0] border border-[#494454]/20 focus:outline-none focus:border-[#a078ff] w-52 sm:w-64"
                  />
                </div>
                <button
                  onClick={() => alert('Filtros avançados: Por lote, faixa de valor ou método.')}
                  className="px-3 py-2 rounded-xl bg-[#292a2f] text-[#e3e1e9] hover:bg-[#34343a] text-xs font-semibold flex items-center gap-1 border border-[#494454]/20"
                >
                  <span className="material-symbols-outlined text-[16px]">filter_list</span>
                  <span>Filtros</span>
                </button>
              </div>
            </div>

            {/* Live Transactions Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-[#1a1b20] text-[#958ea0] font-label-md text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3 rounded-l-xl">Comprador</th>
                    <th className="py-2.5 px-2">Lote / Setor</th>
                    <th className="py-2.5 px-2">Pagamento</th>
                    <th className="py-2.5 px-2 text-right">Valor Total</th>
                    <th className="py-2.5 px-2 text-center">Horário</th>
                    <th className="py-2.5 px-3 text-right rounded-r-xl">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#494454]/10 text-[#e3e1e9] font-body-sm text-[12px]">
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-[#292a2f]/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#a078ff]/20 text-[#d0bcff] flex items-center justify-center font-bold text-[11px]">
                            {ord.initials}
                          </div>
                          <div>
                            <div className="font-bold text-[#e3e1e9]">{ord.name}</div>
                            <div className="text-[11px] text-[#958ea0]">{ord.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-full font-label-sm text-[10px] font-semibold ${ord.sectorBadge}`}>
                          {ord.sector}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-[#4edea3]/15 text-[#4edea3] font-bold text-[10px]">
                            {ord.method}
                          </span>
                          <span className="material-symbols-outlined text-[#4edea3] text-[15px]">check_circle</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right font-bold tabular-nums">{ord.value}</td>
                      <td className="py-3 px-2 text-center text-[#958ea0] font-mono text-[11px]">{ord.time}</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => alert(`Comprovante reenviado com sucesso para ${ord.email}!`)}
                          className="px-2.5 py-1 rounded-lg bg-[#292a2f] hover:bg-[#34343a] text-[#e3e1e9] font-label-sm text-[10px] font-semibold inline-flex items-center gap-1 transition-colors border border-[#494454]/20"
                        >
                          <span className="material-symbols-outlined text-[13px]">send</span>
                          <span>Reenviar</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-[#958ea0] font-label-sm text-[11px] border-t border-[#494454]/15">
              <span>Exibindo 4 transações recentes de {sold.toLocaleString('pt-BR')} registradas</span>
              <button 
                onClick={() => setActiveSubView('gandaya')}
                className="px-3 py-1 rounded-lg bg-[#292a2f] text-[#e3e1e9] hover:bg-[#34343a] transition-colors font-bold text-xs"
              >
                Abrir Banco Completo Gandaya →
              </button>
            </div>
          </div>

        </div>
      )}

      {/* New Batch Modal */}
      {showNewBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="w-full max-w-md bg-[#1e1f25] border border-[#494454]/40 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#494454]/20">
              <h3 className="font-headline-sm text-lg text-[#e3e1e9] font-bold">Criar Novo Lote</h3>
              <button onClick={() => setShowNewBatchModal(false)} className="text-[#958ea0] hover:text-[#e3e1e9]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateBatch} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-[#cbc3d7] font-semibold block mb-1">Nome do Lote / Setor</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Área VIP - 3º Lote"
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#1a1b20] text-[#e3e1e9] border border-[#494454]/30 focus:outline-none focus:border-[#a078ff] text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#cbc3d7] font-semibold block mb-1">Preço Unitário (R$)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newBatchPrice}
                    onChange={(e) => setNewBatchPrice(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#1a1b20] text-[#e3e1e9] border border-[#494454]/30 focus:outline-none focus:border-[#a078ff] text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#cbc3d7] font-semibold block mb-1">Carga Nominal (Qtd)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newBatchCapacity}
                    onChange={(e) => setNewBatchCapacity(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#1a1b20] text-[#e3e1e9] border border-[#494454]/30 focus:outline-none focus:border-[#a078ff] text-sm"
                  />
                </div>
              </div>
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#494454]/20">
                <button
                  type="button"
                  onClick={() => setShowNewBatchModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#292a2f] text-[#cbc3d7] hover:text-[#e3e1e9] text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#a078ff] text-[#121318] hover:bg-[#d0bcff] text-xs font-bold"
                >
                  Salvar Lote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
