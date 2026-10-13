import React, { useState } from 'react';
import { EventData, FinancialCostItem, FinancialRevenueItem } from '../../types';
import { FinancialHub } from '../FinancialHub';
import { SheetsExportButton } from '../SheetsExportButton';

interface StitchFinancialViewProps {
  event: EventData;
  onUpdateEvent: (updated: EventData) => void;
  onNavigateToTab: (tabId: string) => void;
}

export const StitchFinancialView: React.FC<StitchFinancialViewProps> = ({
  event,
  onUpdateEvent,
  onNavigateToTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'dre' | 'sheets_hub'>('dre');
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [showAddCostModal, setShowAddCostModal] = useState(false);
  const [showAddRevenueModal, setShowAddRevenueModal] = useState(false);

  // New cost form
  const [costCategory, setCostCategory] = useState('Artístico & Cachês');
  const [costDescription, setCostDescription] = useState('');
  const [costSupplier, setCostSupplier] = useState('');
  const [costAmount, setCostAmount] = useState('');

  // New revenue form
  const [revCategory, setRevCategory] = useState('Bilheteria');
  const [revDescription, setRevDescription] = useState('');
  const [revAmount, setRevAmount] = useState('');

  // Financial calculations from real event state
  const totalRev = event.currentRevenue || 485600;
  const actualCosts = event.financials?.costs?.reduce((acc, c) => acc + (c.actualAmount || c.budgetedAmount || 0), 0) || 218450;
  const netOperatingProfit = Math.max(0, totalRev - actualCosts);
  const profitMargin = totalRev > 0 ? ((netOperatingProfit / totalRev) * 100).toFixed(1) : '55.0';
  const coverageRatio = actualCosts > 0 ? (totalRev / actualCosts).toFixed(2) : '2.22';

  const costCenters = [
    { name: 'Artistas, DJs e Cachês', amount: 75000, percent: 34.3, color: 'bg-[#a078ff]' },
    { name: 'Estrutura de Palco, Som e Luz', amount: 42000, percent: 19.2, color: 'bg-[#4cd7f6]' },
    { name: 'Bebidas e Estoque do Bar', amount: 31500, percent: 14.4, color: 'bg-[#4edea3]' },
    { name: 'Locação do Espaço & Alvarás', amount: 28000, percent: 12.8, color: 'bg-[#958ea0]' },
    { name: 'Segurança Privada & Brigada', amount: 16500, percent: 7.5, color: 'bg-[#ffb4ab]' },
    { name: 'Marketing & Tráfego Pago', amount: 14250, percent: 6.5, color: 'bg-[#d0bcff]' },
    { name: 'Equipe de Produção & Staff', amount: 11200, percent: 5.1, color: 'bg-[#38393f]' },
  ];

  const pendingPayables = [
    {
      id: 'p-1',
      title: '2ª Parcela DJ Headliner',
      details: 'Vence em 5 dias • TED Bancário',
      amount: '- R$ 25.000,00',
      type: 'A Pagar',
      isExpense: true,
      icon: 'outbox',
    },
    {
      id: 'p-2',
      title: 'Geradores de Energia Primários',
      details: 'Vence em 3 dias • Boleto',
      amount: '- R$ 13.000,00',
      type: 'A Pagar',
      isExpense: true,
      icon: 'power',
    },
    {
      id: 'p-3',
      title: 'Cota Patrocínio Red Bull',
      details: 'Vence amanhã • Depósito PIX',
      amount: '+ R$ 15.000,00',
      type: 'A Receber',
      isExpense: false,
      icon: 'inbox',
    },
  ];

  const transactions = [
    {
      id: 'trx-1',
      date: '19 Out • 14:20',
      code: '#TRX-94812',
      desc: 'Lote 03 - Pista Premium (Lote Fechado)',
      sub: 'Gateway PulsePay • 140 transações',
      category: 'Bilheteria Oficial',
      catBadge: 'bg-[#1a1b20] text-[#4cd7f6]',
      method: 'PIX Instantâneo',
      methodIcon: 'bolt',
      receipt: 'Validado',
      value: '+ R$ 42.000,00',
      isIncome: true,
      status: 'Conciliado',
      statusClass: 'bg-[#00a572]/15 text-[#4edea3]',
    },
    {
      id: 'trx-2',
      date: '19 Out • 11:05',
      code: '#TRX-94750',
      desc: '1ª Parcela Cachê DJ Principal',
      sub: 'Artplan Artist Management LTDA',
      category: 'Artistas & DJs',
      catBadge: 'bg-[#1a1b20] text-[#a078ff]',
      method: 'TED Bancário',
      methodIcon: 'account_balance',
      receipt: 'NF-9082.pdf',
      value: '- R$ 50.000,00',
      isIncome: false,
      status: 'Conciliado',
      statusClass: 'bg-[#00a572]/15 text-[#4edea3]',
    },
    {
      id: 'trx-3',
      date: '18 Out • 18:30',
      code: '#TRX-94622',
      desc: 'Pedido Consignado Cerveja Corona & Gin',
      sub: 'Ambev Brasil Distribuidora S.A.',
      category: 'Estoque do Bar',
      catBadge: 'bg-[#1a1b20] text-[#4edea3]',
      method: 'Boleto Faturado',
      methodIcon: 'receipt_long',
      receipt: 'Danfe.xml',
      value: '- R$ 31.500,00',
      isIncome: false,
      status: 'Em Aberto',
      statusClass: 'bg-[#03b5d3]/15 text-[#4cd7f6]',
    },
    {
      id: 'trx-4',
      date: '17 Out • 10:15',
      code: '#TRX-94510',
      desc: 'Cota Naming Rights Palco Sunset (1ª Parcela)',
      sub: 'Contrato Comercial #2025-HN',
      category: 'Patrocínio Master',
      catBadge: 'bg-[#1a1b20] text-[#d0bcff]',
      method: 'TED Bancário',
      methodIcon: 'account_balance',
      receipt: 'Recibo.pdf',
      value: '+ R$ 80.000,00',
      isIncome: true,
      status: 'Conciliado',
      statusClass: 'bg-[#00a572]/15 text-[#4edea3]',
    },
  ];

  const filteredTransactions = transactions.filter(t => {
    if (transactionFilter === 'income') return t.isIncome;
    if (transactionFilter === 'expense') return !t.isIncome;
    return true;
  });

  const handleAddCost = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(costAmount) || 0;
    if (!costDescription || amountNum <= 0) return;

    const newCost: FinancialCostItem = {
      id: `c-${Date.now()}`,
      category: costCategory,
      description: costDescription,
      supplier: costSupplier || 'Fornecedor',
      budgetedAmount: amountNum,
      actualAmount: amountNum,
      paymentStatus: 'Pendente',
      dueDate: new Date().toISOString().split('T')[0],
    };

    const updatedEvent: EventData = {
      ...event,
      financials: {
        ...event.financials,
        costs: [newCost, ...(event.financials?.costs || [])],
        revenues: event.financials?.revenues || [],
      },
    };

    onUpdateEvent(updatedEvent);
    setShowAddCostModal(false);
    setCostDescription('');
    setCostAmount('');
    setCostSupplier('');
  };

  const handleAddRevenue = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(revAmount) || 0;
    if (!revDescription || amountNum <= 0) return;

    const newRev: FinancialRevenueItem = {
      id: `r-${Date.now()}`,
      category: revCategory,
      description: revDescription,
      channel: 'Manual / Direto',
      grossRevenue: amountNum,
      platformFees: 0,
      netRevenue: amountNum,
      status: 'Recebido',
    };

    const updatedEvent: EventData = {
      ...event,
      currentRevenue: event.currentRevenue + amountNum,
      financials: {
        ...event.financials,
        costs: event.financials?.costs || [],
        revenues: [newRev, ...(event.financials?.revenues || [])],
      },
    };

    onUpdateEvent(updatedEvent);
    setShowAddRevenueModal(false);
    setRevDescription('');
    setRevAmount('');
  };

  return (
    <div className="flex flex-col w-full pb-16">
      
      {/* 1. Header & Breadcrumb Section */}
      <div className="flex flex-col gap-4 pt-4 pb-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 font-label-md text-[11px] text-[#958ea0]">
            <span onClick={() => onNavigateToTab('overview')} className="hover:text-[#e3e1e9] cursor-pointer transition-colors">
              Eventos
            </span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#e3e1e9]">{event.name}</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#d0bcff] font-bold">Financeiro & DRE</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#292a2f] text-[#4edea3] font-label-sm text-[11px] font-bold border border-[#4edea3]/20">
              <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse"></span>
              Fechamento Dinâmico
            </span>

            {/* Sub-view toggle */}
            <div className="flex items-center p-1 rounded-xl bg-[#1e1f25] border border-[#494454]/20">
              <button
                onClick={() => setActiveSubTab('dre')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeSubTab === 'dre'
                    ? 'bg-[#a078ff] text-[#121318]'
                    : 'text-[#cbc3d7] hover:text-[#e3e1e9]'
                }`}
              >
                DRE Consolidada
              </button>
              <button
                onClick={() => setActiveSubTab('sheets_hub')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeSubTab === 'sheets_hub'
                    ? 'bg-[#a078ff] text-[#121318]'
                    : 'text-[#cbc3d7] hover:text-[#e3e1e9]'
                }`}
              >
                Google Sheets Hub
              </button>
            </div>
          </div>
        </div>

        {/* Title & Action Bar */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div>
            <h1 className="font-headline-xl text-[28px] text-[#e3e1e9] font-bold tracking-tight">
              Demonstrativo de Resultados (DRE) & Fluxo Financeiro
            </h1>
            <p className="font-body-md text-[13px] text-[#cbc3d7] mt-0.5">
              Consolidação contábil automatizada, controle de margem líquida e previsibilidade de caixa.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <SheetsExportButton
              filename={`DRE_Consolidada_${event.id}`}
              title={`Demonstrativo de Resultados - ${event.name}`}
              headers={['Centro de Custo / Descrição', 'Categoria', 'Valor (R$)', 'Status']}
              rows={[
                ['Receita Global Faturada', 'Receitas', `R$ ${totalRev.toLocaleString('pt-BR')}`, 'Realizado'],
                ['Despesas Totais Operacionais', 'Custos', `R$ ${actualCosts.toLocaleString('pt-BR')}`, 'Empenhado'],
                ['Resultado Líquido Operacional', 'Resultado', `R$ ${netOperatingProfit.toLocaleString('pt-BR')}`, `Margem ${profitMargin}%`],
                ...costCenters.map(c => [c.name, 'Centro de Custo', `R$ ${c.amount.toLocaleString('pt-BR')}`, `${c.percent}%`]),
              ]}
              label="Exportar Balancete (XLS)"
            />

            <button
              onClick={() => setShowAddRevenueModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00a572]/20 hover:bg-[#00a572]/30 text-[#4edea3] font-label-md text-[12px] font-bold transition-all border border-[#00a572]/30"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>+ Registrar Receita</span>
            </button>

            <button
              onClick={() => setShowAddCostModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#a078ff] text-[#121318] hover:bg-[#d0bcff] font-label-md text-[12px] font-bold transition-all shadow-[0_0_24px_-4px_rgba(160,120,255,0.35)] active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">payments</span>
              <span>+ Nova Despesa</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeSubTab === 'sheets_hub' ? (
        <FinancialHub
          event={event}
          onUpdateEvent={onUpdateEvent}
          initialTab="consolidated"
        />
      ) : (
        <div className="flex flex-col gap-6">
          
          {/* 2. Executive Financial Summary Cards (Row of 4 Large Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            
            {/* Card 1 */}
            <div className="flex flex-col justify-between p-5 rounded-2xl bg-[#1e1f25] border border-[#494454]/20 shadow-md hover:bg-[#292a2f] transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-label-md text-[11px] text-[#958ea0] uppercase tracking-wider font-bold">
                    Resultado Líquido Projetado
                  </span>
                  <span className="p-1.5 rounded-lg bg-[#292a2f] text-[#d0bcff]">
                    <span className="material-symbols-outlined text-[18px]">trending_up</span>
                  </span>
                </div>
                <div className="font-kpi-number text-[26px] text-[#e3e1e9] font-bold tabular-nums">
                  R$ {netOperatingProfit.toLocaleString('pt-BR')},00
                </div>
              </div>
              <div className="mt-4 pt-2.5 flex items-center justify-between border-t border-[#494454]/15">
                <span className="inline-flex items-center gap-1 font-label-sm text-[11px] text-[#4edea3] font-bold">
                  <span className="material-symbols-outlined text-[15px]">arrow_upward</span>
                  +18,4% vs meta
                </span>
                <span className="font-label-sm text-[11px] text-[#cbc3d7]">Margem: <strong className="text-[#4edea3]">{profitMargin}%</strong></span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="flex flex-col justify-between p-5 rounded-2xl bg-[#1e1f25] border border-[#494454]/20 shadow-md hover:bg-[#292a2f] transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-label-md text-[11px] text-[#958ea0] uppercase tracking-wider font-bold">
                    Receita Confirmada (Total)
                  </span>
                  <span className="p-1.5 rounded-lg bg-[#292a2f] text-[#4edea3]">
                    <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                  </span>
                </div>
                <div className="font-kpi-number text-[26px] text-[#e3e1e9] font-bold tabular-nums">
                  R$ {totalRev.toLocaleString('pt-BR')},00
                </div>
              </div>
              <div className="mt-4 pt-2.5 flex items-center justify-between border-t border-[#494454]/15">
                <span className="inline-flex items-center gap-1 font-label-sm text-[11px] text-[#4cd7f6] font-bold">
                  <span className="material-symbols-outlined text-[15px]">verified</span>
                  100% faturado
                </span>
                <span className="font-label-sm text-[11px] text-[#cbc3d7]">Em conta / Gateway</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="flex flex-col justify-between p-5 rounded-2xl bg-[#1e1f25] border border-[#494454]/20 shadow-md hover:bg-[#292a2f] transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-label-md text-[11px] text-[#958ea0] uppercase tracking-wider font-bold">
                    Despesas Totais Lançadas
                  </span>
                  <span className="p-1.5 rounded-lg bg-[#292a2f] text-[#ffb4ab]">
                    <span className="material-symbols-outlined text-[18px]">shopping_cart_checkout</span>
                  </span>
                </div>
                <div className="font-kpi-number text-[26px] text-[#e3e1e9] font-bold tabular-nums">
                  R$ {actualCosts.toLocaleString('pt-BR')},00
                </div>
              </div>
              <div className="mt-4 pt-2.5 flex items-center justify-between border-t border-[#494454]/15">
                <span className="inline-flex items-center gap-1 font-label-sm text-[11px] text-[#cbc3d7] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#ffb4ab]"></span>
                  45,0% do teto máximo
                </span>
                <span className="font-label-sm text-[11px] text-[#cbc3d7]">Orçamento seguro</span>
              </div>
            </div>

            {/* Card 4 */}
            <div className="flex flex-col justify-between p-5 rounded-2xl bg-[#1e1f25] border border-[#494454]/20 shadow-md hover:bg-[#292a2f] transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-label-md text-[11px] text-[#958ea0] uppercase tracking-wider font-bold">
                    Ponto de Equilíbrio
                  </span>
                  <span className="p-1.5 rounded-lg bg-[#292a2f] text-[#4cd7f6]">
                    <span className="material-symbols-outlined text-[18px]">flag</span>
                  </span>
                </div>
                <div className="font-kpi-number text-[26px] text-[#4cd7f6] font-bold tabular-nums flex items-baseline gap-2">
                  <span>Atingido</span>
                  <span className="text-[14px] text-[#4edea3]">100% OK</span>
                </div>
              </div>
              <div className="mt-4 pt-2.5 flex items-center justify-between border-t border-[#494454]/15">
                <span className="inline-flex items-center gap-1 font-label-sm text-[11px] text-[#4edea3] font-bold">
                  <span className="material-symbols-outlined text-[15px]">check_circle</span>
                  Superávit líquido
                </span>
                <span className="font-label-sm text-[11px] text-[#958ea0]">Meta batida</span>
              </div>
            </div>

          </div>

          {/* 3. Ratio & Budget Progress Bar Card */}
          <div className="p-5 rounded-2xl bg-[#1e1f25] border border-[#494454]/20 shadow-md flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-[#a078ff]"></span>
                <span className="font-title-md text-[15px] text-[#e3e1e9] font-bold">
                  Balanço Sintético: Receita Total vs. Despesas Gerais
                </span>
              </div>
              <div className="flex items-center gap-4 font-label-sm text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffb4ab]"></span>
                  <span className="text-[#cbc3d7]">Custos: <strong className="text-[#e3e1e9]">R$ {actualCosts.toLocaleString('pt-BR')} (45%)</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4edea3]"></span>
                  <span className="text-[#cbc3d7]">Sobra Líquida: <strong className="text-[#e3e1e9]">R$ {netOperatingProfit.toLocaleString('pt-BR')} (55%)</strong></span>
                </div>
                <div className="px-2.5 py-0.5 rounded-md bg-[#292a2f] text-[#d0bcff] font-bold border border-[#494454]/30">
                  Cobertura: {coverageRatio}x
                </div>
              </div>
            </div>

            {/* Segmented Bar */}
            <div className="w-full h-3.5 rounded-full bg-[#34343a] overflow-hidden flex p-0.5 gap-1">
              <div className="h-full rounded-full bg-[#ffb4ab] transition-all" style={{ width: '45%' }}></div>
              <div className="h-full rounded-full bg-[#4edea3] transition-all" style={{ width: '55%' }}></div>
            </div>

            <div className="flex items-center justify-between font-label-sm text-[10px] text-[#958ea0] font-mono">
              <span>R$ 0,00 (Custos Fixos Absorvidos)</span>
              <span className="text-[#4cd7f6] font-bold">Equilíbrio Fiscal: R$ {actualCosts.toLocaleString('pt-BR')},00</span>
              <span>Receita Global Faturada: R$ {totalRev.toLocaleString('pt-BR')},00</span>
            </div>
          </div>

          {/* 4. Detailed Breakdown Section: 2 Columns (7 cols / 5 cols) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            
            {/* Left Column: Centros de Custo (7 Cols) */}
            <div className="xl:col-span-7 flex flex-col gap-4 p-5 rounded-2xl bg-[#1e1f25] border border-[#494454]/20 shadow-md">
              <div className="flex items-center justify-between pb-1 border-b border-[#494454]/15">
                <div>
                  <h2 className="font-headline-sm text-[17px] text-[#e3e1e9] font-bold">Detalhamento por Centro de Custo</h2>
                  <p className="font-body-sm text-[12px] text-[#cbc3d7]">Distribuição das despesas operacionais da infraestrutura</p>
                </div>
                <span className="font-label-md text-[11px] text-[#d0bcff] bg-[#a078ff]/15 px-3 py-1 rounded-xl font-bold border border-[#a078ff]/20">
                  {costCenters.length} Categorias
                </span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-[#1a1b20] font-label-md text-[11px] text-[#958ea0] uppercase tracking-wider">
                      <th className="py-2.5 px-3 rounded-l-xl">Centro de Custo</th>
                      <th className="py-2.5 px-3 text-right">Montante Gasto</th>
                      <th className="py-2.5 px-3 text-center">% do Custo</th>
                      <th className="py-2.5 px-3 rounded-r-xl">Proporção Visual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#494454]/10 font-body-sm text-[12px] text-[#e3e1e9]">
                    {costCenters.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#292a2f]/40 transition-colors">
                        <td className="py-3 px-3 font-semibold text-[#e3e1e9] flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${item.color}`}></span>
                          {item.name}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums">
                          R$ {item.amount.toLocaleString('pt-BR')},00
                        </td>
                        <td className="py-3 px-3 text-center font-bold font-mono">
                          {item.percent}%
                        </td>
                        <td className="py-3 px-3">
                          <div className="w-full h-2 rounded-full bg-[#34343a] overflow-hidden">
                            <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.percent}%` }}></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Contas a Liquidar & Mini Cashflow (5 Cols) */}
            <div className="xl:col-span-5 flex flex-col gap-5">
              
              {/* Contas a Liquidar */}
              <div className="p-5 rounded-2xl bg-[#1e1f25] border border-[#494454]/20 shadow-md flex flex-col gap-3">
                <div className="flex items-center justify-between pb-1 border-b border-[#494454]/15">
                  <h2 className="font-headline-sm text-[16px] text-[#e3e1e9] font-bold">Contas a Liquidar</h2>
                  <span className="font-label-sm text-[11px] text-[#958ea0]">Próximos 7 dias</span>
                </div>

                <div className="flex flex-col gap-2">
                  {pendingPayables.map((item) => (
                    <div 
                      key={item.id} 
                      className="p-2.5 rounded-xl bg-[#1a1b20] border border-[#494454]/15 flex items-center justify-between hover:bg-[#292a2f] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-lg ${item.isExpense ? 'bg-[#93000a]/20 text-[#ffb4ab]' : 'bg-[#00a572]/20 text-[#4edea3]'}`}>
                          <span className="material-symbols-outlined text-[17px]">{item.icon}</span>
                        </div>
                        <div>
                          <div className="font-label-md text-[12px] text-[#e3e1e9] font-bold">{item.title}</div>
                          <div className="font-body-sm text-[11px] text-[#958ea0]">{item.details}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-mono text-[12px] font-bold tabular-nums ${item.isExpense ? 'text-[#ffb4ab]' : 'text-[#4edea3]'}`}>
                          {item.amount}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full font-label-sm text-[9px] font-bold ${
                          item.isExpense ? 'bg-[#ffb4ab]/10 text-[#ffb4ab]' : 'bg-[#4edea3]/10 text-[#4edea3]'
                        }`}>
                          {item.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fluxo de Caixa Acumulado Sparkline */}
              <div className="p-5 rounded-2xl bg-[#1e1f25] border border-[#494454]/20 shadow-md flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-title-md text-[14px] text-[#e3e1e9] font-bold">Curva de Caixa Acumulado</span>
                  <span className="font-label-sm text-[10px] text-[#4edea3] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">trending_up</span>
                    Projeção Segura
                  </span>
                </div>
                <p className="font-body-sm text-[11px] text-[#cbc3d7]">Evolução do saldo líquido diário após liquidações dos últimos 15 dias.</p>
                
                <div className="w-full h-20 pt-1">
                  <svg className="w-full h-full text-[#a078ff]" fill="none" preserveAspectRatio="none" viewBox="0 0 300 80">
                    <defs>
                      <linearGradient id="finGradStitch" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.35"></stop>
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0.0"></stop>
                      </linearGradient>
                    </defs>
                    <path d="M 0 65 Q 40 50, 70 58 T 130 42 T 190 35 T 240 20 T 300 8 L 300 80 L 0 80 Z" fill="url(#finGradStitch)"></path>
                    <path d="M 0 65 Q 40 50, 70 58 T 130 42 T 190 35 T 240 20 T 300 8" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5"></path>
                    <circle cx="300" cy="8" r="3.5" fill="#FFFFFF"></circle>
                  </svg>
                </div>
                <div className="flex items-center justify-between font-mono text-[10px] text-[#958ea0] pt-1">
                  <span>D-15</span>
                  <span>D-7</span>
                  <span className="text-[#e3e1e9] font-bold">Hoje: R$ {netOperatingProfit.toLocaleString('pt-BR')}</span>
                </div>
              </div>

            </div>

          </div>

          {/* 5. Bottom Full Width Section: Extrato de Lançamentos & Conciliação Bancária */}
          <div className="p-5 rounded-2xl bg-[#1e1f25] border border-[#494454]/20 shadow-md flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-3 pb-1 border-b border-[#494454]/15">
              <div>
                <h2 className="font-headline-sm text-[17px] text-[#e3e1e9] font-bold">Extrato de Lançamentos & Conciliação Bancária</h2>
                <p className="font-body-sm text-[12px] text-[#cbc3d7]">Conferência contábil automatizada e liquidações bancárias</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 p-1 rounded-xl bg-[#1a1b20] border border-[#494454]/20 text-xs">
                  <button 
                    onClick={() => setTransactionFilter('all')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      transactionFilter === 'all' ? 'bg-[#a078ff] text-[#121318]' : 'text-[#cbc3d7] hover:text-[#e3e1e9]'
                    }`}
                  >
                    Todos ({transactions.length})
                  </button>
                  <button 
                    onClick={() => setTransactionFilter('income')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      transactionFilter === 'income' ? 'bg-[#a078ff] text-[#121318]' : 'text-[#cbc3d7] hover:text-[#e3e1e9]'
                    }`}
                  >
                    Receitas
                  </button>
                  <button 
                    onClick={() => setTransactionFilter('expense')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      transactionFilter === 'expense' ? 'bg-[#a078ff] text-[#121318]' : 'text-[#cbc3d7] hover:text-[#e3e1e9]'
                    }`}
                  >
                    Despesas
                  </button>
                </div>
              </div>
            </div>

            {/* Financial Transaction Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[720px]">
                <thead>
                  <tr className="bg-[#1a1b20] font-label-md text-[11px] text-[#958ea0] uppercase tracking-wider">
                    <th className="py-2.5 px-3 rounded-l-xl">Data / ID</th>
                    <th className="py-2.5 px-3">Descrição do Lançamento</th>
                    <th className="py-2.5 px-3">Centro de Custo</th>
                    <th className="py-2.5 px-3">Método</th>
                    <th className="py-2.5 px-3 text-center">Comprovante</th>
                    <th className="py-2.5 px-3 text-right">Valor Líquido</th>
                    <th className="py-2.5 px-3 text-center rounded-r-xl">Conciliação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#494454]/10 font-body-sm text-[12px] text-[#e3e1e9]">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#292a2f]/40 transition-colors">
                      <td className="py-3 px-3 text-[#cbc3d7]">
                        <div className="font-semibold text-[#e3e1e9]">{tx.date}</div>
                        <div className="font-mono text-[10px] text-[#958ea0]">{tx.code}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#e3e1e9]">{tx.desc}</div>
                        <div className="text-[11px] text-[#958ea0]">{tx.sub}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-lg font-label-sm text-[10px] font-semibold ${tx.catBadge}`}>
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 text-[#cbc3d7]">
                          <span className="material-symbols-outlined text-[15px] text-[#4edea3]">{tx.methodIcon}</span>
                          <span>{tx.method}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[#4edea3] font-label-sm text-[10px] bg-[#00a572]/10 px-2 py-0.5 rounded-full font-bold">
                          <span className="material-symbols-outlined text-[13px]">attachment</span>
                          {tx.receipt}
                        </span>
                      </td>
                      <td className={`py-3 px-3 text-right font-mono font-bold tabular-nums ${
                        tx.isIncome ? 'text-[#4edea3]' : 'text-[#ffb4ab]'
                      }`}>
                        {tx.value}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-[10px] font-bold ${tx.statusClass}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* Add Cost Modal */}
      {showAddCostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="w-full max-w-md bg-[#1e1f25] border border-[#494454]/40 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#494454]/20">
              <h3 className="font-headline-sm text-lg text-[#e3e1e9] font-bold">Registrar Nova Despesa</h3>
              <button onClick={() => setShowAddCostModal(false)} className="text-[#958ea0] hover:text-[#e3e1e9]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddCost} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-[#cbc3d7] font-semibold block mb-1">Centro de Custo</label>
                <select
                  value={costCategory}
                  onChange={(e) => setCostCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#1a1b20] text-[#e3e1e9] border border-[#494454]/30 focus:outline-none focus:border-[#a078ff] text-sm"
                >
                  <option value="Artístico & Cachês">Artístico & Cachês</option>
                  <option value="Estrutura & Cenografia">Estrutura & Cenografia</option>
                  <option value="Marketing & Tráfego">Marketing & Tráfego</option>
                  <option value="Bar & Bebidas">Bar & Bebidas</option>
                  <option value="Segurança & Operação">Segurança & Operação</option>
                  <option value="Taxas & Alvarás">Taxas & Alvarás</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#cbc3d7] font-semibold block mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Locação de Geradores de Energia"
                  value={costDescription}
                  onChange={(e) => setCostDescription(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#1a1b20] text-[#e3e1e9] border border-[#494454]/30 focus:outline-none focus:border-[#a078ff] text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#cbc3d7] font-semibold block mb-1">Fornecedor / Credor</label>
                <input
                  type="text"
                  placeholder="Ex: EnergyPower Locações Ltda"
                  value={costSupplier}
                  onChange={(e) => setCostSupplier(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#1a1b20] text-[#e3e1e9] border border-[#494454]/30 focus:outline-none focus:border-[#a078ff] text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#cbc3d7] font-semibold block mb-1">Valor Total (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Ex: 18500.00"
                  value={costAmount}
                  onChange={(e) => setCostAmount(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#1a1b20] text-[#e3e1e9] border border-[#494454]/30 focus:outline-none focus:border-[#a078ff] text-sm"
                />
              </div>
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#494454]/20">
                <button
                  type="button"
                  onClick={() => setShowAddCostModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#292a2f] text-[#cbc3d7] hover:text-[#e3e1e9] text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#a078ff] text-[#121318] hover:bg-[#d0bcff] text-xs font-bold"
                >
                  Lançar Despesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Revenue Modal */}
      {showAddRevenueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="w-full max-w-md bg-[#1e1f25] border border-[#494454]/40 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#494454]/20">
              <h3 className="font-headline-sm text-lg text-[#e3e1e9] font-bold">Registrar Nova Receita</h3>
              <button onClick={() => setShowAddRevenueModal(false)} className="text-[#958ea0] hover:text-[#e3e1e9]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddRevenue} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-[#cbc3d7] font-semibold block mb-1">Categoria de Receita</label>
                <select
                  value={revCategory}
                  onChange={(e) => setRevCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#1a1b20] text-[#e3e1e9] border border-[#494454]/30 focus:outline-none focus:border-[#a078ff] text-sm"
                >
                  <option value="Bilheteria">Bilheteria</option>
                  <option value="Bar & A&B">Bar & A&B</option>
                  <option value="Patrocínios">Patrocínios</option>
                  <option value="Camarotes & Lounges">Camarotes & Lounges</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#cbc3d7] font-semibold block mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cota Patrocínio Master Heineken"
                  value={revDescription}
                  onChange={(e) => setRevDescription(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#1a1b20] text-[#e3e1e9] border border-[#494454]/30 focus:outline-none focus:border-[#a078ff] text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#cbc3d7] font-semibold block mb-1">Valor Bruto (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Ex: 80000.00"
                  value={revAmount}
                  onChange={(e) => setRevAmount(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#1a1b20] text-[#e3e1e9] border border-[#494454]/30 focus:outline-none focus:border-[#a078ff] text-sm"
                />
              </div>
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#494454]/20">
                <button
                  type="button"
                  onClick={() => setShowAddRevenueModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#292a2f] text-[#cbc3d7] hover:text-[#e3e1e9] text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#00a572] text-[#121318] hover:bg-[#4edea3] text-xs font-bold"
                >
                  Confirmar Receita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
