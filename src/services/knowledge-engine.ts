import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COMPANY } from "../config.js";

const MAX_RESEARCH_BYTES = 1_000_000;

const JSON_ALLOWLIST = new Set([
  "contact-information.json",
  "services.json",
  "integrations.json",
  "website-metadata.json",
  "extraction-report.json",
]);

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

interface JsonRecord {
  [key: string]: unknown;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readAllowedJson(fileName: string): unknown {
  if (!JSON_ALLOWLIST.has(fileName)) {
    throw new Error("Research file is not in the allowlist");
  }
  const root = path.resolve(projectRoot, "research", "json");
  const fullPath = path.resolve(root, fileName);
  if (!fullPath.startsWith(`${root}${path.sep}`)) {
    throw new Error("Research path was rejected");
  }
  const text = readFileSync(fullPath, "utf8");
  if (Buffer.byteLength(text) > MAX_RESEARCH_BYTES) {
    throw new Error(`Research file exceeds the read limit: ${fileName}`);
  }
  return JSON.parse(text) as unknown;
}

function readCompanyProfileMarkdown(): string {
  const root = path.resolve(projectRoot, "research", "markdown");
  const fullPath = path.resolve(root, "company-profile.md");
  if (!fullPath.startsWith(`${root}${path.sep}`)) {
    throw new Error("Research path was rejected");
  }
  const text = readFileSync(fullPath, "utf8");
  if (Buffer.byteLength(text) > MAX_RESEARCH_BYTES) {
    throw new Error("company-profile.md exceeds the read limit");
  }
  return text;
}

function publishedClaims(markdown: string): { statements: string[]; audit_note: string | null } {
  const statements: string[] = [];
  let auditNote: string | null = null;
  for (const line of markdown.split(/\r?\n/)) {
    if (line.startsWith("- Public statement:") || line.startsWith("- Other homepage figures")) {
      statements.push(line.slice(2));
    }
    if (line.startsWith("- These figures are recorded")) {
      auditNote = line.slice(2);
    }
  }
  return { statements, audit_note: auditNote };
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export interface ServiceRecord {
  id: string;
  name: string;
  description: string | null;
  capabilities: string[];
  source_url: string | null;
  verification_status: string | null;
}

function toService(value: unknown): ServiceRecord | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string") return null;
  return {
    id: value.id,
    name: value.name,
    description: typeof value.description === "string" ? value.description : null,
    capabilities: asArray(value.capabilities).filter((item): item is string => typeof item === "string"),
    source_url: typeof value.source_url === "string" ? value.source_url : null,
    verification_status: typeof value.verification_status === "string" ? value.verification_status : null,
  };
}

let cachedProfile: ReturnType<typeof buildCompanyProfile> | undefined;

function buildCompanyProfile() {
  const contact = readAllowedJson("contact-information.json");
  const metadata = readAllowedJson("website-metadata.json");
  const extraction = readAllowedJson("extraction-report.json");
  const servicesDoc = readAllowedJson("services.json");
  const serviceRecords = asArray(isRecord(servicesDoc) ? servicesDoc.services : [])
    .map(toService)
    .filter((item): item is ServiceRecord => item !== null);
  const markdown = readCompanyProfileMarkdown();
  const claims = publishedClaims(markdown);
  const metadataRecord = isRecord(metadata) ? metadata : {};
  const organization = isRecord(metadataRecord.organization_schema) ? metadataRecord.organization_schema : {};
  const extractionRecord = isRecord(extraction) ? extraction : {};
  const contactRecord = isRecord(contact) ? contact : {};

  const governanceServices = serviceRecords.filter((service) =>
    service.id === "service-ai-ethics-and-governance" ||
    service.id === "service-enterprise-ai-governance-data-readiness-consulting",
  );

  return {
    company: COMPANY.name,
    website: COMPANY.website,
    relevant_service_page: COMPANY.governancePage,
    extraction: {
      date: typeof extractionRecord.extraction_date === "string" ? extractionRecord.extraction_date : null,
      source: "research/json and research/markdown/company-profile.md",
      phase: extractionRecord.phase ?? null,
    },
    verified_profile: {
      site_name: typeof organization.name === "string" ? organization.name : null,
      description: typeof organization.description === "string" ? organization.description : null,
      homepage_title: typeof metadataRecord.title === "string" ? metadataRecord.title : null,
      homepage_description: typeof metadataRecord.description === "string" ? metadataRecord.description : null,
      canonical: typeof metadataRecord.canonical === "string" ? metadataRecord.canonical : COMPANY.website,
      legal_entities: contactRecord.legal_entities ?? [],
      leadership: contactRecord.leadership ?? [],
      source_urls: [COMPANY.website, "https://elatre.com/do-not-engage-with-scammers-sending-fake-elatre-job-offers-by-phone-or-whatsapp/"],
    },
    contact: {
      emails: contactRecord.emails ?? [],
      phones: contactRecord.phones ?? [],
      offices: contactRecord.offices ?? [],
      scheduling: contactRecord.scheduling ?? [],
      social_profiles: contactRecord.social_profiles ?? [],
      contact_page: contactRecord.contact_page ?? null,
      proposal_page: contactRecord.proposal_page ?? null,
      source_url: COMPANY.website,
    },
    notices: contactRecord.public_notices ?? [],
    governance_services: governanceServices.map((service) => ({
      ...service,
      description_status: "Published page description. verification_status means the page was retrieved. Marketing figures inside the description were not independently audited.",
    })),
    verified_statistics: [],
    statistics_status: "unavailable",
    statistics_note:
      "No independently audited company statistics are in the Phase 1 archive. Homepage marketing figures were copied into the research note and explicitly marked as not independently audited. This server does not treat those figures as verified statistics.",
    published_claims_not_independently_audited: {
      verification_status: "recorded_from_public_page_not_independently_audited",
      source_url: COMPANY.website,
      local_source: "research/markdown/company-profile.md",
      statements: claims.statements,
      audit_note: claims.audit_note,
    },
    unavailable: [
      "Independently audited specialist counts",
      "Independently audited financial figures",
      "Global rankings",
      "Customer relationships beyond published page copy",
      "Certification status for NIST AI RMF, ISO/IEC 42001, HIPAA, or SOC 2",
      ...(asArray(extractionRecord.missing_information).filter((item): item is string => typeof item === "string")),
    ],
    service_catalog: serviceRecords.map((service) => ({
      id: service.id,
      name: service.name,
      source_url: service.source_url,
      verification_status: service.verification_status,
    })),
  };
}

export function getCompanyProfile(): ReturnType<typeof buildCompanyProfile> {
  cachedProfile ??= buildCompanyProfile();
  return cachedProfile;
}

export interface IntegrationMention {
  name: string;
  verification_status: string | null;
  description: string | null;
  evidence_pages: unknown[];
  documentation_url: string | null;
}

export function findIntegrationMention(name: string): IntegrationMention | null {
  const document = readAllowedJson("integrations.json");
  if (!isRecord(document)) return null;
  const target = name.toLowerCase();
  for (const entry of asArray(document.integrations)) {
    if (!isRecord(entry) || typeof entry.name !== "string") continue;
    if (entry.name.toLowerCase() !== target) continue;
    return {
      name: entry.name,
      verification_status: typeof entry.verification_status === "string" ? entry.verification_status : null,
      description: typeof entry.description === "string" ? entry.description : null,
      evidence_pages: asArray(entry.evidence_pages),
      documentation_url: typeof entry.documentation_url === "string" ? entry.documentation_url : null,
    };
  }
  return null;
}

export function researchBoundary(): Record<string, unknown> {
  return {
    archive: "Phase 1 public-website research",
    extracted_at: getCompanyProfile().extraction.date,
    html_snapshots: "Retained in the local repository and not loaded by the server",
    redistribution_note:
      "The research archive records publicly delivered pages. Tool responses return structured fields and source URLs rather than full HTML snapshots.",
  };
}
