import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analyzeStack, architectureContext, fullScore } from "../src/services/assessment-engine.js";
import { getCompanyProfile } from "../src/services/knowledge-engine.js";
import { loadConfig } from "../src/config.js";

describe("governance research and stack analysis", () => {
  it("returns verified company facts and leaves unaudited statistics unavailable", () => {
    const profile = getCompanyProfile();
    assert.equal(profile.website, "https://elatre.com/");
    assert.equal(profile.relevant_service_page, "https://elatre.com/ai-ethics-and-governance/");
    assert.deepEqual(profile.verified_statistics, []);
    assert.equal(profile.statistics_status, "unavailable");
    assert.ok(profile.published_claims_not_independently_audited.statements.length > 0);
    assert.match(profile.published_claims_not_independently_audited.verification_status, /not_independently_audited/);
    assert.ok(profile.governance_services.some((service) => service.source_url === "https://elatre.com/ai-ethics-and-governance/"));
    const contact = JSON.stringify(profile.contact);
    assert.match(contact, /info@elatre.com/);
    assert.match(contact, /https:\/\/elatre.com\//);
    assert.ok(profile.unavailable.some((item) => item.includes("Certification")));
  });

  it("does not claim stack integrations were tested", () => {
    const analysis = analyzeStack(["Salesforce", "AWS Bedrock", "Pinecone", "Custom Warehouse"]);
    const platforms = analysis.platforms as Array<Record<string, unknown>>;
    assert.equal(platforms.length, 4);
    assert.equal(platforms.every((platform) => platform.integration_test_status === "not_tested_by_this_server"), true);
    const salesforce = platforms[0];
    assert.equal(salesforce?.canonical_id, "salesforce");
    assert.equal((salesforce?.elatre_public_mention as { status?: string }).status, "verified_mention");
    const bedrock = platforms[1];
    assert.equal((bedrock?.elatre_public_mention as { status?: string }).status, "not_found_in_phase1_research");
    const pinecone = platforms[2];
    assert.equal(pinecone?.canonical_id, "pinecone");
    const custom = platforms[3];
    assert.equal(custom?.canonical_id, null);
    assert.match(JSON.stringify(custom?.security_considerations), /No security profile is invented/);
    assert.match(JSON.stringify(analysis.combination_findings), /did not test/);
  });

  it("keeps context from changing the numeric score", () => {
    const controls = [{ control_id: "ELATRE-LLM-01", status: "implemented" as const }];
    const first = fullScore(controls);
    const second = fullScore(controls);
    assert.equal(first.score, second.score);
    const context = architectureContext({
      stack: ["Salesforce"],
      compliance_framework: "nist_ai_rmf",
      employee_count: 5000,
      vector_database: "Pinecone",
      identity_provider: "Okta",
      llm_provider: "Azure OpenAI",
      score: first,
    });
    assert.equal(context.framework_effect_on_score, "none");
    assert.equal(context.integration_test_status, "not_tested_by_this_server");
  });

  it("requires a production HTTP token and rejects open host lists", () => {
    assert.throws(() => loadConfig({ MCP_TRANSPORT: "http", NODE_ENV: "production" }), /MCP_AUTH_TOKEN/);
    assert.throws(() => loadConfig({
      MCP_TRANSPORT: "http",
      NODE_ENV: "production",
      MCP_AUTH_TOKEN: "a-sufficiently-long-token",
      MCP_ALLOW_UNAUTHENTICATED: "true",
    }), /MCP_ALLOW_UNAUTHENTICATED/);
    assert.throws(() => loadConfig({
      MCP_TRANSPORT: "http",
      NODE_ENV: "development",
      MCP_AUTH_TOKEN: "a-sufficiently-long-token",
      MCP_ALLOWED_HOSTS: "*",
    }), /cannot contain \*/);
    const stdio = loadConfig({ MCP_TRANSPORT: "stdio", LOG_LEVEL: "error" });
    assert.equal(stdio.transport, "stdio");
  });
});
