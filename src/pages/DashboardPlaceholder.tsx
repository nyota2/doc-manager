import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { LogoMark } from "../components/Logo";
import { brand } from "../config/brand";

export default function DashboardPlaceholder() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        textAlign: "center",
        background: "radial-gradient(60% 50% at 50% 0%, rgba(132,193,31,.16), transparent 70%), var(--bg)",
      }}
    >
      <div style={{ maxWidth: 460, display: "grid", justifyItems: "center", gap: 16 }}>
        <LogoMark size={56} />
        <h1 style={{ fontSize: 30, letterSpacing: "-0.03em", fontWeight: 800 }}>You’re signed in</h1>
        <p style={{ color: "var(--ink-500)", lineHeight: 1.6 }}>
          The {brand.product} dashboard is the next build phase. This is where documents, workflows, records and
          audit will live.
        </p>
        <Link to="/" className="btn btn-ghost" style={{ marginTop: 8 }}>
          <ArrowLeft size={16} /> Back to home
        </Link>
      </div>
    </div>
  );
}
