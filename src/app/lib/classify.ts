import type { WorkspaceKey } from "../data/types";

// Suggests a record class from the file name. Staff can always override it.
const rules: { re: RegExp; classId: string; workspace: WorkspaceKey; group: string }[] = [
  { re: /loan|mortgage|overdraft|facility|bond/, classId: "loan", workspace: "banking", group: "Loan applications" },
  { re: /kyc|passport|national.?id|account.?opening|onboarding|proof.?of.?residence/, classId: "kyc", workspace: "banking", group: "KYC & onboarding" },
  { re: /rtgs|swift|payment|cheque|clearing|batch/, classId: "payment", workspace: "banking", group: "Payments" },
  { re: /claim|clm|assessor|repair|police.?report/, classId: "claim", workspace: "insurance", group: "Motor claims" },
  { re: /pol-|policy.?schedule|cover.?note|householders/, classId: "policy", workspace: "insurance", group: "Policies" },
  { re: /survey|underwriting|risk.?report/, classId: "underwriting", workspace: "insurance", group: "Underwriting" },
  { re: /mandate/, classId: "mandate", workspace: "investment", group: "Client mandates" },
  { re: /valuation|portfolio|trade|statement/, classId: "portfolio", workspace: "investment", group: "Portfolio records" },
  { re: /prudential|return|rbz|liquidity|exposure/, classId: "return", workspace: "compliance", group: "Regulatory returns" },
  { re: /register|aml|cft|policy.?v\d|procedure/, classId: "register", workspace: "compliance", group: "Policies & registers" },
  { re: /contract|offer.?letter|appointment/, classId: "contract", workspace: "hr", group: "Contracts" },
  { re: /personnel|clearance|payslip|leave|disciplinary/, classId: "personnel", workspace: "hr", group: "Personnel files" },
];

export function suggestClass(fileName: string) {
  const name = fileName.toLowerCase();
  return rules.find((r) => r.re.test(name)) ?? null;
}
