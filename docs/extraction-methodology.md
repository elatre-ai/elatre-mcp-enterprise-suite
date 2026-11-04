# Extraction methodology

Extraction date: 2026-11-04T11:50:40+00:00

## Scope

Phase 1 only. The MCP server was not built. Nothing was published to GitHub. The live website was not modified. No forms were submitted. No scripts from downloaded pages were executed.

## Discovery

1. Read `robots.txt`. Disallowed paths were WooCommerce upload and log directories, add-to-cart query URLs, and `/wp-admin/` except the already public `admin-ajax.php` path. That ajax endpoint was not called.
2. Read the All in One SEO sitemap index and its child sitemaps for pages, posts, portfolio, categories, tags, and portfolio types.
3. Read the public WordPress REST index and then the published pages, posts, portfolio items, categories, tags, and portfolio types.
4. Read `llms.txt` as a public content index.

## HTML

Every published page and portfolio item URL returned by the REST API was requested once and stored under `research/html/` when the response was HTML. A source comment was prepended. Blog post bodies were not requested individually. There are 1,049 public posts, and this pass kept the crawl to the page and portfolio sets plus collection metadata.

## JSON

Page records use the REST title, All in One SEO description, content headings, and a plain-text summary. Blog records use title, date, excerpt, categories, and tags. Service and solution files are derived from those page records. FAQs were parsed from accordion markup in the saved HTML. Contact details were accepted only when the string appeared in the homepage HTML or its structured data.

Empty public catalogs stay empty. `products.json` records a zero-product WooCommerce store rather than turning services into products.

## Assets

Asset URLs were collected from saved HTML. Downloads were limited to first-party brand images whose paths identified a logo, favicon, hero, or the published founder portrait.

## Validation

After writing the files, the script parsed every JSON document, checked for duplicate ids and duplicate URLs inside each collection, and checked that `source_html` paths exist on disk.

## Intentionally not done

- Phase 2 MCP implementation
- GitHub publication
- Authenticated menu retrieval
- Requests to robots-disallowed paths
- Execution of site JavaScript
