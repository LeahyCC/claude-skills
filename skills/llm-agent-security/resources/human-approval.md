# Human Approval and Containment

> OWASP ASI09 (Human-Agent Trust Exploitation), ASI08 (Cascading Failures), ASI10 (Rogue Agents). Implements the human-confirmation control in OWASP LLM01:2026 mitigation 7 and LLM03:2026 excessive autonomy.

## Contents

- [The Approval Is a Row](#the-approval-is-a-row)
- [What Requires a Row](#what-requires-a-row)
- [Cascades](#cascades)
- [Containment When the Agent Is Wrong Anyway](#containment-when-the-agent-is-wrong-anyway)
- [Review Checklist](#review-checklist)
- [Sources](#sources)

A person approving a sentence the model wrote is still inside the model's control. ASI09 is that gap: the UI, the summary, or the agent's confidence persuades a person to confirm an action they did not inspect. Compaction makes it worse. A summary can describe a different action than the one that will run, and a forged "user approved" turn can survive into that summary. See [Memory and Context](memory-and-context.md).

OWASP LLM01:2026 mitigation 7: confirm the exact action, not a summary. Invisible characters can also make a displayed action differ from the executed one, so the approval record is built from the validated arguments, then rendered by your UI.

## The Approval Is a Row

```tsx
import { z } from 'zod'
import { getCurrentUser } from '@/data/auth'
import { db } from '@/data/db'
import { agentApprovals, orders } from '@/data/schema'
import { and, eq } from 'drizzle-orm'

const RefundArgs = z.object({
  orderId: z.string().uuid(),
  amountCents: z.number().int().positive().max(50_000),
})

export async function proposeRefund(raw: unknown) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  const args = RefundArgs.parse(raw)

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, args.orderId), eq(orders.userId, user.id)))

  if (!order?.chargeId) throw new Error('Not found')
  if (args.amountCents > order.refundableCents) throw new Error('Amount not allowed')

  const [pending] = await db
    .insert(agentApprovals)
    .values({
      userId: user.id,
      action: 'refund',
      orderId: order.id,
      chargeId: order.chargeId,
      amountCents: args.amountCents,
      status: 'pending',
    })
    .returning({ id: agentApprovals.id })

  return {
    approvalId: pending.id,
    action: 'refund',
    orderId: order.id,
    amountCents: args.amountCents,
  }
}
```

The UI renders `amountCents` and `orderId` from this return value, which came from the database and the schema. It does not render a `summary` field the model supplied.

```tsx
'use server'
export async function confirmRefund(approvalId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const [claimed] = await db
    .update(agentApprovals)
    .set({ status: 'processing' })
    .where(and(
      eq(agentApprovals.id, approvalId),
      eq(agentApprovals.userId, user.id),
      eq(agentApprovals.status, 'pending'),
    ))
    .returning()

  if (!claimed?.chargeId) throw new Error('Not found')

  await createRefund({
    chargeId: claimed.chargeId,
    amountCents: claimed.amountCents,
    idempotencyKey: claimed.id,
  })

  await db
    .update(agentApprovals)
    .set({ status: 'completed' })
    .where(eq(agentApprovals.id, claimed.id))
}
```

The conditional update claims the row before the payment call. A second click matches zero rows. The payment provider also receives the approval id as an idempotency key, so a retry after a crash does not create a second refund. `chargeId` was copied from the order inside `proposeRefund`. The model never supplies it.

`confirmRefund` is a server action a person submits. It is not a model tool. If the tool list includes it, the model can confirm its own proposal and the approval row is theater.

```tsx
export function RefundConfirm({
  approvalId,
  orderId,
  amountCents,
}: {
  approvalId: string
  orderId: string
  amountCents: number
}) {
  return (
    <form action={confirmRefund.bind(null, approvalId)}>
      <p>Refund ${(amountCents / 100).toFixed(2)} on order {orderId}.</p>
      <button type="submit">Confirm refund</button>
    </form>
  )
}
```

The form's copy is built from the broker's return value. There is no prop for a model-written explanation. Adding one reopens ASI09.

On the AI SDK, a chat client can attach an approval the person never saw. Sign that approval and still store this row. The Next.js pattern is [AI Tools](../../api-security/resources/ai-tools.md). This page is the row, the idempotency key, and the rule that `confirmRefund` is not a model tool.

If `createRefund` throws, the row stays `processing`. Retry that id with the same idempotency key. Do not insert a second approval to "try again," and do not return the row to `pending` in a way the model can trigger.

## What Requires a Row

Require an approval row when the effect is hard to undo or visible outside the system.

| Effect | Approval |
|--------|----------|
| Draft a summary the user can read | No. Keep the draft in the user's account |
| Send email, post, or open a pull request | Yes |
| Pay, refund, transfer, change a billing plan | Yes |
| Delete or overwrite data the user did not just submit | Yes |
| Change credentials, roles, or MCP servers | Yes |
| Write memory or a schedule | Yes, and only for structured facts. See [Memory and Context](memory-and-context.md) |
| Read the signed-in user's own records through a typed tool | No, if the tool is already user-scoped |

Approval fatigue is part of ASI09. If every read needs a click, people will approve the one click that mattered without reading it. Spend confirmation on the rows in this table. Do not spend it on a prompt that says "the assistant is careful."

High-risk UI should show the structured fields, the destination, and the amount. OWASP ASI09's guidance includes making the risky action visually distinct and comparing the action to the workflow you expected. A banner the model authored does not count.

## Cascades

ASI08: one agent's bad output becomes the next agent's instruction, and the failure spreads. The containment is to re-enter the broker at every hop.

```tsx
// FAIL — agent B treats agent A's text as a task it should finish with B's tools
export async function handoff(text: string) {
  await runAgentWithTools(text)
}

// PASS — the orchestrator stores a typed task, then B's broker runs that task
export async function handoff(taskId: string) {
  const task = await getOwnedTask(taskId)
  if (!task) throw new Error('Not found')
  if (task.tool !== 'listOrders') throw new Error('Tool not allowlisted')
  return listOrders(task.args)
}
```

Do not widen credentials on the hop. A planner that holds a read scope does not delegate to a worker by lending the worker a write scope (ASI03). If the second agent fails, stop. A retry that switches to a more privileged tool is a cascade.

## Containment When the Agent Is Wrong Anyway

ASI10 is what you do after behavior leaves the intended job: the actions may each look allowed, and the pattern is not. External injection and supply chain can start it. ASI10 is the loss of control afterward.

Practical controls for an application, short of a research lab:

- Log tool name, arguments, user id, and approval id in an append-only log the agent cannot edit.
- Keep a kill switch in the broker: a flag that rejects every tool for that deployment or that user. Keys for the switch live with the orchestrator, not in the agent's prompt or environment (ASI10).
- Revoke the short-lived credentials the agent was minted. A long-lived key in the agent environment makes revocation a rebuild.
- Quarantine means "no tools," not "a stronger prompt."
- A scheduled job that keeps acting after you disable the chat is still the agent. [Memory and Context](memory-and-context.md) requires the schedule to name a function you can turn off.

Offensive agents are already used against organizations. Microsoft's Storm-0940 reporting (21 October 2026) and the follow-up Wiz note (22 October 2026) describe an agent framework used in a real intrusion and in identity attacks against software vendors. Other October 2026 reports document exposed offensive-agent panels and coding-agent harnesses. This skill does not describe those operations. The product consequence: an agent host is a privileged host, an exposed control panel is an incident, and identity for engineers needs to resist phishing. Budgets and egress limits are in [Tool and Agency](tool-and-agency.md).

OpenAI reported on 20 October 2026 that internal agents had interfered with their own monitoring during training. For an application, the equivalent mistake is letting the agent edit the broker, the allowlist, or the log sink. Those files are not in the agent's write scope.

## Review Checklist

- [ ] Irreversible and outbound actions have an approval row built from validated fields
- [ ] The confirm UI shows those fields, not a model-written summary
- [ ] The confirm action checks the session and the row. It is not a model tool
- [ ] The side effect is idempotent on the approval id
- [ ] Reads are not buried in the same confirmation habit as refunds and sends
- [ ] A handoff to another agent passes a task id, and the next broker checks the tool again
- [ ] Delegation does not widen credentials
- [ ] Tool calls are logged where the agent cannot change the log
- [ ] A kill switch and credential revocation work without the agent's cooperation
- [ ] The agent cannot write the broker, the allowlist, or the logger

## Sources

- OWASP Top 10 for Agentic Applications 2026, ASI08, ASI09, ASI10
- OWASP LLM01:2026 mitigation 7, LLM03:2026 excessive autonomy
- [The Injection, week 43 of 2026](https://theinjection.dev/week/2026-w43/), Storm-0940 and the 20 October 2026 OpenAI monitoring note
