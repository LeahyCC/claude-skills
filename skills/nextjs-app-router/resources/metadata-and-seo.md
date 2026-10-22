# Metadata and SEO integration

## Framework ownership

Export static `metadata` or async `generateMetadata` from a Server Component page/layout. Do not export both from the same segment, or either from a Client Component. Keep a server wrapper/layout if the interactive page needs client code.

Set a deliberate public base URL when using relative metadata URLs; an explicit `metadataBase` avoids relying on deployment-derived defaults. Use a title default/template for inheritance. Nested metadata is shallowly merged: redefining `openGraph` replaces the parent object, so share fields deliberately instead of expecting deep inheritance.

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: { default: 'Acme Invoices', template: '%s | Acme Invoices' },
  description: 'Track invoices and send payment reminders.',
}

export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
```

For dynamic metadata, await params and share a module-level React `cache` query with the page when needed for ORM deduplication. Matching fetches can already be memoized. Handle absent data consistently with the page. With Cache Components, check metadata's runtime dependencies separately; don't assume a cached page automatically caches metadata.

## Product and search choices

Use meaningful titles and descriptions for public content. Canonicals represent the preferred equivalent URL; don't mechanically canonicalize all pagination to page one or remove every search/filter query. Decide indexing/canonical policy based on the actual content and product. `noindex` and robots rules do not protect private content: authenticate and authorize before returning it.

Use file conventions (`sitemap.ts`, `robots.ts`, `opengraph-image.tsx`) for their framework outputs. File-based metadata can override config metadata. For deeper structured data, crawl/index policy and OG generation, consult the optional sibling [SEO skill](../../seo/SKILL.md) if installed, or the official guides below. A single-skill installation must remain useful without sibling files. Don't expand an App Router fix into a full SEO audit without a task reason.

Verify generated tags, absolute URL resolution, inheritance, missing records and crawler/streaming behavior as relevant. Avoid redundant manual head tags that conflict with metadata exports.

Sources: [Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata), [Metadata/OG guide](https://nextjs.org/docs/app/getting-started/metadata-and-og-images). Scope/dates: [ledger](../SOURCES.md).
