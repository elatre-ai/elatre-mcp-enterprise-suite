# Elatre MCP Enterprise RBAC Auditor

Read-only MCP server for enterprise AI governance reviews. It scores attested security controls, builds framework readiness checklists, and returns Elatre company information from the local Phase 1 research archive.

Company: Elatre  
Website: https://elatre.com/  
Governance page: https://elatre.com/ai-ethics-and-governance/  
Package: `@elatre-ai/mcp-server`  
Version: 1.0.2

The MCP server reports the same package name. The GitHub Package is configured as public under the `elatre-ai` scope.

Source repository: https://github.com/Elatre-LLC/elatre-mcp-enterprise-suite. Smithery, Glama, and Hugging Face listings are not submitted.

## Enterprise features

- Deterministic 0–100 readiness score across ten control categories.
- Implemented controls earn full weight, partial controls earn half weight, and missing or unknown controls earn zero.
- Unknown controls stay unknown. The score does not assume they are implemented.
- Readiness checklists for NIST AI RMF, ISO/IEC 42001, the EU AI Act, HIPAA, and SOC 2, with source titles and URLs.
- Stack notes for Salesforce, HubSpot, AWS Bedrock, Azure OpenAI, Google Vertex AI, Pinecone, Weaviate, and Snowflake. None of those connections are marked as tested.
- Company responses come from `research/json` and `research/markdown`. Independently audited statistics are reported as unavailable.

A score is a technical readiness assessment. It is not a formal audit, a legal compliance determination, an independent certification, or an official Elatre audit.

## Architecture

```mermaid
flowchart LR
  subgraph clients [MCP clients]
    Cursor
    Claude
    VSCode
    Other[Other MCP clients]
  end
  subgraph server [One MCP server]
    Tools
    Resources
    Prompts
    Score[Scoring engine]
    Research[Phase 1 research JSON]
  end
  clients -->|stdio or Streamable HTTP| Tools
  Tools --> Score
  Tools --> Research
  Resources --> Research
  Resources --> Score
```

STDIO is the local process transport. Streamable HTTP is the remote transport. Both register the same tools, resources, and prompts. Logs go to stderr so STDIO clients keep stdout for MCP messages.

## MCP tools

| Tool | Purpose |
| --- | --- |
| `audit_enterprise_ai_governance_architecture` | Score an architecture from attested controls and record the caller’s stack as context. Context does not change the score. |
| `assess_rbac_vector_security` | Score identity, RBAC, and vector controls, including tenant isolation and retrieval boundaries. |
| `generate_compliance_checklist` | Return readiness questions and evidence ideas for one framework. |
| `calculate_architecture_readiness` | Return the ten-category score, category breakdown, verified, missing, and unknown controls, findings, and recommendations. |
| `analyze_enterprise_ai_stack` | Review a named combination of supported platforms. `integration_test_status` is `not_tested_by_this_server`. |
| `get_elatre_company_information` | Return research-backed company information and source URLs. |

Control ids such as `ELATRE-IAM-01` belong to this server. They are not official NIST, ISO, HIPAA, or SOC 2 identifiers. Pass `existing_security_controls: []` to `calculate_architecture_readiness` to see every question with status `unknown`.

Example:

```json
{
  "name": "calculate_architecture_readiness",
  "arguments": {
    "existing_security_controls": [
      { "control_id": "ELATRE-IAM-02", "status": "implemented", "evidence": "MFA required for AI operators" },
      { "control_id": "ELATRE-VEC-03", "status": "missing" }
    ]
  }
}
```

`implemented`, `partial`, `missing`, and `unknown` are the only statuses. Omitted controls are unknown.

## MCP resources

| URI | Contents |
| --- | --- |
| `elatre://company/profile` | Research-backed company profile |
| `elatre://enterprise/governance` | Published governance service pages |
| `elatre://enterprise/security` | Control catalog and scoring methodology |
| `elatre://enterprise/compliance` | Framework sources and assessment boundaries |
| `elatre://enterprise/services` | Public service catalog from the research archive |

## MCP prompts

- `enterprise_ai_governance_review`
- `rbac_security_assessment`
- `vector_database_security_review`
- `compliance_readiness_review`

The prompts tell the client to call the tools and to keep readiness separate from certification.

## Installation

Requires Node.js 20 or newer. Development and the container build use the TypeScript compiler.

```bash
npm install
npm run typecheck
npm test
npm run build
```

Local STDIO:

```bash
npm start
```

Local HTTP, bound to localhost, with a secret of at least 16 characters:

```bash
MCP_TRANSPORT=http \
MCP_HOST=127.0.0.1 \
PORT=7860 \
MCP_AUTH_TOKEN="replace-with-a-long-random-secret" \
npm run start:http
```

`MCP_ALLOW_UNAUTHENTICATED=true` starts HTTP without a token outside production. Production ignores that switch and exits unless `MCP_AUTH_TOKEN` is set.

## Client connections

Clients do not all expose the same MCP features. Use the client’s current MCP documentation. This server speaks the MCP protocol implemented by `@modelcontextprotocol/sdk` 1.32.2. It does not ship a separate tool implementation per vendor.

### Cursor and VS Code

```json
{
  "mcpServers": {
    "elatre-rbac-auditor": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": { "MCP_TRANSPORT": "stdio", "LOG_LEVEL": "info" }
    }
  }
}
```

Run the command from this directory after `npm run build`, or pass the absolute path to `dist/index.js`.

### Claude Desktop

For a local connection, add the same STDIO command to `~/Library/Application Support/Claude/claude_desktop_config.json`, then quit and reopen Claude Desktop.

### Claude through ngrok

Use this when Claude must reach the server over HTTPS. The MCP path is `/mcp`.

Terminal 1, from this directory, after `npm run build`:

```bash
MCP_TRANSPORT=http \
MCP_HOST=127.0.0.1 \
PORT=7860 \
MCP_ALLOW_UNAUTHENTICATED=true \
NODE_ENV=development \
node dist/index.js
```

`MCP_ALLOW_UNAUTHENTICATED=true` is only for a temporary local tunnel. It is refused when `NODE_ENV=production`. Leave the token set if the tunnel should stay private.

Terminal 2:

```bash
ngrok http 7860 --host-header=rewrite
```

`--host-header=rewrite` sends `Host: localhost`, which this server accepts. A raw ngrok hostname is rejected until it is added to `MCP_ALLOWED_HOSTS`.

Check the tunnel:

```bash
curl -H "ngrok-skip-browser-warning: 1" https://YOUR-SUBDOMAIN.ngrok-free.dev/health
```

Claude Desktop config for an open tunnel:

```json
{
  "mcpServers": {
    "elatre-rbac-auditor": {
      "url": "https://YOUR-SUBDOMAIN.ngrok-free.dev/mcp"
    }
  }
}
```

With a token, add a header instead of `MCP_ALLOW_UNAUTHENTICATED`:

```json
"headers": {
  "Authorization": "Bearer replace-with-a-long-random-secret"
}
```

Claude.ai in the browser can use this URL only when its connector form can call Streamable HTTP. This server does not provide an OAuth login. If Claude returns `origin_not_allowed`, restart with `MCP_ALLOWED_ORIGINS` set to the origin Claude sent.

Stop ngrok when you are finished. An unauthenticated tunnel is reachable by anyone who has the URL. The ngrok hostname changes each time unless you use a reserved domain.

### ChatGPT

ChatGPT MCP support depends on the account and the current developer or connector settings. A remote connection uses the Streamable HTTP endpoint and `Authorization: Bearer <MCP_AUTH_TOKEN>`. Do not assume the ChatGPT app can launch this STDIO package itself.

### Gemini-compatible clients

Gemini app support for MCP is not the same as a Gemini-compatible client or CLI that speaks MCP. Point a compatible client at the STDIO command or at the authenticated HTTP endpoint. This repository does not claim that every Gemini surface can list tools, resources, and prompts.

### Codex and other MCP clients

Codex and other MCP clients that accept a STDIO server can use:

```toml
[mcp_servers.elatre-rbac-auditor]
command = "node"
args = ["dist/index.js"]
```

HTTP clients send `Authorization: Bearer <MCP_AUTH_TOKEN>` and, in a browser, an `Origin` listed in `MCP_ALLOWED_ORIGINS`.

## Docker

The image listens on HTTP inside the container. Put TLS in front of it in production. Hugging Face Spaces provides HTTPS at the platform edge. Do not publish port 7860 directly to the internet.

```bash
docker build -t elatre-mcp-enterprise-rbac-auditor .
docker run --rm -p 7860:7860 \
  -e MCP_AUTH_TOKEN="replace-with-a-long-random-secret" \
  -e MCP_ALLOWED_HOSTS="localhost" \
  elatre-mcp-enterprise-rbac-auditor
```

The process exits in production when `MCP_AUTH_TOKEN` is missing. Health is `GET /health` and does not require the token. MCP requests do.

Sessions, rate limits, and scores are stored in memory. A restart drops them. The container has no database and no writable enterprise evidence store. Hugging Face persistent storage is not used. Do not put secrets in the image.

Set `MCP_TRUST_PROXY=true` only behind a proxy you trust. In production that mode rejects MCP requests whose `X-Forwarded-Proto` is present and not `https`.

## Hugging Face

Build the Docker Space from this `Dockerfile`. Set the Space secret `MCP_AUTH_TOKEN` and, if the public hostname differs from localhost, `MCP_ALLOWED_HOSTS`. The default port is 7860. This repository does not deploy the Space.

## Smithery

`smithery.yaml` launches the npm package over STDIO:

```yaml
startCommand:
  type: stdio
  commandFunction: (config) => ({ command: "npx", args: ["-y", "@elatre-ai/mcp-server"] })
```

The file in the repo also passes `LOG_LEVEL`. Smithery submission is waiting for approval. Current Smithery publishing for remote servers uses `smithery mcp publish` and is not run here.

## Glama

The live schema at `https://glama.ai/mcp/schemas/server.json` requires one field, `maintainers`, an array of GitHub usernames. `glama.json` follows that schema. Package identity, description, tools, categories, and install instructions are in this README and `package.json`, which Glama can read from the repository. Listing description, categories, and Docker settings are edited in the Glama UI after a claim. `maintainers` currently contains `elatre-ai`, the GitHub organization in the requested repository URL. Confirm the personal maintainer username before claiming the listing. This repository has not been submitted.

## GitHub Packages

The package name is `@elatre-ai/mcp-server`. Publish it as a public GitHub Package. Public packages are free to install.

```bash
npm pack --dry-run
npm publish
```

Install it with a project `.npmrc` that maps the scope:

```text
@elatre-ai:registry=https://npm.pkg.github.com
```

The packed tarball includes the compiled server and the research JSON files the server reads. It does not include HTML snapshots, `.env`, or credentials.

## Security

- Tool inputs are validated with Zod. Arrays and strings have size limits.
- HTTP bodies default to 64 KiB.
- Remote MCP requires a bearer token compared with `timingSafeEqual`. The SDK bearer middleware also requires an expiry, so each successful check is represented as valid for one hour. Rotate `MCP_AUTH_TOKEN` to revoke access. The secret itself has no expiry.
- Hostnames are checked with the SDK host-header middleware. `*` is rejected.
- Browser `Origin` values must match `MCP_ALLOWED_ORIGINS`. An empty list rejects every Origin. Clients that omit Origin still need the bearer token.
- Tools are read-only. The server does not execute shell commands or read arbitrary files. Research reads are limited to an allowlist under `research/json` and `research/markdown`.
- Errors returned to clients do not include stack traces or the configured token.
- Logs are JSON on stderr, and fields whose names look like secrets are redacted.

## Scoring methodology

Ten categories are averaged. Each category score is earned weight divided by total weight. The categories are identity and access management, role-based access control, vector database security, data privacy, LLM gateway security, enterprise integration security, human-in-the-loop governance, audit logging, incident response, and compliance documentation.

| Attestation | Points |
| --- | --- |
| Implemented | Full weight |
| Partial | Half weight |
| Missing | Zero |
| Unknown, or omitted | Zero, reported as unknown |

Readiness labels:

| Score and coverage | Label |
| --- | --- |
| No attested controls | `insufficient_evidence` |
| Below 40 | `not_ready` |
| 40–69.99 | `developing` |
| 70–89.99 | `advanced_readiness` |
| 90–100 | `strong_evidence` |

`advanced_readiness` and `strong_evidence` still are not certifications.

## Framework boundaries

| Activity | Provided |
| --- | --- |
| Security architecture assessment | Yes, from attested controls |
| Compliance readiness questions | Yes, with source URLs |
| Formal audit | No |
| Legal compliance determination | No |
| Independent certification | No |

NIST questions use the GOVERN, MAP, MEASURE, and MANAGE functions from NIST AI 100-1 and point to the Generative AI Profile NIST AI 600-1. They do not invent subcategory numbers. ISO/IEC 42001 questions use management-system themes and do not reproduce Annex A identifiers. EU AI Act questions cite Regulation (EU) 2024/1689 articles as orientation and do not decide scope. HIPAA questions cite 45 CFR Part 164 sections and do not decide whether HIPAA applies. SOC 2 questions use AICPA Trust Services Criteria category names and do not reproduce point-of-focus text.

## Company information

Verified contact details, offices, legal entity names, and service URLs are returned with the source URL from the Phase 1 archive. Homepage marketing figures are returned only under `published_claims_not_independently_audited`. `verified_statistics` is empty because the archive says those figures were not independently audited.

## Limitations

- The server does not scan a network, a cloud account, a vector database, or a CRM.
- Named products are not evidence that a control exists.
- Elatre public pages mention Salesforce and HubSpot. That is a verified mention, not a tested or certified connector. Bedrock, Azure OpenAI, Vertex AI, Pinecone, Weaviate, and Snowflake were not found in the Phase 1 integration inventory.
- Research HTML snapshots stay in the repository and are not loaded at runtime.
- In-memory sessions are lost on restart.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Client shows no tools | The process must be the STDIO server, not an HTTP server, unless the client is configured for Streamable HTTP. |
| HTTP process exits immediately | Production requires `MCP_AUTH_TOKEN` of at least 16 characters. |
| HTTP 401 | Send `Authorization: Bearer <MCP_AUTH_TOKEN>`. |
| HTTP 403 `origin_not_allowed` | Add the browser origin to `MCP_ALLOWED_ORIGINS`. |
| HTTP 403 `Invalid Host` | Add the public hostname to `MCP_ALLOWED_HOSTS`. |
| HTTP 413 | Reduce the tool payload or raise `MCP_MAX_BODY_BYTES`. |
| HTTP 429 | The per-IP limit is `MCP_REQUESTS_PER_MINUTE`. |
| Empty company fields | The research JSON files must sit next to the compiled `dist` directory. |

## Development

```bash
npm run typecheck
npm test
npm run build
npm pack --dry-run
```

Tests cover scoring, missing and unknown controls, framework selection, MCP discovery, STDIO, Streamable HTTP, authentication failures, origin rejection, body limits, and rate limits.
