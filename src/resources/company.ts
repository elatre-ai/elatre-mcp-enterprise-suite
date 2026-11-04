import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getCompanyProfile, researchBoundary } from "../services/knowledge-engine.js";

export function registerCompanyResources(server: McpServer): void {
  server.registerResource(
    "company-profile",
    "elatre://company/profile",
    {
      title: "Elatre company profile",
      description: "Public company profile from the Phase 1 research archive, with source URLs and unverified statistics marked unavailable.",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify({
          research: researchBoundary(),
          profile: getCompanyProfile(),
        }),
      }],
    }),
  );
}
