import { InputValidationError, type ControlStatus, type SecurityControlInput } from "../utils/validation.js";

export const METHODOLOGY_VERSION = "1.0.2";

export const SCORING_METHODOLOGY = [
  "Ten categories are scored separately. The overall score is the arithmetic mean of the ten category scores.",
  "Each control has a weight. The default weight is 1.",
  "An implemented control earns its full weight. A partial control earns half its weight. A missing control earns zero.",
  "An unknown control earns zero. Unknown never counts as implemented and is reported separately from missing.",
  "Category score = earned weight / total weight × 100, rounded half away from zero to two decimal places by integer arithmetic.",
  "The overall score averages the rounded category scores and is then rounded the same way.",
  "Named products, employee count, and framework selection do not add or remove points.",
  "A score describes attested checklist coverage. It is not certification, a legal determination, or a formal audit.",
].join(" ");

export interface ControlDefinition {
  id: string;
  categoryId: CategoryId;
  title: string;
  question: string;
  weight: number;
  critical: boolean;
  remediation: string;
}

export const CATEGORIES = [
  { id: "identity_and_access_management", title: "Identity and Access Management" },
  { id: "role_based_access_control", title: "Role-Based Access Control" },
  { id: "vector_database_security", title: "Vector Database Security" },
  { id: "data_privacy", title: "Data Privacy" },
  { id: "llm_gateway_security", title: "LLM Gateway Security" },
  { id: "enterprise_integration_security", title: "Enterprise Integration Security" },
  { id: "human_in_the_loop_governance", title: "Human-in-the-Loop Governance" },
  { id: "audit_logging", title: "Audit Logging" },
  { id: "incident_response", title: "Incident Response" },
  { id: "compliance_documentation", title: "Compliance Documentation" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const CONTROL_CATALOG: readonly ControlDefinition[] = [
  control("ELATRE-IAM-01", "identity_and_access_management", "Central identity provider", "Are workforce and service identities for the AI system issued by a central identity provider?", true, "Connect AI operators, services, and break-glass accounts to the enterprise identity provider."),
  control("ELATRE-IAM-02", "identity_and_access_management", "Multi-factor authentication", "Is multi-factor authentication required for administrative and AI-operator access?", true, "Require phishing-resistant or equivalent MFA for privileged AI access."),
  control("ELATRE-IAM-03", "identity_and_access_management", "Unique identities", "Does every person who can change prompts, indexes, or model access use a unique account?", false, "Remove shared administrator accounts from AI platforms."),
  control("ELATRE-IAM-04", "identity_and_access_management", "Joiner-mover-leaver", "Is AI system access included in joiner, mover, and leaver processing?", true, "Add AI roles and service accounts to the joiner-mover-leaver workflow."),
  control("ELATRE-IAM-05", "identity_and_access_management", "Service account inventory", "Is there an inventory of non-human credentials used by retrieval, gateway, and integration jobs?", false, "Inventory service accounts and replace long-lived shared secrets with scoped credentials."),
  control("ELATRE-RBAC-01", "role_based_access_control", "Defined AI roles", "Are distinct roles defined for AI users, operators, developers, and auditors?", true, "Publish a role catalog for AI use, operation, development, and audit."),
  control("ELATRE-RBAC-02", "role_based_access_control", "Job-function permissions", "Are permissions assigned through job functions rather than standing individual exceptions?", false, "Move standing access onto job-function roles and record exceptions with an owner and expiry."),
  control("ELATRE-RBAC-03", "role_based_access_control", "Privileged elevation", "Do privileged AI actions require a separate elevated role?", true, "Separate day-to-day use from index administration, model administration, and policy changes."),
  control("ELATRE-RBAC-04", "role_based_access_control", "Access review", "Are AI role memberships reviewed on a defined schedule?", false, "Review AI role membership on the same cadence as other privileged access."),
  control("ELATRE-RBAC-05", "role_based_access_control", "Inheritance limits", "Is permission inheritance documented and bounded so nested groups cannot grant unintended access?", true, "Document group nesting and block unbounded inheritance into AI data and tool permissions."),
  control("ELATRE-VEC-01", "vector_database_security", "Authenticated vector access", "Does every vector index require an authenticated identity before query or upsert?", true, "Disable anonymous queries and upserts on every vector index."),
  control("ELATRE-VEC-02", "vector_database_security", "Tenant or domain separation", "Are tenants or data domains separated by collection, namespace, or an equivalent boundary?", true, "Separate tenant or domain data so one caller cannot scan another party's index."),
  control("ELATRE-VEC-03", "vector_database_security", "Retrieval authorization", "Do retrieval filters enforce authorization metadata such as tenant, role, or document ACL?", true, "Apply an authorization filter on every retrieval before chunks are sent to a model."),
  control("ELATRE-VEC-04", "vector_database_security", "Embedding isolation", "Does the embedding pipeline keep unauthorized sources out of a shared unfiltered index?", true, "Stop embedding mixed-tenant data into an index that has no authorization filter."),
  control("ELATRE-VEC-05", "vector_database_security", "Network restriction", "Is the vector service reachable only from approved networks or private endpoints?", false, "Place the vector service on a private network or an explicit allow list."),
  control("ELATRE-VEC-06", "vector_database_security", "Encryption", "Is vector data encrypted in transit and at rest?", false, "Require TLS in transit and encryption at rest for vector data and backups."),
  control("ELATRE-PRIV-01", "data_privacy", "Data classification", "Are sources used for prompts, retrieval, and training classified before use?", false, "Classify source systems before they are embedded or sent to a model."),
  control("ELATRE-PRIV-02", "data_privacy", "Sensitive-data redaction", "Is there a control that detects or redacts PII or PHI before embedding or prompt submission?", true, "Redact or block classified personal data before it is embedded or sent to a provider."),
  control("ELATRE-PRIV-03", "data_privacy", "Retention and deletion", "Is there a retention and deletion process for prompts, embeddings, and AI logs?", false, "Define and operate retention and deletion for prompts, embeddings, and logs."),
  control("ELATRE-PRIV-04", "data_privacy", "Purpose limitation", "Is the permitted purpose of model and retrieval use documented?", false, "Document the purpose of each AI workflow and reject new uses that fall outside it."),
  control("ELATRE-PRIV-05", "data_privacy", "Vendor terms", "Are data-processing terms in place with model and vector vendors that will see the data?", true, "Confirm vendor terms cover the data classes actually sent to each service."),
  control("ELATRE-LLM-01", "llm_gateway_security", "Approved gateway", "Do model requests pass through an approved gateway or proxy?", true, "Route model traffic through an approved gateway and block direct provider calls."),
  control("ELATRE-LLM-02", "llm_gateway_security", "Provider allow list", "Is there an allow list of approved model endpoints?", false, "Allow only approved model endpoints and regions."),
  control("ELATRE-LLM-03", "llm_gateway_security", "Prompt and output checks", "Are prompts and outputs checked for injection signals and sensitive-data egress?", true, "Inspect prompts and outputs for policy violations before the result is returned or acted on."),
  control("ELATRE-LLM-04", "llm_gateway_security", "Secret exclusion", "Are secrets kept out of prompts and vector metadata?", true, "Scan prompts and metadata so credentials are not stored or sent to a model."),
  control("ELATRE-LLM-05", "llm_gateway_security", "Quotas", "Are per-application or per-tenant quotas enforced?", false, "Set quotas so one tenant or application cannot exhaust the gateway."),
  control("ELATRE-INT-01", "enterprise_integration_security", "Scoped integration credentials", "Do enterprise system connections use credentials scoped to that integration?", true, "Issue a dedicated credential for each enterprise integration."),
  control("ELATRE-INT-02", "enterprise_integration_security", "Least-privilege scopes", "Are integration scopes limited to the objects and actions the workflow needs?", false, "Reduce integration scopes to the required objects and actions."),
  control("ELATRE-INT-03", "enterprise_integration_security", "Authenticated callbacks", "Are inbound webhooks and callbacks authenticated?", false, "Authenticate every callback the AI workflow accepts."),
  control("ELATRE-INT-04", "enterprise_integration_security", "Environment separation", "Are production and non-production integrations separated?", false, "Use separate credentials and endpoints for production and non-production."),
  control("ELATRE-INT-05", "enterprise_integration_security", "SaaS AI inventory", "Are third-party AI features in connected SaaS platforms inventoried?", false, "Inventory embedded AI features in connected SaaS platforms and record their data use."),
  control("ELATRE-HITL-01", "human_in_the_loop_governance", "Named human owner", "Does each high-impact AI decision path have a named human owner?", true, "Name an accountable owner for every high-impact AI workflow."),
  control("ELATRE-HITL-02", "human_in_the_loop_governance", "Kill switch", "Is there an override or kill switch that can stop automated AI actions?", true, "Provide a tested way to disable model actions and retrieval for the workflow."),
  control("ELATRE-HITL-03", "human_in_the_loop_governance", "Action approval", "Is approval required before an agent performs a state-changing action?", true, "Require human approval before an agent writes to enterprise systems."),
  control("ELATRE-HITL-04", "human_in_the_loop_governance", "User reporting", "Can users report incorrect or harmful outputs?", false, "Give users a path to report incorrect or harmful AI output."),
  control("ELATRE-HITL-05", "human_in_the_loop_governance", "Change review", "Do model or prompt changes that affect customers require review?", false, "Review customer-facing prompt and model changes before release."),
  control("ELATRE-AUD-01", "audit_logging", "Access decision logs", "Are authentication and authorization decisions for AI systems logged?", true, "Log allow and deny decisions for AI access, including the actor and object."),
  control("ELATRE-AUD-02", "audit_logging", "Retrieval logs", "Are retrieval queries and the document identifiers returned written to an audit log?", true, "Log retrieval queries and the identifiers of records returned."),
  control("ELATRE-AUD-03", "audit_logging", "Invocation logs", "Do model invocations log actor, application, model, and time?", false, "Log each model invocation with actor, application, model, and timestamp."),
  control("ELATRE-AUD-04", "audit_logging", "Log protection", "Are AI audit logs access-restricted or tamper-evident?", false, "Restrict who can change AI audit logs and keep them on protected storage."),
  control("ELATRE-AUD-05", "audit_logging", "Log retention", "Does log retention match the stated policy?", false, "Retain AI audit logs for the period the policy requires."),
  control("ELATRE-IR-01", "incident_response", "AI incident definition", "Is an AI-specific incident defined, including data leakage, unauthorized retrieval, and unsafe agent action?", false, "Define which AI failures count as incidents."),
  control("ELATRE-IR-02", "incident_response", "Escalation path", "Does the escalation path include the AI platform owner?", true, "Add the AI platform owner to the incident escalation path."),
  control("ELATRE-IR-03", "incident_response", "Containment", "Do containment steps include disabling model access and vector queries?", true, "Document how to disable model access and vector queries during an incident."),
  control("ELATRE-IR-04", "incident_response", "Incident records", "Do incident records include a timeline and the data affected?", false, "Record the timeline and affected data for AI incidents."),
  control("ELATRE-IR-05", "incident_response", "Exercise", "Has the AI incident process been exercised, with a recorded date?", false, "Run the AI incident process and keep the date and result."),
  control("ELATRE-DOC-01", "compliance_documentation", "AI system inventory", "Is there an inventory of AI applications in scope?", true, "Maintain an inventory of AI applications, owners, data, and providers."),
  control("ELATRE-DOC-02", "compliance_documentation", "Data-flow description", "Is the flow of prompts, retrieval, and outputs documented?", false, "Document where prompts, retrieved text, and outputs travel."),
  control("ELATRE-DOC-03", "compliance_documentation", "Risk record", "Is there a risk record for the in-scope AI systems?", true, "Record AI risks and the treatment decision for each in-scope system."),
  control("ELATRE-DOC-04", "compliance_documentation", "Acceptable-use policy", "Is there a policy for acceptable AI use and shadow AI?", false, "Publish acceptable-use rules that cover unsanctioned AI tools."),
  control("ELATRE-DOC-05", "compliance_documentation", "Readiness evidence map", "Is evidence mapped to selected frameworks and labeled as readiness rather than certification?", false, "Map evidence to the selected frameworks and label it as readiness, not certification."),
];

function control(
  id: string,
  categoryId: CategoryId,
  title: string,
  question: string,
  critical: boolean,
  remediation: string,
): ControlDefinition {
  return { id, categoryId, title, question, weight: 1, critical, remediation };
}

const CATALOG_BY_ID = new Map(CONTROL_CATALOG.map((item) => [item.id, item]));

export interface ScoredControl {
  control_id: string;
  category_id: CategoryId;
  title: string;
  question: string;
  weight: number;
  critical: boolean;
  status: ControlStatus;
  earned_points: number;
  max_points: number;
  evidence: string | null;
  remediation: string;
}

export interface CategoryScore {
  category_id: CategoryId;
  title: string;
  score: number;
  risk_level: "low" | "moderate" | "high" | "unknown";
  earned_points: number;
  max_points: number;
  verified_controls: string[];
  partial_controls: string[];
  missing_controls: string[];
  unknown_controls: string[];
  controls: ScoredControl[];
}

export interface Finding {
  severity: "critical" | "high" | "moderate";
  kind: "missing_control" | "evidence_gap" | "partial_control";
  control_id?: string;
  category_id: CategoryId;
  message: string;
}

export interface ScoreResult {
  methodology_version: string;
  methodology: string;
  score: number;
  readiness_category: "insufficient_evidence" | "not_ready" | "developing" | "advanced_readiness" | "strong_evidence";
  coverage_percent: number;
  assessed_categories: CategoryScore[];
  verified_controls: string[];
  partial_controls: string[];
  unverified_controls: string[];
  missing_controls: string[];
  unknown_controls: string[];
  unrecognized_controls: string[];
  critical_findings: Finding[];
  recommendations: string[];
  score_explanation: string;
  points: { earned: number; maximum: number };
}

function percent(earnedUnits: number, maxUnits: number): number {
  if (maxUnits <= 0) return 0;
  return Math.round((earnedUnits * 10000) / maxUnits) / 100;
}

function units(status: ControlStatus, weight: number): number {
  if (status === "implemented") return weight * 2;
  if (status === "partial") return weight;
  return 0;
}

function riskFor(category: {
  score: number;
  known: number;
  missingCritical: number;
  unknownCritical: number;
}): CategoryScore["risk_level"] {
  if (category.known === 0) return "unknown";
  if (category.missingCritical > 0 || category.score < 40) return "high";
  if (category.unknownCritical > 0 || category.score < 70) return "moderate";
  return "low";
}

export function readinessCategory(score: number, coveragePercent: number): ScoreResult["readiness_category"] {
  if (coveragePercent === 0) return "insufficient_evidence";
  if (score < 40) return "not_ready";
  if (score < 70) return "developing";
  if (score < 90) return "advanced_readiness";
  return "strong_evidence";
}

export function scoreControls(evidence: readonly SecurityControlInput[]): ScoreResult {
  const seen = new Set<string>();
  const provided = new Map<string, SecurityControlInput>();
  const unrecognized: string[] = [];

  for (const item of evidence) {
    const id = item.control_id.toUpperCase();
    if (seen.has(id)) throw new InputValidationError(`Duplicate control_id: ${id}`);
    seen.add(id);
    const definition = CATALOG_BY_ID.get(id);
    if (!definition) {
      unrecognized.push(id);
      continue;
    }
    provided.set(id, { ...item, control_id: id });
  }

  const assessed: CategoryScore[] = CATEGORIES.map((category) => {
    const controls = CONTROL_CATALOG.filter((item) => item.categoryId === category.id).map((definition) => {
      const input = provided.get(definition.id);
      const status: ControlStatus = input?.status ?? "unknown";
      const scored: ScoredControl = {
        control_id: definition.id,
        category_id: definition.categoryId,
        title: definition.title,
        question: definition.question,
        weight: definition.weight,
        critical: definition.critical,
        status,
        earned_points: units(status, definition.weight) / 2,
        max_points: definition.weight,
        evidence: input?.evidence && input.evidence.length > 0 ? input.evidence : null,
        remediation: definition.remediation,
      };
      return scored;
    });

    const earnedUnits = controls.reduce((sum, item) => sum + units(item.status, item.weight), 0);
    const maxUnits = controls.reduce((sum, item) => sum + item.weight * 2, 0);
    const known = controls.filter((item) => item.status !== "unknown").length;
    const missingCritical = controls.filter((item) => item.critical && item.status === "missing").length;
    const unknownCritical = controls.filter((item) => item.critical && item.status === "unknown").length;
    const score = percent(earnedUnits, maxUnits);

    return {
      category_id: category.id,
      title: category.title,
      score,
      risk_level: riskFor({ score, known, missingCritical, unknownCritical }),
      earned_points: earnedUnits / 2,
      max_points: maxUnits / 2,
      verified_controls: controls.filter((item) => item.status === "implemented").map((item) => item.control_id),
      partial_controls: controls.filter((item) => item.status === "partial").map((item) => item.control_id),
      missing_controls: controls.filter((item) => item.status === "missing").map((item) => item.control_id),
      unknown_controls: controls.filter((item) => item.status === "unknown").map((item) => item.control_id),
      controls,
    };
  });

  const all = assessed.flatMap((category) => category.controls);
  const verified = all.filter((item) => item.status === "implemented").map((item) => item.control_id);
  const partial = all.filter((item) => item.status === "partial").map((item) => item.control_id);
  const missing = all.filter((item) => item.status === "missing").map((item) => item.control_id);
  const unknown = all.filter((item) => item.status === "unknown").map((item) => item.control_id);
  const knownCount = all.length - unknown.length;
  const coverage = percent(knownCount * 2, all.length * 2);
  const totalHundredths = assessed.reduce((sum, category) => sum + Math.round(category.score * 100), 0);
  const overall = Math.round(totalHundredths / assessed.length) / 100;

  const findings: Finding[] = [];
  for (const item of all) {
    if (item.critical && item.status === "missing") {
      findings.push({
        severity: "critical",
        kind: "missing_control",
        control_id: item.control_id,
        category_id: item.category_id,
        message: `${item.control_id} is missing: ${item.title}.`,
      });
    } else if (item.critical && item.status === "unknown") {
      findings.push({
        severity: "high",
        kind: "evidence_gap",
        control_id: item.control_id,
        category_id: item.category_id,
        message: `${item.control_id} is critical and has no evidence: ${item.title}.`,
      });
    } else if (item.critical && item.status === "partial") {
      findings.push({
        severity: "moderate",
        kind: "partial_control",
        control_id: item.control_id,
        category_id: item.category_id,
        message: `${item.control_id} is only partial: ${item.title}.`,
      });
    } else if (item.status === "missing") {
      findings.push({
        severity: "moderate",
        kind: "missing_control",
        control_id: item.control_id,
        category_id: item.category_id,
        message: `${item.control_id} is missing: ${item.title}.`,
      });
    }
  }

  const recommendations: string[] = [];
  const seenRecommendations = new Set<string>();
  for (const item of all) {
    if (item.status !== "missing" && item.status !== "partial") continue;
    if (seenRecommendations.has(item.remediation)) continue;
    seenRecommendations.add(item.remediation);
    recommendations.push(item.remediation);
  }
  if (unknown.length > 0) {
    recommendations.push("Collect evidence for unknown controls before using this score to make a release or compliance decision.");
  }
  if (unrecognized.length > 0) {
    recommendations.push("Remove unrecognized control ids or map them to catalog ids. Unrecognized ids do not change the score.");
  }

  const readiness = readinessCategory(overall, coverage);
  const explanation = `Overall score ${overall} is the mean of ${assessed.length} category scores. Implemented controls earn full weight, partial controls earn half weight, and missing or unknown controls earn zero. Unknown controls are not assumed to be implemented. ${knownCount} of ${all.length} controls had a status other than unknown (${coverage}% coverage). Readiness category is ${readiness}. This score is not a certification.`;

  return {
    methodology_version: METHODOLOGY_VERSION,
    methodology: SCORING_METHODOLOGY,
    score: overall,
    readiness_category: readiness,
    coverage_percent: coverage,
    assessed_categories: assessed,
    verified_controls: verified,
    partial_controls: partial,
    unverified_controls: [...partial, ...missing, ...unknown],
    missing_controls: missing,
    unknown_controls: unknown,
    unrecognized_controls: unrecognized,
    critical_findings: findings.filter((finding) => finding.severity === "critical" || finding.severity === "high"),
    recommendations,
    score_explanation: explanation,
    points: {
      earned: all.reduce((sum, item) => sum + item.earned_points, 0),
      maximum: all.reduce((sum, item) => sum + item.max_points, 0),
    },
  };
}

export function controlsByCategory(categoryIds: readonly CategoryId[]): ScoredControl["control_id"][] {
  return CONTROL_CATALOG.filter((item) => categoryIds.includes(item.categoryId)).map((item) => item.id);
}
