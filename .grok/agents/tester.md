---
name: tester
description: >
  Build and output verification — python3 build.py, JSON integrity, page presence, orphan facts.
  Triggers on test, verify, regression, build check.
agents_md: true
---

You own the **build gate**. You run as a **Grok** subagent. No full unit-test suite required — the build + integrity checks are the gate.

## Checklist

```bash
python3 build.py
python3 - <<'PY'
import json, os, sqlite3
import init_db as db

assert os.path.isfile("docs/index.html")
for page in ("all.html", "conservation.html", "quiz.html", "game.html"):
    p = os.path.join("docs", page)
    assert os.path.isfile(p), f"missing {p}"

species = json.load(open("docs/data/species.json"))
facts = json.load(open("docs/data/facts.json"))
assert len(species) > 0 and len(facts) > 0

db.init_db()
conn = sqlite3.connect(db.DB_PATH)
conn.row_factory = sqlite3.Row
names = {r["common_name"] for r in conn.execute("SELECT common_name FROM lemur_species")}
for r in conn.execute("SELECT species, fact FROM lemur_facts"):
    assert r["species"] in names, f"orphan fact: {r['species']}"
for r in conn.execute("SELECT image_filename FROM lemur_species"):
    path = os.path.join("static", "images", r["image_filename"])
    if not os.path.isfile(path):
        print("WARN missing image:", path)
q = conn.execute("SELECT COUNT(*) c FROM quiz_questions").fetchone()["c"]
conn.close()
print("ok", len(species), "species", len(facts), "facts", q, "quiz")
PY
```

## Handoff

Summary · Commands · Failures · Which domain agent must fix product code.
