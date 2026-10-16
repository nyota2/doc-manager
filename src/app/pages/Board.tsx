import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { ChevronDown, Filter, Gavel, KanbanSquare, Lock, Plus, Search, Table2, X } from "lucide-react";
import { users, workspaces } from "../data/seed";
import { classById, currentUser, setStatus, statusLabel, useAppState } from "../data/store";
import type { Doc, Status } from "../data/types";
import { matches, timeAgo } from "../lib/format";
import { useShell } from "../shellContext";
import { ApprovalBar, Avatar, Empty, FileIcon, Popover, StatusCell, statusOrder, toast } from "../components/ui";

export default function Board() {
  const { workspace } = useParams();
  const state = useAppState();
  const user = currentUser()!;
  const { openDoc, openUpload } = useShell();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [owners, setOwners] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const view = params.get("view") === "kanban" ? "kanban" : "table";

  const ws = workspaces.find((w) => w.key === workspace);
  const allowed = !!ws && user.workspaces.includes(ws.key);

  const docs = useMemo(
    () =>
      state.docs
        .filter((d) => d.workspace === workspace && d.status !== "disposed")
        .filter((d) => !statuses.length || statuses.includes(d.status))
        .filter((d) => !owners.length || owners.includes(d.ownerId))
        .filter((d) => matches([d.title, d.ref, d.fileName, ...d.tags, ...d.fields.map((f) => f.value)], q))
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)),
    [state.docs, workspace, statuses, owners, q],
  );

  if (!ws || !allowed) {
    return (
      <div className="page">
        <Empty icon={<Lock size={22} />} title="You don't have access to this workspace">
          Ask your line manager to request access through the IT service desk.
        </Empty>
      </div>
    );
  }

  const members = users.filter((u) => u.workspaces.includes(ws.key));
  const filtered = statuses.length > 0 || owners.length > 0 || q !== "";
  const setView = (v: "table" | "kanban") =>
    setParams((p) => {
      if (v === "kanban") p.set("view", "kanban");
      else p.delete("view");
      return p;
    });

  return (
    <div className="page board-page">
      <header className="board-head">
        <div className="board-title">
          <span className="ws-badge" style={{ "--c": ws.color } as CSSProperties}>
            {ws.name[0]}
          </span>
          <div>
            <h1>{ws.name}</h1>
            <p>{ws.description}</p>
          </div>
        </div>
        <div className="board-members" title={members.map((m) => m.name).join(", ")}>
          {members.slice(0, 5).map((m) => (
            <Avatar key={m.id} userId={m.id} size={30} />
          ))}
          {members.length > 5 && <span className="more">+{members.length - 5}</span>}
        </div>
      </header>

      <nav className="view-tabs">
        <button className={view === "table" ? "on" : ""} onClick={() => setView("table")}>
          <Table2 size={16} /> Main table
        </button>
        <button className={view === "kanban" ? "on" : ""} onClick={() => setView("kanban")}>
          <KanbanSquare size={16} /> Status board
        </button>
      </nav>

      <div className="toolbar">
        <button className="btn btn-primary btn-sm" onClick={() => openUpload({ workspace: ws.key })}>
          <Plus size={16} /> New document
        </button>
        <label className="tb-search">
          <Search size={15} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search this workspace" />
          {q && (
            <button onClick={() => setQ("")} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </label>

        <Popover
          trigger={(open, toggle) => (
            <button className={`tb-btn${statuses.length ? " active" : ""}${open ? " open" : ""}`} onClick={toggle}>
              <Filter size={15} /> Status{statuses.length ? ` · ${statuses.length}` : ""}
            </button>
          )}
        >
          {() => (
            <div className="menu">
              {statusOrder.map((s) => (
                <label key={s} className="menu-check">
                  <input
                    type="checkbox"
                    checked={statuses.includes(s)}
                    onChange={() => setStatuses((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]))}
                  />
                  <span className={`dot st-${s}`} />
                  {statusLabel[s]}
                </label>
              ))}
            </div>
          )}
        </Popover>

        <Popover
          trigger={(open, toggle) => (
            <button className={`tb-btn${owners.length ? " active" : ""}${open ? " open" : ""}`} onClick={toggle}>
              Owner{owners.length ? ` · ${owners.length}` : ""}
            </button>
          )}
        >
          {() => (
            <div className="menu">
              {members.map((m) => (
                <label key={m.id} className="menu-check">
                  <input
                    type="checkbox"
                    checked={owners.includes(m.id)}
                    onChange={() => setOwners((cur) => (cur.includes(m.id) ? cur.filter((x) => x !== m.id) : [...cur, m.id]))}
                  />
                  <Avatar userId={m.id} size={22} title={false} />
                  {m.name}
                </label>
              ))}
            </div>
          )}
        </Popover>

        {filtered && (
          <button
            className="tb-clear"
            onClick={() => {
              setQ("");
              setStatuses([]);
              setOwners([]);
            }}
          >
            Clear filters
          </button>
        )}
        <span className="tb-count">
          {docs.length} document{docs.length === 1 ? "" : "s"}
        </span>
      </div>

      {view === "table" ? (
        <div className="table-scroll">
          {ws.groups.map((g) => {
            const rows = docs.filter((d) => d.group === g);
            const isCollapsed = collapsed.includes(g);
            if (filtered && rows.length === 0) return null;
            return (
              <section className="bgroup" key={g} style={{ "--c": ws.color } as CSSProperties}>
                <button
                  className={`bgroup-head${isCollapsed ? " collapsed" : ""}`}
                  onClick={() => setCollapsed((c) => (c.includes(g) ? c.filter((x) => x !== g) : [...c, g]))}
                >
                  <ChevronDown size={18} />
                  <b>{g}</b>
                  <small>
                    {rows.length} document{rows.length === 1 ? "" : "s"}
                  </small>
                </button>
                {!isCollapsed && (
                  <div className="tbl">
                    <div className="tr th">
                      <span>Document</span>
                      <span>Record class</span>
                      <span>Owner</span>
                      <span>Status</span>
                      <span>Approval</span>
                      <span>Sensitivity</span>
                      <span>Updated</span>
                    </div>
                    {rows.map((d) => (
                      <Row key={d.id} doc={d} onOpen={() => openDoc(d.id)} />
                    ))}
                    <button className="tr add-row" onClick={() => openUpload({ workspace: ws.key, group: g })}>
                      <span>
                        <Plus size={15} /> Add document
                      </span>
                    </button>
                  </div>
                )}
              </section>
            );
          })}
          {filtered && docs.length === 0 && (
            <Empty icon={<Search size={22} />} title="No documents match these filters" />
          )}
        </div>
      ) : (
        <Kanban docs={docs} onOpen={openDoc} />
      )}
    </div>
  );
}

function Row({ doc, onOpen }: { doc: Doc; onOpen: () => void }) {
  return (
    <div className="tr" onClick={onOpen} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onOpen()}>
      <span className="td-name">
        <FileIcon name={doc.fileName} size="sm" />
        <span className="td-title">
          <b>{doc.title}</b>
          <small className="mono">{doc.ref}</small>
        </span>
        {doc.hold && (
          <span className="td-hold" title={`Legal hold ${doc.hold.caseId}`}>
            <Gavel size={13} />
          </span>
        )}
      </span>
      <span className="td-muted">{classById(doc.classId).name}</span>
      <span className="td-center">
        <Avatar userId={doc.ownerId} size={26} />
      </span>
      <span className="td-status">
        <StatusCell doc={doc} />
      </span>
      <span className="td-center">
        <ApprovalBar doc={doc} />
      </span>
      <span className={`td-sens sens-${doc.sensitivity.toLowerCase()}`}>
        <Lock size={12} /> {doc.sensitivity}
      </span>
      <span className="td-muted">{timeAgo(doc.updatedAt)}</span>
    </div>
  );
}

function Kanban({ docs, onOpen }: { docs: Doc[]; onOpen: (id: string) => void }) {
  const [over, setOver] = useState<Status | null>(null);

  return (
    <div className="kanban">
      {statusOrder.map((s) => {
        const cards = docs.filter((d) => d.status === s);
        return (
          <section
            key={s}
            className={`kb-col${over === s ? " over" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(s);
            }}
            onDragLeave={() => setOver(null)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(null);
              const id = e.dataTransfer.getData("text/doc-id");
              const doc = docs.find((d) => d.id === id);
              if (doc && doc.status !== s) {
                setStatus(id, s);
                toast(`${doc.title} moved to ${statusLabel[s]}`);
              }
            }}
          >
            <header className={`kb-head st-${s}`}>
              {statusLabel[s]} <span>{cards.length}</span>
            </header>
            <div className="kb-cards">
              {cards.map((d) => (
                <article
                  key={d.id}
                  className="kb-card"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/doc-id", d.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onClick={() => onOpen(d.id)}
                >
                  <div className="kb-top">
                    <FileIcon name={d.fileName} size="sm" />
                    <b>{d.title}</b>
                  </div>
                  <p className="mono">{d.ref}</p>
                  <div className="kb-foot">
                    <Avatar userId={d.ownerId} size={24} />
                    <ApprovalBar doc={d} />
                    <span>{timeAgo(d.updatedAt)}</span>
                  </div>
                  {d.hold && (
                    <span className="kb-hold">
                      <Gavel size={12} /> {d.hold.caseId}
                    </span>
                  )}
                </article>
              ))}
              {cards.length === 0 && <p className="kb-empty">Drop documents here</p>}
            </div>
          </section>
        );
      })}
    </div>
  );
}
