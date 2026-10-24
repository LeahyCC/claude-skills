# Tool and Agency

> OWASP LLM03:2026 (Excessive Agency), LLM06:2026 (Unbounded Consumption), ASI02 (Tool Misuse and Exploitation), ASI03 (Identity and Privilege Abuse), ASI05 (Unexpected Code Execution)

## Contents

- [Typed Tools, Checked Outside the Model](#typed-tools-checked-outside-the-model)
- [No Open-Ended Tools](#no-open-ended-tools)
- [Credentials Are Short-Lived and Single-Purpose](#credentials-are-short-lived-and-single-purpose)
- [The Policy Broker](#the-policy-broker)
- [Budgets](#budgets)
- [What "Least Agency" Rules Out](#what-least-agency-rules-out)
- [Review Checklist](#review-checklist)
- [Sources](#sources)

Excessive Agency is damage from unexpected, ambiguous, or manipulated model output. OWASP LLM03:2026 names three root causes. Fix the one you actually have.

| Cause | What it looks like | Fix |
|-------|--------------------|-----|
| Excessive functionality | A mail tool can send and delete when the task is to summarize | Delete the extra operations from the tool |
| Excessive permissions | A read tool connects with a role that can update every row | Database permissions for that identity are read-only, on one table |
| Excessive autonomy | A delete runs because the model asked | The broker requires a human approval row |

ASI02 is a legitimate tool used the wrong way: the agent is inside its granted rights and still deletes, over-calls a paid API, or copies data out. ASI03 is privilege: the agent inherits a broader identity, caches a credential, or trusts another agent. ASI05 is unexpected code execution: model output, a deserializer, or an install step starts running as code. A shell tool can be all three. Remove the shell.

Sanitizing the model's text is not the root control for Excessive Agency (OWASP LLM03:2026). Input controls are LLM01. Output encoding is LLM10. This page is about the tool and the credential.

## Typed Tools, Checked Outside the Model

```tsx
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { getCurrentUser } from '@/data/auth'
import { db } from '@/data/db'
import { orders } from '@/data/schema'

const ListOrdersArgs = z.object({
  status: z.enum(['open', 'fulfilled']).optional(),
})

// FAIL — the model writes the query and the connection is an admin role
export async function runSql(query: string) {
  return db.execute(query)
}

// PASS — one operation, one schema, the user comes from the session
export async function listOrders(raw: unknown) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const args = ListOrdersArgs.parse(raw)
  const filters = [eq(orders.userId, user.id)]
  if (args.status) filters.push(eq(orders.status, args.status))

  return db
    .select({ id: orders.id, status: orders.status, totalCents: orders.totalCents })
    .from(orders)
    .where(and(...filters))
}
```

The PASS tool does not accept a user id. OWASP LLM03:2026 mitigation 5: run the tool in that user's context, with the minimum scope. A model argument named `userId` is how a confused deputy starts.

Offer the model an allowlist. Unknown tool names fail closed. Fully qualify names so a newly connected server cannot shadow `refund` with another `refund` (ASI02 mitigation 7).

## No Open-Ended Tools

OWASP LLM03:2026 mitigation 3: a shell, a URL fetch, or a file-write primitive will be asked to do something else. Replace each one with the operation the product needs.

```tsx
// FAIL — any command the model can express, on the application host
export async function runCommand(command: string) {
  return execFile('bash', ['-lc', command])
}

// PASS — the only file operation this feature needs
const WriteExportArgs = z.object({
  exportId: z.string().uuid(),
})

export async function writeOwnedExport(raw: unknown) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  const { exportId } = WriteExportArgs.parse(raw)

  const rows = await listOrders({ status: 'fulfilled' })
  const relative = `${user.id}/${exportId}.json`
  await saveExportObject(relative, rows)
  return { path: relative }
}
```

`writeOwnedExport` picks the directory. The model picks an id that is only a filename component after the schema check, and it never chooses the directory.

If the product truly needs to run model-written code, that is ASI05. Run it in a sandbox with no production credentials and a default-deny network. A block list of language features is not a sandbox. The AWS MCP `run_script` issue in the [incident appendix](incident-appendix.md) is that pattern. The user's own sandbox session is still code execution. Prefer a typed tool.

## Credentials Are Short-Lived and Single-Purpose

ASI03: an agent that borrows a human's admin token, or keeps a key in memory for the next task, is an identity bug.

```tsx
// FAIL — one long-lived admin token, cached on the agent object
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function refund(orderId: string, amount: number) {
  return stripe.refunds.create({ charge: orderId, amount })
}

// PASS — the broker refunds a charge it loaded for this user, with a scoped server action
export async function refundOwnedOrder(raw: unknown) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  const args = z.object({
    orderId: z.string().uuid(),
    amountCents: z.number().int().positive().max(50_000),
  }).parse(raw)

  const order = await getOwnedOrder(user.id, args.orderId)
  if (!order?.chargeId) throw new Error('Not found')
  if (args.amountCents > order.refundableCents) throw new Error('Amount not allowed')

  return createRefund({
    chargeId: order.chargeId,
    amountCents: args.amountCents,
    idempotencyKey: `${user.id}:${order.id}:${args.amountCents}`,
  })
}
```

`createRefund` uses a server-side secret the model never sees. The secret's identity at the payment provider should be unable to create charges or change account settings if the product only refunds.

Do not pass the tool a credential in its arguments. Do not leave SSH keys, OAuth refresh tokens, or cloud sessions in the agent's memory between tasks (ASI03). Wipe task state at the end of the task. A second user on the same agent process is a new tenant, not a continuation.

Re-check authorization on every privileged step. A token that was valid when the workflow started can outlive the user's right to approve it (ASI03, time-of-check to time-of-use).

## The Policy Broker

Treat planner output as untrusted. ASI02 mitigation 4 calls this a policy enforcement point: validate the name and the arguments, enforce the schema and the rate, and only then mint a short-lived credential.

```tsx
const tools = {
  listOrders,
  refundOwnedOrder,
} as const

export async function dispatchTool(name: string, raw: unknown) {
  const tool = tools[name as keyof typeof tools]
  if (!tool) throw new Error('Unknown tool')
  return tool(raw)
}
```

A gateway in front of the model is not this broker. If the gateway can insert a tool call the model did not produce, your process still has to allowlist the name and re-validate the arguments. That is the HiddenLayer "man-in-the-model" case in the [incident appendix](incident-appendix.md).

Peer agents do not skip the broker. A planner's message is untrusted content. The worker does not refund because another agent said to. See [MCP and Inter-Agent](mcp-and-inter-agent.md).

## Budgets

LLM06:2026 is unbounded consumption: cost, quota, and capacity. A long agent session can stay under a per-request cap while the accumulated context on every turn drives the bill up. Tool loops do the same with a paid API (ASI02).

```tsx
const LIMITS = {
  userDailyCents: 200,
  jobCents: 50,
  toolCallsPerJob: 20,
}

export async function assertBudget(userId: string, jobId: string, addCents: number) {
  const spent = await getSpend(userId, jobId)
  if (spent.jobCents + addCents > LIMITS.jobCents) throw new Error('Job budget exceeded')
  if (spent.userDailyCents + addCents > LIMITS.userDailyCents) throw new Error('Daily budget exceeded')
  if (spent.toolCalls >= LIMITS.toolCallsPerJob) throw new Error('Tool budget exceeded')
}
```

Call `assertBudget` in the broker before the model call and before the side effect. A budget is also a containment control: a loop that calls a tool cannot run until the account is empty.

Model APIs are a billing target. Wiz described stolen cloud billing used to run another party's model calls (20 Oct 2026, [incident appendix](incident-appendix.md)). Alert on spend. Keep agent workloads on a budget that cannot draw the company's main cloud bill without a separate approval.

## What "Least Agency" Rules Out

| Request | Response |
|---------|----------|
| "Let the agent run tests" | A fixed test command your code invokes, in CI, with CI credentials. Not a shell tool |
| "Let it look up any customer" | `getOrder` for the signed-in user, or a support role checked in the broker |
| "Let it browse the web" | Your fetcher, allowlisted hosts, no-tool summary. URL allowlists for SSRF live in api-security |
| "Let it write a migration" | A pull request a human merges. The agent does not hold a database admin URL |
| "The sandbox makes a shell safe" | Only if the sandbox has no production credentials and no open egress. A block list inside the sandbox is not that |

## Review Checklist

- [ ] Every tool name on the model call maps to a function in the broker
- [ ] Each function accepts a Zod schema and ignores unknown keys
- [ ] User and tenant ids come from the session
- [ ] The database role for that function cannot perform the operations the feature does not need
- [ ] No shell, `eval`, dynamic SQL, or open `fetch` is reachable from model output
- [ ] Secrets are not in the prompt, the tool arguments, or the agent memory
- [ ] Privileged steps re-check authorization at execution time
- [ ] Per-user and per-job budgets fail closed
- [ ] A compromised model gateway cannot introduce a tool the allowlist rejects

## Sources

- OWASP Top 10 for LLM Applications 2026, LLM03:2026 Excessive Agency, LLM06:2026 Unbounded Consumption
- OWASP Top 10 for Agentic Applications 2026, ASI02, ASI03, ASI05
- OWASP AI Agent Security Cheat Sheet
- [api-security](../../api-security/SKILL.md) for SSRF allowlists and HTTP rate limits
