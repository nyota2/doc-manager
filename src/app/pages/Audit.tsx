import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Download, Lock, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import { allUsers, canGovern, currentUser, recordExport, useAppState, userById, verifyChain } from "../data/store";
import type { AuditAction } from "../data/types";
import { fmtDateTime, matches } from "../lib/format";
import { useShell } from "../shellContext";
import { Avatar, Empty } from "../components/ui";

const actionLabel: Record<AuditAction, string> = {
  upload: "Upload",
  view: "View",
  download: "Download",
  edit: "Edit",
  status: "Status",
  approve: "Approve",
  reject: "Return",
  version: "Version",
  hold: "Hold",
  release: "Release",
  archive: "Archive",
  dispose: "Dispose",
  signin: "Sign-in",
  export: "Export",
};

const PAGE = 60;

export default function Audit() {
  const state = useAppState();
  const user = currentUser()!;
  const { openDoc } = useShell();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [action, setAction] = useState<AuditAction | "">("");
  const [limit, setLimit] = useState(PAGE);
  const [check, setCheck] = useState<{ ok: boolean; count: number; brokenAt?: number; at: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const who = params.get("user") ?? "";

  const docTitle = useMemo(() => new Map(state.docs.map((d) => [d.id, `${d.title} (${d.ref})`])), [state.docs]);

  const events = useMemo(
    () =>
      state.audit
        .filter((e) => !action || e.action === action)
        .filter((e) => !who || e.userId === who)
        .filter((e) => matches([e.detail, userById(e.userId).name, e.docId ? docTitle.get(e.docId) : "", e.hash], q))
        .reverse(),
    [state.audit, action, who, q, docTitle],
  );

  if (!canGovern(user)) {
    return (
      <div className="page">
        <Empty icon={<Lock size={22} />} title="The audit trail is limited to governance roles" />
      </div>
    );
  }

  const exportCsv = () => {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [
      ["seq", "timestamp", "user", "role", "action", "document", "detail", "prev_hash", "hash"].join(","),
      ...events
        .slice()
        .reverse()
        .map((e) =>
          [
            e.seq,
            e.at,
            esc(userById(e.userId).name),
            esc(userById(e.userId).role),
            e.action,
            esc(e.docId ? docTitle.get(e.docId) ?? e.docId : ""),
            esc(e.detail),
            e.prevHash,
            e.hash,
          ].join(","),
        ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zb-vault-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    recordExport(`Exported ${events.length} audit entries to CSV`);
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Audit trail</h1>
          <p>Every sign-in, view, change, approval and download. Each entry is chained to the one before it.</p>
        </div>
        <div className="head-actions">
          <button
            className="btn btn-ghost btn-sm"
            disabled={checking}
            onClick={async () => {
              setChecking(true);
              const r = await verifyChain();
              setCheck({ ...r, at: new Date().toISOString() });
              setChecking(false);
            }}
          >
            <ShieldCheck size={16} /> {checking ? "Verifying…" : "Verify integrity"}
          </button>
          <button className="btn btn-primary btn-sm" onClick={exportCsv}>
            <Download size={16} /> Export CSV
          </button>
        </div>
      </header>

      {check &&
        (check.ok ? (
          <div className="banner banner-green">
            <ShieldCheck size={18} />
            <span>
              <b>Chain verified.</b> All {check.count} entries match their SHA-256 hashes and links. Checked{" "}
              {fmtDateTime(check.at)}.
            </span>
          </div>
        ) : (
          <div className="banner banner-red">
            <ShieldAlert size={18} />
            <span>
              <b>Integrity exception at entry #{check.brokenAt}.</b> History from this point has been altered. Escalate
              to Group Information Security.
            </span>
          </div>
        ))}

      <div className="toolbar">
        <label className="tb-search">
          <Search size={15} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search detail, document or hash" />
        </label>
        <select className="tb-select" value={action} onChange={(e) => setAction(e.target.value as AuditAction | "")}>
          <option value="">All actions</option>
          {Object.entries(actionLabel).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          className="tb-select"
          value={who}
          onChange={(e) =>
            setParams((p) => {
              if (e.target.value) p.set("user", e.target.value);
              else p.delete("user");
              return p;
            })
          }
        >
          <option value="">Everyone</option>
          {allUsers(state).map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <span className="tb-count">{events.length} entries</span>
      </div>

      <div className="card flush">
        <div className="audit-table">
          <div className="au-row au-head">
            <span>#</span>
            <span>Time</span>
            <span>Person</span>
            <span>Action</span>
            <span>Detail</span>
            <span>Hash</span>
          </div>
          {events.slice(0, limit).map((e) => (
            <div className="au-row" key={e.seq}>
              <span className="mono muted">{e.seq}</span>
              <span className="muted">{fmtDateTime(e.at)}</span>
              <span className="lt-user">
                <Avatar userId={e.userId} size={24} />
                {userById(e.userId).name}
              </span>
              <span>
                <span className={`act act-${e.action}`}>{actionLabel[e.action]}</span>
              </span>
              <span className="au-detail">
                {e.detail}
                {e.docId && (
                  <button className="link" onClick={() => openDoc(e.docId!)}>
                    {docTitle.get(e.docId)}
                  </button>
                )}
              </span>
              <span className="mono au-hash" title={e.hash}>
                {e.hash.slice(0, 10)}…
              </span>
            </div>
          ))}
        </div>
        {events.length > limit && (
          <button className="more-btn" onClick={() => setLimit((l) => l + PAGE)}>
            Show {Math.min(PAGE, events.length - limit)} more
          </button>
        )}
        {events.length === 0 && <Empty icon={<Search size={22} />} title="No entries match" />}
      </div>
    </div>
  );
}
