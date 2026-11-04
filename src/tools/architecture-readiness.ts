import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { analyzeStack, envelope, fullScore } from "../services/assessment-engine.js";
import { getComplianceChecklist } from "./compliance-checklist.js";
import { InputValidationError, readinessSchema, stackAnalysisSchema, toolFailure, toolJson } from "../utils/validation.js";

export function registerArchitectureReadiness(server: McpServer): void {
  server.registerTool(
    "calculate_architecture_readiness",
    {
      title: "Calculate architecture readiness",
      description:
        "Calculate a deterministic readiness score from 0 to 100 from attested controls. Returns the score, readiness category, category breakdown, verified, partial, missing, and unknown controls, critical findings, and recommendations. Unknown controls score zero and are not treated as implemented. The score is not a certification.",
      inputSchema: readinessSchema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      const parsed = readinessSchema.safeParse(args);
      if (!parsed.success) return toolFailure("invalid_input", { issues: parsed.error.issues.map((issue) => issue.message) });
      try {
        const score = fullScore(parsed.data.existing_security_controls);
        const framework = parsed.data.compliance_framework
          ? {
              framework_id: parsed.data.compliance_framework,
              name: getComplianceChecklist(parsed.data.compliance_framework).name,
              source_url: getComplianceChecklist(parsed.data.compliance_framework).source_url,
              effect_on_score: "none",
            }
          : null;
        return toolJson(envelope("architecture_readiness_score", { ...score, selected_framework: framework }));
      } catch (error) {
        if (error instanceof InputValidationError) return toolFailure(error.message);
        return toolFailure("assessment_failed");
      }
    },
  );

  server.registerTool(
    "analyze_enterprise_ai_stack",
    {
      title: "Analyze an enterprise AI stack",
      description:
        "Review caller-selected combinations of Salesforce, HubSpot, AWS Bedrock, Azure OpenAI, Google Vertex AI, Pinecone, Weaviate, and Snowflake. Returns security considerations and whether Phase 1 research recorded a public Elatre mention. Integrations are not marked tested.",
      inputSchema: stackAnalysisSchema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      const parsed = stackAnalysisSchema.safeParse(args);
      if (!parsed.success) return toolFailure("invalid_input", { issues: parsed.error.issues.map((issue) => issue.message) });
      return toolJson(envelope("enterprise_ai_stack_analysis", analyzeStack(parsed.data.platforms)));
    },
  );
}
