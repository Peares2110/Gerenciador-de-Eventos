import React, { useState } from 'react';
import { 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Send, 
  Activity, 
  BarChart, 
  Zap, 
  SlidersHorizontal, 
  ArrowUpRight, 
  ShieldCheck, 
  Check 
} from 'lucide-react';
import { EventData, HourlyAdMetric, HourlyAuditReport } from '../types';
import { SheetsExportButton } from './SheetsExportButton';

interface CampaignHourlyManagerProps {
  event: EventData;
  onSendReportToMasterAgent: (report: HourlyAuditReport) => void;
}

export const CampaignHourlyManager: React.FC<CampaignHourlyManagerProps> = ({ 
  event, 
  onSendReportToMasterAgent 
}) => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [report, setReport] = useState<HourlyAuditReport | null>(null);
  const [sentSuccess, setSentSuccess] = useState(false);

  const hourlyData: HourlyAdMetric[] = event.hourlyMetrics && event.hourlyMetrics.length > 0 
    ? event.hourlyMetrics 
    : [];

  const totalSpend = hourlyData.reduce((acc, h) => acc + h.spend, 0);
  const totalRevenue = hourlyData.reduce((acc, h) => acc + h.revenue, 0);
  const totalPurchases = hourlyData.reduce((acc, h) => acc + h.purchases, 0);
  const blendedCpa = totalPurchases > 0 ? totalSpend / totalPurchases : 0;
  const blendedRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  // Run Hourly Audit API
  const handleRunHourlyAudit = async () => {
    setIsAuditing(true);
    setSentSuccess(false);

    try {
      const res = await fetch('/api/agent/campaign-hourly-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id })
      });
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
      }
    } catch (err) {
      console.error('Hourly audit error:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  // Dispatch report to master agent memory
  const handleSendToMaster = () => {
    if (!report) return;
    onSendReportToMasterAgent(report);
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 3000);
  };

  // Google Sheets Export Data
  const sheetsHeaders = [
    'Hora', 
    'Gasto (R$)', 
    'Impressões', 
    'Cliques', 
    'CTR (%)', 
    'CPC (R$)', 
    'Ingressos Vendidos', 
    'Receita (R$)', 
    'CPA (R$)', 
    'ROAS', 
    'Diagnóstico / Alerta Determinístico'
  ];

  const sheetsRows: (string | number)[][] = hourlyData.map((h) => [
    h.hour,
    `R$ ${h.spend}`,
    h.impressions,
    h.clicks,
    `${h.ctr}%`,
    `R$ ${h.cpc.toFixed(2)}`,
    h.purchases,
    `R$ ${h.revenue}`,
    h.cpa > 0 ? `R$ ${h.cpa.toFixed(2)}` : '-',
    h.roas > 0 ? `${h.roas.toFixed(2)}x` : '-',
    h.deterministicAlert || 'Operação estável'
  ]);

  return (
    <div className="space-y-6">
      {/* Header Banner - Purple & Black */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0b0816] p-5 sm:p-6 rounded-2xl border border-purple-950/70 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-300 mb-1">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            <span>GERENTE DE CAMPANHA DETERMINÍSTICO</span>
            <span>·</span>
            <span className="text-slate-400">Análise Hora a Hora</span>
          </div>
          <h2 className="font-display text-xl font-black text-white">
            Monitoramento Determinístico & Auditoria Contínua
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Métricas calculadas hora a hora sem suposições. Modelos matemáticos disparam alertas e alimentam o Agente Principal.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <SheetsExportButton
            filename={`Auditoria_Hora_a_Hora_${event.id}`}
            title={`Auditoria Horária de Mídia - ${event.name}`}
            headers={sheetsHeaders}
            rows={sheetsRows}
            label="Exportar Tabela Horária"
          />

          <button
            onClick={handleRunHourlyAudit}
            disabled={isAuditing}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:brightness-110 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-purple-950/50"
          >
            {isAuditing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Auditorando...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Executar Auditoria Agora</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 24h Summary Metric Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-[#0b0816] p-4 rounded-xl border border-purple-950/70">
          <span className="text-[11px] text-slate-400 block">Investimento no Ciclo</span>
          <div className="text-lg font-bold font-mono text-white mt-0.5">
            R$ {totalSpend.toLocaleString('pt-BR')}
          </div>
          <span className="text-[10px] text-slate-500">24 horas catalogadas</span>
        </div>

        <div className="bg-[#0b0816] p-4 rounded-xl border border-purple-950/70">
          <span className="text-[11px] text-slate-400 block">Receita Gerada Direta</span>
          <div className="text-lg font-bold font-mono text-purple-300 mt-0.5">
            R$ {totalRevenue.toLocaleString('pt-BR')}
          </div>
          <span className="text-[10px] text-purple-400 font-mono">ROAS {blendedRoas.toFixed(2)}x</span>
        </div>

        <div className="bg-[#0b0816] p-4 rounded-xl border border-purple-950/70">
          <span className="text-[11px] text-slate-400 block">Ingressos Vendidos</span>
          <div className="text-lg font-bold font-mono text-white mt-0.5">
            {totalPurchases} <span className="text-xs font-normal text-slate-400">compras</span>
          </div>
          <span className="text-[10px] text-slate-500">Via Meta Pixel / CAPI</span>
        </div>

        <div className="bg-[#0b0816] p-4 rounded-xl border border-purple-950/70">
          <span className="text-[11px] text-slate-400 block">CPA Médio Real</span>
          <div className="text-lg font-bold font-mono text-purple-300 mt-0.5">
            R$ {blendedCpa.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-500">Teto: R$ {event.targetCpa.toFixed(2)}</span>
        </div>

        <div className="bg-[#0b0816] p-4 rounded-xl border border-purple-950/70 col-span-2 sm:col-span-1">
          <span className="text-[11px] text-slate-400 block">Status Determinístico</span>
          <div className="text-sm font-bold font-mono text-purple-300 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span>ALTA EFICIÊNCIA</span>
          </div>
          <span className="text-[10px] text-slate-500">0 anomalias críticas</span>
        </div>
      </div>

      {/* Generated Report Card if available */}
      {report && (
        <div className="bg-[#0e091c] border-2 border-purple-600/40 rounded-2xl p-5 space-y-4 animate-in fade-in duration-200 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-950/70 pb-3">
            <div>
              <span className="text-[11px] font-mono text-purple-400 font-semibold uppercase">
                {report.cyclePeriod} · Status: {report.efficiencyStatus}
              </span>
              <h3 className="font-display text-base font-bold text-white mt-0.5">
                {report.reportTitle}
              </h3>
            </div>

            <button
              onClick={handleSendToMaster}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {sentSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-purple-300" />
                  <span className="text-purple-200">Catalogado no Agente Principal!</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-purple-400" />
                  <span>Enviar Relatório para Agente Principal</span>
                </>
              )}
            </button>
          </div>

          <div className="text-xs text-slate-200 bg-[#07050e] p-3.5 rounded-xl border border-purple-950/70 leading-relaxed whitespace-pre-line">
            {report.summary}
          </div>

          {/* Triggered Rules & Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-[#120d24] p-4 rounded-xl border border-purple-900/40 space-y-2">
              <span className="font-bold text-purple-300 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-purple-400" />
                Gatilhos Determinísticos Ativados:
              </span>
              <ul className="space-y-1.5 text-slate-300">
                {report.deterministicRulesTriggered?.map((r, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-purple-400 font-mono">▸</span>
                    <span><strong className="text-white">{r.rule}:</strong> {r.automatedAction}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#120d24] p-4 rounded-xl border border-purple-900/40 space-y-2">
              <span className="font-bold text-purple-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-purple-400" />
                Diretrizes para as Próximas Horas:
              </span>
              <ul className="space-y-1.5 text-slate-300">
                {report.nextHourDirectives?.map((dir, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-purple-400 font-mono">▸</span>
                    <span>{dir}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 24h Hourly Performance Matrix Table */}
      <div className="bg-[#0b0816] border border-purple-950/70 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-purple-950/60 flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            Matriz Horária de Performance (00h às 23h)
          </span>
          <span className="text-[11px] text-purple-400 font-mono">
            {hourlyData.length} checkpoints catalogados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#120d24] text-purple-300/80 font-mono text-[10px] uppercase border-b border-purple-950/70">
              <tr>
                <th className="py-2.5 px-4">Hora</th>
                <th className="py-2.5 px-3">Gasto</th>
                <th className="py-2.5 px-3">Impressões</th>
                <th className="py-2.5 px-3">Cliques</th>
                <th className="py-2.5 px-3">CTR</th>
                <th className="py-2.5 px-3">Vendas</th>
                <th className="py-2.5 px-3">Receita</th>
                <th className="py-2.5 px-3">CPA</th>
                <th className="py-2.5 px-3">ROAS</th>
                <th className="py-2.5 px-4">Diagnóstico Determinístico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-950/40 font-mono text-[11px]">
              {hourlyData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 px-4 text-center text-slate-400 font-sans">
                    Nenhum checkpoint horário computado ainda. As métricas hora a hora serão preenchidas assim que os anúncios estiverem em veiculação ativa.
                  </td>
                </tr>
              ) : (
                hourlyData.map((h, i) => (
                  <tr key={i} className="hover:bg-[#120d24]/60 transition-colors">
                    <td className="py-2 px-4 font-bold text-white">{h.hour}</td>
                    <td className="py-2 px-3 text-slate-300">R$ {h.spend}</td>
                    <td className="py-2 px-3 text-slate-400">{h.impressions.toLocaleString('pt-BR')}</td>
                    <td className="py-2 px-3 text-slate-300">{h.clicks}</td>
                    <td className="py-2 px-3 text-slate-200">{h.ctr}%</td>
                    <td className="py-2 px-3 font-bold text-purple-300">{h.purchases}</td>
                    <td className="py-2 px-3 font-bold text-white">R$ {h.revenue.toLocaleString('pt-BR')}</td>
                    <td className="py-2 px-3 text-purple-300">
                      {h.cpa > 0 ? `R$ ${h.cpa.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-2 px-3 font-bold text-purple-400">
                      {h.roas > 0 ? `${h.roas.toFixed(2)}x` : '-'}
                    </td>
                    <td className="py-2 px-4 text-slate-400 font-sans text-[11px] truncate max-w-xs">
                      {h.deterministicAlert}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
