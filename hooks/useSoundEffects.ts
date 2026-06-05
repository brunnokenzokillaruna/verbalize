'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

type SoundType = 'correct' | 'incorrect' | 'complete' | 'tap';

export function useSoundEffects() {
  const [isMuted, setIsMuted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Sync mute state with localStorage on mount
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

  const play = useCallback((type: SoundType) => {
    if (isMuted) return;

    try {
      const ctx = initAudioContext();
      const now = ctx.currentTime;

      if (type === 'correct') {
        // High-pitched ascending arpeggio (cheerful chime style)
        // C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50)
        const notes = [523.25, 659.25, 783.99, 1046.50];
        const spacing = 0.07;
        const noteDuration = 0.22;

        notes.forEach((freq, index) => {
          const time = now + index * spacing;
          
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();

          osc.type = 'triangle'; // triangle wave is warm and retro
          osc.frequency.setValueAtTime(freq, time);

          gainNode.gain.setValueAtTime(0, time);
          gainNode.gain.linearRampToValueAtTime(0.18, time + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.001, time + noteDuration);

          osc.connect(gainNode);
          gainNode.connect(ctx.destination);

          osc.start(time);
          osc.stop(time + noteDuration);
        });
      } else if (type === 'incorrect') {
        // Musical descending interval using triangle wave (matching correct chime timbre)
        // C4 (261.63) -> G3 (196.00)
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
          gainNode.gain.linearRampToValueAtTime(0.18, time + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.001, time + noteDuration);

          osc.connect(gainNode);
          gainNode.connect(ctx.destination);

          osc.start(time);
          osc.stop(time + noteDuration);
        });
      } else if (type === 'complete') {
        // Celebratory triumphant fanfare!
        // Arpeggio: C4 (261.63), G4 (392.00), C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50)
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

        // Add a delayed harmonized C-major chord for final impact
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
      } else if (type === 'tap') {
        // Soft button tap/bubble pop sound
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
