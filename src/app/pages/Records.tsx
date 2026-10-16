import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { CircleCheck, Gavel, Lock, Search, Trash2, Undo2 } from "lucide-react";
import { retentionClasses } from "../data/seed";
import {
  canGovern,
  currentUser,
  dispose,
  isDueForDisposal,
  placeHold,
  releaseHold,
  useAppState,
  userById,
  workspaceByKey,
} from "../data/store";
import type { Doc } from "../data/types";
import { fmtDate, matches, timeAgo } from "../lib/format";
import { useShell } from "../shellContext";
import { Empty, FileIcon, Modal, toast } from "../components/ui";

const YEAR = 365.25 * 86_400_000;

export default function Records() {
  const state = useAppState();
  const user = currentUser()!;
  const { openDoc } = useShell();
  const [confirm, setConfirm] = useState<Doc | null>(null);
  const [holdOpen, setHoldOpen] = useState(false);

  if (!canGovern(user)) {
    return (
      <div className="page">
        <Empty icon={<Lock size={22} />} title="Records & retention is limited to governance roles" />
      </div>
    );
  }

  const live = state.docs.filter((d) => d.status !== "disposed");
  const due = live.filter((d) => isDueForDisposal(d)).sort((a, b) => (a.retainUntil! < b.retainUntil! ? -1 : 1));
  const held = live.filter((d) => d.hold);
  const disposedThisYear = state.docs.filter(
    (d) => d.status === "disposed" && new Date(d.updatedAt).getFullYear() === new Date().getFullYear(),
  );
  const cases = [...new Set(held.map((d) => d.hold!.caseId))];

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Records &amp; retention</h1>
          <p>Retention schedules, the disposal queue and legal holds across the Group.</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setHoldOpen(true)}>
          <Gavel size={16} /> Place legal hold
        </button>
      </header>

      <div className="tiles">
        <div className="tile">
          <span>Records under management</span>
          <b>{live.length}</b>
          <small>across {new Set(live.map((d) => d.workspace)).size} workspaces</small>
        </div>
        <div className="tile">
          <span>Due for disposal</span>
          <b className={due.length ? "warn" : ""}>{due.length}</b>
          <small>past their retention period</small>
        </div>
        <div className="tile">
          <span>On legal hold</span>
          <b>{held.length}</b>
          <small>
            {cases.length} case{cases.length === 1 ? "" : "s"}
          </small>
        </div>
        <div className="tile">
          <span>Disposed this year</span>
          <b>{disposedThisYear.length}</b>
          <small>with certificates in the audit trail</small>
        </div>
      </div>

      <section className="card flush">
        <div className="card-head padded">
          <h2>Disposal queue</h2>
          <small className="muted">Contents are destroyed. The record and its history stay.</small>
        </div>
        {due.length === 0 ? (
          <Empty icon={<CircleCheck size={22} />} title="Nothing is due for disposal" />
        ) : (
          <div className="list-table lt-disposal">
            <div className="lt-row lt-head">
              <span>Document</span>
              <span>Record class</span>
              <span>Kept until</span>
              <span>Hold</span>
              <span />
            </div>
            {due.map((d) => {
              const overdueYears = (Date.now() - new Date(d.retainUntil!).getTime()) / YEAR;
              return (
                <div className="lt-row" key={d.id}>
                  <button className="lt-doc link-cell" onClick={() => openDoc(d.id)}>
                    <FileIcon name={d.fileName} size="sm" />
                    <span>
                      <b>{d.title}</b>
                      <small>
                        <i className="ws-dot" style={{ "--c": workspaceByKey(d.workspace).color } as CSSProperties} />
                        {workspaceByKey(d.workspace).name} · <span className="mono">{d.ref}</span>
                      </small>
                    </span>
                  </button>
                  <span>{retentionClasses.find((c) => c.id === d.classId)!.name}</span>
                  <span>
                    {fmtDate(d.retainUntil!)}
                    <small className="overdue">
                      {overdueYears >= 1 ? `${Math.floor(overdueYears)} yr overdue` : `overdue ${timeAgo(d.retainUntil!)}`}
                    </small>
                  </span>
                  <span>
                    {d.hold ? (
                      <span className="hold-tag">
                        <Gavel size={12} /> {d.hold.caseId}
                      </span>
                    ) : (
                      <span className="muted">None</span>
                    )}
                  </span>
                  <span>
                    <button className="btn btn-danger btn-xs" disabled={!!d.hold} onClick={() => setConfirm(d)}>
                      <Trash2 size={14} /> Dispose
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="card flush">
        <div className="card-head padded">
          <h2>Legal holds</h2>
        </div>
        {cases.length === 0 ? (
          <Empty icon={<Gavel size={22} />} title="No active legal holds" />
        ) : (
          cases.map((c) => {
            const docs = held.filter((d) => d.hold!.caseId === c);
            const h = docs[0].hold!;
            return (
              <div className="case" key={c}>
                <div className="case-head">
                  <span className="hold-tag">
                    <Gavel size={12} /> {c}
                  </span>
                  <b>{h.reason}</b>
                  <small>
                    Placed by {userById(h.by).name} · {fmtDate(h.at)}
                  </small>
                </div>
                <ul>
                  {docs.map((d) => (
                    <li key={d.id}>
                      <button className="link" onClick={() => openDoc(d.id)}>
                        {d.title}
                      </button>
                      <span className="mono muted">{d.ref}</span>
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => {
                          releaseHold(d.id);
                          toast(`Released ${c} on ${d.title}`);
                        }}
                      >
                        <Undo2 size={13} /> Release
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </section>

      <section className="card flush">
        <div className="card-head padded">
          <h2>Retention schedules</h2>
          <small className="muted">Aligned with RBZ directives and the Zimbabwe Data Protection Act</small>
        </div>
        <div className="list-table lt-schedules">
          <div className="lt-row lt-head">
            <span>Record class</span>
            <span>Workspace</span>
            <span>Keep for</span>
            <span>Documents</span>
            <span>Next expiry</span>
          </div>
          {retentionClasses.map((c) => {
            const docs = live.filter((d) => d.classId === c.id);
            const next = docs
              .map((d) => d.retainUntil)
              .filter((x): x is string => !!x && new Date(x).getTime() > Date.now())
              .sort()[0];
            const ws = workspaceByKey(c.workspace);
            return (
              <div className="lt-row" key={c.id}>
                <b>{c.name}</b>
                <span className="lt-user">
                  <i className="ws-dot" style={{ "--c": ws.color } as CSSProperties} />
                  {ws.name}
                </span>
                <span>{c.years ? `${c.years} years ${c.trigger}` : "Permanently"}</span>
                <span className="mono">{docs.length}</span>
                <span className="muted">{next ? fmtDate(next) : "—"}</span>
              </div>
            );
          })}
        </div>
      </section>

      {confirm && (
        <Modal
          title="Dispose of this document?"
          onClose={() => setConfirm(null)}
          width={480}
          footer={
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirm(null)}>
                Cancel
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={async () => {
                  const d = confirm;
                  setConfirm(null);
                  if (await dispose(d.id)) toast(`Disposed of ${d.title}`);
                }}
              >
                <Trash2 size={15} /> Dispose permanently
              </button>
            </>
          }
        >
          <p className="modal-lead">
            <b>{confirm.title}</b> passed its retention date on {fmtDate(confirm.retainUntil!)}. Its contents will be
            destroyed and can't be recovered. The record, its metadata and its audit history are kept as proof of
            disposal.
          </p>
        </Modal>
      )}

      {holdOpen && <PlaceHold docs={live} onClose={() => setHoldOpen(false)} />}
    </div>
  );
}

function PlaceHold({ docs, onClose }: { docs: Doc[]; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [caseId, setCaseId] = useState("");
  const [reason, setReason] = useState("");
  const results = useMemo(
    () => docs.filter((d) => !d.hold && matches([d.title, d.ref, ...d.tags, ...d.fields.map((f) => f.value)], q)).slice(0, 40),
    [docs, q],
  );
  const valid = picked.length > 0 && caseId.trim() && reason.trim();

  return (
    <Modal
      title="Place legal hold"
      onClose={onClose}
      width={620}
      footer={
        <>
          <span className="foot-note">{picked.length} selected</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary btn-sm"
            disabled={!valid}
            onClick={() => {
              const id = caseId.trim().toUpperCase();
              placeHold(picked, id, reason.trim());
              toast(`Legal hold ${id} placed on ${picked.length} document${picked.length > 1 ? "s" : ""}`);
              onClose();
            }}
          >
            <Gavel size={15} /> Place hold
          </button>
        </>
      }
    >
      <div className="form-grid">
        <label className="field">
          <span>Case reference</span>
          <input value={caseId} onChange={(e) => setCaseId(e.target.value)} placeholder="CASE-124" autoFocus />
        </label>
        <label className="field">
          <span>Reason</span>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Litigation, regulatory enquiry…" />
        </label>
      </div>
      <label className="tb-search wide">
        <Search size={15} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find documents by name, reference or customer" />
      </label>
      <ul className="pick-list">
        {results.map((d) => (
          <li key={d.id}>
            <label>
              <input
                type="checkbox"
                checked={picked.includes(d.id)}
                onChange={() => setPicked((p) => (p.includes(d.id) ? p.filter((x) => x !== d.id) : [...p, d.id]))}
              />
              <FileIcon name={d.fileName} size="sm" />
              <span>
                <b>{d.title}</b>
                <small>
                  {workspaceByKey(d.workspace).name} · <span className="mono">{d.ref}</span>
                </small>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
