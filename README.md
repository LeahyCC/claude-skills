<p align="center">
  <h1 align="center">claude-skills</h1>
  <p align="center">
    Production-grade Claude Code skills verified against official specifications.
    <br />
    Zero dependencies. Production code examples. Complete domain coverage.
  </p>
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <a href="https://github.com/LeahyCC/claude-skills/stargazers"><img src="https://img.shields.io/github/stars/LeahyCC/claude-skills?style=flat" alt="Stars" /></a>
  <a href="https://github.com/LeahyCC/claude-skills/network/members"><img src="https://img.shields.io/github/forks/LeahyCC/claude-skills?style=flat" alt="Forks" /></a>
  <a href="https://github.com/LeahyCC/claude-skills/commits/main"><img src="https://img.shields.io/github/last-commit/LeahyCC/claude-skills" alt="Last Commit" /></a>
</p>

---

## Install

```bash
npx skills add LeahyCC/claude-skills@wcag-accessibility
```

That's it. No Python runtime. No shell scripts. No npm packages to install. Pure markdown — works in any Claude Code environment.

---

## Skills

| Skill | What It Does | Coverage | Verified Against |
|-------|-------------|----------|-----------------|
| [wcag-accessibility](./skills/wcag-accessibility/) | WCAG 2.2 Level AA compliance for web apps | **50/50** success criteria | [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) |

> More skills coming — see [Roadmap](#roadmap). Each one will meet the same standard: complete coverage, verified against the official spec, production code examples.

---

## Featured: wcag-accessibility

The most comprehensive WCAG accessibility skill for Claude Code. Covers every Level A and AA success criterion in WCAG 2.2, with production React, Next.js, and Tailwind CSS code examples.

### Why this skill?

Most accessibility guidance covers the obvious stuff — alt text, color contrast, maybe keyboard nav. This skill covers **all 50 criteria**, including the 6 new ones added in WCAG 2.2 that most resources still miss:

| New in WCAG 2.2 | What It Requires |
|-----------------|-----------------|
| Focus Not Obscured (2.4.11) | Focused element not fully hidden by sticky headers/footers |
| Dragging Movements (2.5.7) | Single-pointer alternative for every drag operation |
| Target Size (2.5.8) | 24x24 CSS pixel minimum for interactive targets |
| Consistent Help (3.2.6) | Help mechanisms in same location across pages |
| Redundant Entry (3.3.7) | Don't re-ask for information already provided |
| Accessible Authentication (3.3.8) | No cognitive function tests — allow paste, password managers |

### What it catches

```tsx
// BEFORE — fails WCAG 1.4.3 (contrast ratio ~2.7:1, needs 4.5:1)
<p className="text-muted-foreground/60 text-xs">Helper text</p>

// AFTER — passes WCAG 1.4.3 (contrast ratio ~5.2:1)
<p className="text-muted-foreground text-xs">Helper text</p>
```

```tsx
// BEFORE — fails WCAG 3.3.8 (blocks password managers)
<input type="password" onPaste={(e) => e.preventDefault()} />

// AFTER — passes WCAG 3.3.8 (allows paste + autoComplete)
<input type="password" autoComplete="current-password" />
```

```tsx
// BEFORE — fails WCAG 2.5.7 (drag-only reorder)
<SortableList onDragEnd={handleReorder}>
  {items.map(item => <SortableItem key={item.id} />)}
</SortableList>

// AFTER — passes WCAG 2.5.7 (drag + button alternatives)
{items.map((item, i) => (
  <li key={item.id}>
    {item.name}
    <button onClick={() => moveUp(i)} aria-label={`Move ${item.name} up`}>↑</button>
    <button onClick={() => moveDown(i)} aria-label={`Move ${item.name} down`}>↓</button>
  </li>
))}
```

### Coverage at a glance

11 resource files covering all 4 WCAG principles:

| Resource | Criteria Covered | Key Topics |
|----------|-----------------|------------|
| [Color Contrast](./skills/wcag-accessibility/resources/color-contrast.md) | 1.4.3, 1.4.11 | Ratios, Tailwind opacity pitfalls, dark mode |
| [Keyboard Navigation](./skills/wcag-accessibility/resources/keyboard-navigation.md) | 2.1.1, 2.1.2, 2.4.1, 2.4.3, 2.4.7, 2.4.11 | Focus management, WAI-ARIA patterns, skip links |
| [Semantic HTML](./skills/wcag-accessibility/resources/semantic-html.md) | 1.3.1, 4.1.2 | Landmarks, headings, ARIA roles, live regions |
| [Forms & Inputs](./skills/wcag-accessibility/resources/forms-and-inputs.md) | 1.3.5, 3.3.1, 3.3.2, 3.3.3 | Labels, errors, autocomplete, touch targets |
| [Images & Media](./skills/wcag-accessibility/resources/images-and-media.md) | 1.1.1, 1.2.1–1.2.5, 1.4.5 | Alt text, SVG, captions, transcripts |
| [Motion & Animation](./skills/wcag-accessibility/resources/motion-and-animation.md) | 2.2.2, 2.3.1 | prefers-reduced-motion, flash limits, auto-play |
| [Page Structure](./skills/wcag-accessibility/resources/page-structure.md) | 1.3.2, 1.3.3, 1.3.4, 1.4.4, 1.4.10, 1.4.12, 2.4.2, 3.1.1, 3.1.2 | Language, titles, reflow, zoom, text spacing |
| [Links & Navigation](./skills/wcag-accessibility/resources/links-and-navigation.md) | 1.4.1, 2.4.4, 2.4.5, 2.5.3, 3.2.1–3.2.4, 3.2.6 | Link purpose, predictability, consistent help |
| [Pointer & Touch](./skills/wcag-accessibility/resources/pointer-and-touch.md) | 2.5.1, 2.5.2, 2.5.4, 2.5.7, 2.5.8 | Drag alternatives, gestures, target size |
| [Timing & Auth](./skills/wcag-accessibility/resources/timing-and-authentication.md) | 1.4.2, 2.1.4, 2.2.1, 3.3.4, 3.3.7, 3.3.8 | Timeouts, CAPTCHAs, accessible auth |
| [Testing & Auditing](./skills/wcag-accessibility/resources/testing-and-auditing.md) | — | axe-core, jest-axe, Playwright, Lighthouse, VoiceOver |

Plus: Hover/Focus Content (1.4.13) and Status Messages (4.1.3) covered in the main SKILL.md.

<details>
<summary><strong>Full criteria mapping table (50/50)</strong></summary>

#### Principle 1: Perceivable (20 criteria)
| # | Name | Level | Resource |
|---|------|-------|----------|
| 1.1.1 | Non-text Content | A | images-and-media |
| 1.2.1 | Audio-only/Video-only | A | images-and-media |
| 1.2.2 | Captions (Prerecorded) | A | images-and-media |
| 1.2.3 | Audio Description or Alternative | A | images-and-media |
| 1.2.4 | Captions (Live) | AA | images-and-media |
| 1.2.5 | Audio Description (Prerecorded) | AA | images-and-media |
| 1.3.1 | Info and Relationships | A | semantic-html |
| 1.3.2 | Meaningful Sequence | A | page-structure |
| 1.3.3 | Sensory Characteristics | A | page-structure |
| 1.3.4 | Orientation | AA | page-structure |
| 1.3.5 | Identify Input Purpose | AA | forms-and-inputs |
| 1.4.1 | Use of Color | A | links-and-navigation |
| 1.4.2 | Audio Control | A | timing-and-authentication |
| 1.4.3 | Contrast (Minimum) | AA | color-contrast |
| 1.4.4 | Resize Text | AA | page-structure |
| 1.4.5 | Images of Text | AA | images-and-media |
| 1.4.10 | Reflow | AA | page-structure |
| 1.4.11 | Non-text Contrast | AA | color-contrast |
| 1.4.12 | Text Spacing | AA | page-structure |
| 1.4.13 | Content on Hover or Focus | AA | SKILL.md |

#### Principle 2: Operable (20 criteria)
| # | Name | Level | Resource |
|---|------|-------|----------|
| 2.1.1 | Keyboard | A | keyboard-navigation |
| 2.1.2 | No Keyboard Trap | A | keyboard-navigation |
| 2.1.4 | Character Key Shortcuts | A | timing-and-authentication |
| 2.2.1 | Timing Adjustable | A | timing-and-authentication |
| 2.2.2 | Pause, Stop, Hide | A | motion-and-animation |
| 2.3.1 | Three Flashes | A | motion-and-animation |
| 2.4.1 | Bypass Blocks | A | keyboard-navigation |
| 2.4.2 | Page Titled | A | page-structure |
| 2.4.3 | Focus Order | A | keyboard-navigation |
| 2.4.4 | Link Purpose (In Context) | A | links-and-navigation |
| 2.4.5 | Multiple Ways | AA | links-and-navigation |
| 2.4.6 | Headings and Labels | AA | semantic-html |
| 2.4.7 | Focus Visible | AA | keyboard-navigation |
| 2.4.11 | Focus Not Obscured | AA | keyboard-navigation |
| 2.5.1 | Pointer Gestures | A | pointer-and-touch |
| 2.5.2 | Pointer Cancellation | A | pointer-and-touch |
| 2.5.3 | Label in Name | A | links-and-navigation |
| 2.5.4 | Motion Actuation | A | pointer-and-touch |
| 2.5.7 | Dragging Movements | AA | pointer-and-touch |
| 2.5.8 | Target Size (Minimum) | AA | pointer-and-touch |

#### Principle 3: Understandable (9 criteria)
| # | Name | Level | Resource |
|---|------|-------|----------|
| 3.1.1 | Language of Page | A | page-structure |
| 3.1.2 | Language of Parts | AA | page-structure |
| 3.2.1 | On Focus | A | links-and-navigation |
| 3.2.2 | On Input | A | links-and-navigation |
| 3.2.3 | Consistent Navigation | AA | links-and-navigation |
| 3.2.4 | Consistent Identification | AA | links-and-navigation |
| 3.2.6 | Consistent Help | A | links-and-navigation |
| 3.3.1 | Error Identification | A | forms-and-inputs |
| 3.3.2 | Labels or Instructions | A | forms-and-inputs |
| 3.3.3 | Error Suggestion | AA | forms-and-inputs |
| 3.3.4 | Error Prevention | AA | timing-and-authentication |
| 3.3.7 | Redundant Entry | A | timing-and-authentication |
| 3.3.8 | Accessible Authentication | AA | timing-and-authentication |

#### Principle 4: Robust (1 criterion)
| # | Name | Level | Resource |
|---|------|-------|----------|
| 4.1.2 | Name, Role, Value | A | semantic-html |
| 4.1.3 | Status Messages | AA | SKILL.md |

> 4.1.1 Parsing was removed in WCAG 2.2.

</details>

---

## What's Different

This repo exists because most accessibility skills are surface-level. Here's what we do differently:

**Every claim is verifiable.** The criteria mapping table above links every WCAG success criterion to the resource file that covers it. If we say 50/50, you can audit that in 60 seconds.

**Zero runtime dependencies.** Pure markdown files. No Python scripts, no npm packages, no shell installers. Install in one command, works everywhere Claude Code runs.

**Production code examples.** Real React, Next.js, and Tailwind CSS patterns — not pseudocode. Every resource file includes FAIL and PASS examples side by side with the exact `className` and props you'd use.

**Verified against the source.** Content is verified against the [W3C WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/) (October 2023), including all 6 criteria added in 2.2. We note where 4.1.1 Parsing was removed, because accuracy matters.

---

## Repo Structure

```
claude-skills/
├── skills/
│   └── wcag-accessibility/           # WCAG 2.2 AA — 50/50 criteria
│       ├── SKILL.md                   # Main skill (auto-triggers on .tsx/.jsx)
│       ├── README.md                  # Skill-specific docs
│       └── resources/                 # 11 deep-dive reference files
│           ├── color-contrast.md
│           ├── keyboard-navigation.md
│           ├── semantic-html.md
│           ├── forms-and-inputs.md
│           ├── images-and-media.md
│           ├── motion-and-animation.md
│           ├── page-structure.md
│           ├── links-and-navigation.md
│           ├── pointer-and-touch.md
│           ├── timing-and-authentication.md
│           └── testing-and-auditing.md
├── .claude-plugin/
│   ├── plugin.json                    # Marketplace discovery
│   └── marketplace.json               # Skill registry metadata
├── CONTRIBUTING.md                     # How to add a skill
├── LICENSE                             # MIT
└── README.md                          # You are here
```

---

## Roadmap

We're building a collection of skills where each one is the definitive reference for its domain. Quality over quantity.

| Skill | Status | Spec Source |
|-------|--------|-------------|
| wcag-accessibility | **Shipped** | W3C WCAG 2.2 |
| react-performance | Planned | React docs, Web Vitals |
| api-security | Planned | OWASP Top 10 (2025) |
| typescript-strict | Planned | TypeScript handbook |
| nextjs-app-router | Planned | Next.js docs |

Have an idea? [Open a Discussion](https://github.com/LeahyCC/claude-skills/discussions) or [create an issue](https://github.com/LeahyCC/claude-skills/issues/new).

---

## Contributing

We hold a high quality bar — every skill must be verified against its official specification with complete coverage and production code examples. See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide.

The short version:
1. Open an issue with your skill proposal
2. Get scope approved
3. Write the skill following the structure above
4. Submit a PR — we'll review for completeness and accuracy

---

## License

[MIT](./LICENSE)
