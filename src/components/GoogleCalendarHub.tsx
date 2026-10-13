import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  Plus, 
  ExternalLink, 
  Trash2, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Bot, 
  LogOut, 
  CalendarCheck,
  CalendarPlus,
  Send,
  AlertTriangle,
  Zap,
  CheckCircle2,
  CalendarClock,
  ArrowRight,
  EyeOff,
  RotateCcw,
  SlidersHorizontal,
  Flame,
  FileSpreadsheet
} from 'lucide-react';
import { EventData, GoogleCalendarEvent, CalendarConflict } from '../types';
import { 
  signInWithGoogleCalendar, 
  signOutGoogleCalendar, 
  initCalendarAuth, 
  listCalendarEvents, 
  createCalendarEvent, 
  deleteCalendarEvent,
  getCachedAccessToken
} from '../services/googleCalendarService';
import { detectCalendarConflicts, generateSampleConflictEvent } from '../utils/conflictDetection';
import { SheetsExportButton } from './SheetsExportButton';
import { User } from 'firebase/auth';

interface GoogleCalendarHubProps {
  event: EventData;
  onUpdateEvent: (updated: EventData) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const GoogleCalendarHub: React.FC<GoogleCalendarHubProps> = ({
  event,
  onUpdateEvent,
  onNavigateToTab
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getCachedAccessToken());
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [eventsList, setEventsList] = useState<GoogleCalendarEvent[]>(event.googleCalendarEvents || []);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Conflict Detection States
  const [dismissedConflictIds, setDismissedConflictIds] = useState<Set<string>>(new Set());
  const [conflictFilter, setConflictFilter] = useState<'all' | 'critical' | 'warning' | 'dismissed'>('all');
  const [rescheduleModal, setRescheduleModal] = useState<{
    isOpen: boolean;
    conflict: CalendarConflict | null;
    customTime: string;
  }>({
    isOpen: false,
    conflict: null,
    customTime: ''
  });

  // New Event Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState(event.date || '2026-10-10');
  const [newEventStartTime, setNewEventStartTime] = useState('18:00');
  const [newEventEndTime, setNewEventEndTime] = useState('20:00');
  const [newEventLocation, setNewEventLocation] = useState(event.venue || event.city || '');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  // Confirmation Modal State (Mandatory for destructive/mutating operations per SKILL.md)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionLabel: string;
    isDestructive?: boolean;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    actionLabel: '',
    onConfirm: async () => {}
  });

  // Calculate dynamic conflicts between integrated event state and Google Calendar
  const allConflicts = useMemo(() => {
    return detectCalendarConflicts(event, eventsList);
  }, [event, eventsList]);

  const activeConflicts = useMemo(() => {
    return allConflicts.filter(c => !dismissedConflictIds.has(c.id));
  }, [allConflicts, dismissedConflictIds]);

  const criticalConflicts = useMemo(() => {
    return activeConflicts.filter(c => c.severity === 'critical');
  }, [activeConflicts]);

  const warningConflicts = useMemo(() => {
    return activeConflicts.filter(c => c.severity === 'warning');
  }, [activeConflicts]);

  const dismissedConflicts = useMemo(() => {
    return allConflicts.filter(c => dismissedConflictIds.has(c.id));
  }, [allConflicts, dismissedConflictIds]);

  const displayedConflicts = useMemo(() => {
    if (conflictFilter === 'critical') return criticalConflicts;
    if (conflictFilter === 'warning') return warningConflicts;
    if (conflictFilter === 'dismissed') return dismissedConflicts;
    return activeConflicts;
  }, [conflictFilter, activeConflicts, criticalConflicts, warningConflicts, dismissedConflicts]);

  // Track Auth state
  useEffect(() => {
    const unsubscribe = initCalendarAuth(
      (authenticatedUser, accessToken) => {
        setUser(authenticatedUser);
        setToken(accessToken);
        setIsLoadingAuth(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setIsLoadingAuth(false);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Save synced events to backend and update parent state
  const persistSyncedEvents = async (fetchedEvents: GoogleCalendarEvent[], userEmail?: string, userName?: string) => {
    setEventsList(fetchedEvents);
    try {
      const res = await fetch(`/api/events/${event.id}/google-calendar/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: fetchedEvents,
          userEmail: userEmail || user?.email || '',
          userName: userName || user?.displayName || ''
        })
      });

      const data = await res.json();
      if (data.success) {
        onUpdateEvent({
          ...event,
          googleCalendarEvents: fetchedEvents,
          integrations: {
            ...event.integrations,
            googleCalendar: {
              connected: true,
              userEmail: userEmail || user?.email || '',
              userName: userName || user?.displayName || '',
              lastSyncedAt: new Date().toISOString(),
              syncedEventsCount: fetchedEvents.length
            }
          }
        });
      }
    } catch (err) {
      console.error('Erro ao persistir sincronização no servidor:', err);
    }
  };

  // Google Login Handler
  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    setStatusMsg(null);
    try {
      const result = await signInWithGoogleCalendar();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setStatusMsg({
          type: 'success',
          text: `Conectado com sucesso como ${result.user.displayName || result.user.email}!`
        });

        // Automatically fetch events after sign in
        setIsSyncing(true);
        const fetched = await listCalendarEvents(result.accessToken);
        await persistSyncedEvents(fetched, result.user.email || '', result.user.displayName || '');
        setIsSyncing(false);
      }
    } catch (err: any) {
      console.error('Falha no login com Google Calendar:', err);
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Falha ao autenticar com o Google Calendar. Verifique o pop-up e tente novamente.'
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logout Handler
  const handleSignOut = async () => {
    try {
      await signOutGoogleCalendar();
      setUser(null);
      setToken(null);
      setStatusMsg({
        type: 'info',
        text: 'Desconectado do Google Calendar.'
      });
    } catch (err: any) {
      console.error('Erro ao desconectar:', err);
    }
  };

  // Sync / Refresh Google Calendar Events
  const handleRefreshEvents = async () => {
    if (!token) {
      handleGoogleSignIn();
      return;
    }

    setIsSyncing(true);
    setStatusMsg(null);
    try {
      const fetched = await listCalendarEvents(token);
      await persistSyncedEvents(fetched);
      setStatusMsg({
        type: 'success',
        text: `Agenda sincronizada com sucesso! ${fetched.length} eventos carregados.`
      });
    } catch (err: any) {
      console.error('Erro ao buscar eventos:', err);
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Erro ao sincronizar eventos do Google Calendar.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Prompt Confirmation to Push Key Milestones to Google Calendar
  const handleRequestPushMilestones = () => {
    if (!token) {
      setStatusMsg({ type: 'error', text: 'Conecte sua conta do Google Calendar primeiro.' });
      return;
    }

    const milestonesToCreate = [
      {
        summary: `🎉 ${event.name} - Dia do Evento`,
        description: `Evento oficial ${event.name}. Local: ${event.venue}, ${event.city}. Gênero: ${event.genre}. Capacidade: ${event.capacity} ingressos.`,
        location: `${event.venue}, ${event.city}`,
        start: { date: event.date },
        end: { date: event.date }
      },
      {
        summary: `⚡ ${event.name} - Virada do ${event.currentLote}`,
        description: `Alerta operacional: Virada prevista do lote ${event.currentLote} (R$ ${event.ticketPriceLote}). Pressão máxima em anúncios e stories de escassez.`,
        start: {
          dateTime: new Date(Date.now() + (event.loteCountdownHours || 24) * 60 * 60 * 1000).toISOString()
        },
        end: {
          dateTime: new Date(Date.now() + ((event.loteCountdownHours || 24) + 2) * 60 * 60 * 1000).toISOString()
        }
      }
    ];

    setConfirmModal({
      isOpen: true,
      title: 'Exportar Marcos do Evento para o Google Calendar',
      description: `Esta ação criará ${milestonesToCreate.length} eventos diretamente na sua agenda oficial do Google Calendar (O Grande Dia do Evento e a Virada de Lote). Deseja prosseguir com a gravação?`,
      actionLabel: 'Confirmar & Gravar na Agenda',
      isDestructive: false,
      onConfirm: async () => {
        setIsSyncing(true);
        try {
          const createdList: GoogleCalendarEvent[] = [];
          for (const m of milestonesToCreate) {
            const created = await createCalendarEvent(m, token);
            createdList.push(created);
          }

          const updatedAll = [...createdList, ...eventsList];
          await persistSyncedEvents(updatedAll);
          setStatusMsg({
            type: 'success',
            text: `${createdList.length} marcos gravados com sucesso no seu Google Calendar!`
          });
        } catch (err: any) {
          setStatusMsg({
            type: 'error',
            text: `Erro ao gravar marcos: ${err?.message}`
          });
        } finally {
          setIsSyncing(false);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Create Single Event with Confirmation
  const handleCreateCustomEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    const startDateTime = `${newEventDate}T${newEventStartTime}:00`;
    const endDateTime = `${newEventDate}T${newEventEndTime}:00`;

    setIsCreatingEvent(true);
    try {
      const created = await createCalendarEvent({
        summary: newEventTitle.trim(),
        description: newEventDesc.trim() || `Compromisso do evento ${event.name}`,
        location: newEventLocation.trim(),
        start: { dateTime: new Date(startDateTime).toISOString() },
        end: { dateTime: new Date(endDateTime).toISOString() }
      }, token || undefined);

      const updated = [created, ...eventsList];
      await persistSyncedEvents(updated);
      setShowCreateModal(false);
      setNewEventTitle('');
      setNewEventDesc('');
      setStatusMsg({
        type: 'success',
        text: `Evento "${created.summary}" adicionado ao Google Calendar!`
      });
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: `Erro ao criar evento: ${err?.message}`
      });
    } finally {
      setIsCreatingEvent(false);
    }
  };

  // Delete Event with Mandatory Confirmation Dialog
  const handleRequestDeleteEvent = (targetEvent: GoogleCalendarEvent) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remover Evento do Google Calendar',
      description: `Tem certeza que deseja excluir o evento "${targetEvent.summary}" do seu Google Calendar? Esta ação não pode ser desfeita.`,
      actionLabel: 'Excluir Evento',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteCalendarEvent(targetEvent.id, token || undefined);
          const filtered = eventsList.filter(e => e.id !== targetEvent.id);
          await persistSyncedEvents(filtered);
          setStatusMsg({
            type: 'success',
            text: `Evento "${targetEvent.summary}" removido do Google Calendar.`
          });
        } catch (err: any) {
          setStatusMsg({
            type: 'error',
            text: `Erro ao excluir: ${err?.message}`
          });
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Conflict Resolution Handler: Updates scheduledTime in event.calendar and persists to backend
  const handleApplyAlternativeTime = async (conflict: CalendarConflict, customTime?: string) => {
    const timeToApply = customTime || conflict.suggestedAlternativeTime;
    if (!timeToApply) {
      setDismissedConflictIds(prev => new Set(prev).add(conflict.id));
      setStatusMsg({
        type: 'info',
        text: `Alerta "${conflict.task.title}" marcado como resolvido.`
      });
      return;
    }

    const dateKey = conflict.date;
    const currentPlan = event.calendar?.[dateKey];
    if (!currentPlan) {
      setDismissedConflictIds(prev => new Set(prev).add(conflict.id));
      return;
    }

    const updatedPlan = { ...currentPlan };

    if (conflict.task.category === 'post_feed') {
      updatedPlan.posts = (updatedPlan.posts || []).map(p =>
        p.id === conflict.task.id ? { ...p, scheduledTime: timeToApply } : p
      );
    } else if (conflict.task.category === 'reel_script') {
      updatedPlan.reels = (updatedPlan.reels || []).map(r =>
        r.id === conflict.task.id ? { ...r, scheduledTime: timeToApply } : r
      );
    } else if (conflict.task.category === 'story_sequence') {
      updatedPlan.stories = (updatedPlan.stories || []).map(s =>
        s.id === conflict.task.id ? { ...s, scheduledTime: timeToApply } : s
      );
    }

    const updatedEvent: EventData = {
      ...event,
      calendar: {
        ...event.calendar,
        [dateKey]: updatedPlan
      }
    };

    onUpdateEvent(updatedEvent);
    setDismissedConflictIds(prev => new Set(prev).add(conflict.id));
    setRescheduleModal({ isOpen: false, conflict: null, customTime: '' });

    try {
      await fetch(`/api/events/${event.id}/calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateKey, dayData: updatedPlan })
      });

      setStatusMsg({
        type: 'success',
        text: `Horário de "${conflict.task.title}" remanejado com sucesso para às ${timeToApply}! Conflito com "${conflict.calendarEvent.summary}" resolvido.`
      });
    } catch (err: any) {
      console.error('Erro ao atualizar horário no servidor:', err);
    }
  };

  // Dismiss conflict handler
  const handleDismissConflict = (conflictId: string) => {
    setDismissedConflictIds(prev => new Set(prev).add(conflictId));
    setStatusMsg({
      type: 'info',
      text: 'Conflito marcado como resolvido/ignorado nesta sessão.'
    });
  };

  // Restore dismissed conflicts
  const handleRestoreDismissed = () => {
    setDismissedConflictIds(new Set());
    setStatusMsg({
      type: 'info',
      text: 'Todos os alertas de sobreposição foram reativados.'
    });
  };

  // Simulate a realistic conflict event to test detection
  const handleSimulateConflictScenario = async () => {
    const sample = generateSampleConflictEvent(event);
    const updated = [sample, ...eventsList];
    await persistSyncedEvents(updated);
    setStatusMsg({
      type: 'info',
      text: `Compromisso simulado ("${sample.summary}") adicionado para às 18:00 no dia ${sample.start.dateTime?.slice(0, 10)}. Conflitos detectados!`
    });
  };

  return (
    <div className="space-y-6">
      
      {/* 1. HERO BANNER: GOOGLE CALENDAR SUITE */}
      <div className="hero-card-v2 p-6 sm:p-8 space-y-4 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
          <div className="label-tech flex items-center gap-2">
            <span>INTEGRAÇÃO GOOGLE WORKSPACE</span>
            <span className="text-white/20">·</span>
            <span style={{ color: 'var(--accent)' }} className="font-bold">GOOGLE CALENDAR</span>
            <span className="text-white/20">·</span>
            <span>CONSULTA & AGENDA DA IA</span>
          </div>

          <div className="label-tech text-slate-400">
            EVENTO: <span className="text-white font-bold">{event.name.toUpperCase()}</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <h1 className="hero-title-v2 text-3xl sm:text-4xl text-[#f8f8f8] leading-none uppercase">
              GOOGLE CALENDAR INTELLIGENCE
            </h1>
            <p className="text-xs sm:text-sm text-[var(--ink-dim)] leading-relaxed">
              Integração nativa com sua agenda Google. O sistema consulta datas reais e compromissos para alimentar as tomadas de decisão da IA, evitar choques de datas na produção e organizar o cronograma de lançamentos.
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {token ? (
              <>
                <button
                  onClick={handleRefreshEvents}
                  disabled={isSyncing}
                  className="btn-v2 btn-v2-primary"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Agenda'}</span>
                </button>

                <button
                  onClick={handleRequestPushMilestones}
                  disabled={isSyncing}
                  className="btn-v2 btn-v2-outline"
                >
                  <CalendarPlus className="w-3.5 h-3.5 text-[#8b5cf6]" />
                  <span>Gravar Marcos na Agenda</span>
                </button>

                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-v2 btn-v2-outline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Compromisso</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoggingIn}
                className="btn-v2 btn-v2-primary"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>{isLoggingIn ? 'Conectando...' : 'Conectar Google Calendar'}</span>
              </button>
            )}
          </div>
        </div>

        {/* AI & Intelligence Sync Notice */}
        <div className="ai-note-v2 text-xs text-purple-200 mt-2">
          <span className="font-mono font-bold text-[#8b5cf6] shrink-0 uppercase tracking-wider flex items-center gap-1">
            <Bot className="w-3.5 h-3.5" />
            [SUPORTE À INTELIGÊNCIA ARTIFICIAL]:
          </span>
          <span>
            Os eventos sincronizados abaixo são injetados automaticamente no contexto do <strong>Agente Principal (INSOMNIA)</strong> e do <strong>Agente de Planejamento</strong>. Isso permite que a IA recomende disparos de campanhas sem conflito com compromissos pessoais e monitore contagens regressivas para a virada do lote.
          </span>
        </div>
      </div>

      {/* TOP CONFLICT DETECTION ALERT BANNER */}
      {criticalConflicts.length > 0 ? (
        <div className="p-4 sm:p-5 rounded-[4px] border border-rose-500/60 bg-gradient-to-r from-rose-950/80 via-[#180a14] to-[#141417] text-white shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-[2px] bg-rose-600/20 text-rose-400 border border-rose-500/50 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="badge-tech bg-rose-500/20 text-rose-300 border-rose-500/50 font-bold">
                  {criticalConflicts.length} {criticalConflicts.length === 1 ? 'CONFLITO CRÍTICO' : 'CONFLITOS CRÍTICOS'} DETECTADO(S)
                </span>
                <span className="label-tech text-rose-300 font-bold">
                  SOBREPOSIÇÃO DE HORÁRIO COM O GOOGLE CALENDAR
                </span>
              </div>
              <h3 className="font-display font-extrabold text-sm text-white tracking-tight uppercase">
                Disparos de campanhas coincidem diretamente com seus compromissos
              </h3>
              <p className="text-xs text-rose-200/80 max-w-2xl leading-relaxed">
                Tarefas agendadas (como posts de alto engajamento, reels virais ou campanhas de tráfego) estão no mesmo horário de reuniões registradas na sua agenda. Há risco de falta de supervisão nos primeiros 30 minutos de tração algorítmica.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <button
              onClick={() => {
                setConflictFilter('critical');
                const el = document.getElementById('conflict-center-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-v2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/60"
            >
              <span>Resolver {criticalConflicts.length} Conflitos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : warningConflicts.length > 0 ? (
        <div className="p-4 rounded-[4px] border border-amber-500/50 bg-gradient-to-r from-amber-950/60 via-[#1c1810] to-[#141417] text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-[2px] bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="badge-tech bg-amber-500/20 text-amber-300 border-amber-500/40">
                  {warningConflicts.length} ALERTA(S) DE COINCIDÊNCIA
                </span>
                <span className="text-xs font-bold text-white uppercase font-display">
                  Alinhamento de Marcos & Tráfego Pago
                </span>
              </div>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Existem compromissos em datas de virada de lote ou campanhas com verba de mídia ativa. Veja as recomendações preventivas.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setConflictFilter('warning');
              const el = document.getElementById('conflict-center-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="btn-v2 btn-v2-outline border-amber-500/50 text-amber-300 hover:border-amber-400 self-start md:self-center shrink-0"
          >
            <span>Examinar Alertas</span>
          </button>
        </div>
      ) : (
        <div className="p-3.5 rounded-[4px] border border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-[#0e1713] to-[#141417] text-white flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs text-emerald-200 font-sans">
              <strong className="text-white font-mono uppercase tracking-wider">AGENDA 100% ALINHADA:</strong> Nenhum conflito de horário ou sobreposição entre campanhas de marketing e seus eventos do Google Calendar.
            </span>
          </div>
          <button
            onClick={handleSimulateConflictScenario}
            className="text-[11px] font-mono text-purple-300 hover:text-white underline underline-offset-2 shrink-0 cursor-pointer"
            title="Simula uma reunião com patrocinadores às 18h no dia 05/10/2026 para testar o detector"
          >
            Simular Conflito de Teste
          </button>
        </div>
      )}

      {/* FEEDBACK BANNER */}
      {statusMsg && (
        <div className={`p-3.5 rounded-[2px] border text-xs flex items-center justify-between gap-3 animate-in fade-in duration-150 ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200' 
            : statusMsg.type === 'error'
            ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
            : 'bg-[#1c1c21] border-white/10 text-slate-300'
        }`}>
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : statusMsg.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CalendarIcon className="w-4 h-4 text-[#8b5cf6] shrink-0" />
            )}
            <span className="font-mono">{statusMsg.text}</span>
          </div>
          <button 
            onClick={() => setStatusMsg(null)}
            className="text-slate-400 hover:text-white font-mono text-[11px] cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. AUTH STATUS & CONNECTION STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Auth Status */}
        <div className="card-v2 p-4 space-y-3">
          <div className="label-tech text-slate-400 flex items-center justify-between border-b border-white/[0.08] pb-2">
            <span>CONEXÃO COM A CONTA GOOGLE</span>
            <span className={`w-2 h-2 rounded-full ${token ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          </div>

          {token && user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-9 h-9 rounded-full border border-white/10" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 flex items-center justify-center text-white font-bold text-xs font-mono">
                    {(user.displayName || user.email || 'G')[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate font-sans">
                    {user.displayName || 'Produtor Autenticado'}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 truncate">
                    {user.email}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-white/[0.06]">
                <span className="badge-tech text-emerald-300 border-emerald-500/40 bg-emerald-500/10">
                  OAuth Conectado
                </span>
                <button
                  onClick={handleSignOut}
                  className="font-mono text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Desconectar</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Conecte sua conta Google para sincronizar os eventos do calendário.
              </p>

              {/* Official Google Button Style as required by SKILL.md */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoggingIn}
                className="w-full flex items-center justify-center gap-3 py-2 px-4 rounded-[2px] bg-white hover:bg-slate-100 text-slate-800 font-sans font-semibold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
                <span>{isLoggingIn ? 'Autenticando...' : 'Sign in with Google'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Card 2: Conflict & Agenda Telemetry */}
        <div className="card-v2 p-4 space-y-2">
          <div className="label-tech text-slate-400 border-b border-white/[0.08] pb-2 flex items-center justify-between">
            <span>DETECÇÃO DE CONFLITOS</span>
            {activeConflicts.length > 0 ? (
              <span className="badge-tech bg-rose-500/20 text-rose-300 border-rose-500/40">
                {activeConflicts.length} Ativo(s)
              </span>
            ) : (
              <span className="badge-tech bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                100% Livre
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
            <div className="p-2.5 bg-[#1c1c21] rounded-[2px] border border-white/[0.06]">
              <span className="label-tech text-slate-500 block text-[9px]">SOBREPOSIÇÕES CRÍTICAS</span>
              <span className={`text-xl font-bold mt-1 block ${criticalConflicts.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {criticalConflicts.length}
              </span>
            </div>
            <div className="p-2.5 bg-[#1c1c21] rounded-[2px] border border-white/[0.06]">
              <span className="label-tech text-slate-500 block text-[9px]">TOTAL EVENTOS SYNC</span>
              <span className="text-xl font-bold text-white mt-1 block">{eventsList.length}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            {activeConflicts.length > 0
              ? `${activeConflicts.length} tarefa(s) ou campanha(s) disputando horário com seus eventos.`
              : 'Nenhum choque de horário entre as campanhas automáticas e sua agenda.'}
          </p>
        </div>

        {/* Card 3: AI Consultation Actions */}
        <div className="card-v2 p-4 space-y-3">
          <div className="label-tech text-slate-400 border-b border-white/[0.08] pb-2 flex items-center justify-between">
            <span>CONSULTAR COM IA</span>
            <Sparkles className="w-3.5 h-3.5 text-[#8b5cf6]" />
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            Deseja que o <strong>Agente Principal</strong> avalie a sua agenda e aponte conflitos ou melhores dias para o evento?
          </p>
          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={() => onNavigateToTab?.('master_chat')}
              className="btn-v2 btn-v2-primary w-full"
            >
              <Send className="w-3 h-3" />
              <span>Perguntar ao Agente IA</span>
            </button>
            <button
              onClick={() => onNavigateToTab?.('calendar')}
              className="btn-v2 btn-v2-outline w-full"
            >
              <CalendarCheck className="w-3 h-3" />
              <span>Ver Calendário Multicanal</span>
            </button>
          </div>
        </div>

      </div>

      {/* 3. DEDICATED CONFLICT DETECTION CENTER */}
      <div id="conflict-center-section" className="card-v2 space-y-4">
        <div className="border-b border-white/[0.08] pb-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-[2px] bg-[#8b5cf6]/20 text-[#8b5cf6] border border-[#8b5cf6]/40">
                <CalendarClock className="w-4 h-4" />
              </div>
              <h2 className="label-tech text-[#8b5cf6] font-bold text-sm">
                CENTRAL DE DETECÇÃO DE CONFLITOS (CONFLICT DETECTION ENGINE)
              </h2>
            </div>
            <p className="text-xs text-[var(--ink-dim)] mt-1">
              Rastreamento determinístico entre disparos de anúncios, posts programados e eventos no Google Calendar
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {allConflicts.length > 0 && (
              <SheetsExportButton
                filename={`Conflitos_Agenda_${event.id}`}
                title={`Relatório de Conflitos de Agenda - ${event.name}`}
                headers={['Severidade', 'Data', 'Tarefa / Campanha', 'Canal / Formato', 'Compromisso Google Calendar', 'Horário Conflito', 'Ação Recomendada']}
                rows={allConflicts.map(c => [
                  c.severity.toUpperCase(),
                  c.date,
                  c.task.title,
                  c.task.channelOrFormat,
                  c.calendarEvent.summary,
                  `${c.calendarEvent.startTimeFormatted}${c.calendarEvent.endTimeFormatted ? ` - ${c.calendarEvent.endTimeFormatted}` : ''}`,
                  c.recommendedAction
                ])}
                label="EXPORTAR CONFLITOS"
              />
            )}

            <button
              onClick={handleSimulateConflictScenario}
              className="btn-v2 btn-v2-outline text-[11px]"
              title="Adiciona uma reunião de teste na mesma data de posts programados"
            >
              <Plus className="w-3 h-3" />
              <span>+ Simular Conflito</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-1 border-b border-white/[0.04] pb-3">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="label-tech text-slate-500 mr-1">FILTRAR:</span>
            <button
              onClick={() => setConflictFilter('all')}
              className={`px-2.5 py-1 rounded-[2px] font-mono text-[11px] transition-colors cursor-pointer ${
                conflictFilter === 'all'
                  ? 'bg-[#8b5cf6] text-white font-bold'
                  : 'bg-[#1c1c21] text-slate-400 hover:text-white border border-white/10'
              }`}
            >
              Todos ({activeConflicts.length})
            </button>
            <button
              onClick={() => setConflictFilter('critical')}
              className={`px-2.5 py-1 rounded-[2px] font-mono text-[11px] transition-colors cursor-pointer ${
                conflictFilter === 'critical'
                  ? 'bg-rose-600 text-white font-bold'
                  : 'bg-[#1c1c21] text-rose-300 hover:text-white border border-rose-900/40'
              }`}
            >
              Críticos ({criticalConflicts.length})
            </button>
            <button
              onClick={() => setConflictFilter('warning')}
              className={`px-2.5 py-1 rounded-[2px] font-mono text-[11px] transition-colors cursor-pointer ${
                conflictFilter === 'warning'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-[#1c1c21] text-amber-300 hover:text-white border border-amber-900/40'
              }`}
            >
              Alertas ({warningConflicts.length})
            </button>
            {dismissedConflictIds.size > 0 && (
              <button
                onClick={() => setConflictFilter('dismissed')}
                className={`px-2.5 py-1 rounded-[2px] font-mono text-[11px] transition-colors cursor-pointer ${
                  conflictFilter === 'dismissed'
                    ? 'bg-slate-700 text-white font-bold'
                    : 'bg-[#1c1c21] text-slate-500 hover:text-slate-300 border border-white/10'
                }`}
              >
                Dispensados ({dismissedConflictIds.size})
              </button>
            )}
          </div>

          {dismissedConflictIds.size > 0 && (
            <button
              onClick={handleRestoreDismissed}
              className="text-[11px] font-mono text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restaurar {dismissedConflictIds.size} alertas dispensados</span>
            </button>
          )}
        </div>

        {/* Conflicts List */}
        {displayedConflicts.length === 0 ? (
          <div className="p-8 text-center space-y-2 bg-[#1c1c21] rounded-[2px] border border-white/[0.06]">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="font-display font-extrabold text-xs text-white uppercase tracking-wider">
              Nenhum conflito encontrado para esta visualização
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              {conflictFilter === 'dismissed'
                ? 'Nenhum alerta foi dispensado nesta sessão.'
                : 'Todas as tarefas e campanhas filtradas estão com janelas horárias desimpedidas em relação aos seus eventos do Google Calendar.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedConflicts.map((conflict) => {
              const isCritical = conflict.severity === 'critical';
              const isDismissed = dismissedConflictIds.has(conflict.id);

              return (
                <div
                  key={conflict.id}
                  className={`p-4 rounded-[4px] border transition-all ${
                    isDismissed
                      ? 'bg-[#141417]/50 border-white/5 opacity-60'
                      : isCritical
                      ? 'bg-gradient-to-b from-[#1a0f18] to-[#141417] border-rose-500/40 hover:border-rose-500/70'
                      : 'bg-gradient-to-b from-[#19150f] to-[#141417] border-amber-500/30 hover:border-amber-500/60'
                  }`}
                >
                  {/* Card Header Tag */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`badge-tech font-bold ${
                        isCritical
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}>
                        {isCritical ? 'CRÍTICO: SOBREPOSIÇÃO DE HORÁRIO' : 'ALERTA: COINCIDÊNCIA DE DATA'}
                      </span>
                      <span className="label-tech text-white font-mono">
                        DATA: {conflict.date}
                      </span>
                    </div>

                    <div className="label-tech text-slate-400 flex items-center gap-2">
                      <span>TIPO: {conflict.task.category.toUpperCase().replace('_', ' ')}</span>
                      {isDismissed && (
                        <span className="text-slate-500">(Dispensado)</span>
                      )}
                    </div>
                  </div>

                  {/* Side-by-Side Comparison: Task vs Calendar Event */}
                  <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
                    
                    {/* Left: Automated Task / Campaign */}
                    <div className="md:col-span-5 p-3 rounded-[2px] bg-[#1c1c21] border border-white/[0.06] space-y-1.5">
                      <div className="label-tech text-[#8b5cf6] flex items-center justify-between">
                        <span>TAREFA / DISPARO AUTOMATIZADO</span>
                        {conflict.task.scheduledTime && (
                          <span className="font-mono text-white font-bold bg-[#8b5cf6]/20 px-1.5 py-0.5 rounded-[2px] border border-[#8b5cf6]/40">
                            {conflict.task.scheduledTime}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-white font-sans line-clamp-1">
                        {conflict.task.title}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 flex-wrap">
                        <span className="text-purple-300">{conflict.task.channelOrFormat}</span>
                        {conflict.task.budgetOrDetails && (
                          <span className="text-emerald-400">· {conflict.task.budgetOrDetails}</span>
                        )}
                      </div>
                    </div>

                    {/* Center: Conflict Collision Icon */}
                    <div className="md:col-span-1 flex items-center justify-center py-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                        isCritical
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      }`} title="Sobreposição detectada">
                        {isCritical ? <AlertTriangle className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                      </div>
                    </div>

                    {/* Right: Google Calendar Meeting */}
                    <div className="md:col-span-5 p-3 rounded-[2px] bg-[#1c1c21] border border-white/[0.06] space-y-1.5">
                      <div className="label-tech text-slate-400 flex items-center justify-between">
                        <span>COMPROMISSO NO GOOGLE CALENDAR</span>
                        <span className="font-mono text-white font-bold bg-white/[0.08] px-1.5 py-0.5 rounded-[2px] border border-white/10">
                          {conflict.calendarEvent.startTimeFormatted}
                          {conflict.calendarEvent.endTimeFormatted ? ` - ${conflict.calendarEvent.endTimeFormatted}` : ''}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-white font-sans line-clamp-1">
                        {conflict.calendarEvent.summary}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 truncate">
                        {conflict.calendarEvent.location ? (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate">{conflict.calendarEvent.location}</span>
                          </span>
                        ) : (
                          <span>Sem local informado</span>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Operational Impact Notice */}
                  <div className="mt-3 p-2.5 rounded-[2px] bg-[#100d16] border border-white/[0.06] text-xs text-slate-300 space-y-1">
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-[10px] text-purple-400 font-bold uppercase tracking-wider shrink-0 mt-0.5">
                        [IMPACTO & DIAGNÓSTICO]:
                      </span>
                      <span className="leading-snug text-slate-300">
                        {conflict.explanation}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 pt-1 border-t border-white/[0.04]">
                      <span className="font-mono text-[10px] text-emerald-400 font-bold uppercase tracking-wider shrink-0 mt-0.5">
                        [RECOMENDAÇÃO]:
                      </span>
                      <span className="leading-snug text-emerald-300/90">
                        {conflict.recommendedAction}
                      </span>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {conflict.suggestedAlternativeTime && (
                        <button
                          onClick={() => handleApplyAlternativeTime(conflict)}
                          className="btn-v2 btn-v2-primary text-[11px] py-1.5 px-3"
                          title={`Remaneja automaticamente para às ${conflict.suggestedAlternativeTime}`}
                        >
                          <Zap className="w-3 h-3" />
                          <span>Aplicar Horário Sugerido ({conflict.suggestedAlternativeTime})</span>
                        </button>
                      )}

                      {conflict.task.scheduledTime && (
                        <button
                          onClick={() => setRescheduleModal({
                            isOpen: true,
                            conflict,
                            customTime: conflict.suggestedAlternativeTime || '20:30'
                          })}
                          className="btn-v2 btn-v2-outline text-[11px] py-1.5 px-3"
                        >
                          <Clock className="w-3 h-3" />
                          <span>Ajustar Horário Manualmente</span>
                        </button>
                      )}

                      <button
                        onClick={() => onNavigateToTab?.('calendar')}
                        className="btn-v2 btn-v2-outline text-[11px] py-1.5 px-3"
                      >
                        <CalendarCheck className="w-3 h-3" />
                        <span>Ver no Calendário</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {isDismissed ? (
                        <button
                          onClick={() => {
                            setDismissedConflictIds(prev => {
                              const next = new Set(prev);
                              next.delete(conflict.id);
                              return next;
                            });
                          }}
                          className="text-purple-400 hover:text-purple-300 font-mono text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reativar Alerta</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDismissConflict(conflict.id)}
                          className="text-slate-500 hover:text-slate-300 font-mono text-[11px] flex items-center gap-1 cursor-pointer"
                          title="Dispensar este alerta"
                        >
                          <EyeOff className="w-3 h-3" />
                          <span>Ignorar / Resolvido</span>
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. EVENT LIST SECTION */}
      <div className="card-v2 space-y-4">
        <div className="border-b border-white/[0.08] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="label-tech text-[#8b5cf6] font-bold">
              EVENTOS & COMPROMISSOS REGISTRADOS NO GOOGLE CALENDAR
            </h2>
            <p className="text-xs text-[var(--ink-dim)] mt-0.5">
              Consulte datas, horários e locais diretamente sincronizados da sua conta
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="badge-tech">
              {eventsList.length} EVENTOS
            </span>
            <button
              onClick={handleRefreshEvents}
              disabled={isSyncing}
              className="p-1.5 rounded-[2px] bg-[#1c1c21] hover:bg-[#25252c] text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
              title="Atualizar lista"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {eventsList.length === 0 ? (
          <div className="p-12 text-center space-y-3 bg-[#1c1c21] rounded-[2px] border border-white/[0.06]">
            <CalendarIcon className="w-8 h-8 text-slate-500 mx-auto" />
            <h3 className="font-display font-extrabold text-sm text-white uppercase">
              Nenhum evento do Google Calendar sincronizado
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              {token 
                ? 'Sua agenda não possui eventos nos próximos dias ou a lista ainda não foi atualizada. Clique em "Sincronizar Agenda" para carregar ou adicione um novo compromisso.'
                : 'Conecte sua conta do Google Calendar para importar sua agenda e permitir que a IA consulte suas datas.'}
            </p>
            <div className="pt-2 flex justify-center gap-2">
              {token ? (
                <button
                  onClick={handleRequestPushMilestones}
                  className="btn-v2 btn-v2-primary"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  <span>Gravar Marcos do Evento Agora</span>
                </button>
              ) : (
                <button
                  onClick={handleGoogleSignIn}
                  className="btn-v2 btn-v2-primary"
                >
                  <span>Conectar Google Calendar</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {eventsList.map((item) => {
              const startFormatted = item.start.dateTime 
                ? new Date(item.start.dateTime).toLocaleString('pt-BR', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })
                : item.start.date || 'Data integral';

              const isOfficialEvent = item.summary.toLowerCase().includes(event.name.toLowerCase());

              return (
                <div 
                  key={item.id} 
                  className="py-3.5 px-2 hover:bg-[#1c1c21] transition-colors rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white font-sans">
                        {item.summary}
                      </span>
                      {isOfficialEvent && (
                        <span className="badge-tech text-purple-300">
                          Marco do Evento
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#8b5cf6]" />
                        <span>{startFormatted}</span>
                      </span>

                      {item.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span className="truncate max-w-[200px]">{item.location}</span>
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-[11px] text-slate-500 font-sans line-clamp-1 max-w-xl">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.htmlLink && (
                      <a
                        href={item.htmlLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-[2px] bg-[#1c1c21] hover:bg-[#282832] text-slate-300 hover:text-white border border-white/10 transition-colors"
                        title="Ver no Google Calendar"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    <button
                      onClick={() => handleRequestDeleteEvent(item)}
                      className="p-1.5 rounded-[2px] bg-[#1c1c21] hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-white/10 hover:border-rose-800/40 transition-colors cursor-pointer"
                      title="Excluir evento (com confirmação)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. CREATE NEW CALENDAR EVENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
          <div className="card-v2 w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="border-b border-white/[0.08] pb-3 flex items-center justify-between">
              <div>
                <h3 className="label-tech text-[#8b5cf6] font-bold">
                  NOVO COMPROMISSO NO GOOGLE CALENDAR
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Adiciona diretamente à sua agenda Google conectada
                </p>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white font-mono text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomEvent} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Título do Evento / Compromisso <span className="text-[#8b5cf6]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="Ex: Reunião com Patrocinadores / Checagem de Som"
                  className="w-full bg-[#1c1c21] border border-white/10 rounded-[2px] px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full bg-[#1c1c21] border border-white/10 rounded-[2px] px-3 py-2 text-white font-mono focus:outline-none focus:border-[#8b5cf6]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Início</label>
                  <input
                    type="time"
                    required
                    value={newEventStartTime}
                    onChange={(e) => setNewEventStartTime(e.target.value)}
                    className="w-full bg-[#1c1c21] border border-white/10 rounded-[2px] px-3 py-2 text-white font-mono focus:outline-none focus:border-[#8b5cf6]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Fim</label>
                  <input
                    type="time"
                    required
                    value={newEventEndTime}
                    onChange={(e) => setNewEventEndTime(e.target.value)}
                    className="w-full bg-[#1c1c21] border border-white/10 rounded-[2px] px-3 py-2 text-white font-mono focus:outline-none focus:border-[#8b5cf6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Local / Espaço</label>
                <input
                  type="text"
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  placeholder="Ex: Espaço Macaé (Orla dos Cavaleiros)"
                  className="w-full bg-[#1c1c21] border border-white/10 rounded-[2px] px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Descrição / Pauta</label>
                <textarea
                  rows={3}
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  placeholder="Detalhes ou metas para a reunião..."
                  className="w-full bg-[#1c1c21] border border-white/10 rounded-[2px] px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-v2 btn-v2-outline"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingEvent || !newEventTitle.trim()}
                  className="btn-v2 btn-v2-primary"
                >
                  {isCreatingEvent ? 'Gravando...' : 'Gravar no Google Calendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. RESCHEDULE CONFLICT MODAL */}
      {rescheduleModal.isOpen && rescheduleModal.conflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
          <div className="card-v2 w-full max-w-md p-6 space-y-4 shadow-2xl border-l-4 border-l-[#8b5cf6]">
            <div className="border-b border-white/[0.08] pb-3 flex items-center justify-between">
              <div>
                <h3 className="label-tech text-[#8b5cf6] font-bold">
                  REMANEJAR HORÁRIO DA TAREFA
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Evite sobreposição com sua agenda pessoal no Google Calendar
                </p>
              </div>
              <button 
                onClick={() => setRescheduleModal({ isOpen: false, conflict: null, customTime: '' })}
                className="text-slate-400 hover:text-white font-mono text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-[2px] bg-[#1c1c21] border border-white/[0.06] space-y-1">
                <span className="label-tech text-slate-500 block text-[9px]">TAREFA COM CONFLITO</span>
                <span className="font-bold text-white block">{rescheduleModal.conflict.task.title}</span>
                <span className="text-purple-300 font-mono text-[11px] block">
                  {rescheduleModal.conflict.task.channelOrFormat} · Atual: {rescheduleModal.conflict.task.scheduledTime || 'Sem horário'}
                </span>
              </div>

              <div className="p-3 rounded-[2px] bg-rose-950/20 border border-rose-500/30 space-y-1">
                <span className="label-tech text-rose-400 block text-[9px]">COMPROMISSO NO GOOGLE CALENDAR</span>
                <span className="font-bold text-white block">{rescheduleModal.conflict.calendarEvent.summary}</span>
                <span className="text-slate-300 font-mono text-[11px] block">
                  {rescheduleModal.conflict.calendarEvent.startTimeFormatted} às {rescheduleModal.conflict.calendarEvent.endTimeFormatted || 'Fim'}
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Novo Horário de Disparo (HH:mm)
                </label>
                <input
                  type="time"
                  required
                  value={rescheduleModal.customTime}
                  onChange={(e) => setRescheduleModal(prev => ({ ...prev, customTime: e.target.value }))}
                  className="w-full bg-[#1c1c21] border border-white/10 rounded-[2px] px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>

              {/* Peak Hours Shortcuts */}
              <div>
                <span className="label-tech text-slate-500 block mb-1.5 text-[9px]">
                  SUGESTÕES BASEADAS NOS PICOS DE AUDIÊNCIA:
                </span>
                <div className="flex gap-2 flex-wrap">
                  {['12:30', '18:45', '20:30', '21:30'].map((timeOption) => (
                    <button
                      key={timeOption}
                      type="button"
                      onClick={() => setRescheduleModal(prev => ({ ...prev, customTime: timeOption }))}
                      className={`px-2 py-1 rounded-[2px] font-mono text-[11px] border cursor-pointer transition-colors ${
                        rescheduleModal.customTime === timeOption
                          ? 'bg-[#8b5cf6] text-white border-[#8b5cf6] font-bold'
                          : 'bg-[#1c1c21] text-slate-300 border-white/10 hover:border-purple-400'
                      }`}
                    >
                      {timeOption}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setRescheduleModal({ isOpen: false, conflict: null, customTime: '' })}
                className="btn-v2 btn-v2-outline"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (rescheduleModal.conflict && rescheduleModal.customTime) {
                    handleApplyAlternativeTime(rescheduleModal.conflict, rescheduleModal.customTime);
                  }
                }}
                className="btn-v2 btn-v2-primary"
              >
                Salvar Novo Horário
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MANDATORY USER CONFIRMATION DIALOG (FOR DESTRUCTIVE OR MUTATING OPERATIONS) */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
          <div className="card-v2 w-full max-w-md p-6 space-y-4 shadow-2xl border-l-4 border-l-[#8b5cf6]">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-[2px] shrink-0 ${confirmModal.isDestructive ? 'bg-rose-950/60 text-rose-400 border border-rose-800/40' : 'bg-[#8b5cf6]/20 text-[#8b5cf6] border border-[#8b5cf6]/40'}`}>
                {confirmModal.isDestructive ? <AlertCircle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-extrabold text-sm text-white uppercase tracking-tight">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {confirmModal.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="btn-v2 btn-v2-outline"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`btn-v2 ${confirmModal.isDestructive ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'btn-v2-primary'}`}
              >
                {confirmModal.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
