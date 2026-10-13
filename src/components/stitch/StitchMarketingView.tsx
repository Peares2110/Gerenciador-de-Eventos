import React, { useState } from 'react';
import { EventData, HourlyAuditReport } from '../../types';
import { CampaignGenerator } from '../CampaignGenerator';
import { CampaignManagerEdit } from '../CampaignManagerEdit';
import { CampaignHourlyManager } from '../CampaignHourlyManager';
import { AdLibrary } from '../AdLibrary';

interface StitchMarketingViewProps {
  event: EventData;
  onUpdateEvent: (updated: EventData) => void;
  onApplyAdToCalendar: (adPlan: any) => void;
  onUpdateEventCalendar: (date: string, dayPlan: any) => void;
  onSendReportToMasterAgent: (report: HourlyAuditReport) => void;
  onNavigateToTab: (tabId: string) => void;
}

export const StitchMarketingView: React.FC<StitchMarketingViewProps> = ({
  event,
  onUpdateEvent,
  onApplyAdToCalendar,
  onUpdateEventCalendar,
  onSendReportToMasterAgent,
  onNavigateToTab,
}) => {
  const [subTab, setSubTab] = useState<'generator' | 'manage' | 'hourly' | 'library'>('generator');

  const budget = event.totalAdBudget || 25000;
  const spent = event.spentAdBudget || 14250;
  const roas = event.blendedRoas || 4.2;
  const cpa = event.currentCpa || 18.5;
  const targetCpa = event.targetCpa || 25;

  return (
    <div className="flex flex-col w-full pb-16">
      
      {/* Header & Sub-Nav */}
      <div className="flex flex-col gap-4 pt-4 pb-6">
        <div className="flex items-center justify-between flex-wrap gap-2 text-[#958ea0] font-label-sm text-[11px]">
          <div className="flex items-center gap-1.5">
            <span onClick={() => onNavigateToTab('overview')} className="hover:text-[#e3e1e9] cursor-pointer transition-colors">
              Eventos
            </span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#e3e1e9]">{event.name}</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#d0bcff] font-bold">Marketing & Tráfego</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-[#1a1b20] border border-[#494454]/20 text-xs font-mono text-[#4edea3]">
              ROAS {roas}x · Blended
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#1a1b20] border border-[#494454]/20 text-xs font-mono text-[#d0bcff]">
              CPA R$ {cpa.toFixed(2)} (Meta R$ {targetCpa.toFixed(2)})
            </span>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div>
            <h1 className="font-headline-xl text-[28px] text-[#e3e1e9] font-bold tracking-tight">
              Central de Tráfego Pago & Meta Ads
            </h1>
            <p className="font-body-md text-[13px] text-[#cbc3d7] mt-0.5">
              Gerador com Crítica Ríspida por IA, auditoria determinística hora a hora e gestão de campanhas ativas.
            </p>
          </div>

          {/* Subtabs Pill Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-[#1e1f25] border border-[#494454]/20 flex-wrap gap-1">
            <button
              onClick={() => setSubTab('generator')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                subTab === 'generator' ? 'bg-[#a078ff] text-[#121318] shadow-sm' : 'text-[#cbc3d7] hover:text-[#e3e1e9]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">psychology</span>
              <span>Gerador IA + Crítica</span>
            </button>
            <button
              onClick={() => setSubTab('hourly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                subTab === 'hourly' ? 'bg-[#a078ff] text-[#121318] shadow-sm' : 'text-[#cbc3d7] hover:text-[#e3e1e9]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              <span>Auditoria 24h</span>
            </button>
            <button
              onClick={() => setSubTab('manage')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                subTab === 'manage' ? 'bg-[#a078ff] text-[#121318] shadow-sm' : 'text-[#cbc3d7] hover:text-[#e3e1e9]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
              <span>Editar Campanhas</span>
            </button>
            <button
              onClick={() => setSubTab('library')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                subTab === 'library' ? 'bg-[#a078ff] text-[#121318] shadow-sm' : 'text-[#cbc3d7] hover:text-[#e3e1e9]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">bookmark</span>
              <span>Biblioteca Campeã</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric overview strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-3.5 rounded-xl bg-[#1e1f25] border border-[#494454]/20 flex flex-col">
          <span className="text-[10px] uppercase font-bold text-[#958ea0] tracking-wider">Orçamento Total Ads</span>
          <span className="text-lg font-bold font-mono text-[#e3e1e9] mt-0.5">R$ {budget.toLocaleString('pt-BR')}</span>
          <span className="text-[10px] text-[#4edea3] mt-0.5">Disponível em conta</span>
        </div>
        <div className="p-3.5 rounded-xl bg-[#1e1f25] border border-[#494454]/20 flex flex-col">
          <span className="text-[10px] uppercase font-bold text-[#958ea0] tracking-wider">Investimento Realizado</span>
          <span className="text-lg font-bold font-mono text-[#4cd7f6] mt-0.5">R$ {spent.toLocaleString('pt-BR')}</span>
          <span className="text-[10px] text-[#cbc3d7] mt-0.5">{((spent / budget) * 100).toFixed(1)}% do total</span>
        </div>
        <div className="p-3.5 rounded-xl bg-[#1e1f25] border border-[#494454]/20 flex flex-col">
          <span className="text-[10px] uppercase font-bold text-[#958ea0] tracking-wider">ROAS Blended</span>
          <span className="text-lg font-bold font-mono text-[#4edea3] mt-0.5">{roas}x</span>
          <span className="text-[10px] text-[#4edea3] mt-0.5">Meta 4.0x atingida</span>
        </div>
        <div className="p-3.5 rounded-xl bg-[#1e1f25] border border-[#494454]/20 flex flex-col">
          <span className="text-[10px] uppercase font-bold text-[#958ea0] tracking-wider">CPA Médio por Ingresso</span>
          <span className="text-lg font-bold font-mono text-[#d0bcff] mt-0.5">R$ {cpa.toFixed(2)}</span>
          <span className="text-[10px] text-[#4edea3] mt-0.5">-26% vs Teto (R$ {targetCpa.toFixed(2)})</span>
        </div>
      </div>

      {/* Subtab Contents */}
      {subTab === 'generator' && (
        <CampaignGenerator
          event={event}
          onApplyAdToCalendar={onApplyAdToCalendar}
          onNavigateToTab={onNavigateToTab}
        />
      )}

      {subTab === 'hourly' && (
        <CampaignHourlyManager
          event={event}
          onSendReportToMasterAgent={onSendReportToMasterAgent}
        />
      )}

      {subTab === 'manage' && (
        <CampaignManagerEdit
          event={event}
          onUpdateEventCalendar={onUpdateEventCalendar}
          onNavigateToTab={onNavigateToTab}
        />
      )}

      {subTab === 'library' && (
        <AdLibrary
          event={event}
          onUpdateEvent={onUpdateEvent}
          onNavigateToTab={onNavigateToTab}
        />
      )}

    </div>
  );
};
