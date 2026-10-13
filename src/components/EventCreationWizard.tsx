import React, { useState } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  AlertCircle, 
  Check, 
  Building2, 
  Ticket, 
  Music, 
  Calendar,
  DollarSign
} from 'lucide-react';
import { EventData } from '../types';

interface EventCreationWizardProps {
  onEventCreated: (event: EventData) => void;
  onCancel?: () => void;
}

export const EventCreationWizard: React.FC<EventCreationWizardProps> = ({ onEventCreated, onCancel }) => {
  // Step Navigation State (1: Identidade, 2: Bilheteria, 3: Lineup & Revisão)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form State - Pre-filled with INSONIA (Macaé, RJ)
  const [name, setName] = useState('INSONIA');
  const [tagline, setTagline] = useState('O Maior Encontro de Funk, Trap e Eletrônica');
  const [genre, setGenre] = useState('Funk, Trap e Eletrônica');
  const [city, setCity] = useState('Macaé, RJ');
  const [venue, setVenue] = useState('Espaço Macaé (Orla dos Cavaleiros)');
  const [date, setDate] = useState('2026-10-10');

  // Economics & Media
  const [capacity, setCapacity] = useState<string>('3500');
  const [ticketPriceLote, setTicketPriceLote] = useState<string>('80');
  const [currentLote, setCurrentLote] = useState('Lote 1');
  const [soldTickets, setSoldTickets] = useState<string>('0');
  const [totalAdBudget, setTotalAdBudget] = useState<string>('15000');
  const [spentAdBudget, setSpentAdBudget] = useState<string>('0');

  // Key Headliner / DJ (Strictly Optional)
  const [headlinerName, setHeadlinerName] = useState('Atração Principal (Headliner)');
  const [headlinerTime, setHeadlinerTime] = useState('02:00 - 03:30');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Calculate overall and step-specific completion progress
  const step1Filled = [
    Boolean(name.trim()),
    Boolean(genre.trim()),
    Boolean(city.trim()),
    Boolean(venue.trim()),
    Boolean(date)
  ].filter(Boolean).length;
  const step1Total = 5;

  const step2Filled = [
    Boolean(capacity && Number(capacity) > 0),
    Boolean(ticketPriceLote && Number(ticketPriceLote) > 0),
    Boolean(currentLote.trim()),
    Boolean(totalAdBudget && Number(totalAdBudget) >= 0)
  ].filter(Boolean).length;
  const step2Total = 4;

  const step3Filled = [
    Boolean(headlinerName.trim()),
    Boolean(headlinerTime.trim())
  ].filter(Boolean).length;
  const step3Total = 2;

  // Percentage for current step progress bar
  const stepProgress = 
    currentStep === 1 
      ? Math.round((step1Filled / step1Total) * 100)
      : currentStep === 2
      ? Math.round((step2Filled / step2Total) * 100)
      : Math.round((step3Filled / step3Total) * 100);

  // Overall progress percentage (33% per step base + intra-step bonus)
  const baseOverall = ((currentStep - 1) / 3) * 100;
  const intraStepBonus = (stepProgress / 100) * 33.33;
  const overallPercentage = Math.min(100, Math.round(baseOverall + intraStepBonus));

  const stepsConfig = [
    { number: 1, title: 'Identidade & Local', icon: Building2, desc: 'Nome, gênero e localidade' },
    { number: 2, title: 'Bilheteria & Mídia', icon: Ticket, desc: 'Lotação, ingressos e verba' },
    { number: 3, title: 'Atrações & Revisão', icon: Music, desc: 'Headliner e confirmação final' },
  ];

  const validateStep1 = () => {
    if (!name.trim()) {
      setErrorMsg('O nome do evento é obrigatório.');
      return false;
    }
    if (!genre.trim()) {
      setErrorMsg('O gênero musical do evento é obrigatório.');
      return false;
    }
    setErrorMsg('');
    return true;
  };

  const validateStep2 = () => {
    if (parseInt(capacity, 10) <= 0 || isNaN(parseInt(capacity, 10))) {
      setErrorMsg('Informe uma lotação válida para o evento.');
      return false;
    }
    setErrorMsg('');
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!validateStep2()) return;
      setCurrentStep(3);
    }
  };

  const handlePrev = () => {
    setErrorMsg('');
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const parsedCapacity = Math.max(0, parseInt(capacity, 10) || 0);
      const parsedPrice = Math.max(0, parseFloat(ticketPriceLote) || 0);
      const parsedSold = Math.max(0, parseInt(soldTickets, 10) || 0);
      const parsedBudget = Math.max(0, parseFloat(totalAdBudget) || 0);
      const parsedSpent = Math.max(0, parseFloat(spentAdBudget) || 0);

      const lineup = headlinerName.trim()
        ? [
            {
              id: `dj-${Date.now()}-1`,
              name: headlinerName.trim(),
              role: 'Atração Principal',
              timeSlot: headlinerTime.trim() || 'A definir',
              status: 'Confirmado' as const,
              instagramHandle: `@${headlinerName.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}`,
              followers: '-',
              engagementRate: '-'
            }
          ]
        : [];

      const payload = {
        name: name.trim(),
        tagline: tagline.trim(),
        genre: genre.trim() || 'Multicultural / Som Aberto',
        city: city.trim(),
        venue: venue.trim(),
        date: date || 'A definir',
        capacity: parsedCapacity,
        ticketPriceLote: parsedPrice,
        soldTickets: parsedSold,
        currentLote: currentLote.trim() || 'Lote 1',
        totalAdBudget: parsedBudget,
        spentAdBudget: parsedSpent,
        lineup,
        peakEngagementHours: ['18:00 - 20:00', '21:00 - 23:00', '00:00 - 02:00'],
        hourlyMetrics: [],
        calendar: {}
      };

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.event) {
        onEventCreated(data.event);
      } else {
        setErrorMsg(data.error || 'Erro ao criar evento.');
      }
    } catch (err: any) {
      console.error('Error creating event:', err);
      setErrorMsg('Falha de conexão ao criar o evento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto py-4 space-y-6">
      {/* Editorial Header */}
      <div className="space-y-1">
        <div className="label-tech flex items-center justify-between">
          <span>CONFIGURAÇÃO DE NOVO EVENTO</span>
          <span style={{ color: 'var(--accent)' }} className="font-bold">
            PASSO {currentStep} DE 3
          </span>
        </div>
        <h1 className="hero-title-v2 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#f8f8f8] uppercase">
          Cadastrar Novo Evento
        </h1>
        <p className="text-xs text-[var(--ink-dim)]">
          Preencha os parâmetros reais de produção e mídia. Todas as automações e críticas dos agentes partirão destes dados.
        </p>
      </div>

      {/* ANIMATED VISUAL PROGRESS BAR SECTION */}
      <div className="card-v2 p-4 space-y-3.5 shadow-xl">
        {/* Top Progress Telemetry Bar */}
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8b5cf6] animate-pulse" />
            <span className="label-tech text-white font-bold">
              PROGRESSO DO SETUP:
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-mono">
              Etapa {currentStep}/3 ·
            </span>
            <span className="text-sm font-bold font-mono text-[#8b5cf6]">
              {overallPercentage}%
            </span>
          </div>
        </div>

        {/* Primary Animated Progress Bar Track */}
        <div 
          className="w-full bg-[#1c1c21] h-2.5 rounded-full overflow-hidden border border-white/[0.08] relative p-0.5 shadow-inner"
          role="progressbar"
          aria-valuenow={overallPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div 
            className="h-full bg-gradient-to-r from-[#8b5cf6] via-[#a855f7] to-[#c084fc] rounded-full transition-all duration-500 ease-out relative shadow-[0_0_12px_rgba(139,92,246,0.6)]"
            style={{ width: `${overallPercentage}%` }}
          >
            {/* Shimmer light effect running across the bar */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite] w-full" />
          </div>
        </div>

        {/* Step Nodes Interactive Strip */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {stepsConfig.map((s) => {
            const isCompleted = s.number < currentStep;
            const isCurrent = s.number === currentStep;
            const Icon = s.icon;

            return (
              <button
                key={s.number}
                type="button"
                onClick={() => {
                  if (s.number === 1) setCurrentStep(1);
                  if (s.number === 2 && validateStep1()) setCurrentStep(2);
                  if (s.number === 3 && validateStep1() && validateStep2()) setCurrentStep(3);
                }}
                className={`p-2 rounded-[2px] border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  isCurrent
                    ? 'bg-[#8b5cf6]/15 border-[#8b5cf6] shadow-md shadow-[#8b5cf6]/10'
                    : isCompleted
                    ? 'bg-[#1c1c21] border-emerald-500/40 text-emerald-300'
                    : 'bg-[#141417] border-white/[0.06] text-slate-500 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold">
                    0{s.number}
                  </span>
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-[#8b5cf6]' : 'text-slate-500'}`} />
                  )}
                </div>
                <span className={`text-[11px] font-bold truncate ${isCurrent ? 'text-white' : isCompleted ? 'text-slate-200' : 'text-slate-500'}`}>
                  {s.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Micro Intra-Step Field Progress Bar */}
        <div className="pt-1 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span className="label-tech text-slate-400">
            CAMPOS NESTA ETAPA:
          </span>
          <div className="flex items-center gap-2">
            <div className="w-20 bg-[#1c1c21] h-1.5 rounded-full overflow-hidden border border-white/[0.08]">
              <div 
                className="h-full bg-[#8b5cf6] transition-all duration-300"
                style={{ width: `${stepProgress}%` }}
              />
            </div>
            <span className="text-[#8b5cf6] font-bold">
              {stepProgress}%
            </span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-[2px] text-red-200 text-xs flex items-center gap-2 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Multi-Step Form */}
      <form onSubmit={handleSubmit} className="card-v2 p-6 space-y-6 shadow-2xl">
        
        {/* STEP 1: Identidade & Local */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="border-b border-white/[0.08] pb-2 flex items-center justify-between">
              <h2 className="label-tech text-[#8b5cf6] font-bold">
                01. IDENTIDADE & LOCALIDADE
              </h2>
              <span className="label-tech text-slate-400">
                {step1Filled}/{step1Total} CAMPOS PREENCHIDOS
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Nome do Evento <span className="text-[#8b5cf6] font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: INSOMNIA Festival 2026"
                  className="w-full bg-[#1c1c21] border border-white/10 rounded-[2px] px-3.5 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#8b5cf6] font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Gênero Musical & Estilo <span className="text-[#8b5cf6] font-bold">*</span> <span className="text-slate-500 font-normal">(livre: digite qualquer gênero)</span>
                </label>
                <input
                  type="text"
                  required
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="Ex: Funk, Trap, Melodic Techno, Eletrônica, Rock, Sertanejo..."
                  className="w-full bg-[#1c1c21] border border-white/10 rounded-[2px] px-3.5 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#8b5cf6] font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Conceito / Tagline <span className="text-slate-500 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Ex: A noite que nunca termina"
                  className="w-full bg-[#1c1c21] border border-white/10 rounded-[2px] px-3.5 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#8b5cf6] font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Data do Evento</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#1c1c21] border border-white/10 rounded-[2px] px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#8b5cf6]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Cidade / UF</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex: Belo Horizonte, MG"
                    className="w-full bg-[#1c1c21] border border-white/10 rounded-[2px] px-3 py-2 text-white text-xs focus:outline-none focus:border-[#8b5cf6]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Local / Espaço</label>
                  <input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="Ex: Arena Sunset"
                    className="w-full bg-[#1c1c21] border border-white/10 rounded-[2px] px-3 py-2 text-white text-xs focus:outline-none focus:border-[#8b5cf6]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Bilheteria & Mídia Real */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="border-b border-white/[0.08] pb-2 flex items-center justify-between">
              <h2 className="label-tech text-[#8b5cf6] font-bold">
                02. CAPACIDADE, INGRESSOS & ORÇAMENTO
              </h2>
              <span className="label-tech text-slate-400">
                {step2Filled}/{step2Total} CAMPOS PREENCHIDOS
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Lotação Máxima (Ingressos) <span className="text-[#8b5cf6] font-bold">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="Ex: 3500"
                  className="w-full bg-[#1c1c21] border border-white/10 rounded-[2px] px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Preço do Lote Ativo (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={ticketPriceLote}
                  onChange={(e) => setTicketPriceLote(e.target.value)}
                  placeholder="Ex: 80"
                  className="w-full bg-[#1c1c21] border border-white/10 rounded-[2px] px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Nome do Lote Atual
                </label>
                <input
                  type="text"
                  value={currentLote}
                  onChange={(e) => setCurrentLote(e.target.value)}
                  placeholder="Ex: Lote 1"
                  className="w-full bg-[#1c1c21] border border-white/10 rounded-[2px] px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Ingressos Vendidos até agora
                </label>
                <input
                  type="number"
                  min="0"
                  value={soldTickets}
                  onChange={(e) => setSoldTickets(e.target.value)}
                  placeholder="0"
                  className="w-full bg-[#1c1c21] border border-white/10 rounded-[2px] px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#8b5cf6]"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Deixe 0 se as vendas ainda não abriram.
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Orçamento de Anúncios (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={totalAdBudget}
                  onChange={(e) => setTotalAdBudget(e.target.value)}
                  placeholder="Ex: 15000"
                  className="w-full bg-[#1c1c21] border border-white/10 rounded-[2px] px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Verba Paga até agora (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={spentAdBudget}
                  onChange={(e) => setSpentAdBudget(e.target.value)}
                  placeholder="0"
                  className="w-full bg-[#1c1c21] border border-white/10 rounded-[2px] px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#8b5cf6]"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Deixe 0 se os anúncios ainda não rodaram.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Lineup & Revisão Final */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="border-b border-white/[0.08] pb-2 flex items-center justify-between">
              <h2 className="label-tech text-[#8b5cf6] font-bold">
                03. ATRAÇÕES CONFIRMADAS & REVISÃO
              </h2>
              <span className="badge-tech">
                ETAPA FINAL
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Nome da Atração Principal / DJ <span className="text-slate-500 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={headlinerName}
                  onChange={(e) => setHeadlinerName(e.target.value)}
                  placeholder="Ex: DJ Alok, Vintage Culture, MC Cabelinho... (ou deixe vazio)"
                  className="w-full bg-[#1c1c21] border border-white/10 rounded-[2px] px-3 py-2 text-white text-xs focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Horário do Set
                </label>
                <input
                  type="text"
                  value={headlinerTime}
                  onChange={(e) => setHeadlinerTime(e.target.value)}
                  placeholder="Ex: 02:00 - 03:30"
                  className="w-full bg-[#1c1c21] border border-white/10 rounded-[2px] px-3 py-2 text-white text-xs focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>
            </div>

            {/* Tactical Summary Preview Card */}
            <div className="p-4 bg-[#1c1c21] border border-white/[0.08] rounded-[2px] space-y-2">
              <div className="label-tech text-[#8b5cf6] font-bold">
                RESUMO DA CONFIGURAÇÃO INICIAL:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px] text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Evento:</span>
                  <span className="text-white font-bold truncate block">{name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Data / Local:</span>
                  <span className="text-white truncate block">{date} · {city}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Lotação:</span>
                  <span className="text-white font-bold">{capacity} ingressos</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Lote Inicial:</span>
                  <span className="text-white">{currentLote} (R$ {ticketPriceLote})</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Orçamento Mídia:</span>
                  <span className="text-white font-bold">R$ {totalAdBudget}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Headliner:</span>
                  <span className="text-purple-300 truncate block">{headlinerName || 'Sem atração'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Wizard Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
          <div className="flex items-center gap-2">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="btn-v2 btn-v2-outline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>
            ) : onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="btn-v2 btn-v2-outline text-slate-500 hover:text-slate-300"
              >
                Cancelar
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn-v2 btn-v2-primary"
              >
                <span>Próximo Passo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="btn-v2 btn-v2-primary"
              >
                {isSubmitting ? (
                  <span>Criando evento...</span>
                ) : (
                  <>
                    <span>Cadastrar Evento</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
