import React, { useState } from 'react';
import { FileSpreadsheet, Download, Copy, ExternalLink, Check } from 'lucide-react';
import { exportToCSV, copyForGoogleSheets, openInGoogleSheets } from '../utils/exportToSheets';

interface SheetsExportButtonProps {
  filename: string;
  title: string;
  headers: string[];
  rows: (string | number)[][];
  className?: string;
  label?: string;
}

export const SheetsExportButton: React.FC<SheetsExportButtonProps> = ({
  filename,
  title,
  headers,
  rows,
  className = '',
  label = 'Exportar Planilha'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyForGoogleSheets(headers, rows);
    if (success) {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setIsOpen(false);
      }, 1800);
    }
  };

  const handleDownloadCSV = () => {
    exportToCSV(filename, headers, rows);
    setIsOpen(false);
  };

  const handleOpenSheets = () => {
    openInGoogleSheets(title, headers, rows);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl bg-purple-950/60 hover:bg-purple-900/80 text-purple-200 border border-purple-700/50 transition-all shadow-md shadow-purple-950/30 cursor-pointer"
        title="Exportar para Google Sheets ou CSV"
      >
        <FileSpreadsheet className="w-3.5 h-3.5 text-purple-400" />
        <span>{label}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#0f0b1e] border border-purple-900/60 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
            <div className="px-2 py-1.5 border-b border-purple-950/80 text-[11px] font-medium text-purple-300">
              Exportação Descomplicada
            </div>

            <div className="space-y-1 mt-1">
              <button
                onClick={handleOpenSheets}
                className="w-full text-left flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-purple-900/40 text-slate-200 hover:text-white transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Abrir no Google Sheets</span>
                </div>
                <span className="text-[10px] text-purple-400 font-mono">sheets.new</span>
              </button>

              <button
                onClick={handleCopy}
                className="w-full text-left flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-purple-950/50 text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-purple-300" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-purple-400" />
                  )}
                  <span>{copied ? 'Copiado para colar no Sheets!' : 'Copiar formato Sheets (TSV)'}</span>
                </div>
              </button>

              <button
                onClick={handleDownloadCSV}
                className="w-full text-left flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-purple-950/50 text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-3.5 h-3.5 text-purple-400" />
                  <span>Baixar arquivo CSV (.csv)</span>
                </div>
                <span className="text-[10px] text-slate-500">Excel / Sheets</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
