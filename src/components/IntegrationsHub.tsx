import React, { useState } from 'react';
import { 
  Share2, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  RefreshCw, 
  Key, 
  ShieldCheck, 
  Layers, 
  Code2, 
  Lock,
  ArrowRight,
  Sparkles,
  Search,
  Check
} from 'lucide-react';
import { EventData, AdAccountIntegrations } from '../types';

interface IntegrationsHubProps {
  event: EventData;
  onEventUpdated: (updatedEvent: EventData) => void;
}

interface DiscoveredAccount {
  id: string;
  accountId: string;
  name: string;
  currency: string;
  status: string;
  amountSpent?: string;
}

export const IntegrationsHub: React.FC<IntegrationsHubProps> = ({ event, onEventUpdated }) => {
  // Meta Configuration
  const [metaAccountId, setMetaAccountId] = useState(event.integrations?.meta?.adAccountId || '');
  const [metaToken, setMetaToken] = useState(event.integrations?.meta?.accessToken || '');
  const [metaPixelId, setMetaPixelId] = useState(event.integrations?.meta?.pixelId || '');
  const [igAccountId, setIgAccountId] = useState(event.integrations?.meta?.instagramAccountId || '');

  // TikTok Configuration
  const [tiktokAdvertiserId, setTiktokAdvertiserId] = useState(event.integrations?.tiktok?.advertiserId || '');
  const [tiktokToken, setTiktokToken] = useState(event.integrations?.tiktok?.accessToken || '');

  // Google Ads Configuration
  const [googleCustomerId, setGoogleCustomerId] = useState(event.integrations?.google?.customerId || '');
  const [googleDevToken, setGoogleDevToken] = useState(event.integrations?.google?.developerToken || '');

  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredAccounts, setDiscoveredAccounts] = useState<DiscoveredAccount[]>([]);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const handleSaveIntegrations = async () => {
    setIsSaving(true);
    setFeedbackMsg('');

    const integrations: AdAccountIntegrations = {
      meta: {
        connected: Boolean(metaAccountId.trim() && metaToken.trim()),
        adAccountId: metaAccountId.trim(),
        accessToken: metaToken.trim(),
        pixelId: metaPixelId.trim(),
        instagramAccountId: igAccountId.trim(),
        lastSyncedAt: event.integrations?.meta?.lastSyncedAt
      },
      tiktok: {
        connected: Boolean(tiktokAdvertiserId.trim() && tiktokToken.trim()),
        advertiserId: tiktokAdvertiserId.trim(),
        accessToken: tiktokToken.trim(),
        lastSyncedAt: event.integrations?.tiktok?.lastSyncedAt
      },
      google: {
        connected: Boolean(googleCustomerId.trim()),
        customerId: googleCustomerId.trim(),
        developerToken: googleDevToken.trim(),
        lastSyncedAt: event.integrations?.google?.lastSyncedAt
      }
    };

    try {
      const res = await fetch(`/api/events/${event.id}/integrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrations })
      });

      const data = await res.json();
      if (data.success) {
        setFeedbackMsg('Configurações de integração salvas com sucesso!');
        onEventUpdated({
          ...event,
          integrations
        });
      }
    } catch (err) {
      console.error('Error saving integrations:', err);
      setFeedbackMsg('Erro ao salvar integrações.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscoverMetaAccounts = async () => {
    if (!metaToken.trim()) {
      setFeedbackMsg('Insira o Token de Acesso da Meta primeiro para detectar suas contas vinculadas.');
      return;
    }

    setIsDiscovering(true);
    setFeedbackMsg('');
    try {
      const res = await fetch(`/api/events/${event.id}/integrations/meta/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: metaToken.trim(),
          globalScopeId: metaAccountId.trim()
        })
      });

      const data = await res.json();
      if (data.success && data.accounts?.length > 0) {
        setDiscoveredAccounts(data.accounts);
        setFeedbackMsg(`${data.accounts.length} conta(s) de anúncios encontrada(s) com sucesso! Escolha uma abaixo:`);
      } else {
        setFeedbackMsg(data.error || 'Nenhuma conta de anúncios encontrada para esse token/ID.');
      }
    } catch (err: any) {
      setFeedbackMsg(`Erro ao detectar contas: ${err.message}`);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleSyncMetrics = async (platform: 'meta' | 'tiktok' | 'google' | 'all') => {
    setIsSyncing(true);
    setSyncLogs([]);
    setFeedbackMsg('');

    try {
      const res = await fetch(`/api/events/${event.id}/integrations/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform })
      });

      const data = await res.json();
      if (data.logs) {
        setSyncLogs(data.logs);
      }
      if (data.success && data.event) {
        onEventUpdated(data.event);
        setFeedbackMsg('Sincronização de métricas concluída!');
      }
    } catch (err: any) {
      setSyncLogs([`Falha de requisição: ${err.message}`]);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-purple-950/40 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-300 mb-1">
            <Share2 className="w-3.5 h-3.5 text-purple-400" />
            <span>CENTRAL DE INTEGRAÇÕES & APIS OFICIAIS</span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">
            Conexão com Redes de Mídia & Anúncios
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Como conectar Instagram, Meta Ads (Facebook), TikTok Ads e Google Ads para capturar métricas reais e alimentar os agentes.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => handleSyncMetrics('all')}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-md shadow-purple-950/50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Todas as Métricas'}</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-purple-950/40 border border-purple-800/60 rounded-xl text-purple-200 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-purple-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Architecture Explanation Strip */}
      <div className="bg-[#0b0816] border border-purple-950/60 rounded-2xl p-5 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
          <Code2 className="w-4 h-4 text-purple-400" />
          Como Funciona a Arquitetura de Conexão na Prática
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300 leading-relaxed">
          <div className="bg-[#07050d] p-3.5 rounded-xl border border-purple-950/40 space-y-1.5">
            <span className="font-bold text-white block">1. Meta & Instagram API</span>
            <p className="text-slate-400 text-[11px]">
              Suporta tanto o <strong>ID direto com act_</strong> quanto <strong>global_scope_id</strong> ou ID numérico. O sistema resolve automaticamente a conta de anúncios vinculada via Graph API v19.0.
            </p>
          </div>

          <div className="bg-[#07050d] p-3.5 rounded-xl border border-purple-950/40 space-y-1.5">
            <span className="font-bold text-white block">2. TikTok Marketing API</span>
            <p className="text-slate-400 text-[11px]">
              Conecta via <strong>TikTok Business API v1.3</strong> no endpoint de relatórios integrados. Requer o <strong>Advertiser ID</strong> da conta e o <strong>Access Token</strong> gerado no portal de desenvolvedores.
            </p>
          </div>

          <div className="bg-[#07050d] p-3.5 rounded-xl border border-purple-950/40 space-y-1.5">
            <span className="font-bold text-white block">3. Google Ads API</span>
            <p className="text-slate-400 text-[11px]">
              Executa consultas em <strong>Google Ads Query Language (GAQL)</strong> no endpoint <code className="text-purple-300 bg-purple-950/50 px-1 py-0.5 rounded">/customers/{'{id}'}/googleAds:search</code>, consolidando investimento, conversões de ingressos e CPA.
            </p>
          </div>
        </div>
      </div>

      {/* Platform Configuration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PLATFORM 1: Meta Ads & Instagram */}
        <div className="bg-[#0b0816] border border-purple-950/70 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-purple-950/40 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-900/40 border border-purple-700/40 flex items-center justify-center text-purple-300 font-bold text-xs">
                M
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Meta Ads & Instagram Graph API</h3>
                <span className="text-[11px] text-slate-400">Facebook Ads, Instagram Feed, Stories e Reels</span>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              event.integrations?.meta?.connected 
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40' 
                : 'bg-purple-950/60 text-slate-400 border border-purple-900/40'
            }`}>
              {event.integrations?.meta?.connected ? 'Conectado' : 'Não Vinculado'}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Direct Guidance for Business ID */}
            <div className="bg-[#07050d] border border-purple-800/40 rounded-xl p-3.5 space-y-2">
              <span className="font-bold text-purple-300 flex items-center gap-1.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                Como conectar o seu Business ID:
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                O Business ID (como <code className="text-purple-300 font-mono">1281858210723889</code>) identifica sua empresa. Por segurança da Meta, nenhuma API consegue ler anúncios sem um <strong>Token de Acesso</strong> autorizado.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                <a
                  href={`https://business.facebook.com/settings/ad-accounts?business_id=${metaAccountId || '1281858210723889'}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2 rounded-lg bg-[#120d20] hover:bg-[#1a1230] border border-purple-900/50 text-purple-200 transition-colors"
                >
                  <span>1. Ver suas Contas de Anúncio</span>
                  <ExternalLink className="w-3 h-3 text-purple-400" />
                </a>

                <a
                  href="https://developers.facebook.com/tools/explorer/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2 rounded-lg bg-[#120d20] hover:bg-[#1a1230] border border-purple-900/50 text-purple-200 transition-colors"
                >
                  <span>2. Gerar Token no Explorer (1 min)</span>
                  <ExternalLink className="w-3 h-3 text-purple-400" />
                </a>
              </div>
            </div>

            {/* Token Input */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Token de Acesso (Access Token) <span className="text-purple-400">*</span>
              </label>
              <input
                type="password"
                value={metaToken}
                onChange={(e) => setMetaToken(e.target.value)}
                placeholder="Cole seu token que começa com EAAB..."
                className="w-full bg-[#120d20] border border-purple-900/40 rounded-lg px-3 py-2 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Permissões necessárias ao gerar o token: <code className="text-purple-300">ads_read</code> e <code className="text-purple-300">business_management</code>.
              </span>
            </div>

            {/* Ad Account ID or global_scope_id */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-300 font-medium">
                  ID da Conta de Anúncios ou Global Scope ID
                </label>
                <span className="text-[10px] text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/40">
                  Aceita global_scope_id, numérico ou act_
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={metaAccountId}
                  onChange={(e) => setMetaAccountId(e.target.value)}
                  placeholder="Ex: 1022839... ou act_123456789"
                  className="flex-1 bg-[#120d20] border border-purple-900/40 rounded-lg px-3 py-2 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={handleDiscoverMetaAccounts}
                  disabled={isDiscovering || !metaToken.trim()}
                  className="px-3 py-2 rounded-lg bg-[#18112c] hover:bg-[#20163b] border border-purple-800/40 text-purple-300 hover:text-white transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1.5 shrink-0"
                  title="Detectar automaticamente contas de anúncio vinculadas ao seu token ou global_scope_id"
                >
                  <Search className={`w-3.5 h-3.5 ${isDiscovering ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Detectar Contas</span>
                </button>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Se você não souber o prefixo <code className="text-purple-300">act_</code> ou se o seu ID for um <strong>global_scope_id</strong>, clique em <strong>Detectar Contas</strong> para encontrarmos sua conta de anúncios automaticamente!
              </span>
            </div>

            {/* Discovered Accounts Picker */}
            {discoveredAccounts.length > 0 && (
              <div className="bg-[#07050d] border border-purple-800/50 rounded-xl p-3 space-y-2">
                <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Contas de Anúncio Encontradas no Meta Business:
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {discoveredAccounts.map((acc) => (
                    <div 
                      key={acc.id} 
                      className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                        metaAccountId === acc.id
                          ? 'bg-purple-950/60 border-purple-600 text-white'
                          : 'bg-[#120d20] border-purple-950/60 text-slate-300 hover:border-purple-800/60'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-xs truncate text-white">{acc.name}</div>
                        <div className="font-mono text-[10px] text-purple-300">
                          {acc.id} · Moeda: {acc.currency} · Status: {acc.status}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setMetaAccountId(acc.id);
                          setFeedbackMsg(`Conta "${acc.name}" selecionada! Clique em "Salvar Todas as Credenciais".`);
                        }}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                          metaAccountId === acc.id
                            ? 'bg-emerald-600 text-white flex items-center gap-1'
                            : 'bg-purple-600 hover:bg-purple-500 text-white'
                        }`}
                      >
                        {metaAccountId === acc.id ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Selecionada</span>
                          </>
                        ) : (
                          <span>Usar Esta</span>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Pixel ID (Opcional)
                </label>
                <input
                  type="text"
                  value={metaPixelId}
                  onChange={(e) => setMetaPixelId(e.target.value)}
                  placeholder="Ex: 9876543210"
                  className="w-full bg-[#120d20] border border-purple-900/40 rounded-lg px-3 py-2 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Instagram Account ID (Opcional)
                </label>
                <input
                  type="text"
                  value={igAccountId}
                  onChange={(e) => setIgAccountId(e.target.value)}
                  placeholder="Ex: 17841400..."
                  className="w-full bg-[#120d20] border border-purple-900/40 rounded-lg px-3 py-2 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                {event.integrations?.meta?.lastSyncedAt 
                  ? `Último sync: ${new Date(event.integrations.meta.lastSyncedAt).toLocaleString('pt-BR')}`
                  : 'Nenhum sync efetuado'}
              </span>
              <button
                type="button"
                onClick={() => handleSyncMetrics('meta')}
                disabled={isSyncing || !metaAccountId.trim() || !metaToken.trim()}
                className="px-3 py-1.5 rounded-lg bg-[#18112c] hover:bg-[#20163b] border border-purple-800/40 text-purple-300 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
              >
                Testar & Puxar Meta Ads
              </button>
            </div>
          </div>
        </div>

        {/* PLATFORM 2: TikTok Ads */}
        <div className="bg-[#0b0816] border border-purple-950/70 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-purple-950/40 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-900/40 border border-purple-700/40 flex items-center justify-center text-purple-300 font-bold text-xs">
                TK
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">TikTok for Business (TikTok Ads)</h3>
                <span className="text-[11px] text-slate-400">Anúncios no feed e Spark Ads</span>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              event.integrations?.tiktok?.connected 
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40' 
                : 'bg-purple-950/60 text-slate-400 border border-purple-900/40'
            }`}>
              {event.integrations?.tiktok?.connected ? 'Conectado' : 'Não Vinculado'}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Advertiser ID (TikTok Ads)
              </label>
              <input
                type="text"
                value={tiktokAdvertiserId}
                onChange={(e) => setTiktokAdvertiserId(e.target.value)}
                placeholder="Ex: 7012345678901234567"
                className="w-full bg-[#120d20] border border-purple-900/40 rounded-lg px-3 py-2 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Access Token da Marketing API
              </label>
              <input
                type="password"
                value={tiktokToken}
                onChange={(e) => setTiktokToken(e.target.value)}
                placeholder="act.abcdef123456..."
                className="w-full bg-[#120d20] border border-purple-900/40 rounded-lg px-3 py-2 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="p-3 bg-[#07050d] rounded-xl border border-purple-950/40 text-[11px] text-slate-400 space-y-1">
              <span className="font-semibold text-slate-300 block">Como obter o token do TikTok:</span>
              <p>Acesse business-api.tiktok.com &gt; Crie um App &gt; Gere o Long-Lived Token com escopo ad.read.</p>
            </div>
          </div>
        </div>

        {/* PLATFORM 3: Google Ads */}
        <div className="bg-[#0b0816] border border-purple-950/70 rounded-2xl p-5 space-y-4 shadow-xl lg:col-span-2">
          <div className="flex items-center justify-between border-b border-purple-950/40 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-900/40 border border-purple-700/40 flex items-center justify-center text-purple-300 font-bold text-xs">
                G
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Google Ads (Search, YouTube & Display)</h3>
                <span className="text-[11px] text-slate-400">Campanhas de busca de ingressos e vídeos no YouTube</span>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              event.integrations?.google?.connected 
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40' 
                : 'bg-purple-950/60 text-slate-400 border border-purple-900/40'
            }`}>
              {event.integrations?.google?.connected ? 'Conectado' : 'Não Vinculado'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Customer ID do Google Ads
              </label>
              <input
                type="text"
                value={googleCustomerId}
                onChange={(e) => setGoogleCustomerId(e.target.value)}
                placeholder="123-456-7890"
                className="w-full bg-[#120d20] border border-purple-900/40 rounded-lg px-3 py-2 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Localizado no topo superior direito da interface do Google Ads.
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Developer Token (Google Cloud Console)
              </label>
              <input
                type="password"
                value={googleDevToken}
                onChange={(e) => setGoogleDevToken(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-[#120d20] border border-purple-900/40 rounded-lg px-3 py-2 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          onClick={handleSaveIntegrations}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-md shadow-purple-950/50"
        >
          {isSaving ? 'Salvando...' : 'Salvar Todas as Credenciais'}
        </button>
      </div>

      {/* Alternative: Manual Data Input & CSV Import (Ideal when API token is unavailable) */}
      <div className="bg-[#0b0816] border border-purple-900/60 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="border-b border-purple-950/40 pb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-300 mb-0.5">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>PLANO B: ATUALIZAÇÃO MANUAL OU IMPORTAÇÃO DE PLANILHA/CSV</span>
          </div>
          <h3 className="font-bold text-sm text-white">
            Sem acesso ao e-mail ou token da Meta agora? Atualize seus números reais aqui
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Você não precisa ficar travado: digite os números reais que você tem hoje ou cole o relatório exportado do Gerenciador de Anúncios para alimentar todos os agentes e dashboards.
          </p>
        </div>

        {/* Tab Switcher between Manual and CSV */}
        <ManualOrCsvUpdater event={event} onEventUpdated={onEventUpdated} />
      </div>

      {/* Sync Log Output */}
      {syncLogs.length > 0 && (
        <div className="bg-[#07050d] border border-purple-950/60 rounded-xl p-4 space-y-2 font-mono text-xs">
          <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block">
            Relatório de Conexão em Tempo Real:
          </span>
          <div className="space-y-1">
            {syncLogs.map((log, i) => (
              <div key={i} className="text-slate-300 flex items-start gap-2">
                <span className="text-purple-400 select-none">▸</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface ManualOrCsvUpdaterProps {
  event: EventData;
  onEventUpdated: (updatedEvent: EventData) => void;
}

const ManualOrCsvUpdater: React.FC<ManualOrCsvUpdaterProps> = ({ event, onEventUpdated }) => {
  const [mode, setMode] = useState<'manual' | 'csv'>('manual');
  
  // Manual fields
  const [soldTickets, setSoldTickets] = useState(String(event.soldTickets || 0));
  const [ticketPriceLote, setTicketPriceLote] = useState(String(event.ticketPriceLote || 0));
  const [currentLote, setCurrentLote] = useState(event.currentLote || 'Lote 1');
  const [capacity, setCapacity] = useState(String(event.capacity || 0));
  const [spentAdBudget, setSpentAdBudget] = useState(String(event.spentAdBudget || 0));
  const [totalAdBudget, setTotalAdBudget] = useState(String(event.totalAdBudget || 0));
  const [impressions, setImpressions] = useState(String(event.impressions || 0));
  const [clicks, setClicks] = useState(String(Math.round(event.impressions * (event.ctr / 100)) || 0));
  const [purchases, setPurchases] = useState(String(event.soldTickets || 0));

  // CSV field
  const [csvText, setCsvText] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const res = await fetch(`/api/events/${event.id}/metrics/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          soldTickets: parseInt(soldTickets, 10) || 0,
          ticketPriceLote: parseFloat(ticketPriceLote) || 0,
          currentLote,
          capacity: parseInt(capacity, 10) || 0,
          spentAdBudget: parseFloat(spentAdBudget) || 0,
          totalAdBudget: parseFloat(totalAdBudget) || 0,
          impressions: parseInt(impressions, 10) || 0,
          clicks: parseInt(clicks, 10) || 0,
          purchases: parseInt(purchases, 10) || 0
        })
      });

      const data = await res.json();
      if (data.success && data.event) {
        onEventUpdated(data.event);
        setMessage('Métricas manuais atualizadas com sucesso! Agentes e gráficos já estão sincronizados com seus números.');
      } else {
        setMessage('Erro ao salvar métricas.');
      }
    } catch (err: any) {
      setMessage(`Erro: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) return;

    setIsSubmitting(true);
    setMessage('');

    try {
      const res = await fetch(`/api/events/${event.id}/metrics/import-csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText: csvText.trim() })
      });

      const data = await res.json();
      if (data.success && data.event) {
        onEventUpdated(data.event);
        setMessage(data.message || 'CSV importado com sucesso!');
        setCsvText('');
      } else {
        setMessage(data.error || 'Erro ao processar CSV.');
      }
    } catch (err: any) {
      setMessage(`Erro: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Segment Selector */}
      <div className="flex items-center gap-2 border-b border-purple-950/40 pb-2">
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            mode === 'manual'
              ? 'bg-purple-600 text-white'
              : 'text-slate-400 hover:text-white bg-[#0e0a1c]'
          }`}
        >
          1. Digitar Números Reais Diretamente
        </button>

        <button
          type="button"
          onClick={() => setMode('csv')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            mode === 'csv'
              ? 'bg-purple-600 text-white'
              : 'text-slate-400 hover:text-white bg-[#0e0a1c]'
          }`}
        >
          2. Colar Exportação CSV do Gerenciador de Anúncios
        </button>
      </div>

      {message && (
        <div className="p-3 bg-purple-950/60 border border-purple-800/60 rounded-xl text-purple-200 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {mode === 'manual' ? (
        <form onSubmit={handleManualSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Lotação Máxima (Capacidade)
              </label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full bg-[#120d20] border border-purple-900/40 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Ingressos Vendidos até o momento
              </label>
              <input
                type="number"
                value={soldTickets}
                onChange={(e) => setSoldTickets(e.target.value)}
                className="w-full bg-[#120d20] border border-purple-900/40 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Preço do Ingresso Ativo (R$)
              </label>
              <input
                type="number"
                step="any"
                value={ticketPriceLote}
                onChange={(e) => setTicketPriceLote(e.target.value)}
                className="w-full bg-[#120d20] border border-purple-900/40 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Gasto em Anúncios até agora (R$)
              </label>
              <input
                type="number"
                step="any"
                value={spentAdBudget}
                onChange={(e) => setSpentAdBudget(e.target.value)}
                className="w-full bg-[#120d20] border border-purple-900/40 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Orçamento Total de Anúncios (R$)
              </label>
              <input
                type="number"
                step="any"
                value={totalAdBudget}
                onChange={(e) => setTotalAdBudget(e.target.value)}
                className="w-full bg-[#120d20] border border-purple-900/40 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Impressões nos Anúncios
              </label>
              <input
                type="number"
                value={impressions}
                onChange={(e) => setImpressions(e.target.value)}
                className="w-full bg-[#120d20] border border-purple-900/40 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Compras de Ingressos via Ads
              </label>
              <input
                type="number"
                value={purchases}
                onChange={(e) => setPurchases(e.target.value)}
                className="w-full bg-[#120d20] border border-purple-900/40 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400">
              O sistema calcula automaticamente o <strong>ROAS</strong> e o <strong>CPA</strong> real com base nesses números.
            </span>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Números Oficiais do Evento'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleCsvImport} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Cole abaixo o texto do CSV exportado do Facebook Ads Manager, TikTok Ads ou Google Ads:
            </label>
            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Data,Nome da Campanha,Valor Usado (BRL),Impressões,Cliques,Compras&#10;2026-10-05,Anúncio Reels Lote 1,350.00,12500,410,14"
              className="w-full bg-[#07050d] border border-purple-900/40 rounded-xl p-3 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Dica: No Gerenciador de Anúncios da Meta, clique em <strong>Exportar &gt; Exportar Dados da Tabela</strong> e cole o conteúdo aqui. O sistema detecta colunas de gasto, impressões, cliques e conversões automaticamente!
            </span>
          </div>

          <div className="flex items-center justify-end pt-1">
            <button
              type="submit"
              disabled={isSubmitting || !csvText.trim()}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Importando e Processando...' : 'Processar e Alimentar Painel com CSV'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
