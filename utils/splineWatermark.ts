import type { Application } from '@splinetool/runtime';

const WATERMARK_OBJECT_NAMES = ['SplineWatermark', 'Watermark', 'Logo'];

/** Hides watermark objects baked into the Spline scene file. */
export function hideSplineSceneWatermark(spline: Application): void {
  for (const name of WATERMARK_OBJECT_NAMES) {
    const object = spline.findObjectByName(name);
    if (object) {
      object.visible = false;
    }
  }
}

/** Hides the free-tier "Built with Spline" DOM badge injected by the runtime. */
export function hideSplineDomWatermark(root: ParentNode | null): void {
  if (!root) return;

  root.querySelectorAll('a[href*="spline.design"]').forEach((el) => {
    const target = el.parentElement ?? el;
    target.setAttribute('aria-hidden', 'true');
    (target as HTMLElement).style.cssText =
      'display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;';
  });

  root.querySelectorAll('a, button, div, span, p').forEach((el) => {
    const text = el.textContent?.trim().toLowerCase() ?? '';
    if (!text.includes('built with spline')) return;

    const target = el.closest('a, button, div') ?? el;
    target.setAttribute('aria-hidden', 'true');
    (target as HTMLElement).style.cssText =
      'display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;';
  });
}
