import { useEffect, useState } from "react";
import { Download, FileX2 } from "lucide-react";
import { LogoMark } from "../../components/Logo";
import { getBlob } from "../data/blobs";
import { recordDownload, workspaceByKey } from "../data/store";
import type { Doc } from "../data/types";
import { extOf, fmtDate } from "../lib/format";
import { FileIcon } from "./ui";

const TEXT_EXT = ["csv", "txt", "json", "md", "log"];
const IMAGE_EXT = ["png", "jpg", "jpeg", "gif", "webp", "svg"];

export async function downloadVersion(doc: Doc, blobId: string, fileName = doc.fileName) {
  const blob = await getBlob(blobId);
  if (!blob) return false;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  recordDownload(doc.id);
  return true;
}

function CsvTable({ text }: { text: string }) {
  const rows = text
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(0, 200)
    .map((r) => r.split(","));
  const [head, ...body] = rows;
  return (
    <div className="pv-csv">
      <table>
        <thead>
          <tr>{head?.map((h, i) => <th key={i}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {body.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Seed records have no binary in this environment; show the indexed copy. */
function IndexedCopy({ doc }: { doc: Doc }) {
  return (
    <div className="pv-paper-wrap">
      <div className="pv-paper">
        <div className="pv-paper-head">
          <LogoMark size={28} />
          <div>
            <b>ZB Financial Holdings</b>
            <small>{workspaceByKey(doc.workspace).name}</small>
          </div>
          <span className="mono">{doc.ref}</span>
        </div>
        <h3>{doc.title}</h3>
        {doc.fields.map((f) => (
          <div className="pv-field" key={f.label}>
            <small>{f.label}</small>
            <span>{f.value}</span>
          </div>
        ))}
        <div className="pv-sign">
          <svg viewBox="0 0 160 40" aria-hidden="true">
            <path d="M6 28c10-20 18-24 20-14s-6 18 2 16 12-22 18-18-4 16 4 16 10-12 16-10 0 10 8 8 12-14 20-12-2 10 8 10 18-6 28-10 16-2 24-4" />
          </svg>
          <small>Signature</small>
        </div>
      </div>
      <p className="pv-note">Indexed copy. The original scan is held in archive storage.</p>
    </div>
  );
}

export default function FilePreview({ doc }: { doc: Doc }) {
  const current = doc.versions[doc.versions.length - 1];
  const ext = extOf(current ? doc.fileName : "");
  const [url, setUrl] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    setUrl(null);
    setText(null);
    setMissing(false);
    if (!current?.blobId) return;
    let objectUrl: string | null = null;
    let alive = true;
    getBlob(current.blobId).then((blob) => {
      if (!alive) return;
      if (!blob) return setMissing(true);
      if (TEXT_EXT.includes(ext) || blob.type.startsWith("text/")) blob.text().then((t) => alive && setText(t));
      else {
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      }
    });
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [current?.blobId, ext]);

  if (doc.status === "disposed") {
    return (
      <div className="pv-msg">
        <FileX2 size={36} />
        <b>Contents destroyed</b>
        <p>This document was disposed of on {fmtDate(doc.updatedAt)} under its retention schedule. The record and its history are kept.</p>
      </div>
    );
  }

  if (!current?.blobId) return <IndexedCopy doc={doc} />;

  if (missing) {
    return (
      <div className="pv-msg">
        <FileX2 size={36} />
        <b>File not available on this device</b>
        <p>The record exists, but its contents are stored on another device.</p>
      </div>
    );
  }

  if (text !== null) {
    return ext === "csv" ? <CsvTable text={text} /> : <pre className="pv-text">{text.slice(0, 200_000)}</pre>;
  }

  if (!url) return <div className="pv-loading">Loading preview…</div>;

  if (ext === "pdf") return <iframe className="pv-frame" src={url} title={doc.title} />;
  if (IMAGE_EXT.includes(ext)) {
    return (
      <div className="pv-image">
        <img src={url} alt={doc.title} />
      </div>
    );
  }

  return (
    <div className="pv-msg">
      <FileIcon name={doc.fileName} size="lg" />
      <b>No preview for .{ext} files</b>
      <p>Download the file to open it in its usual application.</p>
      <button className="btn btn-ghost btn-sm" onClick={() => downloadVersion(doc, current.blobId!)}>
        <Download size={16} /> Download {doc.fileName}
      </button>
    </div>
  );
}
