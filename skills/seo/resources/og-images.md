# OG Images

Open Graph images appear when your page is shared on social media, messaging apps, and search results. They significantly impact click-through rates.

## Static OG Images (File-Based)

Place image files in your route directory:

```
app/
├── opengraph-image.png     → Default OG image (1200x630)
├── twitter-image.png       → Twitter card image (1200x630)
├── blog/
│   └── [slug]/
│       └── opengraph-image.png  → Per-route override
```

Next.js automatically generates the correct `<meta>` tags:
```html
<meta property="og:image" content="https://example.com/opengraph-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

## Dynamic OG Images (Generated)

Generate images on-the-fly using `ImageResponse`:

```tsx
// app/blog/[slug]/opengraph-image.tsx
import { ImageResponse } from 'next/og'
import { getPost } from '@/lib/db'

export const alt = 'Blog post cover'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          width: '100%',
          height: '100%',
          padding: 60,
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 28, color: '#818cf8', marginBottom: 16 }}>
          My Blog
        </div>
        <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.2 }}>
          {post.title}
        </div>
        <div style={{ fontSize: 24, color: '#94a3b8', marginTop: 24 }}>
          {post.author.name} · {new Date(post.publishedAt).toLocaleDateString()}
        </div>
      </div>
    ),
    { ...size }
  )
}
```

### Product / Listing OG Image

```tsx
// app/listings/[id]/opengraph-image.tsx
import { ImageResponse } from 'next/og'
import { getListing } from '@/lib/db'

export const alt = 'Vehicle listing'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const listing = await getListing(id)

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          background: '#0f172a',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Vehicle image */}
        {listing.images?.[0] && (
          <img
            src={listing.images[0]}
            style={{ width: '50%', height: '100%', objectFit: 'cover' }}
          />
        )}

        {/* Details */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 48, flex: 1 }}>
          <div style={{ fontSize: 24, color: '#94a3b8' }}>
            {listing.year}
          </div>
          <div style={{ fontSize: 48, fontWeight: 700, marginTop: 8 }}>
            {listing.make} {listing.model}
          </div>
          <div style={{ fontSize: 40, color: '#22c55e', marginTop: 24 }}>
            ${listing.price?.toLocaleString()}
          </div>
          <div style={{ fontSize: 20, color: '#64748b', marginTop: 16 }}>
            {listing.mileage?.toLocaleString()} miles · {listing.dealershipName}
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
```

### Using Custom Fonts

```tsx
import { ImageResponse } from 'next/og'

export default async function Image() {
  const geistBold = fetch(
    new URL('../../assets/Geist-Bold.ttf', import.meta.url)
  ).then((res) => res.arrayBuffer())

  return new ImageResponse(
    (
      <div style={{ fontFamily: 'Geist', fontSize: 64, fontWeight: 700 }}>
        Custom Font Title
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Geist',
          data: await geistBold,
          style: 'normal',
          weight: 700,
        },
      ],
    }
  )
}
```

## OG Image via Metadata Export

For cases where you have existing images (not generated):

```tsx
export const metadata: Metadata = {
  openGraph: {
    images: [
      {
        url: '/og-default.png',       // Resolved against metadataBase
        width: 1200,
        height: 630,
        alt: 'Site description',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/twitter-default.png'],
  },
}
```

## Image Specifications

| Platform | Recommended Size | Aspect Ratio | Min Size |
|----------|-----------------|--------------|----------|
| Open Graph (Facebook, LinkedIn) | 1200x630 | ~1.91:1 | 200x200 |
| Twitter summary_large_image | 1200x630 | ~1.91:1 | 300x157 |
| Twitter summary | 240x240 | 1:1 | 144x144 |
| Google Discover | 1200x1200 | 1:1 | 1200 wide |

## Testing

- **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
- **Twitter Card Validator**: https://cards-dev.twitter.com/validator
- **LinkedIn Post Inspector**: https://www.linkedin.com/post-inspector/
- **opengraph.xyz**: Preview OG images across platforms
