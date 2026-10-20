interface LogoProps {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}

/** Знак: «Л», правая ножка которой продолжается нитью времени с тремя отметками. */
export function LogoMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label="Летопись"
      className={className}
      shapeRendering="geometricPrecision"
    >
      <rect width="32" height="32" rx="8" className="fill-accent" />
      <path
        d="M8 24.5 12.8 7.5H21V12.5"
        fill="none"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-white"
      />
      <circle cx="21" cy="17.6" r="2.1" className="fill-white" />
      <circle cx="21" cy="22.2" r="2.1" className="fill-white" />
      <circle cx="21" cy="26.8" r="2.1" className="fill-white" />
    </svg>
  );
}

export default function Logo({ size = 24, withWordmark = false, className }: LogoProps) {
  if (!withWordmark) return <LogoMark size={size} className={className} />;
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <LogoMark size={size} />
      <span
        className="font-semibold text-ink"
        style={{ fontSize: Math.round(size * 0.68), letterSpacing: '-0.01em', lineHeight: 1 }}
      >
        Летопись
      </span>
    </span>
  );
}

export { Logo };
