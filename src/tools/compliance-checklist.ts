import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { envelope } from "../services/assessment-engine.js";
import { checklistSchema, toolFailure, toolJson, type FrameworkId } from "../utils/validation.js";

export interface ChecklistQuestion {
  id: string;
  theme: string;
  question: string;
  recommended_evidence: string[];
  official_reference: string;
}

export interface ComplianceChecklist {
  framework_id: FrameworkId;
  name: string;
  version: string;
  source_title: string;
  source_url: string;
  assessment_type: "compliance_readiness_assessment";
  not_a: string[];
  applicability_note: string;
  questions: ChecklistQuestion[];
}

const NOT_A = [
  "formal audit",
  "legal compliance determination",
  "independent certification",
  "official Elatre audit",
];

const CHECKLISTS: Record<FrameworkId, ComplianceChecklist> = {
  nist_ai_rmf: {
    framework_id: "nist_ai_rmf",
    name: "NIST AI Risk Management Framework",
    version: "NIST AI 100-1 (AI RMF 1.0), January 26, 2023. Generative AI Profile: NIST AI 600-1, July 26, 2024.",
    source_title: "NIST Artificial Intelligence Risk Management Framework",
    source_url: "https://www.nist.gov/itl/ai-risk-management-framework",
    assessment_type: "compliance_readiness_assessment",
    not_a: NOT_A,
    applicability_note: "Questions are grouped under the four published AI RMF functions: GOVERN, MAP, MEASURE, and MANAGE. They are readiness questions. They are not official NIST subcategory identifiers.",
    questions: [
      question("ELATRE-READINESS-NIST-01", "GOVERN", "Are policies for AI risk management documented and assigned to owners?", ["Policy", "owner roster"], "NIST AI RMF 1.0 function GOVERN (NIST AI 100-1). Not an official subcategory identifier."),
      question("ELATRE-READINESS-NIST-02", "GOVERN", "Is there an inventory of AI systems and the contexts where they are used?", ["System inventory"], "NIST AI RMF 1.0 function GOVERN (NIST AI 100-1). Not an official subcategory identifier."),
      question("ELATRE-READINESS-NIST-03", "MAP", "Are intended use, users, and foreseeable misuse recorded for each in-scope system?", ["Use-case record"], "NIST AI RMF 1.0 function MAP (NIST AI 100-1). Not an official subcategory identifier."),
      question("ELATRE-READINESS-NIST-04", "MAP", "Are data sources, including retrieval sources, described with their limitations?", ["Data-source record"], "NIST AI RMF 1.0 function MAP (NIST AI 100-1). Not an official subcategory identifier."),
      question("ELATRE-READINESS-NIST-05", "MEASURE", "Are tests or evaluations defined for the risks that matter to the use case?", ["Evaluation plan", "latest result"], "NIST AI RMF 1.0 function MEASURE (NIST AI 100-1). Not an official subcategory identifier."),
      question("ELATRE-READINESS-NIST-06", "MANAGE", "Are risks prioritized, treated, and monitored after deployment?", ["Risk register", "monitoring record"], "NIST AI RMF 1.0 function MANAGE (NIST AI 100-1). Not an official subcategory identifier."),
      question("ELATRE-READINESS-NIST-07", "MANAGE", "For generative systems, is the NIST Generative AI Profile consulted as additional guidance?", ["Profile review note"], "NIST AI 600-1 Generative AI Profile. Not an official subcategory identifier."),
    ],
  },
  iso_42001: {
    framework_id: "iso_42001",
    name: "ISO/IEC 42001",
    version: "ISO/IEC 42001:2023",
    source_title: "ISO/IEC 42001:2023 Information technology — Artificial intelligence — Management system",
    source_url: "https://www.iso.org/standard/81230.html",
    assessment_type: "compliance_readiness_assessment",
    not_a: NOT_A,
    applicability_note: "Questions follow management-system themes used by ISO/IEC 42001:2023. This server does not reproduce Annex A control identifiers. The standard text is published by ISO.",
    questions: [
      question("ELATRE-READINESS-ISO-01", "Context of the organization", "Are the internal and external issues that affect the AI management system recorded?", ["Context record"], "ISO/IEC 42001:2023 management-system theme: context of the organization. Annex A identifiers are not reproduced."),
      question("ELATRE-READINESS-ISO-02", "Leadership", "Does leadership assign responsibility for the AI management system?", ["Role assignment"], "ISO/IEC 42001:2023 management-system theme: leadership. Annex A identifiers are not reproduced."),
      question("ELATRE-READINESS-ISO-03", "Planning", "Are AI risks and opportunities identified and is a treatment plan recorded?", ["Risk and treatment plan"], "ISO/IEC 42001:2023 management-system theme: planning. Annex A identifiers are not reproduced."),
      question("ELATRE-READINESS-ISO-04", "Support", "Are people, documented information, and competence available for the AI system lifecycle?", ["Competence or training record"], "ISO/IEC 42001:2023 management-system theme: support. Annex A identifiers are not reproduced."),
      question("ELATRE-READINESS-ISO-05", "Operation", "Are operational controls defined for design, data, deployment, and supplier AI services?", ["Operational procedure"], "ISO/IEC 42001:2023 management-system theme: operation. Annex A identifiers are not reproduced."),
      question("ELATRE-READINESS-ISO-06", "Performance evaluation", "Are monitoring, measurement, internal review, and management review planned?", ["Review minutes"], "ISO/IEC 42001:2023 management-system theme: performance evaluation. Annex A identifiers are not reproduced."),
      question("ELATRE-READINESS-ISO-07", "Improvement", "Are nonconformities and corrective actions tracked?", ["Corrective-action log"], "ISO/IEC 42001:2023 management-system theme: improvement. Annex A identifiers are not reproduced."),
    ],
  },
  eu_ai_act: {
    framework_id: "eu_ai_act",
    name: "EU AI Act",
    version: "Regulation (EU) 2024/1689",
    source_title: "Regulation (EU) 2024/1689 of the European Parliament and of the Council",
    source_url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
    assessment_type: "compliance_readiness_assessment",
    not_a: NOT_A,
    applicability_note: "Article references are orientation points in Regulation (EU) 2024/1689. This server does not decide whether a system is prohibited, high-risk, or in scope, and it does not decide whether the caller is a provider or a deployer.",
    questions: [
      question("ELATRE-READINESS-EU-01", "Prohibited practices", "Has the use case been checked against prohibited AI practices?", ["Scope screening memo"], "Regulation (EU) 2024/1689, Article 5. Applicability is not determined by this server."),
      question("ELATRE-READINESS-EU-02", "Classification", "Has the system been screened against the high-risk classification rules?", ["Classification screening"], "Regulation (EU) 2024/1689, Article 6. Applicability is not determined by this server."),
      question("ELATRE-READINESS-EU-03", "Risk management", "If the system may be high-risk, is a risk management process described?", ["Risk management description"], "Regulation (EU) 2024/1689, Article 9. Applicability is not determined by this server."),
      question("ELATRE-READINESS-EU-04", "Data governance", "Are data governance practices described for training, validation, and testing data where those datasets exist?", ["Data governance note"], "Regulation (EU) 2024/1689, Article 10. Applicability is not determined by this server."),
      question("ELATRE-READINESS-EU-05", "Technical documentation", "Is technical documentation sufficient for a qualified reviewer to understand the system?", ["Technical documentation index"], "Regulation (EU) 2024/1689, Article 11. Applicability is not determined by this server."),
      question("ELATRE-READINESS-EU-06", "Record-keeping", "Are logs retained that can support traceability of the system's operation?", ["Logging specification"], "Regulation (EU) 2024/1689, Article 12. Applicability is not determined by this server."),
      question("ELATRE-READINESS-EU-07", "Transparency and human oversight", "Are instructions, transparency measures, and human oversight measures described?", ["Oversight procedure"], "Regulation (EU) 2024/1689, Articles 13 and 14. Applicability is not determined by this server."),
      question("ELATRE-READINESS-EU-08", "Accuracy, robustness, cybersecurity", "Are accuracy, robustness, and cybersecurity measures described for the use case?", ["Security and evaluation notes"], "Regulation (EU) 2024/1689, Article 15. Applicability is not determined by this server."),
    ],
  },
  hipaa: {
    framework_id: "hipaa",
    name: "HIPAA Security and Privacy Rules",
    version: "45 CFR Part 164. Security Rule safeguards and selected Privacy Rule provisions.",
    source_title: "HHS HIPAA Security Rule guidance",
    source_url: "https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html",
    assessment_type: "compliance_readiness_assessment",
    not_a: NOT_A,
    applicability_note: "Use this checklist only when the organization has already determined that it is a covered entity or business associate handling PHI. This server does not make that determination.",
    questions: [
      question("ELATRE-READINESS-HIPAA-01", "Security management", "Is there a risk analysis and risk management process covering ePHI used by the AI system?", ["Risk analysis"], "45 CFR 164.308(a)(1)."),
      question("ELATRE-READINESS-HIPAA-02", "Workforce and access", "Are workforce clearance, authorization, and termination applied to people who can reach ePHI through the AI system?", ["Access procedure"], "45 CFR 164.308(a)(3) and 164.308(a)(4)."),
      question("ELATRE-READINESS-HIPAA-03", "Information access", "Is access to ePHI in prompts, indexes, and logs limited to authorized persons or software?", ["Authorization matrix"], "45 CFR 164.312(a)(1)."),
      question("ELATRE-READINESS-HIPAA-04", "Authentication and audit", "Are users and services authenticated, and are audit controls in place for systems that handle ePHI?", ["Authentication standard", "audit log sample"], "45 CFR 164.312(b) and 164.312(d)."),
      question("ELATRE-READINESS-HIPAA-05", "Integrity and transmission", "Are integrity and transmission security controls applied to ePHI in transit to models or vector stores?", ["Encryption standard"], "45 CFR 164.312(c)(1) and 164.312(e)(1)."),
      question("ELATRE-READINESS-HIPAA-06", "Incidents and contingencies", "Are security incident procedures and contingency plans able to cover the AI system?", ["Incident procedure", "contingency plan"], "45 CFR 164.308(a)(6) and 164.308(a)(7)."),
      question("ELATRE-READINESS-HIPAA-07", "Vendors and documentation", "Are business associate arrangements and required policies in place for vendors that create, receive, maintain, or transmit ePHI?", ["Business associate agreement", "policy index"], "45 CFR 164.314 and 164.316."),
      question("ELATRE-READINESS-HIPAA-08", "Permitted use", "Is use or disclosure of PHI by the AI workflow limited to a permitted purpose?", ["Purpose memo"], "45 CFR 164.502. This server does not decide whether a disclosure is permitted."),
    ],
  },
  soc2: {
    framework_id: "soc2",
    name: "SOC 2 Trust Services Criteria",
    version: "AICPA 2017 Trust Services Criteria with revised points of focus (2022).",
    source_title: "2017 Trust Services Criteria with revised points of focus (2022)",
    source_url: "https://www.aicpa-cima.com/resources/download/2017-trust-services-criteria-with-revised-points-of-focus-2022",
    assessment_type: "compliance_readiness_assessment",
    not_a: NOT_A,
    applicability_note: "Questions use the published Trust Services Criteria categories and common-criteria series names. Point-of-focus text and a SOC 2 report are not reproduced or issued here. Security is the common category. Availability, processing integrity, confidentiality, and privacy apply only when those categories are in scope.",
    questions: [
      question("ELATRE-READINESS-SOC-01", "Control environment", "Are integrity, oversight, and authority for the AI service defined?", ["Governance charter"], "AICPA Trust Services Criteria, CC1 Control Environment. Point-of-focus text is not reproduced."),
      question("ELATRE-READINESS-SOC-02", "Communication and risk", "Are AI risks communicated and assessed, including vendor and data risks?", ["Risk assessment"], "AICPA Trust Services Criteria, CC2 Communication and Information and CC3 Risk Assessment. Point-of-focus text is not reproduced."),
      question("ELATRE-READINESS-SOC-03", "Monitoring and control activities", "Are control activities and monitoring defined for the AI service?", ["Control listing", "monitoring evidence"], "AICPA Trust Services Criteria, CC4 Monitoring Activities and CC5 Control Activities. Point-of-focus text is not reproduced."),
      question("ELATRE-READINESS-SOC-04", "Logical access", "Are logical access controls applied to models, indexes, credentials, and administrative consoles?", ["Access-control evidence"], "AICPA Trust Services Criteria, CC6 Logical and Physical Access Controls. Point-of-focus text is not reproduced."),
      question("ELATRE-READINESS-SOC-05", "Operations", "Are vulnerabilities, incidents, and operational failures of the AI service detected and acted on?", ["Incident record"], "AICPA Trust Services Criteria, CC7 System Operations. Point-of-focus text is not reproduced."),
      question("ELATRE-READINESS-SOC-06", "Change management", "Are changes to prompts, models, indexes, and integrations authorized and tested?", ["Change record"], "AICPA Trust Services Criteria, CC8 Change Management. Point-of-focus text is not reproduced."),
      question("ELATRE-READINESS-SOC-07", "Risk mitigation and additional categories", "Are vendor risks mitigated, and are availability, confidentiality, processing integrity, or privacy criteria included only when those categories are in the intended SOC 2 scope?", ["Vendor review", "scope statement"], "AICPA Trust Services Criteria, CC9 Risk Mitigation, plus categories A, C, PI, and P only when in scope. Point-of-focus identifiers are not reproduced."),
    ],
  },
};

function question(id: string, theme: string, text: string, evidence: string[], reference: string): ChecklistQuestion {
  return { id, theme, question: text, recommended_evidence: evidence, official_reference: reference };
}

export function getComplianceChecklist(framework: FrameworkId): ComplianceChecklist {
  return CHECKLISTS[framework];
}

export function listComplianceFrameworks(): Array<Pick<ComplianceChecklist, "framework_id" | "name" | "version" | "source_url">> {
  return Object.values(CHECKLISTS).map((checklist) => ({
    framework_id: checklist.framework_id,
    name: checklist.name,
    version: checklist.version,
    source_url: checklist.source_url,
  }));
}

export function registerComplianceChecklist(server: McpServer): void {
  server.registerTool(
    "generate_compliance_checklist",
    {
      title: "Generate a compliance readiness checklist",
      description:
        "Return readiness questions and recommended evidence for NIST AI RMF, ISO/IEC 42001, the EU AI Act, HIPAA, or SOC 2. Questions use published framework names and source URLs. This is not a certification, legal opinion, or formal audit.",
      inputSchema: checklistSchema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      const parsed = checklistSchema.safeParse(args);
      if (!parsed.success) return toolFailure("invalid_input", { issues: parsed.error.issues.map((issue) => issue.message) });
      return toolJson(envelope("compliance_readiness_checklist", getComplianceChecklist(parsed.data.framework)));
    },
  );
}
