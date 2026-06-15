'use client';

import React, { Suspense, useRef, useState, useEffect, Component, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import type { Application } from '@splinetool/runtime';
import { Sparkles } from 'lucide-react';
import {
  hideSplineDomWatermark,
  hideSplineSceneWatermark,
} from '@/utils/splineWatermark';

const SPLINE_SCENE_URL =
  'https://prod.spline.design/Lid0QTY4Wf0IjJ4l/scene.splinecode';

const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
});

class SplineErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('[SplineRobot] Failed to load scene:', error);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return prefersReducedMotion;
}

function StaticFallback() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 px-6 text-center"
      aria-hidden="true"
    >
      <div
        className="flex h-24 w-24 items-center justify-center rounded-3xl"
        style={{
          backgroundColor: 'var(--color-primary-light)',
          border: '1px solid var(--color-border)',
        }}
      >
        <Sparkles size={40} style={{ color: 'var(--color-primary)' }} />
      </div>
      <p
        className="font-display text-2xl font-bold"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Verbalize
      </p>
    </div>
  );
}

export default function SplineRobot() {
  const splineRef = useRef<Application | null>(null);
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || prefersReducedMotion || loadFailed) return;

    let cancelled = false;

    fetch(SPLINE_SCENE_URL, { method: 'HEAD' })
      .then((res) => {
        if (!cancelled && !res.ok) setLoadFailed(true);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [mounted, prefersReducedMotion, loadFailed]);

  function onLoad(spline: Application) {
    splineRef.current = spline;
    hideSplineSceneWatermark(spline);
    hideSplineDomWatermark(sceneRef.current);
    setIsLoaded(true);

    const cursor = spline.findObjectByName('Cursor');
    if (cursor) {
      cursor.position.x = 0;
      cursor.position.y = 0;
    }
  }

  useEffect(() => {
    if (!mounted || prefersReducedMotion || !isLoaded) return;

    hideSplineDomWatermark(sceneRef.current);
    const observer = new MutationObserver(() => {
      hideSplineDomWatermark(sceneRef.current);
    });

    if (sceneRef.current) {
      observer.observe(sceneRef.current, { childList: true, subtree: true });
    }

    return () => observer.disconnect();
  }, [isLoaded, mounted, prefersReducedMotion]);

  useEffect(() => {
    if (!mounted || prefersReducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!splineRef.current || !isLoaded) return;

      const cursor = splineRef.current.findObjectByName('Cursor');
      if (cursor) {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        cursor.position.x = (e.clientX - centerX) * 0.8;
        cursor.position.y = (centerY - e.clientY) * 0.8;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isLoaded, mounted, prefersReducedMotion]);

  if (!mounted) {
    return <div className="w-full h-full bg-transparent" />;
  }

  if (prefersReducedMotion || loadFailed) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <StaticFallback />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden pointer-events-auto spline-robot-scene">
      <div
        ref={sceneRef}
        className="relative w-full h-[105%] -bottom-[5%] pointer-events-auto"
      >
        <SplineErrorBoundary fallback={<StaticFallback />}>
          <Suspense
            fallback={
              <div className="flex items-center justify-center w-full h-full">
                <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <div
              className={`w-full h-full transition-all duration-1000 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            >
              <Spline
                scene={SPLINE_SCENE_URL}
                onLoad={onLoad}
                className="w-full h-full"
              />
            </div>
          </Suspense>
        </SplineErrorBoundary>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-40 pointer-events-none bg-gradient-to-t from-[var(--color-bg)] to-transparent z-10" />
      <div className="absolute inset-x-0 top-0 h-40 pointer-events-none bg-gradient-to-b from-[var(--color-bg)] to-transparent z-10" />
      <div
        className="absolute bottom-0 right-0 z-20 h-14 w-44 pointer-events-none"
        style={{ backgroundColor: 'var(--color-bg)' }}
        aria-hidden="true"
      />
    </div>
  );
}
