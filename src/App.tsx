import React, { useState, useEffect } from 'react';
import { StitchSidebar } from './components/stitch/StitchSidebar';
import { StitchHeader } from './components/stitch/StitchHeader';
import { StitchOverviewDashboard } from './components/stitch/StitchOverviewDashboard';
import { StitchEventsHubView } from './components/stitch/StitchEventsHubView';
import { StitchTicketsView } from './components/stitch/StitchTicketsView';
import { StitchBarOpsView } from './components/stitch/StitchBarOpsView';
import { StitchFinancialView } from './components/stitch/StitchFinancialView';
import { StitchMarketingView } from './components/stitch/StitchMarketingView';
import { StitchCalendarHubView } from './components/stitch/StitchCalendarHubView';
import { ArtDirector } from './components/ArtDirector';
import { MasterAgentChat } from './components/MasterAgentChat';
import { IntegrationsHub } from './components/IntegrationsHub';
import { CrmBroadcastHub } from './components/CrmBroadcastHub';
import { EventCreationWizard } from './components/EventCreationWizard';
import { EventData, DayPlan, HourlyAuditReport } from './types';
import { validateEventData } from './schemas/gandayaEventSchema';

export default function App() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [currentEventId, setCurrentEventId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isNewEventWizardOpen, setIsNewEventWizardOpen] = useState(false);
  const [latestAuditReport, setLatestAuditReport] = useState<HourlyAuditReport | null>(null);
  const [loading, setLoading] = useState(true);

  // Load events from backend
  const loadEvents = () => {
    setLoading(true);
    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.events?.length > 0) {
          setEvents(data.events);
          setCurrentEventId(data.events[0].id);
        } else {
          setEvents([]);
          setCurrentEventId('');
        }
      })
      .catch((err) => {
        console.error('Failed to load events:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const currentEvent = events.find((e) => e.id === currentEventId) || events[0] || null;

  // Reset database for testing the step-by-step creation flow
  const handleResetEvents = async () => {
    try {
      await fetch('/api/events/reset', { method: 'POST' });
      setEvents([]);
      setCurrentEventId('');
      setIsNewEventWizardOpen(false);
    } catch (err) {
      console.error('Failed to reset events:', err);
    }
  };

  // Safe update event handler with strict Zod schema validation
  const handleUpdateEvent = (updated: EventData) => {
    const validation = validateEventData(updated);
    if (!validation.success) {
      console.error('Tentativa de atualizar EventData bloqueada pelo Zod:', validation.errors);
      return;
    }
    setEvents((prev) => prev.map((ev) => (ev.id === updated.id ? (validation.data as EventData) : ev)));
  };

  // Update calendar handler
  const handleUpdateCalendar = async (date: string, dayPlan: DayPlan) => {
    if (!currentEvent) return;

    // Optimistic local state update
    const updatedEvents = events.map((ev) => {
      if (ev.id === currentEvent.id) {
        return {
          ...ev,
          calendar: {
            ...ev.calendar,
            [date]: dayPlan
          }
        };
      }
      return ev;
    });
    setEvents(updatedEvents);

    try {
      await fetch(`/api/events/${currentEvent.id}/calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, dayData: dayPlan })
      });
    } catch (err) {
      console.error('Error saving calendar item:', err);
    }
  };

  // Apply single generated ad to current date in calendar
  const handleApplyAdToCalendar = (adPlan: any) => {
    if (!currentEvent) return;
    const targetDate = '2026-10-05';
    const existingDay: DayPlan = currentEvent.calendar?.[targetDate] || {
      date: targetDate,
      posts: [],
      stories: [],
      reels: [],
      ads: []
    };

    const updatedDay: DayPlan = {
      ...existingDay,
      ads: [
        {
          id: `ad-gen-${Date.now()}`,
          campaignName: adPlan.campaignName,
          format: adPlan.format,
          audienceSegment: adPlan.audienceSegment,
          dailyBudget: adPlan.dailyBudget,
          targetCpa: adPlan.targetCpa,
          hookAngle: adPlan.hookAngle,
          status: 'Ativo'
        },
        ...existingDay.ads
      ]
    };

    handleUpdateCalendar(targetDate, updatedDay);
  };

  // Sync planning schedule items to calendar
  const handleSyncPlanningSchedule = (scheduleItems: any[]) => {
    if (!currentEvent || !scheduleItems) return;

    scheduleItems.forEach((item, index) => {
      const dayNum = 5 + index;
      const dateStr = `2026-10-${String(dayNum).padStart(2, '0')}`;
      const existing: DayPlan = currentEvent.calendar?.[dateStr] || {
        date: dateStr,
        posts: [],
        stories: [],
        reels: [],
        ads: []
      };

      const updated: DayPlan = {
        ...existing,
        milestoneLabel: item.milestoneLabel || existing.milestoneLabel,
        posts: item.post ? [
          ...existing.posts,
          {
            id: `plan-p-${Date.now()}-${index}`,
            title: item.post.title,
            type: item.post.type || 'feed',
            scheduledTime: item.post.scheduledTime || '18:45',
            visualConcept: item.post.visualConcept || '',
            copySnippet: item.post.copySnippet || '',
            status: 'Aprovado',
            djTagged: item.post.djTagged
          }
        ] : existing.posts,
        stories: item.stories ? [
          ...existing.stories,
          ...item.stories.map((st: any, sIdx: number) => ({
            id: `plan-s-${Date.now()}-${index}-${sIdx}`,
            sequenceOrder: existing.stories.length + sIdx + 1,
            scheduledTime: st.scheduledTime,
            objective: st.objective || 'engajamento',
            format: st.format || 'enquete',
            copy: st.copy,
            status: 'Aprovado' as const
          }))
        ] : existing.stories,
        reels: item.reel ? [
          ...existing.reels,
          {
            id: `plan-r-${Date.now()}-${index}`,
            title: item.reel.title,
            hook3s: item.reel.hook3s,
            audioVibe: item.reel.audioVibe,
            pace: item.reel.pace || 'Dinâmico',
            duration: item.reel.duration || '20s',
            scheduledTime: item.reel.scheduledTime || '19:30',
            status: 'Aprovado',
            callToAction: item.reel.callToAction || 'Link na bio'
          }
        ] : existing.reels,
        ads: item.ads ? [
          ...existing.ads,
          ...item.ads.map((ad: any, aIdx: number) => ({
            id: `plan-a-${Date.now()}-${index}-${aIdx}`,
            campaignName: ad.campaignName,
            format: ad.format || 'Story / Reels Ads 9:16',
            audienceSegment: ad.audienceSegment,
            dailyBudget: ad.dailyBudget || 500,
            targetCpa: ad.targetCpa || 25,
            hookAngle: ad.hookAngle,
            status: 'Ativo' as const
          }))
        ] : existing.ads
      };

      handleUpdateCalendar(dateStr, updated);
    });
  };

  // Handler for dispatching hourly audit report to master agent
  const handleSendReportToMasterAgent = (report: HourlyAuditReport) => {
    setLatestAuditReport(report);
    setActiveTab('master_ai');
  };

  // Handler for new event creation
  const handleEventCreated = (newEvent: EventData) => {
    setEvents((prev) => [...prev, newEvent]);
    setCurrentEventId(newEvent.id);
    setIsNewEventWizardOpen(false);
    setActiveTab('overview');
  };

  // Map subtab aliases to primary navigation targets
  const handleNavigateToTab = (targetTab: string) => {
    if (['dashboard', 'overview'].includes(targetTab)) setActiveTab('overview');
    else if (['events', 'events_hub', 'events_list', 'planning'].includes(targetTab)) setActiveTab('events_hub');
    else if (['tickets', 'tickets_view', 'gandaya_hub'].includes(targetTab)) setActiveTab('tickets');
    else if (['bar', 'bar_ops'].includes(targetTab)) setActiveTab('bar');
    else if (['financial', 'financial_overview', 'costs', 'revenues', 'consolidated'].includes(targetTab)) setActiveTab('financial');
    else if (['marketing', 'marketing_overview', 'campaign_gen', 'campaign_hourly', 'ad_library', 'edit_campaigns'].includes(targetTab)) setActiveTab('marketing');
    else if (['art_studio', 'art_director'].includes(targetTab)) setActiveTab('art_studio');
    else if (['calendar', 'virtual_calendar', 'google_calendar'].includes(targetTab)) setActiveTab('calendar');
    else if (['crm', 'crm_broadcast'].includes(targetTab)) setActiveTab('crm');
    else if (['master_ai', 'master_chat'].includes(targetTab)) setActiveTab('master_ai');
    else if (['integrations'].includes(targetTab)) setActiveTab('integrations');
    else setActiveTab(targetTab);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0e13] flex items-center justify-center text-[#958ea0]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#a078ff] border-t-transparent animate-spin" />
          <span className="font-mono tracking-widest uppercase text-xs text-[#d0bcff] font-bold">
            Carregando PulseEvent / INSOMNIA Suite...
          </span>
        </div>
      </div>
    );
  }

  // If no events exist, show the step-by-step Event Creation Wizard immediately
  if (events.length === 0 || !currentEvent) {
    return (
      <div className="min-h-screen bg-[#0d0e13] text-[#e3e1e9] flex flex-col font-sans">
        <header className="border-b border-[#494454]/20 bg-[#121318]/90 backdrop-blur-md sticky top-0 z-30 py-3.5 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#a078ff] to-[#4cd7f6] flex items-center justify-center p-0.5 shadow-md">
              <div className="w-full h-full bg-[#121318] rounded-[6px] flex items-center justify-center">
                <span className="material-symbols-outlined text-[#d0bcff] text-[18px]">bolt</span>
              </div>
            </div>
            <span className="font-title-md font-bold tracking-tight text-[#e3e1e9]">
              PulseEvent <span className="text-[10px] font-bold text-[#d0bcff] px-1.5 py-0.5 rounded bg-[#a078ff]/15 border border-[#a078ff]/30">PRO</span>
            </span>
          </div>

          <div className="text-xs text-[#d0bcff] font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse" />
            <span>Assistente de Criação Passo a Passo</span>
          </div>
        </header>

        <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8 flex flex-col items-center justify-start">
          <EventCreationWizard onEventCreated={handleEventCreated} />
        </main>

        <footer className="border-t border-[#494454]/20 bg-[#121318] py-4 text-center text-xs text-[#958ea0]">
          PulseEvent · INSOMNIA Event Intelligence Suite
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0e13] text-[#e3e1e9] flex font-sans antialiased selection:bg-[#a078ff]/30 selection:text-[#d0bcff]">
      
      {/* 1. Fixed Left Stitch Sidebar */}
      <StitchSidebar
        events={events}
        currentEvent={currentEvent}
        activeTab={activeTab}
        onTabChange={handleNavigateToTab}
        onSelectEvent={(id) => setCurrentEventId(id)}
        onOpenNewEventModal={() => setIsNewEventWizardOpen(true)}
        onResetEvents={handleResetEvents}
      />

      {/* 2. Main Content Container (Shifted right by 72 = 288px) */}
      <div className="pl-72 flex-1 flex flex-col min-w-0">
        
        {/* Fixed Top Stitch Header */}
        <StitchHeader
          currentEvent={currentEvent}
          onOpenNewEventModal={() => setIsNewEventWizardOpen(true)}
        />

        {/* Dynamic Viewport */}
        <main className="w-full pt-16 bg-[#0d0e13] min-h-screen px-6 sm:px-8">
          
          {/* Overview Dashboard */}
          {(activeTab === 'overview' || activeTab === 'dashboard') && (
            <StitchOverviewDashboard
              event={currentEvent}
              onNavigateToTab={handleNavigateToTab}
            />
          )}

          {/* Events Hub & Planning */}
          {(activeTab === 'events_hub' || activeTab === 'events') && (
            <StitchEventsHubView
              events={events}
              currentEvent={currentEvent}
              onSelectEvent={(id) => setCurrentEventId(id)}
              onOpenNewEventModal={() => setIsNewEventWizardOpen(true)}
              onSyncPlanningSchedule={handleSyncPlanningSchedule}
              onNavigateToTab={handleNavigateToTab}
            />
          )}

          {/* Tickets & Batches (with Gandaya Data Hub integrated) */}
          {(activeTab === 'tickets' || activeTab === 'tickets_view' || activeTab === 'gandaya_hub') && (
            <StitchTicketsView
              event={currentEvent}
              onUpdateEvent={handleUpdateEvent}
              onNavigateToTab={handleNavigateToTab}
            />
          )}

          {/* Bar, PDVs and Stock Management */}
          {(activeTab === 'bar' || activeTab === 'bar_ops') && (
            <StitchBarOpsView
              event={currentEvent}
              onNavigateToTab={handleNavigateToTab}
            />
          )}

          {/* Financial Management & DRE (with Google Sheets Hub integrated) */}
          {(activeTab === 'financial' || activeTab === 'costs' || activeTab === 'revenues' || activeTab === 'consolidated') && (
            <StitchFinancialView
              event={currentEvent}
              onUpdateEvent={handleUpdateEvent}
              onNavigateToTab={handleNavigateToTab}
            />
          )}

          {/* Marketing & Paid Ads (with Harsh Critic, 24h Audit, Campaign Manager, Library) */}
          {(activeTab === 'marketing' || activeTab === 'campaign_gen' || activeTab === 'campaign_hourly' || activeTab === 'ad_library' || activeTab === 'edit_campaigns') && (
            <StitchMarketingView
              event={currentEvent}
              onUpdateEvent={handleUpdateEvent}
              onApplyAdToCalendar={handleApplyAdToCalendar}
              onUpdateEventCalendar={handleUpdateCalendar}
              onSendReportToMasterAgent={handleSendReportToMasterAgent}
              onNavigateToTab={handleNavigateToTab}
            />
          )}

          {/* Art Director & Visual Studio (with Visual DNA & PostEngineeringStudio) */}
          {(activeTab === 'art_studio' || activeTab === 'art_director') && (
            <div className="py-4">
              <ArtDirector event={currentEvent} />
            </div>
          )}

          {/* Calendar & Agenda (with 4 Pillars Virtual Calendar and Google Calendar) */}
          {(activeTab === 'calendar' || activeTab === 'virtual_calendar' || activeTab === 'google_calendar') && (
            <StitchCalendarHubView
              event={currentEvent}
              onUpdateEventCalendar={handleUpdateCalendar}
              onUpdateEvent={handleUpdateEvent}
              onNavigateToTab={handleNavigateToTab}
            />
          )}

          {/* Tactical CRM & Broadcast Hub (WhatsApp, SMS, Email, Abandoned Carts) */}
          {(activeTab === 'crm' || activeTab === 'crm_broadcast') && (
            <div className="py-4">
              <CrmBroadcastHub
                event={currentEvent}
                onUpdateEvent={handleUpdateEvent}
                onNavigateToTab={handleNavigateToTab}
              />
            </div>
          )}

          {/* Master Agent AI Chat */}
          {(activeTab === 'master_ai' || activeTab === 'master_chat') && (
            <div className="py-4">
              <MasterAgentChat
                event={currentEvent}
                latestAuditReport={latestAuditReport}
              />
            </div>
          )}

          {/* Integrations & APIs */}
          {activeTab === 'integrations' && (
            <div className="py-4">
              <IntegrationsHub
                event={currentEvent}
                onEventUpdated={handleUpdateEvent}
              />
            </div>
          )}

        </main>
      </div>

      {/* Modal Overlay for Creating New Event */}
      {isNewEventWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-2xl py-4">
            <EventCreationWizard 
              onEventCreated={handleEventCreated} 
              onCancel={() => setIsNewEventWizardOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
