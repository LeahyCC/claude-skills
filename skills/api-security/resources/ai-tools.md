# AI Tools on a Web API

> OWASP API1:2023 and API5:2023 still apply. LLM03:2026 (Excessive Agency), LLM01:2026 (Prompt Injection), LLM10:2026 (Improper Output Handling). Agentic: ASI01 (Goal Hijack), ASI02 (Tool Misuse), ASI03 (Identity and Privilege Abuse), ASI04 (Agentic Supply Chain), ASI05 (Unexpected Code Execution), ASI09 (Human-Agent Trust Exploitation).

A tool the model can call is another way into your API. The model chooses the tool and the arguments. A user message, a document, a tool description, or a tool result can steer that choice. The handler still checks the session, the ownership, and the arguments.

Prompt text is not an authorization check. OWASP treats input and output filtering as a different problem (LLM01 and LLM10). Excessive agency is too many tools, too much permission, or no human check.

Spend limits for the model call stay in [Rate Limiting](rate-limiting.md). URL fetches stay in [SSRF & Logging](ssrf-and-logging.md). Rendering model text stays in [Input Validation](input-validation.md).

```
Browser  →  chat route (session)  →  model
                ↑                      ↓
         tool result              tool call
                ↑                      ↓
         your data  ←  execute (session user, schema, ownership)
```

Untrusted: the user text, the message history, MCP tool definitions, tool results, and every argument. Trusted: the `execute` function you wrote, and only for the user your server already authenticated.

## Three ways a tool is too powerful

| Excess | What it looks like | Fix |
|--------|--------------------|-----|
| Functionality | A mail reader that can also send, or one shell tool | One tool, one action |
| Permissions | A read tool using a service role that can update every row | The signed-in user's own scope |
| Autonomy | A cancel or a payment runs because the model asked | A person approves, and the server can prove it |

## Rule 1: The user comes from the session

The schema describes what the model may say. It does not say who the caller is. `userId` in the arguments is the same BOLA bug as `userId` in a request body.

Put the tool in a `server-only` module. Do not import `execute` into a client component.

```tsx
// FAIL — the model, or a forged tool call, picks the account
import { tool } from 'ai'
import { z } from 'zod'

export const cancelOrder = tool({
  description: 'Cancel an order.',
  inputSchema: z.object({
    userId: z.string(),
    orderId: z.string(),
  }),
  execute: async ({ userId, orderId }) => {
    await db.delete(orders).where(
      and(eq(orders.id, orderId), eq(orders.userId, userId))
    )
    return { ok: true }
  },
})
```

```tsx
// PASS — identity is the session. The model only names the order.
import 'server-only'
import { tool } from 'ai'
import { z } from 'zod'
import { getCurrentUser } from '@/data/auth'

export const cancelOrder = tool({
  description: 'Cancel one order that belongs to the signed-in user.',
  inputSchema: z.strictObject({
    orderId: z.string().min(1).max(64),
  }),
  execute: async ({ orderId }) => {
    const user = await getCurrentUser()
    if (!user) return { error: 'Unauthorized' }

    const [order] = await db
      .select({ id: orders.id, status: orders.status })
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, user.id)))

    if (!order) return { error: 'Not found' }
    if (order.status === 'cancelled') return { ok: true, orderId: order.id }

    await db.update(orders)
      .set({ status: 'cancelled' })
      .where(and(eq(orders.id, order.id), eq(orders.userId, user.id)))

    return { ok: true, orderId: order.id }
  },
})
```

Return a small object. The model, the browser stream, and the logs all see it. Do not return the row, a token, or a stack.

A second call and a retry will both hit `execute`. The update above is safe to repeat: a cancelled order stays cancelled.

If this tool runs where `cookies()` is empty, pass the user id in server-set tool context. Still do not put it in the prompt or the schema.

## Rule 2: One action per tool

```tsx
// FAIL — the model can run anything the function can run
execute: async ({ command }) => execSync(command, { encoding: 'utf8' })
```

Do not ship a shell, `eval`, a raw SQL string, or "fetch this URL" as a tool. A document the model just read can tell it which command to pass. A specific tool that cancels one owned order has nothing to pass through.

A tool that fetches a URL uses the allowlist in [SSRF & Logging](ssrf-and-logging.md). A tool that writes SQL uses a parameterized query, from [Input Validation](input-validation.md). A tool that runs code the model wrote runs outside the function process, with no deployment env and no default outbound network. On Vercel that is a sandbox or a virtual workspace, not `execSync` in the route.

Give each route the tools that route needs. A support route that reads orders does not also get `refund`, `sendEmail`, and `runSql`. Remove tools left over from a trial.

## Rule 3: A write needs an approval the browser cannot forge

`toolApproval: 'user-approval'` asks a person before `execute`. That is not enough on its own. With `useChat`, the server rebuilds the turn from messages the browser sends. A client can attach a normal-looking approval for a schema-valid call and skip the person.

Sign the approval with `experimental_toolApprovalSecret`. The server checks the signature before `execute`. No secret means forged approvals still work. `needsApproval` on the tool is a fallback, not this control.

Provider-executed tools (a provider web search, for example) do not go through `toolApproval`.

```tsx
import { ToolLoopAgent } from 'ai'

const approvalSecret = process.env.TOOL_APPROVAL_SECRET
if (!approvalSecret) {
  throw new Error('TOOL_APPROVAL_SECRET is required')
}

const agent = new ToolLoopAgent({
  model: 'anthropic/claude-sonnet-4.6',
  tools: { cancelOrder },
  toolApproval: { cancelOrder: 'user-approval' },
  experimental_toolApprovalSecret: approvalSecret,
})
```

Generate at least 32 bytes (`openssl rand -base64 32`) and put the same value on every instance. The secret is not sent to the client.

The signature binds the tool name, the call id, and the arguments. It does not name the user, it does not expire, and it does not spend the approval. A signed call copied into someone else's session still verifies. `execute` still checks ownership, and the approval row below is what ties the call to one user and one use.

```tsx
// FAIL — the client says the person approved. The model can set the flag.
execute: async ({ orderId, userConfirmed }) => {
  if (userConfirmed !== true) return { error: 'Needs approval' }
  await charge(orderId)
}

// PASS — record the call from the result the server just produced, not from the browser body.
// Unique on toolCallId. A retry of this response must leave the original user on the row.
for (const part of result.content) {
  if (part.type !== 'tool-approval-request' || part.isAutomatic) continue
  await db.insert(toolApprovals).values({
    toolCallId: part.toolCall.toolCallId,
    userId: user.id,
    toolName: part.toolCall.toolName,
  }).onConflictDoNothing()
}

// Spend it in the same step as the write. A second request updates zero rows.
execute: async ({ orderId }, { toolCallId }) => {
  const user = await getCurrentUser()
  if (!user) return { error: 'Unauthorized' }

  // Unique toolCallId. consumedAt starts null.
  const spent = await db
    .update(toolApprovals)
    .set({ consumedAt: new Date() })
    .where(and(
      eq(toolApprovals.toolCallId, toolCallId),
      eq(toolApprovals.userId, user.id),
      isNull(toolApprovals.consumedAt),
    ))
    .returning({ toolCallId: toolApprovals.toolCallId })

  if (spent.length === 0) return { error: 'Already used' }

  // Pass toolCallId as the provider idempotency key. Do not delete the row
  // after a timeout: a retry would charge again.
  await chargeOwnedOrder(user.id, orderId, toolCallId)
}
```

The screen has to show those arguments. `requestReason` is a sentence from the model (ASI09). A person can approve "cancel your last order" while the signed input is a different id.

```tsx
// FAIL — the only label is the model's sentence
<p>{part.approval.requestReason}</p>

// PASS — the button names the arguments the signature covers
if (part.type === 'tool-cancelOrder' && part.state === 'approval-requested') {
  return (
    <button onClick={() => addToolApprovalResponse({ id: part.approval.id, approved: true })}>
      Cancel order {part.input.orderId}
    </button>
  )
}
```

Read-only tools can run without a prompt. Cancel, pay, send, delete, and any tool whose arguments reach another system get a signed approval, a row for that user, and one spend.

The chat route is a public POST. Check `getCurrentUser()` before constructing the agent. Cap how many tool calls one request can make, and apply the AI budget in [Rate Limiting](rate-limiting.md) before the model call.

## Rule 4: Tool results are data

A page, ticket, or email the tool returns can contain instructions. You will not reliably detect those instructions. The bound is what the agent is allowed to do after it reads them: no send tool on a reader, no service-role query, no second tool that posts the text somewhere else.

Do not render the result with `dangerouslySetInnerHTML`. See [Input Validation](input-validation.md). Do not put secrets, other tenants' rows, or the system prompt into the result or the prompt. Log the tool name, the user id, and the resource id. Leave the prompt and the result out of the log. See [SSRF & Logging](ssrf-and-logging.md).

## Rule 5: An MCP server is a supply chain

`mcpClient.tools()` with no schema map loads every tool the server offers, including ones added after you reviewed it. Name the tools. Pin the definitions. Give the server its own credential.

```tsx
// FAIL — caller picks the server, and their session is the credential
const { mcpUrl, sessionToken } = await request.json()

const mcpClient = await createMCPClient({
  transport: {
    type: 'http',
    url: mcpUrl,
    headers: { Authorization: `Bearer ${sessionToken}` },
    redirect: 'follow',
  },
})

const tools = await mcpClient.tools()
```

```tsx
// PASS — fixed server, its own key, named tools, pinned definitions
import { createMCPClient } from '@ai-sdk/mcp'
import { detectToolDrift, fingerprintTools } from 'ai'
import { z } from 'zod'

const MCP_URL = 'https://mcp.example.com/mcp'

const mcpClient = await createMCPClient({
  transport: {
    type: 'http',
    url: MCP_URL,
    headers: { Authorization: `Bearer ${process.env.MCP_API_KEY}` },
  },
})

const tools = await mcpClient.tools({
  schemas: {
    'list-invoices': {
      inputSchema: z.strictObject({}),
    },
  },
})

// pinnedFingerprints is the map saved from fingerprintTools() at the last human review.
const drift = detectToolDrift(await fingerprintTools(tools), pinnedFingerprints)
if (drift.changed.length > 0 || drift.added.length > 0) {
  throw new Error('MCP tool definitions changed')
}
```

Leave `redirect` at its default, `'error'`. `redirect: 'follow'` is an SSRF bypass.

`fingerprintTools` covers the description, the input schema, and the title. It does not cover annotations or the output schema, and it cannot see a server that keeps the same schema and changes what the tool does. A flipped `readOnlyHint` still gets a clean digest, and a client that trusts the hint will stop asking for approval.

Save the hints next to the digest. Compare them on the next fetch. Do not skip approval because a third-party server set `readOnlyHint`.

```tsx
// Server key order is not meaningful. Sort it or a harmless reorder looks like drift.
function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable)
  if (!value || typeof value !== 'object') return value
  const record = value as Record<string, unknown>
  return Object.keys(record).sort().map((key) => [key, stable(record[key])])
}

function annotationPin(tools: Record<string, { metadata?: unknown }>): string {
  const rows = Object.keys(tools).sort().map((name) => {
    const metadata = tools[name]?.metadata
    const annotations =
      metadata && typeof metadata === 'object' && 'annotations' in metadata
        ? metadata.annotations
        : null
    return [name, stable(annotations ?? null)] as const
  })
  return JSON.stringify(rows)
}

// pinnedAnnotations is the string saved at the last human review.
if (annotationPin(tools) !== pinnedAnnotations) {
  throw new Error('MCP tool annotations changed')
}
```

Do not forward the user's session, or a token issued for your API, to an MCP server. The MCP spec forbids that server from accepting a token that was not issued to it. A service-role key is the other failure: the model then acts as every user.

Stdio is for a local process. Do not use it on a deployed route. Leave MCP retries off unless the tool is safe to run twice. A retry of "send" or "create" runs the side effect again.

Close the client when the request ends.

## Audit Patterns

```bash
# Tool schemas that take an identity from the model
grep -rn "inputSchema" --include="*.ts" -A 12 | grep -E "userId|user_id|accountId|role"

# Model calls in a file that never reads the session
grep -rln "generateText\|streamText\|ToolLoopAgent" --include="*.ts" | \
  xargs grep -L "getCurrentUser\|requireAdmin\|requireRole\|auth()"

# Shell or eval in tool code
grep -rn "execSync\|exec(\|spawn(\|eval(" --include="*.ts" | grep -E "lib/ai|tool"

# MCP client taking a URL or token from the request
grep -rn "createMCPClient" --include="*.ts" -A 20 | grep -E "request.json|searchParams|headers.get"

# Approvals without the signing secret
grep -rln "toolApproval" --include="*.ts" | xargs grep -L "experimental_toolApprovalSecret"

# A client flag used as the approval
grep -rn "userConfirmed\|user_confirmed" --include="*.ts"

# Every tool on the server, not a named list
grep -rn "mcpClient.tools()" --include="*.ts"

# Stdio MCP on a route
grep -rn "StdioClientTransport" --include="*.ts"
```

## What this file does not cover

Training-data poisoning, embedding stores, and "the model stated a fact that is wrong" are LLM risks with no tool-handler fix here. Memory that lasts across sessions, agents talking to agents, and a model hiding its actions are agentic risks. They need their own design. This file is the tool call on a Next.js route.

## Sources

- [OWASP LLM03:2026 Excessive Agency](https://github.com/GenAI-Security-Project/GenAI-LLM-Top10/blob/main/2026/final/LLM03_ExcessiveAgency.md) (published 2026-08-04)
- [OWASP GenAI LLM Top 10 2026](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/)
- [OWASP Top 10 for Agentic Applications 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/) (December 2025)
- [AI SDK `tool()`](https://ai-sdk.dev/docs/reference/ai-sdk-core/tool)
- [AI SDK tool approvals](https://ai-sdk.dev/docs/agents/tool-approvals)
- [AI SDK MCP tools](https://ai-sdk.dev/docs/ai-sdk-core/mcp-tools)
- [MCP security best practices](https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices)
- [OWASP AI Agent Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html) (approval must match the actor and be spent once)
- [OWASP MCP Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/MCP_Security_Cheat_Sheet.html) (pin annotations, not only the description)
- [Vercel: security for durable agent harnesses](https://vercel.com/docs/agent-harnesses/security)

Review note (2026-10-22): call shapes were checked against the AI SDK docs and the `tool-approval-request` mapping (`part.toolCall.toolCallId`) that day. UI approval state uses `part.input`, as in the AI SDK chatbot tool example. The model id matches the string already used in [Rate Limiting](rate-limiting.md). No Next app, tool call, or MCP server was run. The approval secret does not bind the user or spend the call. That row is application code. The secret API is still marked experimental. Recheck this file when that API changes, or when a route starts executing tools.
