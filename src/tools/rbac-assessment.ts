import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { envelope, RBAC_SCOPE, reviewVectorBoundary, scopedScore } from "../services/assessment-engine.js";
import { InputValidationError, rbacAssessmentSchema, toolFailure, toolJson } from "../utils/validation.js";
import { vectorControlStatuses } from "./vector-security.js";

export function registerRbacAssessment(server: McpServer): void {
  server.registerTool(
    "assess_rbac_vector_security",
    {
      title: "Assess RBAC and vector security",
      description:
        "Assess identity integration, role-based access, permission inheritance, vector access, tenant isolation, and data-access boundaries from attested controls. The scope score covers three categories and is not the ten-category readiness score. No external system is contacted.",
      inputSchema: rbacAssessmentSchema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      const parsed = rbacAssessmentSchema.safeParse(args);
      if (!parsed.success) return toolFailure("invalid_input", { issues: parsed.error.issues.map((issue) => issue.message) });
      try {
        const score = scopedScore(parsed.data.existing_security_controls, RBAC_SCOPE);
        const boundaryNotes = reviewVectorBoundary({
          vector_database: parsed.data.vector_database,
          tenant_model: parsed.data.tenant_model,
          score,
        });
        const vectorStatuses = Object.fromEntries(
          vectorControlStatuses(score.scope_categories.flatMap((category) => category.controls)),
        );
        return toolJson(envelope("rbac_vector_security_assessment", {
          identity_provider: parsed.data.identity_provider,
          vector_database: parsed.data.vector_database,
          tenant_model: parsed.data.tenant_model,
          vector_control_status: vectorStatuses,
          assessed_areas: [
            "Role-based access controls",
            "Identity integration",
            "Vector database access controls",
            "Tenant isolation",
            "Permission inheritance",
            "Data access boundaries",
          ],
          boundary_notes: boundaryNotes,
          integration_test_status: "not_tested_by_this_server",
          ...score,
        }));
      } catch (error) {
        if (error instanceof InputValidationError) return toolFailure(error.message);
        return toolFailure("assessment_failed");
      }
    },
  );
}
