'use client';

import { Lock } from 'lucide-react';
import type { LessonTag } from '@/types';
import {
  STAMP_CURRENT_COLOR,
  STAMP_LOCKED_COLOR,
  STAMP_STYLES,
  stampRotation,
  type StampShape,
  type StampStatus,
} from '@/components/dashboard/lessonStampConfig';

type LessonStampProps = {
  tag: LessonTag | string;
  status: StampStatus;
  size?: number;
  lessonNumber?: number;
  seed?: string;
  className?: string;
};

function resolveTag(tag: string): LessonTag {
  return tag in STAMP_STYLES ? (tag as LessonTag) : 'GRAM';
}

function inkColor(status: StampStatus, tagColor: string): string {
  if (status === 'completed') return tagColor;
  if (status === 'current') return STAMP_CURRENT_COLOR;
  return STAMP_LOCKED_COLOR;
}

function outerPath(shape: StampShape): string {
  switch (shape) {
    case 'circle':
      return 'M50 8a42 42 0 1 1 0 84a42 42 0 1 1 0-84z';
    case 'ticket':
      return 'M16 24h68a8 8 0 0 1 8 8v10a9 9 0 0 1 0 18v10a8 8 0 0 1-8 8H16a8 8 0 0 1-8-8V60a9 9 0 0 1 0-18V32a8 8 0 0 1 8-8z';
    case 'oval':
      return 'M50 18c24 0 40 14.3 40 32s-16 32-40 32S10 67.7 10 50 26 18 50 18z';
    case 'shield':
      return 'M50 10l36 12v24c0 22-16 36-36 42-20-6-36-20-36-42V22z';
    case 'roundedRect':
      return 'M20 20h60a14 14 0 0 1 14 14v32a14 14 0 0 1-14 14H20a14 14 0 0 1-14-14V34a14 14 0 0 1 14-14z';
    case 'hexagon':
      return 'M50 10l36 20v40L50 90 14 70V30z';
    case 'lozenge':
      return 'M50 12l38 38-38 38-38-38z';
    case 'arch':
      return 'M22 88V42a28 28 0 0 1 56 0v46z';
    case 'scallop': {
      const cx = 50;
      const cy = 50;
      const r = 38;
      const lobes = 14;
      const parts: string[] = [];
      for (let i = 0; i < lobes; i++) {
        const a0 = (i / lobes) * Math.PI * 2 - Math.PI / 2;
        const a1 = ((i + 0.5) / lobes) * Math.PI * 2 - Math.PI / 2;
        const a2 = ((i + 1) / lobes) * Math.PI * 2 - Math.PI / 2;
        const x0 = cx + Math.cos(a0) * r;
        const y0 = cy + Math.sin(a0) * r;
        const xm = cx + Math.cos(a1) * (r + 4.5);
        const ym = cy + Math.sin(a1) * (r + 4.5);
        const x2 = cx + Math.cos(a2) * r;
        const y2 = cy + Math.sin(a2) * r;
        if (i === 0) parts.push(`M${x0.toFixed(1)} ${y0.toFixed(1)}`);
        parts.push(`Q${xm.toFixed(1)} ${ym.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`);
      }
      return `${parts.join(' ')}z`;
    }
  }
}

function StampGlyph({ tag, color }: { tag: LessonTag; color: string }) {
  const s = {
    fill: 'none' as const,
    stroke: color,
    strokeWidth: 2.4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (tag) {
    case 'GRAM':
      return (
        <g transform="translate(36 38)">
          <path d="M2 4c5-2.5 10-2.5 12 0v20c-2-2-7-2-12 0z" {...s} />
          <path d="M26 4c-5-2.5-10-2.5-12 0v20c2-2 7-2 12 0z" {...s} />
        </g>
      );
    case 'VOC':
      return (
        <g transform="translate(37 39)">
          <rect x="3" y="3" width="20" height="20" rx="2" {...s} />
          <path d="M9 3v20M12 10h8M12 15h6" {...s} />
        </g>
      );
    case 'DIAL':
      return (
        <g transform="translate(36 40)">
          <path d="M4 5h18a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-9l-5 6v-6H4a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3z" {...s} />
        </g>
      );
    case 'MISS':
      return (
        <g transform="translate(37 38)">
          <circle cx="13" cy="13" r="10" {...s} />
          <circle cx="13" cy="13" r="4.5" {...s} />
          <circle cx="13" cy="13" r="1.5" fill={color} stroke="none" />
        </g>
      );
    case 'PRON':
      return (
        <g transform="translate(37 36)">
          <rect x="9" y="2" width="8" height="13" rx="4" {...s} />
          <path d="M5 13a9 9 0 0 0 18 0M13 22v4M9 26h8" {...s} />
        </g>
      );
    case 'VERB':
      return (
        <g transform="translate(37 36)">
          <path d="M8 24l3-18 7-2.5-3 18.5z" {...s} />
          <path d="M11 6l7-2.5 2.5 6-7 2.5z" {...s} />
        </g>
      );
    case 'EXPR':
      return (
        <g transform="translate(34 39)">
          <path d="M12 6C7 6 4 10 4 14s3 8 7 8M12 6v16M26 6c-5 0-8 4-8 8s3 8 7 8M26 6v16" {...s} />
        </g>
      );
    case 'CULT':
      return (
        <g transform="translate(37 37)">
          <circle cx="13" cy="14" r="11" {...s} />
          <path d="M2 14h22M13 3c4 5 4 17 0 22-4-5-4-17 0-22z" {...s} />
        </g>
      );
    case 'REVIEW':
      return (
        <g transform="translate(37 36)">
          <path d="M8 26V5" {...s} />
          <path d="M8 5h16l-4 7 4 7H8z" {...s} fill={color} fillOpacity={0.15} />
        </g>
      );
  }
}

export function LessonStamp({
  tag,
  status,
  size = 80,
  lessonNumber,
  seed = tag,
  className = '',
}: LessonStampProps) {
  const resolved = resolveTag(String(tag));
  const meta = STAMP_STYLES[resolved];
  const color = inkColor(status, meta.color);
  const rotation = status === 'completed' ? stampRotation(seed) : 0;
  const path = outerPath(meta.shape);
  const dashed = status !== 'completed';
  const flat = meta.shape === 'oval' || meta.shape === 'ticket';
  const num =
    status === 'completed' && lessonNumber != null && lessonNumber > 0
      ? String(lessonNumber).padStart(2, '0')
      : null;

  return (
    <span
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size, transform: `rotate(${rotation}deg)` }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox="0 0 100 100" className="overflow-visible">
        {/* Soft wash */}
        {(status === 'completed' || status === 'current') && (
          <path d={path} fill={color} fillOpacity={status === 'completed' ? 0.08 : 0.04} />
        )}

        {/* Outer seal */}
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={status === 'completed' ? 3.8 : 2.6}
          strokeDasharray={dashed ? '6.5 4.5' : undefined}
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={status === 'locked' ? 0.55 : 0.95}
        />

        {/* Inner seal */}
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={status === 'completed' ? 1.6 : 1.2}
          strokeDasharray={dashed ? '5 3.5' : undefined}
          strokeLinejoin="round"
          transform="translate(50 50) scale(0.78) translate(-50 -50)"
          opacity={status === 'locked' ? 0.45 : 0.9}
        />

        {status === 'completed' && (
          <text
            x="50"
            y={flat ? 28 : 23}
            textAnchor="middle"
            fill={color}
            fontSize="8"
            fontWeight="800"
            letterSpacing="1.8"
            style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
          >
            {meta.abbr}
          </text>
        )}

        {status !== 'locked' && <StampGlyph tag={resolved} color={color} />}

        {num && (
          <text
            x="50"
            y={flat ? 76 : 87}
            textAnchor="middle"
            fill={color}
            fontSize="7.5"
            fontWeight="700"
            letterSpacing="0.9"
            style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
          >
            {`№ ${num}`}
          </text>
        )}
      </svg>

      {status === 'locked' && (
        <Lock
          size={Math.round(size * 0.26)}
          strokeWidth={2.5}
          className="absolute"
          style={{ color: STAMP_LOCKED_COLOR }}
        />
      )}

      {status === 'current' && (
        <span
          className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm"
          style={{ backgroundColor: '#E67E22', bottom: -4 }}
        >
          Começar
        </span>
      )}
    </span>
  );
}
