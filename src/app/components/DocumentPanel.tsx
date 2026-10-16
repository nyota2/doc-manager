import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  Archive,
  Check,
  Download,
  FilePlus2,
  Gavel,
  Link2,
  Lock,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Undo2,
  X,
} from "lucide-react";
import {
  addVersion,
  approve,
  archive,
  canGovern,
  classById,
  currentUser,
  pendingStep,
  placeHold,
  recordView,
  reject,
  releaseHold,
  resubmit,
  updateDoc,
  useAppState,
  userById,
  workspaceByKey,
} from "../data/store";
import { workspaces } from "../data/seed";
import type { Doc, Sensitivity } from "../data/types";
import { fileSize, fmtDate, fmtDateTime, timeAgo } from "../lib/format";
import FilePreview, { downloadVersion } from "./FilePreview";
import { Avatar, FileIcon, Modal, Popover, StatusCell, toast } from "./ui";

type Tab = "details" | "approval" | "activity" | "versions";

export default function DocumentPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const state = useAppState();
  const user = currentUser()!;
  const doc = state.docs.find((d) => d.id === id);
  const allowed = !!doc && user.workspaces.includes(doc.workspace);
  const mine = doc && pendingStep(doc)?.userId === user.id;
  const [tab, setTab] = useState<Tab>(mine ? "approval" : "details");
  const [holdOpen, setHoldOpen] = useState(false);
  const logged = useRef<string | null>(null);
  const versionInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (allowed && logged.current !== id) {
      logged.current = id;
      recordView(id);
    }
  }, [id, allowed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !holdOpen && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, holdOpen]);

  if (!doc || !allowed) {
    return (
      <div className="drawer-backdrop" onMouseDown={onClose}>
        <aside className="drawer drawer-empty" onMouseDown={(e) => e.stopPropagation()}>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
          <b>Document not available</b>
          <p>It may have been moved, or your role does not give you access to it.</p>
        </aside>
      </div>
    );
  }

  const ws = workspaceByKey(doc.workspace);
  const current = doc.versions[doc.versions.length - 1];
  const gov = canGovern(user);

  return (
    <div className="drawer-backdrop" onMouseDown={onClose}>
      <aside className="drawer" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label={doc.title}>
        <header className="dr-head">
          <FileIcon name={doc.fileName} size="lg" />
          <div className="dr-title">
            <EditableTitle doc={doc} />
            <p>
              <span className="mono">{doc.ref}</span>
              <span>·</span>
              <i className="ws-dot" style={{ "--c": ws.color } as CSSProperties} />
              {ws.name} › {doc.group}
              {doc.hold && (
                <span className="hold-tag">
                  <Gavel size={12} /> Legal hold
                </span>
              )}
            </p>
          </div>
          <div className="dr-actions">
            <div className="dr-status">
              <StatusCell doc={doc} />
            </div>
            <button
              className="btn btn-ghost btn-sm"
              disabled={!current?.blobId || doc.status === "disposed"}
              title={current?.blobId ? undefined : "The original is held in archive storage"}
              onClick={() => downloadVersion(doc, current.blobId!)}
            >
              <Download size={16} /> Download
            </button>
            <Popover
              align="end"
              trigger={(_, toggle) => (
                <button className="icon-btn" onClick={toggle} aria-label="More actions">
                  <MoreHorizontal size={20} />
                </button>
              )}
            >
              {(close) => (
                <div className="menu">
                  <button
                    className="menu-item"
                    disabled={doc.status === "disposed"}
                    onClick={() => {
                      versionInput.current?.click();
                      close();
                    }}
                  >
                    <FilePlus2 size={16} /> Upload new version
                  </button>
                  <button
                    className="menu-item"
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href);
                      toast("Link copied");
                      close();
                    }}
                  >
                    <Link2 size={16} /> Copy link
                  </button>
                  {doc.status !== "archived" && doc.status !== "disposed" && (
                    <button
                      className="menu-item"
                      onClick={() => {
                        archive(doc.id);
                        toast(`Archived ${doc.title}`);
                        close();
                      }}
                    >
                      <Archive size={16} /> Move to archive
                    </button>
                  )}
                  {gov &&
                    (doc.hold ? (
                      <button
                        className="menu-item"
                        onClick={() => {
                          releaseHold(doc.id);
                          toast(`Legal hold released on ${doc.title}`);
                          close();
                        }}
                      >
                        <Undo2 size={16} /> Release legal hold
                      </button>
                    ) : (
                      <button
                        className="menu-item"
                        onClick={() => {
                          setHoldOpen(true);
                          close();
                        }}
                      >
                        <Gavel size={16} /> Place legal hold
                      </button>
                    ))}
                </div>
              )}
            </Popover>
            <button className="icon-btn" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>
          <input
            ref={versionInput}
            type="file"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              await addVersion(doc.id, f, `Replaced with ${f.name}`);
              toast(`Version ${doc.versions.length + 1} uploaded`);
              setTab("versions");
            }}
          />
        </header>

        <div className="dr-body">
          <section className="dr-preview">
            <FilePreview doc={doc} />
          </section>

          <section className="dr-side">
            <nav className="dr-tabs">
              {(["details", "approval", "activity", "versions"] as Tab[]).map((t) => (
                <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
                  {t === "approval" ? "Approval" : t[0].toUpperCase() + t.slice(1)}
                  {t === "approval" && mine && <em />}
                </button>
              ))}
            </nav>
            <div className="dr-pane">
              {tab === "details" && <Details doc={doc} />}
              {tab === "approval" && <ApprovalTab doc={doc} />}
              {tab === "activity" && <Activity doc={doc} />}
              {tab === "versions" && <Versions doc={doc} onUpload={() => versionInput.current?.click()} />}
            </div>
          </section>
        </div>
      </aside>

      {holdOpen && <HoldDialog docIds={[doc.id]} onClose={() => setHoldOpen(false)} />}
    </div>
  );
}

function EditableTitle({ doc }: { doc: Doc }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(doc.title);
  useEffect(() => setValue(doc.title), [doc.title]);

  const save = () => {
    setEditing(false);
    const v = value.trim();
    if (v && v !== doc.title) updateDoc(doc.id, { title: v }, `Renamed to "${v}"`);
    else setValue(doc.title);
  };

  if (!editing || doc.status === "disposed") {
    return (
      <h2 onClick={() => doc.status !== "disposed" && setEditing(true)} title="Click to rename">
        {doc.title}
      </h2>
    );
  }
  return (
    <input
      className="title-input"
      autoFocus
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === "Enter") save();
        if (e.key === "Escape") {
          setValue(doc.title);
          setEditing(false);
        }
      }}
    />
  );
}

function Details({ doc }: { doc: Doc }) {
  const cls = classById(doc.classId);
  const ws = workspaces.find((w) => w.key === doc.workspace)!;
  const [tag, setTag] = useState("");
  const current = doc.versions[doc.versions.length - 1];
  const locked = doc.status === "disposed";

  return (
    <div className="details">
      {doc.hold && (
        <div className="banner banner-red">
          <Gavel size={16} />
          <span>
            <b>Legal hold {doc.hold.caseId}.</b> {doc.hold.reason}. This document cannot be disposed of until the
            hold is released.
          </span>
        </div>
      )}

      <dl>
        <dt>Owner</dt>
        <dd className="dd-user">
          <Avatar userId={doc.ownerId} size={24} />
          {userById(doc.ownerId).name}
        </dd>

        <dt>Group</dt>
        <dd>
          <select
            value={doc.group}
            disabled={locked}
            onChange={(e) => updateDoc(doc.id, { group: e.target.value }, `Moved to ${ws.name} › ${e.target.value}`)}
          >
            {ws.groups.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </dd>

        <dt>Sensitivity</dt>
        <dd>
          <select
            value={doc.sensitivity}
            disabled={locked}
            onChange={(e) =>
              updateDoc(doc.id, { sensitivity: e.target.value as Sensitivity }, `Sensitivity set to ${e.target.value}`)
            }
          >
            <option>Internal</option>
            <option>Confidential</option>
            <option>Restricted</option>
          </select>
        </dd>

        <dt>Record class</dt>
        <dd>{cls.name}</dd>

        <dt>Keep until</dt>
        <dd>
          {doc.retainUntil ? fmtDate(doc.retainUntil) : "Permanently"}
          <small>
            {cls.years ? `${cls.years} years ${cls.trigger}` : "Kept permanently"}
          </small>
        </dd>

        <dt>File</dt>
        <dd>
          {doc.fileName}
          <small>{current ? fileSize(current.size) : ""}</small>
        </dd>

        <dt>Created</dt>
        <dd>{fmtDateTime(doc.createdAt)}</dd>

        <dt>Last change</dt>
        <dd>{timeAgo(doc.updatedAt)}</dd>
      </dl>

      {doc.fields.length > 0 && (
        <>
          <h4>Indexed fields</h4>
          <dl className="fields">
            {doc.fields.map((f) => (
              <div key={f.label}>
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        </>
      )}

      <h4>Tags</h4>
      <div className="tags">
        {doc.tags.map((t) => (
          <span key={t} className={`tag${t.startsWith("missing:") ? " tag-warn" : ""}`}>
            {t}
            {!locked && (
              <button
                aria-label={`Remove ${t}`}
                onClick={() => updateDoc(doc.id, { tags: doc.tags.filter((x) => x !== t) }, `Removed tag "${t}"`)}
              >
                <X size={12} />
              </button>
            )}
          </span>
        ))}
        {!locked && (
          <form
            className="tag-add"
            onSubmit={(e) => {
              e.preventDefault();
              const v = tag.trim().toLowerCase();
              if (v && !doc.tags.includes(v)) updateDoc(doc.id, { tags: [...doc.tags, v] }, `Added tag "${v}"`);
              setTag("");
            }}
          >
            <Plus size={13} />
            <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Add tag" />
          </form>
        )}
      </div>
    </div>
  );
}

function ApprovalTab({ doc }: { doc: Doc }) {
  const user = currentUser()!;
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const pending = pendingStep(doc);
  const mine = pending?.userId === user.id;

  if (!doc.approval.length) {
    return <p className="pane-empty">This document is filed without an approval route.</p>;
  }

  return (
    <div className="approval-tab">
      <ol className="steps">
        {doc.approval.map((s) => (
          <li key={s.id} className={`step step-${s.state}`}>
            <Avatar userId={s.userId} size={34} />
            <div>
              <b>{s.label}</b>
              <small>
                {userById(s.userId).name}
                {s.at && ` · ${s.state === "approved" ? "approved" : "returned"} ${timeAgo(s.at)}`}
                {s.state === "pending" && " · waiting"}
              </small>
              {s.comment && <p className="step-comment">“{s.comment}”</p>}
            </div>
            <span className="step-state">
              {s.state === "approved" && <Check size={13} strokeWidth={3} />}
              {s.state === "rejected" && <X size={13} strokeWidth={3} />}
              {s.state === "pending" && <i />}
            </span>
          </li>
        ))}
      </ol>

      {mine && (
        <div className="decide">
          <label>
            <span>Comment {error && <em>{error}</em>}</span>
            <textarea
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setError("");
              }}
              placeholder="Optional when approving. Required when returning."
              rows={3}
            />
          </label>
          <div className="decide-actions">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                if (!comment.trim()) return setError("Say what needs fixing");
                reject(doc.id, comment.trim());
                toast(`Returned ${doc.title} to ${userById(doc.ownerId).name}`);
                setComment("");
              }}
            >
              <RotateCcw size={15} /> Return
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                approve(doc.id, comment.trim() || undefined);
                toast(`Approved ${doc.title}`);
                setComment("");
              }}
            >
              <Check size={16} /> Approve as {pending!.label.toLowerCase()}
            </button>
          </div>
        </div>
      )}

      {doc.status === "returned" && (
        <div className="decide">
          <p className="decide-note">Returned for changes. Upload a corrected version, then resubmit.</p>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              resubmit(doc.id);
              toast(`Resubmitted ${doc.title}`);
            }}
          >
            Resubmit for approval
          </button>
        </div>
      )}
    </div>
  );
}

function Activity({ doc }: { doc: Doc }) {
  const state = useAppState();
  const events = state.audit.filter((e) => e.docId === doc.id).reverse();
  if (!events.length) return <p className="pane-empty">No activity recorded yet.</p>;
  return (
    <ul className="activity">
      {events.map((e) => (
        <li key={e.seq}>
          <Avatar userId={e.userId} size={28} />
          <div>
            <p>
              <b>{userById(e.userId).name}</b> {e.detail.charAt(0).toLowerCase() + e.detail.slice(1)}
            </p>
            <small>
              {fmtDateTime(e.at)} · <span className="mono">#{e.seq} {e.hash.slice(0, 8)}</span>
            </small>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Versions({ doc, onUpload }: { doc: Doc; onUpload: () => void }) {
  return (
    <div>
      <ul className="versions">
        {[...doc.versions].reverse().map((v, i) => (
          <li key={v.v}>
            <span className={`ver-tag${i === 0 ? " on" : ""}`}>v{v.v}</span>
            <div>
              <b>{v.note}</b>
              <small>
                {userById(v.by).name} · {fmtDateTime(v.at)} · {fileSize(v.size)}
              </small>
            </div>
            {v.blobId ? (
              <button className="icon-btn" aria-label={`Download version ${v.v}`} onClick={() => downloadVersion(doc, v.blobId!)}>
                <Download size={16} />
              </button>
            ) : (
              <span className="ver-arch" title="Held in archive storage">
                <Lock size={14} />
              </span>
            )}
          </li>
        ))}
      </ul>
      {doc.status !== "disposed" && (
        <button className="btn btn-ghost btn-sm" onClick={onUpload}>
          <FilePlus2 size={16} /> Upload new version
        </button>
      )}
    </div>
  );
}

export function HoldDialog({ docIds, onClose }: { docIds: string[]; onClose: () => void }) {
  const [caseId, setCaseId] = useState("");
  const [reason, setReason] = useState("");
  const valid = caseId.trim() && reason.trim();
  return (
    <Modal
      title="Place legal hold"
      onClose={onClose}
      width={480}
      footer={
        <>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary btn-sm"
            disabled={!valid}
            onClick={() => {
              placeHold(docIds, caseId.trim().toUpperCase(), reason.trim());
              toast(`Legal hold ${caseId.trim().toUpperCase()} placed on ${docIds.length} document${docIds.length > 1 ? "s" : ""}`);
              onClose();
            }}
          >
            <Gavel size={15} /> Place hold
          </button>
        </>
      }
    >
      <p className="modal-lead">
        Held documents can't be disposed of, even after their retention period ends. The hold is recorded in the
        audit trail.
      </p>
      <label className="field">
        <span>Case reference</span>
        <input value={caseId} onChange={(e) => setCaseId(e.target.value)} placeholder="CASE-124" autoFocus />
      </label>
      <label className="field">
        <span>Reason</span>
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Litigation, regulatory enquiry…" />
      </label>
    </Modal>
  );
}
