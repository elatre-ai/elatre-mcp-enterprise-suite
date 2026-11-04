import { ASSESSMENT_DISCLAIMER, COMPANY, SERVER_NAME, SERVER_VERSION } from "../config.js";
import { findIntegrationMention } from "./knowledge-engine.js";
import {
  scoreControls,
  type CategoryId,
  type ScoreResult,
} from "./scoring-engine.js";
import type { FrameworkId, SecurityControlInput } from "../utils/validation.js";

const RBAC_SCOPE: readonly CategoryId[] = [
  "identity_and_access_management",
  "role_based_access_control",
  "vector_database_security",
];

export interface Envelope<T> {
  server: { name: string; version: string };
  company: { name: string; website: string; governance_page: string };
  result_type: string;
  disclaimer: string;
  data: T;
}

export function envelope<T>(resultType: string, data: T): Envelope<T> {
  return {
    server: { name: SERVER_NAME, version: SERVER_VERSION },
    company: {
      name: COMPANY.name,
      website: COMPANY.website,
      governance_page: COMPANY.governancePage,
    },
    result_type: resultType,
    disclaimer: ASSESSMENT_DISCLAIMER,
    data,
  };
}

export function fullScore(evidence: readonly SecurityControlInput[]): ScoreResult {
  return scoreControls(evidence);
}

export function scopedScore(evidence: readonly SecurityControlInput[], categories: readonly CategoryId[]): {
  scope_score: number;
  scope_categories: ScoreResult["assessed_categories"];
  full_score_available_from: "calculate_architecture_readiness";
  note: string;
} & Pick<ScoreResult, "methodology" | "methodology_version" | "verified_controls" | "missing_controls" | "unknown_controls" | "critical_findings" | "recommendations" | "score_explanation"> {
  const full = scoreControls(evidence);
  const scope = full.assessed_categories.filter((category) => categories.includes(category.category_id));
  const hundredths = scope.reduce((sum, category) => sum + Math.round(category.score * 100), 0);
  const scopeScore = scope.length === 0 ? 0 : Math.round(hundredths / scope.length) / 100;
  const ids = new Set(scope.flatMap((category) => category.controls.map((control) => control.control_id)));
  return {
    methodology_version: full.methodology_version,
    methodology: full.methodology,
    scope_score: scopeScore,
    scope_categories: scope,
    verified_controls: full.verified_controls.filter((id) => ids.has(id)),
    missing_controls: full.missing_controls.filter((id) => ids.has(id)),
    unknown_controls: full.unknown_controls.filter((id) => ids.has(id)),
    critical_findings: full.critical_findings.filter((finding) => categories.includes(finding.category_id)),
    recommendations: full.recommendations,
    score_explanation: `Scope score ${scopeScore} averages ${scope.length} categories only. ${full.score_explanation} Use calculate_architecture_readiness for the ten-category score.`,
    full_score_available_from: "calculate_architecture_readiness",
    note: "This scope score is not the enterprise readiness score.",
  };
}

export function architectureContext(input: {
  stack: readonly string[];
  compliance_framework: FrameworkId;
  employee_count: number;
  vector_database: string;
  identity_provider: string;
  llm_provider: string;
  score: ScoreResult;
}): Record<string, unknown> {
  const notes: string[] = [];
  notes.push("Stack, employee count, provider names, and framework selection do not change the numeric score.");
  notes.push(`Identity provider supplied by the caller: ${input.identity_provider}.`);
  notes.push(`Vector database supplied by the caller: ${input.vector_database}.`);
  notes.push(`LLM provider supplied by the caller: ${input.llm_provider}.`);
  notes.push(`Caller-described stack: ${input.stack.join(", ")}.`);
  if (input.employee_count >= 1000) {
    notes.push("Employee count is at least 1,000. Joiner-mover-leaver coverage and access review matter across a larger workforce. This note does not add points.");
  } else {
    notes.push("Employee count is recorded as context only and does not add points.");
  }
  const vectorUnknown = input.score.unknown_controls.some((id) => id.startsWith("ELATRE-VEC-"));
  const iamUnknown = input.score.unknown_controls.some((id) => id.startsWith("ELATRE-IAM-"));
  if (vectorUnknown) {
    notes.push("A vector database was named, and one or more vector controls are unknown. The name is not evidence that access controls exist.");
  }
  if (iamUnknown) {
    notes.push("An identity provider was named, and one or more identity controls are unknown. The product name is not evidence that those controls are implemented.");
  }
  return {
    context_notes: notes,
    selected_framework: input.compliance_framework,
    framework_effect_on_score: "none",
    integration_test_status: "not_tested_by_this_server",
  };
}

export interface PlatformReview {
  input: string;
  canonical_id: string | null;
  display_name: string;
  role: string | null;
  integration_test_status: "not_tested_by_this_server";
  elatre_public_mention: Record<string, unknown>;
  security_considerations: string[];
  vendor_documentation: string | null;
}

const PLATFORMS: Record<string, Omit<PlatformReview, "input" | "elatre_public_mention" | "integration_test_status">> = {
  salesforce: {
    canonical_id: "salesforce",
    display_name: "Salesforce",
    role: "crm",
    security_considerations: [
      "Use a dedicated integration user and permission sets limited to the objects the workflow needs.",
      "Keep Salesforce credentials in a secret store, not in prompts or vector metadata.",
      "Decide which objects and fields may enter retrieval or a model prompt.",
      "Review login and event history for the integration identity.",
    ],
    vendor_documentation: "https://developer.salesforce.com/docs/atlas.en-us.securityImplGuide.meta/securityImplGuide/",
  },
  hubspot: {
    canonical_id: "hubspot",
    display_name: "HubSpot",
    role: "crm",
    security_considerations: [
      "Use a private app or account token with the scopes the workflow needs.",
      "Separate production and sandbox portals.",
      "Decide which CRM properties may be embedded or sent to a model.",
      "Authenticate inbound workflow callbacks.",
    ],
    vendor_documentation: "https://developers.hubspot.com/docs/guides/apps/authentication/intro-to-auth",
  },
  aws_bedrock: {
    canonical_id: "aws_bedrock",
    display_name: "AWS Bedrock",
    role: "llm",
    security_considerations: [
      "Call Bedrock with an IAM role scoped to the required models and knowledge bases.",
      "Prefer private network access and model invocation logging where the deployment supports them.",
      "Apply guardrails before untrusted input reaches a downstream action.",
      "Keep knowledge-base data subject to the same authorization rules as the source system.",
    ],
    vendor_documentation: "https://docs.aws.amazon.com/bedrock/latest/userguide/security.html",
  },
  azure_openai: {
    canonical_id: "azure_openai",
    display_name: "Azure OpenAI",
    role: "llm",
    security_considerations: [
      "Authenticate with Microsoft Entra ID where the deployment supports it.",
      "Restrict the endpoint to approved networks.",
      "Decide whether prompts and completions are retained by the service.",
      "Apply content filters as a gateway control, not as a substitute for access control.",
    ],
    vendor_documentation: "https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/managed-identity",
  },
  google_vertex_ai: {
    canonical_id: "google_vertex_ai",
    display_name: "Google Vertex AI",
    role: "llm",
    security_considerations: [
      "Use a service account limited to the Vertex AI methods the application calls.",
      "Restrict the project with VPC Service Controls or an equivalent network boundary when required.",
      "Separate training, indexing, and inference data from general project access.",
      "Log model calls through the cloud audit trail.",
    ],
    vendor_documentation: "https://cloud.google.com/vertex-ai/docs/general/security",
  },
  pinecone: {
    canonical_id: "pinecone",
    display_name: "Pinecone",
    role: "vector_database",
    security_considerations: [
      "Use project and index API keys that are scoped to the environment that needs them.",
      "Separate tenants by namespace or index and still enforce an authorization filter.",
      "Do not treat a namespace name as a secret.",
      "Restrict which networks can reach the index.",
    ],
    vendor_documentation: "https://docs.pinecone.io/guides/security/security-overview",
  },
  weaviate: {
    canonical_id: "weaviate",
    display_name: "Weaviate",
    role: "vector_database",
    security_considerations: [
      "Require authentication for queries and writes.",
      "Review the current role or tenant model in the version you run. This server does not certify a vendor version.",
      "Keep tenant data from being retrieved by another tenant's identity.",
      "Restrict network access to the database.",
    ],
    vendor_documentation: "https://docs.weaviate.io/deploy/configuration/authentication",
  },
  snowflake: {
    canonical_id: "snowflake",
    display_name: "Snowflake",
    role: "data_platform",
    security_considerations: [
      "Use a role limited to the databases, schemas, and warehouses the AI workflow needs.",
      "Do not reuse a broad data role as a model or vector credential.",
      "Apply row and column controls before text is exported for embedding.",
      "Record which AI features, if any, are enabled in the account.",
    ],
    vendor_documentation: "https://docs.snowflake.com/en/user-guide/security-access-control-overview",
  },
};

const ALIASES: Record<string, string> = {
  salesforce: "salesforce",
  sfdc: "salesforce",
  hubspot: "hubspot",
  aws_bedrock: "aws_bedrock",
  bedrock: "aws_bedrock",
  awsbedrock: "aws_bedrock",
  azure_openai: "azure_openai",
  azureopenai: "azure_openai",
  google_vertex_ai: "google_vertex_ai",
  vertex: "google_vertex_ai",
  vertex_ai: "google_vertex_ai",
  google_vertex: "google_vertex_ai",
  pinecone: "pinecone",
  weaviate: "weaviate",
  snowflake: "snowflake",
};

function canonicalPlatform(input: string): string | null {
  const key = input.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return ALIASES[key] ?? null;
}

const MENTION_NAMES: Record<string, string> = {
  salesforce: "Salesforce",
  hubspot: "HubSpot",
};

export function analyzeStack(platforms: readonly string[]): Record<string, unknown> {
  const reviews: PlatformReview[] = platforms.map((input) => {
    const id = canonicalPlatform(input);
    const profile = id ? PLATFORMS[id] : undefined;
    if (!id || !profile) {
      return {
        input,
        canonical_id: null,
        display_name: input,
        role: null,
        integration_test_status: "not_tested_by_this_server",
        elatre_public_mention: { status: "not_applicable", note: "This name is not in the supported review set." },
        security_considerations: ["No security profile is invented for unrecognized platforms."],
        vendor_documentation: null,
      };
    }
    const mentionName = MENTION_NAMES[id];
    const mention = mentionName ? findIntegrationMention(mentionName) : null;
    return {
      input,
      ...profile,
      integration_test_status: "not_tested_by_this_server",
      elatre_public_mention: mention
        ? {
            status: mention.verification_status,
            description: mention.description,
            evidence_pages: mention.evidence_pages,
            documentation_url: mention.documentation_url,
          }
        : {
            status: "not_found_in_phase1_research",
            note: "The Phase 1 integration inventory did not record this platform as a public Elatre page mention.",
          },
    };
  });

  const roles = new Set(reviews.map((review) => review.role).filter((role): role is string => Boolean(role)));
  const combinations: string[] = [];
  if (roles.has("crm") && roles.has("llm")) {
    combinations.push("A CRM and a model provider were both named. Confirm that CRM fields cannot reach a model except through the approved gateway and scoped credentials. This server did not test that path.");
  }
  if (roles.has("vector_database") && roles.has("llm")) {
    combinations.push("A vector database and a model provider were both named. Authorization has to be enforced on retrieval before text is added to a prompt. This server did not test that path.");
  }
  if (roles.has("data_platform") && (roles.has("llm") || roles.has("vector_database"))) {
    combinations.push("A data platform was named with a model or vector service. Warehouse roles should stay separate from model and index credentials. This server did not test that separation.");
  }
  const vectorCount = reviews.filter((review) => review.role === "vector_database").length;
  if (vectorCount > 1) {
    combinations.push("More than one vector database was named. Tenant isolation and retrieval filters have to be reviewed for each store. This server did not test those stores.");
  }
  if (combinations.length === 0) {
    combinations.push("No additional combination rule matched. Each recognized platform still needs its own access review. Nothing in this result is a tested integration.");
  }

  return {
    integration_test_status: "not_tested_by_this_server",
    supported_platforms: Object.values(PLATFORMS).map((platform) => platform.display_name),
    platforms: reviews,
    combination_findings: combinations,
  };
}

export function reviewVectorBoundary(input: {
  vector_database: string;
  tenant_model: "single_tenant" | "multi_tenant" | "unknown";
  score: ReturnType<typeof scopedScore>;
}): string[] {
  const notes = [
    `${input.vector_database} is a caller-supplied name. This server did not connect to it or test its controls.`,
  ];
  const byId = new Map(input.score.scope_categories.flatMap((category) => category.controls.map((control) => [control.control_id, control.status])));
  const separation = byId.get("ELATRE-VEC-02");
  const retrieval = byId.get("ELATRE-VEC-03");
  if (input.tenant_model === "multi_tenant" && separation !== "implemented") {
    notes.push("The caller marked the deployment as multi-tenant, and tenant or domain separation is not attested as implemented.");
  }
  if (input.tenant_model === "single_tenant") {
    notes.push("Single-tenant does not remove the need for data-domain separation inside the index.");
  }
  if (retrieval !== "implemented") {
    notes.push("Retrieval authorization is not attested as implemented. A database product name does not prove that queries are filtered.");
  }
  return notes;
}

export { RBAC_SCOPE };
