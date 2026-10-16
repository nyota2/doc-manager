// Each chip in the hero plays one document's journey: capture â†’ read â†’ file â†’ approve.
// Names, figures and retention periods are illustrative sample data.

export type Status = "approved" | "review" | "indexed" | "stuck" | "archived";

export const statusLabel: Record<Status, string> = {
  approved: "Approved",
  review: "In review",
  indexed: "Indexed",
  stuck: "Missing info",
  archived: "Archived",
};

export type Person = { name: string; role: string; initials: string; color: string };

export type Story = {
  key: string;
  label: string;
  color: string;
  doc: { title: string; ref: string };
  fields: { label: string; value: string; mono?: boolean }[];
  classification: string;
  capturedBy: Person;
  board: {
    workspace: string;
    title: string;
    group: string;
    rows: { name: string; owner: string; ownerColor: string; status: Status; date: string }[];
  };
  newRow: { name: string; owner: string; ownerColor: string };
  path: string;
  retention: string;
  approvers: Person[];
};

const C = {
  orange: "#f08c2e",
  blue: "#4c8ef7",
  violet: "#9d5bd2",
  green: "#22a85a",
  red: "#e04f5f",
  teal: "#0aa5b8",
  ink: "#3d4440",
};

export const stories: Story[] = [
  {
    key: "banking",
    label: "Banking",
    color: "#22a85a",
    doc: { title: "Home Loan Application", ref: "Form HL-02" },
    fields: [
      { label: "Applicant", value: "Tendai Moyo" },
      { label: "National ID", value: "63-2214587 F 42", mono: true },
      { label: "Loan amount", value: "US$45,000" },
      { label: "Term", value: "20 years" },
    ],
    classification: "Loan application · Confidential",
    capturedBy: { name: "Rudo, Branch Officer", role: "Scanning at Branch 04", initials: "RM", color: C.orange },
    board: {
      workspace: "Banking",
      title: "Loan applications",
      group: "October 2026",
      rows: [
        { name: "Vehicle Loan — S. Dube", owner: "KM", ownerColor: C.blue, status: "approved", date: "Oct 15" },
        { name: "SME Facility — Mhofu Farms", owner: "TC", ownerColor: C.violet, status: "review", date: "Oct 15" },
        { name: "Overdraft — P. Banda", owner: "RM", ownerColor: C.orange, status: "stuck", date: "Oct 14" },
        { name: "Home Loan — L. Sithole", owner: "KM", ownerColor: C.blue, status: "approved", date: "Oct 13" },
        { name: "Personal Loan — G. Ncube", owner: "TC", ownerColor: C.violet, status: "indexed", date: "Oct 12" },
      ],
    },
    newRow: { name: "Home Loan — T. Moyo", owner: "RM", ownerColor: C.orange },
    path: "Banking › Loans › 2026",
    retention: "for 10 years after closure",
    approvers: [
      { name: "Rudo Mlambo", role: "Branch officer", initials: "RM", color: C.orange },
      { name: "Kudzai Marufu", role: "Credit analyst", initials: "KM", color: C.blue },
      { name: "Credit committee", role: "3 of 3 votes", initials: "CC", color: C.ink },
    ],
  },
  {
    key: "insurance",
    label: "Insurance",
    color: "#4c8ef7",
    doc: { title: "Motor Claim Form", ref: "Form MC-11" },
    fields: [
      { label: "Policy no.", value: "POL-77120", mono: true },
      { label: "Claimant", value: "Rufaro Chikwanha" },
      { label: "Incident date", value: "12 Oct 2026" },
      { label: "Claim value", value: "US$4,800" },
    ],
    classification: "Motor claim · Evidence",
    capturedBy: { name: "Nyasha, Claims Desk", role: "Uploading from email", initials: "NK", color: C.teal },
    board: {
      workspace: "Insurance",
      title: "Motor claims",
      group: "Open claims",
      rows: [
        { name: "CLM-20877 — assessor report", owner: "FS", ownerColor: C.violet, status: "review", date: "Oct 15" },
        { name: "CLM-20802 — police report", owner: "NK", ownerColor: C.teal, status: "approved", date: "Oct 14" },
        { name: "CLM-20790 — repair quote", owner: "FS", ownerColor: C.violet, status: "stuck", date: "Oct 13" },
        { name: "CLM-20733 — windscreen", owner: "BM", ownerColor: C.orange, status: "approved", date: "Oct 12" },
        { name: "CLM-20651 — total loss", owner: "NK", ownerColor: C.teal, status: "archived", date: "Oct 09" },
      ],
    },
    newRow: { name: "CLM-20931 — R. Chikwanha", owner: "NK", ownerColor: C.teal },
    path: "Insurance › Claims › Motor",
    retention: "for 7 years after settlement",
    approvers: [
      { name: "Fadzai Sibanda", role: "Claims assessor", initials: "FS", color: C.violet },
      { name: "Brian Mutasa", role: "Claims manager", initials: "BM", color: C.orange },
      { name: "Finance", role: "Payment released", initials: "FI", color: C.ink },
    ],
  },
  {
    key: "investment",
    label: "Investment",
    color: "#9d5bd2",
    doc: { title: "Client Investment Mandate", ref: "IM-2026-118" },
    fields: [
      { label: "Client", value: "Pension Fund A" },
      { label: "Mandate value", value: "US$2.4M" },
      { label: "Risk profile", value: "Balanced" },
      { label: "Review date", value: "Oct 2027" },
    ],
    classification: "Client mandate · Restricted",
    capturedBy: { name: "Tariro, Relationship Manager", role: "Uploading signed copy", initials: "TG", color: C.violet },
    board: {
      workspace: "Investment",
      title: "Client mandates",
      group: "Q4 onboarding",
      rows: [
        { name: "Mandate — Medical Aid Society", owner: "TG", ownerColor: C.violet, status: "approved", date: "Oct 14" },
        { name: "Mandate — Mining Pension Fund", owner: "LD", ownerColor: C.blue, status: "review", date: "Oct 14" },
        { name: "Amendment — Church Trust", owner: "TG", ownerColor: C.violet, status: "indexed", date: "Oct 11" },
        { name: "Mandate — Teachers Fund", owner: "LD", ownerColor: C.blue, status: "approved", date: "Oct 10" },
        { name: "Termination — Estate K.", owner: "PC", ownerColor: C.teal, status: "archived", date: "Oct 02" },
      ],
    },
    newRow: { name: "Mandate — Pension Fund A", owner: "TG", ownerColor: C.violet },
    path: "Investment › Mandates › 2026",
    retention: "for the life of the mandate + 7 years",
    approvers: [
      { name: "Lindiwe Dube", role: "Portfolio manager", initials: "LD", color: C.blue },
      { name: "Peter Chari", role: "Compliance officer", initials: "PC", color: C.teal },
      { name: "Head of Investments", role: "Signed", initials: "HI", color: C.ink },
    ],
  },
  {
    key: "compliance",
    label: "Compliance",
    color: "#f5a623",
    doc: { title: "Prudential Return", ref: "RBZ · Q3 2026" },
    fields: [
      { label: "Return", value: "Q3 2026 prudential" },
      { label: "Entity", value: "ZB Bank" },
      { label: "Prepared by", value: "Group Finance" },
      { label: "Due", value: "31 Oct 2026" },
    ],
    classification: "Regulatory return · Restricted",
    capturedBy: { name: "Chipo, Group Finance", role: "Submitting for sign-off", initials: "CN", color: C.green },
    board: {
      workspace: "Compliance",
      title: "Regulatory returns",
      group: "Due this month",
      rows: [
        { name: "AML quarterly report", owner: "PC", ownerColor: C.teal, status: "review", date: "Oct 20" },
        { name: "Liquidity return — Sept", owner: "CN", ownerColor: C.green, status: "approved", date: "Oct 10" },
        { name: "Large exposures schedule", owner: "CN", ownerColor: C.green, status: "stuck", date: "Oct 18" },
        { name: "Data protection register", owner: "PC", ownerColor: C.teal, status: "indexed", date: "Oct 08" },
        { name: "Board risk pack — Q3", owner: "AM", ownerColor: C.orange, status: "approved", date: "Oct 05" },
      ],
    },
    newRow: { name: "Prudential return — Q3", owner: "CN", ownerColor: C.green },
    path: "Compliance › RBZ returns › 2026",
    retention: "permanently",
    approvers: [
      { name: "Chipo Nyathi", role: "Financial controller", initials: "CN", color: C.green },
      { name: "Peter Chari", role: "Head of Compliance", initials: "PC", color: C.teal },
      { name: "Group CFO", role: "Signed", initials: "CF", color: C.ink },
    ],
  },
  {
    key: "hr",
    label: "HR",
    color: "#e04f5f",
    doc: { title: "Employment Contract", ref: "HR-C-0442" },
    fields: [
      { label: "Employee", value: "Farai Ndlovu" },
      { label: "Role", value: "Credit Analyst" },
      { label: "Start date", value: "1 Nov 2026" },
      { label: "Grade", value: "C3" },
    ],
    classification: "Personnel file · Confidential",
    capturedBy: { name: "Memory, HR Officer", role: "Scanning signed contract", initials: "MS", color: C.red },
    board: {
      workspace: "HR",
      title: "New starters",
      group: "November intake",
      rows: [
        { name: "Contract — A. Gumbo", owner: "MS", ownerColor: C.red, status: "approved", date: "Oct 14" },
        { name: "Contract — T. Shumba", owner: "MS", ownerColor: C.red, status: "review", date: "Oct 14" },
        { name: "Police clearance — K. Zulu", owner: "JM", ownerColor: C.blue, status: "stuck", date: "Oct 12" },
        { name: "Offer letter — N. Hove", owner: "JM", ownerColor: C.blue, status: "indexed", date: "Oct 11" },
        { name: "Contract — R. Moyo", owner: "MS", ownerColor: C.red, status: "approved", date: "Oct 09" },
      ],
    },
    newRow: { name: "Contract — F. Ndlovu", owner: "MS", ownerColor: C.red },
    path: "HR › Personnel files › F. Ndlovu",
    retention: "for 7 years after exit",
    approvers: [
      { name: "Memory Sibanda", role: "HR officer", initials: "MS", color: C.red },
      { name: "James Mpofu", role: "Line manager", initials: "JM", color: C.blue },
      { name: "Head of HR", role: "Signed", initials: "HR", color: C.ink },
    ],
  },
];
