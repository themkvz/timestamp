## Purpose

Defines how Timestamp presents its pages to search engines, social crawlers, and browser surfaces using
self-hosted, page-specific metadata and static discovery files.

## ADDED Requirements

### Requirement: Indexable page content
The converter homepage and FAQ SHALL contain their meaningful initial content as static HTML. A
crawler that does not execute JavaScript SHALL see each page's heading, description, navigation, and
page-specific content.

#### Scenario: Inspect built HTML
- **WHEN** the production HTML for `/` and `/faq` is inspected as text
- **THEN** each document contains its rendered page content rather than an empty application mount

### Requirement: Unique canonical metadata
Each top-level page SHALL declare English document language, a unique title, a unique description
between 50 and 160 characters, indexing directives, and one canonical URL under
`https://timestamp.themkvz.com`. The homepage canonical URL SHALL be `/`, and the FAQ canonical URL
SHALL be `/faq`.

#### Scenario: Inspect page metadata
- **WHEN** the head metadata of each built page is inspected
- **THEN** it contains exactly one non-empty title, description, canonical link, and robots directive
  consistent with that page

#### Scenario: Compare page identities
- **WHEN** the homepage and FAQ titles, descriptions, and canonical URLs are compared
- **THEN** each page has a distinct identity matching its visible content

### Requirement: Social sharing metadata
Each top-level page SHALL include Open Graph and Twitter card metadata with a title, description,
canonical page URL, and a self-hosted 1200 by 630 preview image. Pages MAY share the same image.

#### Scenario: Generate social preview
- **WHEN** a social crawler reads either page
- **THEN** it finds complete, internally consistent Open Graph and Twitter summary-large-image data

#### Scenario: Resolve preview image
- **WHEN** the declared preview image path is resolved against the production artifact
- **THEN** a 1200 by 630 image exists at that path

### Requirement: Page-appropriate structured data
The homepage SHALL include valid `WebApplication` JSON-LD, and the FAQ SHALL include valid `FAQPage`
JSON-LD derived from the visible questions and answers. Structured data MUST match the canonical URL,
title, description, and visible content and MUST NOT contain fabricated ratings or claims.

#### Scenario: Validate homepage structured data
- **WHEN** the homepage JSON-LD is parsed
- **THEN** it declares a free `WebApplication` named Timestamp at the homepage canonical URL

#### Scenario: Validate FAQ structured data
- **WHEN** the FAQ JSON-LD is parsed
- **THEN** every structured question and accepted answer has a matching visible question and answer on
  the FAQ page

### Requirement: Crawl discovery files
The production artifact SHALL contain a `robots.txt` that permits crawling and names the sitemap, and
a valid `sitemap.xml` listing exactly the canonical homepage and FAQ URLs delivered by this change.

#### Scenario: Inspect robots file
- **WHEN** `/robots.txt` is requested
- **THEN** it permits all user agents and points to
  `https://timestamp.themkvz.com/sitemap.xml`

#### Scenario: Inspect sitemap
- **WHEN** `/sitemap.xml` is parsed
- **THEN** it lists `https://timestamp.themkvz.com/` and
  `https://timestamp.themkvz.com/faq` exactly once and no unshipped future page

### Requirement: Self-hosted browser identity assets
Every page SHALL reference a self-hosted SVG favicon, ICO favicon, apple touch icon, web app manifest,
and theme color. The manifest SHALL identify Timestamp and reference only files present in the
production artifact.

#### Scenario: Resolve identity assets
- **WHEN** page icon and manifest references are resolved against the production artifact
- **THEN** every referenced asset exists and no browser identity asset requires a third-party request

