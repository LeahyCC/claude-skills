# Assets

> **Core Principle:** Optimize images and fonts at the framework level. Specify dimensions, use `priority` for LCP images, and self-host fonts with `next/font`.

## Introduction

`next/image` automatically optimizes images (WebP/AVIF, responsive sizes, lazy loading). `next/font` self-hosts fonts with zero layout shift. Both are critical for Core Web Vitals — especially LCP and CLS.

For metadata OG images, see [metadata-and-seo.md](metadata-and-seo.md). For caching optimized assets, see [caching.md](caching.md).

## Architecture

```
Request
  │
  ▼
next/image
  ├── Static import ──► build-time dimensions + blur placeholder
  ├── Remote URL ─────► next.config remotePatterns + width/height or fill
  └── Optimization ───► AVIF/WebP, responsive srcset, lazy load
  │
  ▼
next/font
  ├── google ──► self-hosted at build, CSS variables
  └── local ───► preload, size-adjust, zero CLS
  │
  ▼
Browser
  ├── LCP image preloaded (priority)
  ├── Fonts preloaded (no FOUT/FOIT)
  └── Below-fold images lazy loaded
```

## Decision Matrix

### Image pattern

| Scenario | Pattern | Key Props |
|----------|---------|-----------|
| Hero / above-fold | Static import or remote + `priority` | `priority`, `sizes="100vw"` |
| Product card grid | Remote with dimensions | `width`, `height`, `sizes` |
| Avatar / icon | Small fixed size | `width={40}`, `height={40}` |
| Responsive container | Parent with `position: relative` | `fill`, `object-fit` |
| Background image | `fill` + `object-cover` | `fill`, `sizes`, `alt=""` if decorative |
| SVG logo | `<Image>` or inline SVG | `width`, `height`, meaningful `alt` |
| GIF animation | `<img>` or `<video>` | `next/image` doesn't animate GIFs optimally |

### Font pattern

| Scenario | Approach |
|----------|----------|
| Google Font | `next/font/google` |
| Custom / licensed font | `next/font/local` |
| Monospace code | `Geist_Mono` or local variant |
| Multiple weights | Variable font (single file) |
| CSS variable theming | `variable: '--font-sans'` on `<html>` |

### `priority` decision

| Image | `priority`? |
|-------|-------------|
| LCP hero image | Yes |
| First visible product in grid | Optional (first item only) |
| Below-fold gallery | No (lazy load default) |
| Footer logo | No |
| Open Graph (metadata) | N/A — separate pipeline |

## Production Workflow

```
1. Configure remotePatterns in next.config.ts
2. Add next/font to root layout with CSS variables
3. Use static imports for local hero images
4. Set priority + sizes on LCP image
5. Use fill + sizes for responsive containers
6. Specify width/height on all non-fill images
7. Audit CLS and LCP with Lighthouse / web-vitals
```

### next.config.ts — Remote Images

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.acme.com',
        pathname: '/vehicles/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    // Next.js 16 defaults — override only when you need different behavior
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [32, 48, 64, 96, 128, 256, 384], // 16 removed from default
    qualities: [75], // quality prop coerced to nearest allowed value
    minimumCacheTTL: 14400, // 4 hours (was 60s)
    maximumRedirects: 3, // was unlimited
    // dangerouslyAllowLocalIP: true, // private networks only
    // localPatterns: [{ pathname: '/assets/**', search: '' }], // required if local src uses ?query
  },
}

export default nextConfig
```

### Migrating Image Config (Next.js 15 → 16)

Next.js 16 tightens image optimization defaults. After upgrading:

| Setting | Before (15) | After (16) | What to do |
|---------|-------------|------------|------------|
| `imageSizes` | Included `16` | `[32, 48, 64, 96, 128, 256, 384]` | Add `16` back only if you serve true 16px slots (rare; retina usually fetches 32) |
| `qualities` | Any 1–100 | Default `[75]` | List every `quality` value you pass to `<Image>`; unmatched values are coerced to the closest allowed |
| `minimumCacheTTL` | 60s | **4 hours** (14400s) | Expect slower pickup of source changes without `cache-control`; lower TTL only if images change often |
| `dangerouslyAllowLocalIP` | Allowed | **Blocked** (`false`) | Set `true` only for private-network / self-hosted local IPs |
| `maximumRedirects` | Unlimited | **3** | Raise for CDNs that chain redirects, or set `0` to disable redirects |
| `localPatterns.search` | Not required | Required when local `src` has a query string | Set `search` explicitly (e.g. `''` to forbid query, or `'?v=2'` for exact match) — omitting `search` allows all query strings |

```ts
// Example: restore 16px sizes + allow quality 90 + exact query for local assets
const nextConfig: NextConfig = {
  images: {
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [75, 90],
    localPatterns: [
      { pathname: '/assets/**', search: '?v=2' }, // exact search match
    ],
  },
}
```

### Fonts — Root Layout

```tsx
// app/layout.tsx
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
```

```css
/* app/globals.css */
body {
  font-family: var(--font-geist-sans), system-ui, sans-serif;
}

code, pre {
  font-family: var(--font-geist-mono), ui-monospace, monospace;
}
```

### Local Font

```tsx
// app/layout.tsx
import localFont from 'next/font/local'

const brandFont = localFont({
  src: [
    { path: '../public/fonts/Brand-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/Brand-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-brand',
  display: 'swap',
})
```

### LCP Hero Image

```tsx
// app/page.tsx
import Image from 'next/image'
import heroImage from '@/public/images/hero-fleet.jpg'

export default function HomePage() {
  return (
    <section className="relative h-[60vh] w-full">
      <Image
        src={heroImage}
        alt="Fleet of commercial vehicles on a highway at sunrise"
        priority
        placeholder="blur"
        fill
        className="object-cover"
        sizes="100vw"
      />
      <div className="relative z-10 flex h-full items-center px-8">
        <h1 className="text-4xl font-bold text-white">Manage Your Fleet</h1>
      </div>
    </section>
  )
}
```

### Product Grid

```tsx
// components/VehicleCard.tsx
import Image from 'next/image'
import type { Vehicle } from '@/lib/types'

export function VehicleCard({ vehicle, priority = false }: { vehicle: Vehicle; priority?: boolean }) {
  return (
    <article className="overflow-hidden rounded-lg border">
      <div className="relative aspect-[4/3] w-full">
        <Image
          src={vehicle.imageUrl}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={priority}
        />
      </div>
      <div className="p-4">
        <h2 className="font-semibold">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h2>
        <p className="text-muted-foreground">${vehicle.price.toLocaleString()}</p>
      </div>
    </article>
  )
}
```

```tsx
// app/vehicles/page.tsx
import { VehicleCard } from '@/components/VehicleCard'
import { getVehicles } from '@/lib/vehicles'

export default async function VehiclesPage() {
  const vehicles = await getVehicles()

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {vehicles.map((vehicle, index) => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} priority={index === 0} />
      ))}
    </div>
  )
}
```

### Fixed Dimensions

```tsx
import Image from 'next/image'

export function DealerLogo({ src, name }: { src: string; name: string }) {
  return (
    <Image
      src={src}
      alt={`${name} logo`}
      width={120}
      height={40}
      className="h-10 w-auto"
    />
  )
}
```

### Avatar

```tsx
import Image from 'next/image'

export function UserAvatar({ src, name }: { src: string; name: string }) {
  return (
    <Image
      src={src}
      alt={`${name}'s profile photo`}
      width={40}
      height={40}
      className="rounded-full"
    />
  )
}
```

## PASS Examples

### Static import — auto dimensions + blur

```tsx
import Image from 'next/image'
import cover from './cover.jpg'

<Image src={cover} alt="Report cover" placeholder="blur" />
```

### Responsive `sizes` matching layout

```tsx
<Image
  src="/banner.jpg"
  alt="Seasonal sale"
  width={1200}
  height={400}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
/>
```

### Variable font — smallest bundle

```tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  // Inter is a variable font — single file, all weights
})
```

## FAIL Examples

### Raw `<img>` for content images

```tsx
// FAIL — no optimization, no responsive srcset, CLS risk
<img src="/hero.jpg" alt="Hero" />
```

```tsx
// PASS
import Image from 'next/image'
<Image src="/hero.jpg" alt="Hero" width={1920} height={1080} priority sizes="100vw" />
```

### `fill` without positioned parent

```tsx
// FAIL — image won't render correctly
<div>
  <Image src="/photo.jpg" alt="Photo" fill />
</div>
```

```tsx
// PASS
<div className="relative aspect-video w-full">
  <Image src="/photo.jpg" alt="Photo" fill className="object-cover" sizes="100vw" />
</div>
```

### Remote image without `remotePatterns`

```tsx
// FAIL — throws error at runtime without config
<Image src="https://unknown-cdn.com/photo.jpg" alt="Photo" width={400} height={300} />
```

```tsx
// PASS — configure in next.config.ts first
<Image src="https://cdn.acme.com/photo.jpg" alt="Photo" width={400} height={300} />
```

### `priority` on every image

```tsx
// FAIL — defeats preloading, hurts performance
{images.map((src) => (
  <Image key={src} src={src} alt="" priority width={200} height={200} />
))}
```

```tsx
// PASS — priority only on LCP candidate
<Image src={hero} alt="Hero" priority width={1200} height={630} />
{images.map((src) => (
  <Image key={src} src={src} alt="" width={200} height={200} />
))}
```

### External Google Fonts `<link>`

```tsx
// FAIL — render-blocking request, CLS from font swap
<head>
  <link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet" />
</head>
```

```tsx
// PASS — self-hosted, preloaded, zero layout shift
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })
```

### Missing `alt` on meaningful images

```tsx
// FAIL — accessibility and SEO violation
<Image src="/chart.png" alt="" width={600} height={400} />
```

```tsx
// PASS
<Image src="/chart.png" alt="Q3 revenue up 24% year over year" width={600} height={400} />
```

## Common Mistakes

- Using `<img>` instead of `next/image` for content images.
- `fill` without `relative` parent or explicit aspect ratio container.
- Omitting `sizes` on responsive images — browser downloads oversized file.
- `priority` on below-fold images or entire galleries.
- Remote images without `remotePatterns` configuration.
- Loading fonts via external CDN instead of `next/font`.
- Missing `width`/`height` on non-fill images — causes CLS.
- Decorative images with descriptive `alt` instead of `alt=""`.
- Using `quality` values not listed in `images.qualities` — coerced to nearest allowed (default `[75]`).
- Local images with query strings without `images.localPatterns.search`.
- Importing huge uncompressed PNGs — optimize source assets first.

## Best Practices

- Configure `remotePatterns` explicitly — never use deprecated `domains`.
- Use static imports for local images — free blur placeholder + dimensions.
- Set `sizes` to match CSS layout breakpoints.
- One `priority` image per page — the LCP candidate.
- Use variable fonts to minimize font file count.
- Apply `next/font` CSS variables on `<html>`, consume in CSS/Tailwind.
- Use `fill` + `object-cover` for cards; fixed dimensions for logos/icons.
- Set `formats: ['image/avif', 'image/webp']` in config.
- Pre-optimize source images — don't rely on optimizer alone for 5MB originals.
- Audit with Lighthouse: LCP < 2.5s, CLS < 0.1.

## Production Checklist

### Images

- [ ] `next/image` used for all content images
- [ ] `remotePatterns` configured for all external image hosts
- [ ] LCP image has `priority` and correct `sizes`
- [ ] All images have meaningful `alt` (or `alt=""` if decorative)
- [ ] `fill` images have `relative` parent with defined dimensions
- [ ] Non-fill images specify `width` and `height`
- [ ] `sizes` attribute matches responsive layout breakpoints
- [ ] AVIF/WebP enabled in `next.config.ts`
- [ ] Next.js 16 image defaults reviewed (`qualities`, `minimumCacheTTL`, `imageSizes`, redirects, localPatterns)

### Fonts

- [ ] `next/font` used — no external Google Fonts `<link>`
- [ ] Variable fonts preferred over multiple weight files
- [ ] CSS variables applied on `<html>` element
- [ ] `display: 'swap'` set (default behavior)
- [ ] Only required subsets loaded (`latin`, not unused scripts)

### Performance

- [ ] Lighthouse LCP ≤ 2.5s on key pages
- [ ] Lighthouse CLS ≤ 0.1
- [ ] No layout shift from images or fonts
- [ ] Below-fold images lazy loaded (default behavior)
- [ ] Hero image preloaded via `priority`

## References

### Verified Against

- [Image Optimization](https://nextjs.org/docs/app/getting-started/images)
- [Font Optimization](https://nextjs.org/docs/app/getting-started/fonts)
- [`next/image`](https://nextjs.org/docs/app/api-reference/components/image)
- [`next/font`](https://nextjs.org/docs/app/api-reference/components/font)
- [`images` config](https://nextjs.org/docs/app/api-reference/config/next-config-js/images)
- [Static Assets](https://nextjs.org/docs/app/api-reference/file-conventions/public-folder)

**Framework:** Next.js 16 App Router

**Last verified:** July 2026
