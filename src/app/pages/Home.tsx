import { useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CircleCheck, CloudUpload, TriangleAlert } from "lucide-react";
import { workspaces } from "../data/seed";
import {
  canGovern,
  currentUser,
  isDueForDisposal,
  pendingStep,
  statusLabel,
  useAppState,
  userById,
  visibleDocs,
  waitingOn,
  workspaceByKey,
} from "../data/store";
import type { Status } from "../data/types";
import { greeting, timeAgo } from "../lib/format";
import { useShell } from "../shellContext";
import { Avatar, Empty, FileIcon, StatusPill, statusOrder } from "../components/ui";

const WEEK = 7 * 86_400_000;
const QUIET_ACTIONS = new Set(["view", "signin"]);

export default function Home() {
  const state = useAppState();
  const user = currentUser()!;
  const { openDoc, openUpload } = useShell();
  const [dragging, setDragging] = useState(false);

  const docs = visibleDocs(state, user).filter((d) => d.status !== "disposed");
  const ids = new Set(docs.map((d) => d.id));
  const waiting = waitingOn(state, user.id);
  const filedThisWeek = docs.filter((d) => Date.now() - new Date(d.createdAt).getTime() < WEEK);
  const attention = docs.filter((d) => (d.status === "stuck" || d.status === "returned") && (d.ownerId === user.id || canGovern(user)));
  const due = canGovern(user) ? docs.filter((d) => isDueForDisposal(d)) : [];
  const activity = state.audit
    .filter((e) => !QUIET_ACTIONS.has(e.action) && (!e.docId || ids.has(e.docId)))
    .slice(-10)
    .reverse();
  const recent = state.recent.map((id) => docs.find((d) => d.id === id)).filter(Boolean).slice(0, 6);
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div
      className={`page home${dragging ? " dropping" : ""}`}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragging(false);
      }}
      onDrop={(e) => {
        if (!e.dataTransfer.files.length) return;
        e.preventDefault();
        setDragging(false);
        openUpload({ files: Array.from(e.dataTransfer.files) });
      }}
    >
      {dragging && (
        <div className="drop-overlay">
          <CloudUpload size={30} />
          <b>Drop to file these documents</b>
        </div>
      )}

      <header className="page-head">
        <div>
          <h1>
            {greeting()}, {user.name.split(" ")[0]}
          </h1>
          <p>
            {today}
            {waiting.length > 0 && (
              <>
                {" · "}
                <Link to="/app/approvals">
                  {waiting.length} document{waiting.length > 1 ? "s" : ""} waiting for your approval
                </Link>
              </>
            )}
          </p>
        </div>
      </header>

      <div className="tiles">
        <Link to="/app/approvals" className="tile">
          <span>Waiting for you</span>
          <b>{waiting.length}</b>
          <small>approval{waiting.length === 1 ? "" : "s"} assigned to you</small>
        </Link>
        <div className="tile">
          <span>Filed this week</span>
          <b>{filedThisWeek.length}</b>
          <small>across your workspaces</small>
        </div>
        <div className="tile">
          <span>Needs attention</span>
          <b className={attention.length ? "warn" : ""}>{attention.length}</b>
          <small>missing information or returned</small>
        </div>
        {canGovern(user) ? (
          <Link to="/app/records" className="tile">
            <span>Due for disposal</span>
            <b className={due.length ? "warn" : ""}>{due.length}</b>
            <small>past their retention period</small>
          </Link>
        ) : (
          <div className="tile">
            <span>In your workspaces</span>
            <b>{docs.length}</b>
            <small>documents</small>
          </div>
        )}
      </div>

      <div className="home-grid">
        <div className="home-col">
          <section className="card">
            <div className="card-head">
              <h2>Waiting for you</h2>
              {waiting.length > 0 && (
                <Link to="/app/approvals" className="card-link">
                  All approvals <ArrowRight size={14} />
                </Link>
              )}
            </div>
            {waiting.length === 0 ? (
              <Empty icon={<CircleCheck size={22} />} title="You're all caught up">
                New approvals assigned to you will appear here.
              </Empty>
            ) : (
              <ul className="rows">
                {waiting.map((d) => (
                  <li key={d.id}>
                    <button className="row-btn" onClick={() => openDoc(d.id)}>
                      <FileIcon name={d.fileName} size="sm" />
                      <span className="row-main">
                        <b>{d.title}</b>
                        <small>
                          <i className="ws-dot" style={{ "--c": workspaceByKey(d.workspace).color } as CSSProperties} />
                          {workspaceByKey(d.workspace).name} · {pendingStep(d)!.label} · from {userById(d.ownerId).name}
                        </small>
                      </span>
                      <span className="row-time">{timeAgo(d.updatedAt)}</span>
                      <span className="btn btn-ghost btn-xs">Review</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Needs attention</h2>
            </div>
            {attention.length === 0 ? (
              <Empty icon={<CircleCheck size={22} />} title="Nothing is blocked" />
            ) : (
              <ul className="rows">
                {attention.map((d) => {
                  const note =
                    d.approval.find((a) => a.state === "rejected")?.comment ??
                    d.tags.find((t) => t.startsWith("missing:"))?.replace("missing: ", "");
                  return (
                    <li key={d.id}>
                      <button className="row-btn" onClick={() => openDoc(d.id)}>
                        <span className="row-warn">
                          <TriangleAlert size={16} />
                        </span>
                        <span className="row-main">
                          <b>{d.title}</b>
                          <small>{note ? note.charAt(0).toUpperCase() + note.slice(1) : statusLabel[d.status]}</small>
                        </span>
                        <StatusPill status={d.status} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {recent.length > 0 && (
            <section className="card">
              <div className="card-head">
                <h2>Recently opened</h2>
              </div>
              <div className="recent">
                {recent.map((d) => (
                  <button key={d!.id} className="recent-item" onClick={() => openDoc(d!.id)}>
                    <FileIcon name={d!.fileName} size="sm" />
                    <span>
                      <b>{d!.title}</b>
                      <small>{workspaceByKey(d!.workspace).name}</small>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="home-col">
          <section className="card">
            <div className="card-head">
              <h2>Workspaces</h2>
            </div>
            <ul className="ws-list">
              {workspaces
                .filter((w) => user.workspaces.includes(w.key))
                .map((w) => {
                  const wsDocs = docs.filter((d) => d.workspace === w.key);
                  return (
                    <li key={w.key}>
                      <Link to={`/app/w/${w.key}`}>
                        <span className="ws-name">
                          <i className="ws-dot" style={{ "--c": w.color } as CSSProperties} />
                          {w.name}
                          <small>{wsDocs.length}</small>
                        </span>
                        <span className="battery" aria-label="Documents by status">
                          {statusOrder.map((s: Status) => {
                            const n = wsDocs.filter((d) => d.status === s).length;
                            return n ? <i key={s} className={`st-${s}`} style={{ flexGrow: n }} title={`${statusLabel[s]}: ${n}`} /> : null;
                          })}
                        </span>
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Recent activity</h2>
              {canGovern(user) && (
                <Link to="/app/audit" className="card-link">
                  Audit trail <ArrowRight size={14} />
                </Link>
              )}
            </div>
            <ul className="feed">
              {activity.map((e) => {
                const d = e.docId ? state.docs.find((x) => x.id === e.docId) : null;
                return (
                  <li key={e.seq}>
                    <Avatar userId={e.userId} size={28} />
                    <p>
                      <b>{userById(e.userId).name}</b> {e.detail.charAt(0).toLowerCase() + e.detail.slice(1)}
                      {d && (
                        <>
                          {" · "}
                          <button className="link" onClick={() => openDoc(d.id)}>
                            {d.title}
                          </button>
                        </>
                      )}
                      <small>{timeAgo(e.at)}</small>
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
