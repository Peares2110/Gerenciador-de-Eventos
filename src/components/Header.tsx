import React, { useState, useRef, useEffect } from 'react';
import { 
  BarChart3, 
  Clock, 
  Bot, 
  Radio, 
  Sparkles, 
  Palette, 
  CalendarDays, 
  Sliders, 
  ChevronDown, 
  Plus, 
  Check, 
  ShieldCheck, 
  Wrench, 
  ArrowRight,
  Bookmark,
  FileSpreadsheet,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Send,
  MessageSquare
} from 'lucide-react';
import { EventData } from '../types';

interface HeaderProps {
  events: EventData[];
  currentEvent: EventData | null;
  onSelectEvent: (eventId: string) => void;
  onOpenNewEventModal: () => void;
  onResetEvents?: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  events,
  currentEvent,
  onSelectEvent,
  onOpenNewEventModal,
  onResetEvents,
  activeTab,
  onTabChange,
}) => {
  const [openDropdown, setOpenDropdown] = useState<'auditar' | 'editar' | 'financeiro' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenDropdown(null);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const percentSold = currentEvent && currentEvent.capacity > 0 
    ? Math.round((currentEvent.soldTickets / currentEvent.capacity) * 100) 
    : 0;

  // Category mapping
  const auditTabs = ['dashboard', 'campaign_hourly', 'gandaya_hub', 'crm_broadcast', 'master_chat', 'ad_library', 'google_calendar', 'integrations'];
  const editCreateTabs = ['planning', 'campaign_gen', 'art_director'];
  const editModifyTabs = ['edit_campaigns', 'calendar'];
  const editAllTabs = [...editCreateTabs, ...editModifyTabs];
  const financeTabs = ['costs', 'revenues', 'consolidated'];

  const isAuditActive = auditTabs.includes(activeTab);
  const isEditActive = editAllTabs.includes(activeTab);
  const isFinanceActive = financeTabs.includes(activeTab);

  // Active breadcrumb label
  const getActiveBreadcrumb = () => {
    switch (activeTab) {
      case 'dashboard':
        return { category: 'Auditar', subcategory: null, item: 'Visão Geral & Métricas' };
      case 'campaign_hourly':
        return { category: 'Auditar', subcategory: null, item: 'Auditoria Horária 24h' };
      case 'gandaya_hub':
        return { category: 'Auditar', subcategory: null, item: 'Gandaya Data Hub' };
      case 'crm_broadcast':
        return { category: 'Auditar', subcategory: null, item: 'CRM & Disparos Táticos' };
      case 'master_chat':
        return { category: 'Auditar', subcategory: null, item: 'Agente Principal' };
      case 'ad_library':
        return { category: 'Auditar', subcategory: null, item: 'Biblioteca de Anúncios' };
      case 'google_calendar':
        return { category: 'Auditar', subcategory: null, item: 'Google Calendar & Agenda IA' };
      case 'integrations':
        return { category: 'Auditar', subcategory: null, item: 'Integrações & APIs' };
      case 'costs':
        return { category: 'Financeiro', subcategory: 'Google Sheets', item: 'Aba de Custos & Despesas' };
      case 'revenues':
        return { category: 'Financeiro', subcategory: 'Google Sheets', item: 'Aba de Receitas & Faturamento' };
      case 'consolidated':
        return { category: 'Financeiro', subcategory: 'Google Sheets', item: 'DRE & Resultado Consolidado' };
      case 'planning':
        return { category: 'Editar', subcategory: 'Criar', item: 'Planejamento de Grade' };
      case 'campaign_gen':
        return { category: 'Editar', subcategory: 'Criar', item: 'Gerador de Anúncios' };
      case 'art_director':
        return { category: 'Editar', subcategory: 'Criar', item: 'Direção de Arte' };
      case 'edit_campaigns':
        return { category: 'Editar', subcategory: 'Editar', item: 'Modificar Campanhas' };
      case 'calendar':
        return { category: 'Editar', subcategory: 'Editar', item: 'Calendário de Posts' };
      default:
        return { category: 'Auditar', subcategory: null, item: 'Visão Geral' };
    }
  };

  const breadcrumb = getActiveBreadcrumb();

  const handleSelectTab = (tabId: string) => {
    onTabChange(tabId);
    setOpenDropdown(null);
  };

  return (
    <header className="border-b border-white/[0.08] bg-[#0c0c0e] sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Bar: Brand, Event Context & Global Actions */}
        <div className="py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-white/[0.06]">
          
          {/* Brand & Event Switcher */}
          <div className="flex items-center gap-3.5 flex-wrap">
            <div className="flex items-center gap-2.5">
              <h1 className="font-display font-extrabold text-xl tracking-tight text-[#f8f8f8]">
                INSOMNIA
              </h1>
              <span className="badge-tech">
                EVENT SUITE v2.0
              </span>
            </div>

            {events.length > 0 && currentEvent && (
              <div className="relative group">
                <div className="flex items-center">
                  <select
                    value={currentEvent.id}
                    onChange={(e) => onSelectEvent(e.target.value)}
                    className="appearance-none bg-[#1c1c21] hover:bg-[#24242b] border border-white/[0.1] text-[#f8f8f8] text-xs font-mono font-medium rounded-[2px] pl-3 pr-8 py-1.5 cursor-pointer focus:outline-none focus:border-[#8b5cf6] transition-colors max-w-[260px] truncate"
                  >
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id} className="bg-[#141417] text-[#f8f8f8]">
                        {ev.name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
                </div>
              </div>
            )}
          </div>

          {/* Event Metadata & Top Actions */}
          <div className="flex items-center gap-4 text-xs flex-wrap">
            {currentEvent && (
              <div className="label-tech flex items-center gap-2">
                <span>{(currentEvent.venue || currentEvent.city || 'ORLA DOS CAVALEIROS').toUpperCase()}</span>
                <span className="text-white/20">/</span>
                <span>{currentEvent.soldTickets.toLocaleString('pt-BR')} INGRESSOS ({percentSold}%)</span>
                <span className="text-white/20">/</span>
                <span style={{ color: 'var(--accent)' }} className="font-bold">{(currentEvent.currentLote || 'LOTE 1').toUpperCase()}</span>
              </div>
            )}

            <div className="flex items-center gap-2 ml-auto md:ml-0">
              {onResetEvents && events.length > 0 && (
                <button
                  onClick={onResetEvents}
                  className="font-mono text-[11px] uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 cursor-pointer"
                  title="Reiniciar para o evento padrão INSONIA"
                >
                  Restaurar Padrão
                </button>
              )}

              <button
                onClick={onOpenNewEventModal}
                className="btn-v2 btn-v2-primary"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ NOVO EVENTO</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2 CATEGORIES NAVIGATION: AUDITAR & EDITAR */}
        {currentEvent && (
          <div ref={dropdownRef} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            {/* The 2 Main Category Dropdown Triggers */}
            <div className="flex items-center gap-2.5">
              
              {/* 1. CATEGORIA: AUDITAR */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'auditar' ? null : 'auditar')}
                  className={`btn-v2 transition-all cursor-pointer ${
                    isAuditActive
                      ? 'btn-v2-primary'
                      : 'btn-v2-outline'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>AUDITAR CRIATIVOS</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === 'auditar' ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu: Auditar */}
                {openDropdown === 'auditar' && (
                  <div className="absolute left-0 mt-2 w-80 bg-[#141417] border border-white/[0.1] rounded-[4px] p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3 py-1.5 border-b border-white/[0.08] mb-1">
                      <span className="label-tech text-[#8b5cf6]">
                        AUDITORIA, MÉTRICAS & DIAGNÓSTICO
                      </span>
                    </div>

                    <div className="space-y-1">
                      <button
                        onClick={() => handleSelectTab('dashboard')}
                        className={`w-full text-left p-2.5 rounded-[2px] transition-all flex items-start gap-3 cursor-pointer ${
                          activeTab === 'dashboard'
                            ? 'bg-[#8b5cf6]/20 text-white border border-[#8b5cf6]/40'
                            : 'hover:bg-[#1c1c21] text-slate-300'
                        }`}
                      >
                        <div className="p-2 rounded-[2px] bg-[#1c1c21] text-[#8b5cf6] border border-white/[0.08] shrink-0">
                          <BarChart3 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">Visão Geral & Métricas</span>
                            {activeTab === 'dashboard' && <Check className="w-3 h-3 text-[#8b5cf6]" />}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                            Metas de bilheteria, faturamento e gráficos de desempenho.
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => handleSelectTab('campaign_hourly')}
                        className={`w-full text-left p-2.5 rounded-[2px] transition-all flex items-start gap-3 cursor-pointer ${
                          activeTab === 'campaign_hourly'
                            ? 'bg-[#8b5cf6]/20 text-white border border-[#8b5cf6]/40'
                            : 'hover:bg-[#1c1c21] text-slate-300'
                        }`}
                      >
                        <div className="p-2 rounded-[2px] bg-[#1c1c21] text-[#8b5cf6] border border-white/[0.08] shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">Auditoria Horária (24h)</span>
                            {activeTab === 'campaign_hourly' && <Check className="w-3 h-3 text-[#8b5cf6]" />}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                            Auditoria determinística, alertas de CPA e fadiga hora a hora.
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => handleSelectTab('gandaya_hub')}
                        className={`w-full text-left p-2.5 rounded-[2px] transition-all flex items-start gap-3 cursor-pointer ${
                          activeTab === 'gandaya_hub'
                            ? 'bg-emerald-500/20 text-white border border-emerald-500/40'
                            : 'hover:bg-[#1c1c21] text-slate-300'
                        }`}
                      >
                        <div className="p-2 rounded-[2px] bg-[#1c1c21] text-emerald-400 border border-white/[0.08] shrink-0">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">Gandaya Data Hub</span>
                            {activeTab === 'gandaya_hub' && <Check className="w-3 h-3 text-emerald-400" />}
                            <span className="badge-tech text-emerald-300 border-emerald-500/40 bg-emerald-500/10">
                              Bilheteria Real
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                            Importar planilha .xlsx/.xls: lotes, carrinhos abandonados e promoters.
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => handleSelectTab('crm_broadcast')}
                        className={`w-full text-left p-2.5 rounded-[2px] transition-all flex items-start gap-3 cursor-pointer ${
                          activeTab === 'crm_broadcast'
                            ? 'bg-purple-500/20 text-white border border-purple-500/40'
                            : 'hover:bg-[#1c1c21] text-slate-300'
                        }`}
                      >
                        <div className="p-2 rounded-[2px] bg-[#1c1c21] text-purple-400 border border-white/[0.08] shrink-0">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">CRM & Disparos Táticos</span>
                            {activeTab === 'crm_broadcast' && <Check className="w-3 h-3 text-purple-400" />}
                            <span className="badge-tech text-amber-300 border-amber-500/30">
                              WhatsApp & Leads
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                            Automação de virada de lote, e-mail e recuperação ativa de carrinhos.
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => handleSelectTab('master_chat')}
                        className={`w-full text-left p-2.5 rounded-[2px] transition-all flex items-start gap-3 cursor-pointer ${
                          activeTab === 'master_chat'
                            ? 'bg-[#8b5cf6]/20 text-white border border-[#8b5cf6]/40'
                            : 'hover:bg-[#1c1c21] text-slate-300'
                        }`}
                      >
                        <div className="p-2 rounded-[2px] bg-[#1c1c21] text-[#8b5cf6] border border-white/[0.08] shrink-0">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">Agente Principal (INSOMNIA)</span>
                            {activeTab === 'master_chat' && <Check className="w-3 h-3 text-[#8b5cf6]" />}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                            Chat executivo de inteligência e diagnóstico do evento.
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => handleSelectTab('ad_library')}
                        className={`w-full text-left p-2.5 rounded-[2px] transition-all flex items-start gap-3 cursor-pointer ${
                          activeTab === 'ad_library'
                            ? 'bg-[#8b5cf6]/20 text-white border border-[#8b5cf6]/40'
                            : 'hover:bg-[#1c1c21] text-slate-300'
                        }`}
                      >
                        <div className="p-2 rounded-[2px] bg-[#1c1c21] text-[#8b5cf6] border border-white/[0.08] shrink-0">
                          <Bookmark className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">Biblioteca de Anúncios</span>
                            {activeTab === 'ad_library' && <Check className="w-3 h-3 text-[#8b5cf6]" />}
                            {currentEvent && (
                              <span className="badge-tech">
                                {currentEvent.adLibrary?.length || 0}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                            Acervo pessoal com todas as métricas para aprendizado dos agentes.
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => handleSelectTab('google_calendar')}
                        className={`w-full text-left p-2.5 rounded-[2px] transition-all flex items-start gap-3 cursor-pointer ${
                          activeTab === 'google_calendar'
                            ? 'bg-[#8b5cf6]/20 text-white border border-[#8b5cf6]/40'
                            : 'hover:bg-[#1c1c21] text-slate-300'
                        }`}
                      >
                        <div className="p-2 rounded-[2px] bg-[#1c1c21] text-[#8b5cf6] border border-white/[0.08] shrink-0">
                          <CalendarDays className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">Google Calendar & Agenda IA</span>
                            {activeTab === 'google_calendar' && <Check className="w-3 h-3 text-[#8b5cf6]" />}
                            <span className="badge-tech text-purple-300">
                              Workspace
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                            Consultar datas, sincronizar marcos do evento e organizar agenda.
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => handleSelectTab('integrations')}
                        className={`w-full text-left p-2.5 rounded-[2px] transition-all flex items-start gap-3 cursor-pointer ${
                          activeTab === 'integrations'
                            ? 'bg-[#8b5cf6]/20 text-white border border-[#8b5cf6]/40'
                            : 'hover:bg-[#1c1c21] text-slate-300'
                        }`}
                      >
                        <div className="p-2 rounded-[2px] bg-[#1c1c21] text-[#8b5cf6] border border-white/[0.08] shrink-0">
                          <Radio className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">Integrações & Contas</span>
                            {activeTab === 'integrations' && <Check className="w-3 h-3 text-[#8b5cf6]" />}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                            Status de conexão com Meta Ads, TikTok e Google Ads.
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. CATEGORIA: EDITAR */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'editar' ? null : 'editar')}
                  className={`btn-v2 transition-all cursor-pointer ${
                    isEditActive
                      ? 'btn-v2-primary'
                      : 'btn-v2-outline'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>EDITAR ESTRATÉGIA</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === 'editar' ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu: Editar */}
                {openDropdown === 'editar' && (
                  <div className="absolute left-0 mt-2 w-96 bg-[#141417] border border-white/[0.1] rounded-[4px] p-2.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    
                    {/* SUBCATEGORIA 1: CRIAR */}
                    <div className="space-y-1">
                      <div className="px-3 py-1 flex items-center justify-between border-b border-white/[0.08]">
                        <span className="label-tech text-[#8b5cf6]">
                          1. CRIAR · PLANEJAMENTO & GERAÇÃO
                        </span>
                        <span className="badge-tech">
                          Criação
                        </span>
                      </div>

                      <button
                        onClick={() => handleSelectTab('planning')}
                        className={`w-full text-left p-2.5 rounded-[2px] transition-all flex items-start gap-3 cursor-pointer ${
                          activeTab === 'planning'
                            ? 'bg-[#8b5cf6]/20 text-white border border-[#8b5cf6]/40'
                            : 'hover:bg-[#1c1c21] text-slate-300'
                        }`}
                      >
                        <div className="p-2 rounded-[2px] bg-[#1c1c21] text-[#8b5cf6] border border-white/[0.08] shrink-0">
                          <Radio className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">Planejamento de Grade & Presença</span>
                            {activeTab === 'planning' && <Check className="w-3 h-3 text-[#8b5cf6]" />}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                            Cronograma inteligente com picos de engajamento e público-alvo.
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => handleSelectTab('campaign_gen')}
                        className={`w-full text-left p-2.5 rounded-[2px] transition-all flex items-start gap-3 cursor-pointer ${
                          activeTab === 'campaign_gen'
                            ? 'bg-[#8b5cf6]/20 text-white border border-[#8b5cf6]/40'
                            : 'hover:bg-[#1c1c21] text-slate-300'
                        }`}
                      >
                        <div className="p-2 rounded-[2px] bg-[#1c1c21] text-[#8b5cf6] border border-white/[0.08] shrink-0">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">Gerador de Anúncios & Copies</span>
                            {activeTab === 'campaign_gen' && <Check className="w-3 h-3 text-[#8b5cf6]" />}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                            Geração de campanhas Meta Ads com hooks e veredito do crítico.
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => handleSelectTab('art_director')}
                        className={`w-full text-left p-2.5 rounded-[2px] transition-all flex items-start gap-3 cursor-pointer ${
                          activeTab === 'art_director'
                            ? 'bg-[#8b5cf6]/20 text-white border border-[#8b5cf6]/40'
                            : 'hover:bg-[#1c1c21] text-slate-300'
                        }`}
                      >
                        <div className="p-2 rounded-[2px] bg-[#1c1c21] text-[#8b5cf6] border border-white/[0.08] shrink-0">
                          <Palette className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">Diretor de Arte & Prompts</span>
                            {activeTab === 'art_director' && <Check className="w-3 h-3 text-[#8b5cf6]" />}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                            DNA visual da festa, paleta de cores e prompts cinematográficos.
                          </p>
                        </div>
                      </button>
                    </div>

                    {/* SUBCATEGORIA 2: EDITAR */}
                    <div className="space-y-1 pt-2.5 mt-2 border-t border-white/[0.08]">
                      <div className="px-3 py-1 flex items-center justify-between border-b border-white/[0.08]">
                        <span className="label-tech text-[#8b5cf6]">
                          2. EDITAR · MODIFICAR AÇÕES EXISTENTES
                        </span>
                        <span className="badge-tech">
                          Modificar
                        </span>
                      </div>

                      <button
                        onClick={() => handleSelectTab('edit_campaigns')}
                        className={`w-full text-left p-2.5 rounded-[2px] transition-all flex items-start gap-3 cursor-pointer ${
                          activeTab === 'edit_campaigns'
                            ? 'bg-[#8b5cf6]/20 text-white border border-[#8b5cf6]/40'
                            : 'hover:bg-[#1c1c21] text-slate-300'
                        }`}
                      >
                        <div className="p-2 rounded-[2px] bg-[#1c1c21] text-[#8b5cf6] border border-white/[0.08] shrink-0">
                          <Sliders className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">Modificar Campanhas Existentes</span>
                            {activeTab === 'edit_campaigns' && <Check className="w-3 h-3 text-[#8b5cf6]" />}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                            Ajustar orçamentos diários, pausar/ativar anúncios e editar hooks.
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => handleSelectTab('calendar')}
                        className={`w-full text-left p-2.5 rounded-[2px] transition-all flex items-start gap-3 cursor-pointer ${
                          activeTab === 'calendar'
                            ? 'bg-[#8b5cf6]/20 text-white border border-[#8b5cf6]/40'
                            : 'hover:bg-[#1c1c21] text-slate-300'
                        }`}
                      >
                        <div className="p-2 rounded-[2px] bg-[#1c1c21] text-[#8b5cf6] border border-white/[0.08] shrink-0">
                          <CalendarDays className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">Calendário Virtual de Publicações</span>
                            {activeTab === 'calendar' && <Check className="w-3 h-3 text-[#8b5cf6]" />}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                            Editar e reprogramar posts, stories e reels agendados.
                          </p>
                        </div>
                      </button>
                    </div>

                  </div>
                )}
              </div>

              {/* 3. CATEGORIA: FINANCEIRO (GOOGLE SHEETS DATABASE) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'financeiro' ? null : 'financeiro')}
                  className={`btn-v2 transition-all cursor-pointer ${
                    isFinanceActive
                      ? 'btn-v2-primary'
                      : 'btn-v2-outline'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>GESTÃO FINANCEIRA</span>
                  <span className="badge-tech text-emerald-300 border-emerald-500/40 bg-emerald-500/10">
                    Sheets DB
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === 'financeiro' ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu: Financeiro */}
                {openDropdown === 'financeiro' && (
                  <div className="absolute left-0 mt-2 w-88 bg-[#141417] border border-white/[0.1] rounded-[4px] p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3 py-1.5 border-b border-white/[0.08] mb-1 flex items-center justify-between">
                      <span className="label-tech text-emerald-400">
                        BANCO DE DADOS FINANCEIRO · GOOGLE SHEETS
                      </span>
                    </div>

                    <div className="space-y-1">
                      {/* Custos */}
                      <button
                        onClick={() => handleSelectTab('costs')}
                        className={`w-full text-left p-2.5 rounded-[2px] transition-all flex items-start gap-3 cursor-pointer ${
                          activeTab === 'costs'
                            ? 'bg-rose-500/20 text-white border border-rose-500/40'
                            : 'hover:bg-[#1c1c21] text-slate-300'
                        }`}
                      >
                        <div className="p-2 rounded-[2px] bg-[#1c1c21] text-rose-400 border border-white/[0.08] shrink-0">
                          <TrendingDown className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">Aba de Custos & Despesas</span>
                            {activeTab === 'costs' && <Check className="w-3 h-3 text-rose-400" />}
                            <span className="badge-tech text-rose-300 border-rose-500/30">
                              Despesas
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                            Orçamentos, contratos de cachê, estrutura, marketing e pagamentos.
                          </p>
                        </div>
                      </button>

                      {/* Receitas */}
                      <button
                        onClick={() => handleSelectTab('revenues')}
                        className={`w-full text-left p-2.5 rounded-[2px] transition-all flex items-start gap-3 cursor-pointer ${
                          activeTab === 'revenues'
                            ? 'bg-emerald-500/20 text-white border border-emerald-500/40'
                            : 'hover:bg-[#1c1c21] text-slate-300'
                        }`}
                      >
                        <div className="p-2 rounded-[2px] bg-[#1c1c21] text-emerald-400 border border-white/[0.08] shrink-0">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">Aba de Receitas & Faturamento</span>
                            {activeTab === 'revenues' && <Check className="w-3 h-3 text-emerald-400" />}
                            <span className="badge-tech text-emerald-300 border-emerald-500/30">
                              Entradas
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                            Bilheteria por lote, taxas de ticketeira, bar, camarotes e patrocínios.
                          </p>
                        </div>
                      </button>

                      {/* DRE Consolidado */}
                      <button
                        onClick={() => handleSelectTab('consolidated')}
                        className={`w-full text-left p-2.5 rounded-[2px] transition-all flex items-start gap-3 cursor-pointer ${
                          activeTab === 'consolidated'
                            ? 'bg-[#8b5cf6]/20 text-white border border-[#8b5cf6]/40'
                            : 'hover:bg-[#1c1c21] text-slate-300'
                        }`}
                      >
                        <div className="p-2 rounded-[2px] bg-[#1c1c21] text-[#8b5cf6] border border-white/[0.08] shrink-0">
                          <BarChart3 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">DRE & Resultado Consolidado</span>
                            {activeTab === 'consolidated' && <Check className="w-3 h-3 text-[#8b5cf6]" />}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                            Lucro líquido operacional, margem %, ponto de equilíbrio e ROI.
                          </p>
                        </div>
                      </button>

                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Active View Context Chip / Breadcrumb */}
            <div className="flex items-center gap-2 label-tech">
              <span className="text-[#8b5cf6] font-bold">
                {breadcrumb.category}
              </span>
              {breadcrumb.subcategory && (
                <>
                  <span className="text-white/20">/</span>
                  <span className="text-slate-300">
                    {breadcrumb.subcategory}
                  </span>
                </>
              )}
              <span className="text-white/20">/</span>
              <span className="text-white font-bold">
                {breadcrumb.item}
              </span>
            </div>

          </div>
        )}

      </div>
    </header>
  );
};
