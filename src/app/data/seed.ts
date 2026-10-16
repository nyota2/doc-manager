import type { ApprovalStep, Doc, RetentionClass, Sensitivity, Status, User, Workspace, WorkspaceKey } from "./types";

export const users: User[] = [
  { id: "u1", name: "Kudzai Marufu", role: "Group Records Manager", username: "kmarufu", color: "#4c8ef7", workspaces: ["banking", "insurance", "investment", "compliance", "hr"] },
  { id: "u2", name: "Rudo Mlambo", role: "Branch Officer, Branch 04", username: "rmlambo", color: "#f08c2e", workspaces: ["banking"] },
  { id: "u3", name: "Farai Ndlovu", role: "Credit Analyst", username: "fndlovu", color: "#0aa5b8", workspaces: ["banking"] },
  { id: "u4", name: "Tendai Chari", role: "Head of Credit", username: "tchari", color: "#3d4440", workspaces: ["banking"] },
  { id: "u5", name: "Nyasha Kanengoni", role: "Claims Officer", username: "nkanengoni", color: "#e04f5f", workspaces: ["insurance"] },
  { id: "u6", name: "Fadzai Sibanda", role: "Claims Assessor", username: "fsibanda", color: "#9d5bd2", workspaces: ["insurance"] },
  { id: "u7", name: "Brian Mutasa", role: "Claims Manager", username: "bmutasa", color: "#22a85a", workspaces: ["insurance"] },
  { id: "u8", name: "Tariro Gumbo", role: "Relationship Manager", username: "tgumbo", color: "#d97706", workspaces: ["investment"] },
  { id: "u9", name: "Lindiwe Dube", role: "Portfolio Manager", username: "ldube", color: "#2563eb", workspaces: ["investment"] },
  { id: "u10", name: "Peter Chari", role: "Head of Compliance", username: "pchari", color: "#0f766e", workspaces: ["compliance", "investment"] },
  { id: "u11", name: "Chipo Nyathi", role: "Financial Controller", username: "cnyathi", color: "#be185d", workspaces: ["compliance"] },
  { id: "u12", name: "Memory Sibanda", role: "HR Officer", username: "msibanda", color: "#db2777", workspaces: ["hr"] },
  { id: "u13", name: "James Mpofu", role: "Line Manager", username: "jmpofu", color: "#4f46e5", workspaces: ["hr"] },
  { id: "u14", name: "Grace Moyo", role: "Group Legal Counsel", username: "gmoyo", color: "#57534e", workspaces: ["banking", "insurance", "investment", "compliance", "hr"] },
];

export const workspaces: Workspace[] = [
  { key: "banking", name: "Banking", color: "#22a85a", description: "Lending, onboarding and payment records for ZB Bank.", groups: ["Loan applications", "KYC & onboarding", "Payments"] },
  { key: "insurance", name: "Insurance", color: "#4c8ef7", description: "Policies, claims and underwriting evidence.", groups: ["Motor claims", "Policies", "Underwriting"] },
  { key: "investment", name: "Investment", color: "#9d5bd2", description: "Client mandates and portfolio records.", groups: ["Client mandates", "Portfolio records"] },
  { key: "compliance", name: "Compliance", color: "#f5a623", description: "Regulatory returns, registers and Group policies.", groups: ["Regulatory returns", "Policies & registers"] },
  { key: "hr", name: "HR", color: "#e04f5f", description: "Employment contracts and personnel files.", groups: ["Contracts", "Personnel files"] },
];

export const retentionClasses: RetentionClass[] = [
  { id: "loan", workspace: "banking", name: "Loan agreements", years: 10, trigger: "after the facility closes" },
  { id: "kyc", workspace: "banking", name: "KYC records", years: 7, trigger: "after the relationship ends" },
  { id: "payment", workspace: "banking", name: "Payment records", years: 10, trigger: "after the transaction date" },
  { id: "claim", workspace: "insurance", name: "Claims files", years: 7, trigger: "after settlement" },
  { id: "policy", workspace: "insurance", name: "Policy documents", years: 7, trigger: "after the policy expires" },
  { id: "underwriting", workspace: "insurance", name: "Underwriting files", years: 7, trigger: "after the policy expires" },
  { id: "mandate", workspace: "investment", name: "Client mandates", years: 7, trigger: "after the mandate ends" },
  { id: "portfolio", workspace: "investment", name: "Portfolio records", years: 10, trigger: "after the reporting date" },
  { id: "return", workspace: "compliance", name: "Regulatory returns", years: null, trigger: "kept permanently" },
  { id: "register", workspace: "compliance", name: "Policies & registers", years: 10, trigger: "after being superseded" },
  { id: "contract", workspace: "hr", name: "Employment contracts", years: 7, trigger: "after the employee exits" },
  { id: "personnel", workspace: "hr", name: "Personnel files", years: 7, trigger: "after the employee exits" },
];

/** Default approval route per retention class. */
export const approvalRoutes: Record<string, [string, string][]> = {
  loan: [["u2", "Branch officer"], ["u3", "Credit analyst"], ["u4", "Credit committee"], ["u1", "Records sign-off"]],
  kyc: [["u2", "Branch officer"], ["u1", "Records sign-off"]],
  payment: [],
  claim: [["u6", "Claims assessor"], ["u7", "Claims manager"], ["u1", "Records sign-off"]],
  policy: [["u5", "Claims officer"], ["u1", "Records sign-off"]],
  underwriting: [["u6", "Assessor"], ["u7", "Claims manager"]],
  mandate: [["u9", "Portfolio manager"], ["u10", "Compliance"], ["u1", "Records sign-off"]],
  portfolio: [],
  return: [["u11", "Financial controller"], ["u10", "Head of Compliance"], ["u1", "Records sign-off"]],
  register: [["u10", "Head of Compliance"]],
  contract: [["u12", "HR officer"], ["u13", "Line manager"], ["u1", "Records sign-off"]],
  personnel: [["u12", "HR officer"]],
};

const DAY = 86_400_000;
const HOUR = 3_600_000;

type Seed = {
  ws: WorkspaceKey;
  group: string;
  cls: string;
  title: string;
  file: string;
  owner: string;
  status: Status;
  days: number;
  sens?: Sensitivity;
  fields: [string, string][];
  /** For "review": index of the step waiting for action. For "returned": index of the rejected step. */
  at?: number;
  note?: string;
  tags?: string[];
  hold?: { caseId: string; reason: string };
};

const seeds: Seed[] = [
  // Banking
  { ws: "banking", group: "Loan applications", cls: "loan", title: "Home Loan Application — T. Moyo", file: "home-loan-application-tmoyo.pdf", owner: "u2", status: "review", days: 0.2, sens: "Confidential", at: 3, fields: [["Applicant", "Tendai Moyo"], ["National ID", "63-2214587 F 42"], ["Loan amount", "US$45,000"], ["Term", "20 years"]], tags: ["home loan", "branch 04"] },
  { ws: "banking", group: "Loan applications", cls: "loan", title: "Vehicle Loan — S. Dube", file: "vehicle-loan-sdube.pdf", owner: "u2", status: "approved", days: 1, sens: "Confidential", fields: [["Applicant", "Simbarashe Dube"], ["Loan amount", "US$18,500"], ["Term", "5 years"]], tags: ["vehicle"] },
  { ws: "banking", group: "Loan applications", cls: "loan", title: "SME Facility — Mhofu Farms", file: "sme-facility-mhofu-farms.pdf", owner: "u3", status: "review", days: 1.3, sens: "Confidential", at: 2, fields: [["Borrower", "Mhofu Farms (Pvt) Ltd"], ["Facility", "US$120,000 working capital"], ["Security", "Notarial general bond"]], tags: ["sme", "agriculture"] },
  { ws: "banking", group: "Loan applications", cls: "loan", title: "Overdraft — P. Banda", file: "overdraft-pbanda.pdf", owner: "u2", status: "stuck", days: 2, sens: "Confidential", fields: [["Applicant", "Precious Banda"], ["Limit", "US$2,000"]], note: "Proof of residence missing", tags: ["overdraft"] },
  { ws: "banking", group: "Loan applications", cls: "loan", title: "Home Loan — L. Sithole", file: "home-loan-lsithole.pdf", owner: "u2", status: "approved", days: 3, sens: "Confidential", fields: [["Applicant", "Lindani Sithole"], ["Loan amount", "US$62,000"], ["Term", "25 years"]], tags: ["home loan"] },
  { ws: "banking", group: "Loan applications", cls: "loan", title: "Personal Loan — G. Ncube", file: "personal-loan-gncube.pdf", owner: "u3", status: "returned", days: 4, sens: "Confidential", at: 2, fields: [["Applicant", "Gift Ncube"], ["Loan amount", "US$6,000"]], note: "Affordability ratio above policy limit", tags: ["personal"] },
  { ws: "banking", group: "KYC & onboarding", cls: "kyc", title: "KYC Pack — R. Chikwanha", file: "kyc-rchikwanha.pdf", owner: "u2", status: "approved", days: 2, sens: "Confidential", fields: [["Customer", "Rufaro Chikwanha"], ["ID verified", "Yes"], ["Risk rating", "Low"]], tags: ["kyc"] },
  { ws: "banking", group: "KYC & onboarding", cls: "kyc", title: "Account Opening — Mhofu Farms (Pvt) Ltd", file: "account-opening-mhofu.pdf", owner: "u2", status: "review", days: 0.5, sens: "Confidential", at: 1, fields: [["Entity", "Mhofu Farms (Pvt) Ltd"], ["Directors", "2"], ["Account", "Corporate current"]], tags: ["corporate", "onboarding"] },
  { ws: "banking", group: "KYC & onboarding", cls: "kyc", title: "KYC Refresh — A. Gumbo", file: "kyc-refresh-agumbo.pdf", owner: "u2", status: "stuck", days: 6, sens: "Confidential", fields: [["Customer", "Anesu Gumbo"], ["Risk rating", "Medium"]], note: "Expired passport on file", tags: ["kyc refresh"] },
  { ws: "banking", group: "Payments", cls: "payment", title: "RTGS Batch 2026-10-15", file: "rtgs-batch-2026-10-15.csv", owner: "u3", status: "filed", days: 1, sens: "Restricted", fields: [["Transactions", "1,284"], ["Value", "ZWG 48.2M"]], tags: ["rtgs"] },
  { ws: "banking", group: "Payments", cls: "payment", title: "SWIFT Confirmations — Week 41", file: "swift-confirmations-w41.pdf", owner: "u3", status: "archived", days: 9, sens: "Restricted", fields: [["Messages", "312"]], tags: ["swift"] },
  { ws: "banking", group: "Payments", cls: "payment", title: "RTGS Batch 2015-06-30", file: "rtgs-batch-2015-06-30.csv", owner: "u3", status: "archived", days: 4130, sens: "Restricted", fields: [["Transactions", "902"]], tags: ["rtgs", "legacy"] },
  { ws: "banking", group: "Payments", cls: "payment", title: "Cheque Clearing Register — 2015", file: "cheque-clearing-2015.pdf", owner: "u3", status: "archived", days: 4020, sens: "Restricted", fields: [["Entries", "12,480"]], tags: ["legacy"], hold: { caseId: "CASE-118", reason: "Litigation: Mhofu Farms v ZB Bank" } },

  // Insurance
  { ws: "insurance", group: "Motor claims", cls: "claim", title: "Claim CLM-20931 — R. Chikwanha", file: "clm-20931-claim-form.pdf", owner: "u5", status: "review", days: 0.4, sens: "Confidential", at: 0, fields: [["Policy no.", "POL-77120"], ["Incident date", "12 Oct 2026"], ["Claim value", "US$4,800"]], tags: ["motor"] },
  { ws: "insurance", group: "Motor claims", cls: "claim", title: "Claim CLM-20877 — Assessor report", file: "clm-20877-assessor-report.pdf", owner: "u6", status: "review", days: 1.2, sens: "Confidential", at: 2, fields: [["Policy no.", "POL-76540"], ["Assessed value", "US$6,120"]], tags: ["motor", "assessor"] },
  { ws: "insurance", group: "Motor claims", cls: "claim", title: "Claim CLM-20802 — Police report", file: "clm-20802-police-report.pdf", owner: "u5", status: "approved", days: 2, sens: "Confidential", fields: [["Policy no.", "POL-75011"], ["Station", "Harare Central"]], tags: ["motor"] },
  { ws: "insurance", group: "Motor claims", cls: "claim", title: "Claim CLM-20790 — Repair quote", file: "clm-20790-repair-quote.pdf", owner: "u5", status: "stuck", days: 3, sens: "Internal", fields: [["Policy no.", "POL-74980"], ["Quote", "US$2,350"]], note: "Second quote required above US$2,000", tags: ["motor"] },
  { ws: "insurance", group: "Policies", cls: "policy", title: "Motor Policy POL-77120 — R. Chikwanha", file: "pol-77120-schedule.pdf", owner: "u5", status: "approved", days: 40, sens: "Confidential", fields: [["Cover", "Comprehensive"], ["Premium", "US$540 / year"]], tags: ["motor policy"] },
  { ws: "insurance", group: "Policies", cls: "policy", title: "Householders Policy POL-77311 — K. Zulu", file: "pol-77311-schedule.pdf", owner: "u5", status: "filed", days: 5, sens: "Confidential", fields: [["Cover", "Buildings & contents"], ["Sum insured", "US$85,000"]], tags: ["householders"] },
  { ws: "insurance", group: "Underwriting", cls: "underwriting", title: "Fleet Risk Survey — Express Haulage", file: "fleet-risk-survey-express-haulage.pdf", owner: "u6", status: "review", days: 2.5, sens: "Confidential", at: 1, fields: [["Vehicles", "46"], ["Risk grade", "B"]], tags: ["fleet", "survey"] },

  // Investment
  { ws: "investment", group: "Client mandates", cls: "mandate", title: "Investment Mandate — Pension Fund A", file: "mandate-pension-fund-a.pdf", owner: "u8", status: "review", days: 0.8, sens: "Restricted", at: 2, fields: [["Client", "Pension Fund A"], ["Mandate value", "US$2.4M"], ["Risk profile", "Balanced"]], tags: ["pension", "mandate"] },
  { ws: "investment", group: "Client mandates", cls: "mandate", title: "Investment Mandate — Medical Aid Society", file: "mandate-medical-aid-society.pdf", owner: "u8", status: "approved", days: 2, sens: "Restricted", fields: [["Client", "Medical Aid Society"], ["Mandate value", "US$1.1M"]], tags: ["mandate"] },
  { ws: "investment", group: "Client mandates", cls: "mandate", title: "Mandate Amendment — Church Trust", file: "mandate-amendment-church-trust.docx", owner: "u8", status: "review", days: 3, sens: "Restricted", at: 1, fields: [["Client", "Church Trust"], ["Change", "Equity cap 40% → 50%"]], tags: ["amendment"] },
  { ws: "investment", group: "Portfolio records", cls: "portfolio", title: "Portfolio Valuation — September 2026", file: "portfolio-valuation-sep-2026.xlsx", owner: "u9", status: "filed", days: 12, sens: "Restricted", fields: [["Portfolios", "38"], ["AUM", "US$214M"]], tags: ["valuation"] },
  { ws: "investment", group: "Portfolio records", cls: "portfolio", title: "Trade Confirmations — Q3 2026", file: "trade-confirmations-q3-2026.pdf", owner: "u9", status: "archived", days: 18, sens: "Restricted", fields: [["Trades", "1,906"]], tags: ["trades"] },

  // Compliance
  { ws: "compliance", group: "Regulatory returns", cls: "return", title: "Prudential Return — Q3 2026", file: "prudential-return-q3-2026.pdf", owner: "u11", status: "review", days: 0.6, sens: "Restricted", at: 2, fields: [["Return", "Q3 2026 prudential"], ["Entity", "ZB Bank"], ["Due", "31 Oct 2026"]], tags: ["rbz"] },
  { ws: "compliance", group: "Regulatory returns", cls: "return", title: "Liquidity Return — September 2026", file: "liquidity-return-sep-2026.pdf", owner: "u11", status: "approved", days: 6, sens: "Restricted", fields: [["Return", "Monthly liquidity"], ["Submitted", "10 Oct 2026"]], tags: ["rbz"] },
  { ws: "compliance", group: "Regulatory returns", cls: "return", title: "Large Exposures Schedule — Q3", file: "large-exposures-q3-2026.xlsx", owner: "u11", status: "stuck", days: 2, sens: "Restricted", fields: [["Exposures", "14"]], note: "Two counterparties missing group mapping", tags: ["rbz"] },
  { ws: "compliance", group: "Policies & registers", cls: "register", title: "Data Protection Register 2026", file: "data-protection-register-2026.xlsx", owner: "u10", status: "approved", days: 20, sens: "Internal", fields: [["Processing activities", "86"]], tags: ["data protection"] },
  { ws: "compliance", group: "Policies & registers", cls: "register", title: "AML / CFT Policy v4.2", file: "aml-cft-policy-v4-2.docx", owner: "u10", status: "review", days: 4, sens: "Internal", at: 0, fields: [["Version", "4.2"], ["Owner", "Group Compliance"]], tags: ["policy", "aml"] },

  // HR
  { ws: "hr", group: "Contracts", cls: "contract", title: "Employment Contract — T. Shumba", file: "contract-tshumba.pdf", owner: "u12", status: "review", days: 0.7, sens: "Confidential", at: 2, fields: [["Employee", "Tatenda Shumba"], ["Role", "Credit Analyst"], ["Start date", "1 Nov 2026"]], tags: ["new starter"] },
  { ws: "hr", group: "Contracts", cls: "contract", title: "Employment Contract — A. Gumbo", file: "contract-agumbo.pdf", owner: "u12", status: "approved", days: 3, sens: "Confidential", fields: [["Employee", "Anesu Gumbo"], ["Role", "Teller"]], tags: ["new starter"] },
  { ws: "hr", group: "Contracts", cls: "contract", title: "Offer Letter — N. Hove", file: "offer-letter-nhove.pdf", owner: "u12", status: "filed", days: 5, sens: "Confidential", fields: [["Candidate", "Nokuthula Hove"], ["Role", "Relationship Manager"]], tags: ["offer"] },
  { ws: "hr", group: "Personnel files", cls: "personnel", title: "Police Clearance — K. Zulu", file: "police-clearance-kzulu.pdf", owner: "u12", status: "stuck", days: 7, sens: "Confidential", fields: [["Employee", "Kudakwashe Zulu"]], note: "Certificate older than 6 months", tags: ["vetting"] },
  { ws: "hr", group: "Personnel files", cls: "personnel", title: "Personnel File — M. Chikore (exited 2017)", file: "personnel-mchikore.pdf", owner: "u12", status: "archived", days: 3420, sens: "Confidential", fields: [["Employee", "Munyaradzi Chikore"], ["Exit", "March 2017"]], tags: ["leaver"] },
];

const prefix: Record<WorkspaceKey, string> = {
  banking: "BNK",
  insurance: "INS",
  investment: "INV",
  compliance: "CMP",
  hr: "HR",
};

const mimeFor = (file: string) => {
  const ext = file.split(".").pop()!;
  return (
    {
      pdf: "application/pdf",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      csv: "text/csv",
    } as Record<string, string>
  )[ext] ?? "application/octet-stream";
};

export function addYears(iso: string, years: number | null) {
  if (years === null) return null;
  const d = new Date(iso);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString();
}

export function buildSeedDocs(now = Date.now()): Doc[] {
  return seeds.map((s, i) => {
    const created = new Date(now - s.days * DAY).toISOString();
    const route = approvalRoutes[s.cls] ?? [];
    // Decisions are spaced out after upload but never later than now.
    const gap = Math.min(2 * HOUR, (s.days * DAY) / (route.length + 1));
    const approval: ApprovalStep[] = route.map(([userId, label], idx) => {
      let state: ApprovalStep["state"] = "waiting";
      if (s.status === "approved" || s.status === "archived") state = "approved";
      else if (s.status === "review" && s.at !== undefined) state = idx < s.at ? "approved" : idx === s.at ? "pending" : "waiting";
      else if (s.status === "returned" && s.at !== undefined) state = idx < s.at ? "approved" : idx === s.at ? "rejected" : "waiting";
      const done = state === "approved" || state === "rejected";
      return {
        id: `${i}-${idx}`,
        userId,
        label,
        state,
        at: done ? new Date(new Date(created).getTime() + (idx + 1) * gap).toISOString() : undefined,
        comment: state === "rejected" ? s.note : undefined,
      };
    });
    const cls = retentionClasses.find((c) => c.id === s.cls)!;
    const year = new Date(created).getFullYear();
    const size = 180_000 + ((i * 7919) % 2_400_000);
    return {
      id: `d${i + 1}`,
      ref: `${prefix[s.ws]}-${year}-${String(48_000 + i * 37).padStart(6, "0")}`,
      title: s.title,
      fileName: s.file,
      mime: mimeFor(s.file),
      workspace: s.ws,
      group: s.group,
      classId: s.cls,
      sensitivity: s.sens ?? "Internal",
      ownerId: s.owner,
      status: s.status,
      tags: [...(s.tags ?? []), ...(s.status === "stuck" && s.note ? [`missing: ${s.note}`] : [])],
      fields: s.fields.map(([label, value]) => ({ label, value })),
      createdAt: created,
      updatedAt: approval.filter((a) => a.at).map((a) => a.at!).sort().pop() ?? created,
      versions: [{ v: 1, at: created, by: s.owner, note: "Original upload", size }],
      approval,
      hold: s.hold ? { ...s.hold, by: "u14", at: new Date(now - 30 * DAY).toISOString() } : undefined,
      retainUntil: addYears(created, cls.years),
    };
  });
}
