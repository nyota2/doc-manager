import { useState } from "react";
import { Check } from "lucide-react";
import { AuditPanel, CapturePanel, RetentionPanel, SearchPanel, WorkflowPanel } from "./TourPanels";

const tabs = [
  {
    key: "capture",
    label: "Capture",
    tint: "var(--tint-green)",
    title: "Capture from the branch, the desk or the core system",
    body: "Scan at the counter, upload from your desk or receive files straight from core systems. Every page is read and every document lands in the right folder.",
    points: [
      "Batch scanning that splits documents automatically",
      "Keeps working when a branch loses its connection",
      "Direct intake from Finastra, CRM and the Super App",
    ],
    panel: <CapturePanel />,
  },
  {
    key: "search",
    label: "Search",
    tint: "var(--tint-blue)",
    title: "Find anything in under a second",
    body: "Search by customer, account, policy or any word inside a scanned page. People only ever see the documents their role allows.",
    points: ["Full-text search inside scanned pages", "Filters for cluster, status, date and value", "Access set by role and sensitivity"],
    panel: <SearchPanel />,
  },
  {
    key: "workflows",
    label: "Approvals",
    tint: "var(--tint-amber)",
    title: "Approvals without the email chains",
    body: "Describe the approval in plain words and ZB Vault runs it: who signs, in what order, by when, and what happens if they don't.",
    points: ["Rules, deadlines and escalations, without code", "Electronic signatures inside the flow", "Missing items flagged and sent back automatically"],
    panel: <WorkflowPanel />,
  },
  {
    key: "retention",
    label: "Retention",
    tint: "var(--tint-violet)",
    title: "Keep every record exactly as long as you must",
    body: "Retention schedules per document class and jurisdiction archive and dispose of records on time, and stop the moment Legal places a hold.",
    points: ["Schedules aligned with RBZ directives", "Legal holds override disposal", "A disposal certificate for every run"],
    panel: <RetentionPanel />,
  },
  {
    key: "audit",
    label: "Audit",
    tint: "var(--tint-pink)",
    title: "Ready for the examiner on any day",
    body: "Every view, edit, approval and download is written to a tamper-evident log that you can filter and export in minutes.",
    points: ["Hash-chained, tamper-evident history", "Streams to the Group SIEM", "Exports in standard formats"],
    panel: <AuditPanel />,
  },
];

export default function Tour() {
  const [active, setActive] = useState(0);
  const tab = tabs[active];

  return (
    <section className="section tour" id="product">
      <div className="container">
        <h2 className="section-title center">
          One place for every document,{" "}
          <br />
          from the first scan to the final signature
        </h2>

        <div className="tour-tabs" role="tablist">
          {tabs.map((t, i) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={i === active}
              className={`tour-tab${i === active ? " on" : ""}`}
              onClick={() => setActive(i)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="tour-body" key={tab.key}>
          <div className="tour-copy">
            <h3>{tab.title}</h3>
            <p>{tab.body}</p>
            <ul>
              {tab.points.map((p) => (
                <li key={p}>
                  <Check size={18} strokeWidth={2.4} />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="tour-visual" style={{ background: tab.tint }}>
            {tab.panel}
          </div>
        </div>
      </div>
    </section>
  );
}
