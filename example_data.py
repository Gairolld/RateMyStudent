import os
from dotenv import load_dotenv
from pymongo import MongoClient
from werkzeug.security import generate_password_hash
import random


load_dotenv()

# connect to MongoDB
mongo_uri = os.getenv("MONGO_URI")
client = MongoClient(mongo_uri)
db = client["rate_my_student"]

students_collection = db["students"]
users_collection = db["users"]
reviews_collection = db["reviews"]
sessions_collection = db["sessions"]
friend_requests_collection = db["friend_requests"]
friends_collection = db["friends"]
school_appeals_collection = db["school_change_appeals"]

# reset all collections
students_collection.delete_many({})
users_collection.delete_many({})
reviews_collection.delete_many({})
sessions_collection.delete_many({})
friend_requests_collection.delete_many({})
friends_collection.delete_many({})
school_appeals_collection.delete_many({})
print("Database wiped.")

def generate_friend_code():
    while True:
        code = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=6))
        if not users_collection.find_one({"friend_code": code}):
            return code

def unique_student_id():
    while True:
        student_id = random.randint(10000000, 99999999)
        if not students_collection.find_one({"_id": student_id}):
            return student_id

# insert example data
student_names = [
    "Alice Smith", "Bob Johnson", "Charlie Lee", "Diana King", "Evan Wright",
    "Fiona Clark", "George Hall", "Hannah Young", "Ian Walker", "Julia Allen"
]
teacher_names = [
    "Mr. Adams", "Ms. Baker", "Mrs. Carter", "Dr. Davis", "Prof. Evans"
]
schools = [
    "Central High", "Westview Academy", "Lakeside School", "Greenwood Prep", "Hillcrest Institute"
]


# make 5 teacher users
teacher_ids = []
teacher_usernames = []
for i in range(5):
    username = f"teacher{i+1}"
    full_name = teacher_names[i]
    school = random.choice(schools)
    password = "password123"
    friend_code = generate_friend_code()
    pw_hash = generate_password_hash(password)
    result = users_collection.insert_one({
        "username": username,
        "password_hash": pw_hash,
        "role": "teacher",
        "friend_code": friend_code,
        "full_name": full_name,
        "school": school
    })
    teacher_ids.append(result.inserted_id)
    teacher_usernames.append(username)

# make 10 student users
student_ids = []
for i in range(10):
    username = f"student{i+1}"
    full_name = student_names[i]
    school = random.choice(schools)
    password = "password123"
    student_id = unique_student_id()
    friend_code = generate_friend_code()
    pw_hash = generate_password_hash(password)
    students_collection.insert_one({
        "_id": student_id,
        "name": full_name,
        "school": school,
        "avg_rating": 0
    })
    users_collection.insert_one({
        "username": username,
        "password_hash": pw_hash,
        "role": "student",
        "friend_code": friend_code,
        "student_id": student_id,
        "full_name": full_name,
        "school": school
    })
    student_ids.append(student_id)

# example comments
review_comments = [
    "Great student!",
    "Needs improvement in participation.",
    "Excellent performance.",
    "Very respectful and hardworking.",
    "Shows leadership skills.",
    "Could focus more in class.",
    "Pleasure to teach.",
    "Struggles with deadlines.",
    "Always prepared.",
    "Creative thinker."
]

# make 2-5 fake reviews per student from random teachers
for student_id in student_ids:
    num_reviews = random.randint(2, 5)
    used_teachers = set()
    for _ in range(num_reviews):
        # pick a  teacher who hasn't reviewed this student yet
        available_teachers = [tid for tid in teacher_ids if tid not in used_teachers]
        if not available_teachers:
            break
        teacher_id = random.choice(available_teachers)
        used_teachers.add(teacher_id)
        rating = random.randint(1, 5)
        comment = random.choice(review_comments)
        reviews_collection.insert_one({
            "student_id": student_id,
            "rating": rating,
            "comment": comment,
            "user_id": teacher_id,
            "visible_to_friends": True
        })

print("Example Data Done")


