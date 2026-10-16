import { useRef, useState } from "react";
import type { ClipboardEvent, FormEvent, KeyboardEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { findUser, signIn, useAppState } from "../app/data/store";
import { ArrowLeft, ArrowRight, Building2, Eye, EyeOff, Fingerprint, Lock, ShieldCheck } from "lucide-react";
import { Logo } from "../components/Logo";
import { brand } from "../config/brand";
import "../styles/login.css";

const CODE_LENGTH = 6;

// Demo account: the form opens prefilled so anyone can sign in straight away.
// The password and code are not checked until sign-in moves to the backend.
const DEMO = { username: "kmarufu", password: "demo1234", code: "123456" };

export default function Login() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"credentials" | "mfa">("credentials");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState(DEMO.username);
  const [password, setPassword] = useState(DEMO.password);
  const [code, setCode] = useState<string[]>(DEMO.code.split(""));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/app";

  if (useAppState().sessionUserId) return <Navigate to={from} replace />;

  const toMfa = () => {
    setStep("mfa");
    window.setTimeout(() => codeRefs.current[0]?.focus(), 50);
  };

  // Identity is checked against the Group directory. Password and one-time-code
  // verification move to Active Directory and the MFA service with the backend.
  const submitCredentials = (e: FormEvent) => {
    e.preventDefault();
    if (!findUser(username) || !username.trim()) {
      setError("Enter your email address or ZBFH network username.");
      return;
    }
    setError("");
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      toMfa();
    }, 500);
  };

  const submitCode = (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    window.setTimeout(() => {
      if (signIn(username)) navigate(from, { replace: true });
      else setBusy(false);
    }, 500);
  };

  const setDigit = (i: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setCode((prev) => prev.map((d, idx) => (idx === i ? digit : d)));
    if (digit && i < CODE_LENGTH - 1) codeRefs.current[i + 1]?.focus();
  };

  const onDigitKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[i] && i > 0) codeRefs.current[i - 1]?.focus();
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!digits) return;
    e.preventDefault();
    setCode(Array.from({ length: CODE_LENGTH }, (_, i) => digits[i] ?? ""));
    codeRefs.current[Math.min(digits.length, CODE_LENGTH - 1)]?.focus();
  };

  const codeComplete = code.every((d) => d !== "");

  return (
    <div className="login">
      <aside className="login-aside">
        <div className="login-aside-bg" aria-hidden="true" />
        <Link to="/" aria-label="Back to home">
          <Logo light />
        </Link>

        <div className="login-aside-copy">
          <h2>
            The single source of truth for every <span className="lime-text">{brand.short}</span> document.
          </h2>
          <p>Capture, find and govern corporate, customer and transactional records across the Group.</p>
        </div>

        <div className="doc-stack" aria-hidden="true">
          <div className="doc d3" />
          <div className="doc d2" />
          <div className="doc d1">
            <div className="doc-top">
              <span className="file-ico file-pdf">pdf</span>
              <div>
                <strong>Home Loan Agreement</strong>
                <small>Banking · Confidential</small>
              </div>
              <span className="chip chip-green">Approved</span>
            </div>
            <span className="doc-line w90" />
            <span className="doc-line w70" />
            <span className="doc-line w80" />
            <div className="doc-foot mono">
              <ShieldCheck size={12} /> Audit entry 7f3a…c21e recorded
            </div>
          </div>
        </div>

        <ul className="login-assurances">
          <li>
            <Lock size={14} /> AES-256 · TLS 1.3
          </li>
          <li>
            <Fingerprint size={14} /> MFA enforced
          </li>
          <li>
            <ShieldCheck size={14} /> Every sign-in audited
          </li>
        </ul>
      </aside>

      <main className="login-main">
        <Link to="/" className="login-back">
          <ArrowLeft size={16} /> Back to home
        </Link>

        <div className="login-card">
          <div className="login-mobile-brand">
            <Logo />
          </div>

          {step === "credentials" ? (
            <>
              <h1>Welcome back</h1>
              <p className="login-sub">Sign in with your {brand.short} network account.</p>
              <p className="demo-note">
                Demo account filled in for you. Signs in as <b>{findUser(DEMO.username)?.name}</b>.
              </p>

              <button
                type="button"
                className="sso-btn"
                onClick={() => {
                  setUsername("");
                  toMfa();
                }}
              >
                <span className="sso-icon">
                  <Building2 size={18} />
                </span>
                Continue with {brand.short} SSO
                <ArrowRight size={16} className="arrow" />
              </button>

              <div className="divider">
                <span>or use your credentials</span>
              </div>

              <form onSubmit={submitCredentials} className="login-form">
                <label className="field">
                  <span>Username or email</span>
                  <input
                    type="text"
                    autoComplete="username"
                    placeholder="kmarufu or kmarufu@zb.co.zw"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError("");
                    }}
                    aria-invalid={!!error}
                    required
                  />
                  {error && <em className="field-error">{error}</em>}
                </label>

                <label className="field">
                  <span className="field-row">
                    Password
                    <a href="#" onClick={(e) => e.preventDefault()}>
                      Forgot password?
                    </a>
                  </span>
                  <span className="input-wrap">
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="input-icon"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </span>
                </label>

                <label className="check">
                  <input type="checkbox" defaultChecked />
                  <span>Remember this device for 30 days</span>
                </label>

                <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
                  {busy ? <span className="spinner" /> : <>Sign in <ArrowRight size={16} className="arrow" /></>}
                </button>
              </form>
            </>
          ) : (
            <>
              <span className="mfa-badge">
                <Fingerprint size={22} />
              </span>
              <h1>Verify it’s you</h1>
              <p className="login-sub">
                Enter the 6-digit code from your authenticator app{username ? ` for ${username}` : ""}.
              </p>

              <form onSubmit={submitCode} className="login-form">
                <div className="code-inputs">
                  {code.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        codeRefs.current[i] = el;
                      }}
                      inputMode="numeric"
                      autoComplete={i === 0 ? "one-time-code" : "off"}
                      maxLength={1}
                      value={d}
                      aria-label={`Digit ${i + 1}`}
                      onChange={(e) => setDigit(i, e.target.value)}
                      onKeyDown={(e) => onDigitKey(i, e)}
                      onPaste={onPaste}
                    />
                  ))}
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={!codeComplete || busy}>
                  {busy ? <span className="spinner" /> : <>Verify and continue <ArrowRight size={16} className="arrow" /></>}
                </button>
              </form>

              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  if (!username) setUsername(DEMO.username);
                  setStep("credentials");
                }}
              >
                <ArrowLeft size={14} /> Use a different account
              </button>
            </>
          )}

          <p className="login-legal">
            Access to {brand.product} is restricted to authorised {brand.company} personnel. All activity is
            monitored and recorded in the audit trail.
          </p>
        </div>
      </main>
    </div>
  );
}
