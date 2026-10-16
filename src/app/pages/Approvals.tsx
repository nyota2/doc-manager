import { useState } from "react";
import type { CSSProperties } from "react";
import { CircleCheck, Inbox } from "lucide-react";
import { currentUser, pendingStep, useAppState, userById, visibleDocs, waitingOn, workspaceByKey } from "../data/store";
import type { Doc } from "../data/types";
import { timeAgo } from "../lib/format";
import { useShell } from "../shellContext";
import { ApprovalBar, Avatar, Empty, FileIcon, StatusPill } from "../components/ui";

type Tab = "mine" | "done" | "all";

/** When the current step started waiting: the previous step's decision, or upload time. */
const waitingSince = (d: Doc) => {
  const step = pendingStep(d);
  const idx = step ? d.approval.indexOf(step) : -1;
  return (idx > 0 ? d.approval[idx - 1].at : undefined) ?? d.createdAt;
};

export default function Approvals() {
  const state = useAppState();
  const user = currentUser()!;
  const { openDoc } = useShell();
  const [tab, setTab] = useState<Tab>("mine");

  const mine = waitingOn(state, user.id).sort((a, b) => (waitingSince(a) < waitingSince(b) ? -1 : 1));
  const done = visibleDocs(state, user)
    .flatMap((d) =>
      d.approval
        .filter((s) => s.userId === user.id && (s.state === "approved" || s.state === "rejected"))
        .map((s) => ({ d, s })),
    )
    .sort((a, b) => (a.s.at! < b.s.at! ? 1 : -1));
  const all = visibleDocs(state, user).filter((d) => d.status === "review");

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>My approvals</h1>
          <p>Documents that need a decision from you, oldest first.</p>
        </div>
      </header>

      <nav className="view-tabs">
        <button className={tab === "mine" ? "on" : ""} onClick={() => setTab("mine")}>
          Waiting for me <em>{mine.length}</em>
        </button>
        <button className={tab === "done" ? "on" : ""} onClick={() => setTab("done")}>
          Decided by me
        </button>
        <button className={tab === "all" ? "on" : ""} onClick={() => setTab("all")}>
          All in review <em className="soft">{all.length}</em>
        </button>
      </nav>

      <div className="card flush">
        {tab === "mine" &&
          (mine.length === 0 ? (
            <Empty icon={<CircleCheck size={22} />} title="Nothing is waiting for you">
              When someone routes a document to you, it appears here and in your notifications.
            </Empty>
          ) : (
            <div className="list-table">
              <div className="lt-row lt-head">
                <span>Document</span>
                <span>Your step</span>
                <span>Submitted by</span>
                <span>Progress</span>
                <span>Waiting</span>
                <span />
              </div>
              {mine.map((d) => (
                <div className="lt-row" key={d.id} onClick={() => openDoc(d.id)} role="button" tabIndex={0}>
                  <DocCell d={d} />
                  <span>{pendingStep(d)!.label}</span>
                  <span className="lt-user">
                    <Avatar userId={d.ownerId} size={24} />
                    {userById(d.ownerId).name}
                  </span>
                  <span>
                    <ApprovalBar doc={d} />
                  </span>
                  <span className="muted">{timeAgo(waitingSince(d))}</span>
                  <span>
                    <span className="btn btn-primary btn-xs">Review</span>
                  </span>
                </div>
              ))}
            </div>
          ))}

        {tab === "done" &&
          (done.length === 0 ? (
            <Empty icon={<Inbox size={22} />} title="No decisions yet" />
          ) : (
            <div className="list-table lt-done">
              <div className="lt-row lt-head">
                <span>Document</span>
                <span>Step</span>
                <span>Decision</span>
                <span>Comment</span>
                <span>When</span>
              </div>
              {done.map(({ d, s }) => (
                <div className="lt-row" key={s.id} onClick={() => openDoc(d.id)} role="button" tabIndex={0}>
                  <DocCell d={d} />
                  <span>{s.label}</span>
                  <span>
                    <StatusPill status={s.state === "approved" ? "approved" : "returned"} />
                  </span>
                  <span className="muted lt-comment">{s.comment ?? "—"}</span>
                  <span className="muted">{timeAgo(s.at!)}</span>
                </div>
              ))}
            </div>
          ))}

        {tab === "all" && (
          <div className="list-table">
            <div className="lt-row lt-head">
              <span>Document</span>
              <span>Current step</span>
              <span>With</span>
              <span>Progress</span>
              <span>Waiting</span>
              <span />
            </div>
            {all.map((d) => {
              const step = pendingStep(d);
              return (
                <div className="lt-row" key={d.id} onClick={() => openDoc(d.id)} role="button" tabIndex={0}>
                  <DocCell d={d} />
                  <span>{step?.label ?? "—"}</span>
                  <span className="lt-user">
                    {step && <Avatar userId={step.userId} size={24} />}
                    {step ? userById(step.userId).name : ""}
                  </span>
                  <span>
                    <ApprovalBar doc={d} />
                  </span>
                  <span className="muted">{timeAgo(waitingSince(d))}</span>
                  <span />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function DocCell({ d }: { d: Doc }) {
  const ws = workspaceByKey(d.workspace);
  return (
    <span className="lt-doc">
      <FileIcon name={d.fileName} size="sm" />
      <span>
        <b>{d.title}</b>
        <small>
          <i className="ws-dot" style={{ "--c": ws.color } as CSSProperties} />
          {ws.name} › {d.group}
        </small>
      </span>
    </span>
  );
}
