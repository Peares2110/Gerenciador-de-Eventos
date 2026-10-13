import React, { useState } from 'react';
import { 
  X, 
  Video, 
  Sparkles, 
  Copy, 
  Check, 
  Zap, 
  Clock, 
  Radio, 
  Flame, 
  Layers, 
  ArrowRight, 
  TrendingUp, 
  Share2, 
  Eye, 
  Camera, 
  Music, 
  MessageSquare
} from 'lucide-react';
import { ReelPlan, EventData } from '../types';

interface ReelScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventData;
  initialReel?: ReelPlan | null;
  selectedDate?: string;
  onSaveToCalendar?: (reel: ReelPlan) => void;
}

export const ReelScriptModal: React.FC<ReelScriptModalProps> = ({
  isOpen,
  onClose,
  event,
  initialReel,
  selectedDate,
  onSaveToCalendar
}) => {
  const [trendFormat, setTrendFormat] = useState<string>(
    initialReel?.trendFormat || 'POV'
  );
  const [objective, setObjective] = useState<string>(
    `Virada de Lote (${event.currentLote})`
  );
  const [customAngle, setCustomAngle] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Active script state
  const [scriptData, setScriptData] = useState<ReelPlan>(
    initialReel || {
      id: `reel-${Date.now()}`,
      title: `POV do Amigo na Virada de Lote de ${event.name}`,
      trendFormat: 'POV',
      trendReference: 'Trend POV: "Quando você percebe que o lote virou e seus amigos não compraram"',
      duration: '18s',
      scheduledTime: event.audience?.peakEngagementHours?.[2] || '21:15',
      hook3s: 'POV cômico de susto ao abrir o site e ver o preço subindo',
      hookVisual: 'Segundo 0 a 1.5s: Olhar congelado para a tela do celular, zoom dramático e som de efeito sonoro de coração acelerado.',
      hookVerbal: 'TEXTO NA TELA: "POV: São 23:58 e seu amigo ainda não mandou o Pix do ingresso."',
      storytelling: 'Do segundo 3 ao 11: Gravação em primeira pessoa no grupo de WhatsApp mandando áudio: "Gente, o lote vira em 2 minutos!". Corta para flashs rápidos de como a festa vai ser épica com todo mundo junto.',
      climaxDrop: 'No segundo 12: 00:00 no relógio digital. O amigo compra no último segundo e entra o refrão mais hypado do evento com todo mundo comemorando.',
      callToAction: 'Marca aqui o amigo que sempre deixa pra comprar na última hora!',
      audioVibe: `Trending áudio de ${event.genre} com transição para drop de alta energia`,
      pace: 'Cortes rápidos no compasso da música (a cada 0.9s)',
      technicalDirection: 'Câmera na mão na vertical 9:16 em 60fps estilo casual sem tripé. Legendas dinâmicas no centro da tela.',
      captionSnippet: `Quem nunca viveu esse desespero? 😂 Não dê mole: o ${event.currentLote} de ${event.name} encerra hoje. Link com desconto exclusivo na bio antes da virada! 🏃💨 #${event.name.toLowerCase().replace(/[^a-z0-9]/g, '')} #viral #festassp #viradadelote`,
      status: 'Aprovado'
    }
  );

  if (!isOpen) return null;

  const handleGenerateScript = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/agent/reels-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          trendFormat,
          objective,
          customAngle,
          audienceSegment: `${event.audience?.primaryAge || '18-28 anos'} · Vibe ${event.genre}`
        })
      });
      const data = await res.json();
      if (data.success && data.script) {
        setScriptData({
          ...data.script,
          id: initialReel?.id || `reel-${Date.now()}`,
          scheduledTime: initialReel?.scheduledTime || '21:15',
          status: 'Aprovado'
        });
      }
    } catch (err) {
      console.error('Failed to generate script:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyFormattedScript = () => {
    const formatted = `🎬 ROTEIRO DE REELS VIRAL - ${scriptData.title.toUpperCase()}
📍 Evento: ${event.name} (${event.venue} - ${event.city})
🔥 Trend Viral: ${scriptData.trendFormat} | "${scriptData.trendReference || '-'}"
⏱️ Duração: ${scriptData.duration} | Horário de Pico: ${scriptData.scheduledTime}

--------------------------------------------------
1️⃣ GANCHO (0–3 SEGUNDOS - PARAR O SCROLL):
• Gancho Visual: ${scriptData.hookVisual || scriptData.hook3s}
• Gancho Verbal / Texto na Tela: ${scriptData.hookVerbal || '-'}

2️⃣ STORYTELLING & RETENÇÃO (3–15/20s):
${scriptData.storytelling || '-'}

3️⃣ CLÍMAX / PONTO DE VIRADA (DROP):
${scriptData.climaxDrop || '-'}

4️⃣ CALL TO ACTION (CTA & ALGORITMO):
👉 ${scriptData.callToAction}

5️⃣ DIREÇÃO TÉCNICA (VIDEOMAKER / CREATOR):
• Trilha / Áudio: ${scriptData.audioVibe}
• Ritmo / Pace: ${scriptData.pace || 'Corte no beat'}
• Instruções de Câmera: ${scriptData.technicalDirection || '-'}

6️⃣ LEGENDA SUGERIDA:
"${scriptData.captionSnippet || '-'}"
--------------------------------------------------`;

    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSave = () => {
    if (onSaveToCalendar) {
      onSaveToCalendar(scriptData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-[#0b0816] border border-purple-900/60 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl shadow-purple-950/80 overflow-hidden my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-purple-950/70 bg-[#0d091a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-900/40 border border-purple-700/50 flex items-center justify-center text-purple-300">
              <Video className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-400">
                  ARQUITETURA DE ROTEIRO VIRAL
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-800/40">
                  Fórmula Moderna: Gancho + Storytelling + Clímax + CTA
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-display font-black text-white">
                Roteirizador de Reels & TikTok para {event.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-purple-950/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Trend & Generation Controls */}
          <div className="bg-[#120d24] p-4 rounded-xl border border-purple-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>IDENTIFICADOR DE TENDÊNCIA & PARAMETRIZAÇÃO:</span>
              </span>
              <span className="text-[11px] text-purple-300 font-mono">
                {event.genre} · {event.currentLote}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium text-[11px]">
                  Formato de Tendência Viral:
                </label>
                <select
                  value={trendFormat}
                  onChange={(e) => setTrendFormat(e.target.value)}
                  className="w-full bg-[#0a0714] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs"
                >
                  <option value="POV">POV (Ponto de Vista / Identificação)</option>
                  <option value="Drop Sincronizado">Drop Sincronizado (Corte no Beat)</option>
                  <option value="Expectativa vs Realidade">Expectativa vs Realidade do Rolê</option>
                  <option value="Mini-Vlog / Bastidores">Mini-Vlog / Bastidores do Headliner</option>
                  <option value="Entrevista de Pista">Entrevista Rápida na Fila/Pista</option>
                  <option value="Transição no Beat">Transição de Look / Make no Beat</option>
                  <option value="Desafio de Squad">Desafio de Squad / Amigos</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium text-[11px]">
                  Objetivo de Conversão:
                </label>
                <select
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="w-full bg-[#0a0714] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs"
                >
                  <option value={`Virada de Lote (${event.currentLote})`}>Virada de Lote & Escassez</option>
                  <option value="Hype de Atração / Lineup">Hype de Atração / Lineup Drop</option>
                  <option value="Prova Social & Nostalgia">Prova Social & Edições Anteriores</option>
                  <option value="Viralização Pura / Topo de Funil">Viralização Pura (Alcance Orgânico)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium text-[11px]">
                  Ângulo Específico / Ideia:
                </label>
                <input
                  type="text"
                  value={customAngle}
                  onChange={(e) => setCustomAngle(e.target.value)}
                  placeholder="Ex: O amigo que nunca manda o Pix..."
                  className="w-full bg-[#0a0714] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={handleGenerateScript}
                disabled={isGenerating}
                className="py-2 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:brightness-110 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-purple-950/60 disabled:opacity-50 transition-all"
              >
                {isGenerating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Calculando Fórmula Viral...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-yellow-300" />
                    <span>Gerar Novo Roteiro com IA</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Script Breakdown - Modern Order */}
          <div className="space-y-4">
            
            {/* Meta Bar: Trend & Title */}
            <div className="bg-[#0e091c] border border-purple-600/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-purple-300">
                  <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/40 font-bold">
                    {scriptData.trendFormat}
                  </span>
                  <span>·</span>
                  <span className="text-slate-400">{scriptData.duration}</span>
                  <span>·</span>
                  <span className="text-purple-400">Pico: {scriptData.scheduledTime}</span>
                </div>
                <h3 className="font-display text-base font-bold text-white mt-1">
                  {scriptData.title}
                </h3>
                {scriptData.trendReference && (
                  <p className="text-xs text-purple-300 mt-0.5">
                    💡 <span className="font-semibold">Trend Viral de Referência:</span> {scriptData.trendReference}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyFormattedScript}
                  className="py-2 px-3 rounded-xl bg-purple-950/80 hover:bg-purple-900/60 text-purple-200 border border-purple-800/50 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-400" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-purple-300" />
                      <span>Copiar Roteiro Formatado</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* STEP 1: GANCHO (0-3s) */}
            <div className="bg-[#0b0816] border border-purple-900/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-purple-950/60 pb-2">
                <span className="font-bold text-white text-xs flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center font-mono text-[10px] font-black border border-purple-500/40">
                    1
                  </span>
                  GANCHO (0 A 3 SEGUNDOS) · QUEBRA DE PADRÃO NO FEED
                </span>
                <span className="text-[10px] font-mono text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/30">
                  Taxa de Retenção Crítica
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-[#120d24] p-3 rounded-lg border border-purple-900/30 space-y-1">
                  <span className="text-[10px] font-bold text-purple-400 uppercase flex items-center gap-1">
                    <Eye className="w-3 h-3 text-purple-400" />
                    Gancho Visual (O que a câmera mostra no 2º zero):
                  </span>
                  <p className="text-slate-200 text-xs leading-relaxed">
                    {scriptData.hookVisual || scriptData.hook3s}
                  </p>
                </div>

                <div className="bg-[#120d24] p-3 rounded-lg border border-purple-900/30 space-y-1">
                  <span className="text-[10px] font-bold text-fuchsia-400 uppercase flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-fuchsia-400" />
                    Gancho Verbal / Texto na Tela (Frase de Impacto):
                  </span>
                  <p className="text-fuchsia-200 font-bold text-xs leading-relaxed bg-[#090613] p-2 rounded border border-fuchsia-950/80 font-mono">
                    "{scriptData.hookVerbal || scriptData.hook3s}"
                  </p>
                </div>
              </div>
            </div>

            {/* STEP 2: STORYTELLING & RETENÇÃO (3-15s) */}
            <div className="bg-[#0b0816] border border-purple-900/50 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-purple-950/60 pb-2">
                <span className="font-bold text-white text-xs flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center font-mono text-[10px] font-black border border-purple-500/40">
                    2
                  </span>
                  STORYTELLING & RETENÇÃO (3 A 15/20 SEGUNDOS)
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Construção da Tensão / Identificação da Tribo
                </span>
              </div>
              <div className="bg-[#120d24] p-3.5 rounded-lg border border-purple-900/30 text-slate-200 leading-relaxed text-xs">
                {scriptData.storytelling || 'Desenvolvimento dinâmico da cena com cortes no compasso da música e forte identificação com o público do evento.'}
              </div>
            </div>

            {/* STEP 3: CLÍMAX / PONTO DE VIRADA (DROP) */}
            <div className="bg-[#0b0816] border border-purple-900/50 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-purple-950/60 pb-2">
                <span className="font-bold text-white text-xs flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center font-mono text-[10px] font-black border border-purple-500/40">
                    3
                  </span>
                  CLÍMAX / PONTO DE VIRADA (O MOMENTO DO DROP)
                </span>
                <span className="text-[10px] font-mono text-yellow-400 flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  Ápice de Energia
                </span>
              </div>
              <div className="bg-[#120d24] p-3.5 rounded-lg border border-yellow-900/30 text-yellow-100 leading-relaxed text-xs">
                {scriptData.climaxDrop || 'Transição explosiva com luzes estroboscópicas e a multidão pulando no ápice do drop.'}
              </div>
            </div>

            {/* STEP 4: CALL TO ACTION (CTA & ALGORITMO) */}
            <div className="bg-[#0b0816] border border-purple-900/50 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-purple-950/60 pb-2">
                <span className="font-bold text-white text-xs flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center font-mono text-[10px] font-black border border-purple-500/40">
                    4
                  </span>
                  CALL TO ACTION (CTA) · GATILHO DE ALGORITMO
                </span>
                <span className="text-[10px] font-mono text-purple-400">
                  Foco: Compartilhamento no Direct & Comentários
                </span>
              </div>
              <div className="bg-[#120d24] p-3.5 rounded-lg border border-purple-900/30 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-950 text-purple-300 flex items-center justify-center shrink-0 border border-purple-800/40">
                  <Share2 className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-white font-semibold text-xs leading-relaxed">
                  {scriptData.callToAction}
                </p>
              </div>
            </div>

            {/* STEP 5: DIREÇÃO TÉCNICA (PARA O VIDEOMAKER) & LEGENDA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Direção Técnica */}
              <div className="bg-[#0b0816] border border-purple-900/50 rounded-xl p-4 space-y-2.5">
                <span className="font-bold text-white text-xs flex items-center gap-1.5 border-b border-purple-950/60 pb-2">
                  <Camera className="w-3.5 h-3.5 text-purple-400" />
                  <span>DIREÇÃO TÉCNICA DE GRAVAÇÃO (VIDEOMAKER):</span>
                </span>
                
                <div className="space-y-2 text-[11px]">
                  <div className="bg-[#120d24] p-2.5 rounded border border-purple-950/60">
                    <span className="text-purple-400 font-semibold block text-[10px]">Trilha Sonora & BPM:</span>
                    <span className="text-slate-200">{scriptData.audioVibe}</span>
                  </div>
                  <div className="bg-[#120d24] p-2.5 rounded border border-purple-950/60">
                    <span className="text-purple-400 font-semibold block text-[10px]">Ritmo & Cortes:</span>
                    <span className="text-slate-200">{scriptData.pace || 'Corte no beat a cada 0.9s'}</span>
                  </div>
                  <div className="bg-[#120d24] p-2.5 rounded border border-purple-950/60">
                    <span className="text-purple-400 font-semibold block text-[10px]">Câmera & Iluminação:</span>
                    <span className="text-slate-200">{scriptData.technicalDirection || 'Gravar em 4K 60fps na vertical 9:16 com lente angular.'}</span>
                  </div>
                </div>
              </div>

              {/* Legenda Pronta com Hashtags */}
              <div className="bg-[#0b0816] border border-purple-900/50 rounded-xl p-4 space-y-2.5">
                <span className="font-bold text-white text-xs flex items-center gap-1.5 border-b border-purple-950/60 pb-2">
                  <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                  <span>LEGENDA SUGERIDA COM HASHTAGS:</span>
                </span>

                <div className="bg-[#120d24] p-3 rounded-lg border border-purple-950/60 h-[155px] overflow-y-auto text-[11px] text-slate-300 leading-relaxed space-y-2">
                  <p>{scriptData.captionSnippet || 'Legenda formatada com hashtags de nicho para alavancar o algoritmo.'}</p>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-purple-950/70 bg-[#0d091a]">
          <div className="text-[11px] text-slate-400">
            {selectedDate ? `Aplicando para a data: ${selectedDate}` : `Sincronizado com ${event.name}`}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="py-2 px-4 rounded-xl hover:bg-purple-950/60 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Fechar
            </button>
            {onSaveToCalendar && (
              <button
                onClick={handleSave}
                className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-950/60 transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Roteiro no Calendário</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
