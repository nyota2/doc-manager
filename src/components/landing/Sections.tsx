import { Link } from "react-router-dom";
import {
  ArrowRight,
  Fingerprint,
  KeyRound,
  Landmark,
  Lock,
  ScrollText,
  ShieldCheck,
  TrendingUp,
  Umbrella,
  Users,
} from "lucide-react";

export function Connected() {
  const systems = [
    "Finastra Fusion Essence",
    "Active Directory",
    "Customer Relationship Management",
    "ZB Super App",
    "National Payment Systems",
    "Insurance & Investment platforms",
  ];
  return (
    <section className="connected">
      <div className="container">
        <p>Connected to the systems the Group already runs on</p>
        <ul>
          {systems.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Numbers() {
  const items = [
    { v: "< 1 sec", l: "to retrieve any indexed document" },
    { v: "1,500+", l: "people working at the same time" },
    { v: "99.9%", l: "monthly uptime, active-active" },
    { v: "15 min", l: "maximum data loss in a disaster" },
    { v: "1 hour", l: "to be back up at the recovery site" },
  ];
  return (
    <section className="numbers">
      <div className="container">
        <div className="numbers-grid">
          {items.map((i) => (
            <div key={i.l}>
              <b>{i.v}</b>
              <span>{i.l}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ForTheGroup() {
  const clusters = [
    {
      icon: Landmark,
      name: "Banking",
      tint: "var(--tint-green)",
      ink: "#0b6b26",
      body: "Account opening, lending and payments, linked to every customer in core banking.",
      docs: ["Account opening packs", "Loan files & securities", "KYC records", "RTGS & payment records"],
    },
    {
      icon: Umbrella,
      name: "Insurance",
      tint: "var(--tint-blue)",
      ink: "#1f5bc7",
      body: "Policies, claims and underwriting evidence handled in one governed place.",
      docs: ["Policy documents", "Claims & evidence", "Underwriting files", "Reinsurance treaties"],
    },
    {
      icon: TrendingUp,
      name: "Investment",
      tint: "var(--tint-violet)",
      ink: "#6a3bb5",
      body: "Client mandates and portfolio records, always ready for compliance review.",
      docs: ["Client mandates", "Portfolio records", "Compliance reports", "Client statements"],
    },
  ];
  return (
    <section className="section group" id="group">
      <div className="container">
        <h2 className="section-title center">Built for every cluster, shared by the whole Group</h2>
        <p className="section-sub center">
          Each team keeps its own workspace and rules. Everyone works from the same authoritative repository.
        </p>
        <div className="group-grid">
          {clusters.map(({ icon: Icon, name, tint, ink, body, docs }) => (
            <article className="cluster" key={name} style={{ background: tint }}>
              <span className="cluster-icon" style={{ color: ink }}>
                <Icon size={22} />
              </span>
              <h3>{name}</h3>
              <p>{body}</p>
              <ul>
                {docs.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SecuritySection() {
  const controls = [
    { icon: Lock, title: "Encrypted everywhere", body: "AES-256 for stored files and TLS 1.3 for everything on the move." },
    { icon: Fingerprint, title: "Multi-factor sign-in", body: "Required for privileged users and all remote access." },
    { icon: Users, title: "One Group identity", body: "Single sign-on through Active Directory. No extra passwords." },
    { icon: KeyRound, title: "Access by role and sensitivity", body: "Rules on role, cluster, branch and classification decide who sees what." },
    { icon: ScrollText, title: "Tamper-evident history", body: "Every action is time-stamped, hash-chained and exportable." },
    { icon: ShieldCheck, title: "Certified records", body: "Records management to DoD 5015.2 or an equivalent standard." },
  ];
  return (
    <section className="section security" id="security">
      <div className="container security-grid">
        <div className="security-copy">
          <h2 className="section-title">Security the regulator expects, by default</h2>
          <p className="section-sub">
            Hosted in ZBFH data centres for data sovereignty, with geo-redundant recovery and a cloud-ready
            design for when the Group is ready to move.
          </p>
          <ul className="regs">
            <li>Reserve Bank of Zimbabwe directives</li>
            <li>Zimbabwe Data Protection Act</li>
            <li>EU General Data Protection Regulation</li>
          </ul>
        </div>
        <ul className="controls">
          {controls.map(({ icon: Icon, title, body }) => (
            <li key={title}>
              <Icon size={22} />
              <div>
                <b>{title}</b>
                <p>{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="final">
      <div className="container">
        <h2>Ready to put the filing cabinets away?</h2>
        <p>Sign in with your ZBFH account. Your workspace is already set up.</p>
        <Link to="/login" className="btn btn-primary">
          Get started <ArrowRight size={18} className="arrow" />
        </Link>
      </div>
    </section>
  );
}
