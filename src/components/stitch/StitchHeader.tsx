import React, { useState } from 'react';
import { EventData } from '../../types';

interface StitchHeaderProps {
  currentEvent: EventData | null;
  onOpenNewEventModal: () => void;
  onSearch?: (term: string) => void;
}

export const StitchHeader: React.FC<StitchHeaderProps> = ({
  currentEvent,
  onOpenNewEventModal,
  onSearch,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  return (
    <header className="fixed top-0 left-72 right-0 h-16 bg-[#121318]/85 backdrop-blur-xl z-40 px-6 border-b border-[#494454]/20 shadow-[0_1px_8px_rgba(0,0,0,0.2)]">
      <div className="h-full w-full flex items-center justify-between gap-6">
        
        {/* Global Search Bar */}
        <div className="flex-1 max-w-xl">
          <div className="relative flex items-center w-full">
            <span className="material-symbols-outlined absolute left-3.5 text-[#958ea0] text-[20px]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Buscar transação, lote, criativo, produto ou fornecedor..."
              className="w-full h-10 pl-10 pr-24 rounded-xl bg-[#0d0e13] text-[#e3e1e9] placeholder:text-[#958ea0] font-body-sm text-[13px] border border-[#494454]/20 focus:outline-none focus:border-[#a078ff] focus:ring-1 focus:ring-[#a078ff]"
            />
            <span className="absolute right-3 font-label-sm text-[10px] text-[#958ea0] px-1.5 py-0.5 rounded bg-[#292a2f] border border-[#494454]/30 pointer-events-none">
              Ctrl + K
            </span>
          </div>
        </div>

        {/* Status Indicators & Actions */}
        <div className="flex items-center gap-4">
          
          {/* Live Sync Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1a1b20] border border-[#494454]/20">
            <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse"></span>
            <span className="font-label-sm text-[11px] text-[#cbc3d7] font-medium">
              Sincronizado em tempo real
            </span>
          </div>

          {/* Download Project ZIP Button */}
          <a
            href="/api/download-zip"
            download="insomnia-event-suite.zip"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1e1f25] hover:bg-[#292a2f] text-[#4cd7f6] font-label-md text-[12px] font-bold border border-[#4cd7f6]/30 transition-all active:scale-95 shadow-sm"
            title="Baixar todo o código-fonte compactado em .ZIP"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Baixar Projeto (.zip)</span>
          </a>

          {/* New Event CTA */}
          <button
            onClick={onOpenNewEventModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#a078ff] text-[#121318] font-label-md text-[13px] font-bold hover:bg-[#d0bcff] transition-all active:scale-95 shadow-[0_0_24px_-4px_rgba(160,120,255,0.35)]"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Novo Evento</span>
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-[#cbc3d7] hover:bg-[#292a2f] hover:text-[#e3e1e9] transition-all"
              title="Notificações operacionais"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ffb4ab] ring-2 ring-[#121318]"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-[#1e1f25] border border-[#494454]/40 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-2 border-b border-[#494454]/20">
                  <span className="font-label-md text-[12px] font-bold text-[#e3e1e9]">Notificações Operacionais</span>
                  <span className="text-[10px] text-[#4edea3] font-semibold">3 pendências</span>
                </div>
                <div className="flex flex-col gap-2 py-2">
                  <div className="p-2 rounded-lg bg-[#93000a]/20 border border-[#93000a]/30 text-xs">
                    <span className="font-bold text-[#ffb4ab] block">Ruptura de Bar Prevista</span>
                    <span className="text-[#e3e1e9] text-[11px]">Red Bull 250ml com 180 latas restantes.</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#1a1b20] border border-[#494454]/20 text-xs">
                    <span className="font-bold text-[#4cd7f6] block">Virada de Lote Próxima</span>
                    <span className="text-[#cbc3d7] text-[11px]">Lote 2 atingiu 85,6% de ocupação nominal.</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#1a1b20] border border-[#494454]/20 text-xs">
                    <span className="font-bold text-[#d0bcff] block">Cachê DJ Headliner</span>
                    <span className="text-[#cbc3d7] text-[11px]">2ª Parcela vence em 5 dias úteis.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-[#494454]/20">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#a078ff] to-[#4cd7f6] p-0.5 shadow-sm">
              <div className="w-full h-full rounded-full bg-[#1a1b20] flex items-center justify-center font-bold text-xs text-[#d0bcff]">
                RA
              </div>
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="font-label-md text-[12px] text-[#e3e1e9] font-bold leading-none">
                Rafael Alencar
              </span>
              <span className="font-label-sm text-[10px] text-[#958ea0] mt-0.5">
                Diretor Geral de Produção
              </span>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
};
