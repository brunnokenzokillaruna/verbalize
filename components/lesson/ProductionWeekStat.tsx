import { Mic, PenLine, Sparkles, MessageCircle } from 'lucide-react';
import {
  PRODUCTION_WEEKLY_STREAK_THRESHOLD,
  type WeeklyProductionBreakdown,
} from '@/lib/productionStatsHelpers';

type ProductionWeekStatProps = {
  breakdown: WeeklyProductionBreakdown;
};

export function ProductionWeekStat({ breakdown }: ProductionWeekStatProps) {
  const { total, oral, oralEcho, oralSpontaneous, written } = breakdown;
  if (total <= 0) return null;

  const hasStreak = total >= PRODUCTION_WEEKLY_STREAK_THRESHOLD;
  const showOralBreakdown = oral > 0 && (oralEcho > 0 || oralSpontaneous > 0);
  const showWritten = written > 0;

  return (
    <div
      className="w-full max-w-sm rounded-2xl p-4 border border-border border-b-[4px] bg-surface shadow-md animate-slide-up delay-200 flex flex-col gap-3"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Mic size={20} strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
            Produção esta semana
          </p>
          <p className="text-sm font-bold text-text-primary">
            {total} {total === 1 ? 'frase produzida' : 'frases produzidas'}
          </p>
        </div>
      </div>

      {showOralBreakdown && (
        <div className="flex flex-wrap gap-2">
          {oralEcho > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-[rgba(225,29,72,0.08)] text-[#e11d48] border border-[rgba(225,29,72,0.2)]">
              <Mic size={12} />
              {oralEcho} eco
            </span>
          )}
          {oralSpontaneous > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-[rgba(124,58,237,0.08)] text-[#7c3aed] border border-[rgba(124,58,237,0.2)]">
              <MessageCircle size={12} />
              {oralSpontaneous} espontânea{oralSpontaneous === 1 ? '' : 's'}
            </span>
          )}
        </div>
      )}

      {showWritten && (
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-[rgba(13,148,136,0.08)] text-[#0d9488] border border-[rgba(13,148,136,0.2)]">
            <PenLine size={12} />
            {written} {written === 1 ? 'escrita' : 'escritas'}
          </span>
        </div>
      )}

      {hasStreak && (
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 bg-success/10 border border-success/25">
          <Sparkles size={16} className="text-success shrink-0" />
          <p className="text-xs font-bold text-success">
            Meta semanal de produção atingida — continue falando e escrevendo!
          </p>
        </div>
      )}
    </div>
  );
}
