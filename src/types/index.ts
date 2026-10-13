export interface LineupArtist {
  id: string;
  name: string;
  role: string;
  timeSlot: string;
  status: 'Confirmado' | 'Em Negociação' | 'Anunciado';
  instagramHandle: string;
  followers: string;
  engagementRate: string;
}

export interface AudienceData {
  primaryAge: string;
  genderSplit: string;
  peakEngagementHours: string[];
  topLocations: string[];
  musicAffinity: string[];
}

export interface ArtDirectionData {
  themeName: string;
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
  };
  visualStyle: string;
  dosList: string[];
  dontsList: string[];
  tokenEfficiencyGuidelines: string;
  samplePrompts: {
    name: string;
    ratio: string;
    prompt: string;
  }[];
}

export interface FeedPostPlan {
  id: string;
  title: string;
  type: 'feed' | 'carrossel' | 'collab';
  scheduledTime: string;
  visualConcept: string;
  copySnippet: string;
  status: 'Rascunho' | 'Aprovado' | 'Agendado' | 'Publicado';
  djTagged?: string;
}

export interface StoryPlan {
  id: string;
  sequenceOrder: number;
  scheduledTime: string;
  objective: 'bastidores' | 'engajamento' | 'vendas_lote' | 'revelacao' | 'countdown';
  format: 'enquete' | 'video_dj' | 'link_sticker' | 'countdown' | 'caixa_perguntas';
  copy: string;
  status: 'Rascunho' | 'Aprovado' | 'Agendado' | 'Publicado';
}

export interface ReelPlan {
  id: string;
  title: string;
  hook3s: string;
  audioVibe: string;
  pace: string;
  duration: string;
  scheduledTime: string;
  status: 'Rascunho' | 'Aprovado' | 'Agendado' | 'Publicado';
  callToAction: string;
  // Modern Viral Script Structure (Hook -> Storytelling -> Climax/Drop -> CTA -> Direction)
  trendReference?: string;
  trendFormat?: 'POV' | 'Drop Sincronizado' | 'Expectativa vs Realidade' | 'Mini-Vlog / Bastidores' | 'Entrevista de Pista' | 'Transição no Beat' | 'Desafio de Squad' | string;
  hookVisual?: string;
  hookVerbal?: string;
  storytelling?: string;
  climaxDrop?: string;
  technicalDirection?: string;
  captionSnippet?: string;
}

export interface DailyAdPlan {
  id: string;
  campaignName: string;
  format: string;
  audienceSegment: string;
  dailyBudget: number;
  targetCpa: number;
  hookAngle: string;
  status: 'Rascunho' | 'Ativo' | 'Pausado' | 'Concluído';
}

export interface DayPlan {
  date: string;
  milestoneLabel?: string;
  posts: FeedPostPlan[];
  stories: StoryPlan[];
  reels: ReelPlan[];
  ads: DailyAdPlan[];
}

export interface HourlyAdMetric {
  hour: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  purchases: number;
  revenue: number;
  cpa: number;
  roas: number;
  status: 'normal' | 'scaling' | 'warning' | 'critical';
  deterministicAlert?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  htmlLink?: string;
  status?: string;
  syncedAt?: string;
}

export interface CalendarConflict {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  type: 'time_overlap' | 'milestone_collision' | 'workload_spike';
  date: string;
  task: {
    id: string;
    title: string;
    category: 'campanha_ads' | 'post_feed' | 'reel_script' | 'story_sequence' | 'marco_evento' | 'virada_lote';
    scheduledTime?: string;
    channelOrFormat: string;
    budgetOrDetails?: string;
  };
  calendarEvent: {
    id: string;
    summary: string;
    startTimeFormatted: string;
    endTimeFormatted?: string;
    location?: string;
    htmlLink?: string;
  };
  explanation: string;
  recommendedAction: string;
  suggestedAlternativeTime?: string;
  isDismissed?: boolean;
}

export interface AdAccountIntegrations {
  meta?: {
    connected: boolean;
    adAccountId: string;
    pixelId?: string;
    instagramAccountId?: string;
    accessToken?: string;
    lastSyncedAt?: string;
  };
  tiktok?: {
    connected: boolean;
    advertiserId: string;
    accessToken?: string;
    lastSyncedAt?: string;
  };
  google?: {
    connected: boolean;
    customerId: string;
    developerToken?: string;
    lastSyncedAt?: string;
  };
  googleCalendar?: {
    connected: boolean;
    userEmail?: string;
    userName?: string;
    lastSyncedAt?: string;
    syncedEventsCount?: number;
  };
}

export interface SavedAdAsset {
  id: string;
  campaignName: string;
  format: string;
  hook3s: string;
  copyPrimary: string;
  headline?: string;
  callToAction: string;
  audienceSegment: string;
  genre: string;
  angle: string;
  metrics: {
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
    purchases: number;
    revenue: number;
    cpa: number;
    roas: number;
  };
  performanceTag: 'Winner (Campeão de Vendas)' | 'Alto Engajamento' | 'CPA Otimizado' | 'Em Teste' | 'Fadiga Rápida';
  agentNotes: string;
  createdAt: string;
}

export interface GenreHistoricalInsight {
  genre: string;
  bestPostingWindows: {
    dayOfWeek: string;
    time: string;
    objective: string;
    averageEngagementLift: string;
    conversionProbability: string;
    reasoning: string;
  }[];
  audienceBehaviorPatterns: {
    peakHoursSummary: string;
    preferredFormats: string[];
    viralTriggers: string[];
    retentionDropOffPoint: string;
  };
}

export interface GandayaPurchase {
  userId: string;
  userName: string;
  userEmail: string;
  ticketId: string;
  batchDescription: string;
  promoterLink?: string;
  purchaseDate: string;
  quantity: number;
  unitPrice: number;
  total: number;
  validated?: boolean;
}

export interface GandayaBatchSummary {
  batchId: string;
  description: string;
  nominalPrice: number;
  averagePrice: number;
  salesCount: number;
  complimentaryCount: number;
  externalPaymentsCount: number;
}

export interface GandayaPromoterLink {
  link: string;
  type: string;
  salesCount: number;
}

export interface GandayaUserDemographic {
  userId: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
}

export interface GandayaAbandonedCart {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  batchDescription: string;
  quantity: number;
  unitPrice: number;
  total: number;
  paymentMethod: string;
  createdAt: string;
}

export interface GandayaReportData {
  eventName: string;
  edition: string;
  generatedAt: string;
  totalTicketsSold: number;
  totalGrossRevenue: number;
  averageTicketPrice: number;
  purchases: GandayaPurchase[];
  batches: GandayaBatchSummary[];
  links: GandayaPromoterLink[];
  users: GandayaUserDemographic[];
  abandonedCarts: GandayaAbandonedCart[];
  demographics: {
    averageAge: number;
    malePercentage: number;
    femalePercentage: number;
    topAreaCodes: { ddd: string; count: number }[];
  };
}

export interface EventData {
  id: string;
  name: string;
  tagline: string;
  genre: string;
  date: string;
  city: string;
  venue: string;
  capacity: number;
  targetSales: number;
  soldTickets: number;
  revenueTarget: number;
  currentRevenue: number;
  currentLote: string;
  loteCountdownHours: number;
  ticketPriceLote: number;
  status: 'pre_save' | 'early_bird' | 'lineup_drop' | 'sales_peak' | 'semana_evento' | 'd_day' | 'pos_evento';
  totalAdBudget: number;
  spentAdBudget: number;
  blendedRoas: number;
  targetCpa: number;
  currentCpa: number;
  ctr: number;
  cpc: number;
  reach: number;
  impressions: number;
  frequency: number;
  audience: AudienceData;
  lineup: LineupArtist[];
  artDirection: ArtDirectionData;
  calendar: Record<string, DayPlan>;
  hourlyMetrics: HourlyAdMetric[];
  integrations?: AdAccountIntegrations;
  adLibrary?: SavedAdAsset[];
  gandayaReport?: GandayaReportData;
  googleCalendarEvents?: GoogleCalendarEvent[];
  financials?: FinancialData;
  crm?: CrmState;
}

export interface CrmContact {
  id: string;
  name: string;
  phone: string;
  email: string;
  type: 'Comprador' | 'Carrinho Abandonado' | 'Lead' | 'Promoter' | 'VIP';
  batchDescription?: string;
  quantity?: number;
  totalValue?: number;
  paymentMethod?: string;
  status: 'Ativo' | 'Pendente' | 'Contatado' | 'Recuperado' | 'Desistiu';
  createdAt?: string;
  lastContactedAt?: string;
  notes?: string;
}

export interface CrmMessageTemplate {
  id: string;
  title: string;
  category: 'urgencia_lote' | 'lineup_drop' | 'guia_chegada' | 'd_day' | 'pos_evento' | 'recuperacao_carrinho' | 'custom';
  recommendedChannel: 'whatsapp' | 'email' | 'sms' | 'ambos';
  text: string;
  subject?: string;
  variables: string[];
}

export interface CrmBroadcastLog {
  id: string;
  templateTitle: string;
  category: string;
  channel: 'whatsapp' | 'email' | 'sms';
  recipientCount: number;
  sentAt: string;
  status: 'Sucesso' | 'Parcial' | 'Agendado';
  notes?: string;
}

export interface CrmCartOverride {
  status: 'Pendente' | 'Contatado' | 'Recuperado' | 'Desistiu';
  lastContactedAt?: string;
  recoveryNotes?: string;
  linkClicks?: number;
  lastClickedAt?: string;
  dispatchedCount?: number;
  lastDispatchedAt?: string;
  channel?: 'whatsapp' | 'email' | 'sms';
  templateId?: string;
  templateTitle?: string;
}

export interface CrmSmsDispatchRecord {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientPhone: string;
  message: string;
  sentAt: string;
  status: 'Entregue' | 'Enviado' | 'Falha';
  templateTitle?: string;
}

export interface CrmState {
  templates: CrmMessageTemplate[];
  logs: CrmBroadcastLog[];
  recoveredRevenueTotal: number;
  abandonedCartOverrides: Record<string, CrmCartOverride>;
  smsDispatches?: Record<string, CrmSmsDispatchRecord>;
}

export type FinancialCostCategory = 
  | 'Artístico & Cachês' 
  | 'Estrutura & Cenografia' 
  | 'Marketing & Tráfego' 
  | 'Bar & Bebidas' 
  | 'Segurança & Operação' 
  | 'Taxas & Alvarás' 
  | 'Outros';

export interface FinancialCostItem {
  id: string;
  category: string;
  description: string;
  supplier: string;
  budgetedAmount: number;
  actualAmount: number;
  paymentStatus: 'Pago' | 'Pendente' | 'A Vencer' | 'Cancelado';
  dueDate?: string;
  paidAt?: string;
  notes?: string;
}

export type FinancialRevenueCategory = 
  | 'Bilheteria' 
  | 'Bar & A&B' 
  | 'Patrocínios' 
  | 'Camarotes & Lounges' 
  | 'Estacionamento' 
  | 'Merchandising' 
  | 'Outros';

export interface FinancialRevenueItem {
  id: string;
  category: string;
  description: string;
  channel: string;
  plannedQuantity?: number;
  soldQuantity?: number;
  unitPrice?: number;
  grossRevenue: number;
  platformFees: number;
  netRevenue: number;
  status: 'Recebido' | 'Parcial' | 'Previsto' | 'Inadimplente';
  date?: string;
  notes?: string;
}

export interface FinancialSheetsConfig {
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  spreadsheetTitle?: string;
  costsSheetName?: string;
  revenuesSheetName?: string;
  lastSyncedAt?: string;
  connectedUserEmail?: string;
  connectedUserName?: string;
  autoSync?: boolean;
}

export interface FinancialData {
  sheetsConfig?: FinancialSheetsConfig;
  costs: FinancialCostItem[];
  revenues: FinancialRevenueItem[];
  lastUpdated?: string;
}

export interface FinancialSummary {
  totalBudgetedCost: number;
  totalActualCost: number;
  totalPendingCost: number;
  totalGrossRevenue: number;
  totalPlatformFees: number;
  totalNetRevenue: number;
  projectedNetRevenue: number;
  netOperatingProfit: number;
  profitMarginPercent: number;
  breakEvenTickets: number;
  breakEvenRevenue: number;
  roiPercent: number;
  costPerAttendee: number;
}

export interface CampaignPlan {
  campaignName: string;
  objective: string;
  suggestedDailyBudget: number;
  biddingStrategy: string;
  audienceTargeting: {
    segments: string[];
    ageRange: string;
    geoLocations: string[];
    interestsAndLookalikes: string[];
  };
  adSetStructure: {
    name: string;
    format: string;
    budgetShare: string;
    hook3Seconds: string;
    copyPrimary: string;
    headline: string;
    callToAction: string;
    creativeVisualDirection: string;
  }[];
  benchmarkEstimates: {
    expectedCTR: string;
    expectedCPC: string;
    expectedCPA: string;
    expectedROAS: string;
  };
}

export interface HarshCriticReview {
  hookScore: number;
  copyScore: number;
  audienceFitScore: number;
  fatigueRisk: 'Baixo' | 'Médio' | 'Alto' | 'Iminente';
  verdict: 'APROVADO COM RESSALVAS' | 'REPROVADO IMEDIATAMENTE' | 'ALTA PROBABILIDADE DE SUCESSO';
  brutalFeedback: string;
  tacticalFixes: string[];
}

export interface HourlyAuditReport {
  reportTitle: string;
  cyclePeriod: string;
  efficiencyStatus: 'EXCELENTE' | 'ESTÁVEL' | 'ALERTA DE FADIGA' | 'NECESSITA OTIMIZAÇÃO';
  summary: string;
  deterministicRulesTriggered: {
    rule: string;
    conditionMet: string;
    automatedAction: string;
  }[];
  budgetRecommendations: {
    action: 'AUMENTAR' | 'MANTER' | 'REDISTRIBUIR' | 'REDUZIR';
    adjustmentPercent: string;
    rationale: string;
  };
  nextHourDirectives: string[];
}
