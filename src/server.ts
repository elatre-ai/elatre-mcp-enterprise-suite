import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ASSESSMENT_DISCLAIMER, SERVER_NAME, SERVER_VERSION } from "./config.js";
import { registerEnterpriseAuditPrompts } from "./prompts/enterprise-audit.js";
import { registerSecurityReviewPrompts } from "./prompts/security-review.js";
import { registerCompanyResources } from "./resources/company.js";
import { registerComplianceResources } from "./resources/compliance.js";
import { registerServiceResources } from "./resources/services.js";
import { registerArchitectureReadiness } from "./tools/architecture-readiness.js";
import { registerBookingTools } from "./tools/booking.js";
import { registerCompanyInformation } from "./tools/company-information.js";
import { registerComplianceChecklist } from "./tools/compliance-checklist.js";
import { registerGovernanceAudit } from "./tools/governance-audit.js";
import { registerRbacAssessment } from "./tools/rbac-assessment.js";

export function createServer(): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      instructions: [
        "Elatre MCP Enterprise RBAC Auditor answers from attested controls and the local Phase 1 research archive.",
        "Do not infer that a named product is integrated, tested, or certified.",
        "Unknown controls are not implemented controls.",
        ASSESSMENT_DISCLAIMER,
      ].join(" "),
      maxToolInputElements: 400,
    },
  );

  registerGovernanceAudit(server);
  registerRbacAssessment(server);
  registerComplianceChecklist(server);
  registerArchitectureReadiness(server);
  registerCompanyInformation(server);
  registerBookingTools(server);
  registerCompanyResources(server);
  registerServiceResources(server);
  registerComplianceResources(server);
  registerEnterpriseAuditPrompts(server);
  registerSecurityReviewPrompts(server);
  return server;
}
