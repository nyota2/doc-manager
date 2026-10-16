// Client-side store for ZB Vault. Every screen reads and writes through these
// functions, so they can later be backed by the real API without UI changes.

import { useSyncExternalStore } from "react";
import { addYears, approvalRoutes, buildSeedDocs, retentionClasses, users, workspaces } from "./seed";
import { deleteBlob, putBlob } from "./blobs";
import type { AuditAction, AuditEvent, Doc, Sensitivity, State, Status, User, WorkspaceKey } from "./types";

const KEY = "zbvault:v1";
const VERSION = 2;
const GENESIS = "0".repeat(64);

let state: State = load() ?? seed();
const listeners = new Set<() => void>();

function load(): State | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as State;
    return parsed.version === VERSION ? parsed : null;
  } catch {
    return null;
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked: the session keeps working in memory.
  }
}

function set(next: State) {
  state = next;
  persist();
  listeners.forEach((l) => l());
}

function patchDoc(id: string, fn: (d: Doc) => Doc) {
  set({ ...state, docs: state.docs.map((d) => (d.id === id ? fn(d) : d)) });
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const getState = () => state;
export const useAppState = () => useSyncExternalStore(subscribe, getState);

/* --------------------------------------------------------------------------
   Audit trail: each entry's hash covers the previous entry's hash, so any
   edit to history breaks the chain from that point on.
   -------------------------------------------------------------------------- */

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

const canonical = (e: Omit<AuditEvent, "hash">) =>
  [e.seq, e.at, e.userId, e.action, e.docId ?? "", e.detail, e.prevHash].join("|");

type NewEvent = { userId: string; action: AuditAction; docId?: string; detail: string; at?: string };

let auditQueue = Promise.resolve();

function audit(e: NewEvent) {
  auditQueue = auditQueue.then(async () => {
    const last = state.audit[state.audit.length - 1];
    const base = {
      seq: (last?.seq ?? 0) + 1,
      at: e.at ?? new Date().toISOString(),
      userId: e.userId,
      action: e.action,
      docId: e.docId,
      detail: e.detail,
      prevHash: last?.hash ?? GENESIS,
    };
    const hash = await sha256(canonical(base));
    set({ ...state, audit: [...state.audit, { ...base, hash }] });
  });
  return auditQueue;
}

export async function verifyChain() {
  let prev = GENESIS;
  for (const e of state.audit) {
    const { hash, ...rest } = e;
    if (rest.prevHash !== prev || (await sha256(canonical(rest))) !== hash) {
      return { ok: false as const, count: state.audit.length, brokenAt: e.seq };
    }
    prev = hash;
  }
  return { ok: true as const, count: state.audit.length };
}

/* --------------------------------------------------------------------------
   First run: seed records and replay their history into the audit chain.
   -------------------------------------------------------------------------- */

function seed(): State {
  const docs = buildSeedDocs();
  const history: NewEvent[] = [];
  for (const d of docs) {
    history.push({ userId: d.ownerId, action: "upload", docId: d.id, detail: `Uploaded ${d.fileName}`, at: d.createdAt });
    for (const s of d.approval) {
      if (s.state === "approved") history.push({ userId: s.userId, action: "approve", docId: d.id, detail: `Approved as ${s.label}`, at: s.at });
      if (s.state === "rejected") history.push({ userId: s.userId, action: "reject", docId: d.id, detail: `Returned: ${s.comment ?? ""}`, at: s.at });
    }
    if (d.status === "archived") history.push({ userId: "u1", action: "archive", docId: d.id, detail: "Moved to archive", at: d.updatedAt });
    if (d.hold) history.push({ userId: d.hold.by, action: "hold", docId: d.id, detail: `Legal hold ${d.hold.caseId}: ${d.hold.reason}`, at: d.hold.at });
  }
  history.sort((a, b) => (a.at! < b.at! ? -1 : 1));
  queueMicrotask(() => history.forEach((h) => audit(h)));
  return { version: VERSION, sessionUserId: null, docs, audit: [], recent: [] };
}

/* --------------------------------------------------------------------------
   Lookups
   -------------------------------------------------------------------------- */

export const allUsers = (s: State = state) => [...users, ...(s.extraUsers ?? [])];
export const userById = (id: string): User =>
  allUsers().find((u) => u.id === id) ?? { id, name: "Unknown user", role: "", username: "", color: "#8f9792", workspaces: [] };
export const workspaceByKey = (k: WorkspaceKey) => workspaces.find((w) => w.key === k)!;
export const classById = (id: string) => retentionClasses.find((c) => c.id === id)!;
export const currentUser = () => (state.sessionUserId ? userById(state.sessionUserId) : null);

/** Records, retention and audit are limited to governance roles. */
const PILOT_ROLE = "Pilot user";
const GOVERNANCE_ROLES = ["Group Records Manager", "Group Legal Counsel", "Head of Compliance", PILOT_ROLE];
export const canGovern = (u: User) => GOVERNANCE_ROLES.includes(u.role);

export const visibleDocs =(s: State, u: User) => s.docs.filter((d) => u.workspaces.includes(d.workspace));
export const pendingStep = (d: Doc) => d.approval.find((a) => a.state === "pending");
export const waitingOn = (s: State, userId: string) =>
  s.docs.filter((d) => d.status === "review" && pendingStep(d)?.userId === userId);

export const isDueForDisposal = (d: Doc, now = Date.now()) =>
  d.status !== "disposed" && !!d.retainUntil && new Date(d.retainUntil).getTime() < now;

/* --------------------------------------------------------------------------
   Session
   -------------------------------------------------------------------------- */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PILOT_COLORS = ["#4c8ef7", "#f08c2e", "#9d5bd2", "#0aa5b8", "#e04f5f", "#22a85a", "#d97706", "#4f46e5"];

/** Until Active Directory is connected, any email address gets a pilot account with full access. */
function pilotFromEmail(email: string): User {
  const local = email.split("@")[0];
  const name =
    local
      .replace(/\d+/g, " ")
      .split(/[._\-+\s]+/)
      .filter(Boolean)
      .map((p) => p[0].toUpperCase() + p.slice(1))
      .join(" ") || local;
  const hash = [...email].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  return {
    id: `g-${email}`,
    name,
    role: PILOT_ROLE,
    username: email,
    color: PILOT_COLORS[hash % PILOT_COLORS.length],
    workspaces: ["banking", "insurance", "investment", "compliance", "hr"],
  };
}

/** Resolves a username or email. An empty login is the SSO path, which uses the device's signed-in identity. */
export function findUser(login: string) {
  const raw = login.trim().toLowerCase();
  if (raw === "") return users[0];
  const known = users.find((u) => u.username === raw.split("@")[0]) ?? state.extraUsers?.find((u) => u.username === raw);
  if (known) return known;
  return EMAIL.test(raw) ? pilotFromEmail(raw) : null;
}

export function signIn(login: string) {
  const user = findUser(login);
  if (!user) return null;
  const isNew = user.role === PILOT_ROLE && !state.extraUsers?.some((u) => u.id === user.id);
  set({ ...state, sessionUserId: user.id, extraUsers: isNew ? [...(state.extraUsers ?? []), user] : state.extraUsers });
  audit({ userId: user.id, action: "signin", detail: "Signed in with MFA" });
  return user;
}

export function signOut() {
  set({ ...state, sessionUserId: null });
}

const me = () => {
  if (!state.sessionUserId) throw new Error("Not signed in");
  return state.sessionUserId;
};

/* --------------------------------------------------------------------------
   Document actions
   -------------------------------------------------------------------------- */

export type UploadOptions = {
  workspace: WorkspaceKey;
  group: string;
  classId: string;
  sensitivity: Sensitivity;
  routeForApproval: boolean;
  tags: string[];
};

const refPrefix: Record<WorkspaceKey, string> = { banking: "BNK", insurance: "INS", investment: "INV", compliance: "CMP", hr: "HR" };

export const titleFromFile = (name: string) =>
  name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());

export async function uploadFiles(files: File[], opts: UploadOptions) {
  const userId = me();
  const created: Doc[] = [];
  for (const file of files) {
    const blobId = await putBlob(file);
    const now = new Date().toISOString();
    const route = opts.routeForApproval ? approvalRoutes[opts.classId] ?? [] : [];
    const seq = state.docs.length + created.length;
    const doc: Doc = {
      id: crypto.randomUUID(),
      ref: `${refPrefix[opts.workspace]}-${new Date().getFullYear()}-${String(60_000 + seq).padStart(6, "0")}`,
      title: titleFromFile(file.name),
      fileName: file.name,
      mime: file.type || "application/octet-stream",
      workspace: opts.workspace,
      group: opts.group,
      classId: opts.classId,
      sensitivity: opts.sensitivity,
      ownerId: userId,
      status: route.length ? "review" : "filed",
      tags: opts.tags,
      fields: [],
      createdAt: now,
      updatedAt: now,
      versions: [{ v: 1, at: now, by: userId, note: "Original upload", size: file.size, blobId }],
      approval: route.map(([uid, label], i) => ({
        id: crypto.randomUUID(),
        userId: uid,
        label,
        state: i === 0 ? "pending" : "waiting",
      })),
      retainUntil: addYears(now, classById(opts.classId).years),
    };
    created.push(doc);
  }
  set({ ...state, docs: [...created, ...state.docs] });
  created.forEach((d) =>
    audit({ userId, action: "upload", docId: d.id, detail: `Uploaded ${d.fileName} to ${workspaceByKey(d.workspace).name} › ${d.group}` }),
  );
  return created;
}

export function recordView(docId: string) {
  const userId = me();
  set({ ...state, recent: [docId, ...state.recent.filter((r) => r !== docId)].slice(0, 12) });
  audit({ userId, action: "view", docId, detail: "Opened document" });
}

export function recordDownload(docId: string) {
  audit({ userId: me(), action: "download", docId, detail: "Downloaded current version" });
}

export const statusLabel: Record<Status, string> = {
  filed: "Filed",
  review: "In review",
  stuck: "Missing info",
  returned: "Returned",
  approved: "Approved",
  archived: "Archived",
  disposed: "Disposed",
};

export function setStatus(docId: string, status: Status) {
  const doc = state.docs.find((d) => d.id === docId);
  if (!doc || doc.status === status) return;
  patchDoc(docId, (d) => ({ ...d, status, updatedAt: new Date().toISOString() }));
  audit({ userId: me(), action: "status", docId, detail: `Status ${statusLabel[doc.status]} → ${statusLabel[status]}` });
}

export function updateDoc(docId: string, patch: Partial<Pick<Doc, "title" | "group" | "sensitivity" | "tags" | "fields">>, detail: string) {
  patchDoc(docId, (d) => ({ ...d, ...patch, updatedAt: new Date().toISOString() }));
  audit({ userId: me(), action: "edit", docId, detail });
}

export function approve(docId: string, comment?: string) {
  const userId = me();
  const doc = state.docs.find((d) => d.id === docId);
  const step = doc && pendingStep(doc);
  if (!doc || !step || step.userId !== userId) return false;
  const now = new Date().toISOString();
  const idx = doc.approval.indexOf(step);
  const approval = doc.approval.map((s, i) =>
    i === idx ? { ...s, state: "approved" as const, at: now, comment } : i === idx + 1 ? { ...s, state: "pending" as const } : s,
  );
  const finished = idx === doc.approval.length - 1;
  patchDoc(docId, (d) => ({ ...d, approval, status: finished ? "approved" : "review", updatedAt: now }));
  audit({ userId, action: "approve", docId, detail: `Approved as ${step.label}${comment ? `: ${comment}` : ""}` });
  return true;
}

export function reject(docId: string, comment: string) {
  const userId = me();
  const doc = state.docs.find((d) => d.id === docId);
  const step = doc && pendingStep(doc);
  if (!doc || !step || step.userId !== userId) return false;
  const now = new Date().toISOString();
  patchDoc(docId, (d) => ({
    ...d,
    status: "returned",
    updatedAt: now,
    approval: d.approval.map((s) => (s.id === step.id ? { ...s, state: "rejected" as const, at: now, comment } : s)),
  }));
  audit({ userId, action: "reject", docId, detail: `Returned at ${step.label}: ${comment}` });
  return true;
}

export function resubmit(docId: string) {
  patchDoc(docId, (d) => ({
    ...d,
    status: "review",
    updatedAt: new Date().toISOString(),
    approval: d.approval.map((s) => (s.state === "rejected" ? { ...s, state: "pending" as const, at: undefined, comment: undefined } : s)),
  }));
  audit({ userId: me(), action: "status", docId, detail: "Resubmitted for approval" });
}

export async function addVersion(docId: string, file: File, note: string) {
  const userId = me();
  const blobId = await putBlob(file);
  const now = new Date().toISOString();
  patchDoc(docId, (d) => ({
    ...d,
    fileName: file.name,
    mime: file.type || d.mime,
    updatedAt: now,
    versions: [...d.versions, { v: d.versions.length + 1, at: now, by: userId, note: note || "New version", size: file.size, blobId }],
  }));
  audit({ userId, action: "version", docId, detail: `Uploaded version ${state.docs.find((d) => d.id === docId)!.versions.length}: ${note || file.name}` });
}

export function placeHold(docIds: string[], caseId: string, reason: string) {
  const userId = me();
  const at = new Date().toISOString();
  set({ ...state, docs: state.docs.map((d) => (docIds.includes(d.id) ? { ...d, hold: { caseId, reason, by: userId, at } } : d)) });
  docIds.forEach((docId) => audit({ userId, action: "hold", docId, detail: `Legal hold ${caseId}: ${reason}` }));
}

export function releaseHold(docId: string) {
  const doc = state.docs.find((d) => d.id === docId);
  if (!doc?.hold) return;
  patchDoc(docId, (d) => ({ ...d, hold: undefined }));
  audit({ userId: me(), action: "release", docId, detail: `Released legal hold ${doc.hold.caseId}` });
}

export function archive(docId: string) {
  patchDoc(docId, (d) => ({ ...d, status: "archived", updatedAt: new Date().toISOString() }));
  audit({ userId: me(), action: "archive", docId, detail: "Moved to archive" });
}

/** Defensible disposal: file contents are destroyed, the record and its history remain. */
export async function dispose(docId: string) {
  const doc = state.docs.find((d) => d.id === docId);
  if (!doc || doc.hold) return false;
  await Promise.all(doc.versions.filter((v) => v.blobId).map((v) => deleteBlob(v.blobId!)));
  patchDoc(docId, (d) => ({
    ...d,
    status: "disposed",
    fields: [],
    updatedAt: new Date().toISOString(),
    versions: d.versions.map((v) => ({ ...v, blobId: undefined })),
  }));
  audit({ userId: me(), action: "dispose", docId, detail: `Disposed under schedule "${classById(doc.classId).name}"` });
  return true;
}

export function recordExport(detail: string) {
  audit({ userId: me(), action: "export", detail });
}
