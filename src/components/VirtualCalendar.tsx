import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  Video, 
  Share2, 
  Layers, 
  Megaphone, 
  CheckCircle, 
  Flame, 
  Tag, 
  X,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { EventData, DayPlan, FeedPostPlan, StoryPlan, ReelPlan, DailyAdPlan } from '../types';
import { SheetsExportButton } from './SheetsExportButton';
import { ReelScriptModal } from './ReelScriptModal';

interface VirtualCalendarProps {
  event: EventData;
  onUpdateEventCalendar: (date: string, dayPlan: DayPlan) => void;
}

export const VirtualCalendar: React.FC<VirtualCalendarProps> = ({ event, onUpdateEventCalendar }) => {
  // Calendar view state: 2026-10
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // 0-indexed: 9 = October
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-05');
  const [activePillarTab, setActivePillarTab] = useState<'all' | 'posts' | 'stories' | 'reels' | 'ads'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemPillar, setNewItemPillar] = useState<'post' | 'story' | 'reel' | 'ad'>('post');
  const [selectedReelForModal, setSelectedReelForModal] = useState<ReelPlan | null>(null);
  const [showReelModal, setShowReelModal] = useState(false);

  const handleSaveReelFromModal = (updatedReel: ReelPlan) => {
    const currentPlan = event.calendar?.[selectedDate] || {
      date: selectedDate,
      posts: [],
      stories: [],
      reels: [],
      ads: []
    };
    const existingIdx = currentPlan.reels.findIndex(r => r.id === updatedReel.id);
    const updatedReels = [...currentPlan.reels];
    if (existingIdx >= 0) {
      updatedReels[existingIdx] = updatedReel;
    } else {
      updatedReels.push(updatedReel);
    }
    onUpdateEventCalendar(selectedDate, {
      ...currentPlan,
      reels: updatedReels
    });
  };

  // Month navigation
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Days in month calculation
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const leadingBlanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  const formatDateKey = (day: number) => {
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${currentYear}-${mm}-${dd}`;
  };

  const selectedDayPlan: DayPlan = event.calendar?.[selectedDate] || {
    date: selectedDate,
    posts: [],
    stories: [],
    reels: [],
    ads: []
  };

  // Prepare full calendar schedule for Google Sheets export
  const sheetsHeaders = ['Data', 'Marco / Milestone', 'Tipo', 'Título / Formato', 'Horário de Pico', 'Conceito / Hook / Copy', 'Segmento / DJ', 'Status'];
  const sheetsRows: (string | number)[][] = [];

  // Populate rows from event.calendar
  const sortedDates = Object.keys(event.calendar || {}).sort();
  sortedDates.forEach((dateStr) => {
    const plan = event.calendar[dateStr];
    const milestone = plan.milestoneLabel || '-';

    plan.posts?.forEach((p) => {
      sheetsRows.push([dateStr, milestone, 'POST FEED', p.title, p.scheduledTime, p.copySnippet, p.djTagged || '-', p.status]);
    });
    plan.stories?.forEach((s) => {
      sheetsRows.push([dateStr, milestone, 'STORY', `Story #${s.sequenceOrder} (${s.format})`, s.scheduledTime, s.copy, s.objective, s.status]);
    });
    plan.reels?.forEach((r) => {
      sheetsRows.push([dateStr, milestone, 'REEL', r.title, r.scheduledTime, `Hook: ${r.hook3s} | CTA: ${r.callToAction}`, r.audioVibe, r.status]);
    });
    plan.ads?.forEach((a) => {
      sheetsRows.push([dateStr, milestone, 'ANÚNCIO META', a.campaignName, `R$ ${a.dailyBudget}/dia`, a.hookAngle, a.audienceSegment, a.status]);
    });
  });

  // Handlers for adding a new item
  const handleAddNewItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updatedPlan: DayPlan = {
      ...selectedDayPlan,
      posts: [...selectedDayPlan.posts],
      stories: [...selectedDayPlan.stories],
      reels: [...selectedDayPlan.reels],
      ads: [...selectedDayPlan.ads],
    };

    if (newItemPillar === 'post') {
      const newPost: FeedPostPlan = {
        id: `post-${Date.now()}`,
        title: formData.get('title') as string || 'Novo Post de Feed',
        type: (formData.get('type') as any) || 'feed',
        scheduledTime: (formData.get('time') as string) || '18:45',
        visualConcept: (formData.get('concept') as string) || 'Fotografia editorial do evento',
        copySnippet: (formData.get('copy') as string) || 'Texto da legenda...',
        status: 'Aprovado',
        djTagged: (formData.get('djTagged') as string) || '@insomnia'
      };
      updatedPlan.posts.push(newPost);
    } else if (newItemPillar === 'story') {
      const newStory: StoryPlan = {
        id: `story-${Date.now()}`,
        sequenceOrder: selectedDayPlan.stories.length + 1,
        scheduledTime: (formData.get('time') as string) || '12:00',
        objective: (formData.get('objective') as any) || 'engajamento',
        format: (formData.get('format') as any) || 'enquete',
        copy: (formData.get('copy') as string) || 'Enquete nos stories...',
        status: 'Aprovado'
      };
      updatedPlan.stories.push(newStory);
    } else if (newItemPillar === 'reel') {
      const newReel: ReelPlan = {
        id: `reel-${Date.now()}`,
        title: formData.get('title') as string || 'Novo Reel de Alto Impacto',
        hook3s: (formData.get('hook') as string) || 'Transição dinâmica nos primeiros 3s',
        audioVibe: (formData.get('audio') as string) || 'Track oficial do headliner',
        pace: 'Corte dinâmico no BPM',
        duration: '20s',
        scheduledTime: (formData.get('time') as string) || '19:30',
        status: 'Aprovado',
        callToAction: (formData.get('cta') as string) || 'Link na bio'
      };
      updatedPlan.reels.push(newReel);
    } else if (newItemPillar === 'ad') {
      const newAd: DailyAdPlan = {
        id: `ad-${Date.now()}`,
        campaignName: formData.get('title') as string || 'CAMPANHA_META_REELS',
        format: (formData.get('format') as string) || 'Reels Ads 9:16',
        audienceSegment: (formData.get('audience') as string) || 'Compradores Lote 1 e 2',
        dailyBudget: Number(formData.get('budget')) || 500,
        targetCpa: Number(formData.get('cpa')) || 25,
        hookAngle: (formData.get('hook') as string) || 'Escassez de ingressos',
        status: 'Ativo'
      };
      updatedPlan.ads.push(newAd);
    }

    onUpdateEventCalendar(selectedDate, updatedPlan);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header with Controls & Google Sheets Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0b0816] p-5 rounded-2xl border border-purple-950/70 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-300 mb-0.5">
            <CalendarIcon className="w-3.5 h-3.5 text-purple-400" />
            <span>CALENDÁRIO VIRTUAL DEDICADO</span>
            <span>·</span>
            <span className="text-slate-400">Painel Exclusivo da Festa</span>
          </div>
          <h2 className="font-display text-xl font-black text-white">
            {monthNames[currentMonth]} {currentYear}
          </h2>
          <p className="text-xs text-slate-400">
            Cada postagem alinhada ao dia com os 4 pilares: Feed, Stories, Reels e Anúncios.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month Switcher */}
          <div className="flex items-center gap-1 bg-[#120d24] border border-purple-900/50 rounded-xl p-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-purple-900/40 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Mês Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-2 text-purple-200">
              {monthNames[currentMonth].slice(0, 3)}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-purple-900/40 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Próximo Mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <SheetsExportButton
            filename={`Cronograma_Completo_${event.id}`}
            title={`Cronograma de Conteúdo e Mídia - ${event.name}`}
            headers={sheetsHeaders}
            rows={sheetsRows}
            label="Exportar Grade para Sheets"
          />
        </div>
      </div>

      {/* Main Grid: Calendar Matrix on Left, Selected Day Drawer on Right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Calendar Grid (7 columns) */}
        <div className="xl:col-span-7 bg-[#0b0816] border border-purple-950/70 rounded-2xl p-5 space-y-4 shadow-xl">
          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-purple-300/80 border-b border-purple-950/60 pb-2">
            <span>DOM</span>
            <span>SEG</span>
            <span>TER</span>
            <span>QUA</span>
            <span>QUI</span>
            <span>SEX</span>
            <span>SÁB</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {leadingBlanks.map((_, idx) => (
              <div key={`blank-${idx}`} className="h-24 sm:h-28 rounded-xl bg-[#080512]/40 border border-transparent" />
            ))}

            {daysArray.map((day) => {
              const dateKey = formatDateKey(day);
              const isSelected = selectedDate === dateKey;
              const dayData = event.calendar?.[dateKey];
              const hasData = dayData && (dayData.posts?.length > 0 || dayData.stories?.length > 0 || dayData.reels?.length > 0 || dayData.ads?.length > 0);
              const isEventDay = event.date === dateKey;

              return (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDate(dateKey)}
                  className={`h-24 sm:h-28 rounded-xl p-2 text-left flex flex-col justify-between transition-all cursor-pointer relative group ${
                    isSelected
                      ? 'bg-purple-950/70 border-2 border-purple-400 shadow-lg shadow-purple-950/60 text-purple-100'
                      : isEventDay
                      ? 'bg-purple-600/30 border border-purple-500 hover:bg-purple-600/40 text-white'
                      : hasData
                      ? 'bg-[#120d24] border border-purple-900/50 hover:border-purple-700/60'
                      : 'bg-[#090614] border border-purple-950/40 hover:bg-[#100a20]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-xs font-mono font-bold ${isSelected ? 'text-white' : isEventDay ? 'text-purple-300' : 'text-slate-300'}`}>
                      {String(day).padStart(2, '0')}
                    </span>
                    {isEventDay && (
                      <span className="text-[9px] font-black uppercase tracking-wider px-1 rounded bg-purple-500 text-white shadow-sm shadow-purple-500/50">
                        DIA D
                      </span>
                    )}
                  </div>

                  {/* Milestone Badge if set */}
                  {dayData?.milestoneLabel && (
                    <div className="text-[10px] text-purple-300 font-semibold truncate bg-purple-950/80 px-1 py-0.5 rounded border border-purple-800/50">
                      {dayData.milestoneLabel}
                    </div>
                  )}

                  {/* Pillar Counters */}
                  <div className="space-y-1 w-full">
                    {hasData ? (
                      <div className="flex items-center gap-1 flex-wrap text-[10px]">
                        {dayData.posts?.length > 0 && (
                          <span className="px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30" title={`${dayData.posts.length} Post(s)`}>
                            P: {dayData.posts.length}
                          </span>
                        )}
                        {dayData.stories?.length > 0 && (
                          <span className="px-1 py-0.2 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30" title={`${dayData.stories.length} Story(ies)`}>
                            S: {dayData.stories.length}
                          </span>
                        )}
                        {dayData.reels?.length > 0 && (
                          <span className="px-1 py-0.2 rounded bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30" title={`${dayData.reels.length} Reel(s)`}>
                            R: {dayData.reels.length}
                          </span>
                        )}
                        {dayData.ads?.length > 0 && (
                          <span className="px-1 py-0.2 rounded bg-purple-600/30 text-purple-200 border border-purple-500/40 font-bold" title={`${dayData.ads.length} Anúncio(s)`}>
                            Ads: {dayData.ads.length}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-600 italic">Livre</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Legend */}
          <div className="pt-2 border-t border-purple-950/60 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-400" /> Post Feed
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-violet-400" /> Stories
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-fuchsia-400" /> Reels
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-300" /> Anúncios Meta
              </span>
            </div>
            <span className="text-purple-400/80 font-mono text-[10px]">Clique em qualquer dia para ver os 4 pilares</span>
          </div>
        </div>

        {/* Selected Day Planning Panel (4 Pillars) */}
        <div className="xl:col-span-5 bg-[#0b0816] border border-purple-950/70 rounded-2xl p-5 space-y-4 flex flex-col shadow-xl">
          {/* Header of the Selected Day */}
          <div className="flex items-center justify-between pb-3 border-b border-purple-950/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-purple-300">
                  {selectedDate}
                </span>
                {selectedDayPlan.milestoneLabel && (
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 font-semibold border border-purple-800/50">
                    {selectedDayPlan.milestoneLabel}
                  </span>
                )}
              </div>
              <h3 className="font-display text-base font-bold text-white mt-0.5">
                Planejamento do Dia
              </h3>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-purple-600/30 text-purple-200 border border-purple-500/40 hover:bg-purple-600/50 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Ação</span>
            </button>
          </div>

          {/* Filter Tabs for the 4 Pillars */}
          <div className="flex items-center gap-1 p-1 bg-[#120d24] rounded-xl text-xs font-medium border border-purple-950/60">
            <button
              onClick={() => setActivePillarTab('all')}
              className={`flex-1 py-1 text-center rounded-lg transition-colors cursor-pointer ${activePillarTab === 'all' ? 'bg-purple-600/40 text-purple-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Todos ({selectedDayPlan.posts.length + selectedDayPlan.stories.length + selectedDayPlan.reels.length + selectedDayPlan.ads.length})
            </button>
            <button
              onClick={() => setActivePillarTab('posts')}
              className={`flex-1 py-1 text-center rounded-lg transition-colors cursor-pointer ${activePillarTab === 'posts' ? 'bg-purple-600/40 text-purple-200 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Posts ({selectedDayPlan.posts.length})
            </button>
            <button
              onClick={() => setActivePillarTab('stories')}
              className={`flex-1 py-1 text-center rounded-lg transition-colors cursor-pointer ${activePillarTab === 'stories' ? 'bg-purple-600/40 text-violet-200 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Stories ({selectedDayPlan.stories.length})
            </button>
            <button
              onClick={() => setActivePillarTab('reels')}
              className={`flex-1 py-1 text-center rounded-lg transition-colors cursor-pointer ${activePillarTab === 'reels' ? 'bg-purple-600/40 text-fuchsia-200 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Reels ({selectedDayPlan.reels.length})
            </button>
            <button
              onClick={() => setActivePillarTab('ads')}
              className={`flex-1 py-1 text-center rounded-lg transition-colors cursor-pointer ${activePillarTab === 'ads' ? 'bg-purple-600/40 text-purple-200 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Ads ({selectedDayPlan.ads.length})
            </button>
          </div>

          {/* Pillars Content Container */}
          <div className="space-y-3.5 overflow-y-auto max-h-[520px] pr-1 flex-1">
            {/* 1. Feed Posts */}
            {(activePillarTab === 'all' || activePillarTab === 'posts') && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                  <Layers className="w-3.5 h-3.5" />
                  <span>1. POST DO DIA (FEED / CARROSSEL)</span>
                </div>

                {selectedDayPlan.posts.length === 0 ? (
                  <div className="p-3 rounded-xl bg-[#0e0a1c] border border-purple-950/60 text-xs text-slate-500 italic">
                    Nenhum post de feed planejado para este dia.
                  </div>
                ) : (
                  selectedDayPlan.posts.map((post) => (
                    <div key={post.id} className="p-3.5 rounded-xl bg-[#120d24] border border-purple-900/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{post.title}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/40">
                            ⏰ {post.scheduledTime}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/40 text-purple-200 border border-purple-700/50">
                            {post.status}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-300 bg-[#0a0714] p-2.5 rounded-lg border border-purple-950/60">
                        <span className="text-purple-400 font-semibold block text-[11px] mb-0.5">Conceito Visual:</span>
                        {post.visualConcept}
                      </div>

                      <div className="text-xs text-slate-300 bg-[#0a0714] p-2.5 rounded-lg border border-purple-950/60">
                        <span className="text-purple-400 font-semibold block text-[11px] mb-0.5">Copy / Legenda:</span>
                        <p className="italic text-slate-200">"{post.copySnippet}"</p>
                      </div>

                      {post.djTagged && (
                        <div className="text-[11px] text-purple-300 flex items-center gap-1 font-mono">
                          <Tag className="w-3 h-3" />
                          <span>DJ Marcado: {post.djTagged}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 2. Stories */}
            {(activePillarTab === 'all' || activePillarTab === 'stories') && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-violet-300">
                  <Share2 className="w-3.5 h-3.5" />
                  <span>2. STORIES DO DIA (SEQUÊNCIA DIÁRIA)</span>
                </div>

                {selectedDayPlan.stories.length === 0 ? (
                  <div className="p-3 rounded-xl bg-[#0e0a1c] border border-purple-950/60 text-xs text-slate-500 italic">
                    Nenhum story configurado para este dia.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedDayPlan.stories.map((story) => (
                      <div key={story.id} className="p-3 rounded-xl bg-[#120d24] border border-purple-900/40 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-purple-200">
                            Story #{story.sequenceOrder} · <span className="uppercase text-purple-400">{story.format}</span>
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/40">
                            ⏰ {story.scheduledTime}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 bg-[#0a0714] p-2 rounded border border-purple-950/60">
                          {story.copy}
                        </p>
                        <div className="text-[10px] text-slate-400 flex items-center justify-between">
                          <span>Objetivo: <strong className="text-purple-300">{story.objective}</strong></span>
                          <span className="text-purple-400">{story.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. Reels */}
            {(activePillarTab === 'all' || activePillarTab === 'reels') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-fuchsia-300">
                    <Video className="w-3.5 h-3.5" />
                    <span>3. REELS DO DIA (HOOK & RETENÇÃO)</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedReelForModal(null);
                      setShowReelModal(true);
                    }}
                    className="text-[10px] font-bold text-fuchsia-300 hover:text-white bg-fuchsia-950/80 hover:bg-fuchsia-900/80 px-2 py-1 rounded-lg border border-fuchsia-800/40 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-fuchsia-400" />
                    <span>Roteirizar Novo Reel</span>
                  </button>
                </div>

                {selectedDayPlan.reels.length === 0 ? (
                  <div className="p-3 rounded-xl bg-[#0e0a1c] border border-purple-950/60 text-xs text-slate-500 italic">
                    Nenhum reel programado para este dia.
                  </div>
                ) : (
                  selectedDayPlan.reels.map((reel) => (
                    <div key={reel.id} className="p-3.5 rounded-xl bg-[#120d24] border border-fuchsia-950/60 hover:border-fuchsia-800/60 transition-all space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-fuchsia-200">{reel.title}</span>
                        <div className="flex items-center gap-1">
                          {reel.trendFormat && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-800/40">
                              {reel.trendFormat}
                            </span>
                          )}
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/40">
                            ⏰ {reel.scheduledTime} ({reel.duration})
                          </span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-purple-950/30 border border-purple-800/40 text-xs">
                        <span className="font-semibold text-purple-300 block mb-0.5">Hook Primeiros 3 Segundos:</span>
                        <p className="text-slate-200">{reel.hook3s}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                        <div className="bg-[#0a0714] p-2 rounded border border-purple-950/60">
                          <span className="text-slate-400 block text-[10px]">Trilha / Vibe:</span>
                          {reel.audioVibe}
                        </div>
                        <div className="bg-[#0a0714] p-2 rounded border border-purple-950/60">
                          <span className="text-slate-400 block text-[10px]">Chamada (CTA):</span>
                          {reel.callToAction}
                        </div>
                      </div>

                      <div className="flex justify-end pt-1 border-t border-purple-950/50">
                        <button
                          onClick={() => {
                            setSelectedReelForModal(reel);
                            setShowReelModal(true);
                          }}
                          className="py-1 px-2.5 rounded-lg bg-fuchsia-950/70 hover:bg-fuchsia-900/80 text-fuchsia-200 border border-fuchsia-800/50 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-fuchsia-400" />
                          <span>Ver Roteiro Viral Completo</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 4. Daily Meta Ads */}
            {(activePillarTab === 'all' || activePillarTab === 'ads') && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>4. ANÚNCIOS DO DIA (META ADS)</span>
                </div>

                {selectedDayPlan.ads.length === 0 ? (
                  <div className="p-3 rounded-xl bg-[#0e0a1c] border border-purple-950/60 text-xs text-slate-500 italic">
                    Nenhum anúncio de tráfego pago ativo para esta data.
                  </div>
                ) : (
                  selectedDayPlan.ads.map((ad) => (
                    <div key={ad.id} className="p-3.5 rounded-xl bg-[#120d24] border border-purple-700/50 space-y-2 shadow-lg shadow-purple-950/30">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono text-purple-200">{ad.campaignName}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900/60 text-purple-200 font-bold border border-purple-700/60">
                          R$ {ad.dailyBudget}/dia
                        </span>
                      </div>

                      <div className="text-xs text-slate-300">
                        <span className="text-slate-400 block text-[11px]">Público Alvo:</span>
                        <span className="font-medium text-slate-200">{ad.audienceSegment}</span>
                      </div>

                      <div className="text-xs text-slate-300 bg-[#0a0714] p-2 rounded border border-purple-950/60">
                        <span className="text-purple-400 block text-[11px] mb-0.5">Ângulo do Criativo (Hook):</span>
                        <p className="text-purple-200">{ad.hookAngle}</p>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Formato: <strong className="text-slate-300">{ad.format}</strong></span>
                        <span>Meta CPA: <strong className="text-purple-300">R$ {ad.targetCpa.toFixed(2)}</strong></span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#0b0816] border border-purple-900/60 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-950/70 pb-3">
              <div>
                <h4 className="font-display text-base font-bold text-white">
                  Adicionar Ação ao Dia ({selectedDate})
                </h4>
                <p className="text-xs text-slate-400">Escolha o pilar para planejar</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-purple-950/50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pillar Selector Buttons */}
            <div className="grid grid-cols-4 gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setNewItemPillar('post')}
                className={`py-2 rounded-xl border text-center transition-all cursor-pointer ${newItemPillar === 'post' ? 'bg-purple-600/40 text-purple-200 border-purple-500/60 shadow-sm' : 'bg-[#120d24] text-slate-400 border-purple-950/60 hover:text-white'}`}
              >
                Post Feed
              </button>
              <button
                type="button"
                onClick={() => setNewItemPillar('story')}
                className={`py-2 rounded-xl border text-center transition-all cursor-pointer ${newItemPillar === 'story' ? 'bg-purple-600/40 text-violet-200 border-purple-500/60 shadow-sm' : 'bg-[#120d24] text-slate-400 border-purple-950/60 hover:text-white'}`}
              >
                Story
              </button>
              <button
                type="button"
                onClick={() => setNewItemPillar('reel')}
                className={`py-2 rounded-xl border text-center transition-all cursor-pointer ${newItemPillar === 'reel' ? 'bg-purple-600/40 text-fuchsia-200 border-purple-500/60 shadow-sm' : 'bg-[#120d24] text-slate-400 border-purple-950/60 hover:text-white'}`}
              >
                Reel
              </button>
              <button
                type="button"
                onClick={() => setNewItemPillar('ad')}
                className={`py-2 rounded-xl border text-center transition-all cursor-pointer ${newItemPillar === 'ad' ? 'bg-purple-600/40 text-purple-200 border-purple-500/60 shadow-sm' : 'bg-[#120d24] text-slate-400 border-purple-950/60 hover:text-white'}`}
              >
                Anúncio
              </button>
            </div>

            <form onSubmit={handleAddNewItem} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Título / Identificador:</label>
                <input
                  name="title"
                  required
                  placeholder={newItemPillar === 'ad' ? '[RETARGETING_LOTE3]_REELS' : 'Ex: Carrossel do Lineup Oficial'}
                  className="w-full bg-[#120d24] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Horário de Pico:</label>
                  <input
                    name="time"
                    defaultValue="18:45"
                    className="w-full bg-[#120d24] border border-purple-900/50 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                {newItemPillar === 'post' && (
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Tipo de Post:</label>
                    <select name="type" className="w-full bg-[#120d24] border border-purple-900/50 rounded-xl px-3 py-2 text-white">
                      <option value="feed">Feed Estático 4:5</option>
                      <option value="carrossel">Carrossel Editorial</option>
                      <option value="collab">Collab Oficial com DJ</option>
                    </select>
                  </div>
                )}

                {newItemPillar === 'story' && (
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Formato do Story:</label>
                    <select name="format" className="w-full bg-[#120d24] border border-purple-900/50 rounded-xl px-3 py-2 text-white">
                      <option value="enquete">Enquete Interativa</option>
                      <option value="caixa_perguntas">Caixa de Perguntas</option>
                      <option value="link_sticker">Sticker de Link VIP</option>
                      <option value="video_dj">Vídeo Bastidores do DJ</option>
                      <option value="countdown">Contagem Regressiva</option>
                    </select>
                  </div>
                )}

                {newItemPillar === 'ad' && (
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Orçamento Diário (R$):</label>
                    <input
                      name="budget"
                      type="number"
                      defaultValue={600}
                      className="w-full bg-[#120d24] border border-purple-900/50 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                )}
              </div>

              {newItemPillar === 'post' && (
                <>
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Conceito Visual:</label>
                    <input
                      name="concept"
                      placeholder="Diretriz fotográfica e layout"
                      className="w-full bg-[#120d24] border border-purple-900/50 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Copy / Texto de Legenda:</label>
                    <textarea
                      name="copy"
                      rows={2}
                      placeholder="Texto impactante com chamada de ação..."
                      className="w-full bg-[#120d24] border border-purple-900/50 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </>
              )}

              {newItemPillar === 'story' && (
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Conteúdo / Texto do Story:</label>
                  <textarea
                    name="copy"
                    rows={2}
                    placeholder="Instrução do story e texto da enquete..."
                    className="w-full bg-[#120d24] border border-purple-900/50 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              )}

              {newItemPillar === 'reel' && (
                <>
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Hook nos 3 Primeiros Segundos:</label>
                    <input
                      name="hook"
                      placeholder="O que prende a atenção do clubber imediatamente..."
                      className="w-full bg-[#120d24] border border-purple-900/50 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Trilha / Vibe:</label>
                      <input name="audio" defaultValue="Track oficial do headliner" className="w-full bg-[#120d24] border border-purple-900/50 rounded-xl px-3 py-2 text-white" />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Call to Action (CTA):</label>
                      <input name="cta" defaultValue="Comente 'INSOMNIA' para receber o link VIP" className="w-full bg-[#120d24] border border-purple-900/50 rounded-xl px-3 py-2 text-white" />
                    </div>
                  </div>
                </>
              )}

              {newItemPillar === 'ad' && (
                <>
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Segmento de Público:</label>
                    <input
                      name="audience"
                      defaultValue="Lookalike 1% + Compradores de Festivais de Música"
                      className="w-full bg-[#120d24] border border-purple-900/50 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Ângulo do Anúncio (Hook):</label>
                    <input
                      name="hook"
                      defaultValue="Escassez: Últimas unidades do Lote com virada confirmada"
                      className="w-full bg-[#120d24] border border-purple-900/50 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-purple-950/60">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-[#120d24] text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:brightness-110 text-white font-bold cursor-pointer shadow-md shadow-purple-950/50"
                >
                  Salvar no Calendário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reel Viral Script Modal */}
      {showReelModal && (
        <ReelScriptModal
          isOpen={showReelModal}
          onClose={() => {
            setShowReelModal(false);
            setSelectedReelForModal(null);
          }}
          event={event}
          initialReel={selectedReelForModal}
          selectedDate={selectedDate}
          onSaveToCalendar={handleSaveReelFromModal}
        />
      )}
    </div>
  );
};
