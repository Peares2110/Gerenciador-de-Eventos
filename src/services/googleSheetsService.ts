import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  User 
} from 'firebase/auth';
import { 
  auth, 
  getCachedAccessToken, 
  setCachedAccessToken 
} from './googleCalendarService';
import { 
  FinancialCostItem, 
  FinancialRevenueItem, 
  FinancialSummary, 
  FinancialSheetsConfig 
} from '../types';

export const SHEETS_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/calendar.events'
];

const provider = new GoogleAuthProvider();
SHEETS_SCOPES.forEach((scope) => provider.addScope(scope));

/**
 * Extracts a Google Spreadsheet ID from a link, URL or raw ID.
 */
export function extractSpreadsheetId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  // Regex to match /spreadsheets/d/([a-zA-Z0-9-_]+)
  const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }
  // If it's a raw spreadsheet ID (usually ~44 alphanumeric chars with dashes/underscores)
  if (/^[a-zA-Z0-9-_]{20,60}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

/**
 * Sign in to Google with Sheets scope.
 */
export async function signInWithGoogleSheets(): Promise<{ user: User; accessToken: string }> {
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Não foi possível obter o token de acesso do Google.');
    }
    setCachedAccessToken(credential.accessToken);
    return { user: result.user, accessToken: credential.accessToken };
  } catch (error: any) {
    console.error('Erro na autenticação do Google Sheets:', error);
    throw error;
  }
}

/**
 * Parse currency string (handles Brazilian BRL R$ 1.500,00 or US 1500.00).
 */
export function parseCurrency(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  let str = String(val).trim();
  // Remove 'R$', spaces
  str = str.replace(/^R\$\s*/i, '').replace(/\s+/g, '');
  
  // If it has dot as thousands separator and comma as decimal (Brazilian standard: 1.500,50)
  if (str.includes(',') && str.includes('.')) {
    if (str.indexOf('.') < str.indexOf(',')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    // Only comma: 1500,50
    str = str.replace(',', '.');
  }
  
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format currency to Brazilian Real string.
 */
export function formatBRL(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
}

/**
 * Fetch Google Spreadsheet metadata (title, list of sheet tabs).
 */
export async function getSpreadsheetMetadata(
  spreadsheetId: string, 
  token?: string
): Promise<{ title: string; sheetNames: string[] }> {
  const activeToken = token || getCachedAccessToken();
  if (!activeToken) {
    throw new Error('Nenhum token do Google disponível. Conecte sua conta do Google primeiro.');
  }

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties.title`, {
    headers: {
      Authorization: `Bearer ${activeToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    if (res.status === 401) {
      setCachedAccessToken(null);
      throw new Error('Sessão do Google expirada. Por favor, conecte-se novamente.');
    }
    const errText = await res.text();
    throw new Error(`Erro ao acessar planilha (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const sheetNames = (data.sheets || []).map((s: any) => s.properties?.title || '').filter(Boolean);
  return {
    title: data.properties?.title || 'Planilha Sem Título',
    sheetNames
  };
}

/**
 * Fetch raw values from a sheet range.
 */
export async function readSheetValues(
  spreadsheetId: string, 
  range: string, 
  token?: string
): Promise<any[][]> {
  const activeToken = token || getCachedAccessToken();
  if (!activeToken) {
    throw new Error('Nenhum token do Google disponível.');
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueRenderOption=UNFORMATTED_VALUE`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${activeToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    if (res.status === 401) {
      setCachedAccessToken(null);
      throw new Error('Sessão do Google expirada.');
    }
    const errText = await res.text();
    throw new Error(`Erro ao ler dados da aba "${range}": ${errText}`);
  }

  const data = await res.json();
  return data.values || [];
}

/**
 * Parse rows into Cost Items.
 */
export function parseCostsFromRows(rows: any[][]): FinancialCostItem[] {
  if (!rows || rows.length < 2) return [];

  const headers = rows[0].map(h => String(h || '').trim().toLowerCase());
  
  // Find column indices
  const findCol = (keywords: string[]) => {
    return headers.findIndex(h => keywords.some(k => h.includes(k)));
  };

  const idCol = findCol(['id', 'código', 'codigo']);
  const catCol = findCol(['categoria', 'tipo', 'setor']);
  const descCol = findCol(['descriç', 'descricao', 'item', 'nome', 'detalhe']);
  const suppCol = findCol(['fornecedor', 'prestador', 'empresa', 'favorecido']);
  const budgetCol = findCol(['orçado', 'orcado', 'previsto', 'meta', 'estimado']);
  const actualCol = findCol(['realizado', 'pago', 'valor real', 'gasto', 'valor']);
  const statusCol = findCol(['status', 'situação', 'situacao', 'pagamento']);
  const dueCol = findCol(['vencimento', 'data limite', 'prazo']);
  const paidCol = findCol(['pago em', 'data pagamento', 'data']);
  const notesCol = findCol(['obs', 'notas', 'anotação', 'anotacao']);

  const items: FinancialCostItem[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || row.every(c => c === '' || c === null || c === undefined)) {
      continue;
    }

    const desc = descCol !== -1 ? String(row[descCol] || '') : (row[0] ? String(row[0]) : `Custo #${i}`);
    if (!desc.trim()) continue;

    const id = idCol !== -1 && row[idCol] ? String(row[idCol]) : `cost-${i}-${Date.now()}`;
    const category = catCol !== -1 && row[catCol] ? String(row[catCol]) : 'Geral';
    const supplier = suppCol !== -1 && row[suppCol] ? String(row[suppCol]) : 'A definir';
    
    // Budget & Actual amounts
    let budgeted = budgetCol !== -1 ? parseCurrency(row[budgetCol]) : 0;
    let actual = actualCol !== -1 ? parseCurrency(row[actualCol]) : 0;
    
    // If only one amount column was found and mapped to actual, keep budgeted as same or 0
    if (budgetCol === -1 && actualCol !== -1) {
      budgeted = actual;
    }

    // Status normalization
    let rawStatus = statusCol !== -1 && row[statusCol] ? String(row[statusCol]).trim().toLowerCase() : '';
    let paymentStatus: FinancialCostItem['paymentStatus'] = 'Pendente';
    if (rawStatus.includes('pag') || rawStatus.includes('liquid') || rawStatus === 'ok') {
      paymentStatus = 'Pago';
    } else if (rawStatus.includes('venc') || rawStatus.includes('atras')) {
      paymentStatus = 'A Vencer';
    } else if (rawStatus.includes('canc')) {
      paymentStatus = 'Cancelado';
    } else {
      paymentStatus = actual > 0 ? 'Pago' : 'Pendente';
    }

    const dueDate = dueCol !== -1 && row[dueCol] ? String(row[dueCol]) : undefined;
    const paidAt = paidCol !== -1 && row[paidCol] ? String(row[paidCol]) : undefined;
    const notes = notesCol !== -1 && row[notesCol] ? String(row[notesCol]) : undefined;

    items.push({
      id,
      category,
      description: desc,
      supplier,
      budgetedAmount: budgeted,
      actualAmount: actual,
      paymentStatus,
      dueDate,
      paidAt,
      notes
    });
  }

  return items;
}

/**
 * Parse rows into Revenue Items.
 */
export function parseRevenuesFromRows(rows: any[][]): FinancialRevenueItem[] {
  if (!rows || rows.length < 2) return [];

  const headers = rows[0].map(h => String(h || '').trim().toLowerCase());

  const findCol = (keywords: string[]) => {
    return headers.findIndex(h => keywords.some(k => h.includes(k)));
  };

  const idCol = findCol(['id', 'código', 'codigo']);
  const catCol = findCol(['categoria', 'canal', 'origem', 'tipo']);
  const descCol = findCol(['descriç', 'descricao', 'item', 'lote', 'nome']);
  const channelCol = findCol(['canal', 'plataforma', 'origem', 'gateway']);
  const plannedQtyCol = findCol(['qtd prevista', 'previsto', 'meta ingressos', 'meta qtd']);
  const soldQtyCol = findCol(['qtd vendida', 'vendido', 'ingressos', 'qtd']);
  const unitPriceCol = findCol(['unitário', 'unitario', 'preço', 'preco', 'valor ticket']);
  const grossCol = findCol(['bruta', 'bruto', 'total bruto', 'faturamento']);
  const feeCol = findCol(['taxa', 'comissão', 'comissao', 'deduç', 'deducao']);
  const netCol = findCol(['líquida', 'liquida', 'líquido', 'liquido', 'total líquido']);
  const statusCol = findCol(['status', 'situação', 'situacao']);
  const dateCol = findCol(['data', 'período', 'periodo']);
  const notesCol = findCol(['obs', 'notas', 'anotação']);

  const items: FinancialRevenueItem[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || row.every(c => c === '' || c === null || c === undefined)) {
      continue;
    }

    const desc = descCol !== -1 ? String(row[descCol] || '') : (row[0] ? String(row[0]) : `Receita #${i}`);
    if (!desc.trim()) continue;

    const id = idCol !== -1 && row[idCol] ? String(row[idCol]) : `rev-${i}-${Date.now()}`;
    const category = catCol !== -1 && row[catCol] ? String(row[catCol]) : 'Bilheteria';
    const channel = channelCol !== -1 && row[channelCol] ? String(row[channelCol]) : (catCol !== -1 && row[catCol] ? String(row[catCol]) : 'Venda Direta');

    const plannedQuantity = plannedQtyCol !== -1 ? parseCurrency(row[plannedQtyCol]) : undefined;
    const soldQuantity = soldQtyCol !== -1 ? parseCurrency(row[soldQtyCol]) : undefined;
    const unitPrice = unitPriceCol !== -1 ? parseCurrency(row[unitPriceCol]) : undefined;

    let grossRevenue = grossCol !== -1 ? parseCurrency(row[grossCol]) : 0;
    if (grossRevenue === 0 && soldQuantity && unitPrice) {
      grossRevenue = soldQuantity * unitPrice;
    }

    let platformFees = feeCol !== -1 ? parseCurrency(row[feeCol]) : 0;
    let netRevenue = netCol !== -1 ? parseCurrency(row[netCol]) : 0;
    if (netRevenue === 0 && grossRevenue > 0) {
      netRevenue = Math.max(0, grossRevenue - platformFees);
    }

    let rawStatus = statusCol !== -1 && row[statusCol] ? String(row[statusCol]).trim().toLowerCase() : '';
    let status: FinancialRevenueItem['status'] = 'Recebido';
    if (rawStatus.includes('receb') || rawStatus.includes('confirm') || rawStatus === 'ok') {
      status = 'Recebido';
    } else if (rawStatus.includes('parc')) {
      status = 'Parcial';
    } else if (rawStatus.includes('prev') || rawStatus.includes('pend')) {
      status = 'Previsto';
    } else if (rawStatus.includes('inad')) {
      status = 'Inadimplente';
    }

    const date = dateCol !== -1 && row[dateCol] ? String(row[dateCol]) : undefined;
    const notes = notesCol !== -1 && row[notesCol] ? String(row[notesCol]) : undefined;

    items.push({
      id,
      category,
      description: desc,
      channel,
      plannedQuantity,
      soldQuantity,
      unitPrice,
      grossRevenue,
      platformFees,
      netRevenue,
      status,
      date,
      notes
    });
  }

  return items;
}

/**
 * Calculate comprehensive financial indicators.
 */
export function calculateFinancialSummary(
  costs: FinancialCostItem[],
  revenues: FinancialRevenueItem[],
  eventCapacity: number = 3000,
  soldTickets: number = 0
): FinancialSummary {
  const totalBudgetedCost = costs.reduce((acc, c) => acc + (c.budgetedAmount || 0), 0);
  const totalActualCost = costs.reduce((acc, c) => acc + (c.actualAmount || 0), 0);
  const totalPendingCost = costs
    .filter(c => c.paymentStatus !== 'Pago' && c.paymentStatus !== 'Cancelado')
    .reduce((acc, c) => acc + (c.budgetedAmount || c.actualAmount || 0), 0);

  const totalGrossRevenue = revenues.reduce((acc, r) => acc + (r.grossRevenue || 0), 0);
  const totalPlatformFees = revenues.reduce((acc, r) => acc + (r.platformFees || 0), 0);
  const totalNetRevenue = revenues
    .filter(r => r.status === 'Recebido' || r.status === 'Parcial')
    .reduce((acc, r) => acc + (r.netRevenue || 0), 0);

  const projectedNetRevenue = revenues.reduce((acc, r) => acc + (r.netRevenue || 0), 0);

  // Operating Net Profit
  const netOperatingProfit = totalNetRevenue - totalActualCost;

  // Profit Margin %
  const profitMarginPercent = totalNetRevenue > 0 
    ? (netOperatingProfit / totalNetRevenue) * 100 
    : 0;

  // Average ticket price across ticket revenue items
  const ticketRevenues = revenues.filter(r => 
    r.category.toLowerCase().includes('bilheteria') || 
    r.category.toLowerCase().includes('ingresso')
  );
  const totalTicketGross = ticketRevenues.reduce((acc, r) => acc + (r.grossRevenue || 0), 0);
  const totalTicketSold = ticketRevenues.reduce((acc, r) => acc + (r.soldQuantity || 0), 0);
  const avgTicketPrice = totalTicketSold > 0 ? (totalTicketGross / totalTicketSold) : 120; // Default R$ 120 fallback

  // Break-even in Tickets
  const breakEvenRevenue = totalActualCost > 0 ? totalActualCost : totalBudgetedCost;
  const breakEvenTickets = avgTicketPrice > 0 ? Math.ceil(breakEvenRevenue / avgTicketPrice) : 0;

  // General ROI %
  const costBase = totalActualCost > 0 ? totalActualCost : totalBudgetedCost;
  const roiPercent = costBase > 0 ? ((totalNetRevenue - costBase) / costBase) * 100 : 0;

  // Cost per Attendee
  const attendees = soldTickets > 0 ? soldTickets : (eventCapacity > 0 ? eventCapacity : 1);
  const costPerAttendee = costBase / attendees;

  return {
    totalBudgetedCost,
    totalActualCost,
    totalPendingCost,
    totalGrossRevenue,
    totalPlatformFees,
    totalNetRevenue,
    projectedNetRevenue,
    netOperatingProfit,
    profitMarginPercent,
    breakEvenTickets,
    breakEvenRevenue,
    roiPercent,
    costPerAttendee
  };
}

/**
 * Creates a brand-new complete INSOMNIA Financial Template Spreadsheet in Google Drive!
 */
export async function createDefaultFinancialSpreadsheet(
  eventName: string,
  initialCosts: FinancialCostItem[],
  initialRevenues: FinancialRevenueItem[],
  token?: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const activeToken = token || getCachedAccessToken();
  if (!activeToken) {
    throw new Error('Nenhum token do Google disponível. Faça login com o Google.');
  }

  // 1. Create Spreadsheet
  const title = `INSOMNIA EVENT SUITE - Finanças (${eventName || 'Macaé'})`;
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${activeToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title
      },
      sheets: [
        {
          properties: {
            title: 'Custos',
            gridProperties: { rowCount: 100, columnCount: 10 }
          }
        },
        {
          properties: {
            title: 'Receitas',
            gridProperties: { rowCount: 100, columnCount: 12 }
          }
        }
      ]
    })
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Falha ao criar planilha no Google Sheets: ${errText}`);
  }

  const newSheetData = await createRes.json();
  const spreadsheetId = newSheetData.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Prepare headers and initial data for Custos
  const costsHeaders = [
    'ID',
    'Categoria',
    'Descrição / Item',
    'Fornecedor / Prestador',
    'Valor Orçado (R$)',
    'Valor Realizado (R$)',
    'Status do Pagamento',
    'Data de Vencimento',
    'Data de Pagamento',
    'Observações'
  ];

  const costsRows = [
    costsHeaders,
    ...initialCosts.map(c => [
      c.id,
      c.category,
      c.description,
      c.supplier,
      c.budgetedAmount,
      c.actualAmount,
      c.paymentStatus,
      c.dueDate || '',
      c.paidAt || '',
      c.notes || ''
    ])
  ];

  // 3. Prepare headers and initial data for Receitas
  const revenuesHeaders = [
    'ID',
    'Categoria / Canal',
    'Descrição / Lote',
    'Canal / Plataforma',
    'Qtd Prevista',
    'Qtd Vendida',
    'Preço Unitário (R$)',
    'Receita Bruta (R$)',
    'Taxas da Plataforma (R$)',
    'Receita Líquida (R$)',
    'Status de Recebimento',
    'Data de Lançamento',
    'Observações'
  ];

  const revenuesRows = [
    revenuesHeaders,
    ...initialRevenues.map(r => [
      r.id,
      r.category,
      r.description,
      r.channel,
      r.plannedQuantity || '',
      r.soldQuantity || '',
      r.unitPrice || '',
      r.grossRevenue,
      r.platformFees,
      r.netRevenue,
      r.status,
      r.date || '',
      r.notes || ''
    ])
  ];

  // 4. Batch populate values
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${activeToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: [
        {
          range: 'Custos!A1:J' + costsRows.length,
          values: costsRows
        },
        {
          range: 'Receitas!A1:M' + revenuesRows.length,
          values: revenuesRows
        }
      ]
    })
  });

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Append a single cost row directly to Google Sheets.
 */
export async function appendCostRowToSheets(
  spreadsheetId: string,
  sheetName: string,
  item: FinancialCostItem,
  token?: string
): Promise<boolean> {
  const activeToken = token || getCachedAccessToken();
  if (!activeToken) return false;

  const row = [
    item.id,
    item.category,
    item.description,
    item.supplier,
    item.budgetedAmount,
    item.actualAmount,
    item.paymentStatus,
    item.dueDate || '',
    item.paidAt || '',
    item.notes || ''
  ];

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}:append?valueInputOption=USER_ENTERED`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${activeToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [row]
    })
  });

  return res.ok;
}

/**
 * Append a single revenue row directly to Google Sheets.
 */
export async function appendRevenueRowToSheets(
  spreadsheetId: string,
  sheetName: string,
  item: FinancialRevenueItem,
  token?: string
): Promise<boolean> {
  const activeToken = token || getCachedAccessToken();
  if (!activeToken) return false;

  const row = [
    item.id,
    item.category,
    item.description,
    item.channel,
    item.plannedQuantity || '',
    item.soldQuantity || '',
    item.unitPrice || '',
    item.grossRevenue,
    item.platformFees,
    item.netRevenue,
    item.status,
    item.date || '',
    item.notes || ''
  ];

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}:append?valueInputOption=USER_ENTERED`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${activeToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [row]
    })
  });

  return res.ok;
}
