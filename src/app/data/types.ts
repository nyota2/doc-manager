export type WorkspaceKey = "banking" | "insurance" | "investment" | "compliance" | "hr";

export type Status = "filed" | "review" | "stuck" | "returned" | "approved" | "archived" | "disposed";

export type Sensitivity = "Internal" | "Confidential" | "Restricted";

export type User = {
  id: string;
  name: string;
  role: string;
  username: string;
  color: string;
  workspaces: WorkspaceKey[];
};

export type Workspace = {
  key: WorkspaceKey;
  name: string;
  color: string;
  description: string;
  groups: string[];
};

export type RetentionClass = {
  id: string;
  workspace: WorkspaceKey;
  name: string;
  years: number | null; // null = keep permanently
  trigger: string;
};

export type ApprovalStep = {
  id: string;
  userId: string;
  label: string;
  state: "waiting" | "pending" | "approved" | "rejected";
  at?: string;
  comment?: string;
};

export type Version = {
  v: number;
  at: string;
  by: string;
  note: string;
  size: number;
  blobId?: string;
};

export type Doc = {
  id: string;
  ref: string;
  title: string;
  fileName: string;
  mime: string;
  workspace: WorkspaceKey;
  group: string;
  classId: string;
  sensitivity: Sensitivity;
  ownerId: string;
  status: Status;
  tags: string[];
  fields: { label: string; value: string }[];
  createdAt: string;
  updatedAt: string;
  versions: Version[];
  approval: ApprovalStep[];
  hold?: { caseId: string; reason: string; by: string; at: string };
  retainUntil: string | null;
};

export type AuditAction =
  | "upload"
  | "view"
  | "download"
  | "edit"
  | "status"
  | "approve"
  | "reject"
  | "version"
  | "hold"
  | "release"
  | "archive"
  | "dispose"
  | "signin"
  | "export";

export type AuditEvent = {
  seq: number;
  at: string;
  userId: string;
  action: AuditAction;
  docId?: string;
  detail: string;
  prevHash: string;
  hash: string;
};

export type State = {
  version: number;
  sessionUserId: string | null;
  /** Pilot accounts created from an email at sign-in, until Active Directory is connected. */
  extraUsers?: User[];
  docs: Doc[];
  audit: AuditEvent[];
  recent: string[];
};
