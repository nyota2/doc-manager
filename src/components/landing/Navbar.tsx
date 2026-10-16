import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Menu, X } from "lucide-react";
import { Logo } from "../Logo";

const links = [
  { href: "#product", label: "Product" },
  { href: "#group", label: "For the Group" },
  { href: "#security", label: "Security" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`nav${scrolled || open ? " nav-solid" : ""}`}>
      <div className="container nav-inner">
        <div className="nav-left">
          <a href="#top" aria-label="ZB Vault home" onClick={() => setOpen(false)}>
            <Logo />
          </a>
          <nav className="nav-links" aria-label="Primary">
            {links.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="nav-actions">
          <Link to="/login" className="nav-login">
            Log in
          </Link>
          <Link to="/login" className="btn btn-primary btn-sm nav-cta">
            Get started <ArrowRight size={16} className="arrow" />
          </Link>
          <button
            className="nav-toggle"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="nav-mobile">
          <div className="container">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
                {l.label}
              </a>
            ))}
            <Link to="/login" className="btn btn-primary btn-block">
              Get started <ArrowRight size={16} className="arrow" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
