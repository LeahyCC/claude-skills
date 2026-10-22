# Server and Client Components

## Choose a boundary

Pages/layouts are Server Components by default in App Router. `'use client'` marks a module graph boundary: its imports become client dependencies. A component without a directive can run in either graph depending on where it is imported. Client Components can render static markup too, and are normally prerendered to HTML on first load before hydration.

Keep DB clients, private environment variables and privileged code in server modules. Use `import 'server-only'` to catch accidental client imports. `NEXT_PUBLIC_*` values are public. A Client Component can still run during server prerender: read `window`/`localStorage` in browser-only event/effect code, not unguarded render code.

| Need | Useful boundary |
| --- | --- |
| Privileged read, large server library, initial data | Server Component or server data module |
| State, events, browser subscription | Client Component at the smallest practical boundary |
| Theme/context | Client provider around consumers; server content can be children |
| Form without client state | Server-rendered form with an authorized Server Action |

## Compose server content into an interactive shell

Avoid importing server-only work from a client module. Pass server-rendered content through props instead. This preserves server execution; it does not make hidden UI an authorization boundary.

```tsx
// app/dialog.tsx
'use client'
import { useState, type ReactNode } from 'react'

export function Details({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return <section>
    <button onClick={() => setOpen(!open)} aria-expanded={open}>Details</button>
    {open && children}
  </section>
}
```

```tsx
// app/page.tsx
import { Details } from './dialog'

export default function Page() {
  return <Details><p>This content was rendered by the server.</p></Details>
}
```

For a real data view, authenticate/authorize before producing those children. Don't send confidential fields and rely on the client to hide them.

## Serialization and directives

Props crossing the boundary must be supported by React's serialization. Supported values include primitives, arrays/plain objects of supported values, Date, Map/Set, promises, JSX and Server Function references. Arbitrary closures, DB clients and arbitrary class instances do not cross. A Server Function reference is not limited to a form prop; it can be passed to a client and invoked there, subject to its own validation/auth.

`'use server'` marks Server Functions, not Server Components. Do not add it to an ordinary page to make the page server-rendered. Context consumers/providers belong in client code; place providers where their scope is needed rather than enforcing a universal tree depth.

## Check

Inspect client imports and serialized output for secrets and avoidable large dependencies. Verify browser-only code does not break prerender/hydration. Confirm a client boundary is justified before moving it: whole client pages and shells can be legitimate.

Sources: [Next component boundaries](https://nextjs.org/docs/app/getting-started/server-and-client-components), [React use-client, serializable types](https://react.dev/reference/rsc/use-client). Review scope/dates: [source ledger](../SOURCES.md).
