# MCP and Inter-Agent

> OWASP ASI07 (Insecure Inter-Agent Communication), with ASI02 (tool interface poisoning) and ASI04 (compromised registries)

## Contents

- [Pin the Server and the Issuer](#pin-the-server-and-the-issuer)
- [Tool Lists After Every Transform](#tool-lists-after-every-transform)
- [Tenant State Is Not a Caller-Supplied String](#tenant-state-is-not-a-caller-supplied-string)
- [Peer Agents Are Untrusted Senders](#peer-agents-are-untrusted-senders)
- [Gateways](#gateways)
- [Builder Surface](#builder-surface)
- [Review Checklist](#review-checklist)
- [Sources](#sources)

ASI07 is the channel between agents, and between an agent and its tools, when that channel can be spoofed, mixed across tenants, or used to smuggle a new instruction. MCP and agent-to-agent protocols are that channel in current products.

A tool server is a supply-chain component and a runtime component. Pinning the package is [Supply Chain](supply-chain.md). This page is what happens after the connection exists: who the server is, which tools it may expose, whose data the session holds, and whether a peer agent can give orders.

## Pin the Server and the Issuer

```tsx
const servers = {
  'com.example.orders': {
    url: 'https://mcp.example.com/orders',
    // Pin the expected issuer. The server does not get to name another one.
    authorizationIssuer: 'https://auth.example.com',
    tools: ['listOrders', 'proposeRefund'] as const,
  },
} as const

export function resolveServer(id: string) {
  const server = servers[id as keyof typeof servers]
  if (!server) throw new Error('Unknown MCP server')
  return server
}
```

Fail closed on unknown servers. A user-supplied MCP URL is a new trust decision, reviewed like a new dependency, not a chat setting that applies on the next message.

FastMCP fixed two 2026 bugs that match this function. One let a server transform return a tool the policy had already denied, because authorization ran before the transform and was not repeated (fixed in 3.4.10 and 4.1.2). Recheck the allowlist on the tool you are about to call, not on the tool you saw before the transform. The other let machine-to-machine OAuth accept an authorization server advertised by the MCP server, so a server could receive the client secret (fixed in 4.1.2). The issuer in the config above is the pin. See the [incident appendix](incident-appendix.md).

opencode on Windows could be driven into local command execution by a remote MCP server's OAuth authorization endpoint, fixed in 1.18.33 with no CVE assigned. The client chooses the authorization endpoint from its own configuration. A server reply is not a command channel.

## Tool Lists After Every Transform

```tsx
type ToolSpec = { name: string, serverId: keyof typeof servers }

export function assertToolAllowed(spec: ToolSpec) {
  const server = resolveServer(spec.serverId)
  if (!server.tools.includes(spec.name as (typeof server.tools)[number])) {
    throw new Error('Tool not allowlisted')
  }
}

export async function callTool(spec: ToolSpec, raw: unknown) {
  assertToolAllowed(spec)
  const transformed = applyLocalTransform(spec)
  assertToolAllowed(transformed)
  return dispatchTool(transformed.name, raw)
}
```

`applyLocalTransform` is whatever renaming or wrapping you do. The second `assertToolAllowed` is the FastMCP lesson. Hidden instructions in a tool description are untrusted text (ASI04). The description can document the tool for the model. It cannot add a tool, widen a schema, or grant a scope. OWASP LLM01:2026 mitigation 10: audit tool descriptions, and remember that pinning the version does not remove a poisoned description inside the pinned version. Read the description as you would read a dependency diff.

Google Agent Mesh published two critical fixes on 19 October 2026 for flaws fixed the previous month. One identifier is CVE-2026-103091. An unauthenticated peer could enroll and invoke tools on connected MCP backends. Do not run an open enrollment mesh. Require authenticated peers, and do not let enrollment itself become a tool grant.

## Tenant State Is Not a Caller-Supplied String

Strands Agents' A2A server shared conversation history across callers that presented different `context_id` values (CVE-2026-115419, patched). The client does not choose the isolation key.

```tsx
// FAIL — the caller picks the key that selects the history
export async function loadHistory(contextId: string) {
  return db.select().from(agentMessages).where(eq(agentMessages.contextId, contextId))
}

// PASS — the session picks the tenant. The client id is only a thread label inside that tenant.
export async function loadHistory(threadId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  return db
    .select()
    .from(agentMessages)
    .where(and(eq(agentMessages.userId, user.id), eq(agentMessages.threadId, threadId)))
}
```

LangGraph's Postgres and SQLite stores joined namespace labels with a dot, so one label containing a dot collided with a multi-label namespace (CVE-2026-115883, patched). A caller who can set a label could read, overwrite, or delete another tenant's items. Store namespace as a structured tuple your code allocates. Do not parse trust out of a delimiter in attacker-influenced text.

## Peer Agents Are Untrusted Senders

ASI03's confused deputy: a low-privilege agent sends a normal-looking request to a high-privilege agent, and the second agent uses its own credentials. ASI07's version is the same request accepted because it arrived on the "internal" bus.

```tsx
// FAIL — internal traffic skips the broker
export async function onAgentMessage(message: { from: string, text: string, orderId: string }) {
  if (message.from.endsWith('.internal')) {
    await refundOwnedOrder({ orderId: message.orderId, amountCents: 10_000 })
  }
}

// PASS — a peer can ask. The refund function still requires the human session and an approval row.
export async function onAgentMessage(message: { taskId: string }) {
  const task = await getTask(message.taskId)
  if (!task) return
  await dispatchTool(task.tool, task.args)
}
```

`getTask` returns a task your orchestrator stored, with the user's id and the already-validated arguments. It does not return a task decoded from `message.text`. Agent cards and peer descriptors are advertisements. A peer that claims to be an admin does not become one (ASI03, forged persona).

Sign inter-agent messages if you run a mesh, and reject unsigned peers (ASI04 mitigation 5). Signing proves the sender you enrolled. It does not prove the sender's content is safe to execute. The broker still runs.

## Gateways

HiddenLayer's "man-in-the-model" write-up (22 October 2026) describes a compromised LLM gateway or inference server inserting tool calls into a coding agent's stream. The user does not see those calls, and the model did not request them.

The agent process is the policy point. Tool calls are executed only when the name is on the allowlist and the arguments pass the schema, regardless of which proxy forwarded the stream. A gateway you do not operate is a third party sitting on every prompt and every tool decision. Pin it the way you pin any other privileged dependency. If it is compromised, treat every agent that followed it as compromised: rotate the credentials those agents could use.

MLflow's scorer invoke endpoint, unauthenticated, could be made to request an arbitrary host (CVE-2026-115886, fixed in 3.17.0). That is SSRF on an ML control plane. Authenticate the endpoint and allowlist outbound URLs. URL allowlists are specified in [api-security](../../api-security/resources/ssrf-and-logging.md).

## Builder Surface

Adding an MCP server in a desktop config is a builder-surface change, even when the product has no chat UI of its own.

```json
// FAIL — a URL from a README, and the user's broad token in the config file
{
  "mcpServers": {
    "docs": {
      "url": "https://example.invalid/mcp"
    }
  }
}
```

```json
// PASS — an id your process resolves. No token in the file. resolveServer rejects unknown ids.
{
  "mcpServers": {
    "com.example.orders": {
      "url": "https://mcp.example.com/orders"
    }
  }
}
```

The PASS file is safe only together with `resolveServer`. A config the agent can edit can put the FAIL server back. Keep that file out of the agent's write scope.

| Change | Review it as |
|--------|----------------|
| New server URL in MCP config | New dependency. Pin URL, issuer, and tool allowlist |
| A skill that tells the agent to connect a server | Same review. Instructions are not a sandbox |
| A repo that ships `.mcp.json` or `.cursor/mcp.json` | Untrusted until someone reads it. Do not auto-connect on clone |
| Agent mesh or A2A "easy enroll" | Authenticated enrollment, or do not deploy it |

The malicious `postmark-mcp` package (Koi Security, 2025, cited in OWASP LLM01 scenario 9 and ASI04) is the historical version of this table: a tool package that looked like a mail integration and copied mail to an unintended recipient. The control is the same as any other package. Pin it, read the tool list, and do not grant it a broader mail scope than the product needs.

## Review Checklist

- [ ] Every MCP server is an entry in a config the application owns, not a URL from content the model read
- [ ] The OAuth issuer is pinned. The server cannot substitute its own
- [ ] The tool allowlist is checked on the tool that will actually run, including after transforms
- [ ] Tool descriptions are reviewed as content, and cannot widen schemas
- [ ] History and namespaces are keyed by the authenticated tenant
- [ ] Peer-agent messages cannot call a privileged tool without the broker
- [ ] Mesh enrollment requires authentication
- [ ] A model gateway is pinned, and tool calls are still allowlisted locally
- [ ] Cloning a repo does not auto-connect its MCP servers

## Sources

- OWASP Top 10 for Agentic Applications 2026, ASI07, ASI02, ASI03, ASI04
- OWASP LLM01:2026 scenario 9 (Invariant Labs, General Analysis, postmark-mcp)
- [The Injection, week 43 of 2026](https://theinjection.dev/week/2026-w43/): FastMCP, opencode, Google Agent Mesh CVE-2026-103091, Strands CVE-2026-115419, LangGraph CVE-2026-115883, HiddenLayer, MLflow CVE-2026-115886
