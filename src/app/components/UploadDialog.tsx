import { useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CloudUpload, Sparkles, X } from "lucide-react";
import { approvalRoutes, retentionClasses, workspaces } from "../data/seed";
import { currentUser, uploadFiles, userById } from "../data/store";
import type { Sensitivity, WorkspaceKey } from "../data/types";
import { suggestClass } from "../lib/classify";
import { fileSize } from "../lib/format";
import type { UploadPreset } from "../shellContext";
import { Avatar, FileIcon, Modal, toast } from "./ui";

const MAX_BYTES = 200 * 1024 * 1024;

export default function UploadDialog({ preset, onClose }: { preset: UploadPreset; onClose: () => void }) {
  const user = currentUser()!;
  const navigate = useNavigate();
  const allowed = workspaces.filter((w) => user.workspaces.includes(w.key));
  const startWs = preset.workspace && user.workspaces.includes(preset.workspace) ? preset.workspace : allowed[0].key;

  const [files, setFiles] = useState<File[]>(preset.files ?? []);
  const [workspace, setWorkspace] = useState<WorkspaceKey>(startWs);
  const [group, setGroup] = useState(preset.group ?? allowed.find((w) => w.key === startWs)!.groups[0]);
  const [classId, setClassId] = useState(retentionClasses.find((c) => c.workspace === startWs)!.id);
  const [sensitivity, setSensitivity] = useState<Sensitivity>("Confidential");
  const [route, setRoute] = useState(true);
  const [tags, setTags] = useState("");
  const [suggested, setSuggested] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  const ws = workspaces.find((w) => w.key === workspace)!;
  const classes = retentionClasses.filter((c) => c.workspace === workspace);
  const steps = approvalRoutes[classId] ?? [];

  const chooseWorkspace = (k: WorkspaceKey) => {
    const w = workspaces.find((x) => x.key === k)!;
    setWorkspace(k);
    setGroup(w.groups[0]);
    setClassId(retentionClasses.find((c) => c.workspace === k)!.id);
    setSuggested(false);
  };

  const addFiles = (list: FileList | File[]) => {
    const incoming = Array.from(list);
    const tooBig = incoming.filter((f) => f.size > MAX_BYTES);
    setError(tooBig.length ? `${tooBig.map((f) => f.name).join(", ")} is over the 200 MB limit` : "");
    const ok = incoming.filter((f) => f.size <= MAX_BYTES);
    const next = [...files, ...ok.filter((f) => !files.some((x) => x.name === f.name && x.size === f.size))];
    setFiles(next);

    // Suggest filing from the first file name, within the workspaces this person can use.
    const hint = next[0] && suggestClass(next[0].name);
    if (hint && user.workspaces.includes(hint.workspace) && !preset.group) {
      setWorkspace(hint.workspace);
      setGroup(hint.group);
      setClassId(hint.classId);
      setSuggested(true);
    }
  };

  const totalSize = useMemo(() => files.reduce((n, f) => n + f.size, 0), [files]);

  const submit = async () => {
    if (!files.length) return setError("Add at least one file");
    setBusy(true);
    try {
      const created = await uploadFiles(files, {
        workspace,
        group,
        classId,
        sensitivity,
        routeForApproval: route && steps.length > 0,
        tags: tags
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
      });
      toast(`${created.length} document${created.length > 1 ? "s" : ""} filed to ${ws.name} › ${group}`, {
        label: "View",
        run: () => navigate(`/app/w/${workspace}?doc=${created[0].id}`),
      });
      onClose();
    } catch {
      setError("The files couldn't be saved. Check available storage and try again.");
      setBusy(false);
    }
  };

  return (
    <Modal
      title="New document"
      onClose={onClose}
      width={640}
      footer={
        <>
          <span className="foot-note">{files.length ? `${files.length} file${files.length > 1 ? "s" : ""} · ${fileSize(totalSize)}` : ""}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary btn-sm" onClick={submit} disabled={busy || !files.length}>
            {busy ? <span className="spinner" /> : <>File {files.length > 1 ? `${files.length} documents` : "document"} <ArrowRight size={16} /></>}
          </button>
        </>
      }
    >
      <div
        className={`dropzone${dragging ? " over" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => input.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
      >
        <CloudUpload size={26} />
        <b>Drop files here or click to browse</b>
        <small>PDF, Word, Excel, CSV and images · up to 200 MB each</small>
        <input
          ref={input}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && <p className="form-error">{error}</p>}

      {files.length > 0 && (
        <ul className="upl-files">
          {files.map((f) => (
            <li key={f.name + f.size}>
              <FileIcon name={f.name} size="sm" />
              <span>{f.name}</span>
              <small>{fileSize(f.size)}</small>
              <button className="icon-btn" aria-label={`Remove ${f.name}`} onClick={() => setFiles(files.filter((x) => x !== f))}>
                <X size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {suggested && (
        <p className="suggest">
          <Sparkles size={14} /> Filing suggested from the file name. Change anything that's wrong.
        </p>
      )}

      <div className="form-grid">
        <label className="field">
          <span>Workspace</span>
          <select value={workspace} onChange={(e) => chooseWorkspace(e.target.value as WorkspaceKey)}>
            {allowed.map((w) => (
              <option key={w.key} value={w.key}>
                {w.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Group</span>
          <select value={group} onChange={(e) => setGroup(e.target.value)}>
            {ws.groups.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Record class</span>
          <select
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setSuggested(false);
            }}
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.years ? `${c.years} yrs` : "permanent"}
              </option>
            ))}
          </select>
        </label>
        <div className="field">
          <span>Sensitivity</span>
          <div className="segmented">
            {(["Internal", "Confidential", "Restricted"] as Sensitivity[]).map((s) => (
              <button key={s} type="button" className={sensitivity === s ? "on" : ""} onClick={() => setSensitivity(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <label className="field">
        <span>Tags</span>
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Comma separated, e.g. home loan, branch 04" />
      </label>

      <div className={`route${steps.length ? "" : " route-none"}`}>
        <label className="switch">
          <input type="checkbox" checked={route && steps.length > 0} disabled={!steps.length} onChange={(e) => setRoute(e.target.checked)} />
          <span />
          {steps.length ? "Send for approval" : "No approval route for this record class"}
        </label>
        {steps.length > 0 && route && (
          <ol className="route-steps">
            {steps.map(([uid, label], i) => (
              <li key={uid + label} style={{ "--i": i } as CSSProperties}>
                <Avatar userId={uid} size={26} />
                <span>
                  <b>{label}</b>
                  <small>{userById(uid).name}</small>
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Modal>
  );
}
