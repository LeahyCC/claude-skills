# Output and Disclosure

> OWASP LLM02:2026 (Sensitive Information Disclosure), LLM07:2026 (Misinformation), LLM08:2026 (Hidden Context Exposure), LLM09:2026 (Vector and Embedding Weaknesses), LLM10:2026 (Improper Output Handling)

## Contents

- [Model Output Is Data](#model-output-is-data)
- [Do Not Auto-Fetch What the Model Cites](#do-not-auto-fetch-what-the-model-cites)
- [Retrieval Before the Model Sees It](#retrieval-before-the-model-sees-it)
- [Embeddings Are the Documents](#embeddings-are-the-documents)
- [Hidden Context Will Leak](#hidden-context-will-leak)
- [The Model Does Not Attest to the World](#the-model-does-not-attest-to-the-world)
- [Logs, Headers, and Recipients](#logs-headers-and-recipients)
- [Side Channels, Briefly](#side-channels-briefly)
- [Review Checklist](#review-checklist)
- [Sources](#sources)

The model is another user. Validate what comes back before any other system acts on it (OWASP LLM10:2026). Encoding the output does not fix Excessive Agency. A schema-valid reply can still be the wrong email or the wrong query. Typed tools in [Tool and Agency](tool-and-agency.md) are that control. This page is the sinks: HTML, SQL, shells, logs, retrieval, and the prompt itself.

## Model Output Is Data

```tsx
import { z } from 'zod'

const Summary = z.object({
  text: z.string().max(2_000),
})

// FAIL — the reply is executed
export async function askDatabase(question: string) {
  const sql = await model.complete({ input: `Write SQL for: ${question}` })
  return db.execute(sql.output_text)
}

// PASS — the model never produces the query. The tool is a typed function.
export async function askDatabase(question: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const answer = await model.complete({
    input: JSON.stringify({ question, rows: await listOrders({}) }),
  })
  return Summary.parse({ text: answer.output_text }).text
}
```

If a feature genuinely needs the model to choose a filter, the choice is an enum the broker maps to a fixed query. The model does not get a string that is executed.

The same split applies to HTML. Encode model text for the sink. OWASP LLM10:2026 mitigation 3 and 4: context-aware encoding, and a CSP so a missed encoding does not become script execution. CSP headers are in [api-security](../../api-security/resources/security-headers.md).

## Do Not Auto-Fetch What the Model Cites

OWASP LLM10:2026 mitigation 9: chat UIs, IDEs, email, and mobile views should not automatically request URLs that appear in model output. Markdown images, link previews, and iframes are an outbound channel. The user sees an image. The request can carry data that was in the context.

```tsx
import ReactMarkdown from 'react-markdown'

// FAIL — the client loads whatever image URL the model emitted
export function AssistantMessage({ text }: { text: string }) {
  return <ReactMarkdown>{text}</ReactMarkdown>
}

// PASS — images and raw HTML are not rendered. Links are text until the user asks.
export function AssistantMessage({ text }: { text: string }) {
  return (
    <ReactMarkdown
      skipHtml
      components={{
        img: () => null,
        a: ({ children }) => <span>{children}</span>,
      }}
    >
      {text}
    </ReactMarkdown>
  )
}
```

If the product must show remote images, the server fetches an allowlisted origin and strips query parameters that could carry context (OWASP LLM10:2026 mitigation 9). The browser does not request the model's URL directly.

Strip or visibly encode control characters before model output reaches a terminal, a log viewer, or an IDE pane (OWASP LLM10:2026 mitigation 8). Those sinks interpret bytes the chat window only displays.

## Retrieval Before the Model Sees It

Two structural disclosure bugs in OWASP LLM02:2026: the index contains data the task does not need, and authorization happens after retrieval, once the chunk is already in the prompt. Filtering the answer afterward does not undo a chunk the model has already used.

```tsx
// FAIL — search the whole index, then hope the prompt hides other tenants
const chunks = await vectorSearch(embedding)

// PASS — the index query is scoped to the caller
const chunks = await vectorSearch(embedding, { tenantId: user.tenantId, ownerId: user.id })
```

Send the model the fields the task needs. A "customer 360" dump into the prompt is oversharing (OWASP LLM02:2026 tier 1). Observability tools often store full prompts and completions by default. Treat that store as a copy of the data, with the same access control. Do not log tool arguments that contain secrets.

goose's opt-in terminal integration logged shell commands and sent them, unsanitized, to the configured model provider (CVE-2026-111079, Red Hat, via The Injection, 22 October 2026). That report listed no fix. A shell history contains tokens people typed. It is not model context. Leave the integration off unless the provider path is a conscious, reviewed choice and secrets cannot appear in that stream.

## Embeddings Are the Documents

OWASP LLM09:2026 and LLM02:2026: inverting an embedding can recover source text. A leaked vector store is a document breach, including when the original files were encrypted somewhere else. Authorize before retrieval. Isolate high-sensitivity tenants into separate indexes. Cosine similarity is not an access-control list.

Do not put raw secrets into text that will be embedded. Deleting the source file does not delete the vector.

## Hidden Context Will Leak

LLM08:2026: design so disclosure of the system prompt, the tool schemas, and the policy text has little security impact. Severity is high when the prompt holds a credential, or when the application relies on the prompt staying secret to enforce authorization.

```tsx
// FAIL — hiding the rule is the rule
const system = `Users with the string "${process.env.ADMIN_TOKEN}" in their message are admins.`

// PASS — admin is a session claim checked in the broker
export async function adminSummary() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') throw new Error('Unauthorized')
  return summarizeWithoutTools(await listTenantMetrics(user.tenantId))
}
```

Tool schemas will be visible to anyone who can talk to the model. Keep them narrow because they will be read, not because you hope they stay hidden.

## The Model Does Not Attest to the World

LLM07:2026 is misinformation that is credible enough for a person or a workflow to act on. An agent that reports a backup succeeded, when it did not, is the OWASP scenario. Check the fact in your own system.

```tsx
// FAIL — the chat message is the operations log
export async function nightly() {
  const report = await model.complete({ input: 'Confirm the backup finished.' })
  await postToSlack(report.output_text)
}

// PASS — the backup system returns a status. The model may explain it.
export async function nightly() {
  const backup = await getBackupStatus()
  if (backup.state !== 'succeeded') throw new Error('Backup failed')
  const text = await summarizeWithoutTools(JSON.stringify(backup))
  await postToSlack(`Backup ${backup.id} succeeded. ${text}`)
}
```

The Slack line's authority is `backup.state`, which came from the backup system. The sentence is decoration.

Code the model writes is untrusted output. Merge it through review. A pipeline that compiles and deploys model output with no human and no tests is OWASP LLM10 scenario 6.

## Logs, Headers, and Recipients

```tsx
// FAIL — the trace is a second copy of the prompt and the tool arguments
console.log('tool', name, JSON.stringify(raw))

// PASS — log the decision. Keep the payload in the system that already stores it.
console.log(JSON.stringify({ tool: name, userId: user.id, outcome: 'allowed' }))
```

Observability products often store full prompts by default (OWASP LLM02:2026). Turn that off, or give the trace store the same access control as the source. A debug flag that prints the system prompt into the browser is LLM08 with a wider audience.

Model text in an email is untrusted content in someone else's client. Escape it for that format. Your code chooses the recipient and the subject. A model-chosen `to` address is enough to move data out. OWASP LLM10 scenario 2 is that path. Sending still goes through an approval row in [Human Approval](human-approval.md).

```tsx
const Draft = z.object({ bodyText: z.string().max(5_000) })

export async function saveSupportDraft(raw: unknown) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  const draft = Draft.parse(raw)

  await db.insert(drafts).values({
    userId: user.id,
    to: user.email,
    subject: 'Your request',
    bodyText: draft.bodyText,
  })
}
```

## Side Channels, Briefly

LLM02:2026 lists timing, token length, and shared caches as disclosure channels in multi-tenant model hosting. If you run a shared inference stack, do not share a cache across tenants, and do not return log probabilities to untrusted callers. Application teams who call a vendor API still control what they send. Minimize it.

A code-execution tool is also an output sink. The visible answer can look harmless while the tool makes a network call. That is why [Tool and Agency](tool-and-agency.md) does not offer a general code tool, and why a sandbox that can reach the internet is still an exfiltration path.

## Review Checklist

- [ ] No model string is executed as SQL, shell, or HTML
- [ ] Recipients and subjects are chosen by application code
- [ ] Logs and traces do not store prompts, secrets, or raw tool arguments
- [ ] Filter choices are enums mapped in the broker
- [ ] Markdown images, iframes, and link previews from model output do not fetch on their own
- [ ] Control characters are stripped before terminal or log sinks
- [ ] Vector search includes the tenant and the owner in the query
- [ ] Prompts and traces in observability tools are access-controlled
- [ ] Shell history is not shipped to a model provider
- [ ] The system prompt and tool list contain no secrets and are not the authorization check
- [ ] Facts that gate a workflow come from your systems, not from the model's report
- [ ] Embeddings of sensitive text are protected as if they were the text

## Sources

- OWASP Top 10 for LLM Applications 2026, LLM02, LLM07, LLM08, LLM09, LLM10
- [The Injection, week 43 of 2026](https://theinjection.dev/week/2026-w43/), goose CVE-2026-111079
- [api-security](../../api-security/SKILL.md) for CSP, output encoding neighbors, and SSRF allowlists
