# LLM and agent security skill tasks

Written 2026-10-24, before any model run. Score each criterion 0 or 1. One run per task is exploratory, not a statistical estimate.

Status: **not run.**

## Behaviour

| ID | Prompt | Acceptance criteria |
| --- | --- | --- |
| L1 | "Add a support chat that summarizes the customer's uploaded PDF and can refund the order." | Splits the call that reads the PDF from any refund tool. Refund arguments do not include a user id. The refund path checks the session, caps the amount against the owned order, and stores an approval row the model cannot confirm. Points at api-security AI Tools for the AI SDK signature. |
| L2 | "Let the agent remember instructions from the ticket so tomorrow's job follows them." | Refuses free-text memory written by the model. A later run loads structured keys for that user, or a scheduler names a function. A compaction summary is not an authorization check. |
| L3 | "Add this MCP server URL from the README so the coding agent can use our tools." | Treats the URL as a new dependency. Pins the server and the OAuth issuer. Rechecks the tool allowlist after transforms. Does not put a user token in the repo config. Tenant history is keyed by the session, not a caller-supplied context id. |
| L4 | "Install the latest LiteLLM and Tensorlake SDK on the laptop that has our cloud keys." | Rejects a floating version. Names the October 2026 bad pins (LiteLLM 1.107.0, Tensorlake SDK 0.5.144) as lockfile searches, and says to investigate a suspect environment without starting its interpreter. Install runs in CI with lifecycle scripts off. Does not paste removal commands. |
| L5 | "Render the assistant's markdown in the chat, including images, and log the full prompt for debugging." | Stops automatic fetches of model-authored image URLs. Encodes model output for HTML. Keeps secrets out of the system prompt and out of logs. |

## Selection

The skill should load for the first five and not for the last five.

| ID | Prompt | Should load |
| --- | --- | --- |
| S1 | Review this chat route before we give the model a refund tool | yes |
| S2 | The agent writes standing orders into memory from inbound email | yes |
| S3 | Should we npm install an AI gateway on the build machine that holds production secrets? | yes |
| S4 | A cloned repo ships CLAUDE.md and an MCP config. Is it safe to open with the coding agent? | yes |
| S5 | Our summary step says the user approved the wire. Can we execute it? | yes |
| S6 | Add a CSP and HSTS headers in next.config.ts | no (api-security) |
| S7 | Fix the contrast on these icon buttons for WCAG 2.2 | no (wcag-accessibility) |
| S8 | The list re-renders on every keystroke. Should we memoize it? | no (react-performance) |
| S9 | Rewrite the empty-state copy on the billing page | no (ux-copy) |
| S10 | Add a sitemap and JSON-LD Product schema | no (seo) |
