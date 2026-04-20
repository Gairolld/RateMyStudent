import os
from datetime import datetime
from dotenv import load_dotenv
from flask import Flask, render_template, request, redirect, url_for, jsonify, session, flash, make_response
from bson import ObjectId
from bson.errors import InvalidId
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

friend_requests_collection = db["friend_requests"]
friends_collection = db["friends"]
school_appeals_collection = db["school_change_appeals"]

def create_admin_account():
    admin = users_collection.find_one({"role": "admin"})
    if not admin:
        users_collection.insert_one({
            "username": "admin",
            "password_hash": generate_password_hash("admin123"),
            "role": "admin"
        })

create_admin_account()

def generate_friend_code():
    import random
    while True:
        code = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=6))
        if not users_collection.find_one({"friend_code": code}):
            return code

def are_friends(user_id1, user_id2):
    return friends_collection.find_one({
        "$or": [
            {"user_id": user_id1, "friend_id": user_id2},
            {"user_id": user_id2, "friend_id": user_id1}
        ]
    }) is not None

def get_friend_status(user_id, other_user_id):
    if user_id == other_user_id:
        return "self"

    if are_friends(user_id, other_user_id):
        return "friends"

    outgoing = friend_requests_collection.find_one({"sender_id": user_id, "recipient_id": other_user_id})
    if outgoing:
        return "outgoing_pending"

    incoming = friend_requests_collection.find_one({"sender_id": other_user_id, "recipient_id": user_id})
    if incoming:
        return "incoming_pending"

    return "none"

def get_current_user():
    session_key = request.cookies.get("session_key")
    if not session_key:
        return None
    session_obj = sessions_collection.find_one({"session_key": session_key})
    if not session_obj:
        return None
    user = users_collection.find_one({"_id": session_obj["user_id"]})
    return user

def to_safe_teacher_profile(user_doc):
    return {
        "user_id": str(user_doc["_id"]),
        "username": user_doc.get("username", ""),
        "full_name": user_doc.get("full_name") or user_doc.get("username", ""),
        "school": user_doc.get("school", ""),
        "friend_code": user_doc.get("friend_code", "")
    }

def is_admin(user_id):
    user = users_collection.find_one({"_id": user_id})
    return bool(user and user.get("role") == "admin")

# ------------------------------------------
# API ROUTES
# ------------------------------------------

# harmful language
BANNED_WORDS = [
    "fuck", "shit", "bitch", "asshole",
]

def contains_harmful_language(text):
    if not text:
        return False
    lowered = text.lower()
    for word in BANNED_WORDS:
        if word in lowered:
            return True
    return False

# max length
MAX_COMMENT_LEN = 200
MAX_USERNAME_LEN = 50
MAX_FULLNAME_LEN = 50
MAX_SCHOOL_LEN = 50

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

    if len(username) > MAX_USERNAME_LEN:
        return jsonify({"success": False, "error": f"Username must be at most {MAX_USERNAME_LEN} characters."}), 400
    if len(full_name) > MAX_FULLNAME_LEN:
        return jsonify({"success": False, "error": f"Full name must be at most {MAX_FULLNAME_LEN} characters."}), 400
    if len(school) > MAX_SCHOOL_LEN:
        return jsonify({"success": False, "error": f"School name must be at most {MAX_SCHOOL_LEN} characters."}), 400
    if contains_harmful_language(username) or contains_harmful_language(full_name) or contains_harmful_language(school):
        return jsonify({"success": False, "error": "Inappropriate language detected in user info."}), 400

    # check if role is provided
    if role not in ("student", "teacher"):
        return jsonify({"success": False, "error": "Role must be student or teacher."}), 400

    # check if username already exists
    if users_collection.find_one({"username": username}):
        return jsonify({"success": False, "error": "Username already exists."}), 400

    # hash the password and store the user
    pw_hash = generate_password_hash(password)
    user = {"username": username, "password_hash": pw_hash, "role": role, "friend_code": generate_friend_code()}

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
    elif role == "teacher":
        user["full_name"] = full_name or username
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
        if "user_id" in r:
            r["user_id"] = str(r["user_id"])
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

    reviewer = users_collection.find_one({"_id": session_obj["user_id"]})
    if not reviewer:
        return jsonify({"success": False, "error": "User not found."}), 404

    if reviewer.get("role") != "teacher":
        return jsonify({"success": False, "error": "Only teachers can post reviews."}), 403

    teacher_school = (reviewer.get("school") or "").strip().lower()
    student_school = (student.get("school") or "").strip().lower()
    if not teacher_school or teacher_school != student_school:
        return jsonify({"success": False, "error": "Teachers can only review students at their own school."}), 403

    existing_review = reviews_collection.find_one({
        "student_id": userid,
        "user_id": session_obj["user_id"]
    })
    if existing_review:
        return jsonify({"success": False, "error": "You already reviewed this student."}), 400

    if "avg_rating" not in student:
        student["avg_rating"] = 0

    data = request.get_json(force=True)
    rating = int(data.get('rating', 0))
    comment = data.get('comment', "")

    if rating < 1 or rating > 5:
        return jsonify({"success": False, "error": "Rating must be between 1 and 5."}), 400

    if len(comment) > MAX_COMMENT_LEN:
        return jsonify({"success": False, "error": f"Comment must be at most {MAX_COMMENT_LEN} characters."}), 400
    if contains_harmful_language(comment):
        return jsonify({"success": False, "error": "Inappropriate language detected in comment."}), 400

    result = reviews_collection.insert_one({
        "student_id": userid,
        "rating": rating,
        "comment": comment,
        "user_id": session_obj["user_id"],
        "visible_to_friends": True
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
    return jsonify({"success": True, "message": "Review added.", "avg_rating": avg, "review_id": str(result.inserted_id)})


# edit review API
@app.route('/api/review/<review_id>', methods=['PUT'])
def api_edit_review(review_id):
    session_key = request.cookies.get("session_key")
    session_obj = sessions_collection.find_one({"session_key": session_key})
    if not session_obj:
        return jsonify({"success": False, "error": "Not authenticated."}), 401

    review = reviews_collection.find_one({"_id": ObjectId(review_id)})
    if not review:
        return jsonify({"success": False, "error": "Review not found."}), 404

    if review.get("user_id") != session_obj["user_id"]:
        return jsonify({"success": False, "error": "Not authorized."}), 403

    data = request.get_json(force=True)
    rating = int(data.get('rating', review["rating"]))
    comment = data.get('comment', review["comment"])

    reviews_collection.update_one({"_id": ObjectId(review_id)}, {"$set": {"rating": rating, "comment": comment}})

    # update avg_rating for the student
    student_id = review["student_id"]
    all_reviews = list(reviews_collection.find({"student_id": student_id}))
    avg = 0
    if len(all_reviews) > 0:
        avg = sum(r["rating"] for r in all_reviews) / len(all_reviews)
        avg = round(avg, 2)
    students_collection.update_one(
        {"_id": student_id},
        {"$set": {"avg_rating": avg}},
        upsert=True
    )
    return jsonify({"success": True, "message": "Review updated.", "avg_rating": avg})


# delete review API
@app.route('/api/review/<review_id>', methods=['DELETE'])
def api_delete_review(review_id):
    session_key = request.cookies.get("session_key")
    session_obj = sessions_collection.find_one({"session_key": session_key})
    if not session_obj:
        return jsonify({"success": False, "error": "Not authenticated."}), 401

    review = reviews_collection.find_one({"_id": ObjectId(review_id)})
    if not review:
        return jsonify({"success": False, "error": "Review not found."}), 404

    if review.get("user_id") != session_obj["user_id"]:
        return jsonify({"success": False, "error": "Not authorized."}), 403

    reviews_collection.delete_one({"_id": ObjectId(review_id)})

    # update avg_rating for the student
    student_id = review["student_id"]
    all_reviews = list(reviews_collection.find({"student_id": student_id}))
    avg = 0
    if len(all_reviews) > 0:
        avg = sum(r["rating"] for r in all_reviews) / len(all_reviews)
        avg = round(avg, 2)
    students_collection.update_one(
        {"_id": student_id},
        {"$set": {"avg_rating": avg}},
        upsert=True
    )
    return jsonify({"success": True, "message": "Review deleted.", "avg_rating": avg})

# search students API
@app.route("/search", methods=["GET"])
def api_search():
    query = request.args.get("name", "").strip()

    # School search format: (School Name)
    # Also supports live typing after '(' so results show before the closing ')'.
    if query.startswith("("):
        school_query = query[1:].strip()
        if school_query.endswith(")"):
            school_query = school_query[:-1].strip()

        if school_query:
            students = list(students_collection.find({
                "school": {"$regex": school_query, "$options": "i"}
            }))
        else:
            students = []
    else:
        students = list(students_collection.find({
            "name": {"$regex": query, "$options": "i"}
        }))

    for s in students:
        s["_id"] = str(s["_id"])
    return jsonify(students)

# get current user API
@app.route("/api/me", methods=["GET"])
def api_me():
    session_key = request.cookies.get("session_key")
    session_obj = sessions_collection.find_one({"session_key": session_key})
    if not session_obj:
        return jsonify({"success": False, "error": "Not authenticated."}), 401
    user = users_collection.find_one({"_id": session_obj["user_id"]})
    if not user:
        return jsonify({"success": False, "error": "User not found."}), 404
    return jsonify({"success": True, "user_id": str(session_obj["user_id"]), "username": user["username"], "role": user["role"],
     "student_id": user.get("student_id"), "friend_code": user.get("friend_code"), "full_name": user.get("full_name"),
     "school": user.get("school")})

@app.route("/api/teacher/school_appeal/pending", methods=["GET"])
def api_get_pending_school_appeal():
    session_key = request.cookies.get("session_key")
    session_obj = sessions_collection.find_one({"session_key": session_key})
    if not session_obj:
        return jsonify({"success": False, "error": "Not authenticated."}), 401

    teacher = users_collection.find_one({"_id": session_obj["user_id"]})
    if not teacher or teacher.get("role") != "teacher":
        return jsonify({"success": False, "error": "Only teachers can view appeals."}), 403

    pending = school_appeals_collection.find_one({
        "teacher_id": teacher["_id"],
        "status": "pending"
    })
    if not pending:
        return jsonify({"success": True, "appeal": None})

    pending["_id"] = str(pending["_id"])
    pending["teacher_id"] = str(pending["teacher_id"])
    return jsonify({"success": True, "appeal": pending})

@app.route("/api/teacher/school_appeal", methods=["POST"])
def api_create_school_appeal():
    session_key = request.cookies.get("session_key")
    session_obj = sessions_collection.find_one({"session_key": session_key})
    if not session_obj:
        return jsonify({"success": False, "error": "Not authenticated."}), 401

    teacher = users_collection.find_one({"_id": session_obj["user_id"]})
    if not teacher or teacher.get("role") != "teacher":
        return jsonify({"success": False, "error": "Only teachers can submit school appeals."}), 403

    existing = school_appeals_collection.find_one({"teacher_id": teacher["_id"], "status": "pending"})
    if existing:
        return jsonify({
            "success": False,
            "error": "You already have a pending school change appeal.",
            "appeal_id": str(existing["_id"])
        }), 400

    data = request.get_json(force=True)
    new_school = str(data.get("new_school", "")).strip()
    reason = str(data.get("reason", "")).strip()

    if not new_school:
        return jsonify({"success": False, "error": "New school is required."}), 400
    if len(new_school) > MAX_SCHOOL_LEN:
        return jsonify({"success": False, "error": f"School name must be at most {MAX_SCHOOL_LEN} characters."}), 400
    if not reason:
        return jsonify({"success": False, "error": "Reason is required."}), 400
    if len(reason) > 300:
        return jsonify({"success": False, "error": "Reason must be at most 300 characters."}), 400
    if contains_harmful_language(new_school) or contains_harmful_language(reason):
        return jsonify({"success": False, "error": "Inappropriate language detected."}), 400

    appeal = {
        "teacher_id": teacher["_id"],
        "teacher_username": teacher.get("username", ""),
        "teacher_full_name": teacher.get("full_name", teacher.get("username", "")),
        "current_school": teacher.get("school", ""),
        "new_school": new_school,
        "reason": reason,
        "status": "pending",
        "created_at": datetime.utcnow().isoformat()
    }
    result = school_appeals_collection.insert_one(appeal)
    return jsonify({"success": True, "appeal_id": str(result.inserted_id), "message": "Appeal submitted."})

@app.route("/api/teacher/school_appeal/<appeal_id>", methods=["DELETE"])
def api_delete_school_appeal(appeal_id):
    session_key = request.cookies.get("session_key")
    session_obj = sessions_collection.find_one({"session_key": session_key})
    if not session_obj:
        return jsonify({"success": False, "error": "Not authenticated."}), 401

    teacher = users_collection.find_one({"_id": session_obj["user_id"]})
    if not teacher or teacher.get("role") != "teacher":
        return jsonify({"success": False, "error": "Only teachers can delete school appeals."}), 403

    try:
        appeal_obj_id = ObjectId(appeal_id)
    except InvalidId:
        return jsonify({"success": False, "error": "Invalid appeal id."}), 400

    appeal = school_appeals_collection.find_one({"_id": appeal_obj_id})
    if not appeal:
        return jsonify({"success": False, "error": "Appeal not found."}), 404
    if appeal.get("teacher_id") != teacher["_id"]:
        return jsonify({"success": False, "error": "Not authorized."}), 403
    if appeal.get("status") != "pending":
        return jsonify({"success": False, "error": "Only pending appeals can be deleted."}), 400

    school_appeals_collection.delete_one({"_id": appeal_obj_id})
    return jsonify({"success": True, "message": "Pending appeal deleted."})

@app.route('/api/admin/inbox', methods=['GET'])
def api_admin_inbox():
    session_key = request.cookies.get("session_key")
    session_obj = sessions_collection.find_one({"session_key": session_key})
    if not session_obj:
        return jsonify({"success": False, "error": "Not authenticated."}), 401
    if not is_admin(session_obj["user_id"]):
        return jsonify({"success": False, "error": "Admin only."}), 403

    appeals = list(school_appeals_collection.find({"status": "pending"}))
    for a in appeals:
        a["_id"] = str(a["_id"])
        a["teacher_id"] = str(a["teacher_id"])

    return jsonify({"success": True, "appeals": appeals})

@app.route('/api/admin/appeal/<appeal_id>/approve', methods=['POST'])
def api_admin_approve_appeal(appeal_id):
    session_key = request.cookies.get("session_key")
    session_obj = sessions_collection.find_one({"session_key": session_key})
    if not session_obj:
        return jsonify({"success": False, "error": "Not authenticated."}), 401
    if not is_admin(session_obj["user_id"]):
        return jsonify({"success": False, "error": "Admin only."}), 403

    try:
        appeal_obj_id = ObjectId(appeal_id)
    except InvalidId:
        return jsonify({"success": False, "error": "Invalid appeal id."}), 400

    appeal = school_appeals_collection.find_one({"_id": appeal_obj_id})
    if not appeal:
        return jsonify({"success": False, "error": "Appeal not found."}), 404
    if appeal.get("status") != "pending":
        return jsonify({"success": False, "error": "Appeal already processed."}), 400

    users_collection.update_one(
        {"_id": appeal["teacher_id"]},
        {"$set": {"school": appeal.get("new_school", "")}}
    )
    school_appeals_collection.update_one(
        {"_id": appeal_obj_id},
        {"$set": {"status": "approved", "reviewed_at": datetime.utcnow().isoformat(), "reviewed_by": session_obj["user_id"]}}
    )
    return jsonify({"success": True, "message": "Appeal approved."})

@app.route('/api/admin/appeal/<appeal_id>/reject', methods=['POST'])
def api_admin_reject_appeal(appeal_id):
    session_key = request.cookies.get("session_key")
    session_obj = sessions_collection.find_one({"session_key": session_key})
    if not session_obj:
        return jsonify({"success": False, "error": "Not authenticated."}), 401
    if not is_admin(session_obj["user_id"]):
        return jsonify({"success": False, "error": "Admin only."}), 403

    try:
        appeal_obj_id = ObjectId(appeal_id)
    except InvalidId:
        return jsonify({"success": False, "error": "Invalid appeal id."}), 400

    appeal = school_appeals_collection.find_one({"_id": appeal_obj_id})
    if not appeal:
        return jsonify({"success": False, "error": "Appeal not found."}), 404
    if appeal.get("status") != "pending":
        return jsonify({"success": False, "error": "Appeal already processed."}), 400

    school_appeals_collection.update_one(
        {"_id": appeal_obj_id},
        {"$set": {"status": "rejected", "reviewed_at": datetime.utcnow().isoformat(), "reviewed_by": session_obj["user_id"]}}
    )
    return jsonify({"success": True, "message": "Appeal rejected."})


@app.route("/api/teacher/<teacher_id>", methods=["GET"])
def api_teacher_profile(teacher_id):
    session_key = request.cookies.get("session_key")
    session_obj = sessions_collection.find_one({"session_key": session_key})
    if not session_obj:
        return jsonify({"success": False, "error": "Not authenticated."}), 401

    try:
        teacher_obj_id = ObjectId(teacher_id)
    except InvalidId:
        return jsonify({"success": False, "error": "Invalid teacher id."}), 400

    teacher = users_collection.find_one({"_id": teacher_obj_id, "role": "teacher"})
    if not teacher:
        return jsonify({"success": False, "error": "Teacher not found."}), 404

    viewer_id = session_obj["user_id"]
    is_owner = viewer_id == teacher_obj_id
    pending_request = friend_requests_collection.find_one({
        "$or": [
            {"sender_id": viewer_id, "recipient_id": teacher_obj_id},
            {"sender_id": teacher_obj_id, "recipient_id": viewer_id}
        ]
    })
    if not is_owner and not are_friends(viewer_id, teacher_obj_id) and not pending_request:
        return jsonify({"success": False, "error": "Teacher profile is only visible to friends."}), 403

    can_view_reviews = True

    reviews_payload = []
    teacher_reviews = list(reviews_collection.find({"user_id": teacher_obj_id}))
    for r in teacher_reviews:
        visible_to_friends = bool(r.get("visible_to_friends", True))
        if not is_owner and not visible_to_friends:
            continue
        student = students_collection.find_one({"_id": r.get("student_id")})
        reviews_payload.append({
            "_id": str(r["_id"]),
            "student_id": r.get("student_id"),
            "student_name": student.get("name", "Unknown student") if student else "Unknown student",
            "rating": r.get("rating", 0),
            "comment": r.get("comment", ""),
            "visible_to_friends": visible_to_friends
        })

    return jsonify({
        "success": True,
        "teacher": to_safe_teacher_profile(teacher),
        "is_owner": is_owner,
        "can_view_reviews": can_view_reviews,
        "reviews": reviews_payload
    })

@app.route("/api/teacher/me", methods=["PUT"])
def api_update_teacher_profile():
    session_key = request.cookies.get("session_key")
    session_obj = sessions_collection.find_one({"session_key": session_key})
    if not session_obj:
        return jsonify({"success": False, "error": "Not authenticated."}), 401

    teacher = users_collection.find_one({"_id": session_obj["user_id"]})
    if not teacher:
        return jsonify({"success": False, "error": "User not found."}), 404
    if teacher.get("role") != "teacher":
        return jsonify({"success": False, "error": "Only teachers can update teacher profiles."}), 403

    data = request.get_json(force=True)
    full_name = str(data.get("full_name", teacher.get("full_name", ""))).strip()

    if len(full_name) > MAX_FULLNAME_LEN:
        return jsonify({"success": False, "error": f"Full name must be at most {MAX_FULLNAME_LEN} characters."}), 400
    if contains_harmful_language(full_name):
        return jsonify({"success": False, "error": "Inappropriate language detected in profile."}), 400

    users_collection.update_one(
        {"_id": teacher["_id"]},
        {"$set": {
            "full_name": full_name or teacher.get("username", "")
        }}
    )

    updated = users_collection.find_one({"_id": teacher["_id"]})
    return jsonify({"success": True, "teacher": to_safe_teacher_profile(updated)})

@app.route("/api/teacher/review/<review_id>/visibility", methods=["PUT"])
def api_update_teacher_review_visibility(review_id):
    session_key = request.cookies.get("session_key")
    session_obj = sessions_collection.find_one({"session_key": session_key})
    if not session_obj:
        return jsonify({"success": False, "error": "Not authenticated."}), 401

    teacher = users_collection.find_one({"_id": session_obj["user_id"]})
    if not teacher:
        return jsonify({"success": False, "error": "User not found."}), 404
    if teacher.get("role") != "teacher":
        return jsonify({"success": False, "error": "Only teachers can update review visibility."}), 403

    try:
        review_obj_id = ObjectId(review_id)
    except InvalidId:
        return jsonify({"success": False, "error": "Invalid review id."}), 400

    review = reviews_collection.find_one({"_id": review_obj_id})
    if not review:
        return jsonify({"success": False, "error": "Review not found."}), 404
    if review.get("user_id") != session_obj["user_id"]:
        return jsonify({"success": False, "error": "Not authorized."}), 403

    data = request.get_json(force=True)
    visible_to_friends = bool(data.get("visible_to_friends", True))

    reviews_collection.update_one(
        {"_id": review_obj_id},
        {"$set": {"visible_to_friends": visible_to_friends}}
    )
    return jsonify({"success": True, "visible_to_friends": visible_to_friends})

@app.route("/api/friend_request/<friend_code>", methods=["POST"])
def api_send_friend_request(friend_code):
    session_key = request.cookies.get("session_key")
    session_obj = sessions_collection.find_one({"session_key": session_key})
    if not session_obj:
        return jsonify({"success": False, "error": "Not authenticated."}), 401

    sender_id = session_obj["user_id"]
    recipient = users_collection.find_one({"friend_code": friend_code})
    if not recipient:
        return jsonify({"success": False, "error": "Invalid friend code."}), 400
    recipient_id = recipient["_id"]

    if sender_id == recipient_id:
        return jsonify({"success": False, "error": "Cannot send friend request to yourself."}), 400

    if are_friends(sender_id, recipient_id):
        return jsonify({"success": False, "error": "You are already friends."}), 400

    existing_request = friend_requests_collection.find_one({
        "$or": [
            {"sender_id": sender_id, "recipient_id": recipient_id},
            {"sender_id": recipient_id, "recipient_id": sender_id}
        ]
    })
    if existing_request:
        return jsonify({"success": False, "error": "Friend request already exists."}), 400

    friend_requests_collection.insert_one({
        "sender_id": sender_id,
        "recipient_id": recipient_id
    })
    return jsonify({"success": True, "message": "Friend request sent."})

@app.route("/api/friend_request/student/<int:student_id>", methods=["POST"])
def api_send_friend_request_by_student(student_id):
    session_key = request.cookies.get("session_key")
    session_obj = sessions_collection.find_one({"session_key": session_key})
    if not session_obj:
        return jsonify({"success": False, "error": "Not authenticated."}), 401

    sender_id = session_obj["user_id"]
    recipient = users_collection.find_one({"student_id": student_id})
    if not recipient:
        return jsonify({"success": False, "error": "Target profile is not a student account."}), 400
    recipient_id = recipient["_id"]

    if sender_id == recipient_id:
        return jsonify({"success": False, "error": "Cannot send friend request to yourself."}), 400

    status = get_friend_status(sender_id, recipient_id)
    if status == "friends":
        return jsonify({"success": False, "error": "You are already friends."}), 400
    if status in ("outgoing_pending", "incoming_pending"):
        return jsonify({"success": False, "error": "Friend request already exists."}), 400

    friend_requests_collection.insert_one({
        "sender_id": sender_id,
        "recipient_id": recipient_id
    })
    return jsonify({"success": True, "message": "Friend request sent."})

@app.route("/api/friend_status/student/<int:student_id>", methods=["GET"])
def api_friend_status_by_student(student_id):
    session_key = request.cookies.get("session_key")
    session_obj = sessions_collection.find_one({"session_key": session_key})
    if not session_obj:
        return jsonify({"success": False, "error": "Not authenticated."}), 401

    user_id = session_obj["user_id"]
    other_user = users_collection.find_one({"student_id": student_id})
    if not other_user:
        return jsonify({"success": False, "error": "Target profile is not a student account."}), 404

    status = get_friend_status(user_id, other_user["_id"])
    return jsonify({"success": True, "status": status})

@app.route("/api/friend_request/incoming", methods=["GET"])
def api_incoming_friend_requests():
    session_key = request.cookies.get("session_key")
    session_obj = sessions_collection.find_one({"session_key": session_key})
    if not session_obj:
        return jsonify({"success": False, "error": "Not authenticated."}), 401

    user_id = session_obj["user_id"]
    requests = list(friend_requests_collection.find({"recipient_id": user_id}))
    for r in requests:
        r["_id"] = str(r["_id"])
        sender = users_collection.find_one({"_id": r["sender_id"]})
        r["sender_username"] = sender["username"] if sender else "Unknown"
        r["sender_full_name"] = sender.get("full_name") if sender else None
        r["sender_student_id"] = sender.get("student_id") if sender else None
        r["sender_user_id"] = str(sender["_id"]) if sender else None
        r["sender_role"] = sender.get("role") if sender else None
        r["sender_id"] = str(r["sender_id"])
        r["recipient_id"] = str(r["recipient_id"])
    return jsonify(requests)

@app.route("/api/friend_request/<request_id>/accept", methods=["POST"])
def api_accept_friend_request(request_id):
    session_key = request.cookies.get("session_key")
    session_obj = sessions_collection.find_one({"session_key": session_key})
    if not session_obj:
        return jsonify({"success": False, "error": "Not authenticated."}), 401

    try:
        request_obj_id = ObjectId(request_id)
    except InvalidId:
        return jsonify({"success": False, "error": "Invalid friend request id."}), 400

    user_id = session_obj["user_id"]
    friend_request = friend_requests_collection.find_one({"_id": request_obj_id})
    if not friend_request:
        return jsonify({"success": False, "error": "Friend request not found."}), 404

    if friend_request["recipient_id"] != user_id:
        return jsonify({"success": False, "error": "Not authorized."}), 403

    sender_id = friend_request["sender_id"]
    friends_collection.insert_one({"user_id": user_id, "friend_id": sender_id})
    friends_collection.insert_one({"user_id": sender_id, "friend_id": user_id})
    friend_requests_collection.delete_one({"_id": request_obj_id})
    return jsonify({"success": True, "message": "Friend request accepted."})

@app.route("/api/friend_request/<request_id>/reject", methods=["POST"])
def api_reject_friend_request(request_id):
    session_key = request.cookies.get("session_key")
    session_obj = sessions_collection.find_one({"session_key": session_key})
    if not session_obj:
        return jsonify({"success": False, "error": "Not authenticated."}), 401

    try:
        request_obj_id = ObjectId(request_id)
    except InvalidId:
        return jsonify({"success": False, "error": "Invalid friend request id."}), 400

    user_id = session_obj["user_id"]
    friend_request = friend_requests_collection.find_one({"_id": request_obj_id})
    if not friend_request:
        return jsonify({"success": False, "error": "Friend request not found."}), 404

    if friend_request["recipient_id"] != user_id:
        return jsonify({"success": False, "error": "Not authorized."}), 403

    friend_requests_collection.delete_one({"_id": request_obj_id})
    return jsonify({"success": True, "message": "Friend request rejected."})

@app.route("/api/friend/<friend_id>", methods=["DELETE"])
def api_delete_friend(friend_id):
    session_key = request.cookies.get("session_key")
    session_obj = sessions_collection.find_one({"session_key": session_key})
    if not session_obj:
        return jsonify({"success": False, "error": "Not authenticated."}), 401

    try:
        friend_obj_id = ObjectId(friend_id)
    except InvalidId:
        return jsonify({"success": False, "error": "Invalid friend id."}), 400

    user_id = session_obj["user_id"]
    friends_collection.delete_one({"user_id": user_id, "friend_id": friend_obj_id})
    friends_collection.delete_one({"user_id": friend_obj_id, "friend_id": user_id})
    return jsonify({"success": True, "message": "Friend deleted."})

@app.route("/api/friend/student/<int:student_id>", methods=["DELETE"])
def api_delete_friend_by_student(student_id):
    session_key = request.cookies.get("session_key")
    session_obj = sessions_collection.find_one({"session_key": session_key})
    if not session_obj:
        return jsonify({"success": False, "error": "Not authenticated."}), 401

    user_id = session_obj["user_id"]
    friend_user = users_collection.find_one({"student_id": student_id})
    if not friend_user:
        return jsonify({"success": False, "error": "Friend not found."}), 404

    friends_collection.delete_one({"user_id": user_id, "friend_id": friend_user["_id"]})
    friends_collection.delete_one({"user_id": friend_user["_id"], "friend_id": user_id})
    return jsonify({"success": True, "message": "Friend deleted."})

@app.route("/api/friends", methods=["GET"])
def api_get_friends():
    session_key = request.cookies.get("session_key")
    session_obj = sessions_collection.find_one({"session_key": session_key})
    if not session_obj:
        return jsonify({"success": False, "error": "Not authenticated."}), 401

    user_id = session_obj["user_id"]
    friends = list(friends_collection.find({"user_id": user_id}))
    for f in friends:
        f["_id"] = str(f["_id"])
        friend_user = users_collection.find_one({"_id": f["friend_id"]})
        f["friend_username"] = friend_user["username"] if friend_user else "Unknown"
        f["friend_full_name"] = friend_user.get("full_name") if friend_user else None
        f["friend_student_id"] = friend_user.get("student_id") if friend_user else None
        f["friend_user_id"] = str(friend_user["_id"]) if friend_user else None
        f["friend_role"] = friend_user.get("role") if friend_user else None
        f["user_id"] = str(f["user_id"])
        f["friend_id"] = str(f["friend_id"])
    return jsonify(friends)


if __name__ == '__main__':
    app.run(debug=True)
