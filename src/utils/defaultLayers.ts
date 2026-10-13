import { CanvasFormat, PostLayer, FORMAT_DIMENSIONS } from '../types/postStudio';
import { EventData } from '../types';

export function createDefaultLayersForEvent(
  event: EventData,
  format: CanvasFormat,
  postObjective: 'virada_lote' | 'lineup_drop' | 'abertura_vendas' | 'd_day' = 'virada_lote'
): PostLayer[] {
  const dim = FORMAT_DIMENSIONS[format];
  const isStory = format === 'story_9_16';
  const width = dim.width;
  const height = dim.height;

  const lineupNames = (event.lineup || []).map((a) => a.name).join(', ') || 'Dennis DJ, MC Caverinha, Illusionize, KVSH';
  const headliners = lineupNames.split(',').slice(0, 2).join(' + ').toUpperCase() || 'DENNIS + MC CAVERINHA';
  const supportingActs = lineupNames.split(',').slice(2).join(' · ') || 'ILLUSIONIZE · KVSH · DJ GUGA';
  const eventDateVenue = `${event.date || '10 OUT'} · ${event.venue || 'Macaé, RJ'}`.toUpperCase();

  // Zone coordinates
  // Zone 1: Y: 0 to ~35% of height
  // Zone 2: Y: 35% to 75% of height
  // Zone 3: Y: 75% to 100% of height (with bottom safe margin)

  const z1Start = isStory ? 180 : 80;
  const z2Start = isStory ? 750 : 520;
  const z3Start = isStory ? 1420 : 960;

  let mainHookText = 'A VIRADA É HOJE';
  let eyebrowText = 'AVISO IMPORTANTE · VIRADA PROGRAMADA';
  let urgencyText = `RESTAM POUCAS UNIDADES DO ${event.currentLote || '1º LOTE'}`.toUpperCase();

  if (postObjective === 'lineup_drop') {
    mainHookText = 'LINEUP CONFIRMADO';
    eyebrowText = 'ANÚNCIO OFICIAL · EDIÇÃO HISTÓRICA';
    urgencyText = 'CONECTE-SE COM OS MAIORES NOMES DA CENA';
  } else if (postObjective === 'abertura_vendas') {
    mainHookText = 'VENDAS ABERTAS';
    eyebrowText = 'LOTE PROMOCIONAL EXCLUSIVO GANDAYA';
    urgencyText = 'LOTE PROMO LIMITADO · GARANTA O SEU MENOR VALOR';
  } else if (postObjective === 'd_day') {
    mainHookText = 'HOJE É O DIA';
    eyebrowText = 'PORTÕES ABERTOS ÀS 22H';
    urgencyText = 'ÚLTIMOS INGRESSOS NA PORTARIA OU NO APP';
  }

  const layers: PostLayer[] = [
    // 1. Background Image or Dark Gradient
    {
      id: 'layer-bg-canvas',
      name: 'Fundo Atmosférico',
      type: 'shape',
      zone: 'background',
      x: 0,
      y: 0,
      width: width,
      height: height,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: true,
      zIndex: 1,
      backgroundColor: '#090B10',
      shapeType: 'rectangle',
      strategicRole: 'Contraste de base e atmosfera sombria'
    },

    // 2. Neon Ultraviolet Ambience Glow (Shape)
    {
      id: 'layer-ambient-glow',
      name: 'Glow Ultravioleta (Focal)',
      type: 'shape',
      zone: 'background',
      x: Math.round(width * 0.15),
      y: Math.round(height * 0.22),
      width: Math.round(width * 0.7),
      height: Math.round(height * 0.35),
      rotation: 0,
      opacity: 0.25,
      visible: true,
      locked: true,
      zIndex: 2,
      backgroundColor: '#9333EA',
      borderRadius: Math.round(width * 0.35),
      shapeType: 'rectangle',
      strategicRole: 'Feixe de luz para retenção de olhar'
    },

    // 3. Zone 1 - Eyebrow / Tagline
    {
      id: 'layer-z1-eyebrow',
      name: 'Z1: Eyebrow de Interrupção',
      type: 'badge',
      zone: 'zone1_hook',
      x: Math.round(width * 0.1),
      y: z1Start,
      width: Math.round(width * 0.8),
      height: 44,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: 10,
      content: eyebrowText,
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 18,
      fontWeight: '700',
      color: '#D8B4FE',
      backgroundColor: 'rgba(147, 51, 234, 0.15)',
      borderColor: 'rgba(168, 85, 247, 0.4)',
      borderWidth: 1.5,
      borderRadius: 4,
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: 2,
      strategicRole: 'Comando de parada visual e status'
    },

    // 4. Zone 1 - Main Hook (Headline de Impacto Brutalista)
    {
      id: 'layer-z1-hook-title',
      name: 'Z1: Gancho Principal (Headline)',
      type: 'text',
      zone: 'zone1_hook',
      x: Math.round(width * 0.05),
      y: z1Start + 60,
      width: Math.round(width * 0.9),
      height: isStory ? 160 : 130,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: 11,
      content: mainHookText,
      fontFamily: 'Impact, sans-serif',
      fontSize: isStory ? 84 : 76,
      fontWeight: '900',
      color: '#FFFFFF',
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: 3,
      lineHeight: 1.05,
      shadowColor: 'rgba(147, 51, 234, 0.5)',
      shadowBlur: 25,
      shadowOffsetX: 0,
      shadowOffsetY: 4,
      strategicRole: 'Interrupção imediata de scroll em <300ms'
    },

    // 5. Zone 2 - Selo de Autoridade / Experiência
    {
      id: 'layer-z2-authority-badge',
      name: 'Z2: Selo de Autoridade',
      type: 'badge',
      zone: 'zone2_proof',
      x: Math.round(width * 0.18),
      y: z2Start,
      width: Math.round(width * 0.64),
      height: 38,
      rotation: 0,
      opacity: 0.95,
      visible: true,
      locked: false,
      zIndex: 20,
      content: '⚡ 3 PALCOS · MAIS DE 10 HORAS DE SOM',
      fontFamily: 'Inter, sans-serif',
      fontSize: 17,
      fontWeight: '800',
      color: '#FDE047',
      backgroundColor: 'rgba(234, 179, 8, 0.12)',
      borderColor: 'rgba(234, 179, 8, 0.35)',
      borderWidth: 1,
      borderRadius: 20,
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      strategicRole: 'Prova de valor de entretenimento e densidade'
    },

    // 6. Zone 2 - Headliners Principais (Prova Irrefutável)
    {
      id: 'layer-z2-headliners',
      name: 'Z2: Headliner (Atração Principal)',
      type: 'text',
      zone: 'zone2_proof',
      x: Math.round(width * 0.05),
      y: z2Start + 55,
      width: Math.round(width * 0.9),
      height: isStory ? 140 : 110,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: 21,
      content: headliners,
      fontFamily: 'Oswald, sans-serif',
      fontSize: isStory ? 64 : 56,
      fontWeight: '800',
      color: '#FFFFFF',
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: 2,
      lineHeight: 1.1,
      shadowColor: 'rgba(0,0,0,0.8)',
      shadowBlur: 16,
      strategicRole: 'Âncora de desejo do comprador (atração principal)'
    },

    // 7. Zone 2 - Suportes / Lineup Completo
    {
      id: 'layer-z2-support-acts',
      name: 'Z2: Lineup Suporte',
      type: 'text',
      zone: 'zone2_proof',
      x: Math.round(width * 0.08),
      y: z2Start + (isStory ? 200 : 170),
      width: Math.round(width * 0.84),
      height: 60,
      rotation: 0,
      opacity: 0.9,
      visible: true,
      locked: false,
      zIndex: 22,
      content: supportingActs,
      fontFamily: 'Inter, sans-serif',
      fontSize: 22,
      fontWeight: '700',
      color: '#CBD5E1',
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: 2,
      lineHeight: 1.3,
      strategicRole: 'Complemento de lineup para ampliação de público'
    },

    // 8. Zone 3 - Gatilho de Escassez e Urgência
    {
      id: 'layer-z3-urgency',
      name: 'Z3: Gatilho de Escassez',
      type: 'text',
      zone: 'zone3_cta',
      x: Math.round(width * 0.08),
      y: z3Start,
      width: Math.round(width * 0.84),
      height: 40,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: 30,
      content: urgencyText,
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 20,
      fontWeight: '800',
      color: '#F43F5E',
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      strategicRole: 'Gatilho de urgência psicológica e perda iminente'
    },

    // 9. Zone 3 - Botão de Conversão Direta (CTA)
    {
      id: 'layer-z3-cta-btn',
      name: 'Z3: Botão de Conversão (CTA)',
      type: 'button',
      zone: 'zone3_cta',
      x: Math.round(width * 0.12),
      y: z3Start + 50,
      width: Math.round(width * 0.76),
      height: isStory ? 84 : 74,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: 31,
      content: 'GARANTA SEU INGRESSO NO GANDAYA',
      fontFamily: 'Inter, sans-serif',
      fontSize: isStory ? 28 : 24,
      fontWeight: '900',
      color: '#FFFFFF',
      backgroundColor: '#7C3AED',
      borderColor: '#A78BFA',
      borderWidth: 2,
      borderRadius: 8,
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: 1,
      shadowColor: 'rgba(124, 58, 237, 0.6)',
      shadowBlur: 20,
      shadowOffsetY: 6,
      strategicRole: 'Ponto focal de ação direta e fechamento de compra'
    },

    // 10. Zone 3 - Data & Local do Evento
    {
      id: 'layer-z3-date-venue',
      name: 'Z3: Data e Local do Evento',
      type: 'text',
      zone: 'zone3_cta',
      x: Math.round(width * 0.1),
      y: z3Start + (isStory ? 150 : 135),
      width: Math.round(width * 0.8),
      height: 35,
      rotation: 0,
      opacity: 0.85,
      visible: true,
      locked: false,
      zIndex: 32,
      content: eventDateVenue,
      fontFamily: 'Inter, sans-serif',
      fontSize: 18,
      fontWeight: '600',
      color: '#94A3B8',
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: 2,
      strategicRole: 'Informação indispensável de agenda e ancoragem geográfica'
    }
  ];

  return layers;
}
