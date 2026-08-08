'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

export type SoundType =
  | 'correct'
  | 'incorrect'
  | 'complete'
  | 'tap'
  | 'perfect'
  | 'combo'
  | 'accent-warning'
  | 'session-end';

export type PlaySoundOptions = {
  /** Combo multiplier for verb drill (1–5). Higher = sharper pitch. */
  comboLevel?: number;
  /** Lower volume — e.g. role-play retry feedback. */
  soft?: boolean;
};

/** Optional metadata when reporting an exercise answer (SFX routing). */
export type ExerciseAnswerMeta = {
  /** Accepted answer that only differs by accents/diacritics. */
  accentOnly?: boolean;
};

export type OnExerciseAnswer = (correct: boolean, meta?: ExerciseAnswerMeta) => void;

const AMBIENT_SOUND_TYPES = new Set<SoundType>(['complete', 'perfect', 'combo', 'session-end']);

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function semitoneMultiplier(semitones: number): number {
  return Math.pow(2, semitones / 12);
}

export function useSoundEffects() {
  const [isMuted, setIsMuted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const savedMute = localStorage.getItem('verbalize_sound_muted');
    if (savedMute !== null) {
      setIsMuted(savedMute === 'true');
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newMuted = !prev;
      localStorage.setItem('verbalize_sound_muted', String(newMuted));
      return newMuted;
    });
  }, []);

  const initAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const play = useCallback((type: SoundType, options?: PlaySoundOptions) => {
    if (isMuted) return;
    if (prefersReducedMotion() && AMBIENT_SOUND_TYPES.has(type)) return;

    const peakGain = options?.soft ? 0.12 : 0.18;

    try {
      const ctx = initAudioContext();
      const now = ctx.currentTime;

      if (type === 'correct') {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        const spacing = 0.07;
        const noteDuration = 0.22;

        notes.forEach((freq, index) => {
          const time = now + index * spacing;

          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, time);

          gainNode.gain.setValueAtTime(0, time);
          gainNode.gain.linearRampToValueAtTime(peakGain, time + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.001, time + noteDuration);

          osc.connect(gainNode);
          gainNode.connect(ctx.destination);

          osc.start(time);
          osc.stop(time + noteDuration);
        });
      } else if (type === 'incorrect') {
        const notes = [261.63, 196.00];
        const spacing = 0.11;
        const noteDuration = 0.25;

        notes.forEach((freq, index) => {
          const time = now + index * spacing;

          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, time);

          gainNode.gain.setValueAtTime(0, time);
          gainNode.gain.linearRampToValueAtTime(peakGain, time + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.001, time + noteDuration);

          osc.connect(gainNode);
          gainNode.connect(ctx.destination);

          osc.start(time);
          osc.stop(time + noteDuration);
        });
      } else if (type === 'complete') {
        const notes = [261.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
        const spacing = 0.07;

        notes.forEach((freq, index) => {
          const time = now + index * spacing;
          const isLast = index === notes.length - 1;
          const noteDuration = isLast ? 1.0 : 0.15;

          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, time);

          gainNode.gain.setValueAtTime(0, time);
          gainNode.gain.linearRampToValueAtTime(0.2, time + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.001, time + noteDuration);

          osc.connect(gainNode);
          gainNode.connect(ctx.destination);

          osc.start(time);
          osc.stop(time + noteDuration);
        });

        const chordTime = now + (notes.length - 2) * spacing;
        const chordNotes = [523.25, 659.25, 783.99, 1046.50];

        chordNotes.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, chordTime);

          gainNode.gain.setValueAtTime(0, chordTime);
          gainNode.gain.linearRampToValueAtTime(0.1, chordTime + 0.05);
          gainNode.gain.exponentialRampToValueAtTime(0.001, chordTime + 1.2);

          osc.connect(gainNode);
          gainNode.connect(ctx.destination);

          osc.start(chordTime);
          osc.stop(chordTime + 1.2);
        });
      } else if (type === 'perfect') {
        const notes = [392.00, 523.25, 659.25, 783.99, 1046.50];
        const spacing = 0.06;

        notes.forEach((freq, index) => {
          const time = now + index * spacing;
          const isLast = index === notes.length - 1;
          const noteDuration = isLast ? 0.7 : 0.12;

          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, time);

          gainNode.gain.setValueAtTime(0, time);
          gainNode.gain.linearRampToValueAtTime(0.22, time + 0.015);
          gainNode.gain.exponentialRampToValueAtTime(0.001, time + noteDuration);

          osc.connect(gainNode);
          gainNode.connect(ctx.destination);

          osc.start(time);
          osc.stop(time + noteDuration);
        });

        const chordTime = now + (notes.length - 1) * spacing;
        [1046.50, 1318.51, 1567.98].forEach((freq) => {
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, chordTime);

          gainNode.gain.setValueAtTime(0, chordTime);
          gainNode.gain.linearRampToValueAtTime(0.12, chordTime + 0.04);
          gainNode.gain.exponentialRampToValueAtTime(0.001, chordTime + 0.85);

          osc.connect(gainNode);
          gainNode.connect(ctx.destination);

          osc.start(chordTime);
          osc.stop(chordTime + 0.85);
        });
      } else if (type === 'combo') {
        const level = Math.min(Math.max(options?.comboLevel ?? 3, 1), 5);
        const pitchMul = semitoneMultiplier(level - 1);
        const baseNotes = [523.25, 659.25, 783.99];
        const spacing = 0.05;
        const noteDuration = 0.14;

        baseNotes.forEach((freq, index) => {
          const time = now + index * spacing;

          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq * pitchMul, time);

          gainNode.gain.setValueAtTime(0, time);
          gainNode.gain.linearRampToValueAtTime(0.16, time + 0.008);
          gainNode.gain.exponentialRampToValueAtTime(0.001, time + noteDuration);

          osc.connect(gainNode);
          gainNode.connect(ctx.destination);

          osc.start(time);
          osc.stop(time + noteDuration);
        });
      } else if (type === 'accent-warning') {
        const freq = 440;
        const spacing = 0.12;
        const noteDuration = 0.18;

        [0, 1].forEach((index) => {
          const time = now + index * spacing;

          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, time);

          gainNode.gain.setValueAtTime(0, time);
          gainNode.gain.linearRampToValueAtTime(0.1, time + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.001, time + noteDuration);

          osc.connect(gainNode);
          gainNode.connect(ctx.destination);

          osc.start(time);
          osc.stop(time + noteDuration);
        });
      } else if (type === 'session-end') {
        const notes = [392.00, 523.25, 659.25];
        const spacing = 0.1;
        const noteDuration = 0.18;

        notes.forEach((freq, index) => {
          const time = now + index * spacing;

          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, time);

          gainNode.gain.setValueAtTime(0, time);
          gainNode.gain.linearRampToValueAtTime(0.16, time + 0.015);
          gainNode.gain.exponentialRampToValueAtTime(0.001, time + noteDuration);

          osc.connect(gainNode);
          gainNode.connect(ctx.destination);

          osc.start(time);
          osc.stop(time + noteDuration);
        });
      } else if (type === 'tap') {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.05);
      }
    } catch (error) {
      console.warn('Failed to play sound effect:', error);
    }
  }, [isMuted]);

  return { play, isMuted, toggleMute };
}
