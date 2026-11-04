import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ASSESSMENT_DISCLAIMER } from "../config.js";
import { listComplianceFrameworks } from "../tools/compliance-checklist.js";

export function registerComplianceResources(server: McpServer): void {
  server.registerResource(
    "enterprise-compliance",
    "elatre://enterprise/compliance",
    {
      title: "Compliance readiness boundaries",
      description: "Framework sources used for readiness questions, and the line between assessment, audit, and certification.",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify({
          disclaimer: ASSESSMENT_DISCLAIMER,
          distinctions: {
            security_architecture_assessment: "The scoring tools record attested technical controls.",
            compliance_readiness_assessment: "The checklist tool returns framework-specific questions and evidence ideas.",
            formal_audit: "Not performed by this server.",
            legal_compliance_determination: "Not performed by this server.",
            independent_certification: "Not performed by this server.",
          },
          elatre_certification_claims: "No independently verified Elatre certification for NIST AI RMF, ISO/IEC 42001, HIPAA, or SOC 2 is stored in the Phase 1 archive.",
          frameworks: listComplianceFrameworks(),
        }),
      }],
    }),
  );
}
