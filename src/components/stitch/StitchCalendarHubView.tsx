import React, { useState } from 'react';
import { EventData, DayPlan } from '../../types';
import { VirtualCalendar } from '../VirtualCalendar';
import { GoogleCalendarHub } from '../GoogleCalendarHub';

interface StitchCalendarHubViewProps {
  event: EventData;
  onUpdateEventCalendar: (date: string, dayPlan: DayPlan) => void;
  onUpdateEvent: (updated: EventData) => void;
  onNavigateToTab: (tabId: string) => void;
}

export const StitchCalendarHubView: React.FC<StitchCalendarHubViewProps> = ({
  event,
  onUpdateEventCalendar,
  onUpdateEvent,
  onNavigateToTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'virtual' | 'google'>('virtual');

  return (
    <div className="flex flex-col w-full pb-16">
      
      {/* Header */}
      <div className="flex flex-col gap-4 pt-4 pb-6">
        <div className="flex items-center justify-between flex-wrap gap-2 text-[#958ea0] font-label-sm text-[11px]">
          <div className="flex items-center gap-1.5">
            <span onClick={() => onNavigateToTab('overview')} className="hover:text-[#e3e1e9] cursor-pointer transition-colors">
              Eventos
            </span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#e3e1e9]">{event.name}</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#d0bcff] font-bold">Calendário & Agenda IA</span>
          </div>

          <div className="flex items-center p-1 rounded-xl bg-[#1e1f25] border border-[#494454]/20">
            <button
              onClick={() => setActiveSubTab('virtual')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'virtual' ? 'bg-[#a078ff] text-[#121318]' : 'text-[#cbc3d7] hover:text-[#e3e1e9]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">view_week</span>
              <span>Grade 4 Pilares</span>
            </button>
            <button
              onClick={() => setActiveSubTab('google')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'google' ? 'bg-[#a078ff] text-[#121318]' : 'text-[#cbc3d7] hover:text-[#e3e1e9]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">event_available</span>
              <span>Google Calendar & Conflitos</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline-xl text-[28px] text-[#e3e1e9] font-bold tracking-tight">
              Calendário Editorial & Gestão de Conflitos
            </h1>
            <p className="font-body-md text-[13px] text-[#cbc3d7] mt-0.5">
              Grade de publicações de Feed, Stories, Reels e Anúncios com auditoria de choques de agenda.
            </p>
          </div>
        </div>
      </div>

      {activeSubTab === 'virtual' ? (
        <VirtualCalendar
          event={event}
          onUpdateEventCalendar={onUpdateEventCalendar}
        />
      ) : (
        <GoogleCalendarHub
          event={event}
          onUpdateEvent={onUpdateEvent}
          onNavigateToTab={onNavigateToTab}
        />
      )}

    </div>
  );
};
