# Web and runtime APIs

Standard library and browser calls whose default behaviour surprises both humans and LLMs. Every item below is specified behaviour in WHATWG, W3C, or ECMA-262, not a browser bug.

## Contents

- [`fetch` and the dev-server `200 text/html` stand-in](#fetch-and-the-dev-server-200-texthtml-stand-in)
- [`fetch` with `FormData`: do not set `Content-Type`](#fetch-with-formdata-do-not-set-content-type)
- [`Object.fromEntries(formData)` drops repeated fields and files](#objectfromentriesformdata-drops-repeated-fields-and-files)
- [`new URL(path, base)` and the leading or trailing slash](#new-urlpath-base-and-the-leading-or-trailing-slash)
- [Safari clipboard writes must start synchronously with a `Promise`](#safari-clipboard-writes-must-start-synchronously-with-a-promise)
- [Workers do not have `window` or `document`](#workers-do-not-have-window-or-document)
- [`new Date('YYYY-MM-DD')` is UTC; other strings are local](#new-dateyyyy-mm-dd-is-utc-other-strings-are-local)
- [`Array.prototype.sort()` mutates and sorts numbers as strings](#arrayprototypesort-mutates-and-sorts-numbers-as-strings)
- [`JSON.stringify` drops `undefined`, turns `NaN` into `null`, and throws on `BigInt`](#jsonstringify-drops-undefined-turns-nan-into-null-and-throws-on-bigint)

## `fetch` and the dev-server `200 text/html` stand-in

First, `fetch()` only rejects on a network error; HTTP 404 and 500 resolve normally with `response.ok === false` ([WHATWG Fetch Standard](https://fetch.spec.whatwg.org/#dom-response-ok)).

Second, even checking `response.ok` is not enough when probing or loading static files (`/stress/stress-50.pdf`, `/models/weights.bin`, `/locales/en.json`) from a single-page app dev server such as Vite, Webpack Dev Server, or Next.js rewrites. When a file under `public/` is missing and the request carries the default `Accept: */*` header, Vite's `htmlFallbackMiddleware` rewrites the request to `/index.html` and responds with `200 OK` and `Content-Type: text/html`. A `HEAD` or `GET` probe that checks only `response.ok` marks the missing file as ready, and the parser later crashes trying to read `<!doctype html>` as a PDF, WASM binary, or JSON document.

Check both `response.ok` and `Content-Type`, or send an explicit `Accept` header that excludes `text/html` and `*/*`.

```ts
// BAD: returns true in Vite dev when /stress/stress-50.pdf does not exist,
// because the SPA fallback serves index.html with status 200.
export async function assetExistsBad(url: string): Promise<boolean> {
  const res = await fetch(url, { method: 'HEAD' })
  return res.ok
}

// GOOD: verify the Content-Type matches the asset you asked for
export function isExpectedAsset(
  ok: boolean,
  contentType: string | null,
  expectedMimeSubstring: string,
): boolean {
  if (!ok || !contentType) return false
  return contentType.toLowerCase().includes(expectedMimeSubstring.toLowerCase())
}

export async function pdfAssetExists(url: string): Promise<boolean> {
  const res = await fetch(url, {
    method: 'HEAD',
    headers: { Accept: 'application/pdf' },
  })
  return isExpectedAsset(res.ok, res.headers.get('content-type'), 'pdf')
}
```

## `fetch` with `FormData`: do not set `Content-Type`

When `body` is a `FormData` instance, the browser generates a random boundary string and sets `Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...` ([WHATWG Fetch body mixin](https://fetch.spec.whatwg.org/#concept-bodyinit-extract)). If you set `headers: { 'Content-Type': 'multipart/form-data' }` yourself, your header overrides the browser's and omits the `boundary` parameter. The server cannot split the parts and rejects the upload.

```ts
// BAD: manual Content-Type strips the multipart boundary parameter
export function uploadAvatarBad(url: string, file: File): Promise<Response> {
  const form = new FormData()
  form.set('avatar', file)
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'multipart/form-data' },
    body: form,
  })
}

// GOOD: let fetch set Content-Type with the generated boundary
export function uploadAvatar(url: string, file: File): Promise<Response> {
  const form = new FormData()
  form.set('avatar', file)
  return fetch(url, {
    method: 'POST',
    body: form,
  })
}
```

## `Object.fromEntries(formData)` drops repeated fields and files

A `<select multiple>` or a group of checkboxes with the same `name` appends multiple entries under one key in `FormData`. `Object.fromEntries(formData)` keeps only the last value for any repeated key, and `JSON.stringify` turns any `File` value into `{}`.

```ts
// BAD: keeps only the last selected tag
export function readTagsBad(form: FormData): string[] {
  const data = Object.fromEntries(form)
  return typeof data.tags === 'string' ? [data.tags] : []
}

// GOOD: read multi-value fields with getAll()
export function readTags(form: FormData): string[] {
  return form.getAll('tags').filter((value): value is string => typeof value === 'string')
}
```

## `new URL(path, base)` and the leading or trailing slash

`new URL(input, base)` follows RFC 3986 relative resolution ([WHATWG URL Standard](https://url.spec.whatwg.org/#concept-basic-url-parser)):

1. If `input` starts with `/`, it replaces the entire path of `base` from the origin root.
2. If `base` does not end with `/`, the last segment of `base` is treated as a file name and dropped.

```ts
// BAD: both of these drop '/v1' and resolve to 'https://api.example.com/users'
export const wrongLeadingSlash = new URL('/users', 'https://api.example.com/v1/')
export const wrongBaseNoSlash = new URL('users', 'https://api.example.com/v1')

// GOOD: relative input (no leading slash) + base ending with '/'
export function apiUrl(basePath: string, relativeEndpoint: string): URL {
  const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`
  const normalizedEndpoint = relativeEndpoint.replace(/^\/+/, '')
  return new URL(normalizedEndpoint, normalizedBase)
}
```

## Safari clipboard writes must start synchronously with a `Promise`

WebKit's user-activation window expires if you `await` an async render or network call *before* calling `navigator.clipboard.write()`, throwing `NotAllowedError` ([Clipboard API and events](https://w3c.github.io/clipboard-apis/#write-content-to-the-clipboard), WebKit bug 222262).

Call `navigator.clipboard.write()` synchronously inside the click handler and pass the `Promise<Blob>` inside `new ClipboardItem({ 'image/png': blobPromise })`. Some older environments reject a Promise inside `ClipboardItem`, so fall back to awaiting the blob or downloading the file.

```ts
// BAD: awaiting renderPng() before clipboard.write loses user activation in Safari
export async function copyPngBad(renderPng: () => Promise<Blob>): Promise<void> {
  const blob = await renderPng()
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
}

// GOOD: start clipboard.write inside the click turn, with the Promise inside ClipboardItem
export async function copyPng(renderPng: () => Promise<Blob>): Promise<void> {
  const pending = renderPng()
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': pending })])
  } catch (err) {
    if (err instanceof DOMException && err.name === 'NotAllowedError') throw err
    // Fallback for browsers whose ClipboardItem only accepts a resolved Blob
    const blob = await pending
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
  }
}
```

## Workers do not have `window` or `document`

Libraries that work on the main thread often read `window.location`, `document.baseURI`, or `document.createElement('canvas')` inside default option builders. Inside a Web Worker (`DedicatedWorkerGlobalScope`), `window` and `document` are `undefined`. Some libraries catch that internally and fall back to slow paths or disable features without warning (for example, `pdfjs-dist` disables `useWorkerFetch` when `document.baseURI` is missing and cannot construct a canvas without `OffscreenCanvas`).

When moving a library into a worker, pass explicit URLs, asset base paths, and `OffscreenCanvas` factories instead of relying on main-thread defaults.

## `new Date('YYYY-MM-DD')` is UTC; other strings are local

In ECMA-262, a date-only ISO string (`"2026-10-23"`) is parsed as **UTC midnight**, while a date-time string without a timezone (`"2026-10-23T00:00:00"`) or slash-separated string is parsed in the **local timezone** ([ECMA-262 Date Time String Format](https://tc39.es/ecma262/#sec-date-time-string-format)). In any timezone west of UTC (such as Americas), `new Date("2026-10-23").toLocaleDateString()` formats as October 22.

```ts
// BAD: parses as 2026-10-23T00:00:00.000Z, which is Oct 22 at 17:00 in UTC-7
export function parseCalendarDateBad(isoDate: string): Date {
  return new Date(isoDate)
}

// GOOD: construct a local calendar date from numeric parts
export function parseCalendarDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number)
  if (!y || !m || !d) throw new RangeError(`Invalid YYYY-MM-DD date: ${isoDate}`)
  return new Date(y, m - 1, d)
}
```

## `Array.prototype.sort()` mutates and sorts numbers as strings

With no compare function, `Array.prototype.sort()` converts every element to a string and orders them by UTF-16 code units (`[10, 2, 1].sort()` is `[1, 10, 2]`), and it mutates the array in place ([MDN Array.prototype.sort](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)). Mutating a React state array or shared prop array in place causes stale renders.

Use `toSorted((a, b) => a - b)` (ES2023) or `[...items].sort((a, b) => a - b)`.

```ts
// BAD: mutates caller's array and sorts [10, 2, 1] into [1, 10, 2]
export function sortScoresBad(scores: number[]): number[] {
  return scores.sort()
}

// GOOD: non-mutating numeric comparator
export function sortScores(scores: readonly number[]): number[] {
  return scores.toSorted((a, b) => a - b)
}
```

## `JSON.stringify` drops `undefined`, turns `NaN` into `null`, and throws on `BigInt`

Per [RFC 8259](https://www.rfc-editor.org/info/rfc8259/) and `JSON.stringify`:

- Object properties whose value is `undefined`, a `Function`, or a `Symbol` are omitted silently (`JSON.stringify({ a: undefined })` is `"{}"`), while `undefined` inside an array becomes `null`.
- `NaN`, `Infinity`, and `-Infinity` serialize as `null`. An unchecked `0 / 0` or `Number("abc")` in a payload arrives at the server as `null`.
- `Map` and `Set` serialize as `"{}"` because they have no enumerable own properties.
- Any `BigInt` throws `TypeError: Do not know how to serialize a BigInt`.
