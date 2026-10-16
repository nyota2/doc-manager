import type { CSSProperties } from "react";
import { Check, FolderCheck, ScanLine } from "lucide-react";
import { LogoMark } from "../Logo";
import { statusLabel } from "./heroStories";
import type { Story } from "./heroStories";

export const STAGE_W = 600;
export const STAGE_H = 500;

const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

function Board({ story }: { story: Story }) {
  return (
    <div className="board" style={{ "--grp": story.color } as CSSProperties}>
      <div className="board-top">
        <div>
          <span className="board-crumb">{story.board.workspace} workspace</span>
          <h4>{story.board.title}</h4>
        </div>
        <div className="board-people">
          <span className="avatar" style={{ "--av": "#f08c2e" } as CSSProperties}>RM</span>
          <span className="avatar" style={{ "--av": "#4c8ef7" } as CSSProperties}>KM</span>
          <span className="avatar" style={{ "--av": "#9d5bd2" } as CSSProperties}>TC</span>
          <span className="board-more">+12</span>
        </div>
      </div>
      <div className="board-tabs">
        <span className="on">Main table</span>
        <span>Kanban</span>
        <span>Calendar</span>
      </div>

      <div className="board-group-title">{story.board.group}</div>
      <div className="b-table">
        <div className="b-row b-head">
          <span>Document</span>
          <span>Owner</span>
          <span>Status</span>
          <span>Date</span>
        </div>

        <div className="b-row b-new">
          <span className="b-name">{story.newRow.name}</span>
          <span className="b-owner">
            <span className="avatar" style={{ "--av": story.newRow.ownerColor } as CSSProperties}>
              {story.newRow.owner}
            </span>
          </span>
          <span className="b-swap">
            <span className="b-status st-review">In review</span>
            <span className="b-status st-approved">Approved</span>
          </span>
          <span className="b-date">Today</span>
        </div>

        {story.board.rows.map((r) => (
          <div className="b-row" key={r.name}>
            <span className="b-name">{r.name}</span>
            <span className="b-owner">
              <span className="avatar" style={{ "--av": r.ownerColor } as CSSProperties}>
                {r.owner}
              </span>
            </span>
            <span className={`b-status st-${r.status}`}>{statusLabel[r.status]}</span>
            <span className="b-date">{r.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Paper({ story }: { story: Story }) {
  return (
    <div className="paper">
      <div className="paper-head">
        <LogoMark size={22} />
        <div>
          <b>ZB Financial Holdings</b>
          <small>{story.label}</small>
        </div>
        <span className="paper-ref mono">{story.doc.ref}</span>
      </div>
      <h5>{story.doc.title}</h5>
      {story.fields.map((f) => (
        <div className="paper-field" key={f.label}>
          <small>{f.label}</small>
          <span className="hand">{f.value}</span>
        </div>
      ))}
      <div className="paper-sign">
        <svg viewBox="0 0 160 40" aria-hidden="true">
          <path d="M6 28c10-20 18-24 20-14s-6 18 2 16 12-22 18-18-4 16 4 16 10-12 16-10 0 10 8 8 12-14 20-12-2 10 8 10 18-6 28-10 16-2 24-4" />
        </svg>
        <small>Signature</small>
      </div>
      <span className="scan-beam" />
    </div>
  );
}

function Extract({ story }: { story: Story }) {
  return (
    <div className="extract">
      <div className="extract-head">
        <span className="extract-icon">
          <ScanLine size={16} />
        </span>
        <div>
          <b>Read automatically</b>
          <small>{story.fields.length} fields · 98% confidence</small>
        </div>
      </div>
      <ul>
        {story.fields.map((f, i) => (
          <li key={f.label} style={{ transitionDelay: `${350 + i * 300}ms` }}>
            <span>{f.label}</span>
            <b className={f.mono ? "mono" : undefined}>{f.value}</b>
            <Check size={14} strokeWidth={3} />
          </li>
        ))}
      </ul>
      <div className="extract-class" style={{ transitionDelay: `${350 + story.fields.length * 300}ms` }}>
        <span>Filed as</span>
        <b>{story.classification}</b>
      </div>
    </div>
  );
}

function Approval({ story }: { story: Story }) {
  return (
    <div className="approval">
      <div className="approval-head">
        <span className="file-ico file-pdf">pdf</span>
        <div>
          <b>{story.doc.title}</b>
          <small>Approval · {story.approvers.length} steps</small>
        </div>
      </div>
      <div className="approval-body">
        <ul>
          {story.approvers.map((a, i) => (
            <li key={a.name} style={{ "--d": `${400 + i * 600}ms` } as CSSProperties}>
              <span className="avatar" style={{ "--av": a.color } as CSSProperties}>
                {a.initials}
              </span>
              <div>
                <b>{a.name}</b>
                <small>{a.role}</small>
              </div>
              <span className="tick">
                <Check size={12} strokeWidth={3.2} />
              </span>
            </li>
          ))}
        </ul>
        <div className="stamp">
          <span>Approved</span>
          <small>{today}</small>
        </div>
      </div>
    </div>
  );
}

export default function HeroStage({ story, scene, paused }: { story: Story; scene: number; paused: boolean }) {
  return (
    <div className={`stage${paused ? " is-paused" : ""}`} data-scene={scene}>
      <Board story={story} />
      <Paper story={story} />
      <Extract story={story} />

      <div className="person">
        <span className="avatar" style={{ "--av": story.capturedBy.color } as CSSProperties}>
          {story.capturedBy.initials}
        </span>
        <div>
          <b>{story.capturedBy.name}</b>
          <small>{story.capturedBy.role}</small>
        </div>
        <span className="rec" />
      </div>

      <div className="filed">
        <FolderCheck size={16} />
        <span>
          Filed to <b>{story.path}</b>
          <small>Kept {story.retention}</small>
        </span>
      </div>

      <Approval story={story} />
    </div>
  );
}
