import React, { useState } from 'react';
import { EventData } from '../../types';

interface StitchSidebarProps {
  events: EventData[];
  currentEvent: EventData | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSelectEvent: (eventId: string) => void;
  onOpenNewEventModal: () => void;
  onResetEvents?: () => void;
}

export const StitchSidebar: React.FC<StitchSidebarProps> = ({
  events,
  currentEvent,
  activeTab,
  onTabChange,
  onSelectEvent,
  onOpenNewEventModal,
  onResetEvents,
}) => {
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);

  const sold = currentEvent?.soldTickets || 0;
  const capacity = currentEvent?.capacity || 5000;
  const percentage = Math.min(100, Math.round((sold / capacity) * 100));

  const navItems = [
    { id: 'overview', label: 'Visão Geral', icon: 'dashboard' },
    { id: 'events_hub', label: 'Meus Eventos', icon: 'event' },
    { id: 'tickets', label: 'Vendas e Ingressos', icon: 'confirmation_number' },
    { id: 'bar', label: 'Bar e Produtos', icon: 'liquor' },
    { id: 'financial', label: 'Gestão Financeira & DRE', icon: 'payments' },
    { id: 'marketing', label: 'Marketing & Tráfego', icon: 'campaign' },
    { id: 'art_studio', label: 'Direção de Arte & Estúdio', icon: 'palette' },
    { id: 'calendar', label: 'Calendário & Agenda IA', icon: 'calendar_month' },
    { id: 'crm', label: 'CRM & Mensagens', icon: 'mark_chat_unread' },
    { id: 'master_ai', label: 'Agente Principal IA', icon: 'smart_toy' },
    { id: 'integrations', label: 'Integrações & APIs', icon: 'sync' },
  ];

  return (
    <aside className="fixed top-0 left-0 h-full w-72 bg-[#121318] z-50 flex flex-col justify-between overflow-y-auto border-r border-[#494454]/20 shadow-[0_1px_8px_rgba(0,0,0,0.3)]">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-[#494454]/15">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#a078ff] to-[#4cd7f6] flex items-center justify-center p-0.5 shadow-md shadow-[#a078ff]/20">
              <div className="w-full h-full bg-[#121318] rounded-[6px] flex items-center justify-center">
                <span className="material-symbols-outlined text-[#d0bcff] text-[20px]">bolt</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-title-md text-[#e3e1e9] font-bold tracking-tight">PulseEvent</span>
              <span className="text-[10px] uppercase tracking-wider text-[#958ea0] font-semibold -mt-1">INSOMNIA SUITE</span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-[#292a2f] text-[#d0bcff] font-label-sm text-[11px] font-bold border border-[#a078ff]/30">
            PRO
          </span>
        </div>

        {/* Current Event Selector Widget */}
        <div className="px-4 py-3 relative">
          <div 
            onClick={() => setIsEventDropdownOpen(!isEventDropdownOpen)}
            className="p-3 rounded-xl bg-[#1a1b20] hover:bg-[#292a2f] border border-[#494454]/20 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#4cd7f6] animate-pulse"></span>
                <span className="font-label-sm text-[10px] text-[#4cd7f6] uppercase font-bold tracking-wider">
                  Em Andamento
                </span>
              </div>
              <span className="material-symbols-outlined text-[#958ea0] text-[18px] group-hover:text-[#e3e1e9] transition-colors">
                unfold_more
              </span>
            </div>
            <div className="font-label-md text-[#e3e1e9] font-semibold truncate text-[13px]">
              {currentEvent?.name || 'Selecione um Evento'}
            </div>
            <div className="font-body-sm text-[#cbc3d7] text-[12px] flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[13px] text-[#958ea0]">calendar_today</span>
              <span>{currentEvent?.date || 'Data não definida'}</span>
              <span className="text-[#958ea0]">•</span>
              <span className="truncate">{currentEvent?.venue || currentEvent?.city || 'Local'}</span>
            </div>
          </div>

          {/* Dropdown Menu for Switch Events */}
          {isEventDropdownOpen && (
            <div className="absolute top-full left-4 right-4 mt-1 bg-[#1e1f25] border border-[#494454]/40 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-[#958ea0] border-b border-[#494454]/20 flex items-center justify-between">
                <span>Alternar Evento</span>
                <span>{events.length} disponíveis</span>
              </div>
              <div className="max-h-48 overflow-y-auto py-1">
                {events.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => {
                      onSelectEvent(ev.id);
                      setIsEventDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                      ev.id === currentEvent?.id 
                        ? 'bg-[#a078ff]/15 text-[#d0bcff] font-semibold' 
                        : 'text-[#e3e1e9] hover:bg-[#292a2f]'
                    }`}
                  >
                    <span className="truncate">{ev.name}</span>
                    {ev.id === currentEvent?.id && (
                      <span className="material-symbols-outlined text-[#d0bcff] text-[16px]">check</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="p-2 border-t border-[#494454]/20">
                <button
                  onClick={() => {
                    setIsEventDropdownOpen(false);
                    onOpenNewEventModal();
                  }}
                  className="w-full py-1.5 px-3 rounded-lg bg-[#a078ff]/10 hover:bg-[#a078ff]/20 text-[#d0bcff] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Criar Novo Evento</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="px-3 py-1 flex flex-col gap-0.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id || 
              (item.id === 'events_hub' && ['events_list', 'planning'].includes(activeTab)) ||
              (item.id === 'tickets' && ['tickets_view', 'gandaya_hub'].includes(activeTab)) ||
              (item.id === 'financial' && ['financial_overview', 'costs', 'revenues', 'consolidated'].includes(activeTab)) ||
              (item.id === 'marketing' && ['marketing_overview', 'campaign_gen', 'campaign_hourly', 'ad_library', 'edit_campaigns'].includes(activeTab)) ||
              (item.id === 'art_studio' && ['art_director'].includes(activeTab)) ||
              (item.id === 'calendar' && ['virtual_calendar', 'google_calendar'].includes(activeTab)) ||
              (item.id === 'crm' && ['crm_broadcast'].includes(activeTab)) ||
              (item.id === 'master_ai' && ['master_chat'].includes(activeTab)) ||
              (item.id === 'overview' && activeTab === 'dashboard');

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left w-full ${
                  isActive
                    ? 'bg-[#a078ff] text-[#121318] font-bold shadow-sm shadow-[#a078ff]/30'
                    : 'text-[#cbc3d7] hover:bg-[#292a2f] hover:text-[#e3e1e9]'
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] ${isActive ? 'text-[#121318]' : 'text-[#958ea0]'}`}>
                  {item.icon}
                </span>
                <span className="font-body-md text-[13.5px] truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Quota & System Tools */}
      <div className="p-4 flex flex-col gap-3 border-t border-[#494454]/20 bg-[#121318]">
        {/* Real Dynamic Quota Box */}
        <div className="p-3 rounded-xl bg-[#1a1b20] border border-[#494454]/15 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-[11px] text-[#e3e1e9] font-semibold">
              Ocupação do Evento
            </span>
            <span className="font-label-sm text-[11px] text-[#4edea3] font-bold">
              {percentage}%
            </span>
          </div>
          <div className="w-full bg-[#34343a] h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-[#d0bcff] h-full rounded-full transition-all duration-500" 
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[#958ea0] font-label-sm text-[10px]">
            <span>Cota de Ingressos</span>
            <span>{sold.toLocaleString('pt-BR')} / {capacity.toLocaleString('pt-BR')}</span>
          </div>
        </div>

        {/* Direct Download ZIP Button */}
        <a
          href="/api/download-zip"
          download="insomnia-event-suite.zip"
          className="w-full py-2 px-3 rounded-xl bg-[#4cd7f6]/10 hover:bg-[#4cd7f6]/20 text-[#4cd7f6] text-xs font-bold flex items-center justify-center gap-2 border border-[#4cd7f6]/30 transition-all active:scale-98 shadow-sm"
          title="Baixar projeto compactado (.zip)"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          <span>Baixar Projeto (.zip)</span>
        </a>

        {/* System Utility Buttons */}
        <div className="flex items-center justify-between pt-1">
          <button 
            onClick={onOpenNewEventModal}
            className="flex items-center gap-1.5 text-xs text-[#d0bcff] hover:text-[#e9ddff] font-semibold transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>Novo Evento</span>
          </button>

          {onResetEvents && (
            <button
              onClick={() => {
                if (window.confirm('Tem certeza que deseja resetar os dados de teste para reiniciar a criação do zero?')) {
                  onResetEvents();
                }
              }}
              title="Resetar banco de dados para testar do início"
              className="flex items-center gap-1 text-[11px] text-[#ffb4ab] hover:text-[#ffdad6] transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">restart_alt</span>
              <span>Resetar</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
