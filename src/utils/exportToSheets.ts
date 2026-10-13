/**
 * Utility to export tabular data to Google Sheets & CSV formats
 * Ensures full Portuguese character support (UTF-8 with BOM) and Google Sheets instant compatibility.
 */

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const processCell = (val: string | number) => {
    if (val === null || val === undefined) return '""';
    const stringVal = String(val).replace(/"/g, '""');
    return `"${stringVal}"`;
  };

  const csvRows = [
    headers.map(processCell).join(','),
    ...rows.map(row => row.map(processCell).join(','))
  ];

  // UTF-8 BOM (\uFEFF) ensures Excel and Google Sheets render acentos and special characters correctly
  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function copyForGoogleSheets(headers: string[], rows: (string | number)[][]): Promise<boolean> {
  // Tab-Separated Values (TSV) is the exact clipboard protocol used by Google Sheets
  const tsvRows = [
    headers.join('\t'),
    ...rows.map(row => row.map(cell => (cell !== null && cell !== undefined ? String(cell).replace(/\t/g, ' ') : '')).join('\t'))
  ];
  const tsvContent = tsvRows.join('\n');

  return navigator.clipboard.writeText(tsvContent)
    .then(() => true)
    .catch(() => false);
}

export function openInGoogleSheets(title: string, headers: string[], rows: (string | number)[][]) {
  // Copy TSV to clipboard and then open Google Sheets
  copyForGoogleSheets(headers, rows);
  window.open('https://sheets.new', '_blank');
}
