# Images and Media

WCAG Success Criteria: 1.1.1 (Non-text Content), 1.2.1-1.2.9 (Time-Based Media), 1.4.5 (Images of Text)

## Alt Text

Every `<img>` must have an `alt` attribute. The content depends on the image's purpose:

### Informative Images

Convey information — describe the content:

```tsx
// Good — describes what's relevant
<img src="/car.jpg" alt="2024 BMW M4 in Alpine White, front three-quarter view" />

// Bad — too vague
<img src="/car.jpg" alt="car" />

// Bad — redundant with surrounding text
<img src="/car.jpg" alt="image of a car" />  {/* "image of" is redundant */}
```

### Decorative Images

Purely visual — use empty alt:

```tsx
// Correct — empty alt tells screen reader to skip
<img src="/divider.svg" alt="" />

// Also correct — aria-hidden for non-img decorative elements
<div className="bg-gradient" aria-hidden="true" />

// Alternative — use CSS background image for purely decorative
<div className="bg-[url('/pattern.svg')]" />
```

### Functional Images (Icons in Buttons)

Describe the **action**, not the icon:

```tsx
// Correct — describes the action
<button>
  <img src="/search.svg" alt="Search" />
</button>

// Better — use aria-label on button, hide icon
<button aria-label="Search">
  <Search className="size-4" aria-hidden="true" />
</button>

// Icon + text — icon is decorative
<button>
  <Download className="size-4" aria-hidden="true" />
  <span>Download PDF</span>
</button>
```

### Complex Images (Charts, Graphs)

Provide both brief alt and detailed description:

```tsx
<figure>
  <img
    src="/sales-chart.png"
    alt="Bar chart showing monthly sales increasing 40% from January to June 2024"
    aria-describedby="chart-description"
  />
  <figcaption id="chart-description">
    Monthly sales grew steadily from $50K in January to $70K in June,
    with the largest jump (15%) occurring between April and May.
  </figcaption>
</figure>
```

### Images of Text

Avoid using images for text. If unavoidable:

```tsx
// AVOID — use real text instead
<img src="/welcome-banner.png" alt="Welcome to Carzilly" />

// PREFER — real text with styling
<h1 className="font-bold text-4xl">Welcome to Carzilly</h1>
```

## Alt Text Writing Guidelines

| Do | Don't |
|----|-------|
| Be concise (under 125 characters) | Start with "image of" or "picture of" |
| Describe content relevant to context | Describe every visual detail |
| Use empty `alt=""` for decoration | Omit the `alt` attribute entirely |
| Describe the action for functional images | Describe the icon shape |
| Include text that appears in the image | Repeat surrounding caption text |
| Consider the surrounding context | Be redundant with adjacent text |

## SVG Accessibility

```tsx
// Inline SVG — decorative
<svg aria-hidden="true" focusable="false">
  <path d="..." />
</svg>

// Inline SVG — informative
<svg role="img" aria-label="Company logo">
  <title>Carzilly Logo</title>
  <path d="..." />
</svg>

// Inline SVG — complex
<svg role="img" aria-labelledby="svg-title svg-desc">
  <title id="svg-title">Quarterly Revenue</title>
  <desc id="svg-desc">Bar chart showing Q1-Q4 revenue growth of 25%</desc>
  <path d="..." />
</svg>
```

## Video

```tsx
// Video with captions and audio description
<video controls>
  <source src="/demo.mp4" type="video/mp4" />
  <track kind="captions" src="/captions-en.vtt" srcLang="en" label="English" default />
  <track kind="descriptions" src="/descriptions-en.vtt" srcLang="en" label="English Audio Description" />
  Your browser does not support the video element.
</video>
```

### Requirements

| Content Type | AA Requirement | AAA Requirement |
|---|---|---|
| Pre-recorded video + audio | Captions + audio description (or full text alt) | Captions + audio description + sign language |
| Pre-recorded audio only | Transcript | Transcript |
| Pre-recorded video only (no audio) | Text alternative or audio track | Audio description |
| Live video + audio | Captions | Captions + sign language |
| Live audio only | Transcript (if feasible) | Transcript |

## Audio

```tsx
// Audio with transcript link
<div>
  <audio controls>
    <source src="/podcast.mp3" type="audio/mpeg" />
  </audio>
  <a href="/podcast-transcript.html">Read transcript</a>
</div>
```

## Background Images

Background images are invisible to screen readers:

```tsx
// If decorative — no action needed
<div className="bg-[url('/hero-pattern.svg')]">
  <h1>Welcome</h1>
</div>

// If informative — provide alt via sr-only text
<div className="bg-[url('/team-photo.jpg')]">
  <span className="sr-only">Team members collaborating in the office</span>
  <h2>Meet Our Team</h2>
</div>
```

## Next.js Image Component

```tsx
import Image from 'next/image'

// Informative image
<Image
  src="/car.jpg"
  alt="2024 BMW M4 in Alpine White"
  width={800}
  height={600}
/>

// Decorative image
<Image
  src="/pattern.svg"
  alt=""
  width={200}
  height={200}
  aria-hidden="true"
/>

// Priority image (LCP) — accessibility + performance
<Image
  src="/hero.jpg"
  alt="Featured vehicle of the week"
  priority
  fill
  className="object-cover"
/>
```
