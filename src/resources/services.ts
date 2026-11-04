import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { COMPANY } from "../config.js";
import { getCompanyProfile } from "../services/knowledge-engine.js";
import { CONTROL_CATALOG, SCORING_METHODOLOGY } from "../services/scoring-engine.js";

export function registerServiceResources(server: McpServer): void {
  const profile = () => getCompanyProfile();

  server.registerResource(
    "enterprise-governance",
    "elatre://enterprise/governance",
    {
      title: "Enterprise AI governance",
      description: "Published Elatre governance service pages and the boundary between this readiness server and an official audit.",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify({
          company: COMPANY.name,
          website: COMPANY.website,
          pages: profile().governance_services,
          boundary: "Service-page text is published marketing and technical copy. This resource does not convert that copy into a certification or an official audit.",
        }),
      }],
    }),
  );

  server.registerResource(
    "enterprise-services",
    "elatre://enterprise/services",
    {
      title: "Elatre public services",
      description: "Public service catalog from the Phase 1 archive: name, source URL, and verification status.",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify({
          catalog_note: "verification_status means the public page was retrieved. It does not independently audit claims inside the page.",
          services: profile().service_catalog,
          governance_services: profile().governance_services,
        }),
      }],
    }),
  );

  server.registerResource(
    "enterprise-security",
    "elatre://enterprise/security",
    {
      title: "Enterprise security assessment model",
      description: "The server's deterministic control catalog and scoring methodology. Control ids belong to this server, not to an external framework.",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify({
          methodology: SCORING_METHODOLOGY,
          control_id_namespace: "ELATRE-* identifiers are internal assessment ids. They are not official NIST, ISO, HIPAA, or SOC 2 control identifiers.",
          controls: CONTROL_CATALOG,
        }),
      }],
    }),
  );
}
