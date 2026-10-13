import React, { useState } from 'react';
import { X, Calendar, MapPin, Users, DollarSign, Palette, Sparkles, Music } from 'lucide-react';
import { EventData } from '../types';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (newEvent: EventData) => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, onEventCreated }) => {
  const [name, setName] = useState('INSONIA');
  const [genre, setGenre] = useState('Funk, Trap e Eletrônica');
  const [city, setCity] = useState('Macaé, RJ');
  const [venue, setVenue] = useState('Espaço Macaé (Orla dos Cavaleiros)');
  const [date, setDate] = useState('2026-10-10');
  const [capacity, setCapacity] = useState<string>('3500');
  const [ticketPrice, setTicketPrice] = useState<string>('80');
  const [adBudget, setAdBudget] = useState<string>('15000');
  const [soldTickets, setSoldTickets] = useState<string>('0');
  const [spentAdBudget, setSpentAdBudget] = useState<string>('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          tagline: '',
          genre: genre.trim() || 'Música & Experiência',
          city: city.trim(),
          venue: venue.trim(),
          date: date || 'A definir',
          capacity: Math.max(0, parseInt(capacity, 10) || 0),
          ticketPriceLote: Math.max(0, parseFloat(ticketPrice) || 0),
          soldTickets: Math.max(0, parseInt(soldTickets, 10) || 0),
          totalAdBudget: Math.max(0, parseFloat(adBudget) || 0),
          spentAdBudget: Math.max(0, parseFloat(spentAdBudget) || 0),
          lineup: [],
          peakEngagementHours: [],
          hourlyMetrics: [],
          calendar: {}
        })
      });

      const data = await res.json();
      if (data.success && data.event) {
        onEventCreated(data.event);
        onClose();
      }
    } catch (err) {
      console.error('Error creating event:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#0b0816] border border-purple-900/60 rounded-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 shadow-2xl shadow-purple-950/50 relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-purple-950/70 pb-3">
          <div>
            <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Novo Evento
            </h3>
            <p className="text-[11px] text-slate-400">
              Cadastre os dados reais do evento. Sem dados simulados.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-purple-950/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Nome do Evento: <span className="text-purple-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: INSOMNIA 2026"
              className="w-full bg-[#120d20] border border-purple-900/40 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Gênero Musical & Estilo: <span className="text-purple-400">*</span>
            </label>
            <input
              type="text"
              required
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="Ex: Funk, Trap, Melodic Techno, Eletrônica..."
              className="w-full bg-[#120d20] border border-purple-900/40 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Data:</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#120d20] border border-purple-900/40 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Cidade / UF:</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: São Paulo, SP"
                className="w-full bg-[#120d20] border border-purple-900/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Local:</label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Ex: Arena Sunset"
                className="w-full bg-[#120d20] border border-purple-900/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Lotação Máxima:</label>
              <input
                type="number"
                min="0"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="Ex: 2500"
                className="w-full bg-[#120d20] border border-purple-900/40 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Preço do Lote Ativo (R$):</label>
              <input
                type="number"
                min="0"
                step="any"
                value={ticketPrice}
                onChange={(e) => setTicketPrice(e.target.value)}
                placeholder="Ex: 120"
                className="w-full bg-[#120d20] border border-purple-900/40 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Ingressos Vendidos até agora:</label>
              <input
                type="number"
                min="0"
                value={soldTickets}
                onChange={(e) => setSoldTickets(e.target.value)}
                placeholder="0"
                className="w-full bg-[#120d20] border border-purple-900/40 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Orçamento de Anúncios (R$):</label>
              <input
                type="number"
                min="0"
                step="any"
                value={adBudget}
                onChange={(e) => setAdBudget(e.target.value)}
                placeholder="Ex: 15000"
                className="w-full bg-[#120d20] border border-purple-900/40 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-purple-950/70">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all cursor-pointer disabled:opacity-40"
            >
              {isSubmitting ? 'Cadastrando...' : 'Cadastrar Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
