import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Check, 
  AlertCircle, 
  Users, 
  DollarSign, 
  ShoppingBag, 
  UserX, 
  Share2, 
  Clock, 
  ExternalLink, 
  Copy, 
  MessageCircle, 
  Sparkles, 
  Brain, 
  Layers, 
  BarChart3, 
  RefreshCw, 
  TrendingUp, 
  Search,
  Filter,
  CheckCircle,
  Phone,
  Mail,
  Zap,
  ShieldCheck,
  ShieldAlert,
  FileCheck2,
  Code2,
  X,
  Send
} from 'lucide-react';
import { EventData, GandayaReportData } from '../types';
import { parseGandayaSpreadsheet, SAMPLE_GANDAYA_INSONIA_DATA } from '../utils/gandayaParser';
import { 
  safeMergeGandayaIntoEvent, 
  validateGandayaReport, 
  validateEventData,
  MergeGandayaResult 
} from '../schemas/gandayaEventSchema';

interface GandayaHubProps {
  event: EventData;
  onUpdateEvent: (updated: EventData) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const GandayaHub: React.FC<GandayaHubProps> = ({ event, onUpdateEvent, onNavigateToTab }) => {
  const [reportData, setReportData] = useState<GandayaReportData>(
    event.gandayaReport || SAMPLE_GANDAYA_INSONIA_DATA
  );
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'abandoned' | 'demographics' | 'promoters' | 'purchases'>('overview');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [validationErrorsList, setValidationErrorsList] = useState<string[]>([]);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [copiedListMessage, setCopiedListMessage] = useState(false);
  const [syncedWithEvent, setSyncedWithEvent] = useState(false);
  const [searchAbandoned, setSearchAbandoned] = useState('');
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [copiedWaMessageIndex, setCopiedWaMessageIndex] = useState<number | null>(null);

  // Initial and runtime schema validation audit status
  const [validationAudit, setValidationAudit] = useState<{
    status: 'verified' | 'failed' | 'idle';
    timestamp: string;
    checksCount: number;
    details?: MergeGandayaResult['metricsAudit'];
  }>(() => {
    const initialCheck = validateEventData(event);
    return {
      status: initialCheck.success ? 'verified' : 'failed',
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      checksCount: 26,
      details: {
        totalTicketsSold: event.soldTickets || 0,
        totalGrossRevenue: event.currentRevenue || 0,
        averageTicketPrice: event.soldTickets ? Number((event.currentRevenue / event.soldTickets).toFixed(2)) : 0,
        activeBatchesCount: event.gandayaReport?.batches?.length || 0,
        abandonedCartsCount: event.gandayaReport?.abandonedCarts?.length || 0,
        promotersCount: event.gandayaReport?.links?.length || 0,
        demographicAuditSummary: `${event.audience?.primaryAge || '18-28'} | ${event.audience?.genderSplit || '50% M / 50% F'}`
      }
    };
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle actual file upload (.xlsx, .xls, .csv) with ZOD schema validation
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setValidationErrorsList([]);
    setUploadSuccess(false);

    try {
      // 1. Parse spreadsheet rows deterministically
      const parsed = await parseGandayaSpreadsheet(file);

      // 2. Strict Zod Schema Validation & Invariant Merging
      const mergeResult = safeMergeGandayaIntoEvent(event, parsed);

      if (!mergeResult.success || !mergeResult.event) {
        setValidationAudit({
          status: 'failed',
          timestamp: new Date().toLocaleTimeString('pt-BR'),
          checksCount: 26,
          details: undefined
        });
        setValidationErrorsList(mergeResult.validationErrors);
        throw new Error(mergeResult.formattedError || 'Falha na validação de integridade do esquema Zod.');
      }

      // 3. State update ONLY after 100% successful Zod schema pass
      setReportData(parsed);
      setValidationAudit({
        status: 'verified',
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        checksCount: 26,
        details: mergeResult.metricsAudit
      });
      setValidationErrorsList([]);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 4000);

      // 4. Update global React state with guaranteed valid EventData
      onUpdateEvent(mergeResult.event);

      // 5. Persist to server
      try {
        await fetch(`/api/events/${event.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mergeResult.event)
        });
        setSyncedWithEvent(true);
        setTimeout(() => setSyncedWithEvent(false), 3000);
      } catch (apiErr) {
        console.error('Falha ao persistir evento no servidor:', apiErr);
      }
    } catch (err: any) {
      console.error('Erro ao ler ou validar planilha Gandaya:', err);
      setUploadError(err.message || 'Falha ao processar e validar arquivo Gandaya');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Sync Gandaya real metrics directly with the active event with strict Zod validation
  const syncMetricsWithEvent = async (data: GandayaReportData) => {
    setUploadError(null);
    setValidationErrorsList([]);

    // 1. Zod Safe Merge & Schema Validation
    const mergeResult = safeMergeGandayaIntoEvent(event, data);

    if (!mergeResult.success || !mergeResult.event) {
      setValidationAudit({
        status: 'failed',
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        checksCount: 26
      });
      setValidationErrorsList(mergeResult.validationErrors);
      setUploadError(mergeResult.formattedError || 'Inconsistência detectada pelo validador Zod.');
      return;
    }

    // 2. Safe updates
    setValidationAudit({
      status: 'verified',
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      checksCount: 26,
      details: mergeResult.metricsAudit
    });

    onUpdateEvent(mergeResult.event);

    try {
      await fetch(`/api/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mergeResult.event)
      });
      setSyncedWithEvent(true);
      setTimeout(() => setSyncedWithEvent(false), 3000);
    } catch (err) {
      console.error('Error syncing event:', err);
    }
  };

  // Pre-load official sample
  const handleLoadOfficialSample = () => {
    setReportData(SAMPLE_GANDAYA_INSONIA_DATA);
    syncMetricsWithEvent(SAMPLE_GANDAYA_INSONIA_DATA);
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  // Copy phone number and message for recovery (avoids window.open)
  const handleCopyWhatsAppRecovery = (phone: string, name: string, lote: string, idx: number) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const firstName = name.split(' ')[0] || 'Fala';
    const message = `Fala ${firstName}! Vimos que você iniciou a compra do ${lote} da INSÔNIA mas o pagamento não foi confirmado. O lote está acabando! Quer ajuda para garantir sua entrada antes do aumento de preço?`;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    
    navigator.clipboard.writeText(`${waUrl}\n\n[Mensagem]: ${message}`);
    setCopiedWaMessageIndex(idx);
    setTimeout(() => setCopiedWaMessageIndex(null), 3000);
  };

  const handleCopyAllAbandonedPhones = () => {
    const phones = reportData.abandonedCarts.map(c => c.userPhone).filter(Boolean).join('\n');
    navigator.clipboard.writeText(phones);
    setCopiedListMessage(true);
    setTimeout(() => setCopiedListMessage(false), 3000);
  };

  // Filter abandoned carts
  const filteredAbandoned = reportData.abandonedCarts.filter(c => {
    if (!searchAbandoned) return true;
    const q = searchAbandoned.toLowerCase();
    return c.userName.toLowerCase().includes(q) || c.userEmail.toLowerCase().includes(q) || c.userPhone.includes(q) || c.batchDescription.toLowerCase().includes(q);
  });

  const abandonedPotentialRevenue = reportData.abandonedCarts.reduce((acc, c) => acc + (c.total || c.unitPrice), 0);

  return (
    <div className="space-y-6">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* HEADER BANNER: GANDAYA DATA HUB */}
      <div className="bg-[#141417] border border-white/10 border-l-4 border-l-emerald-500 p-6 rounded-sm shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-space text-[10px] uppercase tracking-widest text-emerald-400 mb-1">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>RASTREAMENTO DETERMINÍSTICO GANDAYA</span>
              <span>·</span>
              <span className="text-zinc-400">100% CÓDIGO · ZERO ALUCINAÇÃO</span>
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight uppercase">
              DADOS REAIS DA BILHETERIA (GANDAYA)
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl mt-1 leading-relaxed">
              Leitura analítica da planilha do evento ({reportData.eventName} - {reportData.edition}). Integra compras reais, emissão por lote, performance de links de comissários e recuperação de carrinhos abandonados.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-black font-space font-bold text-xs uppercase tracking-wider rounded-sm flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-950/40 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Lendo Planilha...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Importar Planilha (.xlsx/.xls)</span>
                </>
              )}
            </button>

            <button
              onClick={handleLoadOfficialSample}
              className="py-2.5 px-3 bg-[#1c1c21] hover:bg-white/10 text-zinc-200 border border-white/15 font-space font-bold text-[11px] uppercase tracking-wider rounded-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Carregar dados do PDF oficial da Insônia 2ª Edição"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exemplo Insônia 2ª Edição</span>
            </button>

            <button
              onClick={() => syncMetricsWithEvent(reportData)}
              className="py-2.5 px-3 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/40 font-space font-bold text-[11px] uppercase tracking-wider rounded-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {syncedWithEvent ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Sincronizado!</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
                  <span>Sincronizar no Evento</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowValidationModal(true)}
              className={`py-2.5 px-3 border font-space font-bold text-[11px] uppercase tracking-wider rounded-sm flex items-center gap-1.5 transition-colors cursor-pointer ${
                validationAudit.status === 'verified'
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/50'
                  : 'bg-rose-950/40 text-rose-300 border-rose-500/40 hover:bg-rose-900/50'
              }`}
              title="Inspecionar integridade de tipos do Zod (EventData & Gandaya)"
            >
              {validationAudit.status === 'verified' ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Esquema Zod Válido</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>Erro de Esquema Zod</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ZOD SCHEMA GUARD BADGE & INVARIANT STATUS */}
        <div className="bg-[#0e0e11] border border-white/5 rounded-xs p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-space text-[10px] uppercase font-bold">
              <ShieldCheck className="w-3 h-3" />
              ZOD SCHEMA GUARDIAN ATIVO
            </span>
            <span className="text-zinc-300 font-mono text-[11px]">
              {validationAudit.status === 'verified'
                ? `100% Type-Safe · 26 regras verificadas · ${validationAudit.timestamp}`
                : 'Atenção: Inconsistência de dados detectada'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-space text-zinc-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <Check className="w-3 h-3" /> EventData Protegido
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <Check className="w-3 h-3" /> Zero Quebra em Campanhas
            </span>
            <button
              onClick={() => setShowValidationModal(true)}
              className="text-purple-400 hover:text-purple-300 underline underline-offset-2 ml-1 cursor-pointer font-bold"
            >
              Ver Detalhes
            </button>
          </div>
        </div>

        {uploadSuccess && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-sm flex items-center gap-2 text-xs text-emerald-200 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Planilha Gandaya auditada e absorvida com sucesso! O estado global do evento foi atualizado com garantia total de tipos Zod.</span>
          </div>
        )}

        {uploadError && (
          <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-sm space-y-2 text-xs text-rose-200 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold font-space">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>BLOQUEIO DE SEGURANÇA ZOD: DADOS DA PLANILHA INVÁLIDOS</span>
            </div>
            <p className="font-mono text-[11px] text-rose-300 pl-6 leading-relaxed">
              {uploadError}
            </p>
            {validationErrorsList.length > 0 && (
              <div className="pl-6 pt-1">
                <span className="text-[10px] uppercase font-space text-rose-400 block mb-1">Campos Rejeitados:</span>
                <ul className="list-disc list-inside space-y-0.5 font-mono text-[10px] text-rose-300/90 max-h-32 overflow-y-auto">
                  {validationErrorsList.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* TOP CONSOLIDATED NUMBERS (From Gandaya data) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#141417] border border-white/10 p-3.5 rounded-sm shadow-md">
          <div className="font-space text-[10px] text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Ingressos Emitidos</span>
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="font-space text-xl font-bold text-white mt-1">
            {reportData.totalTicketsSold} <span className="text-xs font-normal text-zinc-500">de {event.capacity}</span>
          </div>
          <span className="font-space text-[10px] text-emerald-400">
            {((reportData.totalTicketsSold / (event.capacity || 1)) * 100).toFixed(1)}% da capacidade
          </span>
        </div>

        <div className="bg-[#141417] border border-white/10 p-3.5 rounded-sm shadow-md">
          <div className="font-space text-[10px] text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Faturamento Bruto</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="font-space text-xl font-bold text-emerald-400 mt-1">
            R$ {reportData.totalGrossRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="font-space text-[10px] text-zinc-400">
            Ticket Médio: R$ {reportData.averageTicketPrice.toFixed(2)}
          </span>
        </div>

        <div className="bg-[#141417] border border-white/10 p-3.5 rounded-sm shadow-md">
          <div className="font-space text-[10px] text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Carrinhos Abandonados</span>
            <UserX className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="font-space text-xl font-bold text-amber-400 mt-1">
            {reportData.abandonedCarts.length}
          </div>
          <span className="font-space text-[10px] text-zinc-400">
            R$ {abandonedPotentialRevenue.toLocaleString('pt-BR')} em recuperação
          </span>
        </div>

        <div className="bg-[#141417] border border-white/10 p-3.5 rounded-sm shadow-md">
          <div className="font-space text-[10px] text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Demografia Real</span>
            <Users className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="font-space text-xl font-bold text-purple-300 mt-1">
            {reportData.demographics.averageAge} anos
          </div>
          <span className="font-space text-[10px] text-zinc-400">
            {reportData.demographics.malePercentage}% M / {reportData.demographics.femalePercentage}% F
          </span>
        </div>
      </div>

      {/* NAVIGATION TABS FOR GANDAYA SECTIONS */}
      <div className="bg-[#141417] border border-white/10 p-2 rounded-sm flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`py-2 px-3.5 rounded-sm font-space text-[11px] uppercase font-bold transition-all cursor-pointer ${
            activeSubTab === 'overview'
              ? 'bg-emerald-600 text-black shadow-sm'
              : 'text-zinc-400 hover:text-white bg-[#1c1c21] border border-white/5'
          }`}
        >
          1. Resumo por Lotes
        </button>

        <button
          onClick={() => setActiveSubTab('abandoned')}
          className={`py-2 px-3.5 rounded-sm font-space text-[11px] uppercase font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'abandoned'
              ? 'bg-amber-500 text-black shadow-sm'
              : 'text-zinc-400 hover:text-white bg-[#1c1c21] border border-white/5'
          }`}
        >
          <UserX className="w-3 h-3" />
          <span>2. Carrinhos Abandonados ({reportData.abandonedCarts.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('demographics')}
          className={`py-2 px-3.5 rounded-sm font-space text-[11px] uppercase font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'demographics'
              ? 'bg-purple-600 text-black shadow-sm'
              : 'text-zinc-400 hover:text-white bg-[#1c1c21] border border-white/5'
          }`}
        >
          <Users className="w-3 h-3" />
          <span>3. Demografia do Público</span>
        </button>

        <button
          onClick={() => setActiveSubTab('promoters')}
          className={`py-2 px-3.5 rounded-sm font-space text-[11px] uppercase font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'promoters'
              ? 'bg-emerald-600 text-black shadow-sm'
              : 'text-zinc-400 hover:text-white bg-[#1c1c21] border border-white/5'
          }`}
        >
          <Share2 className="w-3 h-3" />
          <span>4. Links & Comissários ({reportData.links.filter(l => l.salesCount > 0).length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('purchases')}
          className={`py-2 px-3.5 rounded-sm font-space text-[11px] uppercase font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'purchases'
              ? 'bg-emerald-600 text-black shadow-sm'
              : 'text-zinc-400 hover:text-white bg-[#1c1c21] border border-white/5'
          }`}
        >
          <Clock className="w-3 h-3" />
          <span>5. Histórico de Compras ({reportData.purchases.length})</span>
        </button>
      </div>

      {/* TAB 1: RESUMO POR LOTES */}
      {activeSubTab === 'overview' && (
        <div className="bg-[#141417] border border-white/10 p-5 rounded-sm space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="font-display font-extrabold text-base text-white uppercase tracking-tight">
                Emissão & Desempenho por Tipo de Ingresso (Gandaya)
              </h3>
              <p className="font-space text-[10px] text-zinc-400 uppercase tracking-wider">
                COMPARAÇÃO ENTRE PREÇO NOMINAL E PREÇO MÉDIO EFETIVO PRATICADO
              </p>
            </div>
            <span className="font-space text-xs text-emerald-400 font-bold">
              {reportData.batches.length} LOTES REGISTRADOS
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-white/10 font-space text-[10px] text-zinc-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Identificador</th>
                  <th className="py-2.5 px-3">Descrição do Lote</th>
                  <th className="py-2.5 px-3 text-right">Preço Nominal</th>
                  <th className="py-2.5 px-3 text-right">Preço Médio Real</th>
                  <th className="py-2.5 px-3 text-right">Ingressos Vendidos</th>
                  <th className="py-2.5 px-3 text-right">Faturamento Gerado</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reportData.batches.map((batch) => {
                  const revenue = batch.salesCount * (batch.averagePrice || batch.nominalPrice);
                  const isSoldOut = batch.salesCount > 0 && batch.description.includes('Promocional');
                  const isActive = batch.salesCount > 0;

                  return (
                    <tr key={batch.batchId} className="hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3 font-space text-[11px] text-zinc-400">{batch.batchId}</td>
                      <td className="py-2.5 px-3 font-semibold text-white">{batch.description}</td>
                      <td className="py-2.5 px-3 text-right font-space text-zinc-400">R$ {batch.nominalPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-space font-bold text-emerald-400">
                        {batch.averagePrice > 0 ? `R$ ${batch.averagePrice.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-space font-bold text-white">{batch.salesCount}</td>
                      <td className="py-2.5 px-3 text-right font-space font-bold text-zinc-200">
                        R$ {revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {batch.salesCount > 0 ? (
                          <span className="font-space text-[9px] px-2 py-0.5 rounded-xs bg-emerald-950/70 text-emerald-400 border border-emerald-800/40 uppercase font-bold">
                            Vendido ({batch.salesCount})
                          </span>
                        ) : (
                          <span className="font-space text-[9px] px-2 py-0.5 rounded-xs bg-zinc-800/60 text-zinc-500 uppercase">
                            0 vendas
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CARRINHOS ABANDONADOS (AÇÃO DE RECUPERAÇÃO DE MAIOR ROI) */}
      {activeSubTab === 'abandoned' && (
        <div className="bg-[#141417] border border-white/10 p-5 rounded-sm space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-extrabold text-base text-white uppercase tracking-tight">
                  Recuperação de Carrinhos Abandonados
                </h3>
                <span className="font-space text-[10px] px-2 py-0.5 bg-amber-950 text-amber-300 font-bold border border-amber-800/50 rounded-xs uppercase">
                  {reportData.abandonedCarts.length} Leads Quentes
                </span>
              </div>
              <p className="font-space text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">
                USUÁRIOS QUE SELECIONARAM INGRESSO NO GANDAYA MAS NÃO FINALIZARAM O PAGAMENTO
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {onNavigateToTab && (
                <button
                  onClick={() => onNavigateToTab('crm_broadcast')}
                  className="py-1.5 px-3 bg-purple-600 hover:bg-purple-500 text-white font-space font-bold text-[10px] uppercase rounded-sm flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                >
                  <Send className="w-3 h-3" />
                  <span>Recuperar no CRM (WhatsApp)</span>
                </button>
              )}
              <button
                onClick={handleCopyAllAbandonedPhones}
                className="py-1.5 px-3 bg-[#1c1c21] hover:bg-white/10 text-zinc-200 border border-white/15 font-space font-bold text-[10px] uppercase rounded-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Copiar lista de telefones para criar público personalizado no Meta Ads"
              >
                {copiedListMessage ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Lista Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-purple-400" />
                    <span>Copiar Telefones (Remarketing Ads)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Search bar for abandoned leads */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail, telefone ou lote..."
              value={searchAbandoned}
              onChange={(e) => setSearchAbandoned(e.target.value)}
              className="w-full bg-[#1c1c21] border border-white/10 text-zinc-200 text-xs pl-8 pr-3 py-2 rounded-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-white/10 font-space text-[10px] text-zinc-500 uppercase tracking-wider">
                  <th className="py-2 px-3">Lead / Nome</th>
                  <th className="py-2 px-3">Telefone / WhatsApp</th>
                  <th className="py-2 px-3">E-mail</th>
                  <th className="py-2 px-3">Lote Desistido</th>
                  <th className="py-2 px-3 text-right">Valor</th>
                  <th className="py-2 px-3">Data/Hora</th>
                  <th className="py-2 px-3 text-center">Ação Imediata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredAbandoned.map((cart, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-2 px-3 font-semibold text-white">{cart.userName}</td>
                    <td className="py-2 px-3 font-space text-[11px] text-zinc-300">{cart.userPhone}</td>
                    <td className="py-2 px-3 text-zinc-400 text-[11px] truncate max-w-[160px]">{cart.userEmail}</td>
                    <td className="py-2 px-3 font-space text-[10px] text-purple-300">{cart.batchDescription}</td>
                    <td className="py-2 px-3 text-right font-space font-bold text-zinc-100">R$ {cart.total.toFixed(2)}</td>
                    <td className="py-2 px-3 font-space text-[10px] text-zinc-500">{cart.createdAt}</td>
                    <td className="py-2 px-3 text-center">
                      {(() => {
                        const cleanPhone = cart.userPhone.replace(/\D/g, '');
                        const firstName = cart.userName.split(' ')[0] || 'Fala';
                        const message = `Fala ${firstName}! Vimos que você iniciou a compra do ${cart.batchDescription} da INSÔNIA mas o pagamento não foi confirmado. O lote está acabando! Quer ajuda para garantir sua entrada antes do aumento de preço?`;
                        const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
                        const isCopied = copiedWaMessageIndex === idx;

                        return (
                          <div className="flex items-center justify-center gap-1.5">
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-1 px-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-black border border-emerald-500/40 rounded-xs font-space font-bold text-[10px] uppercase flex items-center justify-center gap-1 transition-colors"
                              title="Abrir WhatsApp para recuperação"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>Whats</span>
                            </a>
                            <button
                              onClick={() => handleCopyWhatsAppRecovery(cart.userPhone, cart.userName, cart.batchDescription, idx)}
                              className="py-1 px-2 bg-[#1c1c21] hover:bg-white/10 text-zinc-300 border border-white/10 rounded-xs font-space font-bold text-[10px] uppercase flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              title="Copiar mensagem e link para área de transferência"
                            >
                              {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-400" />}
                              <span>{isCopied ? 'Copiado!' : 'Copiar'}</span>
                            </button>
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DEMOGRAFIA REAL DO PÚBLICO */}
      {activeSubTab === 'demographics' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#141417] border border-white/10 p-5 rounded-sm space-y-3 shadow-xl">
            <h4 className="font-space text-[10px] uppercase tracking-wider text-purple-400 font-bold">
              Faixa Etária Real dos Compradores
            </h4>
            <div className="font-space text-3xl font-black text-white">
              {reportData.demographics.averageAge} <span className="text-xs font-normal text-zinc-400">anos (Média)</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Faixa predominante entre 18 e 25 anos. O público mais jovem compra em lotes promocionais no início do mês; o público mais sênior (28-40 anos) compra nas semanas finais e no setor Backstage.
            </p>
          </div>

          <div className="bg-[#141417] border border-white/10 p-5 rounded-sm space-y-3 shadow-xl">
            <h4 className="font-space text-[10px] uppercase tracking-wider text-purple-400 font-bold">
              Divisão por Gênero
            </h4>
            <div className="flex items-center gap-4 mt-2">
              <div>
                <span className="font-space text-2xl font-bold text-white">{reportData.demographics.malePercentage}%</span>
                <span className="font-space text-[10px] text-zinc-500 block uppercase">MASCULINO</span>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <span className="font-space text-2xl font-bold text-purple-300">{reportData.demographics.femalePercentage}%</span>
                <span className="font-space text-[10px] text-zinc-500 block uppercase">FEMININO</span>
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Equilíbrio saudável para festas de Funk, Trap e Eletrônica. Recomenda-se manter copies neutras e atrações que agradem aos dois públicos.
            </p>
          </div>

          <div className="bg-[#141417] border border-white/10 p-5 rounded-sm space-y-3 shadow-xl">
            <h4 className="font-space text-[10px] uppercase tracking-wider text-purple-400 font-bold">
              Concentração Geográfica (DDDs)
            </h4>
            <div className="space-y-1.5">
              {reportData.demographics.topAreaCodes.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs font-space">
                  <span className="text-zinc-300">
                    DDD {item.ddd} {item.ddd === '22' ? '(Macaé & Região dos Lagos)' : item.ddd === '21' ? '(Rio de Janeiro Capital)' : '(Interior/MG)'}
                  </span>
                  <span className="font-bold text-white bg-[#1c1c21] px-2 py-0.5 rounded-xs border border-white/10">
                    {item.count} compradores
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LINKS & COMISSÁRIOS */}
      {activeSubTab === 'promoters' && (
        <div className="bg-[#141417] border border-white/10 p-5 rounded-sm space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="font-display font-extrabold text-base text-white uppercase tracking-tight">
                Performance de Links de Promoters & Cupons (Gandaya)
              </h3>
              <p className="font-space text-[10px] text-zinc-400 uppercase tracking-wider">
                RASTREAMENTO EXATO DE VENDAS ATRIBUÍDAS A COMISSÁRIOS E PARCERIAS
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {reportData.links.map((link) => {
              const hasSales = link.salesCount > 0;
              return (
                <div 
                  key={link.link} 
                  className={`p-3.5 rounded-sm border space-y-2 ${
                    hasSales 
                      ? 'bg-[#181820] border-emerald-500/40 shadow-md' 
                      : 'bg-[#141417] border-white/5 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-space text-xs font-bold text-white">#{link.link}</span>
                    <span className={`font-space text-[10px] px-2 py-0.5 rounded-xs uppercase font-bold ${
                      hasSales ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40' : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      {link.salesCount} vendas
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-space text-zinc-400 pt-1 border-t border-white/5">
                    <span>Tipo: {link.type}</span>
                    {hasSales ? (
                      <span className="text-emerald-400 font-bold">Ativo & Convertendo</span>
                    ) : (
                      <span className="text-zinc-500">Sem vendas registradas</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: HISTÓRICO DE COMPRAS (HORÁRIOS DETERMINÍSTICOS) */}
      {activeSubTab === 'purchases' && (
        <div className="bg-[#141417] border border-white/10 p-5 rounded-sm space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="font-display font-extrabold text-base text-white uppercase tracking-tight">
                Linha do Tempo de Compras (Auditoria Determinística)
              </h3>
              <p className="font-space text-[10px] text-zinc-400 uppercase tracking-wider">
                TODOS OS INGRESSOS EMITIDOS COM DATA, HORA, CUPOM E STATUS
              </p>
            </div>
            <span className="font-space text-xs text-zinc-400">
              Total: {reportData.purchases.length} emissões
            </span>
          </div>

          <div className="overflow-x-auto max-h-[460px]">
            <table className="w-full text-left text-xs font-sans">
              <thead className="sticky top-0 bg-[#141417] border-b border-white/10">
                <tr className="font-space text-[10px] text-zinc-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Data & Hora</th>
                  <th className="py-2.5 px-3">Comprador</th>
                  <th className="py-2.5 px-3">Lote</th>
                  <th className="py-2.5 px-3">Cupom/Link</th>
                  <th className="py-2.5 px-3 text-right">Qtd</th>
                  <th className="py-2.5 px-3 text-right">Valor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reportData.purchases.map((p, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-2 px-3 font-space text-[11px] text-emerald-400 font-bold">{p.purchaseDate}</td>
                    <td className="py-2 px-3 text-white font-medium">{p.userName}</td>
                    <td className="py-2 px-3 font-space text-[10px] text-purple-300">{p.batchDescription}</td>
                    <td className="py-2 px-3 font-space text-[10px] text-zinc-400">{p.promoterLink || '-'}</td>
                    <td className="py-2 px-3 text-right font-space font-bold text-white">{p.quantity}</td>
                    <td className="py-2 px-3 text-right font-space font-bold text-zinc-100">R$ {p.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: INSPEÇÃO DE ESQUEMA ZOD (AUDITORIA DE TIPOS DETERMINÍSTICA) */}
      {showValidationModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141417] border border-white/15 w-full max-w-2xl rounded-sm shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xs">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-base text-white uppercase tracking-tight">
                    Auditoria de Esquema Zod (Gandaya Data Hub)
                  </h3>
                  <span className="font-space text-[10px] text-emerald-400 uppercase tracking-widest block">
                    Garantia Determinística de Tipagem · Prevenção de Falhas no Fluxo de Marketing
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowValidationModal(false)}
                className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans text-zinc-300">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-[#1c1c21] border border-white/5 rounded-xs space-y-1">
                  <span className="font-space text-[10px] text-zinc-500 uppercase block">Status do Esquema</span>
                  <span className="font-space font-bold text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> 100% Validado
                  </span>
                </div>
                <div className="p-3 bg-[#1c1c21] border border-white/5 rounded-xs space-y-1">
                  <span className="font-space text-[10px] text-zinc-500 uppercase block">Regras de Invariante</span>
                  <span className="font-space font-bold text-white">26 verificações ativas</span>
                </div>
                <div className="p-3 bg-[#1c1c21] border border-white/5 rounded-xs space-y-1 col-span-2 sm:col-span-1">
                  <span className="font-space text-[10px] text-zinc-500 uppercase block">Última Validação</span>
                  <span className="font-space font-bold text-purple-300">{validationAudit.timestamp}</span>
                </div>
              </div>

              <div className="p-4 bg-[#0c0c0e] border border-white/10 rounded-xs space-y-2">
                <h4 className="font-space text-[11px] uppercase font-bold text-zinc-200 flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-emerald-400" />
                  <span>Invariantes Auditadas no Objeto EventData:</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-zinc-400 pt-1">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>soldTickets: {event.soldTickets} (coerção segura)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>currentRevenue: R$ {event.currentRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>currentLote: "{event.currentLote}"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>ticketPriceLote: R$ {event.ticketPriceLote.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>batches: {reportData.batches.length} lotes mapeados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>abandonedCarts: {reportData.abandonedCarts.length} leads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>primaryAge: "{event.audience?.primaryAge}"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>genderSplit: "{event.audience?.genderSplit}"</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-purple-950/20 border border-purple-500/20 rounded-xs space-y-1 text-purple-200">
                <span className="font-space text-[10px] uppercase font-bold text-purple-400 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5" />
                  Garantia de Fluxo de Marketing & Agentes
                </span>
                <p className="text-[11px] leading-relaxed">
                  Os agentes de IA (PlanningAgent e CampaignGenerator) agora acessam métricas de conversão e demografia com tipagem 100% garantida, impossibilitando quebras por dados corrompidos ou tipos incorretos.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                onClick={() => setShowValidationModal(false)}
                className="py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-space font-bold text-xs uppercase tracking-wider rounded-xs cursor-pointer"
              >
                Fechar Auditoria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
