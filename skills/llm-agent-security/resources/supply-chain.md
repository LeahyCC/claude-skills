# Supply Chain

> OWASP LLM04:2026 (Supply Chain), LLM05:2026 (Data and Model Poisoning), ASI04 (Agentic Supply Chain Vulnerabilities)

## Contents

- [Pin, Hash, and Isolate the Install](#pin-hash-and-isolate-the-install)
- [Install-Time Execution](#install-time-execution)
- [A Skill or a Prompt That Says "Install This"](#a-skill-or-a-prompt-that-says-install-this)
- [Repo-Local Agent Config Is Code](#repo-local-agent-config-is-code)
- [Models, Datasets, and Gateways](#models-datasets-and-gateways)
- [Secrets the Collector Would Have Wanted](#secrets-the-collector-would-have-wanted)
- [CI Installs the Agent SDK](#ci-installs-the-agent-sdk)
- [The Gateway Is Its Own Host](#the-gateway-is-its-own-host)
- [A Bad Pin Is Already in the Tree](#a-bad-pin-is-already-in-the-tree)
- [Kill Switch](#kill-switch)
- [Review Checklist](#review-checklist)
- [Sources](#sources)

LLM04:2026 covers training data, models, adapters, conversion pipelines, and the platforms you deploy through. ASI04 covers the agentic extras: tools, plugins, MCP servers, agent cards, prompts loaded at runtime, and registries. Those components are often chosen while the agent is running, not only at build time.

A sandbox around model-written code does not cover the install that fetched the SDK. The install script runs as the user or the CI job that started it, on a machine that often holds cloud keys and AI tokens. That is the October 2026 pattern.

## Pin, Hash, and Isolate the Install

```json
// FAIL — a floating agent SDK, installed on a laptop that already has cloud credentials
{
  "dependencies": {
    "@example/agent-sdk": "latest"
  }
}
```

```json
// PASS — an exact version, a lockfile, and a hash recorded in CI
{
  "dependencies": {
    "@example/agent-sdk": "1.4.2"
  }
}
```

The PASS is incomplete without CI. The install runs in a job whose credentials can publish that one service, not in a developer environment that also holds personal cloud keys and browser sessions. Turn package lifecycle scripts off unless a specific package has a reviewed reason to run them. Prefer an image digest over a mutable tag (Microsoft's LiteLLM guidance, 23 October 2026).

Admit packages through an internal mirror after review. Re-check hashes at deploy, not only on the day someone first added the dependency (ASI04 mitigations 1, 2, and 7).

## Install-Time Execution

Two October 2026 cases are the spec for this section. Full entries are in the [incident appendix](incident-appendix.md).

**LiteLLM 1.107.0** (published 21 October 2026). Microsoft's 23 October analysis: the wheels and the container images shipped a credential collector that Python could run during interpreter startup, even when the application never imported LiteLLM. Removing the package directory could leave the startup files in place. Microsoft's guidance: find every copy, including caches and mirrors; do not start the affected interpreter to investigate; rebuild from verified artifacts; rotate secrets from a clean machine, including model-provider keys and the proxy's stored credentials. The durable control for everyone else is the pin and the isolated install, not a one-time file deletion copied out of the advisory.

**Tensorlake SDK 0.5.144** (8 October 2026). The Register, citing Socket and SafeDep: a Shai-Hulud variant in the npm SDK for an AI-agent platform. The malicious release was removed quickly. The SDK's install script could run on the developer machine or the build server, outside the platform's sandbox for agent code. Socket's point, quoted in that article: teams isolate generated code and still install the SDK with deployment credentials. Check lockfiles if a range could have resolved to 0.5.144. The vendor's follow-up release reported in that article is 0.5.145. Researchers warned this variant can react badly to credential revocation. Follow the incident write-ups, and rebuild before restoring secrets. This skill does not restate removal commands.

## A Skill or a Prompt That Says "Install This"

AIR Security, reported 22 October 2026, found 88 agent skills across 65 repositories that still installed PHP builds exposed to PHP2Shell (fixed by PHP the day before). An agent that follows the skill will recreate a known defect in a new project.

Review a skill, a `CLAUDE.md`, or an MCP README that tells an agent to install a runtime the same way you review a Dockerfile. The instruction is a dependency change. Pin a patched version in a lockfile. Do not let a fetched document add packages.

This repository's own rule is the strict version: skills are markdown, with no install script and no package. Keep to that. A skill that needs a tool should tell the human to install a pinned version, and the human runs that install in CI.

## Repo-Local Agent Config Is Code

Aider 0.86.2 and earlier runs shell commands taken from a repository's `.aider.conf.yml` with no trust prompt (CVE-2026-115726, VulnCheck, via The Injection, 23 October 2026). That report named no fixed release.

```tsx
// FAIL — cloning is enough to run whatever the repo's agent config says
await execFile('aider', ['--yes', repoPath])

// PASS — untrusted trees are read with tools that do not load agent config
await reviewWithAgentDisabled(repoPath)
```

Opening an untrusted repository is a trust decision on the builder surface. Instruction files and tool config in that tree (`.aider.conf.yml`, `.cursor/rules`, `.mcp.json`, `CLAUDE.md`, `AGENTS.md`) are untrusted content until a person reviews them. Do not auto-approve an agent in a freshly cloned tree.

The historical cousin is the July 2025 Amazon Q VS Code extension case, cited in OWASP LLM01 scenario 8 and ASI04: a poisoned prompt was committed to the extension repository and shipped. The payload did not run, because of a syntax error, and AWS reverted it. The lesson that remains: agent instructions in a repo are production code. Review them. Sign extension releases.

## Models, Datasets, and Gateways

| Artifact | Control |
|----------|---------|
| Model weights and adapters | Pin the digest. A swapped model is LLM04. Do not load weights from a URL the model chose |
| Datasets | Hugging Face Datasets 5.1.0 and earlier could execute a dataset file through the deprecated pandas builder (CVE-2026-57845, via The Injection, 23 October 2026). That report said no fixed release was out yet. Do not load untrusted datasets with a builder that runs file contents |
| RAG plugins and remote prompt templates | A template fetched at runtime is ASI04. Vendor the prompt in your repo and review the diff |
| LLM gateway | A gateway sees prompts and can shape tool calls. Pin it. The LiteLLM case is why the gateway host is a privileged host |
| Agent HTTP server | AgenticSeek shipped with Flask debug mode on and the server bound widely (CVE-2026-115727, fixed in commit 409840c per The Injection). Debug off. Bind a private interface. Authenticate every action |

Poisoned training data is LLM05. If you fine-tune, the training set is a supply-chain artifact: provenance, access control, and a record of what went in. Application memory poisoning is [Memory and Context](memory-and-context.md).

## Secrets the Collector Would Have Wanted

Microsoft's LiteLLM analysis is explicit about scope: a developer machine and a CI runner contain cloud credentials, source-control tokens, AI-tool sessions, SSH material, and the environment of other processes. An agent SDK install inherits that pile.

Give the install job a short-lived token that can read the one registry and write the one artifact. Production database URLs and personal AI sessions stay off that job. Outbound network from the install is an allowlist. Microsoft lists unrestricted outbound HTTP from developer and build hosts as part of the exposure.

If a host did run LiteLLM 1.107.0 or Tensorlake SDK 0.5.144, follow the vendor and Microsoft advisories. Rotate from a clean machine. Do not "check whether it is infected" by starting Python or the package manager inside the suspect environment.

## CI Installs the Agent SDK

The job identity can read the registry and write one artifact. It cannot read production secrets, and it cannot reach the internet except the registry and the artifact store.

```yaml
# .github/workflows/agent-sdk.yml
jobs:
  install:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - run: npm ci --ignore-scripts
      - run: npm rebuild some-reviewed-package
```

`--ignore-scripts` is the default for this repo's CI when an agent SDK is present. `npm rebuild` is the exception, for one package whose script you have read. A postinstall you have not read is the Tensorlake failure mode: the script runs as the CI user, outside any sandbox you later place around model output.

```ini
# .npmrc
ignore-scripts=true
```

Python installs get the same split. A lockfile with hashes, a fresh virtualenv in CI, and no reuse of a developer machine's site-packages. LiteLLM 1.107.0 ran from those site-packages at interpreter startup. A venv created on a laptop that already executed the bad wheel is not a clean environment.

## The Gateway Is Its Own Host

An LLM proxy holds every tenant's provider keys. That process does not share a filesystem with the application that runs model-written tools, and it does not share a filesystem with a developer laptop.

```
CI (pinned digest)  →  gateway image
application hosts   →  call the gateway over TLS
developer laptops   →  no gateway wheel, no production provider keys
```

If the gateway dependency is compromised the way LiteLLM 1.107.0 was, the blast radius is the gateway host and the keys on it. Application hosts that only have a URL and a short-lived client credential are a different incident. Put the gateway in its own network segment with an outbound allowlist to the model providers you actually use.

## A Bad Pin Is Already in the Tree

Search lockfiles for the versions in the [incident appendix](incident-appendix.md) before you add features on top of them. Finding `litellm==1.107.0` or Tensorlake SDK `0.5.144` means you stop and follow the vendor advisory from a clean machine. Starting Python, `pip`, or `npm` inside that tree to "see if it imports" is how the startup hook runs.

After the rebuild, rotate the credentials that host could read. Assume AI-tool sessions and cloud keys on a developer machine were part of that set, because that is the set Microsoft's LiteLLM analysis describes. Do not paste the advisory's file list into a runbook in the application repo. Link the advisory.

## Kill Switch

ASI04 mitigation 8: be able to disable a tool, a prompt, or a remote agent connection across deployments when a pin turns out to be bad. In practice that is a config flag the broker reads, defaulting to off for any server not on the list, plus a lockfile bump. It is not a prompt that says "stop using the compromised tool."

## Review Checklist

- [ ] AI SDK, MCP server, model, and dataset versions are exact and hashed
- [ ] Lifecycle scripts are off, or the one exception is reviewed
- [ ] The install does not run on a host that holds production or personal AI credentials
- [ ] Image tags are digests
- [ ] A cloned repo cannot run agent config or connect MCP servers by itself
- [ ] Skills and instruction files that install runtimes are reviewed as dependency changes
- [ ] Untrusted datasets are not loaded by a builder that executes file contents
- [ ] Agent servers are not in debug mode and are not open to the world
- [ ] There is a way to disable a bad tool pin without editing a prompt
- [ ] Incident response for a known-bad version follows the vendor advisory from a clean machine

## Sources

- OWASP Top 10 for LLM Applications 2026, LLM04:2026 Supply Chain, LLM05:2026 Data and Model Poisoning
- OWASP Top 10 for Agentic Applications 2026, ASI04
- [Microsoft, LiteLLM 1.107.0](https://www.microsoft.com/en-us/security/blog/2026/10/23/inside-the-litellm-1-107-0-supply-chain-compromise-credential-theft-through-python-startup-hooks/), 23 October 2026
- [The Register, Tensorlake SDK and Shai-Hulud](https://www.theregister.com/security/2026/10/08/shai-hulud-worm-makes-jump-to-ai-infrastructure-with-tensorlake-compromise/5302054), 8 October 2026
- [The Injection, week 43 of 2026](https://theinjection.dev/week/2026-w43/)
- OWASP LLM01 scenario 8 (Amazon Q VS Code extension, July 2025)
