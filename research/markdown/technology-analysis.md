# Technology analysis

Extraction date: 2026-11-04T11:50:40+00:00

Findings below come from fetched HTML, asset URLs, meta generator tags, or public response headers.

## All in One SEO Pro

- Confidence: high
- Status: verified
- Source: https://elatre.com/
- Evidence: Homepage meta generator: All in One SEO Pro (AIOSEO) 5.0.5; Site Kit by Google 1.191.0; Elementor 4.3.6; features: e_font_icon_svg, additional_custom_breakpoints; settings: css_print_method-external, google_font-enabled, font_display-swap

## Elementor

- Confidence: high
- Status: verified
- Source: https://elatre.com/
- Evidence: Homepage meta generator names Elementor and version. Stylesheet and script URLs include /wp-content/plugins/elementor/.

## Elementor Pro

- Confidence: high
- Status: verified
- Source: https://elatre.com/
- Evidence: Homepage loads scripts from /wp-content/plugins/elementor-pro/.

## Site Kit by Google

- Confidence: high
- Status: verified
- Source: https://elatre.com/
- Evidence: Homepage meta generator names Site Kit by Google. Script URLs include /wp-content/plugins/google-site-kit/.

## WordPress

- Confidence: high
- Status: verified
- Source: https://elatre.com/
- Evidence: Public pages serve /wp-content/, /wp-includes/, and the WordPress REST API at /wp-json/.

## PixFort theme and pixfort-core

- Confidence: high
- Status: verified
- Source: https://elatre.com/
- Evidence: Homepage markup uses pixfort header classes and loads /wp-content/plugins/pixfort-core/ assets. PixFort plugin version query on index.bundle was 4.4.2.

## jQuery

- Confidence: high
- Status: verified
- Source: https://elatre.com/
- Evidence: Homepage loads /wp-includes/js/jquery/jquery.min.js version 3.7.1

## WooCommerce

- Confidence: high
- Status: verified
- Source: https://elatre.com/
- Evidence: Homepage loads WooCommerce assets (JS version 11.2.1). The public store catalog at /wp-json/wc/store/v1/products returned zero products.

## Formidable Forms

- Confidence: high
- Status: verified
- Source: https://elatre.com/
- Evidence: Homepage references /wp-content/plugins/formidable/css/formidableforms.css.

## Jetpack

- Confidence: high
- Status: verified
- Source: https://elatre.com/
- Evidence: Homepage loads Jetpack CSS and references stats.wp.com and s0.wp.com.

## Google tag (gtag.js)

- Confidence: high
- Status: verified
- Source: https://elatre.com/
- Evidence: Homepage loads https://www.googletagmanager.com/gtag/js?id=GT-TB7DDX5.

## WordPress.com font service

- Confidence: high
- Status: verified
- Source: https://elatre.com/
- Evidence: Stylesheets are loaded from fonts-api.wp.com for families: Inter, Roboto, Roboto Slab

## Swiper

- Confidence: medium
- Status: verified
- Source: https://elatre.com/
- Evidence: Homepage HTML contains Swiper class or script references.

## Lottie

- Confidence: medium
- Status: verified
- Source: https://elatre.com/
- Evidence: Homepage HTML contains Lottie references.

## WordPress.com / Automattic hosting

- Confidence: high
- Status: verified
- Source: https://elatre.com/wp-json/
- Evidence: Direct response headers on https://elatre.com/wp-json/ included host-header WordPress.com, server nginx, and an Automattic x-hacker header.

## Calendly

- Confidence: high
- Status: verified
- Source: https://elatre.com/
- Evidence: Homepage links to https://calendly.com/elatre/divya.

## MailPoet

- Confidence: low
- Status: partially_verified
- Source: https://elatre.com/wp-json/
- Evidence: The public REST index lists a mailpoet/v1 namespace. MailPoet markup was not confirmed in the homepage HTML.

## Unknown or not verified

- Backend language beyond WordPress/PHP conventions implied by WordPress itself was not directly observed as application source.
- No public first-party API documentation was found. The observable machine interfaces are the WordPress REST API, sitemaps, robots.txt, and llms.txt.
- A CMS other than WordPress was not indicated.

