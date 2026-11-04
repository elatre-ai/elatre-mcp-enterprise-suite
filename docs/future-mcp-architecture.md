# Future MCP architecture

This note prepares Phase 2. It does not implement an MCP server.

The JSON files in `research/json/` can back read-only tools. Suggested tools and the files they should read:

| Tool | Knowledge source | Behavior |
| --- | --- | --- |
| `get_company_information` | `contact-information.json`, `website-metadata.json`, `company-profile.md` | Return the public organization description, offices, leadership evidence, and published company claims with source URLs. |
| `get_services` | `services.json` | List service names, URLs, and short descriptions. |
| `get_service_details` | `services.json` and the matching record in `website-pages.json` | Return one service by id or URL, including headings and the local HTML path. |
| `get_products` | `products.json` | Return the empty public catalog and the note that offers are published as services. |
| `get_solutions` | `solutions.json` | Return vertical and packaged-offer pages plus portfolio types. |
| `get_website_pages` | `website-pages.json` | Filter pages, portfolio items, or blog metadata by type. |
| `search_website_content` | `website-pages.json` | Search titles, descriptions, and summaries. Blog hits should be labeled metadata-only until bodies are archived. |
| `get_public_faq` | `faq.json` | Return questions, answers, and source URLs. |
| `get_contact_information` | `contact-information.json` | Return email, phone, offices, and the scheduling link. |
| `get_website_metadata` | `website-metadata.json` | Return title, description, canonical URL, generators, and analytics id. |
| `get_public_integrations` | `integrations.json` | Return platform mentions and evidence pages. Do not present them as certified connectors. |
| `get_source_references` | `source-inventory.json`, `extraction-report.json` | Return asset URLs, download status, and snapshot paths. |

Possible MCP resource URIs, mapped to the same files:

- `elatre://company/profile` → company profile fields in `contact-information.json` and `website-metadata.json`
- `elatre://website/pages` → `website-pages.json`
- `elatre://website/services` → `services.json`
- `elatre://website/faq` → `faq.json`
- `elatre://website/integrations` → `integrations.json`

Implementation notes for a later phase:

- Treat JSON as the source of truth and HTML as evidence.
- Preserve `verification_status` in every tool response.
- Return null or an empty list when a field was not published. Do not fill gaps with model knowledge.
- Keep blog search results distinct from fully snapshotted pages.
- Do not expose WordPress routes that require authentication.
- Do not add write, form-submit, or admin tools in the first server.
