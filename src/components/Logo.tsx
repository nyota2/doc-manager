import { brand } from "../config/brand";

/** The ZB "zb + smile" mark. `tile` is the white-on-green version for dark backgrounds. */
export function LogoMark({ size = 36, tile = false }: { size?: number; tile?: boolean }) {
  return (
    <img
      src={tile ? "/brand/zb-logo-tile.png" : "/brand/zb-logo.png"}
      alt=""
      aria-hidden="true"
      className={`logo-mark${tile ? " logo-tile" : ""}`}
      style={{ height: size, width: "auto" }}
    />
  );
}

export function Logo({ light = false, size = 38 }: { light?: boolean; size?: number }) {
  return (
    <span className={`brand${light ? " brand-light" : ""}`}>
      <LogoMark size={size} tile={light} />
      <span className="brand-divider" />
      <span className="brand-text">
        <strong>{brand.product.replace(/^ZB\s*/, "")}</strong>
        <small>{brand.tagline}</small>
      </span>
    </span>
  );
}
