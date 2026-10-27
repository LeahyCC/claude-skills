# Components

How to design component APIs in a Tailwind system: variants, the `className` escape hatch, merging, state styling, primitives, and the accessibility each component must carry. The [wcag-accessibility](../../wcag-accessibility/SKILL.md) skill owns the criteria. This file owns how a component library meets them once, so apps do not have to.

Contents:

- [The anatomy of a system component](#the-anatomy-of-a-system-component)
- [Variants](#variants)
- [Merging classes](#merging-classes)
- [The className contract](#the-classname-contract)
- [Style state from attributes](#style-state-from-attributes)
- [Primitives and polymorphism](#primitives-and-polymorphism)
- [Accessibility each component owns](#accessibility-each-component-owns)
- [Compound components and slots](#compound-components-and-slots)

## The anatomy of a system component

```tsx
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@acme/ui/lib/cn"

const buttonVariants = cva(
  "inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg px-4 type-label whitespace-nowrap transition-colors focus-visible:focus-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        sm: "h-7 px-3",
        default: "h-9 px-4",
        lg: "h-10 px-6",
        icon: "size-9 px-0",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
)

type ButtonProps = React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>

function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return (
    <button
      data-slot="button"
      data-variant={variant ?? "primary"}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Button, buttonVariants }
```

| Part | Why |
| --- | --- |
| Only semantic classes (`bg-primary`, `border-input`) | Themes, brands and dark mode work with no change here |
| Variants as a typed prop | Apps pick from a list instead of writing classes |
| `cn(variants, className)`, `className` last | The app can adjust layout, and its class wins a conflict |
| `data-slot`, `data-variant` | Parents and tests can target the part without a class: `in-data-[slot=card]:` |
| `type="button"` default | A button inside a form does not submit by accident |
| `React.ComponentProps<"button">`, no `forwardRef` | React 19 passes `ref` as a prop. shadcn removed `forwardRef` for the same reason. |
| Exporting `buttonVariants` | A link styled as a button uses the classes on a real `<a>`, keeping link semantics |

## Variants

| Library | Version checked | Pick it when |
| --- | --- | --- |
| `class-variance-authority` (`cva`) | 0.7.1 | The default. shadcn and most registries use it. It does not merge classes, so wrap the output in `cn`. |
| `tailwind-variants` (`tv`) | 3.3.1 | Multi-part components. `slots` give one variant call per part, and merging is built in. `tailwind-merge` is an optional peer, so install it. |
| `cva@beta` | 1.0.0-beta.12 | Not yet. Its README: "not covered by semver". Its `cva/tools` `getSchema()` can feed variant options into Storybook controls, which is worth watching. |

Rules that keep variants maintainable:

| Rule | Why |
| --- | --- |
| Name variants by intent (`primary`, `destructive`), not look (`blue`, `filled`) | The look changes with the brand. The intent does not. |
| One axis per prop (`variant`, `size`, `tone`) | Two axes in one prop (`primary-large`) multiply into a combinatorial list |
| `compoundVariants` for the cells that differ | Instead of a third prop for one combination |
| Every class string complete | Tailwind finds classes as text. `bg-${tone}` is never generated. |
| No `dark:` in variants | The theme swaps colour values. A `dark:` class means a token is missing. |
| No `className` prop that replaces the base | Consumers adjust, they do not rebuild |

```tsx
const alertVariants = cva("relative grid gap-1 rounded-lg border p-4 type-body", {
  variants: {
    tone: {
      info: "border-transparent bg-info text-info-foreground",
      success: "border-transparent bg-success text-success-foreground",
      warning: "border-transparent bg-warning text-warning-foreground",
      danger: "border-transparent bg-destructive text-destructive-foreground",
    },
    emphasis: { subtle: "", strong: "font-medium" },
  },
  compoundVariants: [{ tone: "danger", emphasis: "strong", className: "ring-2 ring-ring" }],
  defaultVariants: { tone: "info", emphasis: "subtle" },
})
```

## Merging classes

`cn` joins conditional classes (the `clsx` job) and removes conflicts so the last one wins (the `tailwind-merge` job). Without merging, `cn("px-4", "px-8")` leaves both, and which applies depends on CSS order, not on the order you wrote them.

| Option | Version checked | Notes |
| --- | --- | --- |
| `tailwind-merge` 3 with `clsx` | 3.7.0 | Supports Tailwind 4.0 to 4.3. Version 2 is for Tailwind 3. |
| `cn` package | 0.5.0 | shadcn's default since September 2026. Same output as tailwind-merge, same config shape through `cn/config`. Still before 1.0. |

Neither reads your `@theme`. Colours work without configuration because the colour check accepts any name. Every other custom key must be registered, or merging goes wrong in silence. With `--text-heading` defined in the theme but not registered:

```ts
cn("text-heading text-muted-foreground") // "text-muted-foreground": the size is gone
```

Register custom keys once, in the system package, and export the configured function:

```ts
// packages/ui/src/lib/cn.ts
import { extendTailwindMerge } from "tailwind-merge"
import { clsx, type ClassValue } from "clsx"

// Generated from the same token source as theme.css, so the two cannot drift.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["heading"],
      radius: ["control"],
    },
    classGroups: {
      "type-style": ["type-heading", "type-body", "type-label"],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

With the `cn` package the same object goes to `createCn` from `cn/config`. Verified on tailwind-merge 3.7.0 and cn 0.5.0: with `text: ["heading"]` registered, `cn("text-heading text-muted-foreground")` keeps both.

| Key in `@theme` | Register under |
| --- | --- |
| `--text-*` | `theme.text` |
| `--radius-*`, `--shadow-*`, `--font-*`, `--font-weight-*` | `theme.radius`, `theme.shadow`, `theme.font`, `theme.font-weight` |
| `--breakpoint-*`, `--container-*` | `theme.breakpoint`, `theme.container` |
| `--spacing-*` named keys | `theme.spacing` |
| `--color-*` | Nothing |
| A new `@utility` that conflicts with an existing group | `classGroups`, and `conflictingClassGroups` if needed |
| `prefix(ui)` on the Tailwind import | `prefix: "ui"` |

## The className contract

`className` is how an app adjusts a component. It is also how a system loses control of its look. Decide what it is for, and write it down.

| Allowed through `className` | Not through `className` |
| --- | --- |
| Layout around the component: `mt-4`, `w-full`, `col-span-2`, `self-end` | Colour, type, radius: these are variants |
| Responsive placement: `hidden md:flex` | Overriding internal parts: use a slot prop or compose |
| One-off width in a known layout | A new look that two apps need. That is a variant request. |

Tailwind's docs give the same advice: in component libraries, expose "specific props for styling customizations instead of letting consumers add extra classes from outside of a component, since those styles will often conflict."

Enforce it with the restricted-classes lint rule scoped to app code (see [enforcement.md](./enforcement.md)), not by removing `className`. Removing it pushes teams to wrap components in extra `div`s, which is worse.

## Style state from attributes

Style what the component is, not what the code thinks it is. ARIA and data attributes are the state, so the style cannot disagree with what a screen reader hears.

```tsx
// PASS: one source of truth for state
<button
  aria-pressed={pressed}
  className="rounded-md px-3 py-1.5 aria-pressed:bg-accent aria-pressed:text-accent-foreground"
/>
```

<!-- classes: skip, FAIL sample on purpose -->
```tsx
// FAIL: the visual state and the announced state can drift apart
<button className={pressed ? "bg-accent px-3" : "px-3"} />
```

| Attribute | Variant | Typical use |
| --- | --- | --- |
| `aria-invalid` | `aria-invalid:border-destructive` | Form fields with errors |
| `aria-expanded` | `aria-expanded:bg-accent` | Triggers for menus and disclosures |
| `aria-selected`, `aria-current` | `aria-selected:`, `aria-[current=page]:` | Tabs, nav items |
| `disabled`, `inert` | `disabled:`, `inert:` | Unavailable controls and regions |
| `data-state="open"` (Radix), `data-open` (Base UI) | `data-open:` from the starter theme | Menus, dialogs, accordions |
| `data-slot="button"` on a parent | `in-data-[slot=button-group]:rounded-none` | A part styled by where it sits |

`in-*` (Tailwind 4) styles an element by an ancestor's state without adding `group` to the ancestor. Use named groups (`group/card`, `group-hover/card:`) when nested groups would otherwise match the wrong ancestor.

## Primitives and polymorphism

Do not build keyboard and focus behaviour for menus, dialogs, comboboxes and tabs by hand. A primitive library has already handled focus trapping, typeahead, `aria-*` wiring, and the WAI-ARIA patterns.

| Library | Polymorphism | Notes |
| --- | --- | --- |
| Base UI (`@base-ui/react`) | `render` prop: `<Trigger render={<Button />} />` | shadcn's default base since July 2026 |
| Radix (`radix-ui`) | `asChild` with `Slot.Root` | Still supported by shadcn. One unified package since February 2026. |
| React Aria (`react-aria-components`) | Render props and its own composition | shadcn's third base since July 2026. The deepest accessibility and i18n coverage. |

Pick one per system. Write variants against the attributes it sets, and add a custom variant that also matches the others (the `data-open` variant in the starter theme), so a later switch does not touch every class.

A link that looks like a button must stay a link. shadcn's Button docs: "Do not use `<Button render={<a />} nativeButton={false} />` for links. The Base UI `Button` component always applies `role="button"`". Use the exported classes:

```tsx
// PASS: a real link with button styling, link semantics kept
<a href="/billing" className={buttonVariants({ variant: "outline" })}>
  Billing
</a>
```

## Accessibility each component owns

A system fixes accessibility once, in the component, or every app fixes it separately and some do not.

| Component concern | What the component does | Criterion |
| --- | --- | --- |
| Focus visible | `focus-visible:` ring at full strength, offset from the edge, 3:1 against the page | 2.4.7, 1.4.11 |
| Focus not hidden | Sticky headers get `scroll-padding-top` in the base layer, dialogs return focus to the trigger | 2.4.11 |
| Target size | Interactive targets at least 24 by 24 CSS pixels. The `sm` size included. | 2.5.8 |
| Name, role, value | Icon-only buttons require a label prop (`aria-label` typed as required when there is no text child) | 4.1.2 |
| Errors | Fields wire `aria-invalid` and `aria-describedby` to the message id | 3.3.1 |
| Motion | Respects reduced motion through the base layer or `motion-safe:` | 2.3.3 (AAA), 2.2.2 |
| Colour alone | States change more than colour: an icon, a weight, an underline | 1.4.1 |
| Text spacing | No fixed heights on text containers, so 1.4.12 spacing overrides do not clip | 1.4.12 |

The keyboard behaviour for each widget is in the WCAG skill's [keyboard navigation](../../wcag-accessibility/resources/keyboard-navigation.md) resource, forms in [forms and inputs](../../wcag-accessibility/resources/forms-and-inputs.md), and automated checks in [testing and auditing](../../wcag-accessibility/resources/testing-and-auditing.md).

Make the requirement part of the type where you can:

```tsx
type IconButtonProps = Omit<React.ComponentProps<"button">, "children"> & {
  icon: React.ReactNode
  "aria-label": string // required: an icon alone has no accessible name
}

function IconButton({ icon, className, ...props }: IconButtonProps) {
  return (
    <button type="button" className={cn(buttonVariants({ variant: "ghost", size: "icon" }), className)} {...props}>
      {icon}
    </button>
  )
}
```

## Compound components and slots

Multi-part components (card, dialog, field) expose each part as its own component, each with a `data-slot`. Apps compose the parts they need instead of passing a dozen props.

```tsx
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card" className={cn("flex flex-col gap-4 rounded-xl border bg-card p-6 text-card-foreground shadow-sm", className)} {...props} />
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 data-slot="card-title" className={cn("type-heading", className)} {...props} />
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="card-description" className={cn("type-body text-muted-foreground", className)} {...props} />
}
```

When the parts share variants, `tailwind-variants` slots keep them in one definition, and each slot function merges a per-call class:

```ts
import { tv } from "tailwind-variants"

const field = tv({
  slots: {
    root: "grid gap-1.5",
    label: "type-label text-foreground",
    control: "h-9 rounded-md border border-input bg-background px-3 type-body",
    message: "text-sm text-muted-foreground",
  },
  variants: {
    invalid: {
      true: { control: "border-destructive", message: "text-destructive" },
    },
  },
})

const { root, label, control, message } = field({ invalid: true })
control({ class: "w-64" }) // merged with the slot's own classes
```

shadcn publishes a composition tree on every component page. Its changelog gives the reason: coding agents "compose elements more reliably when they can see the full structure". Document your compound components the same way.
