import os
from dotenv import load_dotenv
from flask import Flask, render_template, request, redirect, url_for, jsonify, session, flash, make_response
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "test")

# this sets up the MongoDB connection
mongo_uri = os.getenv("MONGO_URI")
client = MongoClient(mongo_uri)
db = client["rate_my_student"]

# students will be connected to reviews by student_id
students_collection = db["students"]
reviews_collection = db["reviews"]

users_collection = db["users"]
sessions_collection = db["sessions"]

# creates a default admin account if it does not exist already
def create_admin_account():
    admin = users_collection.find_one({"role": "admin"})
    if not admin:
        users_collection.insert_one({
            "username": "admin",
            "password_hash": generate_password_hash("admin123"),
            "role": "admin"
        })

create_admin_account()

# ------------------------------------------
# API ROUTES
# ------------------------------------------

# signup API
@app.route("/signup", methods=["POST"])
def api_signup():
    import secrets
    import random
    data = request.get_json(force=True)
    username = data.get("username", "").strip()
    password = data.get("password", "")
    role = data.get("role", "")
    full_name = data.get("full_name", "").strip()
    school = data.get("school", "").strip()

    # check if role is provided
    if role not in ("student", "teacher"):
        return jsonify({"success": False, "error": "Role must be student or teacher."}), 400

    # check if username already exists
    if users_collection.find_one({"username": username}):
        return jsonify({"success": False, "error": "Username already exists."}), 400

    # hash the password and store the user
    pw_hash = generate_password_hash(password)
    user = {"username": username, "password_hash": pw_hash, "role": role}

    # if the user is a student generate an 8-digit student id and create a student profile
    if role == "student":
        while True:
            student_id = random.randint(10000000, 99999999)
            if not students_collection.find_one({"_id": student_id}):
                break
        students_collection.insert_one({
            "_id": student_id,
            "name": full_name or username,
            "school": school,
            "avg_rating": 0
        })
        user["student_id"] = student_id
        user["full_name"] = full_name
        user["school"] = school

    result = users_collection.insert_one(user)

    session_key = secrets.token_hex(32)
    sessions_collection.insert_one({
        "session_key": session_key,
        "user_id": result.inserted_id,
        "role": role
    })

    response = make_response(
        jsonify({
            "success": True,
            "message": "Signup successful.",
            "user_id": str(result.inserted_id),
            "role": role,
            "student_id": user.get("student_id")
        })
    )
    response.set_cookie("session_key", session_key, httponly=True, samesite="Lax")
    return response


# login API
@app.route("/login", methods=["POST"])
def api_login():
    import secrets
    data = request.get_json(force=True)
    username = data.get("username", "").strip()
    password = data.get("password", "")
    user = users_collection.find_one({"username": username})
    if user and check_password_hash(user["password_hash"], password):
        # generate session key
        session_key = secrets.token_hex(32)
        sessions_collection.insert_one({
            "session_key": session_key,
            "user_id": user["_id"],
            "role": user["role"]
        })
        response = make_response(
            jsonify({
                "success": True,
                "message": "Login successful."
            })
        )
        response.set_cookie("session_key", session_key, httponly=True, samesite="Lax")
        return response
    else:
        return jsonify({"success": False, "error": "Invalid credentials."}), 401


# logout API
@app.route("/logout", methods=["POST"])
def api_logout():
    session_key = request.cookies.get("session_key")
    if session_key:
        sessions_collection.delete_one({"session_key": session_key})

    response = make_response(
        jsonify({
            "success": True,
            "message": "Logged out."
        })
    )
    response.set_cookie("session_key", "", expires=0)
    return response


# student profile API
@app.route('/api/student/<int:userid>', methods=['GET'])
def api_student_profile(userid):
    session_key = request.cookies.get("session_key")
    session_obj = sessions_collection.find_one({"session_key": session_key})
    if not session_obj:
        return jsonify({"success": False, "error": "Not authenticated."}), 401

    student = students_collection.find_one({"_id": userid})
    if not student:
        return jsonify({"success": False, "error": "Student not found."}), 404

    if "avg_rating" not in student:
        student["avg_rating"] = 0

    reviews = list(reviews_collection.find({"student_id": userid}))
    for r in reviews:
        r["_id"] = str(r["_id"])
    student["_id"] = str(student["_id"])
    return jsonify({"student": student, "reviews": reviews})


# post review API
@app.route('/api/student/<int:userid>/review', methods=['POST'])
def api_post_review(userid):
    session_key = request.cookies.get("session_key")
    session_obj = sessions_collection.find_one({"session_key": session_key})
    if not session_obj:
        return jsonify({"success": False, "error": "Not authenticated."}), 401

    student = students_collection.find_one({"_id": userid})
    if not student:
        return jsonify({"success": False, "error": "Student not found."}), 404

    if "avg_rating" not in student:
        student["avg_rating"] = 0

    data = request.get_json(force=True)
    rating = int(data.get('rating', 0))
    comment = data.get('comment', "")

    reviews_collection.insert_one({
        "student_id": userid,
        "rating": rating,
        "comment": comment
    })

    all_reviews = list(reviews_collection.find({"student_id": userid}))
    avg = 0
    if len(all_reviews) > 0:
        avg = sum(r["rating"] for r in all_reviews) / len(all_reviews)
        avg = round(avg, 2)
    students_collection.update_one(
        {"_id": userid},
        {"$set": {"avg_rating": avg}},
        upsert=True
    )
    return jsonify({"success": True, "message": "Review added.", "avg_rating": avg})

# search students API
@app.route("/search", methods=["GET"])
def api_search():
    name = request.args.get("name", "")
    students = list(students_collection.find({
        "name": {"$regex": name, "$options": "i"}
    }))
    for s in students:
        s["_id"] = str(s["_id"])
    return jsonify(students)

# ------------------------------------------
# PAGE ROUTES
# ------------------------------------------

# signup page
@app.route("/signup", methods=["GET"])
def signup_page():
    return render_template("signup.html")

# login page
@app.route("/login", methods=["GET"])
def login_page():
    return render_template("login.html")

# student page
@app.route("/student/<int:userid>", methods=["GET"])
def student_page(userid):
    return render_template("student.html")

if __name__ == '__main__':
    app.run(debug=True)
