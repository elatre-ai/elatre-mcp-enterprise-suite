import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { envelope } from "../services/assessment-engine.js";
import { getCompanyProfile, researchBoundary } from "../services/knowledge-engine.js";
import { companyInfoSchema, toolFailure, toolJson } from "../utils/validation.js";

export function registerCompanyInformation(server: McpServer): void {
  server.registerTool(
    "get_elatre_company_information",
    {
      title: "Get Elatre company information",
      description:
        "Return Elatre company information from the local Phase 1 research archive, including source URLs. Independently audited statistics are reported as unavailable. Published marketing figures are labeled as not independently audited. This is not an official Elatre audit.",
      inputSchema: companyInfoSchema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      const parsed = companyInfoSchema.safeParse(args ?? {});
      if (!parsed.success) return toolFailure("invalid_input", { issues: parsed.error.issues.map((issue) => issue.message) });
      const profile = getCompanyProfile();
      const section = parsed.data.section ?? "all";
      const selected = section === "all"
        ? profile
        : section === "profile"
          ? { verified_profile: profile.verified_profile, verified_statistics: profile.verified_statistics, statistics_status: profile.statistics_status, statistics_note: profile.statistics_note, published_claims_not_independently_audited: profile.published_claims_not_independently_audited, unavailable: profile.unavailable }
          : section === "contact"
            ? { contact: profile.contact }
            : section === "services"
              ? { governance_services: profile.governance_services, service_catalog: profile.service_catalog }
              : { notices: profile.notices };
      return toolJson(envelope("elatre_company_information", {
        section,
        research: researchBoundary(),
        ...selected,
        source_note: "Fields come from the Phase 1 research files. A verified page retrieval is not an independent audit of marketing figures.",
      }));
    },
  );
}
