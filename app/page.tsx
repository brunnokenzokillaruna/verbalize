'use client';

import { useAuthModal } from '@/components/auth/AuthModalProvider';
import dynamic from 'next/dynamic';
const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-[var(--color-primary)]">
      Carregando 3D...
    </div>
  ),
});
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const { openModal } = useAuthModal();
  const { user, initialized } = useAuthStore();
  const router = useRouter();
  const rafRef = useRef<number>(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const splineObjsRef = useRef<any[]>([]);
  const mouseListenerRef = useRef<((e: MouseEvent) => void) | null>(null);

  /**
   * Called when the Spline scene finishes loading.
   *
   * - Smooth position damping (slow R2D2 movement)
   * - Anti-bowing rotation clamp
   * - Ball rolling driven by MOUSE POSITION (not object velocity, since
   *   the robot stays centered and only the head rotates to follow the cursor)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSplineLoad = useCallback((splineApp: any) => {
    const allObjects = splineApp.getAllObjects();
    splineObjsRef.current = allObjects;

    // Log full hierarchy for debugging
    console.log(
      '[Spline] Scene objects:',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      allObjects.map((o: any) => ({
        name: o.name,
        type: o.type,
        children: o.children?.length ?? 0,
      })),
    );

    // ── Find the ball/body object for rolling ──
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ballObj: any = null;
    for (const obj of allObjects) {
      const n = (obj.name || '').toLowerCase();
      if (n === 'body') {
        ballObj = obj;
        break;
      }
    }
    if (!ballObj) {
      for (const obj of allObjects) {
        const n = (obj.name || '').toLowerCase();
        if (n.includes('ball') || n.includes('body') || n.includes('base') || n.includes('sphere')) {
          ballObj = obj;
          break;
        }
      }
    }

    // Find the deepest renderable child of the ball (the actual mesh)
    // Spline may overwrite rotation on the parent group but not on child meshes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let rollTarget: any = ballObj;
    if (ballObj?.children?.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const findMesh = (obj: any): any => {
        if (obj.children && obj.children.length > 0) {
          for (const child of obj.children) {
            const found = findMesh(child);
            if (found) return found;
          }
        }
        // Return the deepest node with a rotation property
        return obj.rotation ? obj : null;
      };
      rollTarget = findMesh(ballObj) || ballObj;
    }

    console.log('[Spline] Ball:', ballObj?.name, '| Roll target:', rollTarget?.name);

    // ── Mouse tracking for ball rolling ──
    let mouseX = window.innerWidth / 2;
    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
    };
    window.addEventListener('mousemove', onMouseMove);
    mouseListenerRef.current = onMouseMove;

    // ── Smoothed position map ──
    const smoothPos = new Map<
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any,
      { x: number; y: number; z: number }
    >();

    let ballRollAngle = 0;

    // ── Tuning constants ──
    const LERP = 0.02;
    const MAX_TILT = 0.15;
    // Roll speed — lowered to match R2D2's slow movement feel
    const ROLL_SPEED = 0.02;

    // Names of objects that should NOT have position smoothing or rotation clamping
    // These are scene infrastructure — smoothing them breaks camera angle and Look At
    const skipNames = new Set([
      'camera', 'cursor target', 'directional light', 'shape 0',
    ]);

    const loop = () => {
      // Mouse offset: -1 (far left) to +1 (far right)
      const mouseOffset = (mouseX / window.innerWidth - 0.5) * 2;

      for (const obj of splineObjsRef.current) {
        if (!obj) continue;
        const objName = (obj.name || '').toLowerCase();

        // Skip scene infrastructure (camera, lights, cursor target, etc.)
        if (skipNames.has(objName) || objName.startsWith('message') || objName === 'text') {
          continue;
        }

        // ── 1. Smooth position (robot parts only) ──
        if (obj.position) {
          const tx = obj.position.x;
          const ty = obj.position.y;
          const tz = obj.position.z;

          let s = smoothPos.get(obj);
          if (!s) {
            s = { x: tx, y: ty, z: tz };
            smoothPos.set(obj, s);
          }

          s.x += (tx - s.x) * LERP;
          s.y += (ty - s.y) * LERP;
          s.z += (tz - s.z) * LERP;

          obj.position.x = s.x;
          obj.position.y = s.y;
          obj.position.z = s.z;
        }

        // ── 2. Anti-bowing rotation clamp ──
        if (obj.rotation) {
          obj.rotation.x = Math.max(
            -MAX_TILT,
            Math.min(MAX_TILT, obj.rotation.x),
          );
          if (obj !== ballObj && obj !== rollTarget) {
            obj.rotation.z = Math.max(
              -MAX_TILT,
              Math.min(MAX_TILT, obj.rotation.z),
            );
          }
        }
      }

      // ── 3. Roll the ball — mouse-driven, slow speed ──
      // Cursor right → slow clockwise roll. Cursor left → slow counter-clockwise.
      // Cursor centered → ball stops rolling.
      if (rollTarget && rollTarget.rotation) {
        ballRollAngle -= mouseOffset * ROLL_SPEED;
        rollTarget.rotation.z = ballRollAngle;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  }, []);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (initialized && user) {
      router.replace('/dashboard');
    }
  }, [initialized, user, router]);

  // Clean up rAF + mouse listener on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (mouseListenerRef.current) {
        window.removeEventListener('mousemove', mouseListenerRef.current);
      }
    };
  }, []);

  if (!initialized || user) {
    return null;
  }

  return (
    <div
      className="relative min-h-dvh overflow-hidden flex flex-col justify-between"
      style={{
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text-primary)',
      }}
    >
      {/* ── Top Navigation ── */}
      <nav className="relative z-50 flex w-full items-center justify-between px-6 py-6 md:px-12 lg:px-24">
        <div className="flex items-center gap-2 font-display text-xl sm:text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-primary)] to-[#2563eb]">
          <Sparkles size={20} className="text-[var(--color-primary)]" />
          VERBALIZE
        </div>



        <div className="flex items-center gap-4 text-xs sm:text-sm font-semibold tracking-wider">
          <button
            onClick={() => openModal('login')}
            className="hover:opacity-70 transition-opacity uppercase"
          >
            // Entrar
          </button>
          <button
            onClick={() => openModal('signup')}
            className="flex items-center gap-2 rounded-full border px-4 py-2 hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)] transition-all uppercase"
            style={{ borderColor: 'var(--color-border)' }}
          >
            Cadastrar <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      {/* ── Main Content Container ── */}
      <main className="relative flex-1 flex flex-col items-center justify-center w-full max-w-[1600px] mx-auto px-6">
        {/* Background Decorative Blobs */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden="true"
        >
          <div
            className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full blur-[100px] opacity-40 mix-blend-screen"
            style={{ background: 'var(--color-primary-light)' }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full blur-[100px] opacity-30 mix-blend-screen"
            style={{ background: '#3b82f6' }}
          />
        </div>

        {/* ── Title Overlay ── */}
        <div className="relative z-10 w-full flex flex-col items-center justify-center -mt-12 pointer-events-none">
          <h1 className="font-display font-black text-[12vw] leading-[0.85] tracking-tighter text-center uppercase whitespace-nowrap drop-shadow-sm">
            NOVA ERA DE
          </h1>
          <h1 className="font-display font-black text-[15vw] leading-[0.85] tracking-tighter text-center uppercase whitespace-nowrap drop-shadow-md text-[var(--color-primary)] opacity-90 mix-blend-multiply dark:mix-blend-screen">
            APRENDIZADO
          </h1>
        </div>



        {/* ── Spline 3D Model ── */}
        {/* Positioned at the bottom of main so the robot walks on the
            dividing line between the hero text and the logo marquee.
            translateY(50%) pushes it down so it straddles the border. */}
        <div className="absolute inset-x-0 bottom-0 z-50 flex justify-center pointer-events-none">
          <div
            className="relative w-full pointer-events-auto overflow-hidden"
            style={{ height: 'min(55vh, 500px)' }}
          >
            <div
              className="absolute inset-x-0 top-0"
              style={{ height: 'calc(100% + 60px)' }}
            >
              <Spline
                scene="https://prod.spline.design/3-twe8MFxbzP5yA0/scene.splinecode"
                onLoad={handleSplineLoad}
              />
            </div>
          </div>
        </div>
      </main>

      {/* ── Brand Logos Marquee (Bottom) ── */}
      <div
        className="relative z-40 w-full py-8 border-t"
        style={{
          borderColor: 'var(--color-border-subtle)',
          backgroundColor: 'var(--color-bg)',
        }}
      >
        <div className="flex w-full overflow-hidden whitespace-nowrap group">
          <div className="flex animate-marquee items-center gap-16 md:gap-24 px-8 text-xl md:text-3xl font-display font-medium tracking-widest text-[var(--color-text-muted)] opacity-60">
            <span>[ LOGO 1 ]</span>
            <span>[ LOGO 2 ]</span>
            <span>[ LOGO 3 ]</span>
            <span>[ LOGO 4 ]</span>
            <span>[ LOGO 5 ]</span>
            <span>[ LOGO 1 ]</span>
            <span>[ LOGO 2 ]</span>
            <span>[ LOGO 3 ]</span>
            <span>[ LOGO 4 ]</span>
            <span>[ LOGO 5 ]</span>
          </div>
        </div>
      </div>
    </div>
  );
}



