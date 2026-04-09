'use client';

import React, { Suspense, useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
});


export default function SplineRobot() {
  const splineRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function onLoad(spline: any) {
    console.log('Spline scene loaded successfully');
    splineRef.current = spline;
    setIsLoaded(true);
    
    const cursor = spline.findObjectByName('Cursor');
    if (cursor) {
      console.log('Cursor object found:', cursor);
      cursor.position.x = 0;
      cursor.position.y = 0;
    } else {
      console.warn('Cursor object NOT found in scene');
    }
  }

  useEffect(() => {
    if (!mounted) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!splineRef.current || !isLoaded) return;
      
      const cursor = splineRef.current.findObjectByName('Cursor');
      if (cursor) {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        const x = (e.clientX - centerX) * 0.8;
        const y = (centerY - e.clientY) * 0.8;
        
        cursor.position.x = x;
        cursor.position.y = y;
      }
    };

    console.log('Attaching mousemove listener');
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      console.log('Removing mousemove listener');
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isLoaded, mounted]);

  if (!mounted) return <div className="w-full h-full bg-transparent" />;


  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden pointer-events-auto">
      {/* ── CLIP CONTAINER ── 
          We make the inner content slightly taller (105%) to push the 
          Spline watermark (which is stuck to the bottom) out of view.
      */}
      <div className="relative w-full h-[105%] -bottom-[5%] pointer-events-auto">
        <Suspense fallback={
          <div className="flex items-center justify-center w-full h-full">
            <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <div className={`w-full h-full transition-all duration-1000 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <Spline
              scene="https://prod.spline.design/Lid0QTY4Wf0IjJ4l/scene.splinecode"
              onLoad={onLoad}
              className="w-full h-full"
            />
          </div>
        </Suspense>
      </div>
      
      {/* Decorative Gradient Overlay to blend the canvas */}
      <div className="absolute inset-x-0 bottom-0 h-40 pointer-events-none bg-gradient-to-t from-[var(--color-bg)] to-transparent z-10" />
      <div className="absolute inset-x-0 top-0 h-40 pointer-events-none bg-gradient-to-b from-[var(--color-bg)] to-transparent z-10" />
    </div>
  );
}




