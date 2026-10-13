# Plano de Auditoria, Correção e Unificação do Diretor de Arte & Estúdio de Post

Plano abrangente para corrigir o bug de clique/seleção e arrasto no canvas do Estúdio de Engenharia de Post, habilitar edição direta por duplo clique, sincronizar o DNA Visual (paleta e diretrizes) diretamente nas camadas, e auditar/fortalecer a geração de artes e imagens conceituais via IA.

### User Review & Critical Decisions

> [!IMPORTANT]
> Decisões confirmadas pelo usuário na etapa de alinhamento:
> - **Interação do Canvas**: Clique direto seleciona o elemento com caixa delimitadora; duplo clique abre edição de texto imediata no elemento/inspetor.
> - **Melhorias Prioritárias**: Corrigir cliques e seleção, sincronizar a paleta de cores do DNA com o canvas em 1 clique e auditar e consolidar as chamadas de geração por IA.
> - **Integração Visual**: Aba integrada permitindo carregar presets e diretrizes do DNA Visual diretamente nas camadas do canvas e exportar briefings sincronizados.

---

### 1. Overview & Core Concept

- **O que faz**: Transforma o Diretor de Arte numa central unificada de engenharia visual. Corrige a interceptação de eventos no canvas onde o evento `click` borbulhava e desmarcava a camada selecionada instantaneamente, adiciona edição rápida com duplo clique, permite aplicar cores e estilos do DNA do evento diretamente aos elementos gráficos (glow, botões, headlines, badges), e valida a integridade de todas as chamadas de IA.
- **Público-alvo**: Produtores de eventos, diretores de arte, estrategistas de tráfego pago e social media da agência.
- **Valor estratégico**: Garantir manipulação precisa no estilo Photoshop (sem falhas de clique), mantendo 100% da fidelidade à Matriz de 3 Zonas e consistência estética com o DNA do evento em menos de 10 segundos.

---

### 2. User Experience & Visual Design

#### Fluxos de Uso Principais:
1. **Seleção e Transformação Fluida no Canvas**:
   - O usuário clica em qualquer elemento de texto, badge, botão ou forma: o elemento é selecionado instantaneamente com caixa delimitadora roxa e 8 manipuladores de redimensionamento e rotação.
   - O fundo bloqueado não intercepta nem 'rouba' cliques dos elementos superiores.
   - Clicar na área cinza vazia fora dos elementos desseleciona a camada.
2. **Edição Imediata com Duplo Clique**:
   - Duplo clique em qualquer elemento de texto (`text`, `badge`, `button`) foca imediatamente o campo de edição rápida ou ativa modo de edição direta no canvas.
3. **Sincronização de DNA Visual (1-Click Palette Sync)**:
   - Botão de aplicação rápida da paleta oficial do evento (`primary`, `secondary`, `accent`, `glow`) nas camadas ativas, alinhando a tipografia e contraste às regras de 'DO' e 'DON'T'.
4. **Geração e Troca de Fundo com IA**:
   - Gerador conceitual com IA (`/api/agent/generate-conceptual-image`) integrado ao painel de auditoria e propriedades, com fallback robusto para imagens estilizadas de alta densidade sem travar a interface.
5. **Auditoria Geral das Funcionalidades**:
   - Teste de exportação em alta resolução (PNG 1080p), exportação de briefing e alternância de modos e abas.

#### Identidade Visual & Tema:
- **Tema**: Studio Dark Pro (`#090B10` e `#16171c`), acentos em ultravioleta (`#9333EA`, `#A855F7`) e esmeralda para CTAs (`#10B981`).
- **Feedback Tátil**: Contornos delimitadores com cursor contextual (`cursor-move`, `cursor-nwse-resize`, `cursor-grab`).

---

### 3. Key Product Decisions & Trade-Offs

- **Decisão 1: Arquitetura de Eventos do Canvas**:
  - *Abordagem*: Parar a propagação tanto no `mousedown` quanto no `click` em cada elemento de camada (`e.stopPropagation()`). Ignorar elementos de background com `pointer-events-none` se estiverem travados, garantindo que o clique atinja apenas elementos editáveis ou o fundo vazio.
  - *Justificativa*: Elimina o descarte acidental de seleção que ocorria quando o evento de clique subia para o container pai.
- **Decisão 2: Edição por Duplo Clique**:
  - *Abordagem*: Evento `onDoubleClick` no elemento seleciona a camada, muda automaticamente para a aba 'Propriedades' e dá foco instantâneo ao textarea/input do texto.
  - *Justificativa*: Proporciona fluidez comparável ao Figma/Photoshop sem introduzir complexidade desnecessária de edição de texto `contenteditable` em canvas escalado com zoom.
- **Decisão 3: Integração DNA Visual -> Camadas**:
  - *Abordagem*: Adicionar um seletor de Presets do DNA na barra superior e no painel de camadas com botões para 'Aplicar Cores do DNA', 'Injetar Headliners do Evento' e 'Sincronizar Gatilho de Lote'.
  - *Justificativa*: Unifica a inteligência do Diretor de Arte clássico diretamente no editor visual ativo.
- **Decisão 4: Resiliência da Geração IA**:
  - *Abordagem*: Endpoints com suporte ao `@google/genai` e múltiplos fallbacks estruturados (Imagen 3 / Gemini Flash Image / SVG vetorial imersivo).

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DIRETOR DE ARTE & STUDIO                        │
├──────────────────────────────────┬─────────────────────────────────────┤
│   Toolbar & DNA Presets          │   Controle de Abas Integradas       │
│   • Move (V) / Select (M)        │   • Estúdio de Post (Camadas)       │
│   • Novo Texto / Badge / Botão   │   • Manual DNA & Prompts de IA      │
│   • Sincronizar Paleta do DNA    │   • Exportação Google Sheets / PNG  │
└─────────────────┬────────────────┴──────────────────┬──────────────────┘
                  │                                   │
                  ▼                                   ▼
┌──────────────────────────────────┐ ┌───────────────────────────────────┐
│     PhotoshopCanvas (Central)    │ │   Painéis Direitos                │
│ • Camadas com zIndex ordenado    │ │ • Camadas: Visibilidade, Lock, Ordem│
│ • mousedown + click isolados     │ │ • Propriedades: X,Y,W,H, Cor, Fonte│
│ • Bounding Box + 8 Handles       │ │ • Auditoria: Scorecard 3 Zonas    │
│ • Duplo clique -> Edição Rápida  │ │ • Fundo IA: Gerador de Conceito    │
└──────────────────────────────────┘ └───────────────────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│            Servidor Backend (server.ts) & Utilitários                  │
│ • /api/agent/art-director (DNA, Paleta, Regras DO/DON'T)              │
│ • /api/agent/post-engineer (Cálculo 3 Zonas, Heatmap, Scorecard)      │
│ • /api/agent/generate-conceptual-image (IA Imagen 3 / SVG Fallback)   │
│ • canvasRenderer.ts (Exportação HD 1080p sem perda)                   │
└────────────────────────────────────────────────────────────────────────┘
```

#### Mapeamento de Arquivos e Alterações:
1. `src/components/post-studio/PhotoshopCanvas.tsx`:
   - Corrigir propagação de `onClick` e `onMouseDown` nos elementos de camada.
   - Adicionar manipulador `onDoubleClick` para acionar modo de edição de texto.
   - Tratar camadas bloqueadas (como fundo) para não bloquear seleção de camadas adjacentes.
2. `src/components/post-studio/PhotoshopPropertiesPanel.tsx`:
   - Adicionar ref/foco automático no campo de texto quando camada for ativada por duplo clique.
   - Adicionar seletor rápido de cores do DNA do evento (`primary`, `secondary`, `accent`).
3. `src/components/PostEngineeringStudio.tsx`:
   - Adicionar barra rápida de presets do DNA do evento (aplicar paleta, aplicar lineup do evento).
   - Conectar o estado de edição inline e sincronização de cores.
4. `src/components/ArtDirector.tsx`:
   - Integrar os dois modos permitindo transição fluida e carregamento de diretrizes diretamente no editor.
5. `server.ts`:
   - Validar e garantir integridade das rotas `/api/agent/art-director`, `/api/agent/post-engineer` e `/api/agent/generate-conceptual-image`.
