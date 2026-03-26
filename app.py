import os
from dotenv import load_dotenv
from flask import Flask, render_template, request, redirect, url_for
from pymongo import MongoClient

load_dotenv()

app = Flask(__name__)

# this sets up the MongoDB connection
mongo_uri = os.getenv("MONGO_URI")
client = MongoClient(mongo_uri)
db = client["rate_my_student"]

# students will be connected to reviews by student_id
students_collection = db["students"]
reviews_collection = db["reviews"]

# route for viewing student profile
@app.route('/student/<int:userid>', methods=['GET', 'POST'], endpoint='student')
def profile(userid):
    # fetch student 
    student = students_collection.find_one({"_id": userid})
    if "avg_rating" not in student:
    student["avg_rating"] = 0

    # handles review submission
    if request.method == 'POST':
        rating = int(request.form['rating'])
        comment = request.form['comment']

        # insert the new review into the collection
        reviews_collection.insert_one({
            "student_id": userid,
            "rating": rating,
            "comment": comment
        })

        # we need to recalculate the average rating when a review is added
        all_reviews = list(reviews_collection.find({"student_id": userid}))
        avg = 0
        if len(all_reviews) > 0:
            avg = sum(r["rating"] for r in all_reviews) / len(all_reviews)
            avg = round(avg, 2)
        
        
        # update the student's average rating
        students_collection.update_one(
            {"_id": userid},
            {"$set": {"avg_rating": avg}},
            upsert=True
        )

        # refreshes the page so it shows the new review and avg_rating
        return redirect(url_for('student', userid=userid))

    # show student and reviews on page load
    reviews = list(reviews_collection.find({"student_id": userid}))
    return render_template('student.html', student=student, reviews=reviews)

    #Basic search endpoint
    @app.route("/search")
    def search():
        name = request.args.get("name")

        students = list(students_collection.find({
            "name": {"$regex": name, "$options": "i"}
        }))

        return render_template("results.html", students=students)

if __name__ == '__main__':
    app.run(debug=True)
