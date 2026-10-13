import React, { useState } from 'react';
import { EventData } from '../../types';
import { PlanningAgent } from '../PlanningAgent';

interface StitchEventsHubViewProps {
  events: EventData[];
  currentEvent: EventData | null;
  onSelectEvent: (eventId: string) => void;
  onOpenNewEventModal: () => void;
  onSyncPlanningSchedule: (items: any[]) => void;
  onNavigateToTab: (tabId: string) => void;
}

export const StitchEventsHubView: React.FC<StitchEventsHubViewProps> = ({
  events,
  currentEvent,
  onSelectEvent,
  onOpenNewEventModal,
  onSyncPlanningSchedule,
  onNavigateToTab,
}) => {
  const [subTab, setSubTab] = useState<'events_list' | 'planning'>('events_list');

  return (
    <div className="flex flex-col w-full pb-16">
      
      {/* Header */}
      <div className="flex flex-col gap-4 pt-4 pb-6">
        <div className="flex items-center justify-between flex-wrap gap-2 text-[#958ea0] font-label-sm text-[11px]">
          <div className="flex items-center gap-1.5">
            <span onClick={() => onNavigateToTab('overview')} className="hover:text-[#e3e1e9] cursor-pointer transition-colors">
              Início
            </span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#d0bcff] font-bold">Meus Eventos & Planejamento</span>
          </div>

          <div className="flex items-center p-1 rounded-xl bg-[#1e1f25] border border-[#494454]/20">
            <button
              onClick={() => setSubTab('events_list')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                subTab === 'events_list' ? 'bg-[#a078ff] text-[#121318]' : 'text-[#cbc3d7] hover:text-[#e3e1e9]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">format_list_bulleted</span>
              <span>Todos os Eventos ({events.length})</span>
            </button>
            <button
              onClick={() => setSubTab('planning')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                subTab === 'planning' ? 'bg-[#a078ff] text-[#121318]' : 'text-[#cbc3d7] hover:text-[#e3e1e9]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
              <span>Planejamento de Grade IA</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline-xl text-[28px] text-[#e3e1e9] font-bold tracking-tight">
              Gerenciamento de Eventos e Produções
            </h1>
            <p className="font-body-md text-[13px] text-[#cbc3d7] mt-0.5">
              Visualize todas as edições em andamento, alterne o contexto operacional e acione o agente de cronograma.
            </p>
          </div>

          <button
            onClick={onOpenNewEventModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#a078ff] text-[#121318] hover:bg-[#d0bcff] font-label-md text-[12px] font-bold transition-all shadow-[0_0_24px_-4px_rgba(160,120,255,0.35)] active:scale-95 shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>+ Criar Novo Evento</span>
          </button>
        </div>
      </div>

      {subTab === 'events_list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {events.map((ev) => {
            const isCurrent = ev.id === currentEvent?.id;
            const soldPct = ev.capacity > 0 ? Math.round((ev.soldTickets / ev.capacity) * 100) : 0;
            const revPct = ev.revenueTarget > 0 ? Math.round((ev.currentRevenue / ev.revenueTarget) * 100) : 0;

            return (
              <div
                key={ev.id}
                className={`p-5 rounded-2xl bg-[#1e1f25] border transition-all flex flex-col justify-between gap-4 shadow-md ${
                  isCurrent
                    ? 'border-[#a078ff] shadow-[0_0_24px_-4px_rgba(160,120,255,0.2)] bg-[#1e1f25]'
                    : 'border-[#494454]/20 hover:border-[#494454]/40 hover:bg-[#292a2f]'
                }`}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#1a1b20] text-[#4cd7f6] font-label-sm text-[10px] font-bold border border-[#4cd7f6]/20 uppercase">
                      {ev.genre}
                    </span>
                    {isCurrent ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#a078ff]/20 text-[#d0bcff] font-label-sm text-[10px] font-bold border border-[#a078ff]/30">
                        Ativo Agora
                      </span>
                    ) : (
                      <button
                        onClick={() => onSelectEvent(ev.id)}
                        className="text-xs text-[#a078ff] hover:underline font-bold"
                      >
                        Selecionar →
                      </button>
                    )}
                  </div>

                  <div>
                    <h3 className="font-headline-sm text-lg font-bold text-[#e3e1e9] leading-tight">
                      {ev.name}
                    </h3>
                    <p className="font-body-sm text-[12px] text-[#cbc3d7] mt-1 line-clamp-2">
                      {ev.tagline || 'Evento de música e entretenimento gerenciado com inteligência artificial.'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1 text-xs text-[#958ea0] pt-2 border-t border-[#494454]/15">
                    <div className="flex items-center gap-1.5 text-[#e3e1e9]">
                      <span className="material-symbols-outlined text-[15px] text-[#4cd7f6]">calendar_month</span>
                      <span>{ev.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-[#958ea0]">location_on</span>
                      <span>{ev.venue || ev.city}</span>
                    </div>
                  </div>

                  {/* Quota Progress */}
                  <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#1a1b20] border border-[#494454]/15">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#cbc3d7]">Ingressos ({soldPct}%)</span>
                      <span className="text-[#e3e1e9] font-bold">{ev.soldTickets} / {ev.capacity}</span>
                    </div>
                    <div className="w-full bg-[#34343a] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#4cd7f6] h-full rounded-full" style={{ width: `${soldPct}%` }}></div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#958ea0]">
                      <span>Receita: R$ {ev.currentRevenue.toLocaleString('pt-BR')}</span>
                      <span>{revPct}% da meta</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[#494454]/15">
                  <button
                    onClick={() => {
                      onSelectEvent(ev.id);
                      onNavigateToTab('overview');
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#a078ff] text-[#121318] hover:bg-[#d0bcff] text-xs font-bold transition-all text-center"
                  >
                    Abrir Dashboard
                  </button>
                  <button
                    onClick={() => {
                      onSelectEvent(ev.id);
                      onNavigateToTab('tickets');
                    }}
                    className="p-2 rounded-xl bg-[#292a2f] text-[#cbc3d7] hover:text-[#e3e1e9] text-xs font-semibold"
                    title="Vendas"
                  >
                    <span className="material-symbols-outlined text-[18px]">confirmation_number</span>
                  </button>
                  <button
                    onClick={() => {
                      onSelectEvent(ev.id);
                      onNavigateToTab('financial');
                    }}
                    className="p-2 rounded-xl bg-[#292a2f] text-[#cbc3d7] hover:text-[#e3e1e9] text-xs font-semibold"
                    title="DRE"
                  >
                    <span className="material-symbols-outlined text-[18px]">payments</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        currentEvent && (
          <PlanningAgent
            event={currentEvent}
            onSyncWithCalendar={onSyncPlanningSchedule}
          />
        )
      )}

    </div>
  );
};
