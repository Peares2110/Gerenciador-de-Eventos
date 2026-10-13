import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  RotateCcw, 
  Copy, 
  Check, 
  Ticket, 
  TrendingUp, 
  Clock, 
  Flame, 
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Activity,
  AlertCircle
} from 'lucide-react';
import { EventData, HourlyAuditReport } from '../types';
import { SheetsExportButton } from './SheetsExportButton';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isReport?: boolean;
}

interface MasterAgentChatProps {
  event: EventData;
  latestAuditReport?: HourlyAuditReport | null;
}

export const MasterAgentChat: React.FC<MasterAgentChatProps> = ({ event, latestAuditReport }) => {
  const percentCap = event.capacity > 0 ? Math.round((event.soldTickets / event.capacity) * 100) : 0;
  const initialText = `Olá! Sou o **Agente Principal da INSOMNIA**, conectado diretamente aos dados oficiais do evento **${event.name}**.\n\n` +
    `• **Bilheteria:** ${event.soldTickets.toLocaleString('pt-BR')} de ${event.capacity.toLocaleString('pt-BR')} ingressos (${percentCap}% da capacidade), faturamento de **R$ ${event.currentRevenue.toLocaleString('pt-BR')}**.\n` +
    `• **Lote Atual:** **${event.currentLote}** (R$ ${event.ticketPriceLote.toLocaleString('pt-BR')}).\n` +
    `• **Tráfego Pago (Meta Ads):** ${event.spentAdBudget > 0 ? `Investido R$ ${event.spentAdBudget.toLocaleString('pt-BR')} com ROAS de **${event.blendedRoas}x** e CPA médio de **R$ ${event.currentCpa.toFixed(2)}**.` : `Nenhuma verba veiculada ainda (orçamento previsto de R$ ${event.totalAdBudget.toLocaleString('pt-BR')}).`}\n\n` +
    `Como posso direcionar você e sua equipe de produção hoje? Você pode tirar dúvidas sobre viradas de lote, métricas de anúncios, horários de postagem ou solicitar estratégias de aceleração.`;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: initialText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showQuickPrompts, setShowQuickPrompts] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // When latestAuditReport is received from the campaign manager, notify in chat
  useEffect(() => {
    if (latestAuditReport) {
      setMessages((prev) => [
        ...prev,
        {
          id: `report-${Date.now()}`,
          role: 'assistant',
          isReport: true,
          text: `🔔 **Novo Relatório Recebido do Gerente de Campanha**\n\n` +
            `• **Status de Eficiência:** ${latestAuditReport.efficiencyStatus}\n` +
            `• **Resumo Executivo:** ${latestAuditReport.summary}\n` +
            `• **Recomendação de Verba:** **${latestAuditReport.budgetRecommendations.action} (${latestAuditReport.budgetRecommendations.adjustmentPercent})**\n` +
            `• **Justificativa:** ${latestAuditReport.budgetRecommendations.rationale}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [latestAuditReport]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputPrompt;
    if (!text.trim() || isSending) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsSending(true);

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          message: userMsg.text,
          conversationHistory: messages.slice(-6).map((m) => ({ role: m.role, text: m.text }))
        })
      });

      const data = await res.json();
      if (data.success && data.reply) {
        const assistantMsg: Message = {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err) {
      console.error('Master agent error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetChat = () => {
    if (confirm('Deseja reiniciar a conversa com o Agente Principal?')) {
      setMessages([
        {
          id: 'welcome-reset',
          role: 'assistant',
          text: `Conversa reiniciada. Estou pronto para analisar os dados de **${event.name}**. Como posso ajudar?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  const strategicPrompts = [
    {
      title: 'Status do Lote & Virada',
      desc: 'Projeção de vendas e momento exato para virar de lote.',
      query: 'Qual a situação do lote atual e a projeção de virada para o próximo?',
      icon: Ticket
    },
    {
      title: 'Auditoria de Tráfego Pago',
      desc: 'Avaliação de CPA, ROAS das 24h e realocação de verba.',
      query: 'Como está o desempenho do tráfego pago nas últimas 24h e onde devemos reajustar?',
      icon: TrendingUp
    },
    {
      title: 'Picos & Horários de Postagem',
      desc: 'Melhores horários do dia com base na audiência real.',
      query: 'Qual o melhor horário para publicar o Reel de anúncio hoje considerando os picos de audiência?',
      icon: Clock
    },
    {
      title: 'Aceleração de Vendas',
      desc: 'Plano de ação emergencial para alavancar faturamento.',
      query: 'Gere um briefing tático de emergência para acelerar vendas hoje e esgotar o lote ativo.',
      icon: Flame
    }
  ];

  // Google Sheets Export Data
  const sheetsHeaders = ['Data/Hora', 'Emissor', 'Mensagem'];
  const sheetsRows: (string | number)[][] = messages.map((m) => [
    m.timestamp,
    m.role === 'assistant' ? 'Agente Principal (INSOMNIA)' : 'Equipe do Evento',
    m.text.replace(/\*\*/g, '').replace(/###/g, '')
  ]);

  // Clean Markdown formatter helper for chat output
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();

      // Heading 3
      if (trimmed.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-bold text-sm text-purple-200 mt-3 mb-1 first:mt-0">
            {renderInlineMarkdown(trimmed.replace('### ', ''))}
          </h4>
        );
      }

      // Heading 2 or 1
      if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
        return (
          <h3 key={idx} className="font-display font-bold text-sm sm:text-base text-white mt-3.5 mb-1.5 first:mt-0">
            {renderInlineMarkdown(trimmed.replace(/^#+\s/, ''))}
          </h3>
        );
      }

      // Bullet List item
      if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const textWithoutBullet = trimmed.replace(/^[•\-\*]\s+/, '');
        return (
          <div key={idx} className="flex items-start gap-2 my-1 text-slate-200 text-xs sm:text-[13px] leading-relaxed">
            <span className="text-purple-400 mt-0.5 text-xs select-none">▸</span>
            <div className="flex-1">{renderInlineMarkdown(textWithoutBullet)}</div>
          </div>
        );
      }

      // Numbered list item: e.g. "1. "
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1 text-slate-200 text-xs sm:text-[13px] leading-relaxed">
            <span className="font-mono text-purple-400 font-bold text-xs select-none">{numMatch[1]}.</span>
            <div className="flex-1">{renderInlineMarkdown(numMatch[2])}</div>
          </div>
        );
      }

      // Blank line spacer
      if (!trimmed) {
        return <div key={idx} className="h-2" />;
      }

      // Normal paragraph
      return (
        <p key={idx} className="text-slate-200 text-xs sm:text-[13px] leading-relaxed my-1">
          {renderInlineMarkdown(trimmed)}
        </p>
      );
    });
  };

  // Inline formatting for **bold**, `code`, etc.
  const renderInlineMarkdown = (text: string) => {
    // Regex splits on **bold text**
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* 
        HIERARCHY 1: Executive Control Header
        A single cohesive bar: Identity, live event context, and primary actions.
      */}
      <div className="bg-[#090712] border border-purple-950/70 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-700/40 flex items-center justify-center shrink-0 text-purple-300 shadow-md">
            <Bot className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-base text-white">Agente Principal INSOMNIA</h2>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-800/40 text-[10px] font-medium text-purple-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>{event.name}</span>
              <span className="text-purple-600">·</span>
              <span>{event.genre}</span>
              <span className="text-purple-600">·</span>
              <span className="font-mono text-purple-300">ROAS {event.blendedRoas}x</span>
              <span className="text-purple-600">·</span>
              <span className="font-mono text-purple-300">{event.currentLote}</span>
            </p>
          </div>
        </div>

        {/* Header Actions: Reset & Export */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={handleResetChat}
            title="Reiniciar diálogo"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#120d24] hover:bg-[#1a1333] border border-purple-900/40 text-slate-300 hover:text-white text-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Reiniciar</span>
          </button>

          <SheetsExportButton
            filename={`Conversas_Agente_Principal_${event.id}`}
            title={`Histórico de Inteligência - ${event.name}`}
            headers={sheetsHeaders}
            rows={sheetsRows}
            label="Exportar Diálogo"
          />
        </div>
      </div>

      {/* 
        HIERARCHY 2: Clean Conversation Workspace
        High readability, comfortable spacing, no noisy avatar repetition.
      */}
      <div className="bg-[#07050d] border border-purple-950/60 rounded-2xl flex flex-col h-[600px] shadow-2xl overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.map((msg) => {
            const isBot = msg.role === 'assistant';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
              >
                {/* Message Meta: Sender & Time */}
                <div className={`flex items-center gap-2 text-[10px] text-slate-500 mb-1 px-1 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
                  <span className="font-semibold text-slate-400">
                    {isBot ? 'Agente Principal' : 'Você (Equipe)'}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`relative group max-w-[90%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 transition-all ${
                    isBot
                      ? msg.isReport
                        ? 'bg-[#100b22] border border-amber-500/30 text-slate-200 rounded-tl-sm shadow-md'
                        : 'bg-[#0f0b1c] border border-purple-950/80 text-slate-200 rounded-tl-sm shadow-sm'
                      : 'bg-[#21143d] border border-purple-700/50 text-purple-50 rounded-tr-sm shadow-md'
                  }`}
                >
                  {/* Subtle Report Tag if from Campaign Manager */}
                  {msg.isReport && (
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-300 mb-2 pb-1.5 border-b border-amber-500/20">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Auditoria do Gerente de Campanha</span>
                    </div>
                  )}

                  {/* Formatted Text Content */}
                  <div>
                    {renderFormattedContent(msg.text)}
                  </div>

                  {/* Copy Button (Subtle, visible on hover/tap) */}
                  {isBot && (
                    <div className="mt-3 pt-2 border-t border-purple-950/40 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="text-[10px] text-slate-600 font-mono">
                        Base: Dados internos de {event.name}
                      </span>
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-purple-900/30 text-slate-400 hover:text-purple-300 transition-colors cursor-pointer"
                        title="Copiar mensagem para a área de transferência"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 font-medium">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Thinking / Streaming Indicator */}
          {isSending && (
            <div className="flex flex-col items-start space-y-1">
              <span className="text-[10px] text-slate-500 px-1 font-semibold">
                Agente Principal
              </span>
              <div className="bg-[#0f0b1c] border border-purple-900/40 rounded-2xl rounded-tl-sm p-4 text-xs text-purple-300 flex items-center gap-3 shadow-sm">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span>Cruzando faturamento, métricas de tráfego e picos de audiência...</span>
              </div>
            </div>
          )}

          {/* Suggested Strategic Cards if conversation is at start */}
          {messages.length === 1 && !isSending && (
            <div className="mt-6 pt-4 border-t border-purple-950/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Diretrizes Rápidas Recomendadas
                </span>
                <span className="text-[11px] text-slate-500">Clique para enviar imediatamente</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {strategicPrompts.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(item.query)}
                      className="p-3 rounded-xl bg-[#0f0b1c] hover:bg-[#16102a] border border-purple-950/80 hover:border-purple-800/60 text-left transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-3.5 h-3.5 text-purple-400 group-hover:text-purple-300" />
                        <span className="text-xs font-bold text-white group-hover:text-purple-200">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        {item.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 
          HIERARCHY 3: Input Composer
          Spacious, clean, with optional collapsible quick prompts.
        */}
        <div className="border-t border-purple-950/60 bg-[#080611] p-3 sm:p-4 space-y-2">
          {/* Quick Prompts Toggle (for when conversation has progressed) */}
          {messages.length > 1 && (
            <div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowQuickPrompts(!showQuickPrompts)}
                  className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>{showQuickPrompts ? 'Ocultar sugestões rápidas' : 'Ver sugestões rápidas'}</span>
                  {showQuickPrompts ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {showQuickPrompts && (
                <div className="flex items-center gap-1.5 overflow-x-auto py-2 scrollbar-none">
                  {strategicPrompts.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        handleSendMessage(item.query);
                        setShowQuickPrompts(false);
                      }}
                      disabled={isSending}
                      className="px-2.5 py-1 rounded-lg bg-[#120d24] hover:bg-[#1a1233] border border-purple-900/40 text-[11px] text-purple-300 hover:text-white whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Clean Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2"
          >
            <div className="flex-1 bg-[#0f0b1c] border border-purple-950/80 focus-within:border-purple-600/70 rounded-xl px-3.5 py-2 transition-all">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Consulte vendas, viradas de lote, anúncios, horários de postagem ou estratégias..."
                disabled={isSending}
                className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none resize-none leading-relaxed disabled:opacity-50 max-h-32"
              />
            </div>

            <button
              type="submit"
              disabled={!inputPrompt.trim() || isSending}
              className="h-10 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-purple-950/40 disabled:text-slate-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:cursor-not-allowed shadow-md shadow-purple-950/50 shrink-0"
              title="Enviar mensagem (Enter)"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </form>

          {/* Micro Helper Note */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
            <span>Pressione <strong>Enter</strong> para enviar · <strong>Shift + Enter</strong> para nova linha</span>
            <span className="font-mono text-purple-400/80">INSOMNIA Intelligence Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
};
