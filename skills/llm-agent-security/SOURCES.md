# Sources

Checked 2026-10-24. Incident dates below are the dates in the reports. Pins and "no fix yet" notes go stale. Re-read the vendor page before freezing a lockfile.

| Source | What this skill uses it for |
| --- | --- |
| OWASP Top 10 for LLM Applications 2026, GenAI Security Project | LLM01–LLM10 titles, the intrinsic-injection position, lethal trifecta, Rule of Two, mitigations cited in the resources |
| OWASP Top 10 for Agentic Applications 2026, GenAI Security Project | ASI01–ASI10 titles and the mitigation lists the resources follow |
| [LLM Prompt Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html) | Where it still treats a delimiter or a filter as the boundary, the skill follows LLM01:2026 instead |
| [AI Agent Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html) | Tool and agent checklist, same precedence rule |
| [The Injection, week 43 of 2026](https://theinjection.dev/week/2026-w43/) | Index for 19–25 October 2026. Vendor pages win when they exist |
| [Microsoft, LiteLLM 1.107.0](https://www.microsoft.com/en-us/security/blog/2026/10/23/inside-the-litellm-1-107-0-supply-chain-compromise-credential-theft-through-python-startup-hooks/) | Startup-hook impact and the "do not start the interpreter" containment rule. Published 2026-10-23 |
| [The Register, Tensorlake SDK and Shai-Hulud](https://www.theregister.com/security/2026/10/08/shai-hulud-worm-makes-jump-to-ai-infrastructure-with-tensorlake-compromise/5302054) | Install script outside the agent sandbox. Published 2026-10-08. Follow-up version named there is 0.5.145 |
| [The New Stack, OpenAI self-replicating injection research](https://thenewstack.io/openai-self-replicating-injections/) | Research finding published 2026-09-28. No impact claimed outside evaluation |

The Injection's week note names litellm 1.106.2 as a rollback pin. That pin is not treated as permanent here. Confirm it with Microsoft and the LiteLLM project.

Historical cases (EchoLeak, Invariant Labs, General Analysis, postmark-mcp, Amazon Q VS Code) are cited the way the 2026 OWASP documents cite them. This file does not re-verify those 2025 reports beyond the OWASP scenarios.

Next.js tool-handler details, including signed AI SDK approvals, are owned by [api-security AI Tools](../api-security/resources/ai-tools.md) and its own source note.
