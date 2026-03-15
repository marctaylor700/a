#!/usr/bin/env python3
"""Static site generator for Lemur Facts.

Reads data from init_db.py's Python structures, renders Jinja2 templates
to static HTML, generates JSON data files, and copies static assets
into a docs/ output directory suitable for GitHub Pages.
"""

import json
import os
import random
import re
import shutil

from jinja2 import Environment, FileSystemLoader

# --- Configuration ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "docs")
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")
STATIC_DIR = os.path.join(BASE_DIR, "static")

# For GitHub Pages project site at https://<user>.github.io/<repo>/
# Override with BASE_URL env var, or change default for custom domains
BASE_URL = os.environ.get("BASE_URL", "/a/")


def slugify(name):
    """Convert a species name to a URL-safe slug."""
    slug = name.lower()
    slug = re.sub(r"['\u2019]", "", slug)  # Remove apostrophes
    slug = re.sub(r"[^a-z0-9]+", "-", slug)  # Replace non-alphanumeric with hyphens
    return slug.strip("-")


def load_data():
    """Load data by seeding the SQLite DB via init_db, then reading it back."""
    import init_db as db_module
    import sqlite3

    db_module.init_db()
    conn_file = sqlite3.connect(db_module.DB_PATH)
    conn_file.row_factory = sqlite3.Row

    # Extract species with fact counts
    species_rows = conn_file.execute(
        """SELECT ls.*, COUNT(lf.id) as fact_count
        FROM lemur_species ls
        LEFT JOIN lemur_facts lf ON ls.common_name = lf.species
        GROUP BY ls.id
        ORDER BY ls.common_name"""
    ).fetchall()
    species_list = [dict(row) for row in species_rows]

    # Extract all facts
    fact_rows = conn_file.execute("SELECT * FROM lemur_facts").fetchall()
    all_facts = [dict(row) for row in fact_rows]

    # Extract facts grouped by species
    facts_by_species = {}
    for f in all_facts:
        facts_by_species.setdefault(f["species"], []).append(f)

    # Extract quiz questions
    question_rows = conn_file.execute("SELECT * FROM quiz_questions").fetchall()
    all_questions = [dict(row) for row in question_rows]

    # Build species_by_status for conservation page
    all_species = conn_file.execute(
        "SELECT * FROM lemur_species ORDER BY conservation_status, common_name"
    ).fetchall()
    species_by_status = {}
    for sp in all_species:
        sp_dict = dict(sp)
        status = sp_dict["conservation_status"]
        species_by_status.setdefault(status, []).append(sp_dict)

    conn_file.close()

    # Build slug mapping
    slug_map = {}
    for sp in species_list:
        slug_map[sp["common_name"]] = slugify(sp["common_name"])

    return {
        "species_list": species_list,
        "all_facts": all_facts,
        "facts_by_species": facts_by_species,
        "all_questions": all_questions,
        "species_by_status": species_by_status,
        "slug_map": slug_map,
    }


def write_json_data(data):
    """Write JSON data files for client-side consumption."""
    data_dir = os.path.join(OUTPUT_DIR, "data")
    os.makedirs(data_dir, exist_ok=True)

    # facts.json - for random fact feature
    facts_json = [
        {
            "id": f["id"],
            "species": f["species"],
            "fact": f["fact"],
            "image": f["image_filename"],
            "category": f["category"],
            "slug": data["slug_map"].get(f["species"], ""),
        }
        for f in data["all_facts"]
    ]
    with open(os.path.join(data_dir, "facts.json"), "w") as fp:
        json.dump(facts_json, fp)

    # quiz.json - for quiz feature
    quiz_json = [
        {
            "id": q["id"],
            "question": q["question"],
            "correct_answer": q["correct_answer"],
            "wrong_answer_1": q["wrong_answer_1"],
            "wrong_answer_2": q["wrong_answer_2"],
            "wrong_answer_3": q["wrong_answer_3"],
            "difficulty": q["difficulty"],
        }
        for q in data["all_questions"]
    ]
    with open(os.path.join(data_dir, "quiz.json"), "w") as fp:
        json.dump(quiz_json, fp)


def build_site():
    """Build the complete static site."""
    print("Building static site...")

    # Clean output directory
    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)
    os.makedirs(OUTPUT_DIR)

    # Load data
    data = load_data()
    print(f"  Loaded {len(data['species_list'])} species, "
          f"{len(data['all_facts'])} facts, "
          f"{len(data['all_questions'])} quiz questions")

    # Write JSON data files
    write_json_data(data)
    print("  Generated JSON data files")

    # Copy static images
    src_images = os.path.join(STATIC_DIR, "images")
    dst_images = os.path.join(OUTPUT_DIR, "images")
    if os.path.exists(src_images):
        shutil.copytree(src_images, dst_images)
        print(f"  Copied {len(os.listdir(dst_images))} images")

    # Set up Jinja2 environment
    env = Environment(loader=FileSystemLoader(TEMPLATES_DIR))

    # Common context for all pages
    base_ctx = {
        "base_url": BASE_URL,
        "slug_map": data["slug_map"],
    }

    # --- Render pages ---

    # 1. Homepage (index.html)
    first_fact = random.choice(data["all_facts"])
    tmpl = env.get_template("index.html")
    html = tmpl.render(
        **base_ctx,
        active_page="index",
        fact=first_fact,
        total_species=len(data["species_list"]),
        total_facts=len(data["all_facts"]),
    )
    with open(os.path.join(OUTPUT_DIR, "index.html"), "w") as fp:
        fp.write(html)
    print("  Rendered index.html")

    # 2. All species page (all.html)
    tmpl = env.get_template("all.html")
    html = tmpl.render(
        **base_ctx,
        active_page="all",
        species_list=data["species_list"],
    )
    with open(os.path.join(OUTPUT_DIR, "all.html"), "w") as fp:
        fp.write(html)
    print("  Rendered all.html")

    # 3. Conservation page
    status_order = ["Critically Endangered", "Endangered", "Vulnerable", "Least Concern"]
    tmpl = env.get_template("conservation.html")
    html = tmpl.render(
        **base_ctx,
        active_page="conservation",
        species_by_status=data["species_by_status"],
        status_order=status_order,
    )
    with open(os.path.join(OUTPUT_DIR, "conservation.html"), "w") as fp:
        fp.write(html)
    print("  Rendered conservation.html")

    # 4. Quiz page
    tmpl = env.get_template("quiz.html")
    html = tmpl.render(
        **base_ctx,
        active_page="quiz",
    )
    with open(os.path.join(OUTPUT_DIR, "quiz.html"), "w") as fp:
        fp.write(html)
    print("  Rendered quiz.html")

    # 5. Individual species pages
    species_dir = os.path.join(OUTPUT_DIR, "species")
    os.makedirs(species_dir, exist_ok=True)
    tmpl = env.get_template("species.html")
    for sp in data["species_list"]:
        name = sp["common_name"]
        slug = data["slug_map"][name]
        page_dir = os.path.join(species_dir, slug)
        os.makedirs(page_dir, exist_ok=True)

        facts = data["facts_by_species"].get(name, [])
        if not facts:
            continue

        html = tmpl.render(
            **base_ctx,
            active_page="species",
            species=name,
            species_info=sp,
            facts=facts,
        )
        with open(os.path.join(page_dir, "index.html"), "w") as fp:
            fp.write(html)
    print(f"  Rendered {len(data['species_list'])} species pages")

    # 6. 404 page
    tmpl = env.get_template("404.html")
    html = tmpl.render(
        **base_ctx,
        active_page="",
        species="Unknown",
    )
    with open(os.path.join(OUTPUT_DIR, "404.html"), "w") as fp:
        fp.write(html)
    print("  Rendered 404.html")

    print(f"\nBuild complete! Output in {OUTPUT_DIR}/")


if __name__ == "__main__":
    build_site()
