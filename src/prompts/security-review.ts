import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod/v4";
import { ASSESSMENT_DISCLAIMER } from "../config.js";

export function registerSecurityReviewPrompts(server: McpServer): void {
  server.registerPrompt(
    "rbac_security_assessment",
    {
      title: "RBAC security assessment",
      description: "Assess identity, role design, inheritance, and vector boundaries from attested controls.",
      argsSchema: {
        identity_provider: z.string().trim().min(1).max(80).describe("Identity provider name supplied by the operator"),
        vector_database: z.string().trim().min(1).max(80).describe("Vector database name supplied by the operator"),
      },
    },
    async ({ identity_provider, vector_database }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: [
            `Assess RBAC and vector access for identity provider ${identity_provider} and vector database ${vector_database}.`,
            "Call assess_rbac_vector_security. Set tenant_model to unknown unless the operator states it.",
            "Do not treat the product names as evidence. A control stays unknown until the operator attests a status.",
            "Say clearly that this server did not connect to the identity provider or the vector database.",
            ASSESSMENT_DISCLAIMER,
          ].join("\n"),
        },
      }],
    }),
  );

  server.registerPrompt(
    "vector_database_security_review",
    {
      title: "Vector database security review",
      description: "Review authentication, tenant isolation, retrieval filters, and data boundaries for a named vector database.",
      argsSchema: {
        vector_database: z.string().trim().min(1).max(80).describe("Vector database name supplied by the operator"),
      },
    },
    async ({ vector_database }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: [
            `Review vector database security for ${vector_database}.`,
            "Use assess_rbac_vector_security and focus the write-up on ELATRE-VEC controls: authentication, tenant or domain separation, retrieval authorization, embedding isolation, network restriction, and encryption.",
            "If the platform is Salesforce, HubSpot, AWS Bedrock, Azure OpenAI, Google Vertex AI, Pinecone, Weaviate, or Snowflake, also call analyze_enterprise_ai_stack.",
            "Do not claim the integration or the database was tested.",
            ASSESSMENT_DISCLAIMER,
          ].join("\n"),
        },
      }],
    }),
  );
}
