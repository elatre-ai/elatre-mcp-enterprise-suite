# Architecture observations

Extraction date: 2026-11-04T11:50:40+00:00

## Website structure

The public site is a WordPress application on WordPress.com, rendered to HTML. Published content is available as pages, posts, and portfolio items. WooCommerce is installed, and its public product catalog is empty.

URL groups observed:

- `/` homepage
- `/digital-marketing-services/` and child service pages
- `/software-development-services/` and child service pages
- Root-level service and consulting pages, including SEO, GEO, migration, governance, and telemedicine
- `/about/`, `/contact/`, `/careers-at-elatre/`, `/request-a-proposal/`
- `/case-studies/`, `/portfolio/`, and `/portfolio-item/...`
- `/blog/` and dated or slug-based posts
- `/category/`, `/tag/`, and `/portfolio-types/` archives
- Policy pages for privacy, terms, and cancellation

## Frontend observations

Elementor stores generated CSS under `/wp-content/uploads/elementor/css/`. PixFort supplies the header and accordion interaction. WordPress.com concatenates some assets through `/_static/` URLs. Those bundles were inventoried and not downloaded.

## Navigation relationships

Child service pages are identifiable by URL prefix even without the authenticated menu tree. Portfolio items use the `/portfolio-item/` prefix and are grouped by portfolio types such as healthcare, ecommerce, B2B SaaS, manufacturing, and local services.

## External dependencies observed in public HTML

- fonts-api.wp.com
- googletagmanager.com gtag.js
- stats.wp.com and s0.wp.com
- calendly.com
- facebook.com, instagram.com, linkedin.com
- developers.google.com/search/docs/essentials, linked from homepage copy

