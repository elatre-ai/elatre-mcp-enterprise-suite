import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { startHttp } from "../src/http.js";
import { createServer } from "../src/server.js";
import type { AppConfig } from "../src/config.js";

const root = path.resolve(import.meta.dirname, "..");
const token = "local-test-token-value";

function httpConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    transport: "http",
    host: "127.0.0.1",
    port: 0,
    authToken: token,
    allowUnauthenticated: false,
    allowedHosts: ["127.0.0.1", "localhost", "::1", "[::1]"],
    allowedOrigins: ["http://localhost:3000"],
    logLevel: "error",
    maxBodyBytes: 65_536,
    nodeEnv: "test",
    trustProxy: false,
    maxSessions: 10,
    requestsPerMinute: 60,
    ...overrides,
  };
}

async function connectClient(transport: InMemoryTransport | StdioClientTransport | StreamableHTTPClientTransport): Promise<Client> {
  const client = new Client({ name: "elatre-test", version: "1.0.0" });
  await client.connect(transport);
  return client;
}

function textOf(result: { content?: Array<{ type: string; text?: string }> }): string {
  const block = result.content?.find((item) => item.type === "text");
  assert.ok(block?.text);
  return block.text;
}

describe("MCP server", () => {
  it("initializes and exposes tools, resources, and prompts", async () => {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const server = createServer();
    await server.connect(serverTransport);
    const client = await connectClient(clientTransport);
    try {
      const tools = await client.listTools();
      assert.deepEqual(tools.tools.map((tool) => tool.name).sort(), [
        "analyze_enterprise_ai_stack",
        "assess_rbac_vector_security",
        "audit_enterprise_ai_governance_architecture",
        "calculate_architecture_readiness",
        "generate_compliance_checklist",
        "get_elatre_company_information",
      ]);
      const resources = await client.listResources();
      assert.deepEqual(resources.resources.map((resource) => resource.uri).sort(), [
        "elatre://company/profile",
        "elatre://enterprise/compliance",
        "elatre://enterprise/governance",
        "elatre://enterprise/security",
        "elatre://enterprise/services",
      ]);
      const prompts = await client.listPrompts();
      assert.deepEqual(prompts.prompts.map((prompt) => prompt.name).sort(), [
        "compliance_readiness_review",
        "enterprise_ai_governance_review",
        "rbac_security_assessment",
        "vector_database_security_review",
      ]);
      const prompt = await client.getPrompt({
        name: "vector_database_security_review",
        arguments: { vector_database: "Weaviate" },
      });
      assert.match(prompt.messages[0]?.content.type === "text" ? prompt.messages[0].content.text : "", /Do not claim the integration or the database was tested/);
      const profile = await client.readResource({ uri: "elatre://company/profile" });
      assert.match(JSON.stringify(profile.contents), /https:\/\/elatre.com\//);
      const score = await client.callTool({
        name: "calculate_architecture_readiness",
        arguments: { existing_security_controls: [] },
      });
      const body = JSON.parse(textOf(score)) as { data: { score: number; readiness_category: string; disclaimer?: string } };
      assert.equal(body.data.score, 0);
      assert.equal(body.data.readiness_category, "insufficient_evidence");
      const duplicate = await client.callTool({
        name: "calculate_architecture_readiness",
        arguments: {
          existing_security_controls: [
            { control_id: "ELATRE-IAM-01", status: "implemented" },
            { control_id: "ELATRE-IAM-01", status: "missing" },
          ],
        },
      });
      assert.equal(duplicate.isError, true);
      const invalid = await client.callTool({
        name: "audit_enterprise_ai_governance_architecture",
        arguments: {
          stack: ["Salesforce"],
          compliance_framework: "nist_ai_rmf",
          employee_count: -1,
          vector_database: "Pinecone",
          identity_provider: "Okta",
          llm_provider: "Bedrock",
          existing_security_controls: [],
        },
      });
      assert.equal(invalid.isError, true);
      assert.match(textOf(invalid), /employee_count/);
    } finally {
      await client.close();
      await server.close();
    }
  });

  it("serves the same tools over stdio", async () => {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: ["--import", "tsx", "src/index.ts"],
      cwd: root,
      env: {
        ...Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === "string")),
        MCP_TRANSPORT: "stdio",
        LOG_LEVEL: "error",
      },
      stderr: "pipe",
    });
    transport.stderr?.on("data", () => undefined);
    const client = await connectClient(transport);
    try {
      const tools = await client.listTools();
      assert.equal(tools.tools.length, 6);
      const company = await client.callTool({ name: "get_elatre_company_information", arguments: { section: "profile" } });
      const body = JSON.parse(textOf(company)) as { data: { verified_statistics: unknown[]; statistics_status: string } };
      assert.deepEqual(body.data.verified_statistics, []);
      assert.equal(body.data.statistics_status, "unavailable");
    } finally {
      await client.close();
    }
  });

  it("requires a bearer token for streamable HTTP and keeps health public", async () => {
    const handle = await startHttp(httpConfig());
    const endpoint = `http://127.0.0.1:${handle.port}/mcp`;
    try {
      const health = await fetch(`http://127.0.0.1:${handle.port}/health`);
      assert.equal(health.status, 200);
      const healthBody = await health.json() as { status: string; version: string };
      assert.equal(healthBody.status, "ok");
      assert.equal(healthBody.version, "1.0.2");

      const missing = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }),
      });
      assert.equal(missing.status, 401);
      const missingText = await missing.text();
      assert.equal(missingText.includes(token), false);
      assert.equal(missingText.includes("Error:"), false);

      const wrong = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer not-the-token" },
        body: "{}",
      });
      assert.equal(wrong.status, 401);

      const origin = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
          origin: "https://evil.example",
        },
        body: "{}",
      });
      assert.equal(origin.status, 403);

      const transport = new StreamableHTTPClientTransport(new URL(endpoint), {
        requestInit: { headers: { Authorization: `Bearer ${token}` } },
      });
      const client = await connectClient(transport);
      const checklist = await client.callTool({
        name: "generate_compliance_checklist",
        arguments: { framework: "soc2" },
      });
      const checklistBody = JSON.parse(textOf(checklist)) as { data: { framework_id: string; not_a: string[] } };
      assert.equal(checklistBody.data.framework_id, "soc2");
      assert.ok(checklistBody.data.not_a.includes("formal audit"));
      await client.close();
    } finally {
      await handle.close();
    }
  });

  it("rejects oversized bodies, excess requests, and non-HTTPS forwarded production traffic", async () => {
    const limited = await startHttp(httpConfig({ maxBodyBytes: 1024, requestsPerMinute: 2 }));
    try {
      const endpoint = `http://127.0.0.1:${limited.port}/mcp`;
      const headers = { "content-type": "application/json", authorization: `Bearer ${token}` };
      const first = await fetch(endpoint, { method: "POST", headers, body: "{}" });
      const second = await fetch(endpoint, { method: "POST", headers, body: "{}" });
      const third = await fetch(endpoint, { method: "POST", headers, body: "{}" });
      assert.notEqual(first.status, 429);
      assert.notEqual(second.status, 429);
      assert.equal(third.status, 429);
      const oversized = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ padding: "x".repeat(2_000) }),
      });
      assert.equal(oversized.status, 413);
    } finally {
      await limited.close();
    }

    const production = await startHttp(httpConfig({
      nodeEnv: "production",
      trustProxy: true,
      authToken: token,
    }));
    try {
      const health = await fetch(`http://127.0.0.1:${production.port}/health`);
      assert.equal(health.status, 200);
      const blocked = await fetch(`http://127.0.0.1:${production.port}/mcp`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
          "x-forwarded-proto": "http",
        },
        body: "{}",
      });
      assert.equal(blocked.status, 403);
      const allowed = await fetch(`http://127.0.0.1:${production.port}/mcp`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
          "x-forwarded-proto": "https",
        },
        body: "{}",
      });
      assert.notEqual(allowed.status, 403);
    } finally {
      await production.close();
    }
  });

  it("matches the published Smithery and Glama configuration constraints", () => {
    const smithery = readFileSync(path.join(root, "smithery.yaml"), "utf8");
    assert.match(smithery, /type:\s*stdio/);
    assert.match(smithery, /@neo-elatre\/mcp-enterprise-rbac-auditor/);
    assert.equal(smithery.includes("startCommand:"), true);
    const command = smithery.slice(smithery.indexOf("(config)"));
    const fn = new Function(`return (${command})`)() as (config: { logLevel?: string }) => { command: string; args: string[]; env: Record<string, string> };
    const launched = fn({ logLevel: "error" });
    assert.equal(launched.command, "npx");
    assert.deepEqual(launched.args, ["-y", "@neo-elatre/mcp-enterprise-rbac-auditor"]);
    assert.equal(launched.env.MCP_TRANSPORT, "stdio");
    assert.equal(launched.env.LOG_LEVEL, "error");

    const glama = JSON.parse(readFileSync(path.join(root, "glama.json"), "utf8")) as { maintainers?: unknown };
    assert.ok(Array.isArray(glama.maintainers));
    assert.equal(glama.maintainers.length > 0, true);
    assert.equal(glama.maintainers.every((item) => typeof item === "string" && item.length > 0), true);
    assert.equal(Object.keys(glama).some((key) => !["$schema", "maintainers"].includes(key)), false);
  });

  it("keeps the container file free of credentials", () => {
    const dockerfile = readFileSync(path.join(root, "Dockerfile"), "utf8");
    assert.match(dockerfile, /FROM node:22/);
    assert.match(dockerfile, /EXPOSE 7860/);
    assert.match(dockerfile, /USER node/);
    assert.match(dockerfile, /HEALTHCHECK/);
    assert.equal(/MCP_AUTH_TOKEN=.+/.test(dockerfile), false);
    assert.equal(dockerfile.includes("BEGIN PRIVATE"), false);
    const ignore = readFileSync(path.join(root, ".dockerignore"), "utf8");
    assert.match(ignore, /\.env/);
    const example = readFileSync(path.join(root, ".env.example"), "utf8");
    assert.match(example, /MCP_AUTH_TOKEN=$/m);
  });
});
