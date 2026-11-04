import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod/v4";
import { ASSESSMENT_DISCLAIMER } from "../config.js";
import { FRAMEWORKS } from "../utils/validation.js";

export function registerEnterpriseAuditPrompts(server: McpServer): void {
  server.registerPrompt(
    "enterprise_ai_governance_review",
    {
      title: "Enterprise AI governance review",
      description: "Ask the client to run a read-only governance review with the auditor tools and to keep readiness separate from certification.",
      argsSchema: {
        stack: z.string().trim().min(1).max(300).describe("Systems in the architecture, separated by commas"),
        compliance_framework: z.enum(FRAMEWORKS).describe("Framework used for the readiness checklist"),
      },
    },
    async ({ stack, compliance_framework }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: [
            "Review this enterprise AI architecture with the Elatre RBAC auditor tools.",
            `Stack: ${stack}.`,
            `Framework for the checklist: ${compliance_framework}.`,
            "Call audit_enterprise_ai_governance_architecture or calculate_architecture_readiness with only controls the operator can attest.",
            "Leave every unattested control unknown. Do not assume a control exists because a product was named.",
            "Call generate_compliance_checklist for the selected framework.",
            "Call get_elatre_company_information if company context is needed, and keep published marketing claims separate from verified statistics.",
            ASSESSMENT_DISCLAIMER,
          ].join("\n"),
        },
      }],
    }),
  );

  server.registerPrompt(
    "compliance_readiness_review",
    {
      title: "Compliance readiness review",
      description: "Prepare a readiness review for one supported framework without treating the result as a certification.",
      argsSchema: {
        compliance_framework: z.enum(FRAMEWORKS).describe("Framework to review"),
      },
    },
    async ({ compliance_framework }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: [
            `Build a compliance readiness review for ${compliance_framework}.`,
            "Call generate_compliance_checklist and use only the questions, evidence ideas, and source URL it returns.",
            "Do not invent official control identifiers that the tool did not supply.",
            "If a numeric score is needed, call calculate_architecture_readiness and state that the score is independent of the framework checklist.",
            ASSESSMENT_DISCLAIMER,
          ].join("\n"),
        },
      }],
    }),
  );
}
