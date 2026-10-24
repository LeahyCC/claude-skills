# Cut and sound

Cut first, polish second. A polished section that should not exist is still waste.

## The cut ladder, worked

Ask in order. Stop at the first yes.

| Rung | Question | In practice |
| --- | --- | --- |
| 1 | Need to exist? | A "History of the project" section in a README nobody asked for. Cut. |
| 2 | Said elsewhere? | Install steps repeated in README, guide, and wiki. Keep one, link twice. |
| 3 | Picture says it? | Six lines on how requests flow. One flow diagram replaces all six. |
| 4 | Example says it? | A paragraph explaining a config flag, or the flag set in a working example with one comment. Pick the example. |
| 5 | One line? | A section with a heading and two sentences. Fold it into the line above it. |
| 6 | Write it short | What is left earns its place. Write only that. |

Before, 5 sections:

```
Overview / Architecture / Getting started / Usage / Advanced usage
```

After the ladder, 3:

```
What it is + picture / Run it (example first) / Limits
```

Advanced usage moved to layer 5 and linked. Architecture became the picture. Overview became two lines.

## The sound list, before and after

### Inflated importance

> Before: Authentication plays a crucial role in modern web applications, serving as a cornerstone of security in today's landscape.
> After: Authentication checks who a user is before letting them in.

### AI words

> Before: Leverage our seamless, robust caching layer to streamline your workflow and unlock powerful performance gains.
> After: Turn on caching to make repeat loads faster. One line in config: `cache: true`.

### Not X but Y

> Before: This is not just a linter. It is a complete quality platform for your team.
> After: This linter checks your code against the rules in `.lintrc` and reports what it finds.

### Staged run up

> Before: In this section, we will dive deep into how to configure the database connection settings.
> After: (heading: Database) Set `DATABASE_URL` in `.env`. The app reads it on start.

### One line closers

> Before: ...and the task runs every night at 02:00. And that is the real power of scheduling.
> After: ...and the task runs every night at 02:00.

### Sales talk

> Before: Our cutting edge search delivers lightning fast results across your entire knowledge base.
> After: Search covers titles and body text. On the test set of 10,000 pages, most queries came back in under 200 ms.

Keep the number only if a source gives it. No source, no number: "Search covers titles and body text."

### Borrowed authority

> Before: Industry experts widely recommend enabling retries for production workloads.
> After: Enable retries in production. The provider drops about 1 in 1,000 requests under load, per [their status page](link).

No link you can name? Cut the claim or state it as the project's own choice: "We enable retries in production."

### Bold as decoration, forced threes

> Before: The platform offers **speed**, **reliability**, and **scalability** for **modern teams**.
> After: The platform caches pages, so repeat visits load from the cache.

Bold is for the one thing the eye must land on: a value to change, a name to match. Not for adjectives.

### Writing about the doc

> Before (under heading "Errors"): This section covers the errors you may encounter while using the API.
> After: (heading "Errors") The API returns these errors. Each one lists what to do next.

### Re-explaining

> Before: ...step 4, step 5. In summary, you have now installed the tool, set the key, and run your first job.
> After: ...step 4, step 5.

The reader just did it. A summary earns its place only when a section is long enough to get lost in, which is itself a sign to trim.

### Plain verbs

> Before: The config file serves as the central place that features all available settings.
> After: The config file holds all the settings.

## Weak alone

One of these is taste. A page full of them is a tell.

| Tell | Fix |
| --- | --- |
| Em dash as every join | Use a period or a comma. Keep dashes where a sample of the project's own writing uses them |
| Stacked qualifiers: "could potentially possibly fail" | One qualifier, the one the facts support: "can fail" |
| Hyphen pairs everywhere: "a high-quality, production-ready, battle-tested tool" | Keep the hyphen before a noun ("well tested tool" -> "well-tested tool"), cut the pile up |
| Passive with no actor: "the file is created" | Name who does it when it matters: "the installer creates the file" |
