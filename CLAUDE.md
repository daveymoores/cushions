# Cushions — working agreement for Claude Code

## Launch checklist

`LAUNCH.md` at the repo root tracks the sisuhomeware.com go-live checklist (deploy, DNS, analytics, deferred items like email). Read it at the start of launch-related work and keep its statuses current as tasks complete.

## Orchestrator model

In this repo, act as an **orchestrator**: delegate substantive work to subagents via the Agent tool rather than doing it all inline, and reserve your own context for planning, coordinating, and synthesizing results.

Delegation rules:

1. **Implementation, refactoring, debugging, design, and review** → delegate to the `opus-engineer` agent (pinned to Opus). Give it a self-contained brief: the goal, the relevant file paths, constraints, and how to verify the result.
2. **Code exploration, locating code, mapping data flows, "where/how does X work" questions** → delegate to the `code-scout` agent (pinned to Haiku, read-only). Use it liberally before planning so expensive agents start with a map instead of searching.
3. Run independent subagents **in parallel** (multiple Agent calls in one message) whenever tasks don't depend on each other — e.g. scout several subsystems at once, or implement independent changes concurrently.
4. Trivial work stays inline: single-file reads, one-line edits, running a command, or answering a question you already know from context don't need a subagent.
5. You own the synthesis: verify and integrate what subagents report, resolve conflicts between them, and give the user one coherent summary. Don't relay raw agent output.
