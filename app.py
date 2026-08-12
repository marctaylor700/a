import os
import sqlite3
import random

from flask import Flask, render_template, jsonify, request, send_from_directory

from init_db import init_db, DB_PATH

app = Flask(__name__)


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@app.route("/")
def index():
    try:
        conn = get_db()
        fact_row = conn.execute(
            "SELECT * FROM lemur_facts ORDER BY RANDOM() LIMIT 1"
        ).fetchone()
        total_facts = conn.execute("SELECT COUNT(*) FROM lemur_facts").fetchone()[0]
        total_species = conn.execute(
            "SELECT COUNT(*) FROM lemur_species"
        ).fetchone()[0]
        conn.close()
        return render_template(
            "index.html", fact=fact_row, total_facts=total_facts, total_species=total_species
        )
    except Exception as e:
        app.logger.error(f"Error in index route: {e}")
        return render_template("404.html", species="Error"), 500


@app.route("/api/random")
def api_random_fact():
    try:
        conn = get_db()
        fact_row = conn.execute(
            "SELECT * FROM lemur_facts ORDER BY RANDOM() LIMIT 1"
        ).fetchone()
        conn.close()
        return jsonify(
            {
                "id": fact_row["id"],
                "species": fact_row["species"],
                "fact": fact_row["fact"],
                "image": fact_row["image_filename"],
                "category": fact_row["category"],
            }
        )
    except Exception as e:
        app.logger.error(f"Error in api_random_fact: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/species/<species_name>")
def species(species_name):
    conn = get_db()
    species_info = conn.execute(
        "SELECT * FROM lemur_species WHERE common_name = ?", (species_name,)
    ).fetchone()
    facts = conn.execute(
        "SELECT * FROM lemur_facts WHERE species = ?", (species_name,)
    ).fetchall()
    conn.close()
    if not facts:
        return render_template("404.html", species=species_name), 404
    return render_template(
        "species.html", species=species_name, facts=facts, species_info=species_info
    )


@app.route("/all")
def all_facts():
    conn = get_db()
    species_list = conn.execute(
        """SELECT ls.*, COUNT(lf.id) as fact_count
        FROM lemur_species ls
        LEFT JOIN lemur_facts lf ON ls.common_name = lf.species
        GROUP BY ls.id
        ORDER BY ls.common_name"""
    ).fetchall()
    conn.close()
    return render_template("all.html", species_list=species_list)


@app.route("/conservation")
def conservation():
    conn = get_db()
    species_by_status = {}
    species_list = conn.execute(
        "SELECT * FROM lemur_species ORDER BY conservation_status, common_name"
    ).fetchall()
    for sp in species_list:
        status = sp["conservation_status"]
        if status not in species_by_status:
            species_by_status[status] = []
        species_by_status[status].append(sp)
    conn.close()
    status_order = [
        "Critically Endangered",
        "Endangered",
        "Vulnerable",
        "Least Concern",
    ]
    return render_template(
        "conservation.html",
        species_by_status=species_by_status,
        status_order=status_order,
    )


@app.route("/quiz")
def quiz():
    return render_template("quiz.html", active_page="quiz")


@app.route("/game")
def game():
    return render_template("game.html", active_page="game")


@app.route("/js/<path:filename>")
def serve_js(filename):
    return send_from_directory(os.path.join(app.root_path, "static", "js"), filename)


@app.route("/images/<path:filename>")
def serve_images(filename):
    return send_from_directory(os.path.join(app.root_path, "static", "images"), filename)


@app.route("/api/quiz")
def api_quiz():
    difficulty = request.args.get("difficulty", "all")
    conn = get_db()
    if difficulty == "all":
        questions = conn.execute(
            "SELECT * FROM quiz_questions ORDER BY RANDOM() LIMIT 10"
        ).fetchall()
    else:
        questions = conn.execute(
            "SELECT * FROM quiz_questions WHERE difficulty = ? ORDER BY RANDOM() LIMIT 10",
            (difficulty,),
        ).fetchall()
    conn.close()
    quiz_data = []
    for q in questions:
        answers = [
            q["correct_answer"],
            q["wrong_answer_1"],
            q["wrong_answer_2"],
            q["wrong_answer_3"],
        ]
        random.shuffle(answers)
        quiz_data.append(
            {
                "id": q["id"],
                "question": q["question"],
                "answers": answers,
                "correct": q["correct_answer"],
                "difficulty": q["difficulty"],
            }
        )
    return jsonify(quiz_data)


@app.route("/api/species")
def api_species():
    try:
        conn = get_db()
        species_list = conn.execute("SELECT * FROM lemur_species ORDER BY common_name").fetchall()
        conn.close()
        return jsonify(
            [
                {
                    "common_name": s["common_name"],
                    "scientific_name": s["scientific_name"],
                    "conservation_status": s["conservation_status"],
                    "image": s["image_filename"],
                }
                for s in species_list
            ]
        )
    except Exception as e:
        app.logger.error(f"Error in api_species: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/api/search")
def api_search():
    try:
        query = request.args.get("q", "").strip()
        if not query:
            return jsonify([])
        
        conn = get_db()
        # Search in both species and facts
        species_results = conn.execute(
            "SELECT common_name, scientific_name, conservation_status, image_filename, description "
            "FROM lemur_species "
            "WHERE common_name LIKE ? OR scientific_name LIKE ? OR description LIKE ? "
            "ORDER BY common_name",
            (f"%{query}%", f"%{query}%", f"%{query}%")
        ).fetchall()
        
        fact_results = conn.execute(
            "SELECT species, fact, image_filename, category "
            "FROM lemur_facts "
            "WHERE species LIKE ? OR fact LIKE ? "
            "ORDER BY species",
            (f"%{query}%", f"%{query}%")
        ).fetchall()
        
        conn.close()
        
        results = []
        for row in species_results:
            results.append({
                "type": "species",
                "common_name": row["common_name"],
                "scientific_name": row["scientific_name"],
                "conservation_status": row["conservation_status"],
                "image": row["image_filename"],
                "description": row["description"][:200] + "..." if len(row["description"]) > 200 else row["description"]
            })
        
        for row in fact_results:
            results.append({
                "type": "fact",
                "species": row["species"],
                "fact": row["fact"],
                "image": row["image_filename"],
                "category": row["category"]
            })
        
        return jsonify(results)
    except Exception as e:
        app.logger.error(f"Error in api_search: {e}")
        return jsonify({"error": "Internal server error"}), 500


# Initialize the database on startup
with app.app_context():
    init_db()


if __name__ == "__main__":
    import sys
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5000
    app.run(debug=True, host="0.0.0.0", port=port)
