import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import { setStatus, statusLabel, userById } from "../data/store";
import type { Doc, Status } from "../data/types";
import { extOf, initials } from "../lib/format";

/* Avatar ------------------------------------------------------------------- */

export function Avatar({ userId, size = 28, title = true }: { userId: string; size?: number; title?: boolean }) {
  const u = userById(userId);
  return (
    <span
      className="av"
      title={title ? `${u.name}${u.role ? ` · ${u.role}` : ""}` : undefined}
      style={{ "--av": u.color, width: size, height: size, fontSize: Math.round(size * 0.38) } as CSSProperties}
    >
      {initials(u.name)}
    </span>
  );
}

/* File type tile ------------------------------------------------------------ */

export function FileIcon({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const ext = extOf(name);
  const known = ["pdf", "docx", "doc", "xlsx", "xls", "csv", "png", "jpg", "jpeg", "zip", "txt"];
  return <span className={`fi fi-${size} fi-${known.includes(ext) ? ext : "file"}`}>{ext.slice(0, 4)}</span>;
}

/* Status ------------------------------------------------------------------- */

export const statusOrder: Status[] = ["filed", "review", "stuck", "returned", "approved", "archived"];

export function StatusPill({ status }: { status: Status }) {
  return <span className={`pill st-${status}`}>{statusLabel[status]}</span>;
}

/** Full-colour status cell that opens a picker. */
export function StatusCell({ doc, editable = true }: { doc: Doc; editable?: boolean }) {
  const canEdit = editable && doc.status !== "disposed";
  return (
    <Popover
      align="center"
      trigger={(open, toggle) => (
        <button
          type="button"
          className={`status-cell st-${doc.status}${open ? " open" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            if (canEdit) toggle();
          }}
          disabled={!canEdit}
        >
          {statusLabel[doc.status]}
        </button>
      )}
    >
      {(close) => (
        <div className="status-menu" onClick={(e) => e.stopPropagation()}>
          {statusOrder.map((s) => (
            <button
              key={s}
              className={`status-cell st-${s}`}
              onClick={() => {
                setStatus(doc.id, s);
                close();
              }}
            >
              {statusLabel[s]}
              {s === doc.status && <Check size={14} strokeWidth={3} />}
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}

/* Approval progress --------------------------------------------------------- */

export function ApprovalBar({ doc }: { doc: Doc }) {
  if (!doc.approval.length) return <span className="muted-dash">—</span>;
  const done = doc.approval.filter((a) => a.state === "approved").length;
  return (
    <span className="appr" title={doc.approval.map((a) => `${a.label}: ${a.state}`).join("\n")}>
      <span className="appr-bar">
        {doc.approval.map((a) => (
          <i key={a.id} className={`appr-${a.state}`} />
        ))}
      </span>
      <span className="appr-count">
        {done}/{doc.approval.length}
      </span>
    </span>
  );
}

/* Popover ------------------------------------------------------------------- */

export function Popover({
  trigger,
  children,
  align = "start",
}: {
  trigger: (open: boolean, toggle: () => void) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "start" | "end" | "center";
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<CSSProperties>({});
  const ref = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  // The panel is portalled and fixed-positioned so scrolling tables never clip it.
  useEffect(() => {
    if (!open) return;
    const place = () => {
      const r = ref.current!.getBoundingClientRect();
      const h = panel.current?.offsetHeight ?? 0;
      const w = panel.current?.offsetWidth ?? 0;
      const below = r.bottom + 6 + h < window.innerHeight;
      let left = align === "end" ? r.right - w : align === "center" ? r.left + r.width / 2 - w / 2 : r.left;
      left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
      setPos({ top: below ? r.bottom + 6 : Math.max(8, r.top - h - 6), left });
    };
    place();
    const raf = requestAnimationFrame(place);
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!ref.current?.contains(t) && !panel.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onScroll = (e: Event) => {
      if (panel.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, align]);

  return (
    <div className="pop" ref={ref}>
      {trigger(open, () => setOpen((o) => !o))}
      {open &&
        createPortal(
          <div className="pop-panel" ref={panel} style={pos}>
            {children(() => setOpen(false))}
          </div>,
          document.body,
        )}
    </div>
  );
}

/* Modal --------------------------------------------------------------------- */

export function Modal({
  title,
  onClose,
  children,
  footer,
  width = 560,
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        // Portals still bubble through the React tree; keep the click from closing what's underneath.
        e.stopPropagation();
        onClose();
      }}
    >
      <div className="modal" style={{ maxWidth: width }} onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/* Toasts -------------------------------------------------------------------- */

type Toast = { id: number; text: string; action?: { label: string; run: () => void } };
let toasts: Toast[] = [];
const toastListeners = new Set<() => void>();
let toastId = 0;

export function toast(text: string, action?: Toast["action"]) {
  const t = { id: ++toastId, text, action };
  toasts = [...toasts, t];
  toastListeners.forEach((l) => l());
  window.setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== t.id);
    toastListeners.forEach((l) => l());
  }, 5000);
}

export function Toaster() {
  const list = useSyncExternalStore(
    (fn) => {
      toastListeners.add(fn);
      return () => toastListeners.delete(fn);
    },
    () => toasts,
  );
  return createPortal(
    <div className="toasts" aria-live="polite">
      {list.map((t) => (
        <div className="toast" key={t.id}>
          <Check size={16} strokeWidth={2.6} />
          <span>{t.text}</span>
          {t.action && (
            <button
              onClick={() => {
                t.action!.run();
                toasts = toasts.filter((x) => x.id !== t.id);
                toastListeners.forEach((l) => l());
              }}
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>,
    document.body,
  );
}

/* Empty state --------------------------------------------------------------- */

export function Empty({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <span className="empty-icon">{icon}</span>
      <b>{title}</b>
      {children && <p>{children}</p>}
    </div>
  );
}
