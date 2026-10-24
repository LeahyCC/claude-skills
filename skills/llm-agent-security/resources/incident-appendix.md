# Incident Appendix

## Contents

- [How to Use an Entry in Review](#how-to-use-an-entry-in-review)
- [October 2026](#october-2026)
- [Already on the Record Before October 2026](#already-on-the-record-before-october-2026)
- [Offensive Agents as a Class](#offensive-agents-as-a-class)
- [Version Pins to Re-Check](#version-pins-to-re-check)
- [Sources](#sources)

Cases below are containment lessons. Each one names the impact and the control. Reproduction, payloads, and removal command sequences stay in the linked report.

Week 43 of 2026 is 19–25 October. [The Injection](https://theinjection.dev/week/2026-w43/) tracked 38 AI-security stories that week, 8 high or critical, 11 with CVEs. It is an index. Where a vendor report exists, prefer it. Check dates for the pins below are in [SOURCES.md](../SOURCES.md). Re-read the vendor report before you freeze a version.

## How to Use an Entry in Review

| If the change… | Open |
|----------------|------|
| Adds an AI package, model gateway, or install script | LiteLLM, Tensorlake, datasets |
| Lets a model read mail, pages, tickets, or repos and then act | Trust-boundary cases and self-copying instructions |
| Adds MCP, A2A, a gateway, or multi-tenant agent state | FastMCP through LangGraph |
| Treats a summary or a memory row as permission | Compaction, memory injection, CarryoverBench |
| Runs an agent server, a repo config, or a terminal integration | AgenticSeek, Aider, goose |
| Bills a model API from a cloud account | LLMjacking |

## October 2026

### LiteLLM 1.107.0 — startup hook, no import required

| | |
|--|--|
| When | Release published 21 October 2026. Socket dates the intrusion to 10 October. Microsoft's analysis is 23 October |
| What | All seven wheels and the v1.107.0 container images. Python could run the added startup logic even when nothing imported LiteLLM. Collector targeted cloud, developer-tool, browser, and LiteLLM proxy credentials. A separate loader could fetch later code. Microsoft reported no confirmed second-stage run at the time of analysis |
| Ids | LLM04, ASI04, ASI05 |
| Control | Hash-pin gateways. Install them in isolated CI. Investigate a suspect host without starting its interpreter. Rebuild from a clean artifact. Rotate secrets from a clean machine. Follow Microsoft's advisory for the file-level steps |
| Sources | [Microsoft](https://www.microsoft.com/en-us/security/blog/2026/10/23/inside-the-litellm-1-107-0-supply-chain-compromise-credential-theft-through-python-startup-hooks/), [The Injection](https://theinjection.dev/week/2026-w43/) |

The Injection's week note names 1.106.2 as the pin to roll back to. Confirm that pin against Microsoft and the LiteLLM project before you freeze a lockfile. This skill does not copy their deletion commands.

### Tensorlake SDK 0.5.144 — worm on the install, outside the sandbox

| | |
|--|--|
| When | 8 October 2026 |
| What | Shai-Hulud variant in the npm SDK, detected within minutes and removed. The Register describes credential theft and self-propagation, and notes the install script runs on the developer or CI host. The platform sandbox around agent code does not cover that install. Vendor follow-up cited in the article: 0.5.145 |
| Ids | LLM04, ASI04, ASI05 |
| Control | Exact pin, lockfile, lifecycle scripts off, install job without production credentials. If 0.5.144 appears in a lockfile, rebuild and rotate using the Socket and vendor guidance. This variant has been reported to react to revocation. Read that guidance before rotating |
| Source | [The Register](https://www.theregister.com/security/2026/10/08/shai-hulud-worm-makes-jump-to-ai-infrastructure-with-tensorlake-compromise/5302054) |

### Storm-0940 — an agent framework in a real intrusion

| | |
|--|--|
| When | 21 October 2026 (Microsoft). 22 October 2026 (Wiz, campaign widened) |
| What | Microsoft attributes the ConnectWise Cloud Backup compromise to Storm-0940 and says the actor used the ARTEX agent framework in sign-in attempts against more than 2,250 Microsoft 365 tenants. Wiz reported a related campaign against IT and software vendors' identity providers, aimed mostly at software engineers |
| Ids | ASI03, ASI10 |
| Control | This is an attacker using an agent, not a prompt bug in your chat UI. Engineer identity resists phishing. Agent hosts do not hold standing admin tokens. An exposed agent control panel is an incident. Do not pull operational detail into the product repo |
| Source | [The Injection week 43](https://theinjection.dev/week/2026-w43/), citing Microsoft and Wiz |

### Self-replicating prompt injection — research, not a claimed internet worm

| | |
|--|--|
| When | Found in June 2026. Published 28 September 2026 |
| What | OpenAI described injections that try to get a model to copy the instruction into later emails, files, or comments, including multi-hop cases that pick up a second message. The New Stack reports OpenAI's statement that there was no impact outside simulated tool calls in training and evaluation |
| Ids | LLM01, ASI01, ASI06 |
| Control | No free-form send, commit, or file tool. Outbound products are structured fields. See [Memory and Context](memory-and-context.md) |
| Source | [The New Stack](https://thenewstack.io/openai-self-replicating-injections/), 28 September 2026 |

### Compaction, memory, and the next session

| Case | When | What was reported | Control |
|------|------|-------------------|---------|
| Compaction laundering (Pixee) | 21 Oct 2026 | A forged user turn survived compaction in five coding agents that flatten history to text. The forged turn entered agent memory in 87–100% of their runs | Authorization reads a database row, never a summary |
| Memory injection (USP and UDESC) | 20 Oct 2026 | Planted instructions in ChatGPT, Claude, and Gemini long-term memory persisted into later sessions | The model cannot write memory. Facts are structured keys |
| CarryoverBench | 20 Oct 2026 | Injections re-fired through a heartbeat or long-term memory after the attacker was gone. Authors reported no decay over five later rounds | Scheduled jobs name a function |

Ids: ASI06, ASI09, LLM05. Index: [The Injection week 43](https://theinjection.dev/week/2026-w43/). The papers are the primary source for the percentages. Re-read them before quoting the numbers in a security review.

### Man-in-the-model gateways

| | |
|--|--|
| When | 22 October 2026 |
| What | HiddenLayer showed a party who controls an LLM gateway or inference server inserting tool calls into a coding agent's stream. The user does not see the calls. The model did not request them |
| Ids | ASI02, ASI07, LLM04 |
| Control | The agent process allowlists tool names and validates arguments. A gateway is a pinned, privileged dependency |
| Source | [The Injection week 43](https://theinjection.dev/week/2026-w43/), citing HiddenLayer |

### MCP, mesh, and mixed tenants

| Case | Id | What | Control |
|------|----|------|---------|
| FastMCP tool transform | CVSS 6.8 in The Injection's summary. Fixed in 3.4.10 and 4.1.2 | Authorization ran before a transform. The transformed tool was not checked again, so a denied tool could still run | Allowlist the tool you are about to call |
| FastMCP OAuth issuer | CVSS 5.9. Fixed in 4.1.2 | Machine-to-machine OAuth did not pin the issuer. A server could advertise its own and receive the client secret | Pin the issuer in your config |
| Google Agent Mesh | CVE-2026-103091, plus a second critical flaw in the same 19 Oct 2026 advisory, for bugs fixed in September | An unauthenticated peer could enroll and call tools on connected MCP backends | Authenticated enrollment. No open mesh |
| opencode on Windows | Fixed in 1.18.33. No CVE, so scanners miss old installs | A remote MCP server's OAuth endpoint could cause the client to run commands | The client chooses the authorization endpoint. A server reply is not a command |
| Strands Agents A2A | CVE-2026-115419. Patched | History was shared across callers with different context ids | Key history by the authenticated user |
| LangGraph stores | CVE-2026-115883. Patched | Namespace labels joined with a dot, so one label could collide with another tenant | Store a structured namespace you assign |
| MLflow scorer | CVE-2026-115886. Fixed in 3.17.0 | Unauthenticated invoke made the server fetch an arbitrary URL | Authenticate the endpoint. Allowlist URLs. See api-security |
| AWS MCP `run_script` | CVE-2026-115845 | An authenticated user could run code in their own sandbox because a script tool relied on a block list. AWS said the fix is server-side | Do not offer a general code tool. A block list is not a sandbox |

Index for this table: [The Injection week 43](https://theinjection.dev/week/2026-w43/). Confirm CVSS and fix versions there or in the vendor advisory before you cite them externally. They were current in that index on 24 October 2026.

### Agent config, debug servers, and shell history

| Case | Id | What | Control |
|------|----|------|---------|
| Aider `.aider.conf.yml` | CVE-2026-115726. No fixed version named in the 23 Oct report | 0.86.2 and earlier runs shell commands from the repo config with no trust prompt | Do not load agent config from an untrusted tree |
| AgenticSeek | CVE-2026-115727. Fix cited as commit 409840c | Flask debug mode left on and bound widely, which is remote code execution for anyone who can reach the port | Debug off. Private bind. Authenticate the service |
| goose terminal integration | CVE-2026-111079. No fix listed | Opt-in integration sent shell commands to the model provider unsanitized | Do not ship shell history to a model |
| Hugging Face Datasets | CVE-2026-57845. No fixed release in the 23 Oct report | 5.1.0 and earlier could run a dataset file through the deprecated pandas builder | Do not load untrusted datasets with an executable builder |
| Agent skills and PHP2Shell | AIR Security, 22 Oct 2026 | 88 skills in 65 repos still installed PHP versions missing the 21 Oct fix | A skill that installs a runtime is a dependency change. Pin a patched build |
| Expired domains in agent search | AIR Security, 23 Oct 2026 | 36 sites still returned to agents sat on domains nobody owned | Search hits and fetched HTML are untrusted data |
| Hidden instructions on help pages | Redact, 19 Oct 2026 | 102 reader-invisible instruction blocks across 80 WhatsApp help pages. WhatsApp said it was a bug and fixed it | Hidden text in a fetch is still model input |
| LLMjacking | Wiz CIRT, 20 Oct 2026 | Cloud access obtained through search-ad phishing, then the victim's billing paid for someone else's Gemini calls, in the tens to hundreds of thousands of dollars | Model APIs are a payment instrument. Budgets, billing alerts, phishing-resistant cloud admin |

## Already on the Record Before October 2026

One paragraph each. The primary citation OWASP uses is enough. Do not add a local proof-of-concept.

**EchoLeak (2025).** A crafted email drove Microsoft 365 Copilot to exfiltrate mailbox data without the user opening it. OWASP cites Aim Security (Reddy & Gujral, 2025) under LLM01 scenario 7 and ASI01. Inbound mail is data. The reader has no exfiltration tool.

**Poisoned GitHub issue (Invariant Labs, 2025).** A public issue contained instructions a developer's MCP-connected agent followed with access to private repositories. OWASP LLM01 scenario 9. The call that reads attacker-writable text does not hold the user's elevated tools.

**Supabase MCP with `service_role` (General Analysis, 2025).** Same OWASP scenario. The MCP server bypassed row-level security because the credential was an admin. Tools use the end user's scope.

**`postmark-mcp` (Koi Security, 2025).** A malicious npm MCP server copied mail to an unintended recipient, cited by OWASP as affecting a large number of organizations. Pin MCP packages. Review the tool list. Grant the narrow mail scope.

**Amazon Q VS Code extension (July 2025).** A poisoned prompt was committed to the extension repo and shipped. AWS reverted it. The committed payload did not run, because of a syntax error (OWASP LLM01 scenario 8, ASI04). Agent instructions in a repository are production code.

**Instruction files in a working tree.** Coding agents treat `CLAUDE.md`, `AGENTS.md`, `.cursor/rules`, and similar files as policy. A file in a cloned repo is untrusted content until a person reviews it. Do not auto-approve tools in that tree. This is the builder surface of the same bug as a poisoned README.

## Offensive Agents as a Class

October 2026 reporting also included exposed offensive-agent panels and coding-agent harnesses used by intrusion operators (The Injection week 43, citing Unit 42, CrowdStrike, Straiker, Wiz, and NorForge). The product rules are in [Human Approval](human-approval.md). This appendix does not collect their tooling, prompts, or bypasses.

## Version Pins to Re-Check

| Pin | Status on 24 October 2026 | Where to confirm |
|-----|---------------------------|------------------|
| litellm 1.107.0 | Compromised release | Microsoft advisory |
| litellm 1.106.2 | Named as a rollback pin by The Injection, not copied here as a permanent truth | LiteLLM project and Microsoft |
| Tensorlake SDK 0.5.144 | Malicious npm release, removed | The Register / Socket |
| Tensorlake SDK 0.5.145 | Vendor follow-up cited by The Register | Tensorlake release notes |
| FastMCP 3.4.10 and 4.1.2 | Fixes for the transform and issuer bugs | FastMCP advisories |
| opencode 1.18.33 | Fix for the Windows MCP OAuth issue | Anomaly / opencode notes |
| MLflow 3.17.0 | Fix for CVE-2026-115886 | MLflow |
| Aider 0.86.2 and earlier | Vulnerable. No fix named in the index | VulnCheck CVE-2026-115726 |
| Hugging Face Datasets 5.1.0 and earlier | Vulnerable. No fix named in the index | CVE-2026-57845 |

## Sources

- [The Injection, week 43 of 2026](https://theinjection.dev/week/2026-w43/)
- [Microsoft on LiteLLM 1.107.0](https://www.microsoft.com/en-us/security/blog/2026/10/23/inside-the-litellm-1-107-0-supply-chain-compromise-credential-theft-through-python-startup-hooks/)
- [The Register on Tensorlake and Shai-Hulud](https://www.theregister.com/security/2026/10/08/shai-hulud-worm-makes-jump-to-ai-infrastructure-with-tensorlake-compromise/5302054)
- [The New Stack on OpenAI's self-replicating injection research](https://thenewstack.io/openai-self-replicating-injections/)
- OWASP Top 10 for LLM Applications 2026, scenarios cited inline
- OWASP Top 10 for Agentic Applications 2026, ASI01 and ASI04 historical cases
