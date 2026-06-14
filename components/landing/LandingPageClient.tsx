'use client';

import dynamic from 'next/dynamic';

const SplineRobot = dynamic(() => import('@/components/landing/SplineRobot'), {
  ssr: false,
  loading: () => <div className="w-full h-full" aria-hidden="true" />,
});

export function LandingPageClient() {
  return (
    <div className="relative z-10 w-full h-full max-w-6xl flex items-center justify-center pointer-events-auto">
      <div className="w-full h-full flex items-center justify-center">
        <SplineRobot />
      </div>
    </div>
  );
}
