import React, { useState } from 'react';
import { EventData } from '../../types';
import { SheetsExportButton } from '../SheetsExportButton';

interface StitchBarOpsViewProps {
  event: EventData;
  onNavigateToTab: (tabId: string) => void;
}

export const StitchBarOpsView: React.FC<StitchBarOpsViewProps> = ({
  event,
  onNavigateToTab,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchItem, setSearchItem] = useState('');
  const [showAlert, setShowAlert] = useState(true);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('Combos VIP');
  const [newProductCmv, setNewProductCmv] = useState('50');
  const [newProductPrice, setNewProductPrice] = useState('180');
  const [newProductStock, setNewProductStock] = useState('100');

  // Real or proportional calculations
  const totalRev = event.currentRevenue || 485600;
  const barFaturamento = Math.round(totalRev * 0.22);
  const barCmv = Math.round(barFaturamento * 0.295);
  const barLucro = barFaturamento - barCmv;
  const marginPercent = ((barLucro / barFaturamento) * 100).toFixed(1);

  const [products, setProducts] = useState([
    {
      id: 'p-1',
      name: 'Combo Gin Tanqueray + 4 Tônicas',
      desc: 'Garrafa 750ml + 4 Latas Schweppes',
      category: 'Combos VIP',
      catBadge: 'bg-[#a078ff]/15 text-[#d0bcff]',
      icon: 'wine_bar',
      cmv: 110.00,
      price: 380.00,
      marginPercent: '+71,0%',
      marginVal: 'R$ 270,00 liq',
      stockCurrent: 84,
      stockMax: 150,
      stockPercent: 56,
      status: 'Estoque Normal',
      statusClass: 'bg-[#03b5d3]/20 text-[#4cd7f6]',
      isCritical: false,
    },
    {
      id: 'p-2',
      name: 'Cerveja Heineken Lata 350ml',
      desc: 'Pure Malt Lager 350ml',
      category: 'Cervejas & Chopes',
      catBadge: 'bg-[#4edea3]/15 text-[#4edea3]',
      icon: 'sports_bar',
      cmv: 4.20,
      price: 16.00,
      marginPercent: '+73,7%',
      marginVal: 'R$ 11,80 liq',
      stockCurrent: 1450,
      stockMax: 3000,
      stockPercent: 48,
      status: 'Saudável',
      statusClass: 'bg-[#00a572]/20 text-[#4edea3]',
      isCritical: false,
    },
    {
      id: 'p-3',
      name: 'Energético Red Bull 250ml',
      desc: 'Tradicional / Sugar Free',
      category: 'Não Alcoólicos',
      catBadge: 'bg-[#34343a] text-[#e3e1e9]',
      icon: 'bolt',
      cmv: 6.50,
      price: 20.00,
      marginPercent: '+67,5%',
      marginVal: 'R$ 13,50 liq',
      stockCurrent: 180,
      stockMax: 1000,
      stockPercent: 18,
      status: 'Crítico (Alerta)',
      statusClass: 'bg-[#93000a]/30 text-[#ffb4ab] animate-pulse',
      isCritical: true,
    },
    {
      id: 'p-4',
      name: 'Vodka Absolut Dose 50ml',
      desc: 'Dose avulsa com gelo e frutas',
      category: 'Destilados & Doses',
      catBadge: 'bg-[#4cd7f6]/15 text-[#4cd7f6]',
      icon: 'local_bar',
      cmv: 7.80,
      price: 32.00,
      marginPercent: '+75,6%',
      marginVal: 'R$ 24,20 liq',
      stockCurrent: 420,
      stockMax: 800,
      stockPercent: 52,
      status: 'Saudável',
      statusClass: 'bg-[#00a572]/20 text-[#4edea3]',
      isCritical: false,
    },
    {
      id: 'p-5',
      name: 'Água Mineral sem Gás 500ml',
      desc: 'Garrafa PET eco',
      category: 'Não Alcoólicos',
      catBadge: 'bg-[#34343a] text-[#e3e1e9]',
      icon: 'water_drop',
      cmv: 1.50,
      price: 8.00,
      marginPercent: '+81,2%',
      marginVal: 'R$ 6,50 liq',
      stockCurrent: 1100,
      stockMax: 2000,
      stockPercent: 55,
      status: 'Saudável',
      statusClass: 'bg-[#00a572]/20 text-[#4edea3]',
      isCritical: false,
    },
  ]);

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'todos' || 
      p.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch = p.name.toLowerCase().includes(searchItem.toLowerCase()) || 
      p.desc.toLowerCase().includes(searchItem.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) return;

    const cmvNum = parseFloat(newProductCmv) || 0;
    const priceNum = parseFloat(newProductPrice) || 0;
    const stockNum = parseInt(newProductStock) || 100;
    const margin = priceNum > 0 ? (((priceNum - cmvNum) / priceNum) * 100).toFixed(1) : '0';

    const newProd = {
      id: `p-${Date.now()}`,
      name: newProductName,
      desc: 'Novo item cadastrado',
      category: newProductCategory,
      catBadge: 'bg-[#a078ff]/15 text-[#d0bcff]',
      icon: 'liquor',
      cmv: cmvNum,
      price: priceNum,
      marginPercent: `+${margin}%`,
      marginVal: `R$ ${(priceNum - cmvNum).toFixed(2)} liq`,
      stockCurrent: stockNum,
      stockMax: stockNum,
      stockPercent: 100,
      status: 'Estoque Normal',
      statusClass: 'bg-[#03b5d3]/20 text-[#4cd7f6]',
      isCritical: false,
    };

    setProducts(prev => [newProd, ...prev]);
    setShowAddProductModal(false);
    setNewProductName('');
  };

  const handleRestock = (prodId: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id === prodId) {
        return {
          ...p,
          stockCurrent: p.stockMax,
          stockPercent: 100,
          status: 'Reabastecido',
          statusClass: 'bg-[#00a572]/20 text-[#4edea3]',
          isCritical: false,
        };
      }
      return p;
    }));
    alert('Ordem de reabastecimento imediato disparada para a logística do Almoxarifado!');
  };

  return (
    <div className="flex flex-col w-full pb-16">
      
      {/* Header Section */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pt-4 pb-6">
        <div className="flex flex-col gap-1.5">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-[#958ea0] font-label-sm text-[11px] uppercase tracking-wider">
            <span onClick={() => onNavigateToTab('overview')} className="hover:text-[#e3e1e9] cursor-pointer transition-colors">
              Eventos
            </span>
            <span className="material-symbols-outlined text-[14px] text-[#958ea0]">chevron_right</span>
            <span className="text-[#e3e1e9]">{event.name}</span>
            <span className="material-symbols-outlined text-[14px] text-[#958ea0]">chevron_right</span>
            <span className="text-[#d0bcff] font-bold">Operação de Bar & Estoque</span>
          </nav>
          
          <h1 className="font-headline-xl text-[28px] text-[#e3e1e9] font-bold tracking-tight mt-1">
            Gestão de Bar, PDVs e Controle de Estoque
          </h1>
          
          <div className="flex items-center gap-3 mt-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e1f25] border border-[#494454]/20 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse"></span>
              <span className="font-label-md text-[11px] text-[#4edea3] font-bold">25 Terminais PDV Online</span>
              <span className="text-[#958ea0]">•</span>
              <span className="font-label-sm text-[11px] text-[#cbc3d7] flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-[#4cd7f6]">contactless</span> Cashless NFC Integrado
              </span>
            </div>
            <span className="font-label-sm text-[11px] text-[#958ea0] hidden sm:inline">Última sincronização há 12s</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            onClick={() => alert('Sangria e fechamento de caixa auditados sem divergências de saldo.')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e1f25] hover:bg-[#292a2f] text-[#e3e1e9] transition-all font-label-md text-[12px] font-semibold border border-[#494454]/20 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px] text-[#958ea0]">point_of_sale</span>
            <span>Ajuste de Sangria/Caixa</span>
          </button>
          
          <SheetsExportButton
            filename={`Ficha_CMV_Bar_${event.id}`}
            title={`Ficha de CMV e Estoque do Bar - ${event.name}`}
            headers={['Item', 'Categoria', 'CMV Unitário', 'Preço Venda', 'Margem Bruta', 'Estoque Atual']}
            rows={products.map(p => [p.name, p.category, `R$ ${p.cmv.toFixed(2)}`, `R$ ${p.price.toFixed(2)}`, p.marginPercent, `${p.stockCurrent} un`])}
            label="Exportar Ficha de CMV"
          />

          <button 
            onClick={() => setShowAddProductModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#a078ff] text-[#121318] hover:bg-[#d0bcff] transition-all shadow-[0_0_24px_-4px_rgba(160,120,255,0.35)] active:scale-95 font-bold text-[12px]"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>+ Novo Produto / Combo</span>
          </button>
        </div>
      </header>

      {/* Critical Alert Banner */}
      {showAlert && (
        <section className="relative overflow-hidden rounded-2xl bg-[#1e1f25] border border-[#93000a]/40 p-4 shadow-md mb-6">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#ffb4ab]"></div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pl-3">
            <div className="flex items-start md:items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#93000a]/30 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#ffb4ab] text-[20px]">warning</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-md text-[11px] text-[#ffb4ab] font-bold tracking-wide uppercase">
                  Alerta Crítico de Ruptura de Estoque
                </span>
                <p className="font-body-md text-[12.5px] text-[#e3e1e9] mt-0.5 leading-snug">
                  <strong>Red Bull 250ml</strong> está abaixo de 20% da demanda projetada para o horário de pico (23h - 02h).
                  <span className="text-[#cbc3d7] ml-1">Transferência emergencial recomendada para o Bar Principal.</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              <button 
                onClick={() => setShowAlert(false)}
                className="px-3.5 py-1.5 rounded-xl bg-[#292a2f] hover:bg-[#34343a] text-[#cbc3d7] font-label-md text-[11px] font-semibold transition-colors"
              >
                Dispensar
              </button>
              <button 
                onClick={() => handleRestock('p-3')}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#ffb4ab] text-[#690005] font-label-md text-[11px] hover:opacity-90 transition-all shadow-md active:scale-95 font-bold"
              >
                <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                Pedir Reposição
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Top KPI Metric Cards (4 Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        
        {/* KPI 1 */}
        <div className="rounded-2xl bg-[#1e1f25] border border-[#494454]/20 p-5 shadow-md flex flex-col justify-between hover:bg-[#292a2f] transition-all">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-[11px] text-[#958ea0] uppercase tracking-wider font-bold">
              Faturamento Total do Bar
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#a078ff]/15 flex items-center justify-center text-[#d0bcff]">
              <span className="material-symbols-outlined text-[18px]">payments</span>
            </div>
          </div>
          <div className="mt-3 flex flex-col">
            <span className="font-kpi-number text-[26px] text-[#e3e1e9] font-bold tracking-tight">
              R$ {barFaturamento.toLocaleString('pt-BR')}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 font-label-sm text-[10px] px-2 py-0.5 rounded-full bg-[#00a572]/20 text-[#4edea3] font-bold">
                <span className="material-symbols-outlined text-[13px]">trending_up</span> 82,1%
              </span>
              <span className="font-body-sm text-[11px] text-[#958ea0]">Meta: R$ 130.000</span>
            </div>
          </div>
          <div className="w-full bg-[#0d0e13] h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-[#a078ff] h-full rounded-full transition-all" style={{ width: '82.1%' }}></div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="rounded-2xl bg-[#1e1f25] border border-[#494454]/20 p-5 shadow-md flex flex-col justify-between hover:bg-[#292a2f] transition-all">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-[11px] text-[#958ea0] uppercase tracking-wider font-bold">
              Lucro Bruto do Bar
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#00a572]/15 flex items-center justify-center text-[#4edea3]">
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            </div>
          </div>
          <div className="mt-3 flex flex-col">
            <span className="font-kpi-number text-[26px] text-[#e3e1e9] font-bold tracking-tight">
              R$ {barLucro.toLocaleString('pt-BR')}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 font-label-sm text-[10px] px-2 py-0.5 rounded-full bg-[#00a572]/20 text-[#4edea3] font-bold">
                <span className="material-symbols-outlined text-[13px]">percent</span> {marginPercent}%
              </span>
              <span className="font-body-sm text-[11px] text-[#958ea0]">Margem Bruta Média</span>
            </div>
          </div>
          <div className="mt-3 h-5 w-full flex items-end">
            <svg className="w-full h-4 text-[#4edea3]" preserveAspectRatio="none" viewBox="0 0 100 20">
              <path d="M0,18 Q15,12 30,15 T60,8 T85,4 T100,2" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5"></path>
            </svg>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="rounded-2xl bg-[#1e1f25] border border-[#494454]/20 p-5 shadow-md flex flex-col justify-between hover:bg-[#292a2f] transition-all">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-[11px] text-[#958ea0] uppercase tracking-wider font-bold">
              Custo de Mercadorias (CMV)
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#03b5d3]/15 flex items-center justify-center text-[#4cd7f6]">
              <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            </div>
          </div>
          <div className="mt-3 flex flex-col">
            <span className="font-kpi-number text-[26px] text-[#e3e1e9] font-bold tracking-tight">
              R$ {barCmv.toLocaleString('pt-BR')}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 font-label-sm text-[10px] px-2 py-0.5 rounded-full bg-[#292a2f] text-[#4cd7f6] font-bold">
                29,5%
              </span>
              <span className="font-body-sm text-[11px] text-[#958ea0]">da receita (Ideal &lt; 32%)</span>
            </div>
          </div>
          <div className="w-full bg-[#0d0e13] h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-[#4cd7f6] h-full rounded-full transition-all" style={{ width: '29.5%' }}></div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="rounded-2xl bg-[#1e1f25] border border-[#494454]/20 p-5 shadow-md flex flex-col justify-between hover:bg-[#292a2f] transition-all">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-[11px] text-[#958ea0] uppercase tracking-wider font-bold">
              Volume & Transações
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#292a2f] flex items-center justify-center text-[#e3e1e9]">
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            </div>
          </div>
          <div className="mt-3 flex flex-col">
            <span className="font-kpi-number text-[26px] text-[#e3e1e9] font-bold tracking-tight">
              6.840 <span className="text-[13px] text-[#958ea0] font-normal">itens</span>
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-label-sm text-[10px] px-2 py-0.5 rounded-full bg-[#292a2f] text-[#cbc3d7]">
                4.310 transações
              </span>
              <span className="font-body-sm text-[11px] text-[#958ea0]">Ticket: R$ 24,78</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between font-label-sm text-[10px] text-[#958ea0]">
            <span>Tempo Médio PDV: <strong>14s</strong></span>
            <span className="text-[#4edea3] font-bold">Fluxo Livre</span>
          </div>
        </div>

      </section>

      {/* Operational Showcase Atmosphere Banner */}
      <div className="rounded-2xl bg-[#1e1f25] border border-[#494454]/20 p-5 flex flex-col lg:flex-row items-center justify-between gap-5 overflow-hidden relative shadow-md mb-6">
        <div className="flex items-center gap-4 z-10">
          <img 
            className="w-20 h-20 rounded-xl object-cover shrink-0 shadow-lg border border-[#494454]/30" 
            alt="VIP bar lounge"
            src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80"
          />
          <div className="flex flex-col">
            <span className="font-label-sm text-[10px] text-[#d0bcff] uppercase font-bold tracking-wider">
              Centro de Abastecimento Central
            </span>
            <h2 className="font-headline-sm text-[17px] text-[#e3e1e9] font-bold">
              {event.name} · Bar Ops Hub
            </h2>
            <p className="font-body-sm text-[12px] text-[#cbc3d7] max-w-xl mt-0.5">
              4 bares fixos, 8 estações expressas na pista e 12 promotores mochileiros sincronizados via terminal cashless NFC. Reabastecimento automático em 25% de estoque remanescente.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 z-10 w-full lg:w-auto justify-end">
          <div className="p-2.5 rounded-xl bg-[#1a1b20] border border-[#494454]/20 text-center min-w-[95px]">
            <span className="font-label-sm text-[10px] text-[#958ea0] block">Geladeiras</span>
            <span className="font-title-md text-[15px] text-[#4edea3] font-bold">2.4 °C</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#1a1b20] border border-[#494454]/20 text-center min-w-[95px]">
            <span className="font-label-sm text-[10px] text-[#958ea0] block">Latas Gelando</span>
            <span className="font-title-md text-[15px] text-[#4cd7f6] font-bold">4.200 un</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#1a1b20] border border-[#494454]/20 text-center min-w-[95px]">
            <span className="font-label-sm text-[10px] text-[#958ea0] block">Perda/Quebra</span>
            <span className="font-title-md text-[15px] text-[#e3e1e9] font-bold">0,28%</span>
          </div>
        </div>
      </div>

      {/* Products & Margin Table Catalog Section */}
      <section className="flex flex-col gap-4 rounded-2xl bg-[#1e1f25] border border-[#494454]/20 p-5 shadow-md mb-6">
        
        {/* Table Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-col">
            <h2 className="font-headline-md text-[18px] text-[#e3e1e9] font-bold tracking-tight">
              Catálogo de Produtos e Ficha de Margem
            </h2>
            <span className="font-body-sm text-[12px] text-[#cbc3d7]">
              Visão consolidada em tempo real de CMV, giro e disponibilidade física nos balcões
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center p-1 rounded-xl bg-[#1a1b20] border border-[#494454]/20 text-xs">
              <button 
                onClick={() => setSelectedCategory('todos')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  selectedCategory === 'todos' 
                    ? 'bg-[#a078ff] text-[#121318]' 
                    : 'text-[#cbc3d7] hover:text-[#e3e1e9]'
                }`}
              >
                Todos ({products.length})
              </button>
              <button 
                onClick={() => setSelectedCategory('cervejas')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  selectedCategory === 'cervejas' 
                    ? 'bg-[#a078ff] text-[#121318]' 
                    : 'text-[#cbc3d7] hover:text-[#e3e1e9]'
                }`}
              >
                Cervejas
              </button>
              <button 
                onClick={() => setSelectedCategory('destilados')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  selectedCategory === 'destilados' 
                    ? 'bg-[#a078ff] text-[#121318]' 
                    : 'text-[#cbc3d7] hover:text-[#e3e1e9]'
                }`}
              >
                Destilados
              </button>
              <button 
                onClick={() => setSelectedCategory('combos')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  selectedCategory === 'combos' 
                    ? 'bg-[#a078ff] text-[#121318]' 
                    : 'text-[#cbc3d7] hover:text-[#e3e1e9]'
                }`}
              >
                Combos VIP
              </button>
            </div>

            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#958ea0] text-[18px]">search</span>
              <input
                type="text"
                value={searchItem}
                onChange={(e) => setSearchItem(e.target.value)}
                placeholder="Filtrar item..."
                className="h-9 pl-9 pr-3 rounded-xl bg-[#1a1b20] text-[#e3e1e9] placeholder:text-[#958ea0] text-xs border border-[#494454]/20 focus:outline-none focus:border-[#a078ff] w-36 sm:w-48"
              />
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto rounded-xl bg-[#1a1b20] border border-[#494454]/15">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-[#292a2f]/60 text-[#958ea0] font-label-md text-[11px] uppercase tracking-wider">
                <th className="py-3 px-3.5 rounded-l-xl">Produto / Descrição</th>
                <th className="py-3 px-3">Categoria</th>
                <th className="py-3 px-3 text-right">Custo (CMV)</th>
                <th className="py-3 px-3 text-right">Preço Venda</th>
                <th className="py-3 px-3 text-right">Margem Bruta</th>
                <th className="py-3 px-3 text-center">Estoque Atual</th>
                <th className="py-3 px-3 w-36">Nível Estoque</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right rounded-r-xl">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#494454]/10 text-[#e3e1e9] font-body-sm text-[12px]">
              {filteredProducts.map((prod) => (
                <tr key={prod.id} className="hover:bg-[#292a2f]/40 transition-colors">
                  <td className="py-3.5 px-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#292a2f] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[#d0bcff] text-[18px]">{prod.icon}</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-[#e3e1e9] truncate">{prod.name}</span>
                        <span className="text-[11px] text-[#958ea0]">{prod.desc}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full font-label-sm text-[10px] font-semibold ${prod.catBadge}`}>
                      {prod.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right text-[#cbc3d7] font-mono">
                    R$ {prod.cmv.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-bold text-[#e3e1e9] font-mono">
                    R$ {prod.price.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <div className="inline-flex flex-col items-end">
                      <span className="font-bold text-[#4edea3]">{prod.marginPercent}</span>
                      <span className="text-[10px] text-[#4edea3]/70">{prod.marginVal}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono">
                    <span className={`font-bold ${prod.isCritical ? 'text-[#ffb4ab]' : 'text-[#e3e1e9]'}`}>
                      {prod.stockCurrent}
                    </span>
                    <span className="text-[11px] text-[#958ea0]"> / {prod.stockMax} un</span>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex justify-between text-[10px] text-[#958ea0]">
                        <span>{prod.stockPercent}%</span>
                        <span>{prod.isCritical ? 'Crítico' : 'Regular'}</span>
                      </div>
                      <div className="w-full bg-[#0d0e13] h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${prod.isCritical ? 'bg-[#ffb4ab]' : 'bg-[#4edea3]'}`}
                          style={{ width: `${prod.stockPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full font-label-sm text-[10px] font-bold ${prod.statusClass}`}>
                      {prod.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    {prod.isCritical ? (
                      <button
                        onClick={() => handleRestock(prod.id)}
                        className="px-2.5 py-1 rounded-lg bg-[#ffb4ab] text-[#690005] font-label-sm text-[10px] font-bold hover:opacity-90"
                      >
                        Repor
                      </button>
                    ) : (
                      <button
                        onClick={() => alert(`Histórico de movimentações de ${prod.name} consultado.`)}
                        className="p-1 rounded-lg text-[#958ea0] hover:text-[#e3e1e9] hover:bg-[#292a2f]"
                      >
                        <span className="material-symbols-outlined text-[18px]">more_vert</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-[#958ea0] font-body-sm text-[11px] pt-1">
          <span>Exibindo {filteredProducts.length} de {products.length} SKUs ativos</span>
          <div className="flex items-center gap-3">
            <span>Margem Ponderada Atual: <strong className="text-[#4edea3]">72,4%</strong></span>
          </div>
        </div>
      </section>

      {/* Bottom Operational Grid (2 Columns: Performance by Counter & Hourly Sales Flow) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left (6 cols): Desempenho por Balcão */}
        <div className="lg:col-span-6 rounded-2xl bg-[#1e1f25] border border-[#494454]/20 p-5 shadow-md flex flex-col justify-between">
          <div className="flex flex-col">
            <div className="flex items-center justify-between pb-1 border-b border-[#494454]/15">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#a078ff] text-[20px]">storefront</span>
                <h2 className="font-headline-sm text-[16px] text-[#e3e1e9] font-bold">Desempenho por Balcão de Atendimento</h2>
              </div>
              <span className="font-label-sm text-[10px] px-2 py-0.5 rounded-full bg-[#292a2f] text-[#4cd7f6] font-bold">
                Tempo Real
              </span>
            </div>
            <span className="font-body-sm text-[12px] text-[#cbc3d7] mt-1">
              Participação de faturamento e produtividade dos pontos físicos instalados
            </span>

            <div className="flex flex-col gap-3 mt-4">
              {/* Balcão 1 */}
              <div className="p-3 rounded-xl bg-[#1a1b20] border border-[#494454]/15 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#a078ff]"></div>
                    <span className="font-bold text-[#e3e1e9] text-[13px]">Bar Principal Arena</span>
                    <span className="text-[10px] text-[#958ea0]">14 PDVs Fixos</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#e3e1e9] text-[13px]">R$ 66.234</span>
                    <span className="text-[10px] text-[#d0bcff] font-bold ml-1">(62%)</span>
                  </div>
                </div>
                <div className="w-full bg-[#0d0e13] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#a078ff] h-full rounded-full" style={{ width: '62%' }}></div>
                </div>
                <div className="flex items-center justify-between text-[#958ea0] text-[10px]">
                  <span>4.238 un • Ticket Médio R$ 22,40</span>
                  <span className="text-[#4edea3] font-bold">Fila: 2,1 min</span>
                </div>
              </div>

              {/* Balcão 2 */}
              <div className="p-3 rounded-xl bg-[#1a1b20] border border-[#494454]/15 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#4cd7f6]"></div>
                    <span className="font-bold text-[#e3e1e9] text-[13px]">Bar VIP & Camarote</span>
                    <span className="text-[10px] text-[#958ea0]">6 PDVs Premium</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#e3e1e9] text-[13px]">R$ 29.912</span>
                    <span className="text-[10px] text-[#4cd7f6] font-bold ml-1">(28%)</span>
                  </div>
                </div>
                <div className="w-full bg-[#0d0e13] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#4cd7f6] h-full rounded-full" style={{ width: '28%' }}></div>
                </div>
                <div className="flex items-center justify-between text-[#958ea0] text-[10px]">
                  <span>1.840 un • Ticket Médio R$ 58,10 (Combos)</span>
                  <span className="text-[#4edea3] font-bold">Fila: 45 seg</span>
                </div>
              </div>

              {/* Balcão 3 */}
              <div className="p-3 rounded-xl bg-[#1a1b20] border border-[#494454]/15 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#4edea3]"></div>
                    <span className="font-bold text-[#e3e1e9] text-[13px]">Bares Volantes (Mochileiros)</span>
                    <span className="text-[10px] text-[#958ea0]">5 Terminais Móveis</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#e3e1e9] text-[13px]">R$ 10.684</span>
                    <span className="text-[10px] text-[#4edea3] font-bold ml-1">(10%)</span>
                  </div>
                </div>
                <div className="w-full bg-[#0d0e13] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#4edea3] h-full rounded-full" style={{ width: '10%' }}></div>
                </div>
                <div className="flex items-center justify-between text-[#958ea0] text-[10px]">
                  <span>762 un • Cerveja & Água</span>
                  <span className="text-[#4edea3] font-bold">Sem Fila</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#494454]/15 flex items-center justify-between text-[#cbc3d7] font-body-sm text-[11px]">
            <span>Capacidade instalada: <strong>1.400 drinks/hora</strong></span>
            <span className="text-[#d0bcff] font-bold">Terminais Calibrados</span>
          </div>
        </div>

        {/* Right (6 cols): Fluxo de Vendas por Hora no Bar */}
        <div className="lg:col-span-6 rounded-2xl bg-[#1e1f25] border border-[#494454]/20 p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-1 border-b border-[#494454]/15">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">schedule</span>
                <h2 className="font-headline-sm text-[16px] text-[#e3e1e9] font-bold">Fluxo de Vendas por Hora no Bar</h2>
              </div>
              <div className="flex items-center gap-1.5 font-label-sm text-[10px] text-[#ffb4ab]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab] animate-ping"></span>
                <span className="font-bold">Pico (23h - 02h)</span>
              </div>
            </div>
            <span className="font-body-sm text-[12px] text-[#cbc3d7] mt-1">
              Receita por janela de 60 minutos e concentração de consumo no set principal
            </span>

            {/* Hourly Bars */}
            <div className="mt-4 flex flex-col gap-3">
              <div className="h-36 w-full flex items-end justify-between gap-1.5 pt-4 pb-2 px-1">
                {[
                  { hour: '18h', val: 'R$4k', h: '12%', color: 'bg-[#34343a]' },
                  { hour: '19h', val: 'R$7k', h: '20%', color: 'bg-[#34343a]' },
                  { hour: '20h', val: 'R$11k', h: '32%', color: 'bg-[#34343a]' },
                  { hour: '21h', val: 'R$15k', h: '44%', color: 'bg-[#34343a]' },
                  { hour: '22h', val: 'R$19k', h: '55%', color: 'bg-[#34343a]' },
                  { hour: '23h', val: 'R$26k', h: '82%', color: 'bg-[#d0bcff]', peak: true },
                  { hour: '00h', val: 'R$31k', h: '98%', color: 'bg-[#a078ff]', max: true },
                  { hour: '01h', val: 'R$24k', h: '76%', color: 'bg-[#d0bcff]', peak: true },
                  { hour: '02h', val: 'R$18k', h: '52%', color: 'bg-[#4cd7f6]' },
                  { hour: '03h', val: 'R$8k', h: '25%', color: 'bg-[#34343a]' },
                ].map((bar, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                    <span className="text-[9px] text-[#958ea0] opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                      {bar.val}
                    </span>
                    <div 
                      className={`w-full rounded-t-md transition-all ${bar.color}`}
                      style={{ height: bar.h }}
                    ></div>
                    <span className={`text-[10px] font-mono ${bar.max ? 'text-[#d0bcff] font-bold' : 'text-[#958ea0]'}`}>
                      {bar.hour}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-2.5 rounded-xl bg-[#1a1b20] border border-[#494454]/15 flex items-center justify-between text-[#cbc3d7] font-label-sm text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">insights</span>
                  <span>Projeção de encerramento da madrugada: <strong>R$ 138.400 (+6,4%)</strong></span>
                </div>
                <span className="text-[#4edea3] font-bold">Abastecimento Seguro</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#494454]/15 flex items-center justify-between text-[#cbc3d7] font-body-sm text-[11px]">
            <span>*Janelas após 02:30 calculadas com inteligência preditiva</span>
            <span className="text-[#4cd7f6] font-bold">Almoxarifado Integrado</span>
          </div>
        </div>

      </section>

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="w-full max-w-md bg-[#1e1f25] border border-[#494454]/40 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#494454]/20">
              <h3 className="font-headline-sm text-lg text-[#e3e1e9] font-bold">Cadastrar Novo Produto de Bar</h3>
              <button onClick={() => setShowAddProductModal(false)} className="text-[#958ea0] hover:text-[#e3e1e9]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddProduct} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-[#cbc3d7] font-semibold block mb-1">Nome do Item / Combo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Combo Whisky 12 Anos + 5 Energéticos"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#1a1b20] text-[#e3e1e9] border border-[#494454]/30 focus:outline-none focus:border-[#a078ff] text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#cbc3d7] font-semibold block mb-1">Categoria</label>
                <select
                  value={newProductCategory}
                  onChange={(e) => setNewProductCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#1a1b20] text-[#e3e1e9] border border-[#494454]/30 focus:outline-none focus:border-[#a078ff] text-sm"
                >
                  <option value="Combos VIP">Combos VIP</option>
                  <option value="Cervejas & Chopes">Cervejas & Chopes</option>
                  <option value="Destilados & Doses">Destilados & Doses</option>
                  <option value="Não Alcoólicos">Não Alcoólicos</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-[#cbc3d7] font-semibold block mb-1">Custo (CMV)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newProductCmv}
                    onChange={(e) => setNewProductCmv(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#1a1b20] text-[#e3e1e9] border border-[#494454]/30 focus:outline-none focus:border-[#a078ff] text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#cbc3d7] font-semibold block mb-1">Preço Venda</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#1a1b20] text-[#e3e1e9] border border-[#494454]/30 focus:outline-none focus:border-[#a078ff] text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#cbc3d7] font-semibold block mb-1">Estoque Inicial</label>
                  <input
                    type="number"
                    required
                    value={newProductStock}
                    onChange={(e) => setNewProductStock(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#1a1b20] text-[#e3e1e9] border border-[#494454]/30 focus:outline-none focus:border-[#a078ff] text-sm"
                  />
                </div>
              </div>
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#494454]/20">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#292a2f] text-[#cbc3d7] hover:text-[#e3e1e9] text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#a078ff] text-[#121318] hover:bg-[#d0bcff] text-xs font-bold"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
