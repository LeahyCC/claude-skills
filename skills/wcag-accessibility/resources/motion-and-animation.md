# Motion and Animation

WCAG Success Criteria: 2.2.2 (Pause, Stop, Hide), 2.3.1 (Three Flashes or Below), 2.3.3 (Animation from Interactions)

## Reduced Motion Preference

Always respect `prefers-reduced-motion`:

```tsx
// CSS — disable or reduce animations
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

// Or target specific animations
@media (prefers-reduced-motion: reduce) {
  .hero-animation {
    animation: none;
  }
  .slide-in {
    transform: none;
    opacity: 1;
  }
}
```

### Tailwind CSS

```tsx
// Tailwind has built-in motion-reduce variants
<div className="animate-bounce motion-reduce:animate-none">
  Bouncing element
</div>

<div className="transition-transform duration-300 motion-reduce:transition-none">
  Smooth transition
</div>

// Safe animation — only animate when user hasn't requested reduced motion
<div className="motion-safe:animate-pulse">
  Loading...
</div>
```

### React Hook

```tsx
function usePrefersReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReduced(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return prefersReduced
}

// Usage
function AnimatedComponent() {
  const prefersReduced = usePrefersReducedMotion()

  return (
    <motion.div
      animate={{ x: prefersReduced ? 0 : 100 }}
      transition={{ duration: prefersReduced ? 0 : 0.3 }}
    />
  )
}
```

## Flash and Seizure Thresholds

**Hard rule**: No content may flash more than **3 times per second**.

```tsx
// DANGEROUS — rapid flashing can cause seizures
<div className="animate-[flash_0.2s_infinite]">  {/* 5 flashes/sec — FAIL */}

// SAFE — slow pulse
<div className="animate-pulse">  {/* ~1 flash/2sec — OK */}
```

### What Counts as a Flash

- A pair of opposing changes in luminance (light → dark → light)
- Particularly dangerous: large area (> 25% of viewport) with high contrast change
- Red flashing is especially hazardous

## Auto-Playing Content

Any content that auto-plays, moves, or updates for more than 5 seconds must have pause/stop controls:

```tsx
// Auto-playing carousel — must have controls
function Carousel({ slides }) {
  const [isPlaying, setIsPlaying] = useState(true)
  const [current, setCurrent] = useState(0)

  return (
    <div role="region" aria-label="Featured vehicles" aria-roledescription="carousel">
      <div aria-live={isPlaying ? "off" : "polite"}>
        <div role="group" aria-roledescription="slide" aria-label={`Slide ${current + 1} of ${slides.length}`}>
          {slides[current]}
        </div>
      </div>

      {/* REQUIRED: Pause control */}
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        aria-label={isPlaying ? "Pause carousel" : "Play carousel"}
      >
        {isPlaying ? <Pause /> : <Play />}
      </button>

      {/* Navigation */}
      <button onClick={prev} aria-label="Previous slide">Previous</button>
      <button onClick={next} aria-label="Next slide">Next</button>
    </div>
  )
}
```

### Auto-Playing Video

```tsx
// Must provide pause control and respect reduced motion
<video
  autoPlay={!prefersReduced}
  muted
  loop
  playsInline
>
  <source src="/bg-video.mp4" type="video/mp4" />
</video>

// Always provide a pause button for auto-playing video
<button onClick={toggleVideo} aria-label={isPlaying ? "Pause background video" : "Play background video"}>
  {isPlaying ? <Pause /> : <Play />}
</button>
```

## Scroll-Linked Animations

Parallax and scroll-linked animations can cause motion sickness:

```tsx
// Disable parallax for reduced motion users
<div
  className="motion-safe:translate-y-[var(--scroll-offset)] motion-reduce:translate-y-0"
  style={{ '--scroll-offset': `${scrollY * 0.5}px` } as React.CSSProperties}
>
  Parallax content
</div>
```

## Loading Indicators

```tsx
// Spinners are OK — but provide text alternative
<div role="status">
  <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
  <span className="sr-only">Loading...</span>
</div>

// Progress bars — provide accessible progress info
<div
  role="progressbar"
  aria-valuenow={progress}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="Upload progress"
>
  <div className="h-2 rounded-full bg-primary transition-all motion-reduce:transition-none" style={{ width: `${progress}%` }} />
</div>
```

## Safe Animation Defaults

| Animation Type | Default | Reduced Motion |
|---|---|---|
| Page transitions | Fade + slide (300ms) | Instant or fade only (150ms) |
| Hover effects | Scale/color (200ms) | Color only (0ms) |
| Loading spinners | Rotate infinite | Static icon or text |
| Toasts/notifications | Slide in (300ms) | Appear instantly |
| Accordions | Height animate (200ms) | Instant toggle |
| Modals | Fade + scale (200ms) | Instant appear |
| Scroll parallax | Transform on scroll | No transform |
| Background video | Auto-play loop | Still image |
