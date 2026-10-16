import type { CSSProperties } from "react";
import {
  ArrowRight,
  Check,
  Download,
  FileText,
  Filter,
  FolderInput,
  Lock,
  ScanLine,
  Search,
  ShieldCheck,
  TriangleAlert,
  Upload,
  WifiOff,
} from "lucide-react";

const av = (c: string) => ({ "--av": c }) as CSSProperties;

function WindowBar({ title }: { title: string }) {
  return (
    <div className="win-bar">
      <span className="win-dots">
        <i />
        <i />
        <i />
      </span>
      <span className="win-title">{title}</span>
    </div>
  );
}

export function CapturePanel() {
  const files = [
    { name: "KYC pack — R. Chikwanha.pdf", size: "4.2 MB", pct: 100, state: "Filed as KYC · Identity", ext: "pdf" },
    { name: "Valuation report — Stand 1182.pdf", size: "9.8 MB", pct: 72, state: "Reading pages 6 of 9", ext: "pdf" },
    { name: "Board minutes — September.docx", size: "640 KB", pct: 28, state: "Uploading", ext: "docx" },
  ];
  return (
    <div className="win">
      <WindowBar title="Capture" />
      <div className="win-body">
        <div className="drop">
          <Upload size={22} />
          <div>
            <b>Drop files here, or scan a batch</b>
            <small>PDF, Word, Excel, images and email, up to 2 GB each</small>
          </div>
          <span className="btn btn-primary btn-sm">Browse</span>
        </div>

        <ul className="uploads">
          {files.map((f) => (
            <li key={f.name}>
              <span className={`file-ico file-${f.ext}`}>{f.ext}</span>
              <div className="up-main">
                <div className="up-top">
                  <b>{f.name}</b>
                  <small>{f.size}</small>
                </div>
                <div className="up-bar">
                  <i style={{ width: `${f.pct}%` }} className={f.pct === 100 ? "done" : ""} />
                </div>
                <small className={f.pct === 100 ? "up-done" : ""}>
                  {f.pct === 100 && <Check size={12} strokeWidth={3} />} {f.state}
                </small>
              </div>
            </li>
          ))}
        </ul>

        <div className="batch">
          <ScanLine size={18} />
          <div>
            <b>Branch 04 scanner · batch 8812</b>
            <small>24 pages split into 6 documents, 1 waiting for a missing ID page</small>
          </div>
          <span className="batch-off">
            <WifiOff size={13} /> Queued offline · syncs on reconnect
          </span>
        </div>
      </div>
    </div>
  );
}

export function SearchPanel() {
  const results = [
    { title: "CLM-20931", rest: "Underwriting evidence", meta: "Insurance · Motor claims · 2 days ago", hit: "…vehicle damage estimated at $5,400 by the assessor…" },
    { title: "CLM-20877", rest: "Assessor report", meta: "Insurance · Motor claims · 5 days ago", hit: "…assessed value $6,120, claimant notified…" },
    { title: "CLM-20412", rest: "Police report", meta: "Insurance · Motor claims · 1 week ago", hit: "…loss exceeding $5,000 reported at Harare Central…" },
  ];
  return (
    <div className="win">
      <WindowBar title="Search" />
      <div className="win-body">
        <div className="s-box">
          <Search size={18} />
          <span>motor claims over $5,000 still pending</span>
          <kbd className="mono">Enter</kbd>
        </div>
        <div className="s-filters">
          <span>
            <Filter size={13} /> Insurance
          </span>
          <span>Status: Pending</span>
          <span>Value &gt; $5,000</span>
          <span className="s-add">+ Add filter</span>
        </div>
        <p className="s-count">
          <b>1,284 documents</b> found in 0.21 seconds
        </p>
        <ul className="s-results">
          {results.map((r) => (
            <li key={r.title}>
              <FileText size={18} />
              <div>
                <b>
                  {r.title} · {r.rest}
                </b>
                <p>{r.hit}</p>
                <small>{r.meta}</small>
              </div>
            </li>
          ))}
        </ul>
        <p className="s-scope">
          <Lock size={13} /> Showing only documents your role is cleared to see
        </p>
      </div>
    </div>
  );
}

export function WorkflowPanel() {
  const steps = [
    { who: "Branch officer", initials: "RM", c: "#f08c2e", state: "done", note: "Submitted 09:41" },
    { who: "Credit analyst", initials: "KM", c: "#4c8ef7", state: "done", note: "Approved 11:02" },
    { who: "Credit committee", initials: "CC", c: "#3d4440", state: "now", note: "2 of 3 votes · due in 2 h" },
    { who: "Archive & notify branch", initials: "ZB", c: "#0b8a2e", state: "next", note: "Automatic" },
  ];
  return (
    <div className="win">
      <WindowBar title="Workflows · Home loan approval" />
      <div className="win-body">
        <div className="recipe">
          When a <u>home loan application</u> is filed and the <u>amount</u> is over <u>$50,000</u>, ask the{" "}
          <u>credit committee</u> to approve within <u>24 hours</u>, then <u>archive it</u> and <u>notify the branch</u>.
        </div>
        <ol className="flow">
          {steps.map((s) => (
            <li key={s.who} className={s.state}>
              <span className="avatar" style={av(s.c)}>
                {s.initials}
              </span>
              <div>
                <b>{s.who}</b>
                <small>{s.note}</small>
              </div>
              <span className="flow-state">
                {s.state === "done" && <Check size={13} strokeWidth={3} />}
                {s.state === "now" && <i />}
              </span>
            </li>
          ))}
        </ol>
        <div className="exception">
          <TriangleAlert size={16} />
          <span>
            <b>Exception:</b> proof of residence missing on SME Facility — Mhofu Farms. Returned to Branch 12 with a
            24-hour deadline.
          </span>
        </div>
      </div>
    </div>
  );
}

export function RetentionPanel() {
  const rows = [
    { cls: "Loan agreements", rule: "10 years after closure", next: "Archive, then dispose", count: "48,210" },
    { cls: "KYC records", rule: "7 years after relationship ends", next: "Dispose", count: "212,904", hold: true },
    { cls: "Motor claims", rule: "7 years after settlement", next: "Dispose", count: "31,477" },
    { cls: "Board minutes", rule: "Permanent", next: "Preserve", count: "1,320" },
  ];
  return (
    <div className="win">
      <WindowBar title="Records · Retention schedules" />
      <div className="win-body">
        <div className="r-table">
          <div className="r-row r-head">
            <span>Document class</span>
            <span>Keep for</span>
            <span>When it expires</span>
            <span>Documents</span>
          </div>
          {rows.map((r) => (
            <div className="r-row" key={r.cls}>
              <span>
                <b>{r.cls}</b>
                {r.hold && <span className="hold">Legal hold</span>}
              </span>
              <span>{r.rule}</span>
              <span>{r.next}</span>
              <span className="mono">{r.count}</span>
            </div>
          ))}
        </div>
        <div className="r-run">
          <FolderInput size={18} />
          <div>
            <b>Next disposal run · 1 November</b>
            <small>1,204 documents due · 3 skipped under legal hold CASE-118 · certificate issued on completion</small>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuditPanel() {
  const rows = [
    { t: "11:23:47", who: "Fadzai Sibanda", i: "FS", c: "#9d5bd2", act: "Downloaded", doc: "CLM-20877 Assessor report" },
    { t: "11:23:45", who: "Legal Ops", i: "LO", c: "#3d4440", act: "Placed hold", doc: "CASE-118 · 214 documents" },
    { t: "11:23:35", who: "Tariro Gumbo", i: "TG", c: "#9d5bd2", act: "Signed", doc: "Mandate — Pension Fund A" },
    { t: "11:23:28", who: "Retention service", i: "RS", c: "#0aa5b8", act: "Archived", doc: "DOC-0031207 to cold storage" },
    { t: "11:23:21", who: "Kudzai Marufu", i: "KM", c: "#4c8ef7", act: "Approved", doc: "Home Loan — T. Moyo" },
  ];
  return (
    <div className="win">
      <WindowBar title="Audit trail" />
      <div className="win-body">
        <div className="a-top">
          <span className="a-verified">
            <ShieldCheck size={15} /> Chain verified · no integrity exceptions
          </span>
          <span className="btn btn-ghost btn-sm">
            <Download size={15} /> Export for examination
          </span>
        </div>
        <ul className="a-list">
          {rows.map((r) => (
            <li key={r.t}>
              <span className="mono a-time">{r.t}</span>
              <span className="avatar" style={av(r.c)}>
                {r.i}
              </span>
              <span className="a-text">
                <b>{r.who}</b> {r.act.toLowerCase()} <span>{r.doc}</span>
              </span>
              <span className="mono a-hash">
                {["7f3a", "c21e", "09bd", "e4a1", "5b72"][rows.indexOf(r)]}…
              </span>
            </li>
          ))}
        </ul>
        <a className="a-more" href="#security">
          Every view, edit, approval and download is recorded <ArrowRight size={14} />
        </a>
      </div>
    </div>
  );
}
