from flask import Flask, render_template

app = Flask(__name__)

@app.route('/profile/<int:userid>')
def profile(userid):
    return render_template('profile.html', userid=userid)

@app.route('/reviews/<int:studentid>')
def reviews(studentid):
    return render_template('reviews.html', studentid=studentid)

if __name__ == '__main__':
    app.run(debug=True)