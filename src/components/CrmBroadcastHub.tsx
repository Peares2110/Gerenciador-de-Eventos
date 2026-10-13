import React, { useState, useMemo, useRef } from 'react';
import { 
  Smartphone, 
  Send, 
  MessageSquare, 
  Mail, 
  Users, 
  ShoppingCart, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  RefreshCw, 
  ExternalLink, 
  Copy, 
  Check, 
  Search, 
  Filter, 
  ArrowUpRight, 
  DollarSign, 
  Flame, 
  Music, 
  Navigation, 
  Calendar,
  Share2,
  Plus,
  Edit3,
  Trash2,
  Bookmark,
  Layers,
  ChevronDown,
  Eye,
  X,
  Play,
  RotateCcw,
  Tag,
  Link as LinkIcon,
  TrendingUp,
  MousePointerClick,
  BarChart3
} from 'lucide-react';
import { 
  EventData, 
  CrmContact, 
  CrmMessageTemplate, 
  CrmBroadcastLog 
} from '../types';
import { SheetsExportButton } from './SheetsExportButton';
import { ConversionAnalytics } from './ConversionAnalytics';
import { ContactSmsManager } from './ContactSmsManager';

interface CrmBroadcastHubProps {
  event: EventData;
  onUpdateEvent: (updated: EventData) => void;
  onNavigateToTab?: (tabId: string) => void;
}

// ==========================================
// DEFINIÇÃO DAS VARIÁVEIS DINÂMICAS DISPONÍVEIS
// ==========================================
export interface DynamicVariable {
  key: string;
  label: string;
  description: string;
  example: string;
  category: 'cliente' | 'carrinho' | 'evento';
  isPrimary?: boolean;
}

export const DYNAMIC_VARIABLES: DynamicVariable[] = [
  {
    key: '{nome}',
    label: 'Nome do Cliente',
    description: 'Primeiro nome ou nome completo do participante',
    example: 'Matheus Fontes',
    category: 'cliente',
    isPrimary: true
  },
  {
    key: '{link_carrinho}',
    label: 'Link do Carrinho',
    description: 'Link direto e exclusivo para finalizar a compra do ingresso abandonado',
    example: 'https://gandaya.com/eventos/insonia-macae-2026/checkout?c=cart-1',
    category: 'carrinho',
    isPrimary: true
  },
  {
    key: '{evento}',
    label: 'Nome do Evento',
    description: 'Nome oficial do evento cadastrado',
    example: 'INSONIA FESTIVAL - EDIÇÃO MACAÉ',
    category: 'evento',
    isPrimary: true
  },
  {
    key: '{lote}',
    label: 'Lote / Ingresso',
    description: 'Descrição do lote do carrinho ou lote ativo',
    example: '2º Lote Pista Geral',
    category: 'carrinho'
  },
  {
    key: '{valor_carrinho}',
    label: 'Valor Total',
    description: 'Valor total do pedido retido no carrinho',
    example: 'R$ 240,00',
    category: 'carrinho'
  },
  {
    key: '{quantidade}',
    label: 'Quantidade',
    description: 'Número de ingressos no carrinho',
    example: '2',
    category: 'carrinho'
  },
  {
    key: '{horas_restantes}',
    label: 'Horas Restantes',
    description: 'Horas até a virada de lote programada',
    example: '4h',
    category: 'evento'
  },
  {
    key: '{link_ingresso}',
    label: 'Link de Ingressos',
    description: 'Página geral de venda de ingressos do evento',
    example: 'https://gandaya.com/eventos/insonia-macae-2026/ingressos',
    category: 'evento'
  },
  {
    key: '{local}',
    label: 'Local / Cidade',
    description: 'Local físico do evento ou cidade',
    example: 'Praia dos Cavaleiros, Macaé',
    category: 'evento'
  }
];

// ==========================================
// TEMPLATES PADRÃO DE ALTA CONVERSÃO
// ==========================================
const DEFAULT_TEMPLATES: CrmMessageTemplate[] = [
  {
    id: 'tpl-sms-urgencia-lote',
    title: 'SMS: Virada de Lote em Poucas Horas',
    category: 'urgencia_lote',
    recommendedChannel: 'sms',
    text: '{evento}: Oi {nome}, o {lote} encerra nas proximas {horas_restantes}h! Garanta antes do reajuste: {link_ingresso}',
    variables: ['nome', 'evento', 'lote', 'horas_restantes', 'link_ingresso']
  },
  {
    id: 'tpl-sms-recuperacao-carrinho',
    title: 'SMS: Recuperação de Carrinho Vencendo',
    category: 'recuperacao_carrinho',
    recommendedChannel: 'sms',
    text: '{evento}: {nome}, sua reserva de {quantidade} ingresso(s) no {lote} expira em breve. Conclua seu pedido: {link_carrinho}',
    variables: ['nome', 'evento', 'quantidade', 'lote', 'link_carrinho']
  },
  {
    id: 'tpl-sms-pix-imediato',
    title: 'SMS: Suporte PIX e Chave Reservada',
    category: 'recuperacao_carrinho',
    recommendedChannel: 'sms',
    text: '{evento}: {nome}, seu pedido de {valor_carrinho} ({lote}) esta reservado no PIX. Pague com 1 clique: {link_carrinho}',
    variables: ['nome', 'evento', 'valor_carrinho', 'lote', 'link_carrinho']
  },
  {
    id: 'tpl-sms-d-day',
    title: 'SMS: D-Day Portões Abertos & Check-in',
    category: 'd_day',
    recommendedChannel: 'sms',
    text: '{evento}: {nome}, e hoje! Portas abrem as 22h em {local}. Acesse seu QR Code oficial: {link_ingresso} Bom evento!',
    variables: ['nome', 'evento', 'local', 'link_ingresso']
  },
  {
    id: 'tpl-sms-lineup-drop',
    title: 'SMS: Lineup Oficial Revelado',
    category: 'lineup_drop',
    recommendedChannel: 'sms',
    text: '{evento}: Lineup oficial confirmado! {nome}, garanta seu ingresso promocional antes de esgotar: {link_ingresso}',
    variables: ['nome', 'evento', 'link_ingresso']
  },
  {
    id: 'tpl-recuperacao-carrinho',
    title: 'Recuperação de Carrinho: Ingresso Reservado',
    category: 'recuperacao_carrinho',
    recommendedChannel: 'whatsapp',
    subject: 'Seu ingresso para {evento} ainda está reservado!',
    text: 'Oi, {nome}! Tudo bem? 👋\n\nNotamos que você começou a emissão do seu ingresso para o *{evento}* ({lote}), mas o pagamento não foi concluído.\n\nPara você não perder o valor atual e nem ficar de fora, seguramos a sua reserva especial por tempo limitado! 🎫🔒\n\nFinalize seu pedido com total segurança pelo link direto:\n{link_carrinho}\n\nSe precisar de ajuda com PIX ou parcelamento, me responda aqui!',
    variables: ['nome', 'evento', 'lote', 'link_carrinho']
  },
  {
    id: 'tpl-carrinho-urgencia-unidades',
    title: 'Recuperação de Carrinho: Últimas Unidades do Lote',
    category: 'recuperacao_carrinho',
    recommendedChannel: 'whatsapp',
    subject: 'Alerta de cancelamento de reserva - {evento}',
    text: 'Fala, {nome}! Tudo bem? ⚡\n\nIdentificamos o seu pedido pendente de {quantidade} ingresso(s) ({lote}) no valor de {valor_carrinho} para o *{evento}*.\n\nComo este lote já está nas últimas 50 unidades, o sistema liberará sua reserva para a fila de espera em breve! ⏳\n\nGaranta seu acesso agora antes da virada de preço:\n{link_carrinho}\n\nTe esperamos na pista!',
    variables: ['nome', 'evento', 'quantidade', 'lote', 'valor_carrinho', 'link_carrinho']
  },
  {
    id: 'tpl-carrinho-pix-facil',
    title: 'Recuperação de Carrinho: Suporte PIX Imediato',
    category: 'recuperacao_carrinho',
    recommendedChannel: 'whatsapp',
    subject: 'Teve problemas no pagamento? Estamos aqui para ajudar',
    text: 'Olá, {nome}! Aqui é da produção do *{evento}* 👋\n\nVimos que você tentou garantir seu ingresso ({lote}), mas o pedido constou como pendente.\n\nCaso tenha tido qualquer instabilidade com banco ou cartão, geramos uma chave PIX ou link direto com aprovação instantânea:\n{link_carrinho}\n\nPrecisa de algum suporte com seu pedido? É só responder a esta mensagem!',
    variables: ['nome', 'evento', 'lote', 'link_carrinho']
  },
  {
    id: 'tpl-urgencia-virada',
    title: 'Urgência Máxima: Virada de Lote em Poucas Horas',
    category: 'urgencia_lote',
    recommendedChannel: 'whatsapp',
    subject: 'Últimas horas antes da virada de lote - {evento}',
    text: 'Fala, {nome}! 🔥\n\nPassando para avisar que o {lote} do *{evento}* está nas últimas unidades e vai virar nas próximas {horas_restantes} horas! ⏳\n\nNão deixe para pagar mais caro depois: garanta agora o seu ingresso oficial no valor promocional de {valor_carrinho}.\n\n🎟️ Link oficial de compra rápida:\n{link_ingresso}\n\nTe esperamos na Orla dos Cavaleiros! ⚡',
    variables: ['nome', 'evento', 'lote', 'horas_restantes', 'valor_carrinho', 'link_ingresso']
  },
  {
    id: 'tpl-lineup-drop',
    title: 'Anúncio de Atração / Lineup Completo',
    category: 'lineup_drop',
    recommendedChannel: 'ambos',
    subject: 'Lineup oficial do {evento} acaba de ser revelado! 💥',
    text: 'Preparado, {nome}? 🔊\n\nO lineup oficial do *{evento}* está no ar! Os maiores DJs e atrações reunidos na mesma noite em Macaé.\n\nA procura disparou hoje. Garanta seu lugar antes que o lote esgote:\n{link_ingresso}\n\nCompartilhe com o seu squad!',
    variables: ['nome', 'evento', 'link_ingresso']
  },
  {
    id: 'tpl-guia-chegada',
    title: 'Guia de Chegada & Estacionamento (48h antes)',
    category: 'guia_chegada',
    recommendedChannel: 'email',
    subject: 'Informações Importantes: Como chegar no {evento}',
    text: 'Olá, {nome}!\n\nFaltam apenas 2 dias para a {evento}! Preparamos um guia rápido para sua experiência ser perfeita:\n\n📍 Local: {local}\n⏰ Abertura dos portões: 22h00\n🚗 Estacionamento oficial: Vagas limitadas credenciadas na orla\n🆔 Documento: Apresente documento oficial com foto e o QR Code do seu ingresso no celular\n\nQualquer dúvida, conte com a nossa produção!',
    variables: ['nome', 'evento', 'local']
  },
  {
    id: 'tpl-pos-evento',
    title: 'Pós-Evento: Fotos Oficiais & Feedback',
    category: 'pos_evento',
    recommendedChannel: 'whatsapp',
    subject: 'Que noite inesquecível! Fotos oficiais do {evento}',
    text: 'Fala, {nome}! Obrigado pela energia épica ontem na {evento}! 🚀✨\n\nO álbum com as fotos oficiais em alta resolução já está disponível. Acesse e marque a @insoniafestival!\n\nQueremos saber como foi a sua experiência: responda com uma nota de 1 a 10 para nos ajudar a fazer a próxima edição ainda melhor! 🖤',
    variables: ['nome', 'evento']
  }
];

export const CrmBroadcastHub: React.FC<CrmBroadcastHubProps> = ({
  event,
  onUpdateEvent,
  onNavigateToTab
}) => {
  const [activeTab, setActiveTab] = useState<'carrinhos' | 'disparos' | 'analytics' | 'contatos'>('carrinhos');
  
  // Templates state
  const templates = useMemo(() => {
    const customOrExisting = event.crm?.templates && event.crm.templates.length > 0 
      ? event.crm.templates 
      : DEFAULT_TEMPLATES;
    const existingIds = new Set(customOrExisting.map(t => t.id));
    const missing = DEFAULT_TEMPLATES.filter(t => !existingIds.has(t.id));
    return [...customOrExisting, ...missing];
  }, [event.crm?.templates]);

  // Selected template id in the main editor
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    templates.find(t => t.category === 'recuperacao_carrinho')?.id || templates[0]?.id
  );

  // Active template for 1-click cart recovery
  const [activeCartRecoveryTemplateId, setActiveCartRecoveryTemplateId] = useState<string>(
    templates.find(t => t.category === 'recuperacao_carrinho')?.id || templates[0]?.id
  );

  const selectedTemplate = useMemo(() => {
    return templates.find(t => t.id === selectedTemplateId) || templates[0];
  }, [templates, selectedTemplateId]);

  const activeCartRecoveryTemplate = useMemo(() => {
    return templates.find(t => t.id === activeCartRecoveryTemplateId) || templates[0];
  }, [templates, activeCartRecoveryTemplateId]);

  // Draft state in Editor
  const [messageDraft, setMessageDraft] = useState<string>(selectedTemplate.text);
  const [messageSubject, setMessageSubject] = useState<string>(selectedTemplate.subject || '');
  const [selectedChannel, setSelectedChannel] = useState<'whatsapp' | 'email' | 'sms'>(
    selectedTemplate.recommendedChannel === 'email' ? 'email' : 'whatsapp'
  );
  const [audienceFilter, setAudienceFilter] = useState<'todos' | 'carrinhos' | 'lote_ativo' | 'vip'>('carrinhos');

  // Filter templates category in selector
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string>('todos');
  const [templateSearchTerm, setTemplateSearchTerm] = useState<string>('');

  // Status notification feedback
  const [copiedText, setCopiedText] = useState(false);
  const [isAiRefining, setIsAiRefining] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Simulation test lead selection
  const [simulatedLeadIndex, setSimulatedLeadIndex] = useState<number>(0);

  // Search & Filter in cart list
  const [searchTerm, setSearchTerm] = useState('');
  const [cartStatusFilter, setCartStatusFilter] = useState<string>('all');

  // Modal: Custom / Edit Template
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CrmMessageTemplate | null>(null);

  // Modal: Individual Cart Lead Preview & Send
  const [previewCartLead, setPreviewCartLead] = useState<any | null>(null);
  const [customCartLeadMessage, setCustomCartLeadMessage] = useState<string>('');
  const [customCartLeadTemplateId, setCustomCartLeadTemplateId] = useState<string>('');

  // Bulk dispatch simulation state
  const [isBulkDispatching, setIsBulkDispatching] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);

  // Reference for textarea to support cursor insertion
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modalTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Abandoned Carts from Gandaya Report
  const abandonedCarts = useMemo(() => {
    return event.gandayaReport?.abandonedCarts || [];
  }, [event.gandayaReport?.abandonedCarts]);

  const cartOverrides = useMemo(() => {
    return event.crm?.abandonedCartOverrides || {};
  }, [event.crm?.abandonedCartOverrides]);

  // Sync draft when template changes
  const handleSelectTemplate = (tpl: CrmMessageTemplate) => {
    setSelectedTemplateId(tpl.id);
    setMessageDraft(tpl.text);
    setMessageSubject(tpl.subject || '');
    if (tpl.recommendedChannel === 'whatsapp' || tpl.recommendedChannel === 'email' || tpl.recommendedChannel === 'sms') {
      setSelectedChannel(tpl.recommendedChannel);
    }
  };

  // Interpolate dynamic variables into template text
  const formatMessageForContact = (
    rawText: string, 
    contactParams: {
      name?: string;
      batch?: string;
      customPaymentLink?: string;
      cartTotal?: number;
      ticketQty?: number;
    }
  ) => {
    const name = contactParams.name || 'Participante';
    const batch = contactParams.batch || event.currentLote || 'Lote 1';
    const checkoutLink = contactParams.customPaymentLink || `https://gandaya.com/eventos/${event.id}/checkout`;
    const priceFormatted = contactParams.cartTotal !== undefined 
      ? `R$ ${contactParams.cartTotal.toFixed(2)}` 
      : (event.ticketPriceLote ? `R$ ${event.ticketPriceLote.toFixed(2)}` : 'R$ 90,00');
    const qty = contactParams.ticketQty !== undefined ? String(contactParams.ticketQty) : '1';

    return rawText
      // Nome do cliente
      .replace(/{nome}/g, name)
      .replace(/{cliente}/g, name)
      // Link do carrinho
      .replace(/{link_carrinho}/g, checkoutLink)
      .replace(/{link_pagamento}/g, checkoutLink)
      // Nome do evento
      .replace(/{evento}/g, event.name)
      .replace(/{nome_evento}/g, event.name)
      // Demais variáveis
      .replace(/{lote}/g, batch)
      .replace(/{horas_restantes}/g, String(event.loteCountdownHours || 4))
      .replace(/{preco}/g, priceFormatted)
      .replace(/{valor_carrinho}/g, priceFormatted)
      .replace(/{quantidade}/g, qty)
      .replace(/{link_ingresso}/g, `https://gandaya.com/eventos/${event.id}/ingressos`)
      .replace(/{local}/g, event.venue || event.city || 'Macaé');
  };

  // Currently simulated test lead
  const currentSimulatedLead = useMemo(() => {
    if (abandonedCarts.length > 0 && abandonedCarts[simulatedLeadIndex]) {
      const c = abandonedCarts[simulatedLeadIndex];
      return {
        name: c.userName,
        batch: c.batchDescription,
        cartTotal: c.total,
        ticketQty: c.quantity,
        customPaymentLink: `https://gandaya.com/eventos/${event.id}/checkout?cartId=${c.userId}`
      };
    }
    return {
      name: 'Matheus Fontes de Souza',
      batch: '2º Lote Pista Geral',
      cartTotal: 240,
      ticketQty: 2,
      customPaymentLink: `https://gandaya.com/eventos/${event.id}/checkout?cartId=cart-1`
    };
  }, [abandonedCarts, simulatedLeadIndex, event.id]);

  // Calculated sample preview text
  const previewMessage = useMemo(() => {
    return formatMessageForContact(messageDraft, currentSimulatedLead);
  }, [messageDraft, currentSimulatedLead, event]);

  // Abandoned Carts Financial Metrics
  const cartMetrics = useMemo(() => {
    const totalCount = abandonedCarts.length;
    const totalRetained = abandonedCarts.reduce((acc, c) => acc + (c.total || 0), 0);
    
    let recoveredCount = 0;
    let recoveredValue = 0;
    let contactedCount = 0;
    let clickedCount = 0;
    let totalClicks = 0;

    abandonedCarts.forEach(c => {
      const override = cartOverrides[c.userId];
      const status = override?.status || 'Pendente';
      const clicks = override?.linkClicks || 0;

      if (clicks > 0) {
        clickedCount += 1;
        totalClicks += clicks;
      }

      if (status === 'Recuperado') {
        recoveredCount += 1;
        recoveredValue += (c.total || 0);
      } else if (status === 'Contatado') {
        contactedCount += 1;
      }
    });

    const recoveryRate = totalCount > 0 ? (recoveredCount / totalCount) * 100 : 0;
    // Conversion rate in relation to clicked payment links
    const conversionRateFromClicks = clickedCount > 0 ? (recoveredCount / clickedCount) * 100 : 0;
    const clickThroughRate = (contactedCount + recoveredCount) > 0 
      ? (clickedCount / (contactedCount + recoveredCount)) * 100 
      : 0;

    return {
      totalCount,
      totalRetained,
      recoveredCount,
      recoveredValue,
      contactedCount,
      clickedCount,
      totalClicks,
      recoveryRate,
      conversionRateFromClicks,
      clickThroughRate,
      pendingCount: totalCount - recoveredCount
    };
  }, [abandonedCarts, cartOverrides]);

  // Insert dynamic variable tag into messageDraft textarea at cursor
  const handleInsertVariable = (variableKey: string, target: 'editor' | 'modal' = 'editor') => {
    if (target === 'editor') {
      const textarea = textareaRef.current;
      if (!textarea) {
        setMessageDraft(prev => prev + ` ${variableKey}`);
        return;
      }
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const current = messageDraft;
      const updated = current.substring(0, start) + variableKey + current.substring(end);
      setMessageDraft(updated);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variableKey.length, start + variableKey.length);
      }, 0);
    } else if (target === 'modal' && editingTemplate) {
      const textarea = modalTextareaRef.current;
      if (!textarea) {
        setEditingTemplate(prev => prev ? { ...prev, text: prev.text + ` ${variableKey}` } : null);
        return;
      }
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const current = editingTemplate.text;
      const updated = current.substring(0, start) + variableKey + current.substring(end);
      setEditingTemplate(prev => prev ? { ...prev, text: updated } : null);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variableKey.length, start + variableKey.length);
      }, 0);
    }

    setStatusMessage({
      text: `Variável ${variableKey} inserida no modelo!`,
      type: 'info'
    });
  };

  // Save changes to current template or save as custom template
  const handleSaveTemplateChanges = async (isNew: boolean = false) => {
    let tplToSave: CrmMessageTemplate;

    if (isNew) {
      tplToSave = {
        id: `tpl-custom-${Date.now()}`,
        title: `${selectedTemplate.title} (Personalizado)`,
        category: 'custom',
        recommendedChannel: selectedChannel,
        subject: messageSubject,
        text: messageDraft,
        variables: ['nome', 'evento', 'link_carrinho']
      };
    } else {
      tplToSave = {
        ...selectedTemplate,
        text: messageDraft,
        subject: messageSubject,
        recommendedChannel: selectedChannel
      };
    }

    const updatedTemplates = isNew 
      ? [...templates, tplToSave]
      : templates.map(t => t.id === tplToSave.id ? tplToSave : t);

    const updatedEvent: EventData = {
      ...event,
      crm: {
        templates: updatedTemplates,
        logs: event.crm?.logs || [],
        recoveredRevenueTotal: event.crm?.recoveredRevenueTotal || 0,
        abandonedCartOverrides: cartOverrides
      }
    };

    onUpdateEvent(updatedEvent);

    if (isNew) {
      setSelectedTemplateId(tplToSave.id);
    }

    // Persist via backend
    try {
      await fetch(`/api/events/${event.id}/crm/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates: updatedTemplates })
      });
      setStatusMessage({
        text: isNew ? 'Novo modelo personalizado criado e salvo com sucesso!' : 'Alterações do modelo salvas com sucesso!',
        type: 'success'
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Delete a custom template
  const handleDeleteTemplate = async (templateId: string) => {
    const updatedTemplates = templates.filter(t => t.id !== templateId);
    const updatedEvent: EventData = {
      ...event,
      crm: {
        templates: updatedTemplates,
        logs: event.crm?.logs || [],
        recoveredRevenueTotal: event.crm?.recoveredRevenueTotal || 0,
        abandonedCartOverrides: cartOverrides
      }
    };

    onUpdateEvent(updatedEvent);
    if (selectedTemplateId === templateId) {
      setSelectedTemplateId(updatedTemplates[0]?.id || DEFAULT_TEMPLATES[0].id);
      setMessageDraft(updatedTemplates[0]?.text || DEFAULT_TEMPLATES[0].text);
    }

    try {
      await fetch(`/api/events/${event.id}/crm/templates/${templateId}`, {
        method: 'DELETE'
      });
      setStatusMessage({ text: 'Modelo removido com sucesso.', type: 'info' });
    } catch (e) {
      console.error(e);
    }
  };

  // Reset templates back to defaults
  const handleResetToDefaultTemplates = async () => {
    const updatedEvent: EventData = {
      ...event,
      crm: {
        templates: DEFAULT_TEMPLATES,
        logs: event.crm?.logs || [],
        recoveredRevenueTotal: event.crm?.recoveredRevenueTotal || 0,
        abandonedCartOverrides: cartOverrides
      }
    };
    onUpdateEvent(updatedEvent);
    setSelectedTemplateId(DEFAULT_TEMPLATES[0].id);
    setMessageDraft(DEFAULT_TEMPLATES[0].text);

    try {
      await fetch(`/api/events/${event.id}/crm/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates: DEFAULT_TEMPLATES })
      });
      setStatusMessage({ text: 'Biblioteca de modelos restaurada para os padrões originais!', type: 'success' });
    } catch (e) {
      console.error(e);
    }
  };

  // Open WhatsApp for a single lead with formatted text
  const handleOpenWhatsApp = async (
    phone: string, 
    name: string, 
    batch: string, 
    cartId?: string, 
    totalAmount?: number,
    ticketQty: number = 1,
    customTextOverride?: string
  ) => {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10 || cleanPhone.length === 11) {
      cleanPhone = `55${cleanPhone}`;
    }
    
    const checkoutLink = cartId 
      ? `https://gandaya.com/eventos/${event.id}/checkout?cartId=${cartId}`
      : `https://gandaya.com/eventos/${event.id}/checkout`;

    const textSource = customTextOverride || activeCartRecoveryTemplate.text;

    const textToSend = formatMessageForContact(textSource, {
      name,
      batch,
      cartTotal: totalAmount,
      ticketQty,
      customPaymentLink: checkoutLink
    });

    const encoded = encodeURIComponent(textToSend);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;

    // Mark as Contacted if cartId is provided
    if (cartId && cartOverrides[cartId]?.status !== 'Recuperado') {
      await handleUpdateCartStatus(cartId, 'Contatado', totalAmount, ticketQty);
    }

    // Open WhatsApp Web
    window.open(waUrl, '_blank');
  };

  // Open Individual Lead Preview Modal
  const handleOpenLeadModal = (cart: any) => {
    setPreviewCartLead(cart);
    const initialTpl = activeCartRecoveryTemplate;
    setCustomCartLeadTemplateId(initialTpl.id);
    const rendered = formatMessageForContact(initialTpl.text, {
      name: cart.userName,
      batch: cart.batchDescription,
      cartTotal: cart.total,
      ticketQty: cart.quantity,
      customPaymentLink: `https://gandaya.com/eventos/${event.id}/checkout?cartId=${cart.userId}`
    });
    setCustomCartLeadMessage(rendered);
  };

  // Switch template inside individual lead modal
  const handleSwitchModalLeadTemplate = (tplId: string) => {
    setCustomCartLeadTemplateId(tplId);
    const tpl = templates.find(t => t.id === tplId) || templates[0];
    if (previewCartLead) {
      const rendered = formatMessageForContact(tpl.text, {
        name: previewCartLead.userName,
        batch: previewCartLead.batchDescription,
        cartTotal: previewCartLead.total,
        ticketQty: previewCartLead.quantity,
        customPaymentLink: `https://gandaya.com/eventos/${event.id}/checkout?cartId=${previewCartLead.userId}`
      });
      setCustomCartLeadMessage(rendered);
    }
  };

  // Action: Simulate/Track click on a payment link
  const handleSimulateCartClick = async (cartId: string) => {
    try {
      const res = await fetch(`/api/events/${event.id}/crm/track-click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartId,
          templateId: activeCartRecoveryTemplate.id,
          templateTitle: activeCartRecoveryTemplate.title
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.crm) {
          onUpdateEvent({
            ...event,
            crm: data.crm
          });
          setStatusMessage({
            text: 'Clique no link de checkout registrado com sucesso no Analytics!',
            type: 'info'
          });
        }
      }
    } catch (e) {
      console.error('Error tracking click:', e);
    }
  };

  // Update Cart Status
  const handleUpdateCartStatus = async (
    cartId: string, 
    newStatus: 'Pendente' | 'Contatado' | 'Recuperado' | 'Desistiu',
    cartTotal?: number,
    ticketQty: number = 1
  ) => {
    const existing = cartOverrides[cartId] || {};
    const updatedOverrides = {
      ...cartOverrides,
      [cartId]: {
        ...existing,
        status: newStatus,
        lastContactedAt: new Date().toISOString(),
        dispatchedCount: (existing.dispatchedCount || 0) + (newStatus === 'Contatado' ? 1 : 0),
        linkClicks: existing.linkClicks || (newStatus === 'Recuperado' ? 1 : 0)
      }
    };

    let updatedRecoveredTotal = event.crm?.recoveredRevenueTotal || 0;
    let newCurrentRevenue = event.currentRevenue;
    let newSoldTickets = event.soldTickets;

    const previousStatus = existing.status;
    if (newStatus === 'Recuperado' && previousStatus !== 'Recuperado') {
      const val = cartTotal || 0;
      updatedRecoveredTotal += val;
      newCurrentRevenue += val;
      newSoldTickets += ticketQty;
    }

    const updatedEvent: EventData = {
      ...event,
      currentRevenue: newCurrentRevenue,
      soldTickets: newSoldTickets,
      crm: {
        templates,
        logs: event.crm?.logs || [],
        recoveredRevenueTotal: updatedRecoveredTotal,
        abandonedCartOverrides: updatedOverrides
      }
    };

    onUpdateEvent(updatedEvent);

    await fetch(`/api/events/${event.id}/crm/abandoned-cart-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cartId,
        status: newStatus,
        recoveredAmount: cartTotal || 0,
        ticketQuantity: ticketQty
      })
    });

    setStatusMessage({
      text: `Status do pedido atualizado para "${newStatus}".`,
      type: 'success'
    });
  };

  // Run Batch Automation Simulation for all pending carts
  const handleRunBatchCartDispatch = async () => {
    const pendingCarts = abandonedCarts.filter(c => {
      const st = cartOverrides[c.userId]?.status || 'Pendente';
      return st === 'Pendente';
    });

    if (pendingCarts.length === 0) {
      setStatusMessage({ text: 'Não há carrinhos com status Pendente para disparar no momento.', type: 'info' });
      return;
    }

    setIsBulkDispatching(true);
    setBulkProgress(0);

    const updatedOverrides = { ...cartOverrides };
    for (let i = 0; i < pendingCarts.length; i++) {
      const c = pendingCarts[i];
      updatedOverrides[c.userId] = {
        status: 'Contatado',
        lastContactedAt: new Date().toISOString()
      };
      setBulkProgress(Math.round(((i + 1) / pendingCarts.length) * 100));
      // Artificial slight delay for realistic UI feedback
      await new Promise(r => setTimeout(r, 120));
    }

    const logEntry: CrmBroadcastLog = {
      id: `log-bulk-${Date.now()}`,
      templateTitle: activeCartRecoveryTemplate.title,
      category: activeCartRecoveryTemplate.category,
      channel: 'whatsapp',
      recipientCount: pendingCarts.length,
      sentAt: new Date().toISOString(),
      status: 'Sucesso',
      notes: `Disparo automático em lote executado com template "${activeCartRecoveryTemplate.title}" para ${pendingCarts.length} carrinhos pendentes.`
    };

    const updatedLogs = [logEntry, ...(event.crm?.logs || [])];
    const updatedEvent: EventData = {
      ...event,
      crm: {
        templates,
        logs: updatedLogs,
        recoveredRevenueTotal: event.crm?.recoveredRevenueTotal || 0,
        abandonedCartOverrides: updatedOverrides
      }
    };

    onUpdateEvent(updatedEvent);
    setIsBulkDispatching(false);

    // Call backend
    await fetch(`/api/events/${event.id}/crm/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry)
    });

    setStatusMessage({
      text: `Disparo automático concluído! ${pendingCarts.length} participantes marcados como "Contatado" com o modelo "${activeCartRecoveryTemplate.title}".`,
      type: 'success'
    });
  };

  // Record Broadcast Log
  const handleRecordBroadcast = async () => {
    const recipientCount = audienceFilter === 'carrinhos' 
      ? abandonedCarts.length 
      : (event.soldTickets || 120);

    const logEntry: CrmBroadcastLog = {
      id: `log-${Date.now()}`,
      templateTitle: selectedTemplate.title,
      category: selectedTemplate.category,
      channel: selectedChannel,
      recipientCount,
      sentAt: new Date().toISOString(),
      status: 'Sucesso',
      notes: `Disparo tático preparado para segmento: ${audienceFilter}`
    };

    const updatedLogs = [logEntry, ...(event.crm?.logs || [])];
    const updatedEvent: EventData = {
      ...event,
      crm: {
        templates,
        logs: updatedLogs,
        recoveredRevenueTotal: event.crm?.recoveredRevenueTotal || 0,
        abandonedCartOverrides: cartOverrides
      }
    };

    onUpdateEvent(updatedEvent);

    await fetch(`/api/events/${event.id}/crm/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry)
    });

    setStatusMessage({
      text: `Campanha de disparo "${selectedTemplate.title}" registrada com sucesso para ${recipientCount} contatos!`,
      type: 'success'
    });
  };

  // Refine Copy with AI preserving tags
  const handleAiRefineCopy = async (tone: 'hype' | 'urgencia' | 'vip') => {
    try {
      setIsAiRefining(true);
      const toneMap = {
        hype: 'Tom jovem, enérgico, de festa, com gírias leves da cena eletrônica e funk',
        urgencia: 'Gatilho psicológico de escassez extrema, virada iminente do lote e proteção de preço',
        vip: 'Tom exclusivo de concierge para áreas nobres, conforto e experiência premium'
      };

      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          message: `Reescreva a seguinte mensagem de WhatsApp para o evento ${event.name} usando o estilo "${toneMap[tone]}". Mantenha OBRIGATORIAMENTE todas as tags dinâmicas como {nome}, {link_carrinho}, {evento}, {lote}, {valor_carrinho} intactas no texto. Retorne apenas o texto final da mensagem:\n\n${messageDraft}`
        })
      });

      const data = await res.json();
      if (data.reply) {
        const clean = data.reply.replace(/^\[Agente Principal INSOMNIA\]:\s*/i, '').trim();
        setMessageDraft(clean);
        setStatusMessage({ text: 'Copy aprimorada com sucesso pelo Agente INSOMNIA!', type: 'success' });
      }
    } catch (e: any) {
      console.error(e);
      setStatusMessage({ text: 'Falha ao conectar com o Agente de IA.', type: 'error' });
    } finally {
      setIsAiRefining(false);
    }
  };

  // Filtered Templates in the Selector
  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchesCategory = templateCategoryFilter === 'todos' || 
        (templateCategoryFilter === 'carrinhos' && t.category === 'recuperacao_carrinho') ||
        (templateCategoryFilter === 'virada' && t.category === 'urgencia_lote') ||
        (templateCategoryFilter === 'lineup' && t.category === 'lineup_drop') ||
        (templateCategoryFilter === 'guia' && t.category === 'guia_chegada') ||
        (templateCategoryFilter === 'custom' && (t.category === 'custom' || t.id.startsWith('tpl-custom')));
      
      const matchesSearch = templateSearchTerm === '' ||
        t.title.toLowerCase().includes(templateSearchTerm.toLowerCase()) ||
        t.text.toLowerCase().includes(templateSearchTerm.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [templates, templateCategoryFilter, templateSearchTerm]);

  // Filtered Abandoned Carts
  const filteredCarts = useMemo(() => {
    return abandonedCarts.filter(c => {
      const status = cartOverrides[c.userId]?.status || 'Pendente';
      const matchesSearch = searchTerm === '' ||
        c.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.userPhone.includes(searchTerm);
      const matchesStatus = cartStatusFilter === 'all' || status === cartStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [abandonedCarts, cartOverrides, searchTerm, cartStatusFilter]);

  // Export headers and rows for SheetsExportButton
  const exportHeaders = ['Nome', 'E-mail', 'Telefone', 'Lote', 'Qtd', 'Total (R$)', 'Pagamento', 'Status'];
  const exportRows = useMemo(() => {
    return abandonedCarts.map(c => [
      c.userName,
      c.userEmail,
      c.userPhone,
      c.batchDescription,
      c.quantity,
      `R$ ${c.total.toFixed(2)}`,
      c.paymentMethod,
      cartOverrides[c.userId]?.status || 'Pendente'
    ]);
  }, [abandonedCarts, cartOverrides]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* ============================================================== */}
      {/* TOP HEADER: CRM & DISPAROS TÁTICOS */}
      {/* ============================================================== */}
      <div className="bg-[#141417] border border-white/[0.08] rounded-[4px] p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 rounded-[3px] bg-purple-500/15 border border-purple-500/30 text-purple-400 shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base font-bold text-white tracking-tight">
                  CRM Tático & Central de Disparos
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] text-[10px] font-mono uppercase font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  Modelos com Variáveis Dinâmicas
                </span>
                {cartMetrics.pendingCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-mono uppercase font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse">
                    <Flame className="w-3 h-3 text-amber-400" />
                    {cartMetrics.pendingCount} Carrinhos para Resgatar
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Mensagens personalizadas com injeção automática de <strong className="text-purple-300">&#123;nome&#125;</strong>, <strong className="text-purple-300">&#123;link_carrinho&#125;</strong> e <strong className="text-purple-300">&#123;evento&#125;</strong> para WhatsApp e e-mail.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setEditingTemplate({
                  id: `tpl-custom-${Date.now()}`,
                  title: 'Novo Modelo Personalizado',
                  category: 'custom',
                  recommendedChannel: 'whatsapp',
                  subject: 'Mensagem importante sobre {evento}',
                  text: 'Olá, {nome}! Tudo bem? 👋\n\nIdentificamos o seu pedido para o *{evento}* ({lote}).\n\nFinalize agora pelo link exclusivo:\n{link_carrinho}\n\nQualquer dúvida, conte com a nossa equipe!',
                  variables: ['nome', 'evento', 'link_carrinho', 'lote']
                });
                setIsTemplateModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-[2px] font-mono text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Modelo</span>
            </button>

            <SheetsExportButton
              filename={`CRM_Contatos_Gandaya_${event.id}`}
              title={`Leads e Carrinhos - ${event.name}`}
              headers={exportHeaders}
              rows={exportRows}
              label="EXPORTAR LEADS"
            />
          </div>
        </div>

        {/* Status notification */}
        {statusMessage && (
          <div className={`mt-3 p-2.5 rounded-[2px] text-xs flex items-center justify-between gap-2 border ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
              : statusMessage.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
          }`}>
            <span className="font-mono">{statusMessage.text}</span>
            <button 
              onClick={() => setStatusMessage(null)} 
              className="text-slate-400 hover:text-white cursor-pointer px-1"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* NAVIGATION TABS */}
      {/* ============================================================== */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3 flex-wrap">
        <button
          onClick={() => setActiveTab('carrinhos')}
          className={`px-3.5 py-1.5 rounded-[2px] font-mono text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'carrinhos'
              ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />
          <span>Recuperação de Carrinhos ({abandonedCarts.length})</span>
          <span className="badge-tech bg-amber-500/10 text-amber-300 border-amber-500/30">
            R$ {cartMetrics.totalRetained.toLocaleString('pt-BR')}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('disparos')}
          className={`px-3.5 py-1.5 rounded-[2px] font-mono text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'disparos'
              ? 'bg-purple-500/20 text-purple-200 border border-purple-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-purple-400" />
          <span>Seletor de Modelos & Disparos Táticos</span>
          <span className="badge-tech bg-purple-500/10 text-purple-300 border-purple-500/30">
            {templates.length} Modelos
          </span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-3.5 py-1.5 rounded-[2px] font-mono text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span>Analytics de Conversão</span>
          <span className="badge-tech bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
            {cartMetrics.conversionRateFromClicks.toFixed(0)}% CR Pós-Clique
          </span>
        </button>

        <button
          onClick={() => setActiveTab('contatos')}
          className={`px-3.5 py-1.5 rounded-[2px] font-mono text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'contatos'
              ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
          <span>Base de Contatos & Disparos SMS</span>
          <span className="badge-tech bg-indigo-500/10 text-indigo-300 border-indigo-500/30">
            Massa & Individual
          </span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 1. ABA DE RECUPERAÇÃO DE CARRINHOS ABANDONADOS */}
      {/* ============================================================== */}
      {activeTab === 'carrinhos' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* KPI CARDS: CARRINHOS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#141417] border border-white/[0.08] p-4 rounded-[4px]">
              <span className="label-tech text-amber-400">Total Retido em Carrinhos</span>
              <div className="text-xl font-bold font-mono text-amber-300 mt-1">
                R$ {cartMetrics.totalRetained.toLocaleString('pt-BR')},00
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {cartMetrics.totalCount} pedidos incompletos na Gandaya
              </p>
            </div>

            <div className="bg-[#141417] border border-white/[0.08] p-4 rounded-[4px]">
              <span className="label-tech text-emerald-400">Receita Já Resgatada</span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                R$ {cartMetrics.recoveredValue.toLocaleString('pt-BR')},00
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {cartMetrics.recoveredCount} ingressos convertidos e pagos
              </p>
            </div>

            <div className="bg-[#141417] border border-white/[0.08] p-4 rounded-[4px]">
              <span className="label-tech text-purple-400">Taxa de Conversão de Resgate</span>
              <div className="text-xl font-bold font-mono text-purple-300 mt-1">
                {cartMetrics.recoveryRate.toFixed(1)}%
              </div>
              <div className="w-full bg-[#1c1c21] h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-purple-500 h-full"
                  style={{ width: `${Math.min(100, cartMetrics.recoveryRate)}%` }}
                />
              </div>
            </div>

            <div className="bg-[#141417] border border-white/[0.08] p-4 rounded-[4px]">
              <span className="label-tech text-slate-400">Aguardando Contato</span>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {cartMetrics.pendingCount} Leads
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                WhatsApp validado pronto para disparo
              </p>
            </div>
          </div>

          {/* BANNER DE DESTAQUE: ANALYTICS DE CONVERSÃO EM RELAÇÃO AOS LINKS CLICADOS */}
          <div className="p-4 rounded-[4px] bg-[#101b17] border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 rounded-[3px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
                <MousePointerClick className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                    ANALYTICS: CONVERSÃO DE DISPAROS PÓS-CLIQUE
                  </span>
                  <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {cartMetrics.conversionRateFromClicks.toFixed(1)}% de Conversão nos Links de Pagamento
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Dos <strong>{cartMetrics.clickedCount} leads</strong> que clicaram no link exclusivo de checkout, <strong>{cartMetrics.recoveredCount} concluíram a compra</strong> (R$ {cartMetrics.recoveredValue.toLocaleString('pt-BR')},00 recuperados).
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('analytics')}
              className="px-3.5 py-1.5 rounded-[2px] font-mono text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Ver Analytics Completo</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* BARRA SUPERIOR DE SELETOR DE MODELO ATIVO PARA DISPARO DE RESGATE */}
          <div className="bg-[#181524] border border-purple-500/30 rounded-[4px] p-4 space-y-3 shadow-md">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-[2px] bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    Modelo Ativo para Resgate de Carrinho
                  </span>
                  <span className="text-xs text-slate-400">
                    (Injeta nome, link do carrinho e evento ao clicar em WhatsApp)
                  </span>
                </div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{activeCartRecoveryTemplate.title}</span>
                  <span className="font-mono text-[11px] text-slate-400 font-normal">
                    · Canal: {activeCartRecoveryTemplate.recommendedChannel.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Seletor dropdown rápido & botão de disparo em lote */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-mono">Trocar Modelo:</span>
                  <select
                    value={activeCartRecoveryTemplateId}
                    onChange={(e) => setActiveCartRecoveryTemplateId(e.target.value)}
                    className="bg-[#12101c] border border-purple-500/40 rounded-[2px] px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-purple-400"
                  >
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.title} {t.category === 'recuperacao_carrinho' ? '★' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => {
                    handleSelectTemplate(activeCartRecoveryTemplate);
                    setActiveTab('disparos');
                  }}
                  className="px-2.5 py-1.5 rounded-[2px] border border-purple-500/40 hover:bg-purple-500/20 text-purple-300 font-mono text-xs transition-colors cursor-pointer flex items-center gap-1"
                  title="Abrir editor completo deste modelo"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Editar Modelo</span>
                </button>

                <button
                  onClick={handleRunBatchCartDispatch}
                  disabled={isBulkDispatching || cartMetrics.pendingCount === 0}
                  className={`px-3 py-1.5 rounded-[2px] font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                    cartMetrics.pendingCount === 0
                      ? 'bg-slate-700/50 text-slate-400 cursor-not-allowed border border-white/[0.05]'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/50'
                  }`}
                  title="Registrar disparo para todos os carrinhos pendentes usando este modelo"
                >
                  <Play className="w-3 h-3" />
                  <span>
                    {isBulkDispatching ? `Disparando (${bulkProgress}%)...` : `Disparar em Lote (${cartMetrics.pendingCount})`}
                  </span>
                </button>
              </div>
            </div>

            {/* Variáveis Dinâmicas Ativas no Modelo Atual */}
            <div className="bg-[#12101c] p-2.5 rounded-[3px] border border-white/[0.05] flex items-center justify-between gap-2 flex-wrap text-[11px] font-mono">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-400 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-purple-400" />
                  Variáveis resolvidas neste modelo:
                </span>
                <span className="px-1.5 py-0.5 rounded-[2px] bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  &#123;nome&#125; &rarr; Nome do Lead
                </span>
                <span className="px-1.5 py-0.5 rounded-[2px] bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  &#123;link_carrinho&#125; &rarr; Link Direto Gandaya
                </span>
                <span className="px-1.5 py-0.5 rounded-[2px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  &#123;evento&#125; &rarr; {event.name}
                </span>
                <span className="px-1.5 py-0.5 rounded-[2px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  &#123;lote&#125; &rarr; Lote do Pedido
                </span>
              </div>
              <div className="text-slate-500 text-[10px]">
                {activeCartRecoveryTemplate.text.length} caracteres
              </div>
            </div>
          </div>

          {/* SEARCH & FILTER BAR */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#141417] p-3 rounded-[4px] border border-white/[0.08]">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nome, e-mail ou WhatsApp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#1c1c21] border border-white/[0.1] rounded-[2px] pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#8b5cf6]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={cartStatusFilter}
                onChange={(e) => setCartStatusFilter(e.target.value)}
                className="bg-[#1c1c21] border border-white/[0.1] rounded-[2px] px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-[#8b5cf6]"
              >
                <option value="all">Todos os Status</option>
                <option value="Pendente">Pendente</option>
                <option value="Contatado">Contatado</option>
                <option value="Recuperado">Recuperado</option>
                <option value="Desistiu">Desistiu</option>
              </select>
            </div>
          </div>

          {/* ABANDONED CARTS TABLE */}
          <div className="bg-[#141417] border border-white/[0.08] rounded-[4px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-[#1c1c21]/60 font-mono text-[11px] text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Participante / Contato</th>
                    <th className="py-3 px-4">Lote Abandonado</th>
                    <th className="py-3 px-4 text-center">Qtd</th>
                    <th className="py-3 px-4 text-right">Valor Total</th>
                    <th className="py-3 px-4">Pagamento</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Link Clicado</th>
                    <th className="py-3 px-4 text-right">Disparo Personalizado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {filteredCarts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 font-mono">
                        Nenhum carrinho abandonado encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredCarts.map((cart) => {
                      const status = cartOverrides[cart.userId]?.status || 'Pendente';
                      const linkClicks = cartOverrides[cart.userId]?.linkClicks || 0;
                      return (
                        <tr key={cart.userId} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4 max-w-[220px]">
                            <div className="font-bold text-white truncate">{cart.userName}</div>
                            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                              <span>{cart.userPhone}</span>
                              <span className="text-white/20">·</span>
                              <span className="truncate">{cart.userEmail}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                            {cart.batchDescription}
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-slate-300">
                            {cart.quantity}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-amber-300">
                            R$ {cart.total.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                            {cart.paymentMethod}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-mono uppercase font-bold border ${
                              status === 'Recuperado'
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : status === 'Contatado'
                                ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                                : status === 'Desistiu'
                                ? 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            }`}>
                              {status === 'Recuperado' && <Check className="w-3 h-3" />}
                              {status === 'Contatado' && <Send className="w-3 h-3" />}
                              {status === 'Pendente' && <Clock className="w-3 h-3" />}
                              {status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {linkClicks > 0 ? (
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                                  <MousePointerClick className="w-3 h-3 text-cyan-400" />
                                  {linkClicks} {linkClicks === 1 ? 'clique' : 'cliques'}
                                </span>
                                <button
                                  onClick={() => handleSimulateCartClick(cart.userId)}
                                  title="Simular/Registrar novo clique no checkout"
                                  className="text-[10px] text-slate-400 hover:text-cyan-300 font-mono cursor-pointer"
                                >
                                  +1
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleSimulateCartClick(cart.userId)}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono text-slate-500 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors cursor-pointer"
                                title="Simular clique no link exclusivo de pagamento"
                              >
                                <MousePointerClick className="w-3 h-3" />
                                <span>0 cliques</span>
                              </button>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* Botão de WhatsApp direto com modelo ativo */}
                              <button
                                onClick={() => handleOpenWhatsApp(
                                  cart.userPhone, 
                                  cart.userName, 
                                  cart.batchDescription,
                                  cart.userId,
                                  cart.total,
                                  cart.quantity
                                )}
                                className="font-mono text-[10px] px-2.5 py-1 rounded-[2px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                                title={`Abrir WhatsApp com modelo "${activeCartRecoveryTemplate.title}"`}
                              >
                                <Send className="w-3 h-3" />
                                <span>WhatsApp</span>
                              </button>

                              {/* Botão para prévia e seleção de outro modelo para este lead */}
                              <button
                                onClick={() => handleOpenLeadModal(cart)}
                                className="font-mono text-[10px] px-2 py-1 rounded-[2px] border border-purple-500/30 hover:bg-purple-500/10 text-purple-300 transition-colors flex items-center gap-1 cursor-pointer"
                                title="Ver prévia da mensagem e escolher outro modelo para este lead"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Prévia</span>
                              </button>

                              {status !== 'Recuperado' ? (
                                <button
                                  onClick={() => handleUpdateCartStatus(cart.userId, 'Recuperado', cart.total, cart.quantity)}
                                  className="font-mono text-[10px] px-2 py-1 rounded-[2px] border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-300 transition-colors cursor-pointer"
                                  title="Marcar como pago e somar à receita"
                                >
                                  Marcar Pago
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateCartStatus(cart.userId, 'Pendente')}
                                  className="font-mono text-[10px] px-2 py-1 rounded-[2px] border border-white/[0.1] hover:bg-white/[0.08] text-slate-400 transition-colors cursor-pointer"
                                >
                                  Desfazer
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* 2. ABA DE SELETOR DE MODELOS & DISPAROS TÁTICOS */}
      {/* ============================================================== */}
      {activeTab === 'disparos' && (
        <div className="space-y-6 animate-in fade-in duration-150">

          {/* SELETOR DE MODELOS: HEADER & FILTROS */}
          <div className="bg-[#141417] border border-white/[0.08] rounded-[4px] p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
              <div>
                <span className="label-tech text-purple-400">BIBLIOTECA DE MODELOS DE MENSAGENS</span>
                <h3 className="text-sm font-bold text-white">Seletor de Modelos Personalizáveis</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Selecione um modelo abaixo para carregar no editor, customize as variáveis ou crie novas cópias sob medida.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    setEditingTemplate({
                      id: `tpl-custom-${Date.now()}`,
                      title: 'Novo Modelo Customizado',
                      category: 'custom',
                      recommendedChannel: 'whatsapp',
                      subject: 'Novidade especial sobre {evento}',
                      text: 'Olá, {nome}! 🔥\n\nNotícia imperdível sobre o *{evento}*!\n\nAcesse o link oficial:\n{link_ingresso}\n\nTe esperamos lá!',
                      variables: ['nome', 'evento', 'link_ingresso']
                    });
                    setIsTemplateModalOpen(true);
                  }}
                  className="font-mono text-xs px-3 py-1.5 rounded-[2px] bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Modelo</span>
                </button>

                <button
                  onClick={handleResetToDefaultTemplates}
                  className="font-mono text-xs px-2.5 py-1.5 rounded-[2px] border border-white/[0.1] hover:bg-white/[0.05] text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Restaurar templates de fábrica"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restaurar Padrões</span>
                </button>
              </div>
            </div>

            {/* Categorias & Busca */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {[
                  { id: 'todos', label: 'Todos os Modelos' },
                  { id: 'carrinhos', label: 'Recuperação de Carrinhos' },
                  { id: 'virada', label: 'Virada de Lote' },
                  { id: 'lineup', label: 'Lineup & Drops' },
                  { id: 'guia', label: 'Guia do Evento' },
                  { id: 'custom', label: 'Personalizados' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setTemplateCategoryFilter(cat.id)}
                    className={`px-3 py-1 rounded-[2px] text-xs font-mono font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      templateCategoryFilter === cat.id
                        ? 'bg-purple-500/20 text-purple-200 border border-purple-500/40'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filtrar modelos por palavra-chave..."
                  value={templateSearchTerm}
                  onChange={(e) => setTemplateSearchTerm(e.target.value)}
                  className="w-full bg-[#1c1c21] border border-white/[0.1] rounded-[2px] pl-7 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 font-mono"
                />
              </div>
            </div>

            {/* GRID DE MODELOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredTemplates.map(tpl => {
                const isSelected = selectedTemplateId === tpl.id;
                const isActiveForCarts = activeCartRecoveryTemplateId === tpl.id;
                const isCustom = tpl.id.startsWith('tpl-custom') || tpl.category === 'custom';

                return (
                  <div
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`p-3 rounded-[3px] border transition-all cursor-pointer flex flex-col justify-between text-left ${
                      isSelected
                        ? 'bg-purple-950/30 border-purple-500 text-white shadow-md'
                        : 'bg-[#18181c] border-white/[0.08] text-slate-300 hover:border-white/[0.2] hover:bg-[#1c1c21]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[9px] font-mono uppercase font-bold border ${
                          tpl.recommendedChannel === 'whatsapp'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : tpl.recommendedChannel === 'email'
                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                            : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                        }`}>
                          {tpl.recommendedChannel === 'whatsapp' ? <Send className="w-2.5 h-2.5" /> : <Mail className="w-2.5 h-2.5" />}
                          {tpl.recommendedChannel}
                        </span>

                        <div className="flex items-center gap-1">
                          {isActiveForCarts && (
                            <span className="px-1.5 py-0.2 rounded-[2px] text-[9px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              Ativo Carrinho
                            </span>
                          )}
                          {isCustom && (
                            <span className="px-1.5 py-0.2 rounded-[2px] text-[9px] font-mono font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                              Custom
                            </span>
                          )}
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-white line-clamp-1 mb-1">
                        {tpl.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {tpl.text}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/[0.05] flex items-center justify-between text-[10px] font-mono">
                      {/* Tags encontradas no modelo */}
                      <div className="flex items-center gap-1 text-slate-500 truncate max-w-[170px]">
                        {tpl.text.includes('{nome}') && <span className="text-purple-400">&#123;nome&#125;</span>}
                        {tpl.text.includes('{link_carrinho}') && <span className="text-amber-400">&#123;link_carrinho&#125;</span>}
                        {tpl.text.includes('{evento}') && <span className="text-indigo-400">&#123;evento&#125;</span>}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isCustom && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTemplate(tpl.id);
                            }}
                            className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                            title="Excluir modelo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                        <span className={`font-bold ${isSelected ? 'text-purple-300' : 'text-slate-400'}`}>
                          {isSelected ? '✓ Selecionado' : 'Carregar'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* EDITOR DO MODELO SELECIONADO & PREVIEW EM TEMPO REAL COM DADOS DO LEAD */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* EDITOR (7 COLUNAS) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-[#141417] border border-white/[0.08] rounded-[4px] p-4 space-y-4">
                
                {/* Header do Editor */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
                  <div>
                    <span className="label-tech text-purple-400">EDITANDO MODELO ATIVO</span>
                    <h3 className="text-sm font-bold text-white">{selectedTemplate.title}</h3>
                  </div>

                  {/* Refinamento de IA */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      Refinar Tom:
                    </span>
                    <button
                      onClick={() => handleAiRefineCopy('urgencia')}
                      disabled={isAiRefining}
                      className="font-mono text-[10px] px-2 py-0.5 rounded-[2px] border border-amber-500/30 text-amber-300 hover:bg-amber-500/10 cursor-pointer"
                    >
                      Urgência
                    </button>
                    <button
                      onClick={() => handleAiRefineCopy('hype')}
                      disabled={isAiRefining}
                      className="font-mono text-[10px] px-2 py-0.5 rounded-[2px] border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 cursor-pointer"
                    >
                      Hype
                    </button>
                    <button
                      onClick={() => handleAiRefineCopy('vip')}
                      disabled={isAiRefining}
                      className="font-mono text-[10px] px-2 py-0.5 rounded-[2px] border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 cursor-pointer"
                    >
                      VIP
                    </button>
                  </div>
                </div>

                {/* Canal & Segmento */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="label-tech text-slate-300 mb-1 block">Canal de Disparo</label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedChannel('whatsapp')}
                        className={`flex-1 py-1.5 px-2.5 rounded-[2px] font-mono text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                          selectedChannel === 'whatsapp'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#1c1c21] text-slate-400 hover:text-white'
                        }`}
                      >
                        <Send className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedChannel('email')}
                        className={`flex-1 py-1.5 px-2.5 rounded-[2px] font-mono text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                          selectedChannel === 'email'
                            ? 'bg-purple-600 text-white'
                            : 'bg-[#1c1c21] text-slate-400 hover:text-white'
                        }`}
                      >
                        <Mail className="w-3 h-3" />
                        <span>E-mail</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedChannel('sms')}
                        className={`flex-1 py-1.5 px-2.5 rounded-[2px] font-mono text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                          selectedChannel === 'sms'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-[#1c1c21] text-slate-400 hover:text-white'
                        }`}
                      >
                        <Smartphone className="w-3 h-3" />
                        <span>SMS</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="label-tech text-slate-300 mb-1 block">Segmento Alvo Padrão</label>
                    <select
                      value={audienceFilter}
                      onChange={(e) => setAudienceFilter(e.target.value as any)}
                      className="w-full bg-[#1c1c21] border border-white/[0.1] rounded-[2px] p-1.5 text-white font-mono focus:outline-none focus:border-purple-400 text-xs"
                    >
                      <option value="carrinhos">Leads de Carrinhos Abandonados ({abandonedCarts.length})</option>
                      <option value="todos">Todos os Compradores Confirmados ({event.soldTickets})</option>
                      <option value="lote_ativo">Compradores do Lote Atual ({event.currentLote})</option>
                      <option value="vip">Compradores VIP / Camarotes</option>
                    </select>
                  </div>
                </div>

                {/* Se for canal e-mail, exibe campo de Assunto */}
                {selectedChannel === 'email' && (
                  <div className="space-y-1">
                    <label className="label-tech text-slate-300">Assunto do E-mail</label>
                    <input
                      type="text"
                      value={messageSubject}
                      onChange={(e) => setMessageSubject(e.target.value)}
                      placeholder="Ex: Seu ingresso para {evento} ainda está reservado!"
                      className="w-full bg-[#1c1c21] border border-white/[0.1] rounded-[2px] px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-purple-400"
                    />
                  </div>
                )}

                {/* BARRA DE INSERÇÃO DE VARIÁVEIS DINÂMICAS (CLICÁVEIS) */}
                <div className="bg-[#181524] border border-purple-500/25 rounded-[3px] p-2.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-purple-300 font-bold flex items-center gap-1">
                      <Tag className="w-3 h-3 text-purple-400" />
                      Inserir Variáveis Dinâmicas no Cursor:
                    </span>
                    <span className="text-slate-400 text-[10px]">Clique para injetar no texto</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {DYNAMIC_VARIABLES.map(v => (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => handleInsertVariable(v.key, 'editor')}
                        className={`px-2 py-1 rounded-[2px] text-[11px] font-mono font-medium transition-all flex items-center gap-1 cursor-pointer shadow-sm ${
                          v.isPrimary
                            ? 'bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-400/50'
                            : 'bg-[#1c1c24] hover:bg-[#252530] text-slate-300 border border-white/[0.1]'
                        }`}
                        title={`${v.label} - Exemplo: ${v.example}`}
                      >
                        <Plus className="w-2.5 h-2.5 text-purple-400" />
                        <span>{v.key}</span>
                        <span className="text-[9px] text-slate-400 hidden sm:inline">({v.label})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Textarea do Modelo */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="label-tech text-slate-300">Corpo da Mensagem</label>
                    <span className="text-[10px] font-mono text-slate-500">
                      {messageDraft.length} caracteres
                    </span>
                  </div>
                  <textarea
                    ref={textareaRef}
                    rows={8}
                    value={messageDraft}
                    onChange={(e) => setMessageDraft(e.target.value)}
                    className="w-full bg-[#1c1c21] border border-white/[0.1] rounded-[2px] p-3 text-xs text-white font-mono leading-relaxed focus:outline-none focus:border-purple-400"
                  />
                </div>

                {/* AÇÕES DE SALVAR & TORNAR ATIVO PARA CARRINHOS */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCartRecoveryTemplateId(selectedTemplate.id);
                      setStatusMessage({
                        text: `"${selectedTemplate.title}" definido como modelo padrão para resgate de carrinhos!`,
                        type: 'success'
                      });
                    }}
                    className={`font-mono text-xs px-3 py-1.5 rounded-[2px] border transition-colors flex items-center gap-1.5 cursor-pointer ${
                      activeCartRecoveryTemplateId === selectedTemplate.id
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'border-white/[0.1] text-slate-300 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <Bookmark className="w-3 h-3 text-amber-400" />
                    <span>
                      {activeCartRecoveryTemplateId === selectedTemplate.id
                        ? '★ Modelo Padrão de Carrinho'
                        : 'Definir como Padrão de Carrinho'}
                    </span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveTemplateChanges(true)}
                      className="font-mono text-xs px-3 py-1.5 rounded-[2px] border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 transition-colors cursor-pointer"
                    >
                      Salvar como Novo
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveTemplateChanges(false)}
                      className="btn-v2 btn-v2-primary text-xs flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Salvar Alterações</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* PREVIEW EM TEMPO REAL & SIMULADOR DE DADOS DO LEAD (5 COLUNAS) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Card de Simulação de Lead */}
              <div className="bg-[#141417] border border-white/[0.08] rounded-[4px] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="label-tech text-purple-400">SIMULADOR DE VARIÁVEIS REAIS</span>
                  <span className="badge-tech bg-purple-500/10 text-purple-300 border-purple-500/30">
                    Ao Vivo
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">
                    Simular com dados reais do lead:
                  </label>
                  <select
                    value={simulatedLeadIndex}
                    onChange={(e) => setSimulatedLeadIndex(Number(e.target.value))}
                    className="w-full bg-[#1c1c21] border border-white/[0.1] rounded-[2px] p-2 text-xs text-white font-mono focus:outline-none focus:border-purple-400"
                  >
                    {abandonedCarts.map((c, idx) => (
                      <option key={c.userId} value={idx}>
                        {c.userName} ({c.batchDescription} - R$ {c.total.toFixed(0)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dados que serão injetados */}
                <div className="bg-[#18181c] p-2.5 rounded-[2px] border border-white/[0.05] space-y-1 text-[11px] font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>&#123;nome&#125;:</span>
                    <span className="text-white font-bold">{currentSimulatedLead.name}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>&#123;evento&#125;:</span>
                    <span className="text-purple-300">{event.name}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>&#123;lote&#125;:</span>
                    <span className="text-amber-300">{currentSimulatedLead.batch}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>&#123;valor_carrinho&#125;:</span>
                    <span className="text-emerald-300">R$ {currentSimulatedLead.cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 truncate">
                    <span>&#123;link_carrinho&#125;:</span>
                    <span className="text-blue-400 truncate max-w-[190px]">
                      {currentSimulatedLead.customPaymentLink}
                    </span>
                  </div>
                </div>

                {/* Caixa de Prévia com estilo WhatsApp */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-purple-300">
                    <span className="flex items-center gap-1 font-bold">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      COMO O CLIENTE RECEBE NO WHATSAPP:
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(previewMessage);
                        setCopiedText(true);
                        setTimeout(() => setCopiedText(false), 2000);
                      }}
                      className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white cursor-pointer"
                    >
                      {copiedText ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedText ? 'Copiado!' : 'Copiar Texto'}</span>
                    </button>
                  </div>

                  {/* Bubble do WhatsApp */}
                  <div className="bg-[#0b141a] p-3.5 rounded-[4px] border border-emerald-900/40 shadow-inner space-y-2">
                    <div className="flex items-center gap-2 border-b border-white/[0.05] pb-2 text-[10px] font-mono text-emerald-400">
                      <Send className="w-3 h-3" />
                      <span>Mensagem Direta para {currentSimulatedLead.name}</span>
                    </div>
                    <div className="bg-[#1f2c34] p-3 rounded-[4px] text-xs text-slate-100 font-sans whitespace-pre-wrap leading-relaxed shadow-sm">
                      {previewMessage}
                    </div>
                  </div>
                </div>

                {/* Disparo de Teste */}
                <div className="flex items-center justify-between gap-2 pt-2">
                  <button
                    onClick={() => {
                      const samplePhone = abandonedCarts[simulatedLeadIndex]?.userPhone || '22998841234';
                      handleOpenWhatsApp(
                        samplePhone,
                        currentSimulatedLead.name,
                        currentSimulatedLead.batch,
                        undefined,
                        currentSimulatedLead.cartTotal,
                        currentSimulatedLead.ticketQty,
                        messageDraft
                      );
                    }}
                    className="flex-1 py-1.5 px-3 rounded-[2px] bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Send className="w-3 h-3" />
                    <span>Testar no WhatsApp</span>
                  </button>

                  <button
                    onClick={handleRecordBroadcast}
                    className="py-1.5 px-3 rounded-[2px] border border-purple-500/40 hover:bg-purple-500/20 text-purple-300 font-mono text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Bookmark className="w-3 h-3" />
                    <span>Registrar Disparo</span>
                  </button>
                </div>

              </div>

              {/* HISTÓRICO DE DISPAROS */}
              {event.crm?.logs && event.crm.logs.length > 0 && (
                <div className="bg-[#141417] border border-white/[0.08] rounded-[4px] p-4 space-y-2.5">
                  <span className="label-tech text-slate-400">HISTÓRICO RECENTE DE DISPAROS</span>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {event.crm.logs.map((log) => (
                      <div key={log.id} className="bg-[#1c1c21] p-2.5 rounded-[2px] text-xs flex items-center justify-between border border-white/[0.05]">
                        <div>
                          <div className="font-bold text-white line-clamp-1">{log.templateTitle}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {new Date(log.sentAt).toLocaleString('pt-BR')} · {log.channel.toUpperCase()} · {log.recipientCount} contatos
                          </div>
                        </div>
                        <span className="badge-tech bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
                          {log.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* 3. ABA DE ANALYTICS DE CONVERSÃO */}
      {/* ============================================================== */}
      {activeTab === 'analytics' && (
        <ConversionAnalytics 
          event={event} 
          onUpdateEvent={onUpdateEvent} 
          onNavigateToTab={(tab) => setActiveTab(tab as any)} 
        />
      )}

      {/* ============================================================== */}
      {/* 4. ABA DE BASE DE CONTATOS & SEGMENTOS */}
      {/* ============================================================== */}
      {activeTab === 'contatos' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-[#141417] border border-white/[0.08] p-4 rounded-[4px] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white">Segmentação Consolidada de Participantes</h3>
                <p className="text-xs text-slate-400">
                  Total de {event.soldTickets + abandonedCarts.length} registros no banco de dados operacional.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <SheetsExportButton
                  filename={`Base_Contatos_${event.id}`}
                  title={`Base Completa de Contatos - ${event.name}`}
                  headers={['Nome', 'Contato', 'Tipo', 'Lote', 'Status']}
                  rows={[
                    ...abandonedCarts.map(c => [c.userName, c.userPhone, 'Carrinho Abandonado', c.batchDescription, 'Pendente']),
                    ...((event.gandayaReport?.purchases || []).map(p => [p.userName, p.userEmail || '—', 'Comprador Confirmado', p.batchDescription, 'Confirmado']))
                  ]}
                  label="EXPORTAR BASE"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-[#1c1c21] p-3 rounded-[2px] border border-white/[0.05]">
                <span className="label-tech text-emerald-400">Compradores Confirmados</span>
                <div className="text-xl font-bold font-mono text-white mt-1">
                  {event.soldTickets.toLocaleString('pt-BR')}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Ingressos emitidos via Gandaya</p>
              </div>

              <div className="bg-[#1c1c21] p-3 rounded-[2px] border border-white/[0.05]">
                <span className="label-tech text-amber-400">Carrinhos Abandonados</span>
                <div className="text-xl font-bold font-mono text-white mt-1">
                  {abandonedCarts.length}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Potencial imediato de R$ {cartMetrics.totalRetained.toLocaleString('pt-BR')}</p>
              </div>

              <div className="bg-[#1c1c21] p-3 rounded-[2px] border border-white/[0.05]">
                <span className="label-tech text-purple-400">Promoters & Parceiros</span>
                <div className="text-xl font-bold font-mono text-white mt-1">
                  {event.gandayaReport?.links?.length || 4}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Canais e links de venda rastreados</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CRIAR / EDITAR MODELO PERSONALIZADO */}
      {/* ============================================================== */}
      {isTemplateModalOpen && editingTemplate && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-100">
          <div className="bg-[#141417] border border-white/[0.15] rounded-[4px] max-w-2xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Criar / Editar Modelo de Mensagem</h3>
              </div>
              <button 
                onClick={() => {
                  setIsTemplateModalOpen(false);
                  setEditingTemplate(null);
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="label-tech text-slate-300 block mb-1">Título do Modelo</label>
                <input
                  type="text"
                  value={editingTemplate.title}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
                  placeholder="Ex: Recuperação de Carrinho - Condição PIX"
                  className="w-full bg-[#1c1c21] border border-white/[0.1] rounded-[2px] px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-tech text-slate-300 block mb-1">Categoria</label>
                  <select
                    value={editingTemplate.category}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value as any })}
                    className="w-full bg-[#1c1c21] border border-white/[0.1] rounded-[2px] px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-purple-400"
                  >
                    <option value="recuperacao_carrinho">Recuperação de Carrinho</option>
                    <option value="urgencia_lote">Virada de Lote</option>
                    <option value="lineup_drop">Lineup / Atrações</option>
                    <option value="guia_chegada">Guia do Evento</option>
                    <option value="pos_evento">Pós-Evento</option>
                    <option value="custom">Personalizado</option>
                  </select>
                </div>

                <div>
                  <label className="label-tech text-slate-300 block mb-1">Canal Recomendado</label>
                  <select
                    value={editingTemplate.recommendedChannel}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, recommendedChannel: e.target.value as any })}
                    className="w-full bg-[#1c1c21] border border-white/[0.1] rounded-[2px] px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-purple-400"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">E-mail</option>
                    <option value="ambos">Ambos</option>
                  </select>
                </div>
              </div>

              {/* Botões de Variáveis no Modal */}
              <div className="bg-[#181524] p-2.5 rounded-[2px] border border-purple-500/20 space-y-1.5">
                <span className="text-[10px] font-mono text-purple-300 font-bold block">
                  Inserir Variável no Cursor:
                </span>
                <div className="flex flex-wrap gap-1">
                  {DYNAMIC_VARIABLES.map(v => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => handleInsertVariable(v.key, 'modal')}
                      className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 border border-purple-400/30 cursor-pointer"
                    >
                      {v.key}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label-tech text-slate-300 block mb-1">Texto da Mensagem</label>
                <textarea
                  ref={modalTextareaRef}
                  rows={6}
                  value={editingTemplate.text}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, text: e.target.value })}
                  className="w-full bg-[#1c1c21] border border-white/[0.1] rounded-[2px] p-2.5 text-xs text-white font-mono leading-relaxed focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  setIsTemplateModalOpen(false);
                  setEditingTemplate(null);
                }}
                className="px-3 py-1.5 rounded-[2px] font-mono text-xs border border-white/[0.1] text-slate-300 hover:bg-white/[0.04] cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (!editingTemplate.title.trim() || !editingTemplate.text.trim()) {
                    return;
                  }
                  const existingIdx = templates.findIndex(t => t.id === editingTemplate.id);
                  let updatedList: CrmMessageTemplate[];
                  if (existingIdx !== -1) {
                    updatedList = templates.map(t => t.id === editingTemplate.id ? editingTemplate : t);
                  } else {
                    updatedList = [...templates, editingTemplate];
                  }

                  const updatedEvent: EventData = {
                    ...event,
                    crm: {
                      templates: updatedList,
                      logs: event.crm?.logs || [],
                      recoveredRevenueTotal: event.crm?.recoveredRevenueTotal || 0,
                      abandonedCartOverrides: cartOverrides
                    }
                  };
                  onUpdateEvent(updatedEvent);
                  setSelectedTemplateId(editingTemplate.id);
                  setMessageDraft(editingTemplate.text);
                  setIsTemplateModalOpen(false);
                  setEditingTemplate(null);

                  try {
                    await fetch(`/api/events/${event.id}/crm/templates`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ templates: updatedList })
                    });
                    setStatusMessage({ text: 'Modelo salvo com sucesso!', type: 'success' });
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="btn-v2 btn-v2-primary text-xs flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Salvar Modelo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: PRÉVIA & DISPARO INDIVIDUAL DE CARRINHO */}
      {/* ============================================================== */}
      {previewCartLead && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-100">
          <div className="bg-[#141417] border border-white/[0.15] rounded-[4px] max-w-xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <span className="label-tech text-amber-400">DISPARO INDIVIDUAL PARA LEAD</span>
                <h3 className="text-sm font-bold text-white">{previewCartLead.userName}</h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  {previewCartLead.userPhone} · {previewCartLead.batchDescription} · R$ {previewCartLead.total.toFixed(2)}
                </p>
              </div>
              <button 
                onClick={() => setPreviewCartLead(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Seletor de Modelo para este Lead */}
              <div>
                <label className="text-[11px] font-mono text-slate-300 block mb-1">
                  Modelo de Mensagem Aplicado:
                </label>
                <select
                  value={customCartLeadTemplateId}
                  onChange={(e) => handleSwitchModalLeadTemplate(e.target.value)}
                  className="w-full bg-[#1c1c21] border border-purple-500/40 rounded-[2px] p-2 text-xs text-white font-mono focus:outline-none focus:border-purple-400"
                >
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mensagem Formatada Editável */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-mono text-slate-300">
                    Mensagem Pronta para Envio:
                  </label>
                  <span className="text-[10px] font-mono text-emerald-400">
                    Variáveis já preenchidas
                  </span>
                </div>
                <textarea
                  rows={7}
                  value={customCartLeadMessage}
                  onChange={(e) => setCustomCartLeadMessage(e.target.value)}
                  className="w-full bg-[#1c1c21] border border-white/[0.1] rounded-[2px] p-3 text-xs text-white font-mono leading-relaxed focus:outline-none focus:border-purple-400"
                />
              </div>

              {/* Links diretos que serão enviados */}
              <div className="bg-[#18181c] p-2 rounded-[2px] border border-white/[0.05] text-[10px] font-mono text-slate-400 truncate">
                <span>Link exclusivo do lead: </span>
                <span className="text-blue-400">
                  https://gandaya.com/eventos/{event.id}/checkout?cartId={previewCartLead.userId}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(customCartLeadMessage);
                  setStatusMessage({ text: 'Mensagem copiada para a área de transferência!', type: 'info' });
                }}
                className="px-3 py-1.5 rounded-[2px] font-mono text-xs border border-white/[0.1] text-slate-300 hover:bg-white/[0.04] cursor-pointer flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>Copiar</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewCartLead(null)}
                  className="px-3 py-1.5 rounded-[2px] font-mono text-xs border border-white/[0.1] text-slate-400 hover:text-white cursor-pointer"
                >
                  Fechar
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await handleOpenWhatsApp(
                      previewCartLead.userPhone,
                      previewCartLead.userName,
                      previewCartLead.batchDescription,
                      previewCartLead.userId,
                      previewCartLead.total,
                      previewCartLead.quantity,
                      customCartLeadMessage
                    );
                    setPreviewCartLead(null);
                  }}
                  className="px-4 py-1.5 rounded-[2px] font-mono text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar pelo WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
