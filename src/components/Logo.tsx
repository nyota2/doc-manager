import { brand } from "../config/brand";

const GREEN = "#0b8a2e";
const LIME = "#8cc63f";

/** The ZB "zb + smile" mark, redrawn as vector. */
export function LogoMark({ size = 36, mono }: { size?: number; mono?: string }) {
  const g = mono ?? GREEN;
  const l = mono ?? LIME;
  return (
    <svg width={size} height={size} viewBox="47 24 330 376" aria-hidden="true" className="logo-mark">
      {/* z */}
      <path
        d="M92 160H176L92 252H186"
        fill="none"
        stroke={g}
        strokeWidth="42"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* b: stem with the pennant top, and bowl */}
      <path d="M211 42c0-5 4-8 9-7l29 6c5 1 7 6 3 10l-10 8 11 7V96h-42Z" fill={g} />
      <path d="M232 80V214" fill="none" stroke={g} strokeWidth="42" strokeLinecap="round" />
      <circle cx="282" cy="205" r="50" fill="none" stroke={g} strokeWidth="42" />
      {/* smile */}
      <path d="M118 338Q216 410 314 338" fill="none" stroke={l} strokeWidth="34" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ light = false, size = 38 }: { light?: boolean; size?: number }) {
  return (
    <span className={`brand${light ? " brand-light" : ""}`}>
      <LogoMark size={size} mono={light ? "#ffffff" : undefined} />
      <span className="brand-divider" />
      <span className="brand-text">
        <strong>{brand.product.replace(/^ZB\s*/, "")}</strong>
        <small>{brand.tagline}</small>
      </span>
    </span>
  );
}
