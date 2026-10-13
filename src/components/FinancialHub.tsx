import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  ExternalLink, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  PieChart, 
  ArrowUpRight, 
  DollarSign, 
  Check, 
  X, 
  Wallet, 
  Percent,
  Link as LinkIcon,
  HelpCircle,
  BarChart3
} from 'lucide-react';
import { 
  EventData, 
  FinancialCostItem, 
  FinancialRevenueItem, 
  FinancialCostCategory, 
  FinancialRevenueCategory,
  FinancialSheetsConfig,
  FinancialData
} from '../types';
import { 
  signInWithGoogleSheets, 
  extractSpreadsheetId, 
  getSpreadsheetMetadata, 
  readSheetValues, 
  parseCostsFromRows, 
  parseRevenuesFromRows, 
  calculateFinancialSummary, 
  createDefaultFinancialSpreadsheet, 
  appendCostRowToSheets, 
  appendRevenueRowToSheets, 
  formatBRL, 
  parseCurrency 
} from '../services/googleSheetsService';
import { getCachedAccessToken } from '../services/googleCalendarService';

interface FinancialHubProps {
  event: EventData;
  onUpdateEvent: (updated: EventData) => void;
  initialTab?: 'costs' | 'revenues' | 'consolidated';
}

const COST_CATEGORIES: FinancialCostCategory[] = [
  'Artístico & Cachês',
  'Estrutura & Cenografia',
  'Marketing & Tráfego',
  'Bar & Bebidas',
  'Segurança & Operação',
  'Taxas & Alvarás',
  'Outros'
];

const REVENUE_CATEGORIES: FinancialRevenueCategory[] = [
  'Bilheteria',
  'Bar & A&B',
  'Patrocínios',
  'Camarotes & Lounges',
  'Estacionamento',
  'Merchandising',
  'Outros'
];

export const FinancialHub: React.FC<FinancialHubProps> = ({
  event,
  onUpdateEvent,
  initialTab = 'costs'
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'costs' | 'revenues' | 'consolidated'>(initialTab);
  
  // Google Sheets integration state
  const sheetsConfig = event.financials?.sheetsConfig;
  const isSheetsConnected = Boolean(sheetsConfig?.spreadsheetId);

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [sheetInputUrl, setSheetInputUrl] = useState('');
  const [isAddCostModalOpen, setIsAddCostModalOpen] = useState(false);
  const [isAddRevenueModalOpen, setIsAddRevenueModalOpen] = useState(false);

  // New Cost Form State
  const [newCost, setNewCost] = useState<Partial<FinancialCostItem>>({
    category: 'Estrutura & Cenografia',
    description: '',
    supplier: '',
    budgetedAmount: 0,
    actualAmount: 0,
    paymentStatus: 'Pendente',
    dueDate: '',
    notes: ''
  });

  // New Revenue Form State
  const [newRevenue, setNewRevenue] = useState<Partial<FinancialRevenueItem>>({
    category: 'Bilheteria',
    description: '',
    channel: 'Gandaya Ingressos',
    plannedQuantity: 100,
    soldQuantity: 0,
    unitPrice: 90,
    grossRevenue: 0,
    platformFees: 0,
    netRevenue: 0,
    status: 'Previsto',
    date: '',
    notes: ''
  });

  // Keep subtab in sync if prop changes
  useEffect(() => {
    setActiveSubTab(initialTab);
  }, [initialTab]);

  const costs = useMemo(() => event.financials?.costs || [], [event.financials?.costs]);
  const revenues = useMemo(() => event.financials?.revenues || [], [event.financials?.revenues]);

  // Financial summary calculations
  const summary = useMemo(() => {
    return calculateFinancialSummary(
      costs, 
      revenues, 
      event.capacity || 3000, 
      event.soldTickets || 0
    );
  }, [costs, revenues, event.capacity, event.soldTickets]);

  // Costs by Category calculation
  const costsByCategory = useMemo(() => {
    const map: Record<string, { budgeted: number; actual: number }> = {};
    costs.forEach(c => {
      const cat = c.category || 'Outros';
      if (!map[cat]) map[cat] = { budgeted: 0, actual: 0 };
      map[cat].budgeted += (c.budgetedAmount || 0);
      map[cat].actual += (c.actualAmount || 0);
    });
    return Object.entries(map).map(([category, amounts]) => ({
      category,
      ...amounts,
      percentOfTotal: summary.totalActualCost > 0 ? (amounts.actual / summary.totalActualCost) * 100 : 0
    })).sort((a, b) => b.actual - a.actual);
  }, [costs, summary.totalActualCost]);

  // Revenues by Category calculation
  const revenuesByCategory = useMemo(() => {
    const map: Record<string, { gross: number; net: number }> = {};
    revenues.forEach(r => {
      const cat = r.category || 'Outros';
      if (!map[cat]) map[cat] = { gross: 0, net: 0 };
      map[cat].gross += (r.grossRevenue || 0);
      map[cat].net += (r.netRevenue || 0);
    });
    return Object.entries(map).map(([category, amounts]) => ({
      category,
      ...amounts,
      percentOfTotal: summary.totalGrossRevenue > 0 ? (amounts.gross / summary.totalGrossRevenue) * 100 : 0
    })).sort((a, b) => b.net - a.net);
  }, [revenues, summary.totalGrossRevenue]);

  // Filtered Costs
  const filteredCosts = useMemo(() => {
    return costs.filter(c => {
      const matchesSearch = searchTerm === '' || 
        c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = categoryFilter === 'all' || c.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || c.paymentStatus === statusFilter;
      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [costs, searchTerm, categoryFilter, statusFilter]);

  // Filtered Revenues
  const filteredRevenues = useMemo(() => {
    return revenues.filter(r => {
      const matchesSearch = searchTerm === '' || 
        r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.channel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = categoryFilter === 'all' || r.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [revenues, searchTerm, categoryFilter, statusFilter]);

  // Connect existing Google Sheets
  const handleConnectSpreadsheet = async () => {
    if (!sheetInputUrl.trim()) return;
    const spreadsheetId = extractSpreadsheetId(sheetInputUrl);
    if (!spreadsheetId) {
      setStatusMessage({ text: 'Link ou ID de planilha inválido. Verifique o formato do Google Sheets.', type: 'error' });
      return;
    }

    try {
      setIsLoading(true);
      setStatusMessage({ text: 'Conectando ao Google Sheets...', type: 'info' });

      let token = getCachedAccessToken();
      if (!token) {
        const authRes = await signInWithGoogleSheets();
        token = authRes.accessToken;
      }

      // Fetch metadata to verify access and discover tabs
      const meta = await getSpreadsheetMetadata(spreadsheetId, token);
      
      const costsSheet = meta.sheetNames.find(s => /custo|despesa|gasto/i.test(s)) || meta.sheetNames[0] || 'Custos';
      const revenuesSheet = meta.sheetNames.find(s => /receita|faturam|entrada|venda/i.test(s)) || (meta.sheetNames.length > 1 ? meta.sheetNames[1] : 'Receitas');

      // Read values
      const costsRows = await readSheetValues(spreadsheetId, `${costsSheet}!A1:J200`, token);
      const revenuesRows = await readSheetValues(spreadsheetId, `${revenuesSheet}!A1:M200`, token);

      const parsedCosts = parseCostsFromRows(costsRows);
      const parsedRevenues = parseRevenuesFromRows(revenuesRows);

      const updatedFinancials = {
        sheetsConfig: {
          spreadsheetId,
          spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
          spreadsheetTitle: meta.title,
          costsSheetName: costsSheet,
          revenuesSheetName: revenuesSheet,
          lastSyncedAt: new Date().toISOString(),
          autoSync: true
        },
        costs: parsedCosts.length > 0 ? parsedCosts : costs,
        revenues: parsedRevenues.length > 0 ? parsedRevenues : revenues,
        lastUpdated: new Date().toISOString()
      };

      // Persist to backend
      await fetch(`/api/events/${event.id}/financials/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFinancials)
      });

      onUpdateEvent({
        ...event,
        financials: updatedFinancials
      });

      setIsConnectModalOpen(false);
      setStatusMessage({ 
        text: `Planilha "${meta.title}" conectada com sucesso! ${parsedCosts.length} custos e ${parsedRevenues.length} receitas sincronizados.`, 
        type: 'success' 
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ text: `Erro ao conectar planilha: ${err.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Sync Now from Google Sheets
  const handleSyncWithSheets = async () => {
    if (!sheetsConfig?.spreadsheetId) {
      setIsConnectModalOpen(true);
      return;
    }

    try {
      setIsLoading(true);
      setStatusMessage({ text: 'Sincronizando dados com o Google Sheets...', type: 'info' });

      let token = getCachedAccessToken();
      if (!token) {
        const authRes = await signInWithGoogleSheets();
        token = authRes.accessToken;
      }

      const costsSheet = sheetsConfig.costsSheetName || 'Custos';
      const revenuesSheet = sheetsConfig.revenuesSheetName || 'Receitas';

      const [costsRows, revenuesRows] = await Promise.all([
        readSheetValues(sheetsConfig.spreadsheetId, `${costsSheet}!A1:J200`, token),
        readSheetValues(sheetsConfig.spreadsheetId, `${revenuesSheet}!A1:M200`, token)
      ]);

      const parsedCosts = parseCostsFromRows(costsRows);
      const parsedRevenues = parseRevenuesFromRows(revenuesRows);

      const updatedFinancials = {
        ...event.financials,
        sheetsConfig: {
          ...sheetsConfig,
          lastSyncedAt: new Date().toISOString()
        },
        costs: parsedCosts.length > 0 ? parsedCosts : costs,
        revenues: parsedRevenues.length > 0 ? parsedRevenues : revenues,
        lastUpdated: new Date().toISOString()
      };

      await fetch(`/api/events/${event.id}/financials/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFinancials)
      });

      onUpdateEvent({
        ...event,
        financials: updatedFinancials
      });

      setStatusMessage({ 
        text: `Sincronização concluída com sucesso! ${parsedCosts.length} custos e ${parsedRevenues.length} receitas lidos da planilha.`, 
        type: 'success' 
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ text: `Falha na sincronização: ${err.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Create brand new template spreadsheet in Google Drive with 1 click
  const handleCreateTemplateSpreadsheet = async () => {
    try {
      setIsLoading(true);
      setStatusMessage({ text: 'Autenticando e gerando nova planilha financeira no Google Sheets...', type: 'info' });

      let token = getCachedAccessToken();
      if (!token) {
        const authRes = await signInWithGoogleSheets();
        token = authRes.accessToken;
      }

      const { spreadsheetId, spreadsheetUrl } = await createDefaultFinancialSpreadsheet(
        event.name,
        costs,
        revenues,
        token
      );

      const updatedFinancials = {
        sheetsConfig: {
          spreadsheetId,
          spreadsheetUrl,
          spreadsheetTitle: `INSOMNIA EVENT SUITE - Finanças (${event.name})`,
          costsSheetName: 'Custos',
          revenuesSheetName: 'Receitas',
          lastSyncedAt: new Date().toISOString(),
          autoSync: true
        },
        costs,
        revenues,
        lastUpdated: new Date().toISOString()
      };

      await fetch(`/api/events/${event.id}/financials/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFinancials)
      });

      onUpdateEvent({
        ...event,
        financials: updatedFinancials
      });

      setStatusMessage({ 
        text: `Planilha criada com sucesso no seu Google Drive! Abas "Custos" e "Receitas" configuradas e vinculadas.`, 
        type: 'success' 
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ text: `Erro ao criar planilha no Google Sheets: ${err.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Add new Cost Item
  const handleAddCost = async () => {
    if (!newCost.description?.trim()) return;

    const item: FinancialCostItem = {
      id: `cost-${Date.now()}`,
      category: newCost.category || 'Geral',
      description: newCost.description,
      supplier: newCost.supplier || 'A definir',
      budgetedAmount: Number(newCost.budgetedAmount) || 0,
      actualAmount: Number(newCost.actualAmount) || 0,
      paymentStatus: newCost.paymentStatus || 'Pendente',
      dueDate: newCost.dueDate,
      notes: newCost.notes
    };

    const updatedCosts = [item, ...costs];
    const updatedFinancials: FinancialData = {
      sheetsConfig: event.financials?.sheetsConfig,
      costs: updatedCosts,
      revenues: revenues,
      lastUpdated: new Date().toISOString()
    };

    // Update local & backend
    onUpdateEvent({ ...event, financials: updatedFinancials });
    await fetch(`/api/events/${event.id}/financials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ financials: updatedFinancials })
    });

    // If sheets is connected, append to Google Sheets as well
    if (sheetsConfig?.spreadsheetId) {
      appendCostRowToSheets(
        sheetsConfig.spreadsheetId, 
        sheetsConfig.costsSheetName || 'Custos', 
        item
      ).catch(e => console.error('Erro ao anexar ao Google Sheets:', e));
    }

    setIsAddCostModalOpen(false);
    setNewCost({
      category: 'Estrutura & Cenografia',
      description: '',
      supplier: '',
      budgetedAmount: 0,
      actualAmount: 0,
      paymentStatus: 'Pendente',
      dueDate: '',
      notes: ''
    });

    setStatusMessage({ text: `Custo "${item.description}" adicionado com sucesso!`, type: 'success' });
  };

  // Add new Revenue Item
  const handleAddRevenue = async () => {
    if (!newRevenue.description?.trim()) return;

    const soldQty = Number(newRevenue.soldQuantity) || 0;
    const unitPrice = Number(newRevenue.unitPrice) || 0;
    const plannedQty = Number(newRevenue.plannedQuantity) || soldQty;
    let gross = Number(newRevenue.grossRevenue) || (soldQty * unitPrice);
    let fee = Number(newRevenue.platformFees) || Math.round(gross * 0.1); // 10% default platform fee
    let net = Number(newRevenue.netRevenue) || (gross - fee);

    const item: FinancialRevenueItem = {
      id: `rev-${Date.now()}`,
      category: newRevenue.category || 'Bilheteria',
      description: newRevenue.description,
      channel: newRevenue.channel || 'Gandaya Ingressos',
      plannedQuantity: plannedQty,
      soldQuantity: soldQty,
      unitPrice,
      grossRevenue: gross,
      platformFees: fee,
      netRevenue: net,
      status: newRevenue.status || 'Previsto',
      date: newRevenue.date,
      notes: newRevenue.notes
    };

    const updatedRevenues = [item, ...revenues];
    const updatedFinancials: FinancialData = {
      sheetsConfig: event.financials?.sheetsConfig,
      costs: costs,
      revenues: updatedRevenues,
      lastUpdated: new Date().toISOString()
    };

    onUpdateEvent({ ...event, financials: updatedFinancials });
    await fetch(`/api/events/${event.id}/financials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ financials: updatedFinancials })
    });

    // If sheets connected, append to Google Sheets
    if (sheetsConfig?.spreadsheetId) {
      appendRevenueRowToSheets(
        sheetsConfig.spreadsheetId,
        sheetsConfig.revenuesSheetName || 'Receitas',
        item
      ).catch(e => console.error('Erro ao anexar ao Google Sheets:', e));
    }

    setIsAddRevenueModalOpen(false);
    setNewRevenue({
      category: 'Bilheteria',
      description: '',
      channel: 'Gandaya Ingressos',
      plannedQuantity: 100,
      soldQuantity: 0,
      unitPrice: 90,
      grossRevenue: 0,
      platformFees: 0,
      netRevenue: 0,
      status: 'Previsto',
      date: '',
      notes: ''
    });

    setStatusMessage({ text: `Receita "${item.description}" cadastrada com sucesso!`, type: 'success' });
  };

  // Toggle Cost payment status (Pago / Pendente)
  const handleToggleCostStatus = async (costId: string) => {
    const updatedCosts = costs.map(c => {
      if (c.id === costId) {
        const newStatus: FinancialCostItem['paymentStatus'] = c.paymentStatus === 'Pago' ? 'Pendente' : 'Pago';
        return {
          ...c,
          paymentStatus: newStatus,
          actualAmount: newStatus === 'Pago' && c.actualAmount === 0 ? c.budgetedAmount : c.actualAmount,
          paidAt: newStatus === 'Pago' ? new Date().toISOString().split('T')[0] : undefined
        };
      }
      return c;
    });

    const updatedFinancials: FinancialData = {
      sheetsConfig: event.financials?.sheetsConfig,
      costs: updatedCosts,
      revenues: revenues,
      lastUpdated: new Date().toISOString()
    };
    onUpdateEvent({ ...event, financials: updatedFinancials });
    await fetch(`/api/events/${event.id}/financials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ financials: updatedFinancials })
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* TOP BANNER: GOOGLE SHEETS AS DATABASE HUB */}
      <div className="bg-[#141417] border border-white/[0.08] rounded-[4px] p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 rounded-[3px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Google Sheets Financial Database
                </h2>
                {isSheetsConnected ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] text-[10px] font-mono uppercase font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Conectado ao Sheets
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] text-[10px] font-mono uppercase font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Base Local (Pronta para Conectar)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isSheetsConnected 
                  ? `Planilha: "${sheetsConfig?.spreadsheetTitle || 'INSOMNIA Finanças'}" · Abas: "${sheetsConfig?.costsSheetName || 'Custos'}" e "${sheetsConfig?.revenuesSheetName || 'Receitas'}"`
                  : 'Utilize sua planilha do Google Sheets como banco de dados em tempo real para ler e calcular custos e faturamentos.'}
              </p>
              {sheetsConfig?.lastSyncedAt && (
                <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                  Última sincronização: {new Date(sheetsConfig.lastSyncedAt).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
          </div>

          {/* Sheets Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSyncWithSheets}
              disabled={isLoading}
              className="btn-v2 btn-v2-outline text-xs flex items-center gap-1.5"
              title="Ler planilha e recalcular todos os valores"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#8b5cf6]' : ''}`} />
              <span>{isLoading ? 'Sincronizando...' : 'Sincronizar Sheets'}</span>
            </button>

            {isSheetsConnected && sheetsConfig?.spreadsheetUrl && (
              <a
                href={sheetsConfig.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-v2 btn-v2-outline text-xs flex items-center gap-1.5 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir Planilha</span>
              </a>
            )}

            {!isSheetsConnected && (
              <button
                onClick={handleCreateTemplateSpreadsheet}
                disabled={isLoading}
                className="btn-v2 btn-v2-primary text-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Criar no Meu Google Sheets</span>
              </button>
            )}

            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="btn-v2 btn-v2-outline text-xs flex items-center gap-1.5 text-slate-300"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>{isSheetsConnected ? 'Alterar Planilha' : 'Vincular Link Existente'}</span>
            </button>
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
            <span>{statusMessage.text}</span>
            <button 
              onClick={() => setStatusMessage(null)} 
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* FINANCIAL SUB-NAV PILLS (CUSTOS vs RECEITAS vs DRE) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { setActiveSubTab('costs'); setCategoryFilter('all'); setStatusFilter('all'); }}
            className={`px-3.5 py-1.5 rounded-[2px] font-mono text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'costs'
                ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            <span>Aba de Custos ({costs.length})</span>
            <span className="badge-tech bg-rose-500/10 text-rose-300 border-rose-500/30">
              {formatBRL(summary.totalActualCost)}
            </span>
          </button>

          <button
            onClick={() => { setActiveSubTab('revenues'); setCategoryFilter('all'); setStatusFilter('all'); }}
            className={`px-3.5 py-1.5 rounded-[2px] font-mono text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'revenues'
                ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Aba de Receitas ({revenues.length})</span>
            <span className="badge-tech bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
              {formatBRL(summary.totalNetRevenue)}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('consolidated')}
            className={`px-3.5 py-1.5 rounded-[2px] font-mono text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'consolidated'
                ? 'bg-[#8b5cf6]/20 text-purple-200 border border-[#8b5cf6]/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#8b5cf6]" />
            <span>DRE & Resultado Consolidado</span>
            <span className={`badge-tech ${summary.netOperatingProfit >= 0 ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border-rose-500/30'}`}>
              {summary.netOperatingProfit >= 0 ? '+' : ''}{formatBRL(summary.netOperatingProfit)}
            </span>
          </button>
        </div>

        {/* Contextual Action Button */}
        <div>
          {activeSubTab === 'costs' && (
            <button
              onClick={() => setIsAddCostModalOpen(true)}
              className="btn-v2 btn-v2-primary text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Novo Custo</span>
            </button>
          )}

          {activeSubTab === 'revenues' && (
            <button
              onClick={() => setIsAddRevenueModalOpen(true)}
              className="btn-v2 btn-v2-primary text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nova Receita</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. ABA DE CUSTOS (DESPESAS OPERACIONAIS & ESTRUTURAIS) */}
      {/* ============================================================== */}
      {activeSubTab === 'costs' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* KPI CARDS: CUSTOS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#141417] border border-white/[0.08] p-4 rounded-[4px]">
              <span className="label-tech text-slate-400">Total de Custos Orçado</span>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {formatBRL(summary.totalBudgetedCost)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Realizado: {formatBRL(summary.totalActualCost)}</span>
                <span className="font-mono text-purple-300 font-bold">
                  {summary.totalBudgetedCost > 0 ? Math.round((summary.totalActualCost / summary.totalBudgetedCost) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-[#1c1c21] h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-[#8b5cf6] h-full"
                  style={{ width: `${Math.min(100, summary.totalBudgetedCost > 0 ? (summary.totalActualCost / summary.totalBudgetedCost) * 100 : 0)}%` }}
                />
              </div>
            </div>

            <div className="bg-[#141417] border border-white/[0.08] p-4 rounded-[4px]">
              <span className="label-tech text-emerald-400">Custos Já Pagos / Liquidados</span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {formatBRL(costs.filter(c => c.paymentStatus === 'Pago').reduce((a, b) => a + (b.actualAmount || 0), 0))}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {costs.filter(c => c.paymentStatus === 'Pago').length} de {costs.length} contratos quitados
              </p>
            </div>

            <div className="bg-[#141417] border border-white/[0.08] p-4 rounded-[4px]">
              <span className="label-tech text-amber-400">Custos Pendentes / A Vencer</span>
              <div className="text-xl font-bold font-mono text-amber-300 mt-1">
                {formatBRL(summary.totalPendingCost)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {costs.filter(c => c.paymentStatus !== 'Pago').length} contratos pendentes de acerto
              </p>
            </div>

            <div className="bg-[#141417] border border-white/[0.08] p-4 rounded-[4px]">
              <span className="label-tech text-indigo-400">Custo Médio / Participante</span>
              <div className="text-xl font-bold font-mono text-indigo-300 mt-1">
                {formatBRL(summary.costPerAttendee)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Base: {event.soldTickets || event.capacity} pessoas (capacidade máx)
              </p>
            </div>
          </div>

          {/* CATEGORY PROGRESS BAR BREAKDOWN */}
          <div className="bg-[#141417] border border-white/[0.08] p-4 rounded-[4px]">
            <div className="flex items-center justify-between mb-3">
              <span className="label-tech text-white flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-rose-400" />
                DISTRIBUIÇÃO DE CUSTOS POR CATEGORIA (TOTAL: {formatBRL(summary.totalActualCost)})
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {costsByCategory.length} categorias mapeadas
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {costsByCategory.map((cat) => (
                <div key={cat.category} className="bg-[#1c1c21] p-3 rounded-[3px] border border-white/[0.05]">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-200 truncate">{cat.category}</span>
                    <span className="font-mono text-white font-bold">{formatBRL(cat.actual)}</span>
                  </div>
                  <div className="w-full bg-[#141417] h-1.5 rounded-full overflow-hidden mb-1">
                    <div 
                      className="bg-rose-500 h-full"
                      style={{ width: `${Math.min(100, cat.percentOfTotal)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Orçado: {formatBRL(cat.budgeted)}</span>
                    <span>{cat.percentOfTotal.toFixed(1)}% do total</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SEARCH & FILTERS BAR */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#141417] p-3 rounded-[4px] border border-white/[0.08]">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar fornecedor, item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#1c1c21] border border-white/[0.1] rounded-[2px] pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#8b5cf6]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#1c1c21] border border-white/[0.1] rounded-[2px] px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-[#8b5cf6]"
              >
                <option value="all">Todas as Categorias</option>
                {COST_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#1c1c21] border border-white/[0.1] rounded-[2px] px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-[#8b5cf6]"
              >
                <option value="all">Todos os Status</option>
                <option value="Pago">Pago</option>
                <option value="Pendente">Pendente</option>
                <option value="A Vencer">A Vencer</option>
              </select>

              {(searchTerm || categoryFilter !== 'all' || statusFilter !== 'all') && (
                <button
                  onClick={() => { setSearchTerm(''); setCategoryFilter('all'); setStatusFilter('all'); }}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 font-mono"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* COSTS TABLE */}
          <div className="bg-[#141417] border border-white/[0.08] rounded-[4px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-[#1c1c21]/60 font-mono text-[11px] text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Item / Descrição</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4">Fornecedor</th>
                    <th className="py-3 px-4 text-right">Orçado</th>
                    <th className="py-3 px-4 text-right">Realizado</th>
                    <th className="py-3 px-4">Vencimento</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {filteredCosts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 font-mono">
                        Nenhum custo encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredCosts.map((item) => (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-medium text-white max-w-[240px]">
                          <div className="truncate font-semibold">{item.description}</div>
                          {item.notes && (
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">{item.notes}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          <span className="px-2 py-0.5 rounded-[2px] bg-white/[0.05] border border-white/[0.08] text-[11px] font-mono">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-mono text-[11px] truncate max-w-[160px]">
                          {item.supplier}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-400">
                          {formatBRL(item.budgetedAmount)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-white">
                          {formatBRL(item.actualAmount)}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                          {item.dueDate || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-mono uppercase font-bold border ${
                            item.paymentStatus === 'Pago'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : item.paymentStatus === 'A Vencer'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                          }`}>
                            {item.paymentStatus === 'Pago' && <Check className="w-3 h-3" />}
                            {item.paymentStatus === 'A Vencer' && <Clock className="w-3 h-3" />}
                            {item.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleToggleCostStatus(item.id)}
                            className="font-mono text-[10px] px-2 py-1 rounded-[2px] border border-white/[0.1] hover:bg-white/[0.08] transition-colors text-slate-300 cursor-pointer"
                            title="Alternar entre Pago e Pendente"
                          >
                            {item.paymentStatus === 'Pago' ? 'Marcar Pendente' : 'Marcar Pago'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/[0.1] bg-[#1c1c21] font-mono font-bold text-xs">
                    <td colSpan={3} className="py-3 px-4 text-white">TOTAL CONSOLIDADO DOS CUSTOS:</td>
                    <td className="py-3 px-4 text-right text-slate-300">
                      {formatBRL(filteredCosts.reduce((a, b) => a + (b.budgetedAmount || 0), 0))}
                    </td>
                    <td className="py-3 px-4 text-right text-rose-400">
                      {formatBRL(filteredCosts.reduce((a, b) => a + (b.actualAmount || 0), 0))}
                    </td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* 2. ABA DE RECEITAS (FATURAMENTO, BILHETERIA & CANAIS) */}
      {/* ============================================================== */}
      {activeSubTab === 'revenues' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* KPI CARDS: RECEITAS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#141417] border border-white/[0.08] p-4 rounded-[4px]">
              <span className="label-tech text-slate-400">Faturamento Bruto Total</span>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {formatBRL(summary.totalGrossRevenue)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Todas as fontes de receita computadas
              </p>
            </div>

            <div className="bg-[#141417] border border-white/[0.08] p-4 rounded-[4px]">
              <span className="label-tech text-amber-400">Taxas & Deduções Plataforma</span>
              <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                -{formatBRL(summary.totalPlatformFees)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {summary.totalGrossRevenue > 0 ? ((summary.totalPlatformFees / summary.totalGrossRevenue) * 100).toFixed(1) : 0}% de desconto de gateway/ticketeira
              </p>
            </div>

            <div className="bg-[#141417] border border-white/[0.08] p-4 rounded-[4px]">
              <span className="label-tech text-emerald-400">Receita Líquida Realizada</span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {formatBRL(summary.totalNetRevenue)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Meta: {formatBRL(event.revenueTarget || 360000)}</span>
                <span className="font-mono text-emerald-300 font-bold">
                  {event.revenueTarget > 0 ? Math.round((summary.totalNetRevenue / event.revenueTarget) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-[#1c1c21] h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-emerald-400 h-full"
                  style={{ width: `${Math.min(100, event.revenueTarget > 0 ? (summary.totalNetRevenue / event.revenueTarget) * 100 : 0)}%` }}
                />
              </div>
            </div>

            <div className="bg-[#141417] border border-white/[0.08] p-4 rounded-[4px]">
              <span className="label-tech text-purple-400">Receita Total Projetada</span>
              <div className="text-xl font-bold font-mono text-purple-300 mt-1">
                {formatBRL(summary.projectedNetRevenue)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Inclui receitas com status "Previsto" (bar, etc.)
              </p>
            </div>
          </div>

          {/* REVENUES BREAKDOWN BY CHANNEL */}
          <div className="bg-[#141417] border border-white/[0.08] p-4 rounded-[4px]">
            <div className="flex items-center justify-between mb-3">
              <span className="label-tech text-white flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-emerald-400" />
                DISTRIBUIÇÃO DE RECEITAS POR CANAL (LÍQUIDO: {formatBRL(summary.totalNetRevenue)})
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {revenuesByCategory.length} canais ativos
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {revenuesByCategory.map((cat) => (
                <div key={cat.category} className="bg-[#1c1c21] p-3 rounded-[3px] border border-white/[0.05]">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-200 truncate">{cat.category}</span>
                    <span className="font-mono text-emerald-400 font-bold">{formatBRL(cat.net)}</span>
                  </div>
                  <div className="w-full bg-[#141417] h-1.5 rounded-full overflow-hidden mb-1">
                    <div 
                      className="bg-emerald-400 h-full"
                      style={{ width: `${Math.min(100, cat.percentOfTotal)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Bruto: {formatBRL(cat.gross)}</span>
                    <span>{cat.percentOfTotal.toFixed(1)}% do faturamento</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SEARCH & FILTERS BAR */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#141417] p-3 rounded-[4px] border border-white/[0.08]">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar lote, canal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#1c1c21] border border-white/[0.1] rounded-[2px] pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#8b5cf6]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#1c1c21] border border-white/[0.1] rounded-[2px] px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-[#8b5cf6]"
              >
                <option value="all">Todas as Categorias</option>
                {REVENUE_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#1c1c21] border border-white/[0.1] rounded-[2px] px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-[#8b5cf6]"
              >
                <option value="all">Todos os Status</option>
                <option value="Recebido">Recebido</option>
                <option value="Previsto">Previsto</option>
                <option value="Parcial">Parcial</option>
              </select>
            </div>
          </div>

          {/* REVENUES TABLE */}
          <div className="bg-[#141417] border border-white/[0.08] rounded-[4px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-[#1c1c21]/60 font-mono text-[11px] text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Origem / Descrição</th>
                    <th className="py-3 px-4">Canal</th>
                    <th className="py-3 px-4 text-center">Qtd Vendida</th>
                    <th className="py-3 px-4 text-right">Preço Unit.</th>
                    <th className="py-3 px-4 text-right">Bruto</th>
                    <th className="py-3 px-4 text-right">Taxas</th>
                    <th className="py-3 px-4 text-right">Líquido</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {filteredRevenues.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 font-mono">
                        Nenhuma receita encontrada para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredRevenues.map((item) => (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-medium text-white max-w-[240px]">
                          <div className="truncate font-semibold">{item.description}</div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">{item.category}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                          {item.channel}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-300">
                          {item.soldQuantity || '—'}{item.plannedQuantity ? ` / ${item.plannedQuantity}` : ''}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-400">
                          {item.unitPrice ? formatBRL(item.unitPrice) : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-300">
                          {formatBRL(item.grossRevenue)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-amber-400/80">
                          -{formatBRL(item.platformFees)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                          {formatBRL(item.netRevenue)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-mono uppercase font-bold border ${
                            item.status === 'Recebido'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : item.status === 'Previsto'
                              ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/[0.1] bg-[#1c1c21] font-mono font-bold text-xs">
                    <td colSpan={4} className="py-3 px-4 text-white">TOTAL CONSOLIDADO DAS RECEITAS:</td>
                    <td className="py-3 px-4 text-right text-slate-300">
                      {formatBRL(filteredRevenues.reduce((a, b) => a + (b.grossRevenue || 0), 0))}
                    </td>
                    <td className="py-3 px-4 text-right text-amber-400">
                      -{formatBRL(filteredRevenues.reduce((a, b) => a + (b.platformFees || 0), 0))}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-400">
                      {formatBRL(filteredRevenues.reduce((a, b) => a + (b.netRevenue || 0), 0))}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* 3. ABA DRE & RESULTADO CONSOLIDADO */}
      {/* ============================================================== */}
      {activeSubTab === 'consolidated' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* TOP EXECUTIVE CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Lucro Operacional Líquido */}
            <div className={`p-5 rounded-[4px] border ${
              summary.netOperatingProfit >= 0 
                ? 'bg-emerald-950/20 border-emerald-500/40' 
                : 'bg-rose-950/20 border-rose-500/40'
            }`}>
              <div className="flex items-center justify-between">
                <span className="label-tech text-white font-bold">LUCRO OPERACIONAL LÍQUIDO</span>
                <span className={`badge-tech ${summary.netOperatingProfit >= 0 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}>
                  {summary.netOperatingProfit >= 0 ? 'SUPERÁVIT' : 'DÉFICIT'}
                </span>
              </div>
              <div className={`text-3xl font-extrabold font-mono mt-2 tracking-tight ${
                summary.netOperatingProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {summary.netOperatingProfit >= 0 ? '+' : ''}{formatBRL(summary.netOperatingProfit)}
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Fórmula: Receita Líquida Realizada ({formatBRL(summary.totalNetRevenue)}) − Custos Realizados ({formatBRL(summary.totalActualCost)})
              </p>
            </div>

            {/* Margem Operacional & ROI */}
            <div className="bg-[#141417] border border-white/[0.08] p-5 rounded-[4px]">
              <span className="label-tech text-slate-400">MARGEM & RETORNO (ROI)</span>
              <div className="flex items-baseline gap-4 mt-2">
                <div>
                  <span className="text-xs text-slate-400 font-mono">Margem Líquida</span>
                  <div className="text-2xl font-bold font-mono text-purple-300">
                    {summary.profitMarginPercent.toFixed(1)}%
                  </div>
                </div>
                <div className="border-l border-white/[0.1] pl-4">
                  <span className="text-xs text-slate-400 font-mono">ROI Global</span>
                  <div className="text-2xl font-bold font-mono text-indigo-300">
                    {summary.roiPercent.toFixed(1)}%
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Para cada R$ 1,00 investido em custos, o evento retornou R$ {(1 + (summary.roiPercent / 100)).toFixed(2)}.
              </p>
            </div>

            {/* Ponto de Equilíbrio / Break-Even */}
            <div className="bg-[#141417] border border-white/[0.08] p-5 rounded-[4px]">
              <span className="label-tech text-amber-400">PONTO DE EQUILÍBRIO (BREAK-EVEN)</span>
              <div className="text-2xl font-bold font-mono text-white mt-2">
                {summary.breakEvenTickets.toLocaleString('pt-BR')} Ingressos
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Receita mínima necessária: <span className="font-mono font-bold text-amber-300">{formatBRL(summary.breakEvenRevenue)}</span>
              </p>
              <div className="mt-2 text-[11px] font-mono text-slate-400">
                Ingressos vendidos até agora: {event.soldTickets.toLocaleString('pt-BR')} (
                {Math.round((event.soldTickets / (summary.breakEvenTickets || 1)) * 100)}% da meta de break-even)
              </div>
            </div>

          </div>

          {/* DRE DETALHADO (DEMONSTRATIVO DO RESULTADO DO EVENTO) */}
          <div className="bg-[#141417] border border-white/[0.08] rounded-[4px] p-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Demonstrativo de Resultados do Exercício (DRE Operacional)
            </h3>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between p-2 rounded-[2px] bg-white/[0.02]">
                <span className="font-bold text-white">(+) RECEITA BRUTA OPERACIONAL</span>
                <span className="font-bold text-white">{formatBRL(summary.totalGrossRevenue)}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-[2px] bg-white/[0.01] pl-6 text-slate-400">
                <span>(-) Deduções de Plataforma e Gateways (10% médio)</span>
                <span className="text-amber-400">-{formatBRL(summary.totalPlatformFees)}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-[2px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold">
                <span>(=) RECEITA LÍQUIDA REALIZADA</span>
                <span>{formatBRL(summary.totalNetRevenue)}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-[2px] bg-white/[0.01] pl-6 text-slate-400">
                <span>(-) Custos Artísticos & Cachês de Atrações</span>
                <span className="text-rose-400">
                  -{formatBRL(costs.filter(c => c.category.includes('Artístico')).reduce((a, b) => a + (b.actualAmount || 0), 0))}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-[2px] bg-white/[0.01] pl-6 text-slate-400">
                <span>(-) Custos de Estrutura, Palco, Luz & Som</span>
                <span className="text-rose-400">
                  -{formatBRL(costs.filter(c => c.category.includes('Estrutura')).reduce((a, b) => a + (b.actualAmount || 0), 0))}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-[2px] bg-white/[0.01] pl-6 text-slate-400">
                <span>(-) Custos de Tráfego Pago & Marketing</span>
                <span className="text-rose-400">
                  -{formatBRL(costs.filter(c => c.category.includes('Marketing')).reduce((a, b) => a + (b.actualAmount || 0), 0))}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-[2px] bg-white/[0.01] pl-6 text-slate-400">
                <span>(-) Outros Custos (Bar, Segurança, Alvarás, Taxas)</span>
                <span className="text-rose-400">
                  -{formatBRL(costs.filter(c => !c.category.includes('Artístico') && !c.category.includes('Estrutura') && !c.category.includes('Marketing')).reduce((a, b) => a + (b.actualAmount || 0), 0))}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-[2px] bg-rose-500/10 border border-rose-500/20 text-rose-300 font-bold">
                <span>(=) TOTAL DE CUSTOS REALIZADOS</span>
                <span>-{formatBRL(summary.totalActualCost)}</span>
              </div>

              <div className={`flex items-center justify-between p-3 rounded-[3px] border font-bold text-sm ${
                summary.netOperatingProfit >= 0
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-500/20 border-rose-500/40 text-rose-200'
              }`}>
                <span>(=) RESULTADO OPERACIONAL LÍQUIDO FINAL</span>
                <span className="text-base font-extrabold">{formatBRL(summary.netOperatingProfit)}</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: VINCULAR PLANILHA GOOGLE SHEETS */}
      {/* ============================================================== */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#141417] border border-white/[0.1] rounded-[4px] p-6 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2 text-white font-bold">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <span>Vincular Planilha do Google Sheets</span>
              </div>
              <button 
                onClick={() => setIsConnectModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Cole o link ou ID da sua planilha do Google Sheets. O sistema irá ler automaticamente as abas com os nomes 
              <code className="bg-[#1c1c21] px-1.5 py-0.5 rounded text-emerald-300 ml-1">Custos</code> e 
              <code className="bg-[#1c1c21] px-1.5 py-0.5 rounded text-emerald-300 ml-1">Receitas</code> para servir como banco de dados vivo.
            </p>

            <div className="space-y-1.5">
              <label className="label-tech text-slate-300">Link ou ID da Planilha</label>
              <input
                type="text"
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                value={sheetInputUrl}
                onChange={(e) => setSheetInputUrl(e.target.value)}
                className="w-full bg-[#1c1c21] border border-white/[0.1] rounded-[2px] p-2.5 text-xs text-white focus:outline-none focus:border-[#8b5cf6]"
              />
              <span className="text-[10px] text-slate-500 font-mono">
                Exemplo: https://docs.google.com/spreadsheets/d/ID_DA_PLANILHA/edit
              </span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsConnectModalOpen(false)}
                className="btn-v2 btn-v2-outline text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConnectSpreadsheet}
                disabled={isLoading || !sheetInputUrl.trim()}
                className="btn-v2 btn-v2-primary text-xs"
              >
                {isLoading ? 'Conectando...' : 'Conectar Planilha'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: NOVO CUSTO */}
      {/* ============================================================== */}
      {isAddCostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#141417] border border-white/[0.1] rounded-[4px] p-6 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2 text-white font-bold">
                <TrendingDown className="w-5 h-5 text-rose-400" />
                <span>Adicionar Novo Custo / Despesa</span>
              </div>
              <button 
                onClick={() => setIsAddCostModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1 sm:col-span-2">
                <label className="label-tech text-slate-300">Descrição / Item *</label>
                <input
                  type="text"
                  placeholder="Ex: Locação de Gerador 250kVA"
                  value={newCost.description}
                  onChange={(e) => setNewCost({ ...newCost, description: e.target.value })}
                  className="w-full bg-[#1c1c21] border border-white/[0.1] rounded-[2px] p-2 text-white focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>

              <div className="space-y-1">
                <label className="label-tech text-slate-300">Categoria</label>
                <select
                  value={newCost.category}
                  onChange={(e) => setNewCost({ ...newCost, category: e.target.value })}
                  className="w-full bg-[#1c1c21] border border-white/[0.1] rounded-[2px] p-2 text-white font-mono focus:outline-none focus:border-[#8b5cf6]"
                >
                  {COST_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="label-tech text-slate-300">Fornecedor / Prestador</label>
                <input
                  type="text"
                  placeholder="Ex: Impacto Locações"
                  value={newCost.supplier}
                  onChange={(e) => setNewCost({ ...newCost, supplier: e.target.value })}
                  className="w-full bg-[#1c1c21] border border-white/[0.1] rounded-[2px] p-2 text-white focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>

              <div className="space-y-1">
                <label className="label-tech text-slate-300">Valor Orçado (R$)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={newCost.budgetedAmount || ''}
                  onChange={(e) => setNewCost({ ...newCost, budgetedAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#1c1c21] border border-white/[0.1] rounded-[2px] p-2 text-white font-mono focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>

              <div className="space-y-1">
                <label className="label-tech text-slate-300">Valor Realizado (R$)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={newCost.actualAmount || ''}
                  onChange={(e) => setNewCost({ ...newCost, actualAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#1c1c21] border border-white/[0.1] rounded-[2px] p-2 text-white font-mono focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>

              <div className="space-y-1">
                <label className="label-tech text-slate-300">Status do Pagamento</label>
                <select
                  value={newCost.paymentStatus}
                  onChange={(e) => setNewCost({ ...newCost, paymentStatus: e.target.value as any })}
                  className="w-full bg-[#1c1c21] border border-white/[0.1] rounded-[2px] p-2 text-white font-mono focus:outline-none focus:border-[#8b5cf6]"
                >
                  <option value="Pago">Pago</option>
                  <option value="Pendente">Pendente</option>
                  <option value="A Vencer">A Vencer</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="label-tech text-slate-300">Data de Vencimento</label>
                <input
                  type="date"
                  value={newCost.dueDate || ''}
                  onChange={(e) => setNewCost({ ...newCost, dueDate: e.target.value })}
                  className="w-full bg-[#1c1c21] border border-white/[0.1] rounded-[2px] p-2 text-white font-mono focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="label-tech text-slate-300">Observações</label>
                <input
                  type="text"
                  placeholder="Notas, contrato, cláusulas..."
                  value={newCost.notes || ''}
                  onChange={(e) => setNewCost({ ...newCost, notes: e.target.value })}
                  className="w-full bg-[#1c1c21] border border-white/[0.1] rounded-[2px] p-2 text-white focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsAddCostModalOpen(false)}
                className="btn-v2 btn-v2-outline text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddCost}
                disabled={!newCost.description?.trim()}
                className="btn-v2 btn-v2-primary text-xs"
              >
                Salvar Custo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: NOVA RECEITA */}
      {/* ============================================================== */}
      {isAddRevenueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#141417] border border-white/[0.1] rounded-[4px] p-6 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2 text-white font-bold">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span>Adicionar Nova Receita / Faturamento</span>
              </div>
              <button 
                onClick={() => setIsAddRevenueModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1 sm:col-span-2">
                <label className="label-tech text-slate-300">Descrição / Lote *</label>
                <input
                  type="text"
                  placeholder="Ex: Ingressos 3º Lote Pista"
                  value={newRevenue.description}
                  onChange={(e) => setNewRevenue({ ...newRevenue, description: e.target.value })}
                  className="w-full bg-[#1c1c21] border border-white/[0.1] rounded-[2px] p-2 text-white focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>

              <div className="space-y-1">
                <label className="label-tech text-slate-300">Categoria / Tipo</label>
                <select
                  value={newRevenue.category}
                  onChange={(e) => setNewRevenue({ ...newRevenue, category: e.target.value })}
                  className="w-full bg-[#1c1c21] border border-white/[0.1] rounded-[2px] p-2 text-white font-mono focus:outline-none focus:border-[#8b5cf6]"
                >
                  {REVENUE_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="label-tech text-slate-300">Canal de Venda</label>
                <input
                  type="text"
                  placeholder="Ex: Gandaya Ingressos, Bar Balcão"
                  value={newRevenue.channel}
                  onChange={(e) => setNewRevenue({ ...newRevenue, channel: e.target.value })}
                  className="w-full bg-[#1c1c21] border border-white/[0.1] rounded-[2px] p-2 text-white focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>

              <div className="space-y-1">
                <label className="label-tech text-slate-300">Qtd Vendida</label>
                <input
                  type="number"
                  placeholder="0"
                  value={newRevenue.soldQuantity || ''}
                  onChange={(e) => {
                    const qty = parseFloat(e.target.value) || 0;
                    const price = Number(newRevenue.unitPrice) || 0;
                    const gross = qty * price;
                    const fee = Math.round(gross * 0.1);
                    setNewRevenue({ 
                      ...newRevenue, 
                      soldQuantity: qty,
                      grossRevenue: gross,
                      platformFees: fee,
                      netRevenue: gross - fee
                    });
                  }}
                  className="w-full bg-[#1c1c21] border border-white/[0.1] rounded-[2px] p-2 text-white font-mono focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>

              <div className="space-y-1">
                <label className="label-tech text-slate-300">Preço Unitário (R$)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={newRevenue.unitPrice || ''}
                  onChange={(e) => {
                    const price = parseFloat(e.target.value) || 0;
                    const qty = Number(newRevenue.soldQuantity) || 0;
                    const gross = qty * price;
                    const fee = Math.round(gross * 0.1);
                    setNewRevenue({ 
                      ...newRevenue, 
                      unitPrice: price,
                      grossRevenue: gross,
                      platformFees: fee,
                      netRevenue: gross - fee
                    });
                  }}
                  className="w-full bg-[#1c1c21] border border-white/[0.1] rounded-[2px] p-2 text-white font-mono focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>

              <div className="space-y-1">
                <label className="label-tech text-slate-300">Receita Bruta Total (R$)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={newRevenue.grossRevenue || ''}
                  onChange={(e) => setNewRevenue({ ...newRevenue, grossRevenue: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#1c1c21] border border-white/[0.1] rounded-[2px] p-2 text-white font-mono focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>

              <div className="space-y-1">
                <label className="label-tech text-slate-300">Taxas da Plataforma (R$)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={newRevenue.platformFees || ''}
                  onChange={(e) => setNewRevenue({ ...newRevenue, platformFees: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#1c1c21] border border-white/[0.1] rounded-[2px] p-2 text-white font-mono focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>

              <div className="space-y-1">
                <label className="label-tech text-slate-300">Status</label>
                <select
                  value={newRevenue.status}
                  onChange={(e) => setNewRevenue({ ...newRevenue, status: e.target.value as any })}
                  className="w-full bg-[#1c1c21] border border-white/[0.1] rounded-[2px] p-2 text-white font-mono focus:outline-none focus:border-[#8b5cf6]"
                >
                  <option value="Recebido">Recebido</option>
                  <option value="Previsto">Previsto</option>
                  <option value="Parcial">Parcial</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="label-tech text-slate-300">Data</label>
                <input
                  type="date"
                  value={newRevenue.date || ''}
                  onChange={(e) => setNewRevenue({ ...newRevenue, date: e.target.value })}
                  className="w-full bg-[#1c1c21] border border-white/[0.1] rounded-[2px] p-2 text-white font-mono focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsAddRevenueModalOpen(false)}
                className="btn-v2 btn-v2-outline text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddRevenue}
                disabled={!newRevenue.description?.trim()}
                className="btn-v2 btn-v2-primary text-xs"
              >
                Salvar Receita
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
