# Asset optimization

Start with measured LCP, layout shifts and downloaded bytes. Inspect the installed Next version and router before applying framework helpers. Native images/media and custom loaders can be valid; do not convert assets solely to satisfy a checklist.

## Images

Reserve image space with width/height or a positioned, sized parent for fill. Static imports infer dimensions and can provide a blur placeholder for supported formats. Supply meaningful alt text, or empty alt for decoration. For responsive images, sizes must match actual rendered width; it is not automatically inferred from CSS.

Next.js 16 deprecates priority in favor of preload. On older supported versions use their documented prop. A hero visible in the initial markup may need only eager loading/high fetch priority; preload is a deliberate optimization, not a requirement for every LCP candidate. Do not combine preload with loading/fetchPriority. Keep below-fold items lazy; array index zero does not establish which image is LCP.

```tsx
// Next.js 16; the app supplies public/hero.jpg
import Image from 'next/image'

export function Hero() {
  return <Image src="/hero.jpg" alt="Fleet parked at a depot"
    width={1600} height={900}
    sizes="(max-width: 800px) 100vw, 800px"
    style={{ width: '100%', maxWidth: 800, height: 'auto' }}
    loading="eager" fetchPriority="high" />
}
```

For remote images, restrict protocol/host/path/query to trusted sources rather than copying wildcard domains. Review the installed version's quality/cache defaults before overriding. Test actual srcset, rendered width and LCP at representative viewports.

## Fonts

next/font can self-host Google or local fonts and reduce layout shifts. Google fonts are downloaded during the build, so restricted/offline builds need supplied local assets or an appropriate build path. It does not guarantee zero CLS or eliminate all font swap. Choose subsets, weights and preload based on usage; variable fonts are not always the smallest choice for a single weight.

```tsx
// app/layout.tsx; needs build-time Google Fonts access
import { Geist } from 'next/font/google'
import type { ReactNode } from 'react'

const font = Geist({ subsets: ['latin'], display: 'swap' })
export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="en"><body className={font.className}>{children}</body></html>
}
```

For local licensed fonts, supply the files to next/font/local. If using a CSS variable instead of className, apply it in font-family; defining a variable alone does not select a font.

## Third-party scripts

Use afterInteractive for scripts needed after some hydration, and lazyOnload for low-priority scripts. beforeInteractive is for genuinely early site-wide needs and belongs in the App root layout (Pages uses its supported document integration). Prefer an owned/audited URL; a sample third-party CDN is not a deployment recommendation.

```tsx
// Example integration; the app must supply the local script.
import Script from 'next/script'
export function SupportWidget() {
  return <Script src="/scripts/support-widget.js" strategy="lazyOnload" />
}
```

The worker strategy is experimental, requires its flag and is currently Pages Router only; it does not support App Router. Event callbacks such as onLoad/onReady need Client Components and have strategy restrictions. Measure execution cost, not just download timing.

## Video

Loading video after a click can reduce initial transfer. Do not call play immediately after setting state that has not mounted the video yet. This minimal component reveals native controls, leaving playback to the user; custom auto-start needs a post-mount/ref path and rejected-play handling.

```tsx
'use client'
import { useState } from 'react'

export function VideoPlayer({ src }: { src: string }) {
  const [loaded, setLoaded] = useState(false)
  return loaded
    ? <video src={src} controls preload="none" aria-label="Product demonstration" />
    : <button onClick={() => setLoaded(true)}>Load video</button>
}
```

## Preload and navigation

metadata.other emits meta tags, not a link element. Do not put link objects there to preload an image. Use the installed Image preload prop or ReactDOM preload/preconnect APIs where supported, with a measured reason. Link prefetch optimizes route navigation, not arbitrary assets; its defaults depend on route type, production mode and current Next features.

Sources: [Image API](https://nextjs.org/docs/app/api-reference/components/image), [Font API](https://nextjs.org/docs/app/api-reference/components/font), [Script API](https://nextjs.org/docs/app/api-reference/components/script), [Metadata resource hints](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#resource-hints). Scoped dates: [SOURCES.md](../SOURCES.md).
