# llm-agent-security

Defensive review when untrusted content can reach a model, or when tools, MCP, skills, memory, hooks, or an AI SDK install can act with real credentials. OWASP LLM Top 10 (2026) and OWASP Agentic Top 10 (2026), with the October 2026 cases as containment lessons.

## Install

```bash
npx skills add LeahyCC/claude-skills@llm-agent-security
```

Or inside Claude Code:

```text
/plugin install llm-agent-security --marketplace LeahyCC/claude-skills
```

## What It Does

Two surfaces:

- **Product.** Chat, RAG, email, tickets, uploads, web fetches, tool results, images, or memory reach a model.
- **Builder.** A tool, MCP server, skill, hook, instruction file, or AI dependency is added or changed.

The skill assumes the model's instruction boundary will fail. The controls are the tool list, the credential, the broker, and the approval row. A system-prompt rule or a filter on the user message is a partial control, which is the OWASP LLM01:2026 position.

Source checks: [SOURCES.md](SOURCES.md).

## What it catches

```tsx
// The model picks the SQL and holds a send tool.
const result = await model.complete({
  input: ticket.body,
  tools: [{ name: 'runSql' }, { name: 'sendEmail' }],
})

// The model may propose a refund. The broker checks the session and writes an approval row.
await proposeRefund(proposal.toolArgs)
```

```tsx
// A summary in the transcript authorizes the refund.
if (summary.includes('approved')) await issueRefund(orderId, amount)

// The approval is a row. The summary is never read here.
await confirmRefund(approvalId)
```

## Coverage

| Resource | LLM 2026 | Agentic 2026 | Key topics |
|----------|----------|--------------|------------|
| [Trust Boundaries](resources/trust-boundaries.md) | LLM01 | ASI01 | Untrusted sources, lethal trifecta, goal locked in config |
| [Tool and Agency](resources/tool-and-agency.md) | LLM03, LLM06 | ASI02, ASI03, ASI05 | Typed tools, user-scoped credentials, budgets |
| [Memory and Context](resources/memory-and-context.md) | LLM05 | ASI06 | Structured memory, compaction, scheduled jobs |
| [MCP and Inter-Agent](resources/mcp-and-inter-agent.md) | — | ASI07 | Pinned MCP, OAuth issuer, tenant keys |
| [Supply Chain](resources/supply-chain.md) | LLM04, LLM05 | ASI04 | Install-time execution, repo-local agent config |
| [Output and Disclosure](resources/output-and-disclosure.md) | LLM02, LLM07, LLM08, LLM09, LLM10 | — | Output sinks, retrieval auth, hidden context |
| [Human Approval](resources/human-approval.md) | — | ASI08, ASI09, ASI10 | Approval rows, cascades, kill switch |
| [Incident Appendix](resources/incident-appendix.md) | cross-cutting | cross-cutting | October 2026 cases and pre-2026 public cases |

All 10 LLM categories and all 10 agentic categories are mapped from [SKILL.md](SKILL.md).

## What this skill will not do

It does not include injection payloads, jailbreaks, worm steps, or malware. It does not replace [api-security](../api-security/) for HTTP authentication, SSRF allowlists, or CSP. Incident-response commands stay in the vendor advisories linked from the appendix.

## Sources

- OWASP Top 10 for LLM Applications 2026
- OWASP Top 10 for Agentic Applications 2026
- OWASP Cheat Sheet Series: LLM Prompt Injection Prevention, AI Agent Security
- [The Injection, week 43 of 2026](https://theinjection.dev/week/2026-w43/)
- [Microsoft on LiteLLM 1.107.0](https://www.microsoft.com/en-us/security/blog/2026/10/23/inside-the-litellm-1-107-0-supply-chain-compromise-credential-theft-through-python-startup-hooks/) (23 October 2026)
- [The Register on Tensorlake SDK 0.5.144](https://www.theregister.com/security/2026/10/08/shai-hulud-worm-makes-jump-to-ai-infrastructure-with-tensorlake-compromise/5302054) (8 October 2026)
- [The New Stack on OpenAI's self-replicating injection research](https://thenewstack.io/openai-self-replicating-injections/) (28 September 2026)
