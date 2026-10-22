# Images and fonts

## Image decisions

Use `next/image` when its resizing/loading behavior fits the deployment and source. Raw img, inline SVG, animated media and custom loaders can be valid. Do not convert every image by rule. Supply meaningful alt text, or empty alt for decorative imagery.

Reserve layout space with intrinsic width/height or a sized positioned parent for `fill`. Give responsive images a `sizes` value matching their rendered width, not a universal 100vw. Restrict remotePatterns to intended protocol/host/path/query; avoid a wildcard CDN allowlist copied from an example.

| Version / situation | Loading choice |
| --- | --- |
| Next.js 16 | `priority` deprecated in favor of `preload`; check actual API |
| Known early LCP image | Consider `preload` only when preloading helps |
| Image discoverable in markup, high importance | Often `loading="eager"` or `fetchPriority="high"` is preferable |
| Below fold | Default lazy loading |
| Older version | Use supported prop; don't backport preload blindly |

Don't combine preload with loading/fetchPriority as interchangeable knobs. Multiple viewport-dependent LCP candidates make indiscriminate preloading wasteful; there is no invariant “exactly one priority image per page.” Measure LCP/bytes under the relevant viewport/network.

```tsx
// app/page.tsx; Next.js 16, eager/high priority rather than preload
import Image from 'next/image'

export default function Page() {
  return <main>
    <Image src="/hero.jpg" alt="An invoice reminder dashboard"
      width={1600} height={900}
      sizes="(max-width: 800px) 100vw, 800px"
      style={{ width: '100%', maxWidth: 800, height: 'auto' }}
      loading="eager" fetchPriority="high" />
  </main>
}
```

Supply the actual image in public/ when using this example. For remote sources configure exact trusted patterns. `preload` was added and `priority` deprecated in 16.0, independently of the 16.3 error-recovery change.

Next.js 16 changed defaults including qualities `[75]`, image size presets, minimum cache TTL, redirect limits and local-IP restrictions. Consult the installed version before overriding; default tables become stale. Component quality can map to an allowed value, while direct optimizer requests with an unapproved quality return 400. Source changes may remain cached; choose cache keys/TTL intentionally. Do not weaken local-IP/SVG protections merely to make a URL load.

## Fonts

`next/font/google` downloads fonts at build time and self-hosts them in the deployed app; browser requests don't need Google. Builds therefore need access to that source. For offline/restricted builds or licensed brand assets, `next/font/local` with supplied files can fit better. Check licensing before adding assets.

Choose subsets/weights or variable fonts based on use; preload only needed faces. A CSS variable must actually be used by font-family. Font helpers can reduce layout shift, but cannot guarantee zero CLS or no visible font swap for all designs.

```css
/* When the layout applies a next/font variable named --font-brand */
body { font-family: var(--font-brand), system-ui, sans-serif; }
```

Validate build asset availability, responsive dimensions, actual srcset/sizes, remote URL acceptance, visual shifts and LCP. Do not claim performance improvements from using helpers alone. Performance measurement beyond this framework integration belongs with the optional React performance skill or the app's existing tooling.

Sources: [Image API, preload/priority/config/version history](https://nextjs.org/docs/app/api-reference/components/image), [Font API](https://nextjs.org/docs/app/api-reference/components/font), [16 upgrade image changes](https://nextjs.org/docs/app/guides/upgrading/version-16). Scope/dates: [ledger](../SOURCES.md).
