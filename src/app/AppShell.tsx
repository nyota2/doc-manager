import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Archive,
  Bell,
  ExternalLink,
  House,
  Inbox,
  Lock,
  LogOut,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { Logo } from "../components/Logo";
import { workspaces } from "./data/seed";
import { canGovern, signOut, useAppState, userById, visibleDocs, waitingOn, workspaceByKey } from "./data/store";
import { Avatar, Popover, Toaster } from "./components/ui";
import DocumentPanel from "./components/DocumentPanel";
import UploadDialog from "./components/UploadDialog";
import CommandPalette from "./components/CommandPalette";
import { ShellContext } from "./shellContext";
import type { UploadPreset } from "./shellContext";
import { timeAgo } from "./lib/format";
import "./app.css";

export default function AppShell() {
  const state = useAppState();
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [upload, setUpload] = useState<UploadPreset | null>(null);
  const [searching, setSearching] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const user = state.sessionUserId ? userById(state.sessionUserId) : null;
  const docId = params.get("doc");

  const openDoc = useCallback(
    (id: string) =>
      setParams((p) => {
        p.set("doc", id);
        return p;
      }),
    [setParams],
  );
  const closeDoc = useCallback(
    () =>
      setParams((p) => {
        p.delete("doc");
        return p;
      }),
    [setParams],
  );
  const shell = useMemo(
    () => ({ openDoc, openUpload: (p?: UploadPreset) => setUpload(p ?? {}), openSearch: () => setSearching(true) }),
    [openDoc],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearching(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => setNavOpen(false), [location.pathname]);

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  const docs = visibleDocs(state, user);
  const waiting = waitingOn(state, user.id);
  const gov = canGovern(user);

  return (
    <ShellContext.Provider value={shell}>
      <div className={`app${navOpen ? " nav-open" : ""}`}>
        <header className="top">
          <button className="icon-btn top-menu" onClick={() => setNavOpen((o) => !o)} aria-label="Menu">
            {navOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link to="/app" className="top-brand" aria-label="ZB Vault home">
            <Logo size={30} />
          </Link>

          <button className="top-search" onClick={() => setSearching(true)}>
            <Search size={16} />
            <span>Search documents, references and people</span>
            <kbd>Ctrl K</kbd>
          </button>

          <div className="top-right">
            <button className="btn btn-primary btn-sm top-new" onClick={() => setUpload({})}>
              <Plus size={17} /> <span>New document</span>
            </button>

            <Popover
              align="end"
              trigger={(_, toggle) => (
                <button className="icon-btn bell" onClick={toggle} aria-label={`${waiting.length} waiting for you`}>
                  <Bell size={19} />
                  {waiting.length > 0 && <em>{waiting.length}</em>}
                </button>
              )}
            >
              {(close) => (
                <div className="menu notif">
                  <p className="menu-title">Waiting for your approval</p>
                  {waiting.length === 0 && <p className="menu-empty">You're all caught up.</p>}
                  {waiting.slice(0, 6).map((d) => (
                    <button
                      key={d.id}
                      className="notif-item"
                      onClick={() => {
                        openDoc(d.id);
                        close();
                      }}
                    >
                      <i style={{ background: workspaceByKey(d.workspace).color }} />
                      <span>
                        <b>{d.title}</b>
                        <small>
                          {workspaceByKey(d.workspace).name} · {timeAgo(d.updatedAt)}
                        </small>
                      </span>
                    </button>
                  ))}
                  <Link className="menu-link" to="/app/approvals" onClick={close}>
                    Open my approvals
                  </Link>
                </div>
              )}
            </Popover>

            <Popover
              align="end"
              trigger={(_, toggle) => (
                <button className="me-btn" onClick={toggle} aria-label="Account">
                  <Avatar userId={user.id} size={34} title={false} />
                </button>
              )}
            >
              {(close) => (
                <div className="menu me-menu">
                  <div className="me-head">
                    <Avatar userId={user.id} size={40} title={false} />
                    <div>
                      <b>{user.name}</b>
                      <small>{user.role}</small>
                    </div>
                  </div>
                  <p className="me-ws">Access: {user.workspaces.map((w) => workspaceByKey(w).name).join(", ")}</p>
                  <Link className="menu-item" to="/" onClick={close}>
                    <ExternalLink size={16} /> ZB Vault website
                  </Link>
                  <button
                    className="menu-item"
                    onClick={() => {
                      signOut();
                      navigate("/login");
                    }}
                  >
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              )}
            </Popover>
          </div>
        </header>

        <aside className="side">
          <nav className="side-nav">
            <NavLink to="/app" end>
              <House size={18} /> Home
            </NavLink>
            <NavLink to="/app/approvals">
              <Inbox size={18} /> My approvals
              {waiting.length > 0 && <em>{waiting.length}</em>}
            </NavLink>
            <button onClick={() => setSearching(true)}>
              <Search size={18} /> Search
            </button>
          </nav>

          <p className="side-label">Workspaces</p>
          <nav className="side-nav">
            {workspaces
              .filter((w) => user.workspaces.includes(w.key))
              .map((w) => (
                <NavLink key={w.key} to={`/app/w/${w.key}`}>
                  <i className="ws-dot" style={{ "--c": w.color } as CSSProperties} />
                  {w.name}
                  <span className="side-count">
                    {docs.filter((d) => d.workspace === w.key && d.status !== "disposed").length}
                  </span>
                </NavLink>
              ))}
          </nav>

          {gov && (
            <>
              <p className="side-label">Governance</p>
              <nav className="side-nav">
                <NavLink to="/app/records">
                  <Archive size={18} /> Records &amp; retention
                </NavLink>
                <NavLink to="/app/audit">
                  <ShieldCheck size={18} /> Audit trail
                </NavLink>
              </nav>
            </>
          )}

          <div className="side-foot">
            <Lock size={14} />
            <span>Encrypted and held in ZBFH data centres</span>
          </div>
        </aside>
        <div className="side-scrim" onClick={() => setNavOpen(false)} />

        <main className="main">
          <Outlet />
        </main>
      </div>

      {docId && <DocumentPanel key={docId} id={docId} onClose={closeDoc} />}
      {upload && <UploadDialog preset={upload} onClose={() => setUpload(null)} />}
      {searching && <CommandPalette onClose={() => setSearching(false)} />}
      <Toaster />
    </ShellContext.Provider>
  );
}
