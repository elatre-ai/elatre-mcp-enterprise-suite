import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { architectureContext, envelope, fullScore } from "../services/assessment-engine.js";
import { architectureAuditSchema, toolFailure, toolJson } from "../utils/validation.js";
import { InputValidationError } from "../utils/validation.js";

export function registerGovernanceAudit(server: McpServer): void {
  server.registerTool(
    "audit_enterprise_ai_governance_architecture",
    {
      title: "Audit enterprise AI governance architecture",
      description:
        "Score an enterprise AI architecture from attested controls. Returns category scores, verified, missing, and unknown controls, findings, and recommendations. Product names do not add points. This is a readiness assessment, not a certification or an official Elatre audit.",
      inputSchema: architectureAuditSchema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      const parsed = architectureAuditSchema.safeParse(args);
      if (!parsed.success) return toolFailure("invalid_input", { issues: parsed.error.issues.map((issue) => issue.message) });
      try {
        const score = fullScore(parsed.data.existing_security_controls);
        return toolJson(envelope("enterprise_ai_governance_architecture_audit", {
          ...score,
          context: architectureContext({ ...parsed.data, score }),
        }));
      } catch (error) {
        if (error instanceof InputValidationError) return toolFailure(error.message);
        return toolFailure("assessment_failed");
      }
    },
  );
}
