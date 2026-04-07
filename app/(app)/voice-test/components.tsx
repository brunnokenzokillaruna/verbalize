import { Volume2, Loader2, Square } from 'lucide-react';
import type { VoiceOption } from './data';

export const TYPE_COLORS: Record<string, string> = {
  Studio: 'bg-purple-50 text-purple-700 border-purple-300',
  'Chirp-HD': 'bg-teal-50 text-teal-700 border-teal-300',
  'Chirp3-HD': 'bg-orange-50 text-orange-700 border-orange-300',
};

interface VoiceCardProps {
  voice: VoiceOption;
  isPlaying: boolean;
  isLoading: boolean;
  onPlay: () => void;
  onStop: () => void;
  loadingId: string | null;
}

export function VoiceCard({ voice, isPlaying, isLoading, onPlay, onStop, loadingId }: VoiceCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl p-3.5 shadow-sm border transition-colors ${
        isPlaying
          ? 'border-indigo-400 ring-2 ring-indigo-100'
          : voice.current
            ? 'border-amber-300 bg-amber-50/30'
            : 'border-slate-200'
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => isPlaying ? onStop() : onPlay()}
          disabled={!!loadingId}
          className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
            isPlaying
              ? 'bg-indigo-600 text-white scale-110'
              : isLoading
                ? 'bg-indigo-100 text-indigo-400'
                : 'bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-600 active:scale-95'
          }`}
        >
          {isLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : isPlaying ? (
            <Square size={14} fill="currentColor" />
          ) : (
            <Volume2 size={18} />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-sm text-slate-900">{voice.label}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${TYPE_COLORS[voice.type]}`}>
              {voice.type}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
              voice.gender === 'Feminina'
                ? 'bg-pink-50 text-pink-600 border border-pink-200'
                : 'bg-sky-50 text-sky-600 border border-sky-200'
            }`}>
              {voice.gender}
            </span>
            {voice.current && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 border border-amber-300">
                Atual
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 font-mono truncate">{voice.name}</p>
        </div>
      </div>
    </div>
  );
}

interface DialogueLineCardProps {
  line: { speaker: string; text: string; };
  isActive: boolean;
  isLineLoading: boolean;
  isLinePlaying: boolean;
  loadingId: string | null;
  onPlay: () => void;
}

export function DialogueLineCard({ line, isActive, isLineLoading, isLinePlaying, loadingId, onPlay }: DialogueLineCardProps) {
  const isMarie = line.speaker === 'Marie';

  return (
    <div
      className={`rounded-2xl p-3.5 border transition-all ${
        isActive
          ? isMarie
            ? 'bg-pink-50 border-pink-300 ring-2 ring-pink-100'
            : 'bg-sky-50 border-sky-300 ring-2 ring-sky-100'
          : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
          isMarie
            ? 'bg-pink-100 text-pink-600'
            : 'bg-sky-100 text-sky-600'
        }`}>
          {isMarie ? 'M' : 'P'}
        </div>

        <div className="flex-1 min-w-0">
          <span className={`text-[11px] font-semibold ${
            isMarie ? 'text-pink-500' : 'text-sky-500'
          }`}>
            {line.speaker}
          </span>
          <p className="text-sm text-slate-800 mt-0.5 leading-relaxed">{line.text}</p>
        </div>

        <button
          onClick={onPlay}
          disabled={!!loadingId}
          className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
            isLinePlaying
              ? 'bg-indigo-600 text-white'
              : isLineLoading
                ? 'bg-indigo-100 text-indigo-400'
                : 'bg-slate-100 text-slate-500 hover:bg-indigo-100 hover:text-indigo-600 active:scale-90'
          }`}
        >
          {isLineLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : isLinePlaying ? (
            <Square size={12} fill="currentColor" />
          ) : (
            <Volume2 size={14} />
          )}
        </button>
      </div>
    </div>
  );
}
