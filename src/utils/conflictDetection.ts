import { EventData, GoogleCalendarEvent, CalendarConflict } from '../types';

/**
 * Normalizes a Date or string into YYYY-MM-DD in local time
 */
export function normalizeDateToYMD(dateInput: string | Date): string {
  if (!dateInput) return '';
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput;
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Parses "HH:mm" into minutes from midnight (0 - 1439)
 */
function parseTimeToMinutes(timeStr?: string): number | null {
  if (!timeStr) return null;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

/**
 * Formats minutes from midnight into "HH:mm"
 */
function formatMinutesToTime(mins: number): string {
  const normalized = Math.max(0, Math.min(1439, mins));
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Computes a smart alternative time avoiding the meeting window,
 * prioritizing audience peak hours if possible.
 */
function computeAlternativeTime(
  meetingEndMins: number,
  peakHours: string[] = ['12:30', '18:45', '21:30']
): string {
  const candidateEnd = meetingEndMins + 30; // 30 min buffer after meeting
  // Check if any peak hour is after the meeting
  for (const peak of peakHours) {
    const pMins = parseTimeToMinutes(peak);
    if (pMins !== null && pMins >= candidateEnd) {
      return peak;
    }
  }
  // If all peaks are earlier, suggest 30 mins after meeting or 21:00
  if (candidateEnd <= 22 * 60) {
    return formatMinutesToTime(candidateEnd);
  }
  return '21:30';
}

/**
 * Core Conflict Detection Engine
 * Scans all automated campaigns, posts, reels, stories and milestones against Google Calendar events.
 */
export function detectCalendarConflicts(
  event: EventData,
  calendarEvents: GoogleCalendarEvent[]
): CalendarConflict[] {
  if (!calendarEvents || calendarEvents.length === 0) {
    return [];
  }

  const conflicts: CalendarConflict[] = [];

  // Helper to extract event start/end times
  const parseGoogleEvent = (gEvent: GoogleCalendarEvent) => {
    let dateStr = '';
    let startMins: number | null = null;
    let endMins: number | null = null;
    let startTimeFormatted = '';
    let endTimeFormatted = '';

    if (gEvent.start?.dateTime) {
      const dStart = new Date(gEvent.start.dateTime);
      dateStr = normalizeDateToYMD(dStart);
      startMins = dStart.getHours() * 60 + dStart.getMinutes();
      startTimeFormatted = dStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      if (gEvent.end?.dateTime) {
        const dEnd = new Date(gEvent.end.dateTime);
        endMins = dEnd.getHours() * 60 + dEnd.getMinutes();
        endTimeFormatted = dEnd.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      } else {
        endMins = startMins + 60;
        endTimeFormatted = formatMinutesToTime(endMins);
      }
    } else if (gEvent.start?.date) {
      dateStr = gEvent.start.date;
      startTimeFormatted = 'Dia todo';
    }

    return {
      dateStr,
      startMins,
      endMins,
      startTimeFormatted,
      endTimeFormatted,
      isAllDay: !gEvent.start?.dateTime
    };
  };

  // 1. Scan tasks inside event.calendar
  const calendarMap = event.calendar || {};
  const peakHours = event.audience?.peakEngagementHours || ['12:30', '18:45', '21:30'];

  for (const [dateKey, dayPlan] of Object.entries(calendarMap)) {
    const taskDate = normalizeDateToYMD(dateKey);
    if (!taskDate) continue;

    // Filter google events on the same day
    const matchingGEvents = calendarEvents.map(g => ({ g, parsed: parseGoogleEvent(g) }))
      .filter(({ parsed }) => parsed.dateStr === taskDate);

    if (matchingGEvents.length === 0) continue;

    // A. Feed Posts
    for (const post of dayPlan.posts || []) {
      const postMins = parseTimeToMinutes(post.scheduledTime);
      for (const { g, parsed } of matchingGEvents) {
        if (postMins !== null && parsed.startMins !== null && parsed.endMins !== null) {
          // Direct time collision: post time within meeting or within 20min buffer
          if (postMins >= parsed.startMins - 15 && postMins <= parsed.endMins + 15) {
            conflicts.push({
              id: `conf-post-${post.id}-${g.id}`,
              severity: 'critical',
              type: 'time_overlap',
              date: taskDate,
              task: {
                id: post.id,
                title: post.title || 'Publicação de Feed',
                category: 'post_feed',
                scheduledTime: post.scheduledTime,
                channelOrFormat: `Post de Feed (${post.type})`
              },
              calendarEvent: {
                id: g.id,
                summary: g.summary,
                startTimeFormatted: parsed.startTimeFormatted,
                endTimeFormatted: parsed.endTimeFormatted,
                location: g.location,
                htmlLink: g.htmlLink
              },
              explanation: `Disparo automático de Feed agendado para às ${post.scheduledTime}, coincidindo com "${g.summary}" (${parsed.startTimeFormatted} às ${parsed.endTimeFormatted}).`,
              recommendedAction: 'Ajuste o agendamento para após o término do compromisso para acompanhar os primeiros comentários e tração.',
              suggestedAlternativeTime: computeAlternativeTime(parsed.endMins, peakHours)
            });
          }
        }
      }
    }

    // B. Reels Plans
    for (const reel of dayPlan.reels || []) {
      const reelMins = parseTimeToMinutes(reel.scheduledTime);
      for (const { g, parsed } of matchingGEvents) {
        if (reelMins !== null && parsed.startMins !== null && parsed.endMins !== null) {
          if (reelMins >= parsed.startMins - 15 && reelMins <= parsed.endMins + 15) {
            conflicts.push({
              id: `conf-reel-${reel.id}-${g.id}`,
              severity: 'critical',
              type: 'time_overlap',
              date: taskDate,
              task: {
                id: reel.id,
                title: reel.title || 'Roteiro de Reels',
                category: 'reel_script',
                scheduledTime: reel.scheduledTime,
                channelOrFormat: `Reels 9:16 (${reel.duration})`
              },
              calendarEvent: {
                id: g.id,
                summary: g.summary,
                startTimeFormatted: parsed.startTimeFormatted,
                endTimeFormatted: parsed.endTimeFormatted,
                location: g.location,
                htmlLink: g.htmlLink
              },
              explanation: `Lançamento de Reels programado para às ${reel.scheduledTime}, sobreposto ao evento "${g.summary}". O algoritmo do Instagram exige interação ativa nos primeiros 30 minutos.`,
              recommendedAction: 'Reagende a publicação para fora da janela do compromisso para garantir retenção inicial.',
              suggestedAlternativeTime: computeAlternativeTime(parsed.endMins, peakHours)
            });
          }
        }
      }
    }

    // C. Stories Sequences
    for (const story of dayPlan.stories || []) {
      const storyMins = parseTimeToMinutes(story.scheduledTime);
      for (const { g, parsed } of matchingGEvents) {
        if (storyMins !== null && parsed.startMins !== null && parsed.endMins !== null) {
          if (storyMins >= parsed.startMins - 10 && storyMins <= parsed.endMins + 10) {
            conflicts.push({
              id: `conf-story-${story.id}-${g.id}`,
              severity: 'warning',
              type: 'time_overlap',
              date: taskDate,
              task: {
                id: story.id,
                title: story.copy ? (story.copy.length > 35 ? `${story.copy.slice(0, 35)}...` : story.copy) : 'Sequência de Story',
                category: 'story_sequence',
                scheduledTime: story.scheduledTime,
                channelOrFormat: `Story (${story.format})`
              },
              calendarEvent: {
                id: g.id,
                summary: g.summary,
                startTimeFormatted: parsed.startTimeFormatted,
                endTimeFormatted: parsed.endTimeFormatted,
                location: g.location,
                htmlLink: g.htmlLink
              },
              explanation: `Sequência de Stories com sticker/enquete agendada para às ${story.scheduledTime} durante "${g.summary}".`,
              recommendedAction: 'Antecipe os Stories para a pausa do almoço ou reprograme para o início da noite.',
              suggestedAlternativeTime: computeAlternativeTime(parsed.endMins, peakHours)
            });
          }
        }
      }
    }

    // D. Automated Ad Campaigns on the same day
    for (const ad of dayPlan.ads || []) {
      if (ad.dailyBudget && ad.dailyBudget >= 250) {
        for (const { g, parsed } of matchingGEvents) {
          conflicts.push({
            id: `conf-ad-${ad.id}-${g.id}`,
            severity: 'warning',
            type: 'workload_spike',
            date: taskDate,
            task: {
              id: ad.id,
              title: ad.campaignName,
              category: 'campanha_ads',
              channelOrFormat: ad.format,
              budgetOrDetails: `R$ ${ad.dailyBudget}/dia (Meta CPA R$ ${ad.targetCpa})`
            },
            calendarEvent: {
              id: g.id,
              summary: g.summary,
              startTimeFormatted: parsed.startTimeFormatted,
              endTimeFormatted: parsed.endTimeFormatted,
              location: g.location,
              htmlLink: g.htmlLink
            },
            explanation: `Campanha de alto orçamento ("${ad.campaignName}") veiculando R$ ${ad.dailyBudget}/dia em data com compromisso externo ("${g.summary}").`,
            recommendedAction: 'Certifique-se de que as regras automatizadas de CPA da Meta Ads estão ativas para pausar criativos anômalos automaticamente.'
          });
        }
      }
    }

    // E. Strategic Milestone
    if (dayPlan.milestoneLabel) {
      for (const { g, parsed } of matchingGEvents) {
        conflicts.push({
          id: `conf-milestone-${dateKey}-${g.id}`,
          severity: 'critical',
          type: 'milestone_collision',
          date: taskDate,
          task: {
            id: `ms-${dateKey}`,
            title: dayPlan.milestoneLabel,
            category: 'marco_evento',
            channelOrFormat: 'Marco Operacional'
          },
          calendarEvent: {
            id: g.id,
            summary: g.summary,
            startTimeFormatted: parsed.startTimeFormatted,
            endTimeFormatted: parsed.endTimeFormatted,
            location: g.location,
            htmlLink: g.htmlLink
          },
          explanation: `O marco estratégico "${dayPlan.milestoneLabel}" ocorre na mesma data do evento pessoal/externo "${g.summary}".`,
          recommendedAction: 'Delegue o acompanhamento técnico da virada para um produtor adjunto.'
        });
      }
    }
  }

  // 2. Scan Main Event D-Day (event.date)
  if (event.date) {
    const mainEventDate = normalizeDateToYMD(event.date);
    const eventDayConflicts = calendarEvents.map(g => ({ g, parsed: parseGoogleEvent(g) }))
      .filter(({ g, parsed }) => {
        // Exclude if the Google Calendar event IS the INSOMNIA event itself!
        const isSelfEvent = g.summary.toLowerCase().includes(event.name.toLowerCase());
        return !isSelfEvent && parsed.dateStr === mainEventDate;
      });

    for (const { g, parsed } of eventDayConflicts) {
      conflicts.push({
        id: `conf-mainevent-${g.id}`,
        severity: 'critical',
        type: 'milestone_collision',
        date: mainEventDate,
        task: {
          id: `event-dday-${event.id}`,
          title: `O GRANDE DIA DO EVENTO: ${event.name.toUpperCase()}`,
          category: 'marco_evento',
          channelOrFormat: `Produção Presencial (${event.venue || event.city})`
        },
        calendarEvent: {
          id: g.id,
          summary: g.summary,
          startTimeFormatted: parsed.startTimeFormatted,
          endTimeFormatted: parsed.endTimeFormatted,
          location: g.location,
          htmlLink: g.htmlLink
        },
        explanation: `ALERTA GRAVE: O compromisso "${g.summary}" está marcado para o DIA OFICIAL DO EVENTO (${mainEventDate}). Este dia exige dedicação integral na montagem de palco e som.`,
        recommendedAction: 'Cancele ou remarque compromissos alheios ao evento para garantir presença na abertura de portas.'
      });
    }
  }

  // 3. Scan Lote Countdown Date
  if (event.loteCountdownHours && event.loteCountdownHours > 0) {
    const projectedViradaTime = Date.now() + event.loteCountdownHours * 3600 * 1000;
    const viradaDate = normalizeDateToYMD(new Date(projectedViradaTime));
    
    const viradaCollisions = calendarEvents.map(g => ({ g, parsed: parseGoogleEvent(g) }))
      .filter(({ g, parsed }) => {
        const isSelfEvent = g.summary.toLowerCase().includes('virada') && g.summary.toLowerCase().includes(event.name.toLowerCase());
        return !isSelfEvent && parsed.dateStr === viradaDate;
      });

    for (const { g, parsed } of viradaCollisions) {
      conflicts.push({
        id: `conf-virada-${g.id}`,
        severity: 'warning',
        type: 'milestone_collision',
        date: viradaDate,
        task: {
          id: `lote-virada-${event.id}`,
          title: `Previsão de Virada: ${event.currentLote} (R$ ${event.ticketPriceLote})`,
          category: 'virada_lote',
          channelOrFormat: 'Pico de Vendas & Disparo de Escassez',
          budgetOrDetails: `~${event.loteCountdownHours} horas para encerramento`
        },
        calendarEvent: {
          id: g.id,
          summary: g.summary,
          startTimeFormatted: parsed.startTimeFormatted,
          endTimeFormatted: parsed.endTimeFormatted,
          location: g.location,
          htmlLink: g.htmlLink
        },
        explanation: `A virada do lote ${event.currentLote} está prevista para ${viradaDate}, coincidindo com "${g.summary}". A virada de lote gera pico de dúvidas de compra e suporte de ingressos.`,
        recommendedAction: 'Programe os anúncios de escassez e certifique-se de que o gateway de pagamento (Gandaya) está monitorado.'
      });
    }
  }

  return conflicts;
}

/**
 * Creates sample Google Calendar events designed to demonstrate conflict detection
 * against typical event marketing schedules (e.g., meetings during evening peak hours).
 */
export function generateSampleConflictEvent(event: EventData): GoogleCalendarEvent {
  // Use today or a date within the event's month
  const targetDate = event.calendar && Object.keys(event.calendar).length > 0
    ? Object.keys(event.calendar)[0]
    : '2026-10-05';

  return {
    id: `sample-conflict-${Date.now()}`,
    summary: 'Reunião de Alinhamento com Patrocinadores & Fornecedores de Macaé',
    description: 'Pauta: estrutura de som, segurança do evento e liberações municipais. Presença obrigatória de toda a diretoria.',
    location: 'Espaço Macaé (Orla dos Cavaleiros)',
    start: {
      dateTime: `${targetDate}T18:00:00-03:00`
    },
    end: {
      dateTime: `${targetDate}T20:00:00-03:00`
    },
    htmlLink: 'https://calendar.google.com',
    status: 'confirmed',
    syncedAt: new Date().toISOString()
  };
}

/**
 * Format active conflicts into plain-text briefing for the Master Agent & Planning Agent
 */
export function formatConflictsForAI(conflicts: CalendarConflict[]): string {
  if (!conflicts || conflicts.length === 0) {
    return 'Nenhum conflito de agenda ou sobreposição entre campanhas automatizadas e o Google Calendar detectado.';
  }

  return conflicts
    .filter(c => !c.isDismissed)
    .slice(0, 10)
    .map((c, i) => {
      return `${i + 1}. [CONFLITO ${c.severity.toUpperCase()} - ${c.date}] Tarefa: "${c.task.title}" (${c.task.channelOrFormat}${c.task.scheduledTime ? ` às ${c.task.scheduledTime}` : ''}) sobrepõe compromisso "${c.calendarEvent.summary}" (${c.calendarEvent.startTimeFormatted}). Impacto: ${c.explanation}`;
    })
    .join('\n');
}
