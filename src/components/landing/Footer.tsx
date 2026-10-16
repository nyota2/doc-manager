import { Link } from "react-router-dom";
import { Logo } from "../Logo";
import { brand } from "../../config/brand";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Capture", href: "#product" },
      { label: "Search", href: "#product" },
      { label: "Approvals", href: "#product" },
      { label: "Retention", href: "#product" },
      { label: "Audit", href: "#product" },
    ],
  },
  {
    title: "The Group",
    links: [
      { label: "Banking", href: "#group" },
      { label: "Insurance", href: "#group" },
      { label: "Investment", href: "#group" },
    ],
  },
  {
    title: "Trust",
    links: [
      { label: "Security", href: "#security" },
      { label: "Compliance", href: "#security" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Logo />
            <p>The document management system of {brand.company}.</p>
            <Link to="/login" className="footer-login">
              Log in
            </Link>
          </div>
          {columns.map((c) => (
            <div className="footer-col" key={c.title}>
              <h4>{c.title}</h4>
              <ul>
                {c.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href}>{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {brand.company}. All rights reserved.
          </span>
          <span>For authorised ZBFH personnel only</span>
        </div>
      </div>
    </footer>
  );
}
