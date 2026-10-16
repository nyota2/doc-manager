import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Archive, CornerDownLeft, House, Inbox, Plus, Search, ShieldCheck } from "lucide-react";
import { users, workspaces } from "../data/seed";
import { canGovern, currentUser, statusLabel, useAppState, userById, visibleDocs, workspaceByKey } from "../data/store";
import { matches, timeAgo } from "../lib/format";
import { useShell } from "../shellContext";
import { Avatar, FileIcon } from "./ui";

type Item = { id: string; section: string; icon: ReactNode; title: string; meta: string; run: () => void };

export default function CommandPalette({ onClose }: { onClose: () => void }) {
  const state = useAppState();
  const user = currentUser()!;
  const navigate = useNavigate();
  const { openUpload } = useShell();
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const list = useRef<HTMLDivElement>(null);

  const items = useMemo<Item[]>(() => {
    const go = (path: string) => () => {
      navigate(path);
      onClose();
    };
    const docs = visibleDocs(state, user)
      .filter((d) =>
        matches([d.title, d.ref, d.fileName, d.group, ...d.tags, ...d.fields.map((f) => f.value), userById(d.ownerId).name], q),
      )
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      .slice(0, q ? 8 : 5)
      .map<Item>((d) => ({
        id: d.id,
        section: q ? "Documents" : "Recently updated",
        icon: <FileIcon name={d.fileName} size="sm" />,
        title: d.title,
        meta: `${d.ref} · ${workspaceByKey(d.workspace).name} › ${d.group} · ${statusLabel[d.status]} · ${timeAgo(d.updatedAt)}`,
        run: () => {
          navigate(`/app/w/${d.workspace}?doc=${d.id}`);
          onClose();
        },
      }));

    const pages: Item[] = [
      { id: "home", section: "Go to", icon: <House size={16} />, title: "Home", meta: "", run: go("/app") },
      { id: "appr", section: "Go to", icon: <Inbox size={16} />, title: "My approvals", meta: "", run: go("/app/approvals") },
      ...workspaces
        .filter((w) => user.workspaces.includes(w.key))
        .map<Item>((w) => ({
          id: `ws-${w.key}`,
          section: "Go to",
          icon: <i className="ws-dot" style={{ "--c": w.color } as CSSProperties} />,
          title: `${w.name} workspace`,
          meta: w.groups.join(" · "),
          run: go(`/app/w/${w.key}`),
        })),
      ...(canGovern(user)
        ? [
            { id: "rec", section: "Go to", icon: <Archive size={16} />, title: "Records & retention", meta: "", run: go("/app/records") },
            { id: "aud", section: "Go to", icon: <ShieldCheck size={16} />, title: "Audit trail", meta: "", run: go("/app/audit") },
          ]
        : []),
      {
        id: "new",
        section: "Actions",
        icon: <Plus size={16} />,
        title: "Upload a new document",
        meta: "",
        run: () => {
          onClose();
          openUpload();
        },
      },
    ].filter((p) => matches([p.title, p.meta], q));

    const people = q
      ? users
          .filter((u) => matches([u.name, u.role], q))
          .slice(0, 4)
          .map<Item>((u) => ({
            id: u.id,
            section: "People",
            icon: <Avatar userId={u.id} size={22} title={false} />,
            title: u.name,
            meta: u.role,
            run: () => {
              navigate(`/app/audit?user=${u.id}`);
              onClose();
            },
          }))
          .filter(() => canGovern(user))
      : [];

    return [...docs, ...pages, ...people];
  }, [q, state, user, navigate, onClose, openUpload]);

  useEffect(() => setCursor(0), [q]);

  useEffect(() => {
    list.current?.querySelector(`[data-i="${cursor}"]`)?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      items[cursor]?.run();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  let lastSection = "";

  return createPortal(
    <div className="palette-backdrop" onMouseDown={onClose}>
      <div className="palette" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label="Search">
        <div className="palette-input">
          <Search size={18} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search by title, reference, customer, policy or tag"
          />
          <kbd>Esc</kbd>
        </div>
        <div className="palette-list" ref={list}>
          {items.length === 0 && <p className="palette-empty">No documents or pages match “{q}”.</p>}
          {items.map((it, i) => {
            const head = it.section !== lastSection ? it.section : null;
            lastSection = it.section;
            return (
              <div key={it.section + it.id}>
                {head && <p className="palette-section">{head}</p>}
                <button
                  data-i={i}
                  className={`palette-item${i === cursor ? " on" : ""}`}
                  onMouseEnter={() => setCursor(i)}
                  onClick={it.run}
                >
                  <span className="palette-icon">{it.icon}</span>
                  <span className="palette-text">
                    <b>{it.title}</b>
                    {it.meta && <small>{it.meta}</small>}
                  </span>
                  {i === cursor && <CornerDownLeft size={15} className="palette-enter" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}
