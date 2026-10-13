import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Calendar, 
  Clock, 
  Sparkles, 
  CheckCircle, 
  Layers, 
  Share2, 
  Video, 
  Megaphone,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Brain,
  History,
  Flame,
  Zap,
  Check,
  ChevronDown,
  Info
} from 'lucide-react';
import { EventData, DayPlan, ReelPlan, GenreHistoricalInsight } from '../types';
import { SheetsExportButton } from './SheetsExportButton';
import { ReelScriptModal } from './ReelScriptModal';

interface PlanningAgentProps {
  event: EventData;
  onSyncWithCalendar: (scheduleItems: any[]) => void;
}

export const PlanningAgent: React.FC<PlanningAgentProps> = ({ event, onSyncWithCalendar }) => {
  const [strategyPhase, setStrategyPhase] = useState('Sustentação de Vendas & Virada de Lote 3');
  const [daysCount, setDaysCount] = useState(7);
  const [audienceSegment, setAudienceSegment] = useState(
    event.genre.toLowerCase().includes('funk') || event.genre.toLowerCase().includes('trap')
      ? 'Jovens 18-24 anos (Tribo Urbana / Funk & Trap / Hype)'
      : 'Público 21-32 anos (Pista & Festival / Eletrônica & Tech House)'
  );
  const [psychologicalTrigger, setPsychologicalTrigger] = useState('Urgência de Virada de Lote & Escassez Real');
  const [paydayCycle, setPaydayCycle] = useState('Semana do Salário (5º dia útil / Maior conversão de compra)');
  const [primaryChannelFocus, setPrimaryChannelFocus] = useState('Reels 9:16 + Stories com Enquetes e Link');
  const [isLoading, setIsLoading] = useState(false);
  const [planningResult, setPlanningResult] = useState<any>(null);
  const [synced, setSynced] = useState(false);
  const [selectedReelForModal, setSelectedReelForModal] = useState<ReelPlan | null>(null);
  const [showReelModal, setShowReelModal] = useState(false);

  // Genre Historical Insights State
  const [selectedGenreBenchmark, setSelectedGenreBenchmark] = useState<string>(
    event.genre.toLowerCase().includes('funk') || event.genre.toLowerCase().includes('trap')
      ? 'funk_trap'
      : event.genre.toLowerCase().includes('eletronica')
      ? 'eletronica'
      : 'geral'
  );
  const [historicalInsight, setHistoricalInsight] = useState<GenreHistoricalInsight | null>(null);
  const [appliedHistoricalTimes, setAppliedHistoricalTimes] = useState(false);

  // Fetch or calculate historical insights for genre
  useEffect(() => {
    const fetchHistoricalInsights = async () => {
      try {
        const query = selectedGenreBenchmark === 'funk_trap' ? 'funk trap' : selectedGenreBenchmark === 'eletronica' ? 'eletronica tech house' : 'geral';
        const res = await fetch(`/api/agent/historical-insights?genre=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success && data.insight) {
          setHistoricalInsight(data.insight);
        }
      } catch (err) {
        console.error('Failed to load historical insights:', err);
      }
    };
    fetchHistoricalInsights();
  }, [selectedGenreBenchmark]);

  // Apply historical genre times to existing or generated schedule
  const handleApplyHistoricalTimesToSchedule = () => {
    if (!planningResult?.schedule) return;

    const updatedSchedule = planningResult.schedule.map((day: any, idx: number) => {
      const isWeekend = idx % 2 === 0;
      return {
        ...day,
        post: day.post ? {
          ...day.post,
          scheduledTime: '18:45' // Peak commute / feed scroll from historical data
        } : undefined,
        stories: day.stories ? day.stories.map((s: any, sIdx: number) => ({
          ...s,
          scheduledTime: sIdx === 0 ? '10:15' : sIdx === 1 ? '12:30' : '21:30'
        })) : day.stories,
        reel: day.reel ? {
          ...day.reel,
          scheduledTime: isWeekend ? '22:00' : '21:30' // Peak video retention window
        } : undefined
      };
    });

    setPlanningResult({
      ...planningResult,
      schedule: updatedSchedule
    });

    setAppliedHistoricalTimes(true);
    setTimeout(() => setAppliedHistoricalTimes(false), 3500);
  };

  // Generate Digital Presence Plan with Planning Agent API
  const handleGeneratePlan = async () => {
    setIsLoading(true);
    setSynced(false);

    try {
      const res = await fetch('/api/agent/planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          strategyPhase,
          contentDaysCount: daysCount,
          audienceSegment,
          psychologicalTrigger,
          paydayCycle,
          primaryChannelFocus
        })
      });
      const data = await res.json();
      if (data.success && data.plan) {
        setPlanningResult(data.plan);
      }
    } catch (err) {
      console.error('Planning error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncToCalendar = () => {
    if (!planningResult?.schedule) return;
    onSyncWithCalendar(planningResult.schedule);
    setSynced(true);
    setTimeout(() => setSynced(false), 3000);
  };

  // Google Sheets Export Data
  const sheetsHeaders = ['Dia', 'Marco do Dia', 'Pilar', 'Título / Formato', 'Horário de Pico', 'Conceito / Hook / Copy', 'DJ / Tag'];
  const sheetsRows: (string | number)[][] = [];

  if (planningResult?.schedule) {
    planningResult.schedule.forEach((day: any) => {
      if (day.post) {
        sheetsRows.push([day.dateLabel, day.milestoneLabel, `POST (${day.post.type})`, day.post.title, day.post.scheduledTime, day.post.copySnippet, day.post.djTagged || '-']);
      }
      day.stories?.forEach((s: any) => {
        sheetsRows.push([day.dateLabel, day.milestoneLabel, `STORY #${s.sequenceOrder}`, s.format, s.scheduledTime, s.copy, s.objective]);
      });
      if (day.reel) {
        sheetsRows.push([day.dateLabel, day.milestoneLabel, 'REEL', day.reel.title, day.reel.scheduledTime, `Hook: ${day.reel.hook3s}`, day.reel.audioVibe]);
      }
      day.ads?.forEach((a: any) => {
        sheetsRows.push([day.dateLabel, day.milestoneLabel, 'ANÚNCIO META', a.campaignName, `R$ ${a.dailyBudget}/dia`, a.hookAngle, a.audienceSegment]);
      });
    });
  }

  return (
    <div className="space-y-6">
      {/* Header Banner - Purple & Black */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0b0816] p-5 sm:p-6 rounded-2xl border border-purple-950/70 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-300 mb-1">
            <Radio className="w-3.5 h-3.5 animate-pulse text-purple-400" />
            <span>AGENTE DE PLANEJAMENTO DA PRESENÇA DIGITAL</span>
            <span>·</span>
            <span className="text-slate-400">Contexto Máximo & Picos de Audiência</span>
          </div>
          <h2 className="font-display text-xl font-black text-white">
            Cadeia Estratégica de Conteúdo & Presença de Marca
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Coordena DJs, local, horários de pico ({event.audience.peakEngagementHours.join(', ')}) e narrativa de bilheteria sincronizada.
          </p>
        </div>

        {planningResult && (
          <SheetsExportButton
            filename={`Planejamento_Digital_${event.id}`}
            title={`Planejamento Digital e Cadeia de Conteúdo - ${event.name}`}
            headers={sheetsHeaders}
            rows={sheetsRows}
            label="Exportar Grade Planejada"
          />
        )}
      </div>

      {/* Briefing Card with Parameters */}
      <div className="bg-[#0b0816] border border-purple-950/70 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-purple-950/60 pb-3">
          <span className="text-xs font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            CONTEXTO ALIMENTADO DO EVENTO
          </span>
          <span className="text-[11px] text-purple-300 font-mono">
            {event.genre} · {event.venue}
          </span>
        </div>

        {/* Feeding Context Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-[#120d24] p-3 rounded-xl border border-purple-900/40">
            <span className="text-slate-400 block text-[11px]">DJs e Lineup Ativo:</span>
            <span className="font-semibold text-white block truncate mt-0.5">
              {event.lineup.map(dj => dj.name).join(', ')}
            </span>
          </div>

          <div className="bg-[#120d24] p-3 rounded-xl border border-purple-900/40">
            <span className="text-slate-400 block text-[11px]">Picos Determinísticos de Audiência:</span>
            <div className="flex gap-1.5 mt-1">
              {event.audience.peakEngagementHours.map(h => (
                <span key={h} className="px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/40 font-mono font-bold text-[10px]">
                  {h}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-[#120d24] p-3 rounded-xl border border-purple-900/40">
            <span className="text-slate-400 block text-[11px]">Momento de Bilheteria:</span>
            <span className="font-semibold text-purple-300 block mt-0.5">
              {event.currentLote} (~{event.loteCountdownHours}h restantes)
            </span>
          </div>
        </div>

        {/* Strategic Audience & Planning Parameters */}
        <div className="space-y-3 pt-2 border-t border-purple-950/60">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-purple-300 mb-1 font-semibold flex items-center gap-1.5">
                <span>🎯 Tipo de Público & Tribo:</span>
              </label>
              <select
                value={audienceSegment}
                onChange={(e) => setAudienceSegment(e.target.value)}
                className="w-full bg-[#120d24] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs"
              >
                <option value="Jovens 18-24 anos (Tribo Urbana / Funk & Trap / Hype)">Jovens 18-24 anos (Funk, Trap & Hype)</option>
                <option value="Público 21-32 anos (Pista & Festival / Eletrônica & Tech House)">Público 21-32 anos (Eletrônica / Tech House)</option>
                <option value="Universitários 18-25 anos (Open Bar / Grupos de Amigos)">Universitários (Open Bar & Grupos de Amigos)</option>
                <option value="Público VIP / Camarote & Experiência Premium (25-35 anos)">Público VIP / Camarote & Alta Renda</option>
                <option value="Público Regional / Moradores Locais & Baladeiros">Público Regional / Moradores Locais</option>
              </select>
            </div>

            <div>
              <label className="block text-purple-300 mb-1 font-semibold flex items-center gap-1.5">
                <span>⚡ Gatilho Psicológico Predominante:</span>
              </label>
              <select
                value={psychologicalTrigger}
                onChange={(e) => setPsychologicalTrigger(e.target.value)}
                className="w-full bg-[#120d24] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs"
              >
                <option value="Urgência de Virada de Lote & Escassez Real">Urgência de Virada de Lote & Escassez Real</option>
                <option value="FOMO & Hype das Atrações (Lineup Drop)">FOMO & Hype das Atrações (Lineup Drop)</option>
                <option value="Prova Social & Vibe de Edições Anteriores">Prova Social & Vibe de Edições Anteriores</option>
                <option value="Pertencimento & Squad (Ninguém vai ficar de fora)">Pertencimento & Squad (Squads de Amigos)</option>
              </select>
            </div>

            <div>
              <label className="block text-purple-300 mb-1 font-semibold flex items-center gap-1.5">
                <span>💰 Ciclo Financeiro (Payday Timing):</span>
              </label>
              <select
                value={paydayCycle}
                onChange={(e) => setPaydayCycle(e.target.value)}
                className="w-full bg-[#120d24] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs"
              >
                <option value="Semana do Salário (5º dia útil / Maior conversão de compra)">Semana do Salário (5º dia útil / Maior poder)</option>
                <option value="Quinzena / Dia 15 a 20 (Adiantamento / Vale)">Quinzena / Adiantamento (Dia 15-20)</option>
                <option value="Sustentação Contínua (Foco em Parcelamento e Cartão)">Sustentação Contínua (Foco em Parcelamento)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Fase Estratégica do Funil:</label>
              <select
                value={strategyPhase}
                onChange={(e) => setStrategyPhase(e.target.value)}
                className="w-full bg-[#120d24] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="Sustentação de Vendas & Virada de Lote 3">Sustentação & Virada de Lote</option>
                <option value="Revelação de Lineup & DJ Spotlights">Revelação de Lineup & DJs</option>
                <option value="Últimas 48 Horas Antes do Evento">Semana do Evento / Reta Final</option>
                <option value="Pós-Evento & Aftermovie Release">Pós-Evento & Retenção</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Canais & Formato Prioritário:</label>
              <select
                value={primaryChannelFocus}
                onChange={(e) => setPrimaryChannelFocus(e.target.value)}
                className="w-full bg-[#120d24] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="Reels 9:16 + Stories com Enquetes e Link">Reels 9:16 + Stories com Enquetes e Link</option>
                <option value="TikTok Viral + Post Collab no Feed">TikTok Viral + Post Collab no Feed</option>
                <option value="Stories Intensivos de Escassez + Grupo VIP">Stories Intensivos de Escassez + Grupo VIP</option>
              </select>
            </div>

            <div className="flex gap-2 items-end">
              <div className="w-1/2">
                <label className="block text-slate-400 mb-1 font-medium">Dias:</label>
                <select
                  value={daysCount}
                  onChange={(e) => setDaysCount(Number(e.target.value))}
                  className="w-full bg-[#120d24] border border-purple-900/50 rounded-xl px-2 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value={3}>3 Dias</option>
                  <option value={7}>7 Dias</option>
                  <option value={14}>14 Dias</option>
                </select>
              </div>

              <div className="w-1/2">
                <button
                  onClick={handleGeneratePlan}
                  disabled={isLoading}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-purple-950/50 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Gerando...</span>
                    </>
                  ) : (
                    <>
                      <Radio className="w-3.5 h-3.5" />
                      <span>Gerar Grade</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: INTELIGÊNCIA HISTÓRICA POR GÊNERO & MELHORES HORÁRIOS DE POSTAGEM */}
      <div className="bg-[#0b0816] border border-purple-950/70 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-950/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-950/80 text-purple-400 border border-purple-800/40">
              <History className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  DADOS HISTÓRICOS & MELHOR HORÁRIO DE POSTAGEM
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950/90 text-purple-300 border border-purple-800/50">
                  {event.genre}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Comportamento auditado de usuários em eventos passados para sugerir o timing ideal de conversão e alcance orgânico.
              </p>
            </div>
          </div>

          {/* Genre Benchmark Switcher */}
          <div className="flex items-center gap-1.5 bg-[#120d24] p-1 rounded-xl border border-purple-900/40 self-start sm:self-auto">
            <button
              onClick={() => setSelectedGenreBenchmark('funk_trap')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                selectedGenreBenchmark === 'funk_trap'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Funk & Trap
            </button>
            <button
              onClick={() => setSelectedGenreBenchmark('eletronica')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                selectedGenreBenchmark === 'eletronica'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Eletrônica / House
            </button>
            <button
              onClick={() => setSelectedGenreBenchmark('geral')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                selectedGenreBenchmark === 'geral'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Festivais Gerais
            </button>
          </div>
        </div>

        {/* Behavioral Pattern Highlights */}
        {historicalInsight && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-[#120d24] p-3 rounded-xl border border-purple-900/40 space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-bold text-purple-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Picos de Scroll do Público:
              </span>
              <p className="font-semibold text-white text-[11px]">
                {historicalInsight.audienceBehaviorPatterns.peakHoursSummary}
              </p>
            </div>

            <div className="bg-[#120d24] p-3 rounded-xl border border-purple-900/40 space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-bold text-fuchsia-400 flex items-center gap-1">
                <Video className="w-3 h-3" />
                Formatos de Maior Retenção:
              </span>
              <p className="text-slate-300 text-[11px] truncate">
                {historicalInsight.audienceBehaviorPatterns.preferredFormats.join(' · ')}
              </p>
            </div>

            <div className="bg-[#120d24] p-3 rounded-xl border border-purple-900/40 space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                <Flame className="w-3 h-3" />
                Gatilhos Virais Comprovados:
              </span>
              <p className="text-slate-300 text-[11px] truncate">
                {historicalInsight.audienceBehaviorPatterns.viralTriggers.join(' · ')}
              </p>
            </div>

            <div className="bg-[#120d24] p-3 rounded-xl border border-purple-900/40 space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-bold text-rose-400 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Ponto de Corte (Drop-off):
              </span>
              <p className="text-slate-300 text-[11px] line-clamp-2">
                {historicalInsight.audienceBehaviorPatterns.retentionDropOffPoint}
              </p>
            </div>
          </div>
        )}

        {/* Best Posting Windows Cards */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              JANELAS HISTÓRICAS RECOMENDADAS DE POSTAGEM ({historicalInsight?.genre || event.genre}):
            </span>

            {planningResult && (
              <button
                onClick={handleApplyHistoricalTimesToSchedule}
                className="px-3 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
              >
                {appliedHistoricalTimes ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Horários Históricos Aplicados!</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <span>Aplicar Horários Históricos na Grade</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {historicalInsight?.bestPostingWindows.map((window, idx) => (
              <div 
                key={idx}
                className="bg-[#120d24] p-3.5 rounded-xl border border-purple-900/40 hover:border-purple-700/60 transition-all space-y-2"
              >
                <div className="flex items-center justify-between border-b border-purple-950/60 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-xs">{window.dayOfWeek}</span>
                    <span className="font-mono font-black text-purple-300 bg-purple-950/90 px-2 py-0.5 rounded text-[11px] border border-purple-800/40">
                      ⏰ {window.time}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                    {window.averageEngagementLift}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-purple-300">{window.objective}</span>
                    <span className="text-slate-400 font-mono">{window.conversionProbability}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    {window.reasoning}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {planningResult && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Strategy Summary Banner */}
          <div className="bg-[#0e091c] border border-purple-600/40 rounded-2xl p-5 space-y-3 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-mono font-semibold text-purple-400 uppercase">
                  DIRETRIZ ESTRATÉGICA CONSOLIDADA
                </span>
                <h3 className="font-display text-base font-bold text-white mt-0.5">
                  {planningResult.planningOverview?.strategyObjective}
                </h3>
              </div>

              <button
                onClick={handleSyncToCalendar}
                className="px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle className="w-4 h-4 text-purple-400" />
                <span>{synced ? 'Sincronizado com Sucesso!' : 'Sincronizar com o Calendário Virtual'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="bg-[#07050e] p-3 rounded-xl border border-purple-950/70">
                <span className="text-slate-400 block text-[10px]">Público & Enquadramento:</span>
                <p className="text-purple-300 font-medium text-[11px] truncate">
                  {planningResult.planningOverview?.audienceTribeSummary || audienceSegment}
                </p>
              </div>
              <div className="bg-[#07050e] p-3 rounded-xl border border-purple-950/70">
                <span className="text-slate-400 block text-[10px]">Tom de Voz:</span>
                <p className="text-slate-200 font-medium truncate">{planningResult.planningOverview?.toneOfVoice}</p>
              </div>
              <div className="bg-[#07050e] p-3 rounded-xl border border-purple-950/70">
                <span className="text-slate-400 block text-[10px]">Crescimento Projetado:</span>
                <p className="text-purple-300 font-mono font-bold">{planningResult.planningOverview?.projectedEngagementLift}</p>
              </div>
            </div>
          </div>

          {/* Day-by-Day Cards */}
          <div className="space-y-4">
            <span className="text-xs font-bold text-purple-300 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              CRONOGRAMA DE AÇÕES DIÁRIAS (4 PILARES INTEGRADOS):
            </span>

            {planningResult.schedule?.map((day: any, idx: number) => (
              <div key={idx} className="bg-[#0b0816] border border-purple-950/70 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-purple-950/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950/80 px-2.5 py-0.5 rounded-lg border border-purple-800/50">
                      {day.dateLabel}
                    </span>
                    <span className="text-sm font-bold text-white">
                      {day.milestoneLabel}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  {/* Pillar 1: Post */}
                  {day.post && (
                    <div className="bg-[#120d24] p-3.5 rounded-xl border border-purple-900/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-purple-300 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-purple-400" />
                          Post Feed
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/40">
                          ⏰ {day.post.scheduledTime}
                        </span>
                      </div>
                      <span className="font-bold text-white block text-[11px] truncate">
                        {day.post.title}
                      </span>
                      <p className="text-[11px] text-slate-300 bg-[#0a0714] p-2 rounded border border-purple-950/60 leading-relaxed italic">
                        "{day.post.copySnippet}"
                      </p>
                      {day.post.djTagged && (
                        <span className="text-[10px] text-purple-300 font-mono block">
                          DJ: {day.post.djTagged}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Pillar 2: Stories */}
                  <div className="bg-[#120d24] p-3.5 rounded-xl border border-purple-900/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-violet-300 flex items-center gap-1">
                        <Share2 className="w-3 h-3 text-violet-400" />
                        Stories ({day.stories?.length || 0})
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {day.stories?.map((st: any, i: number) => (
                        <div key={i} className="text-[11px] bg-[#0a0714] p-2 rounded border border-purple-950/60 space-y-0.5">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-semibold text-purple-300 uppercase">{st.format}</span>
                            <span className="font-mono text-slate-400">⏰ {st.scheduledTime}</span>
                          </div>
                          <p className="text-slate-300 text-[10px]">{st.copy}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pillar 3: Reels */}
                  {day.reel && (
                    <div className="bg-[#120d24] p-3.5 rounded-xl border border-fuchsia-950/60 hover:border-fuchsia-800/60 transition-all space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-fuchsia-300 flex items-center gap-1">
                          <Video className="w-3 h-3 text-fuchsia-400" />
                          Reel Viral
                        </span>
                        <div className="flex items-center gap-1">
                          {day.reel.trendFormat && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-fuchsia-950/90 text-fuchsia-300 border border-fuchsia-800/40">
                              {day.reel.trendFormat}
                            </span>
                          )}
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/40">
                            ⏰ {day.reel.scheduledTime}
                          </span>
                        </div>
                      </div>

                      <span className="font-bold text-white block text-[11px] truncate">
                        {day.reel.title}
                      </span>

                      <div className="p-2 rounded bg-[#0a0714] border border-purple-950/60 text-[10px] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-fuchsia-400 block">Gancho (0-3s):</span>
                          <span className="text-[9px] text-slate-400 font-mono">{day.reel.duration}</span>
                        </div>
                        <p className="text-slate-200 line-clamp-2">{day.reel.hook3s}</p>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedReelForModal(day.reel);
                          setShowReelModal(true);
                        }}
                        className="w-full py-1.5 px-2.5 rounded-lg bg-fuchsia-950/50 hover:bg-fuchsia-900/60 text-fuchsia-200 border border-fuchsia-800/50 font-bold text-[10px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-fuchsia-400" />
                        <span>Ver Roteiro Viral Completo</span>
                      </button>
                    </div>
                  )}

                  {/* Pillar 4: Ads */}
                  <div className="bg-[#120d24] p-3.5 rounded-xl border border-purple-900/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-200 flex items-center gap-1">
                        <Megaphone className="w-3 h-3 text-purple-400" />
                        Anúncio Sincronizado
                      </span>
                    </div>
                    {day.ads?.map((ad: any, i: number) => (
                      <div key={i} className="text-[11px] bg-[#0a0714] p-2 rounded border border-purple-950/60 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-purple-300 text-[10px] truncate max-w-[120px]">
                            {ad.campaignName}
                          </span>
                          <span className="font-mono text-slate-300 text-[10px]">
                            R$ {ad.dailyBudget}/dia
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-300">{ad.hookAngle}</p>
                        <span className="text-[9px] text-purple-400/80 block truncate font-mono">
                          Público: {ad.audienceSegment}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
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
        />
      )}
    </div>
  );
};
