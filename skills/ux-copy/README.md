# UX Copy

Production-ready UX copy patterns for React and Next.js applications — buttons, errors, empty states, onboarding, confirmations, notifications, and voice/tone calibration. Works for greenfield projects (establishing voice from scratch) and mature codebases (auditing and refactoring existing copy). 8 resource files covering every UI text pattern.

## Install

```bash
npx skills add LeahyCC/claude-skills@ux-copy
```

## What It Does

Auto-triggers when you edit component files (`.tsx`, `.jsx`) or content/i18n files (`.ts`, `.json`). Provides decision matrices, FAIL/PASS JSX examples, and copy templates for every common UI text pattern.

**Two modes:**
- **Greenfield** — voice definition worksheet, copy templates, architecture setup
- **Mature codebase** — grep patterns for finding problems, audit workflow, systematic refactoring

## Coverage

| Resource | Topics | Key Patterns |
| --- | --- | --- |
| [voice-and-tone.md](./resources/voice-and-tone.md) | Voice worksheet, tone spectrum, inference, 4 voice profiles | Define voice in 4 dimensions, modulate tone by context |
| [microcopy.md](./resources/microcopy.md) | Buttons, labels, placeholders, tooltips, toggles, selects | Verb-first buttons, sentence case, format-hint placeholders |
| [errors-and-validation.md](./resources/errors-and-validation.md) | 3 error categories, inline validation timing, banned words | What happened + why + what to do, validate on blur then on change |
| [empty-and-loading.md](./resources/empty-and-loading.md) | 5 empty state types, loading copy, progress indicators | Copy formula per empty state type, specific loading text |
| [onboarding-and-ctas.md](./resources/onboarding-and-ctas.md) | CTAs, sign-up flows, progressive disclosure, feature discovery | Destination-match rule, risk-reducing supporting text |
| [confirmation-and-danger.md](./resources/confirmation-and-danger.md) | 3-tier escalation ladder, destructive dialogs, undo patterns | Name the action in buttons, never Yes/No/OK |
| [notifications-and-status.md](./resources/notifications-and-status.md) | Toast vs banner vs inline vs modal, severity matrix | Auto-dismiss rules, tone by severity, actionable notifications |
| [auditing-and-refactoring.md](./resources/auditing-and-refactoring.md) | Copy inventory, grep patterns, 3 C's test, prioritization | Systematic audit workflow, fix by category not by file |

## Verified Against

Composite of 6 authoritative sources (cross-referenced for consensus):

- [Nielsen Norman Group](https://www.nngroup.com/topic/writing-web/) — UX writing research, 3 C's framework, error message guidelines
- [GOV.UK Content Design](https://www.gov.uk/guidance/content-design/writing-for-gov-uk) — Plain English rules, reading level targets
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/writing) — Voice/tone, component-level copy
- [Microsoft Writing Style Guide](https://learn.microsoft.com/en-us/style-guide/welcome/) — Brand voice, top 10 tips
- [Shopify Polaris](https://polaris.shopify.com/content/voice-and-tone) — Error message anatomy, actionable language
- [Atlassian Design System](https://atlassian.design/foundations/content/voice-tone) — Message design, severity types

Last verified: March 2026

## License

[MIT](../../LICENSE)
