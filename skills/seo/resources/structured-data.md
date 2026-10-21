# Structured Data (JSON-LD)

Structured data helps Google understand page content and enables rich results (enhanced search listings with images, ratings, prices, etc.).

**Format:** Google recommends **JSON-LD** over Microdata or RDFa.

## Adding JSON-LD to Next.js

```tsx
// Reusable component for any page
function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
```

## Organization + WebSite (Home Page)

```tsx
// app/page.tsx
export default function HomePage() {
  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Carzilly',
    url: 'https://carzilly.com',
    logo: 'https://carzilly.com/logo.png',
    sameAs: [
      'https://twitter.com/carzilly',
      'https://facebook.com/carzilly',
      'https://instagram.com/carzilly',
    ],
  }

  const websiteData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Carzilly',
    url: 'https://carzilly.com',
  }

  return (
    <>
      <JsonLd data={organizationData} />
      <JsonLd data={websiteData} />
      <main>...</main>
    </>
  )
}
```

Google removed the sitelinks search box in November 2024. Do not add `SearchAction`. `WebSite` is still used for the site name.

## Product

```tsx
// app/listings/[id]/page.tsx
export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const listing = await getListing(id)

  const productData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${listing.year} ${listing.make} ${listing.model}`,
    description: listing.description,
    image: listing.images,
    brand: {
      '@type': 'Brand',
      name: listing.make,
    },
    offers: {
      '@type': 'Offer',
      price: listing.price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: listing.dealershipName,
      },
    },
  }

  return (
    <>
      <JsonLd data={productData} />
      <main>...</main>
    </>
  )
}
```

## Article / Blog Post

```tsx
const articleData = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: post.title,
  description: post.excerpt,
  image: post.coverImage,
  datePublished: post.publishedAt,
  dateModified: post.updatedAt,
  author: {
    '@type': 'Person',
    name: post.author.name,
    url: post.author.profileUrl,
  },
  publisher: {
    '@type': 'Organization',
    name: 'Carzilly',
    logo: {
      '@type': 'ImageObject',
      url: 'https://carzilly.com/logo.png',
    },
  },
}
```

Article has no required properties. Add the ones you have. `headline`, `image`, `datePublished`, and `author` are the usual set for a post.

## BreadcrumbList

```tsx
function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return <JsonLd data={data} />
}

// Usage
<BreadcrumbJsonLd items={[
  { name: 'Home', url: 'https://carzilly.com' },
  { name: 'Listings', url: 'https://carzilly.com/listings' },
  { name: '2024 BMW M4', url: 'https://carzilly.com/listings/123' },
]} />
```

## LocalBusiness

```tsx
const localBusinessData = {
  '@context': 'https://schema.org',
  '@type': 'AutoDealer',  // Specific subtype of LocalBusiness
  name: 'Premier Auto Group',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '123 Main St',
    addressLocality: 'Springfield',
    addressRegion: 'IL',
    postalCode: '62701',
    addressCountry: 'US',
  },
  telephone: '+1-555-123-4567',
  url: 'https://premierauto.com',
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 39.7817,
    longitude: -89.6501,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Saturday',
      opens: '10:00',
      closes: '16:00',
    },
  ],
}
```

## FAQPage

> Google stopped showing FAQ rich results on May 7, 2026. HowTo rich results ended on September 13, 2023. Leaving this markup in place does not cause a penalty, and it does not produce a rich result.

```tsx
const faqData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I list my car on Carzilly?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Create an account, click "Sell Your Car", and fill in the details...',
      },
    },
  ],
}
```

## Testing Structured Data

1. **Google Rich Results Test**: https://search.google.com/test/rich-results
2. **Schema.org Validator**: https://validator.schema.org/
3. **Google Search Console**: Enhancements → specific rich result type

### Common Mistakes

```tsx
// WRONG — structured data doesn't match visible content
// (Google calls this "spammy structured data")
const data = {
  '@type': 'Product',
  offers: { price: 0 },  // Page shows $25,000
}

// WRONG — Microdata instead of JSON-LD
<div itemScope itemType="https://schema.org/Product">  // Don't use this
  <span itemProp="name">Widget</span>
</div>

// RIGHT — JSON-LD in a script tag
<script type="application/ld+json">{JSON.stringify(data)}</script>
```
