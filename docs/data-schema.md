# Data schema

Extraction date: 2026-11-04T11:50:40+00:00

JSON files under `research/json/` are the primary knowledge source. Every record includes a source URL or an explicit statement that the value was not available.

## Shared fields

- `website`: `https://elatre.com/`
- `project`: `elatre-mcp-enterprise-suite`
- `extraction_date`: ISO-8601 UTC timestamp for this run
- `verification_status`: `verified`, `verified_mention`, `metadata_verified`, `verified_metadata_html_missing`, or `partially_verified`

## website-pages.json

- `pages`: WordPress pages and portfolio items with title, URL, description, headings, summary, links, and `source_html`
- `blog_posts`: post metadata. `source_html` is null and `html_snapshot` is `not_saved`

## website-metadata.json

Homepage title, description, canonical URL, generator tags, robots.txt text, sitemap locations, organization and local-business schema copied from the homepage, and the observed Google tag id.

## navigation.json

`main_navigation` and `footer_navigation` arrays of `label` and `url`, parsed from homepage HTML.

## services.json

One object per public service page: `id`, `name`, `description`, `capabilities`, `industries`, `related_pages`, `source_url`, `source_html`.

## products.json

`products` is an empty array. `catalog_status` records that the public WooCommerce catalog returned zero products.

## solutions.json

Vertical and packaged-offer pages, plus portfolio type terms. These pages are also services. The `note` field says the site has no separate solutions catalog.

## faq.json

`question`, `answer`, `source_page`, and `source_url` from PixFort accordion markup or FAQPage schema.

## integrations.json

Platform names that appear in public copy, with evidence page URLs. `documentation_url` is null when Elatre does not publish an integration document.

## contact-information.json

Emails, phones, offices, scheduling URL, social profiles, and published leadership evidence.

## technology-stack.json

`name`, `evidence`, `source_url`, `confidence`, and `verification_status`.

## source-inventory.json

One object per asset URL seen in saved HTML: `resource_url`, `resource_type`, `source_page`, `content_type`, `file_size`, `local_path`, `download_status`, `attribution`.

## extraction-report.json

Counts, completed and partial work, failed requests, restricted paths, and missing information.

This run documented 50 services, 231 FAQs, and 15 platform mentions.
