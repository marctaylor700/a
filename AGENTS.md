# AGENTS.md — Lemur Facts

**Single source of truth** for Grok (and Claude Code if used). `CLAUDE.md` is a short pointer only.

Madagascar lemur field guide: Flask + SQLite seed (`init_db.py`) + static SSG (`build.py` → `docs/` for GitHub Pages). Quiz, conservation, and species pages included.

## Ruflo + Grok (not Claude models)

[Ruflo](https://github.com/ruvnet/ruflo) is the **coordination harness** (memory, swarm topology, hooks). **Grok** is the model that plans and executes.

| Layer | Who | How |
|-------|-----|-----|
| Models / workers | **Grok** | Parent session + `spawn_subagent` with `.grok/agents/*` |
| Coordination | **Ruflo MCP** | `ruflo__memory_*`, `ruflo__swarm_*`, `ruflo__hooks_*` |
| MCP enable | User scope | `~/.grok/config.toml` → `[mcp_servers.ruflo]` (works without folder-trust) |
| Hive profile | This repo | `.claude-flow/profiles/lemurs-swarm.json` + `.grok/agents/*` |

Do **not** run `npx ruflo init --force` (overwrites project docs).  
Do **not** use Anthropic `agent_execute` for normal work — use Grok `spawn_subagent`.

Tools appear as `ruflo__*` after MCP connects (**new session** or `/mcps` refresh). Discover with ToolSearch / MCP list.

Optional: trust this folder (`/hooks-trust` or `grok --trust`) then uncomment project `[mcp_servers.ruflo]` in `.grok/config.toml` to pin hive env only here.

Profile: `.claude-flow/profiles/lemurs-swarm.json`  
Skill: `lemurs-swarm`  
Memory namespace: `lemurs`

## Project rules

- Do what was asked; nothing more
- Prefer editing existing files over creating new ones
- No docs unless requested
- Paths: `init_db.py`, `app.py`, `build.py`, `templates/`, `static/`, `docs/` (generated), `.github/`
- ALWAYS read a file before editing
- NEVER commit secrets or `.env`
- Keep files under 500 lines when practical (`init_db.py` seed data is the exception)
- **`init_db.py` is the single source of truth** for species, facts, and quiz — never invent fields only in templates or `docs/`

## Stack map

| Area | Path |
|------|------|
| Species + facts + quiz seed | `init_db.py` → `lemurs.db` |
| Live Flask app | `app.py` |
| Static generator | `build.py` → writes `docs/` |
| Templates | `templates/*.html` (Jinja2; CSS in `base.html`) |
| Images | `static/images/` → `docs/images/` |
| Client JSON | `docs/data/facts.json`, `docs/data/species.json`, `docs/data/quiz.json` |
| Deploy | `.github/workflows/deploy.yml` |

## Build & verify

```bash
python3 build.py
# optional live: flask --app app run   (needs flask installed)
# optional static: python3 -m http.server -d docs 8000
```

Never hand-edit `docs/` as source of truth.

## Swarm roster (Grok subagents)

| Domain | `subagent_type` | Owns |
|--------|-----------------|------|
| Species / facts seed | `lemur-data` | `init_db.py` tables `lemur_species`, `lemur_facts` |
| Quiz bank | `quiz-content` | `init_db.py` `quiz_questions` (serial with data/content) |
| Flask / API | `flask-app` | `app.py`, live routes + JSON APIs |
| SSG pipeline | `site-builder` | `build.py`, deploy workflow, `docs/` regen |
| Templates / CSS | `site-ui` | `templates/`, `static/` (except pure image drops) |
| Scientific copy | `content-facts` | Fact accuracy, IUCN wording (serial on `init_db.py`) |
| Image assets | `image-assets` | `static/images/**` naming + gaps |
| General impl | `coder` | Cross-cutting multi-file |
| Build gate | `tester` | `python3 build.py` + integrity checks |
| Review | `reviewer` | Data integrity, a11y, deploy safety (read-oriented) |
| Impact map | `researcher` | Read-only impact analysis |

**Coordinator** = this parent Grok session (plans/merges; does not hog domain files when specialists are spawned).

Settings: hierarchical-mesh · max **12** · specialized · memory ns **`lemurs`**

## When to swarm

| Yes | No |
|-----|-----|
| 3+ files, new species, quiz packs, API + UI, design system, build pipeline | Single fact tweak, 1–2 line CSS, pure Q&A |

## Playbook (Grok)

1. `ruflo__memory_search` — prior patterns (namespace `lemurs` / `patterns`).
2. `ruflo__swarm_init` if needed (`hierarchical-mesh`, max 12, specialized).
3. Split domains — never two agents writing the same path (esp. `init_db.py`).
4. One turn: N× `spawn_subagent` with `background: true` and scoped prompts.
5. Collect via `get_command_or_subagent_output`; merge handoffs.
6. `tester` → `reviewer` before ship.
7. `ruflo__memory_store` what worked under namespace `lemurs` or `patterns`.

### Workflow presets

| Intent | Spawn |
|--------|--------|
| New species | lemur-data → content-facts → image-assets → site-builder → tester |
| Quiz pack | quiz-content → flask-app → site-ui → tester |
| Visual / layout | site-ui → tester → reviewer |
| API / live routes | flask-app → tester → reviewer |
| Build / JSON / Pages | site-builder → tester |
| Fact cleanup | content-facts → lemur-data → tester |
| Cross-cutting | researcher → coder → tester → reviewer |

## Anti-patterns

- Spawning every agent on a one-file fix
- Two writers on `init_db.py` in parallel
- Using Ruflo daemon / Anthropic managed agents for normal Grok work
- Hand-editing `docs/` instead of `python3 build.py`
- `npx ruflo init --force` (overwrites AGENTS.md / CLAUDE.md)
- Inventing `image_filename` values without a file under `static/images/`
