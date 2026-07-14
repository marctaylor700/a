---
name: lemurs-swarm
description: >
  Run the Lemur Facts multi-agent swarm from Grok. Use when the user says
  "swarm", "use the swarm", "hive", "whole team", "parallel agents", multi-domain
  work, or coordinated multi-file features. Ruflo coordinates; Grok
  spawn_subagent executes via project agents (.grok/agents).
---

# Lemurs Swarm Team (Grok-native)

## Model note

**You are Grok.** Workers are Grok subagents. Ruflo MCP is memory/swarm/hooks only —
do not try to run work through Claude or `agent_execute`.

## Roster (spawn only what the task needs)

| Domain | `subagent_type` | Owns (summary) |
|--------|-----------------|----------------|
| Species / facts seed | `lemur-data` | `init_db.py` species + facts |
| Quiz bank | `quiz-content` | `init_db.py` quiz_questions (serial) |
| Flask / API | `flask-app` | `app.py` |
| SSG / deploy | `site-builder` | `build.py`, Pages workflow, `docs/` regen |
| Templates / CSS | `site-ui` | `templates/`, `static/` |
| Scientific copy | `content-facts` | Fact/IUCN accuracy (serial on `init_db.py`) |
| Images | `image-assets` | `static/images/**` |
| General | `coder` | Cross-cutting multi-file |
| Build gate | `tester` | `python3 build.py` + integrity |
| Review | `reviewer` | Ship gate (read-oriented) |
| Impact map | `researcher` | Read-only research |

**Coordinator** = this parent Grok session.

Profile: `.claude-flow/profiles/lemurs-swarm.json`  
Settings: hierarchical-mesh · max **12** · specialized · memory ns **`lemurs`**

## Playbook

1. **`ruflo__memory_search`** — prior patterns (`lemurs` / `patterns`).
2. **`ruflo__swarm_init`** if needed (`topology: hierarchical-mesh`, `maxAgents: 12`, `strategy: specialized`).
3. **Split domains** — never two writers on `init_db.py` or the same template.
4. **One turn, N× `spawn_subagent`** with `background: true`, scoped prompts, correct `subagent_type`.
5. **Collect** via `get_command_or_subagent_output`; merge handoffs.
6. **`tester`** then **`reviewer`** before claiming done.
7. **`ruflo__memory_store`** under namespace `lemurs` what worked.

## Workflow presets

| User intent | Spawn |
|-------------|--------|
| New species | lemur-data → content-facts → image-assets → site-builder → tester |
| Quiz pack | quiz-content → flask-app → site-ui → tester |
| Visual / layout | site-ui → tester → reviewer |
| API / live routes | flask-app → tester → reviewer |
| Build / JSON / Pages | site-builder → tester |
| Fact cleanup | content-facts → lemur-data → tester |
| Cross-cutting feature | researcher → coder → tester → reviewer |

## Max-parallel lanes (safe concurrent)

Can run **in the same wave** when paths do not overlap:

- `site-ui` + `flask-app` + `site-builder` (builder only if not regenerating while others touch templates? Prefer UI first then builder)
- `image-assets` + `site-ui` (different files)
- `researcher` / `reviewer` always parallel-safe (read-only)

**Must serialize** on `init_db.py`: `lemur-data` · `content-facts` · `quiz-content`

## Anti-patterns

- Spawning every agent on a one-file fix
- Two writers on `init_db.py` in parallel
- Using Ruflo daemon / Anthropic managed agents for normal Grok work
- Hand-editing `docs/` instead of `python3 build.py`
- `npx ruflo init --force` (overwrites AGENTS.md / CLAUDE.md)
