# File Uploads

> OWASP API4:2023 (Unrestricted Resource Consumption), A06:2025 (Insecure Design, CWE-434 Unrestricted Upload of File with Dangerous Type)

An upload puts attacker bytes on your disk and, later, in your users' browsers. Check the size before you read it all, the type from the bytes, and serve it from somewhere that cannot run script as your app.

## Contents

- [The Rules](#the-rules)
- [Size Caps at Every Layer](#size-caps-at-every-layer)
- [Type From the Bytes, Not the Name](#type-from-the-bytes-not-the-name)
- [Saving: Random Names and a Scan Hook](#saving-random-names-and-a-scan-hook)
- [Serving: Separate Origin, Download by Default](#serving-separate-origin-download-by-default)
- [Audit Patterns](#audit-patterns)
- [Sources](#sources)

## The Rules

| Check | Where | Why |
|-------|-------|-----|
| Size cap | `bodySizeLimit`, the handler's byte count, `file.size` | Fills disk, memory and bills (API4) |
| Type from magic bytes, against an allowlist | Before saving | Extension and `Content-Type` are the client's claim |
| Random storage name | Before saving | A user name can carry `../`, a null byte, or `.html` |
| Scan, or rebuild | Before the file is readable | Malware and active content inside allowed types |
| Separate origin, `nosniff`, `attachment` | When serving | Uploaded HTML or SVG runs script as your site |
| Auth, rate limit, CSRF check | On the upload call | Only the right users upload, at a sane rate |

## Size Caps at Every Layer

A Server Action body is capped at 1 MB by default. The cap counts the raw request, multipart boundaries and part headers included, so leave some room above your real file limit.

```tsx
// next.config.ts
const config: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '6mb', // 5 MB file plus multipart overhead
    },
  },
}
```

`bodySizeLimit` does not apply to Route Handlers. `request.formData()` reads the whole body into memory first, and `Content-Length` can be absent or wrong. Count bytes as they arrive and stop at the cap.

```tsx
// FAIL: buffers any size, then checks
export async function POST(request: Request) {
  const form = await request.formData() // 2 GB request, 2 GB of memory
  const file = form.get('file')
  if (file instanceof File && file.size > MAX_UPLOAD_BYTES) { /* too late */ }
}

// PASS: lib/read-capped.ts
import 'server-only'

export async function readCappedForm(request: Request, limit: number): Promise<FormData | null> {
  if (!request.body) return null
  const reader = request.body.getReader()
  const chunks: BlobPart[] = []
  let total = 0

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > limit) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }

  // Re-parse the capped bytes with the original multipart boundary.
  const contentType = request.headers.get('content-type') ?? ''
  return new Response(new Blob(chunks), { headers: { 'content-type': contentType } }).formData()
}
```

Then check `file.size` per file, and cap the number of files per request. Rate limit uploads per user with `uploadLimiter` from [Rate Limiting](rate-limiting.md). A presigned direct-to-storage upload needs its own size condition in the signature, set by your storage provider's API.

## Type From the Bytes, Not the Name

`file.type` and `file.name` come from the browser, and an attacker sets both. Read the first bytes and match them against a short allowlist. OWASP says a signature check should not be used alone, so it sits beside the size cap, the random name, the scan and the serving headers.

```tsx
// lib/uploads.ts
import 'server-only'

export type FileKind = {
  mime: string
  ext: string
  inline: boolean // only raster images may render in the page
  matches: (head: Uint8Array) => boolean
}

const hasBytes = (head: Uint8Array, sig: readonly number[], offset = 0) =>
  sig.every((byte, i) => head[offset + i] === byte)

export const IMAGE_TYPES: readonly FileKind[] = [
  { mime: 'image/jpeg', ext: 'jpg', inline: true, matches: (h) => hasBytes(h, [0xff, 0xd8, 0xff]) },
  {
    mime: 'image/png',
    ext: 'png',
    inline: true,
    matches: (h) => hasBytes(h, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  },
  {
    mime: 'image/webp',
    ext: 'webp',
    inline: true,
    // "RIFF", four size bytes, then "WEBP"
    matches: (h) => hasBytes(h, [0x52, 0x49, 0x46, 0x46]) && hasBytes(h, [0x57, 0x45, 0x42, 0x50], 8),
  },
]

export const DOCUMENT_TYPES: readonly FileKind[] = [
  // "%PDF-". Served as a download, never inline.
  { mime: 'application/pdf', ext: 'pdf', inline: false, matches: (h) => hasBytes(h, [0x25, 0x50, 0x44, 0x46, 0x2d]) },
]

export async function detectType(file: Blob, allowed: readonly FileKind[]): Promise<FileKind | null> {
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  return allowed.find((kind) => kind.matches(head)) ?? null
}
```

```tsx
// FAIL: trusts the client's labels
if (file.type.startsWith('image/') || file.name.endsWith('.png')) await save(file)

// FAIL: SVG is in the image allowlist
const ALLOWED = ['image/png', 'image/svg+xml'] // SVG can carry <script>
```

SVG and HTML are not on any allowlist here. An SVG document can run script, so an uploaded SVG served inline is stored XSS. If you need SVG, rasterise it on the server or serve it only as a download. For images, decoding and re-encoding to a fixed format also strips metadata. OWASP notes this does not guarantee every hidden payload is gone.

## Saving: Random Names and a Scan Hook

```tsx
// lib/uploads.ts (continued)
import { randomUUID } from 'node:crypto'
import { scanFile } from '@/lib/scanner' // your Scanner, below
import { storage } from '@/lib/storage' // your storage client

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

export class UploadError extends Error {}

export type ScanResult = 'clean' | 'infected' | 'error'

// Your antivirus, sandbox, or CDR service. Fail closed: only 'clean' is stored.
export type Scanner = (bytes: Uint8Array, mime: string) => Promise<ScanResult>

export async function saveUpload(file: File, allowed: readonly FileKind[], scan: Scanner = scanFile) {
  if (file.size === 0 || file.size > MAX_UPLOAD_BYTES) throw new UploadError('File is empty or too large')

  const kind = await detectType(file, allowed)
  if (!kind) throw new UploadError('File type not allowed')

  const bytes = new Uint8Array(await file.arrayBuffer())
  if ((await scan(bytes, kind.mime)) !== 'clean') throw new UploadError('File rejected')

  // The key never contains the user's filename. The extension comes from the bytes.
  const key = `${randomUUID()}.${kind.ext}`
  await storage.put(key, bytes, { contentType: kind.mime })

  return {
    key,
    contentType: kind.mime,
    inline: kind.inline,
    originalName: file.name.slice(0, 255), // display only, never a path
  }
}
```

```tsx
// app/settings/actions.ts
'use server'
import { getCurrentUser } from '@/data/auth'
import { uploadLimiter } from '@/lib/rate-limit'
import { IMAGE_TYPES, UploadError, saveUpload } from '@/lib/uploads'

export async function uploadAvatar(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const { success } = await uploadLimiter.limit(`upload:${user.id}`)
  if (!success) return { error: 'Too many uploads. Try again later.' }

  const file = formData.get('avatar')
  if (!(file instanceof File)) return { error: 'No file provided' }

  try {
    const saved = await saveUpload(file, IMAGE_TYPES)
    await db.update(users).set({ avatarKey: saved.key }).where(eq(users.id, user.id))
    return { ok: true }
  } catch (error) {
    if (error instanceof UploadError) return { error: error.message }
    throw error
  }
}
```

A Route Handler doing the same work also calls `isTrustedRequest` from [Security Headers](security-headers.md#route-handlers-not-built-in) first. OWASP lists CSRF protection for the upload itself. Store files outside anything the web server serves directly, with the least file permissions the app needs.

## Serving: Separate Origin, Download by Default

Serve user files from a different registrable domain, for example `example-usercontent.com` for an app on `example.com`. Script inside a file that slips through then runs on that domain. It cannot read your app's cookies or call your API as the user.

Every file response carries these headers:

| Header | Value | Why |
|--------|-------|-----|
| `Content-Type` | The type detected at upload | Never the type the client sent |
| `X-Content-Type-Options` | `nosniff` | The browser uses the stated type and does not guess HTML |
| `Content-Disposition` | `attachment; filename*=UTF-8''<encoded name>` | Downloads instead of rendering. Use `inline` only for the raster image types |

```tsx
// app/files/[id]/route.ts on the main app: check ownership, then hand out a short link
import { getFileForCurrentUser } from '@/data/files'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const file = await getFileForCurrentUser(id) // DAL: maps the ID to a key, checks the owner
  if (!file) return Response.json({ error: 'Not found' }, { status: 404 })

  const disposition = file.inline
    ? 'inline'
    : `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName)}`

  // Your storage SDK's presign call, on the separate file domain.
  const url = await storage.signedUrl(file.key, {
    expiresInSeconds: 60,
    responseHeaders: {
      'Content-Type': file.contentType,
      'Content-Disposition': disposition,
      'X-Content-Type-Options': 'nosniff',
    },
  })
  return Response.redirect(url, 302)
}
```

Look up files by an ID you issued, never by a path the client sends. Path checks for anything that must read from disk are in [Input Validation](input-validation.md#path-traversal-prevention).

## Audit Patterns

```bash
# Uploads checked by client-supplied type or name
grep -rn "file\.type\|\.name\.endsWith\|\.name\.split" --include="*.ts" --include="*.tsx" | grep -v node_modules

# Storage keys built from the user's filename
grep -rn "file\.name" --include="*.ts" -A3 | grep -i "put\|upload\|writeFile\|key"

# SVG or HTML on an allowlist
grep -rn "image/svg+xml\|text/html" --include="*.ts" | grep -v node_modules

# Route Handlers reading the whole body with no cap
grep -rln "request.formData()\|request.arrayBuffer()" --include="route.ts" | xargs grep -L "readCapped\|limit"

# File responses without nosniff or Content-Disposition
grep -rn "new Response(" --include="route.ts" | grep -v "nosniff\|Content-Disposition"
```

## Sources

- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [OWASP API4:2023 Unrestricted Resource Consumption](https://api-security.owasp.org/editions/2023/en/0xa4-unrestricted-resource-consumption/)
- [OWASP A06:2025 Insecure Design](https://top10.owasp.org/2025/A06_2025-Insecure_Design/)
- [Next.js `serverActions.bodySizeLimit`](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions#bodysizelimit)
- [MDN Content-Disposition](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Disposition)
- [MDN X-Content-Type-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Content-Type-Options)
- [MDN SVG `<script>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/script)
