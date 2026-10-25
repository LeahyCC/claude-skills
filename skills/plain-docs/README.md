# Plain Docs

Documentation cut to what the reader needs. Every doc in the same 5 layers: why, picture, substance, edges, detail on demand. Works two ways: write a new doc in that shape, or trim an existing one and get a report of what was cut.

## Install

```bash
npx skills add LeahyCC/claude-skills@plain-docs
```

Or inside Claude Code:

```text
/plugin install plain-docs --marketplace LeahyCC/claude-skills
```

## What it does

**Before:**

> Authentication plays a crucial role in modern web applications, serving as a cornerstone of security. In this section we will dive deep into how our seamless auth layer leverages tokens to streamline access.

**After:**

> Authentication checks who a user is. Set `AUTH_TOKEN` in `.env`. The app reads it on start.

It combines three things:

- A cut ladder (from [Ponytail](https://github.com/dietrichgebert/ponytail)): does the section need to exist, is it said elsewhere, can a picture or an example say it, can it be one line.
- A sound list (from [Humanizer](https://github.com/blader/humanizer)): the AI tells that show up in docs, each with a before and after.
- A fixed page shape, so readers always know where a thing lives on the page.

Never cut: steps the reader must follow, warnings that stop lost work, the one working example. Never added: facts the source did not have.

## Coverage

| Resource | Topics |
| --- | --- |
| [page-shape.md](./resources/page-shape.md) | The 5 layers, what each layer holds for README, guide, API reference, concept page, and ADR, length limits, a skeleton to copy |
| [cut-and-sound.md](./resources/cut-and-sound.md) | Cut ladder worked end to end, sound list before and after pairs |
| [examples.md](./resources/examples.md) | One bloated doc cut from 190 words to 51, with the trim report |

## Verified against

- [Ponytail](https://github.com/dietrichgebert/ponytail): the lazy ladder, cut the solution not the safety
- [Humanizer](https://github.com/blader/humanizer), built on Wikipedia's [Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)
- [GOV.UK content design](https://www.gov.uk/guidance/content-design/writing-for-gov-uk): plain words, front loaded, one idea at a time
- [Diataxis](https://diataxis.fr/): the split between how-to, reference, and explanation behind the by type table

Detail and what was not taken from each: [SOURCES.md](./SOURCES.md)

Last verified: October 2026

## License

[MIT](../../LICENSE)
