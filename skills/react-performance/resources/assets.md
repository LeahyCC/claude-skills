# Asset Optimization

## Images — next/image

### Why next/image?

| Feature | Raw `<img>` | `next/image` |
|---------|------------|--------------|
| Format optimization | Manual | Auto WebP/AVIF |
| Responsive sizes | Manual srcset | Auto `sizes` |
| Lazy loading | Manual | Default (except `priority`) |
| CLS prevention | Must set dimensions | Auto from import or required props |
| Blur placeholder | Must build manually | `placeholder="blur"` |

### LCP Images (Hero, Banner)

```tsx
import Image from 'next/image'
import heroImg from './hero.png'  // Static import = auto dimensions + blur

<Image
  src={heroImg}
  alt="Featured vehicle"
  priority              // Disables lazy loading, preloads
  placeholder="blur"    // Blur-up from static import
  sizes="100vw"         // Full-width image
/>
```

### Responsive Images

```tsx
// Responsive with breakpoint-aware sizes
<Image
  src="/listing.jpg"
  alt="Vehicle photo"
  width={800}
  height={600}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

### Fill Mode (Dynamic Containers)

```tsx
// Parent must have position: relative and defined dimensions
<div className="relative aspect-video w-full overflow-hidden rounded-lg">
  <Image
    src={listing.imageUrl}
    alt={listing.title}
    fill
    className="object-cover"
    sizes="(max-width: 768px) 100vw, 50vw"
  />
</div>
```

### Remote Images Configuration

```ts
// next.config.ts
export default {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.example.com',  // Wildcard subdomain
      },
    ],
  },
}
```

### Gallery/List Images

```tsx
// Lazy loaded by default — good for below-fold content
{listings.map((listing, i) => (
  <Image
    key={listing.id}
    src={listing.imageUrl}
    alt={listing.title}
    width={400}
    height={300}
    // Only mark the first visible image as priority
    priority={i === 0}
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  />
))}
```

## Fonts — next/font

### Why next/font?

- **Self-hosts** all fonts — zero external requests
- **Eliminates CLS** from font swap via CSS `size-adjust`
- **Preloads** font files automatically
- Use **variable fonts** for smallest file size

### Google Fonts

```tsx
// app/layout.tsx
import { Geist, Geist_Mono } from 'next/font/google'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

```css
/* globals.css */
body {
  font-family: var(--font-geist-sans);
}

code, pre {
  font-family: var(--font-geist-mono);
}
```

### Local Fonts

```tsx
import localFont from 'next/font/local'

const customFont = localFont({
  src: [
    { path: './fonts/CustomFont-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/CustomFont-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-custom',
})
```

### Font Optimization Checklist

- [ ] Use `next/font` (not `<link>` to Google Fonts CDN)
- [ ] Use variable fonts when available (one file for all weights)
- [ ] Only load the `subsets` you need (`latin`, not `latin-ext` unless needed)
- [ ] Apply font via CSS variable for flexibility
- [ ] Use `font-display: swap` (next/font does this by default)

## Third-Party Scripts

```tsx
import Script from 'next/script'

// Analytics — load after page is interactive
<Script
  src="https://www.googletagmanager.com/gtag/js?id=G-XXXXX"
  strategy="afterInteractive"
/>

// Non-critical — load when browser is idle
<Script
  src="https://connect.facebook.net/en_US/sdk.js"
  strategy="lazyOnload"
/>

// Critical — load before page is interactive (rare)
<Script
  src="https://polyfill.io/v3/polyfill.min.js"
  strategy="beforeInteractive"
/>
```

### Loading Priority

| Strategy | When | Use For |
|----------|------|---------|
| `beforeInteractive` | Before hydration | Polyfills, critical feature detection |
| `afterInteractive` | After hydration (default) | Analytics, tag managers |
| `lazyOnload` | During idle time | Social widgets, chat widgets |
| `worker` | In Web Worker (experimental) | Heavy analytics, non-DOM scripts |

## Video

```tsx
// Lazy load video — don't autoplay heavy content
function VideoPlayer({ src }: { src: string }) {
  const [loaded, setLoaded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  return (
    <div className="relative aspect-video">
      {!loaded && (
        <button
          onClick={() => {
            setLoaded(true)
            videoRef.current?.play()
          }}
          className="absolute inset-0 flex items-center justify-center bg-black"
        >
          <PlayIcon className="size-16 text-white" />
        </button>
      )}
      {loaded && (
        <video
          ref={videoRef}
          src={src}
          controls
          className="h-full w-full"
          preload="none"  // Don't preload video data
        />
      )}
    </div>
  )
}
```

## Preloading Critical Assets

```tsx
// Preload LCP image in metadata
export const metadata = {
  other: {
    link: [
      {
        rel: 'preload',
        href: '/hero.webp',
        as: 'image',
        type: 'image/webp',
      },
    ],
  },
}

// Prefetch next page on hover
import Link from 'next/link'
<Link href="/listings/123" prefetch={true}>
  View Listing
</Link>
// Next.js prefetches linked routes automatically on viewport entry
// Set prefetch={false} to disable for rarely-visited links
```
