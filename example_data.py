import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

mongo_uri = os.getenv("MONGO_URI")
client = MongoClient(mongo_uri)
db = client["rate_my_student"]

students_collection = db["students"]
reviews_collection = db["reviews"]
users_collection = db["users"]

def reset_database():
    # delete everything
    students_collection.delete_many({})
    reviews_collection.delete_many({})

    # insert example students
    students = [
        {"_id": 1, "name": "Alice Johnson", "school": "Example High", "avg_rating": 0},
        {"_id": 2, "name": "Bob Smith", "school": "Example High", "avg_rating": 0},
        {"_id": 3, "name": "Charlie Brown", "school": "Example High", "avg_rating": 0},
    ]

    students_collection.insert_many(students)

    # insert example reviews
    reviews = [
        {"student_id": 1, "rating": 5, "comment": "Great student!"},
        {"student_id": 1, "rating": 4, "comment": "Very hardworking."},
        {"student_id": 2, "rating": 3, "comment": "Average performance."},
        {"student_id": 3, "rating": 5, "comment": "Excellent participation!"},
    ]

    reviews_collection.insert_many(reviews)

    # calculate the average ratings
    for student in students:
        student_id = student["_id"]
        student_reviews = list(reviews_collection.find({"student_id": student_id}))

        if student_reviews:
            avg = sum(r["rating"] for r in student_reviews) / len(student_reviews)
            avg = round(avg, 2)
        else:
            avg = 0

        students_collection.update_one(
            {"_id": student_id},
            {"$set": {"avg_rating": avg}}
        )

    # recreate student profiles for users with the student role
    import random
    users = list(users_collection.find({"role": "student"}))
    for user in users:
        # generate a new student_id if not present
        student_id = user.get("student_id")
        if not student_id:
            while True:
                student_id = random.randint(10000000, 99999999)
                if not students_collection.find_one({"_id": student_id}):
                    break
            users_collection.update_one({"_id": user["_id"]}, {"$set": {"student_id": student_id}})

        # create student profile if not present
        if not students_collection.find_one({"_id": student_id}):
            students_collection.insert_one({
                "_id": student_id,
                "name": user.get("full_name", ""),
                "school": user.get("school", ""),
                "avg_rating": 0
            })

    print("Database reset complete!")

if __name__ == "__main__":
    reset_database()