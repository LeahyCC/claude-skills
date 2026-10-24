# Functions

A function is readable when a caller can use it without reading it, and a reader can read it without holding the whole thing in their head. Length is the symptom people measure; mixed abstraction and doing-two-things are the disease.

Sources are in [SOURCES.md](../SOURCES.md).

## Contents

- One thing, one level
- Length as a smell, not a law
- Arguments
- Side effects in the open
- Checklist

## One thing, one level

A function does one thing when you can describe it in one sentence without "and". Inside, all statements sit at the same level of abstraction: a function that orchestrates ("load, price, save") should not also contain the byte-level detail of any step ("strip the third comma, parse as float").

FAIL. Orchestration and detail interleaved; the reader must simulate both:

```ts
function checkout(cart) {
  let total = 0
  for (const line of cart.lines) {
    const raw = line.priceText.replace(/[$,]/g, '')
    total += Math.round(parseFloat(raw) * 100) * line.qty
  }
  if (total > 5000) total = Math.round(total * 0.9)
  db.query('INSERT INTO orders ...', [total])
  return total
}
```

PASS. Each level reads on its own; the parsing detail has a name and can be tested alone:

```ts
function checkout(cart) {
  const totalCents = priceCart(cart)
  const chargedCents = applyBulkDiscount(totalCents)
  saveOrder(chargedCents)
  return chargedCents
}
```

The extraction also surfaces two magic values the original hid (`5000`, `0.9`) — see [magic-numbers.md](./magic-numbers.md). Readable structure and named values are usually the same fix.

## Length as a smell, not a law

There is no line count at which a function becomes unreadable, and splitting a coherent 80-line state machine into six fragments can make it worse. Treat these as prompts to look, not verdicts:

- **~40+ lines:** can you name the sections? If a blank-line paragraph inside does one thing, it is a function asking to exist.
- **More than 3 levels of indentation:** the shape is the problem — see [nesting-and-conditionals.md](./nesting-and-conditionals.md).
- **You must scroll to see both the setup and the use of a variable:** extract, or reorder so related lines sit together.

Do not split a function whose parts share many locals just to hit a number; a parameter list of seven values shuttled between fragments is less readable than the original. Extract when the piece has a name and a narrow interface (few inputs, one output).

## Arguments

- **0–2 positional arguments** read fine. At 3+, or whenever any argument is a boolean or two arguments share a type (two strings, two numbers — swappable invisibly), use an options object: `resize(image, { width: 800, format: 'webp' })`. See [magic-strings.md](./magic-strings.md) for flag arguments.
- **No output arguments.** A function that fills in a passed object hides its result; return the value. Mutation of an argument should be the function's named job (`sortInPlace`) or not happen.
- **Flag-free splitting:** if a parameter exists only to switch behaviour, consider two functions with honest names sharing a private helper.

## Side effects in the open

A function named like a question (`isReady`, `totalPrice`) must not change anything. A function named like a command may, and should not also smuggle out a query result the name hides. When a command and a query are fused (`pop`, `advance`), that fusion should be the documented point of the function, not a surprise. This is the function-level version of names that lie, in [naming.md](./naming.md).

## Checklist

- [ ] Each function is describable in one sentence without "and"
- [ ] Statements inside a function sit at one level of abstraction
- [ ] Long functions were examined for nameable sections, not chopped to a line target
- [ ] 3+ arguments, booleans, or same-typed pairs travel in a named options object
- [ ] Questions do not mutate; commands do not hide their results
