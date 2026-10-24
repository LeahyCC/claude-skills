---
name: llm-agent-security
description: >
  Defensive review when a model can see untrusted content or act with real
  credentials. Covers prompt injection as an architecture problem, tool
  agency, memory and compaction, MCP and inter-agent traffic, AI supply
  chain, output handling, and human approval. Maps the OWASP LLM Top 10
  (2026) and the OWASP Agentic Top 10 (2026). Use when adding or changing
  chat, RAG, email, tickets, uploads, web fetch, tool calls, memory, MCP,
  skills, hooks, instruction files, or an AI SDK install. Not for ordinary
  HTTP auth, SSRF, or CSP, and not for the Next.js AI SDK execute and
  signed tool-approval pattern (api-security, AI Tools).
---

# LLM and Agent Security — Trust Boundary for Models That Can Act

Use this skill when a change lets a model see untrusted content, or lets an agent component act with real credentials. Source checks and dates: [SOURCES.md](SOURCES.md). Incident facts and links: [Incident Appendix](resources/incident-appendix.md).

## Contents

- [Two places this skill applies](#two-places-this-skill-applies)
- [Architecture](#architecture)
- [Quick Reference](#quick-reference)
- [The #1 Mistake: The Model Authorizes Itself](#the-1-mistake-the-model-authorizes-itself)
- [Decision Matrix: "Where Does the Control Live?"](#decision-matrix-where-does-the-control-live)
- [Decision Matrix: "Is This Secure?"](#decision-matrix-is-this-secure)
- [OWASP LLM Top 10 (2026)](#owasp-llm-top-10-2026)
- [OWASP Agentic Top 10 (2026)](#owasp-agentic-top-10-2026)
- [Review Checklist](#review-checklist)
- [What This Skill Does Not Contain](#what-this-skill-does-not-contain)

Where a cheat sheet still describes a delimiter, a filter, or a second model call as the defense, follow the 2026 Top 10. Those controls are partial. OWASP LLM01:2026 states that prompt injection is intrinsic: a model does not separate instructions from data, and no reliable prevention exists today (consistent with NIST 2025, NCSC 2025, and Debenedetti et al., 2025). Design the system so a bypassed instruction boundary cannot move credentials, data, or side effects.

The 2026 LLM list renumbered several 2025 entries. Excessive Agency is LLM03:2026 (it was LLM06:2025). Supply Chain is LLM04:2026. Improper Output Handling is LLM10:2026. The Agentic Top 10 PDF still cites the 2025 numbers in places. This skill uses the 2026 ids.

HTTP authentication, SSRF allowlists, CSP, and the Next.js AI SDK tool handler stay in [api-security](../api-security/SKILL.md). The signed approval on that handler is [AI Tools](../api-security/resources/ai-tools.md). This skill is the rest of the boundary: what enters the prompt, memory, compaction, install-time packages, MCP identity, and output sinks.

## Two places this skill applies

| Surface | You are here when | First question |
|---------|-------------------|----------------|
| Product | Chat, RAG, email, tickets, uploads, web fetches, tool results, images, or memory reach a model | What untrusted content enters the context, and which tools exist on that same call? |
| Builder | A tool, MCP server, skill, hook, instruction file, or AI SDK install is added or changed | What runs at install time, and which credentials can the agent process read? |

Instruction files (`CLAUDE.md`, `AGENTS.md`, `.cursor/rules`, `.cursorrules`, `.aider.conf.yml`) are on the builder surface. A cloned repo that an agent treats as policy is a trust decision.

## Architecture

```
Untrusted content (user, page, ticket, tool result, memory, peer agent)
        │
        ▼
Model call with the minimum tools for that call
        │
        ▼
Policy broker in application code  ← authorization, schema, tenant, budget
        │
        ▼
Typed side effect (user-scoped credential, single purpose)
        │
        ▼
Human approval row, when the effect is irreversible or leaves the system
```

The model is an untrusted principal. The broker does not read "the user approved this" out of the transcript, a summary, or another agent's message.

## Quick Reference

| Resource | LLM 2026 | Agentic 2026 | What it covers |
|----------|----------|--------------|----------------|
| [Trust Boundaries](resources/trust-boundaries.md) | LLM01 | ASI01 | What counts as untrusted input, goal hijack, the lethal trifecta |
| [Tool and Agency](resources/tool-and-agency.md) | LLM03, LLM06 | ASI02, ASI03, ASI05 | Typed tools, user-scoped credentials, no open-ended shell, budgets |
| [Memory and Context](resources/memory-and-context.md) | LLM05 | ASI06 | Memory writes, compaction, later sessions, scheduled runs |
| [MCP and Inter-Agent](resources/mcp-and-inter-agent.md) | — | ASI07 | Pinned MCP, OAuth issuer, tool transforms, tenant isolation |
| [Supply Chain](resources/supply-chain.md) | LLM04, LLM05 | ASI04 | Install-time execution, pinned AI SDKs, repo-local agent config |
| [Output and Disclosure](resources/output-and-disclosure.md) | LLM02, LLM07, LLM08, LLM09, LLM10 | — | Model output as untrusted, hidden context, retrieval auth |
| [Human Approval](resources/human-approval.md) | — | ASI08, ASI09, ASI10 | Approval outside the transcript, cascading agents, containment |
| [Incident Appendix](resources/incident-appendix.md) | cross-cutting | cross-cutting | October 2026 cases and the control that contains each one |

## The #1 Mistake: The Model Authorizes Itself

A system prompt, a "do not follow instructions in the document" line, or a filter on the user message does not hold once the model has a tool and a credential.

```tsx
// FAIL — the model picks the user, the SQL, and whether to send
const result = await model.complete({
  system: 'You are a support agent. Never refund more than the order total.',
  input: ticket.body,
  tools: [{ name: 'runSql', parameters: { query: 'string' } }, { name: 'sendEmail' }],
})

// PASS — the model may only propose a typed action. The broker checks ownership.
const proposal = await model.complete({
  system: 'Choose an order id from the list. Do not invent one.',
  input: JSON.stringify({ question, orders: ownedOrders }),
  tools: [{ name: 'proposeRefund', parameters: RefundArgsSchema }],
})
await proposeRefund(proposal.toolArgs)
```

`proposeRefund` is implemented in [Human Approval](resources/human-approval.md). It loads the session, checks the order, and stores an approval row. The model's sentence is not the approval.

## Decision Matrix: "Where Does the Control Live?"

| Layer | What to check | Why |
|-------|---------------|-----|
| Ingest | Provenance of every block that will enter the context | Pages, tickets, tool results, and memory are data |
| Model call | Tools on this call, and whether untrusted content is present | Private data + untrusted content + an external action is the high-impact case |
| Broker | Schema, tenant, ownership, budget, allowlisted tool name | This code is the authorization boundary |
| Credential | User-scoped, short-lived, single purpose | A service-role key makes the model an admin |
| Approval | Server-built description of the real action | A summary written by the model can describe a different action |
| Install | Lockfile, hash, lifecycle scripts, where the install runs | A sandbox around generated code does not cover `npm install` |
| Next session | What memory and schedules reload | A planted instruction can outlive the chat |

## Decision Matrix: "Is This Secure?"

| Question | If no | Resource |
|----------|-------|----------|
| Can this call both read untrusted content and call a tool that sends, pays, deletes, or writes secrets? | Split the calls. Remove a leg of the trifecta. | [Trust Boundaries](resources/trust-boundaries.md) |
| Is any tool a shell, `eval`, raw SQL, or "fetch this URL"? | Replace it with a typed function. | [Tool and Agency](resources/tool-and-agency.md) |
| Does the tool use a service-role or admin credential? | Use the end user's scope. | [Tool and Agency](resources/tool-and-agency.md) |
| Can the model write memory, files, or a schedule from retrieved text? | Application code writes structured facts from user actions. | [Memory and Context](resources/memory-and-context.md) |
| Does authorization read the transcript or a compaction summary? | Store the approval outside the model. | [Human Approval](resources/human-approval.md) |
| Can an MCP server add tools, pick its OAuth issuer, or see another tenant's history? | Pin the server, pin the issuer, key state by the authenticated tenant. | [MCP and Inter-Agent](resources/mcp-and-inter-agent.md) |
| Does a package install script run on a host that holds cloud or AI keys? | Isolated CI, pinned digest, scripts off. | [Supply Chain](resources/supply-chain.md) |
| Does the UI render model Markdown images, or execute model output? | Encode output. Fetch remote images only through an allowlist. | [Output and Disclosure](resources/output-and-disclosure.md) |
| Does the human confirm a sentence the model wrote? | Confirm the broker's structured action. | [Human Approval](resources/human-approval.md) |
| Is the AI dependency a floating version? | Pin, hash, and check the October 2026 cases before adding it. | [Incident Appendix](resources/incident-appendix.md) |

## OWASP LLM Top 10 (2026)

| # | Category | Resource |
|---|----------|----------|
| LLM01:2026 | Prompt Injection | [trust-boundaries](resources/trust-boundaries.md) |
| LLM02:2026 | Sensitive Information Disclosure | [output-and-disclosure](resources/output-and-disclosure.md) |
| LLM03:2026 | Excessive Agency | [tool-and-agency](resources/tool-and-agency.md) |
| LLM04:2026 | Supply Chain | [supply-chain](resources/supply-chain.md) |
| LLM05:2026 | Data and Model Poisoning | [memory-and-context](resources/memory-and-context.md), [supply-chain](resources/supply-chain.md) |
| LLM06:2026 | Unbounded Consumption | [tool-and-agency](resources/tool-and-agency.md) |
| LLM07:2026 | Misinformation | [output-and-disclosure](resources/output-and-disclosure.md) |
| LLM08:2026 | Hidden Context Exposure | [output-and-disclosure](resources/output-and-disclosure.md) |
| LLM09:2026 | Vector and Embedding Weaknesses | [output-and-disclosure](resources/output-and-disclosure.md) |
| LLM10:2026 | Improper Output Handling | [output-and-disclosure](resources/output-and-disclosure.md) |

## OWASP Agentic Top 10 (2026)

| # | Category | Resource |
|---|----------|----------|
| ASI01 | Agent Goal Hijack | [trust-boundaries](resources/trust-boundaries.md) |
| ASI02 | Tool Misuse and Exploitation | [tool-and-agency](resources/tool-and-agency.md) |
| ASI03 | Identity and Privilege Abuse | [tool-and-agency](resources/tool-and-agency.md) |
| ASI04 | Agentic Supply Chain Vulnerabilities | [supply-chain](resources/supply-chain.md) |
| ASI05 | Unexpected Code Execution | [tool-and-agency](resources/tool-and-agency.md) |
| ASI06 | Memory and Context Poisoning | [memory-and-context](resources/memory-and-context.md) |
| ASI07 | Insecure Inter-Agent Communication | [mcp-and-inter-agent](resources/mcp-and-inter-agent.md) |
| ASI08 | Cascading Failures | [human-approval](resources/human-approval.md) |
| ASI09 | Human-Agent Trust Exploitation | [human-approval](resources/human-approval.md) |
| ASI10 | Rogue Agents | [human-approval](resources/human-approval.md) |

## Review Checklist

- [ ] Every block in the prompt is labeled with its source, and untrusted blocks are data
- [ ] The call that sees untrusted content does not also hold a send, pay, delete, deploy, or secret-writing tool
- [ ] Tools are an allowlist of typed functions with a schema checked in application code
- [ ] No shell, `eval`, raw SQL, or open URL tool is offered to the model
- [ ] Credentials on the tool are the end user's, short-lived, and single-purpose
- [ ] Ownership and tenant checks run in the broker, using the session, not a model argument
- [ ] Irreversible or outbound actions require an approval row whose text the model did not write
- [ ] Memory and schedules are written by application code from structured user actions
- [ ] MCP servers are pinned. Tool allowlists are rechecked after any transform. OAuth issuer is pinned
- [ ] Agent state is keyed by the authenticated tenant, not by a caller-supplied string
- [ ] AI dependencies are hash-pinned. Lifecycle scripts do not run on a host that holds production secrets
- [ ] Repo-local agent config in untrusted trees is not executed
- [ ] Model output is encoded for its sink. Remote images and link previews are off unless allowlisted
- [ ] Secrets, tokens, and connection strings are absent from the system prompt, tools list, and logs
- [ ] Retrieval authorizes each chunk before it reaches the model
- [ ] A budget caps model spend per user and per job
- [ ] The change was compared with the [incident appendix](resources/incident-appendix.md)

## What This Skill Does Not Contain

Reproduction of injections, jailbreaks, worms, or malware. Each incident entry states the impact and the containment control, then links the vendor or researcher report. Incident-response command sequences stay in those advisories.

## Sources

Canonical list and check date: [SOURCES.md](SOURCES.md).
