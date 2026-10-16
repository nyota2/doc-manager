import { useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Pause, Play } from "lucide-react";
import HeroStage, { STAGE_H, STAGE_W } from "./HeroStage";
import { stories } from "./heroStories";
import { useFitScale } from "../../hooks/useFitScale";

const SCENES = [
  { label: "Capture", ms: 3200 },
  { label: "Read", ms: 3600 },
  { label: "File", ms: 2800 },
  { label: "Approve", ms: 4200 },
];

export default function Hero() {
  const reduced = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const [storyIdx, setStoryIdx] = useState(0);
  const [scene, setScene] = useState(reduced ? SCENES.length - 1 : 0);
  const [take, setTake] = useState(0);
  const [playing, setPlaying] = useState(!reduced);
  const userPicked = useRef(false);
  const [fitRef, scale] = useFitScale<HTMLDivElement>(STAGE_W);
  const story = stories[storyIdx];

  const pick = (i: number) => {
    userPicked.current = true;
    setStoryIdx(i);
    setScene(reduced ? SCENES.length - 1 : 0);
    setTake((t) => t + 1);
  };

  const advance = () => {
    if (scene < SCENES.length - 1) {
      setScene(scene + 1);
      return;
    }
    // End of the clip: replay, moving on to the next team unless the visitor chose one.
    setScene(0);
    setTake((t) => t + 1);
    if (!userPicked.current) setStoryIdx((i) => (i + 1) % stories.length);
  };

  return (
    <section className="hero" id="top">
      <div className="container hero-grid">
        <div className="hero-copy">
          <h1>
            Every Group document in one secure workspace
          </h1>
          <p className="hero-sub">
            Scan it, find it, approve it, and keep it exactly as long as the regulator says. ZB Vault runs the whole
            life of every document across Banking, Insurance and Investment.
          </p>

          <div className="team-chips" role="tablist" aria-label="Show an example from">
            {stories.map((s, i) => (
              <button
                key={s.key}
                role="tab"
                aria-selected={i === storyIdx}
                className={`team-chip${i === storyIdx ? " on" : ""}`}
                onClick={() => pick(i)}
              >
                {i === storyIdx && (
                  <span className="team-check">
                    <Check size={11} strokeWidth={3.4} />
                  </span>
                )}
                {s.label}
              </button>
            ))}
          </div>

          <Link to="/login" className="btn btn-primary hero-cta">
            Get started <ArrowRight size={18} className="arrow" />
          </Link>
          <p className="hero-note">
            <span className="nw">Sign in with your ZBFH account</span>
            <span className="sep">✦</span>
            <span className="nw">Every action audit-logged</span>
          </p>
        </div>

        <div className="hero-visual">
          <div className="stage-fit" ref={fitRef} style={{ height: STAGE_H * scale }}>
            <div className="stage-scale" style={{ transform: `scale(${scale})` } as CSSProperties}>
              <HeroStage key={`${story.key}-${take}`} story={story} scene={scene} paused={!playing} />
            </div>
          </div>

          <div className="player">
            <button
              className="player-btn"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Pause animation" : "Play animation"}
              disabled={reduced}
            >
              {playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
            </button>
            <div className="chapters">
              {SCENES.map((s, i) => (
                <button
                  key={s.label}
                  className={`chapter${i < scene ? " done" : ""}${i === scene ? " on" : ""}`}
                  onClick={() => setScene(i)}
                >
                  <span className="chapter-bar">
                    {i === scene && (
                      <i
                        key={`${story.key}-${take}-${scene}`}
                        style={{
                          animationDuration: `${s.ms}ms`,
                          animationPlayState: playing ? "running" : "paused",
                        }}
                        onAnimationEnd={reduced ? undefined : advance}
                      />
                    )}
                  </span>
                  <span className="chapter-label">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
