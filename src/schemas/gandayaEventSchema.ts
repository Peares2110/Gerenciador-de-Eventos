import { z } from 'zod';
import {
  EventData,
  GandayaReportData,
  GandayaPurchase,
  GandayaBatchSummary,
  GandayaPromoterLink,
  GandayaUserDemographic,
  GandayaAbandonedCart,
  AudienceData,
  LineupArtist,
  ArtDirectionData,
  DayPlan,
  HourlyAdMetric,
  SavedAdAsset,
  AdAccountIntegrations
} from '../types';

/**
 * Resilient number coersion:
 * Handles numbers, numeric strings, "R$ 40,00", commas, whitespace, and NaN fallbacks.
 */
export const numericCoerce = (defaultValue = 0) =>
  z.preprocess((val) => {
    if (typeof val === 'number') {
      return Number.isNaN(val) ? defaultValue : val;
    }
    if (typeof val === 'string') {
      const sanitized = val.replace(/R\$/gi, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
      const parsed = parseFloat(sanitized);
      return Number.isNaN(parsed) ? defaultValue : parsed;
    }
    if (val === null || val === undefined) return defaultValue;
    return Number(val) || defaultValue;
  }, z.number());

export const integerCoerce = (defaultValue = 0) =>
  z.preprocess((val) => {
    if (typeof val === 'number') {
      return Number.isNaN(val) ? defaultValue : Math.round(val);
    }
    if (typeof val === 'string') {
      const parsed = parseInt(val.replace(/\D/g, ''), 10);
      return Number.isNaN(parsed) ? defaultValue : parsed;
    }
    if (val === null || val === undefined) return defaultValue;
    return Math.round(Number(val)) || defaultValue;
  }, z.number().int());

// ==========================================
// 1. GANDAYA DATA SCHEMAS
// ==========================================

export const GandayaPurchaseSchema = z.object({
  userId: z.string().min(1, 'ID do usuário é obrigatório'),
  userName: z.string().default('Comprador'),
  userEmail: z.string().default(''),
  ticketId: z.string().min(1, 'ID do ingresso é obrigatório'),
  batchDescription: z.string().default('Ingresso Geral'),
  promoterLink: z.string().optional(),
  purchaseDate: z.string().default(''),
  quantity: numericCoerce(1).refine(n => n >= 0, 'Quantidade não pode ser negativa'),
  unitPrice: numericCoerce(0).refine(n => n >= 0, 'Preço unitário não pode ser negativo'),
  total: numericCoerce(0).refine(n => n >= 0, 'Valor total não pode ser negativo'),
  validated: z.boolean().optional().default(false)
});

export const GandayaBatchSummarySchema = z.object({
  batchId: z.string().min(1, 'ID do lote é obrigatório'),
  description: z.string().min(1, 'Descrição do lote é obrigatória'),
  nominalPrice: numericCoerce(0).refine(n => n >= 0, 'Preço nominal inválido'),
  averagePrice: numericCoerce(0).refine(n => n >= 0, 'Preço médio inválido'),
  salesCount: integerCoerce(0).refine(n => n >= 0, 'Contagem de vendas não pode ser negativa'),
  complimentaryCount: integerCoerce(0).refine(n => n >= 0, 'Cortesias não podem ser negativas'),
  externalPaymentsCount: integerCoerce(0).refine(n => n >= 0, 'Pagamentos externos não podem ser negativos')
});

export const GandayaPromoterLinkSchema = z.object({
  link: z.string().min(1, 'Identificador do link/promoter é obrigatório'),
  type: z.string().default('Desconto'),
  salesCount: integerCoerce(0).refine(n => n >= 0, 'Vendas do promoter não podem ser negativas')
});

export const GandayaUserDemographicSchema = z.object({
  userId: z.string().default(''),
  name: z.string().default('Usuário'),
  email: z.string().default(''),
  phone: z.string().default(''),
  age: numericCoerce(22).refine(n => n >= 0 && n <= 120, 'Idade demográfica fora da faixa aceitável'),
  gender: z.string().default('Não Informado')
});

export const GandayaAbandonedCartSchema = z.object({
  userId: z.string().default(''),
  userName: z.string().default('Cliente'),
  userEmail: z.string().default(''),
  userPhone: z.string().default(''),
  batchDescription: z.string().default('1º Lote'),
  quantity: integerCoerce(1).refine(n => n >= 1, 'Quantidade de carrinho deve ser no mínimo 1'),
  unitPrice: numericCoerce(0).refine(n => n >= 0, 'Preço unitário inválido'),
  total: numericCoerce(0).refine(n => n >= 0, 'Total do carrinho inválido'),
  paymentMethod: z.string().default('Pix'),
  createdAt: z.string().default('')
});

export const GandayaDemographicsSchema = z.object({
  averageAge: numericCoerce(23).refine(n => n >= 0, 'Média de idade inválida'),
  malePercentage: numericCoerce(50).refine(n => n >= 0 && n <= 100, 'Percentual masculino deve ser entre 0 e 100'),
  femalePercentage: numericCoerce(50).refine(n => n >= 0 && n <= 100, 'Percentual feminino deve ser entre 0 e 100'),
  topAreaCodes: z.array(
    z.object({
      ddd: z.string(),
      count: integerCoerce(0)
    })
  ).default([])
});

export const GandayaReportDataSchema = z.object({
  eventName: z.string().min(1, 'Nome do evento no relatório é obrigatório'),
  edition: z.string().default('Edição Atual'),
  generatedAt: z.string().default(''),
  totalTicketsSold: integerCoerce(0).refine(n => n >= 0, 'Total de ingressos vendidos inválido'),
  totalGrossRevenue: numericCoerce(0).refine(n => n >= 0, 'Faturamento bruto total inválido'),
  averageTicketPrice: numericCoerce(0).refine(n => n >= 0, 'Ticket médio inválido'),
  purchases: z.array(GandayaPurchaseSchema).default([]),
  batches: z.array(GandayaBatchSummarySchema).default([]),
  links: z.array(GandayaPromoterLinkSchema).default([]),
  users: z.array(GandayaUserDemographicSchema).default([]),
  abandonedCarts: z.array(GandayaAbandonedCartSchema).default([]),
  demographics: GandayaDemographicsSchema
});

// ==========================================
// 2. EVENT DATA SUB-SCHEMAS
// ==========================================

export const LineupArtistSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  timeSlot: z.string(),
  status: z.enum(['Confirmado', 'Em Negociação', 'Anunciado']),
  instagramHandle: z.string(),
  followers: z.string(),
  engagementRate: z.string()
});

export const AudienceDataSchema = z.object({
  primaryAge: z.string(),
  genderSplit: z.string(),
  peakEngagementHours: z.array(z.string()),
  topLocations: z.array(z.string()),
  musicAffinity: z.array(z.string())
});

export const ArtDirectionDataSchema = z.object({
  themeName: z.string(),
  colorPalette: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    background: z.string(),
    surface: z.string()
  }),
  visualStyle: z.string(),
  dosList: z.array(z.string()),
  dontsList: z.array(z.string()),
  tokenEfficiencyGuidelines: z.string(),
  samplePrompts: z.array(
    z.object({
      name: z.string(),
      ratio: z.string(),
      prompt: z.string()
    })
  )
});

export const FeedPostPlanSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(['feed', 'carrossel', 'collab']),
  scheduledTime: z.string(),
  visualConcept: z.string(),
  copySnippet: z.string(),
  status: z.enum(['Rascunho', 'Aprovado', 'Agendado', 'Publicado']),
  djTagged: z.string().optional()
});

export const StoryPlanSchema = z.object({
  id: z.string(),
  sequenceOrder: z.number(),
  scheduledTime: z.string(),
  objective: z.enum(['bastidores', 'engajamento', 'vendas_lote', 'revelacao', 'countdown']),
  format: z.enum(['enquete', 'video_dj', 'link_sticker', 'countdown', 'caixa_perguntas']),
  copy: z.string(),
  status: z.enum(['Rascunho', 'Aprovado', 'Agendado', 'Publicado'])
});

export const ReelPlanSchema = z.object({
  id: z.string(),
  title: z.string(),
  hook3s: z.string(),
  audioVibe: z.string(),
  pace: z.string(),
  duration: z.string(),
  scheduledTime: z.string(),
  status: z.enum(['Rascunho', 'Aprovado', 'Agendado', 'Publicado']),
  callToAction: z.string(),
  trendReference: z.string().optional(),
  trendFormat: z.string().optional(),
  hookVisual: z.string().optional(),
  hookVerbal: z.string().optional(),
  storytelling: z.string().optional(),
  climaxDrop: z.string().optional(),
  technicalDirection: z.string().optional(),
  captionSnippet: z.string().optional()
});

export const DailyAdPlanSchema = z.object({
  id: z.string(),
  campaignName: z.string(),
  format: z.string(),
  audienceSegment: z.string(),
  dailyBudget: z.number(),
  targetCpa: z.number(),
  hookAngle: z.string(),
  status: z.enum(['Rascunho', 'Ativo', 'Pausado', 'Concluído'])
});

export const DayPlanSchema = z.object({
  date: z.string(),
  milestoneLabel: z.string().optional(),
  posts: z.array(FeedPostPlanSchema).default([]),
  stories: z.array(StoryPlanSchema).default([]),
  reels: z.array(ReelPlanSchema).default([]),
  ads: z.array(DailyAdPlanSchema).default([])
});

export const HourlyAdMetricSchema = z.object({
  hour: z.string(),
  spend: z.number(),
  impressions: z.number(),
  clicks: z.number(),
  ctr: z.number(),
  cpc: z.number(),
  purchases: z.number(),
  revenue: z.number(),
  cpa: z.number(),
  roas: z.number(),
  status: z.enum(['normal', 'scaling', 'warning', 'critical']),
  deterministicAlert: z.string().optional()
});

export const AdAccountIntegrationsSchema = z.object({
  meta: z.object({
    connected: z.boolean(),
    adAccountId: z.string(),
    pixelId: z.string().optional(),
    instagramAccountId: z.string().optional(),
    accessToken: z.string().optional(),
    lastSyncedAt: z.string().optional()
  }).optional(),
  tiktok: z.object({
    connected: z.boolean(),
    advertiserId: z.string(),
    accessToken: z.string().optional(),
    lastSyncedAt: z.string().optional()
  }).optional(),
  google: z.object({
    connected: z.boolean(),
    customerId: z.string(),
    developerToken: z.string().optional(),
    lastSyncedAt: z.string().optional()
  }).optional(),
  googleCalendar: z.object({
    connected: z.boolean(),
    userEmail: z.string().optional(),
    userName: z.string().optional(),
    lastSyncedAt: z.string().optional(),
    syncedEventsCount: z.number().optional()
  }).optional()
}).optional();

export const GoogleCalendarEventSchema = z.object({
  id: z.string(),
  summary: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  start: z.object({
    dateTime: z.string().optional(),
    date: z.string().optional()
  }),
  end: z.object({
    dateTime: z.string().optional(),
    date: z.string().optional()
  }),
  htmlLink: z.string().optional(),
  status: z.string().optional(),
  syncedAt: z.string().optional()
});

export const SavedAdAssetSchema = z.object({
  id: z.string(),
  campaignName: z.string(),
  format: z.string(),
  hook3s: z.string(),
  copyPrimary: z.string(),
  headline: z.string().optional(),
  callToAction: z.string(),
  audienceSegment: z.string(),
  genre: z.string(),
  angle: z.string(),
  metrics: z.object({
    spend: z.number(),
    impressions: z.number(),
    clicks: z.number(),
    ctr: z.number(),
    cpc: z.number(),
    purchases: z.number(),
    revenue: z.number(),
    cpa: z.number(),
    roas: z.number()
  }),
  performanceTag: z.enum([
    'Winner (Campeão de Vendas)',
    'Alto Engajamento',
    'CPA Otimizado',
    'Em Teste',
    'Fadiga Rápida'
  ]),
  agentNotes: z.string(),
  createdAt: z.string()
});

// ==========================================
// 3. FULL EVENT DATA ROOT SCHEMA
// ==========================================

export const EventDataSchema = z.object({
  id: z.string().min(1, 'ID do evento é obrigatório'),
  name: z.string().min(1, 'Nome do evento é obrigatório'),
  tagline: z.string().default(''),
  genre: z.string().min(1, 'Gênero musical é obrigatório'),
  date: z.string().min(1, 'Data do evento é obrigatória'),
  city: z.string().min(1, 'Cidade do evento é obrigatória'),
  venue: z.string().min(1, 'Local do evento é obrigatório'),
  capacity: numericCoerce(1000).refine(n => n >= 0, 'Capacidade deve ser positiva'),
  targetSales: numericCoerce(800).refine(n => n >= 0, 'Meta de vendas deve ser positiva'),
  soldTickets: numericCoerce(0).refine(n => n >= 0, 'Ingressos vendidos deve ser positivo ou zero'),
  revenueTarget: numericCoerce(0).refine(n => n >= 0, 'Meta de faturamento inválida'),
  currentRevenue: numericCoerce(0).refine(n => n >= 0, 'Receita atual inválida'),
  currentLote: z.string().default('1º Lote'),
  loteCountdownHours: numericCoerce(0),
  ticketPriceLote: numericCoerce(0).refine(n => n >= 0, 'Preço do lote atual inválido'),
  status: z.enum([
    'pre_save',
    'early_bird',
    'lineup_drop',
    'sales_peak',
    'semana_evento',
    'd_day',
    'pos_evento'
  ]).default('sales_peak'),
  totalAdBudget: numericCoerce(0),
  spentAdBudget: numericCoerce(0),
  blendedRoas: numericCoerce(0),
  targetCpa: numericCoerce(0),
  currentCpa: numericCoerce(0),
  ctr: numericCoerce(0),
  cpc: numericCoerce(0),
  reach: numericCoerce(0),
  impressions: numericCoerce(0),
  frequency: numericCoerce(1),
  audience: AudienceDataSchema,
  lineup: z.array(LineupArtistSchema).default([]),
  artDirection: ArtDirectionDataSchema,
  calendar: z.record(z.string(), DayPlanSchema).default({}),
  hourlyMetrics: z.array(HourlyAdMetricSchema).default([]),
  integrations: AdAccountIntegrationsSchema,
  adLibrary: z.array(SavedAdAssetSchema).optional(),
  gandayaReport: GandayaReportDataSchema.optional(),
  googleCalendarEvents: z.array(GoogleCalendarEventSchema).optional()
});

// ==========================================
// 4. VALIDATION RESULT INTERFACES & HELPERS
// ==========================================

export interface SchemaValidationResult<T> {
  success: boolean;
  data?: T;
  errors: string[];
  formattedError: string;
}

export interface MergeGandayaResult {
  success: boolean;
  event?: EventData;
  validationErrors: string[];
  formattedError: string;
  metricsAudit?: {
    totalTicketsSold: number;
    totalGrossRevenue: number;
    averageTicketPrice: number;
    activeBatchesCount: number;
    abandonedCartsCount: number;
    promotersCount: number;
    demographicAuditSummary: string;
  };
}

/**
 * Format Zod issues into clear human-readable Portuguese descriptions
 */
export function formatZodIssues(issues: z.ZodIssue[]): string[] {
  return issues.map(issue => {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'raiz';
    return `[${path}]: ${issue.message}`;
  });
}

/**
 * Validates Gandaya report data parsed from spreadsheet (.xlsx / .csv)
 */
export function validateGandayaReport(data: unknown): SchemaValidationResult<GandayaReportData> {
  const result = GandayaReportDataSchema.safeParse(data);
  if (result.success) {
    return {
      success: true,
      data: result.data as GandayaReportData,
      errors: [],
      formattedError: ''
    };
  }

  const errors = formatZodIssues(result.error.issues);
  return {
    success: false,
    errors,
    formattedError: `Falha de validação da planilha Gandaya (${errors.length} inconsistências encontradas):\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n...e mais ${errors.length - 5} erros.` : ''}`
  };
}

/**
 * Validates full EventData object before updating global React state or persisting
 */
export function validateEventData(data: unknown): SchemaValidationResult<EventData> {
  const result = EventDataSchema.safeParse(data);
  if (result.success) {
    return {
      success: true,
      data: result.data as EventData,
      errors: [],
      formattedError: ''
    };
  }

  const errors = formatZodIssues(result.error.issues);
  return {
    success: false,
    errors,
    formattedError: `Estrutura de EventData inválida (${errors.length} inconsistências):\n${errors.slice(0, 5).join('\n')}`
  };
}

/**
 * Safely merges Gandaya spreadsheet metrics into the active EventData instance.
 * Guarantees zero runtime crashes or broken marketing flows by running
 * strict Zod validation on both the incoming Gandaya data and the resulting EventData.
 */
export function safeMergeGandayaIntoEvent(
  currentEvent: EventData,
  gandayaReport: GandayaReportData
): MergeGandayaResult {
  // 1. Validate the Gandaya Report
  const gandayaValidation = validateGandayaReport(gandayaReport);
  if (!gandayaValidation.success || !gandayaValidation.data) {
    return {
      success: false,
      validationErrors: gandayaValidation.errors,
      formattedError: `Erro ao validar dados da planilha Gandaya: ${gandayaValidation.formattedError}`
    };
  }

  const validGandaya = gandayaValidation.data;

  // 2. Derive synchronized audience and batch metrics
  const primaryAgeStr = validGandaya.demographics?.averageAge
    ? `${Math.max(16, Math.round(validGandaya.demographics.averageAge - 4))}-${Math.round(validGandaya.demographics.averageAge + 5)} anos (Auditado Gandaya: média ${validGandaya.demographics.averageAge})`
    : currentEvent.audience?.primaryAge || '18-28 anos';

  const genderSplitStr = (validGandaya.demographics?.malePercentage !== undefined && validGandaya.demographics?.femalePercentage !== undefined)
    ? `${validGandaya.demographics.malePercentage}% Homens / ${validGandaya.demographics.femalePercentage}% Mulheres`
    : currentEvent.audience?.genderSplit || '50% Homens / 50% Mulheres';

  // Determine current active lote from Gandaya batches if available
  let activeLoteName = currentEvent.currentLote;
  let activeLotePrice = currentEvent.ticketPriceLote;
  if (validGandaya.batches && validGandaya.batches.length > 0) {
    const activeBatch = validGandaya.batches.find(b => b.salesCount > 0) || validGandaya.batches[0];
    if (activeBatch) {
      activeLoteName = activeBatch.description;
      activeLotePrice = activeBatch.nominalPrice || activeBatch.averagePrice || currentEvent.ticketPriceLote;
    }
  }

  // 3. Construct updated EventData candidate
  const candidateEventData: EventData = {
    ...currentEvent,
    soldTickets: validGandaya.totalTicketsSold,
    currentRevenue: validGandaya.totalGrossRevenue,
    currentLote: activeLoteName,
    ticketPriceLote: activeLotePrice,
    audience: {
      ...currentEvent.audience,
      primaryAge: primaryAgeStr,
      genderSplit: genderSplitStr
    },
    gandayaReport: validGandaya
  };

  // 4. Validate candidate against full EventDataSchema
  const eventValidation = validateEventData(candidateEventData);
  if (!eventValidation.success || !eventValidation.data) {
    return {
      success: false,
      validationErrors: eventValidation.errors,
      formattedError: `Os dados mesclados da Gandaya geraram um EventData inválido: ${eventValidation.formattedError}`
    };
  }

  return {
    success: true,
    event: eventValidation.data,
    validationErrors: [],
    formattedError: '',
    metricsAudit: {
      totalTicketsSold: validGandaya.totalTicketsSold,
      totalGrossRevenue: validGandaya.totalGrossRevenue,
      averageTicketPrice: validGandaya.averageTicketPrice,
      activeBatchesCount: validGandaya.batches?.length || 0,
      abandonedCartsCount: validGandaya.abandonedCarts?.length || 0,
      promotersCount: validGandaya.links?.length || 0,
      demographicAuditSummary: `${primaryAgeStr} | ${genderSplitStr}`
    }
  };
}
