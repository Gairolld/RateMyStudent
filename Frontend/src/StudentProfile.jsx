import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function StudentProfile() {
  const { userid } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [auth, setAuth] = useState(false);

  useEffect(() => {
    fetch(`/api/student/${userid}`, { credentials: "include" })
      .then((res) => {
        if (res.status === 401) setAuth(false);
        return res.json();
      })
      .then((data) => {
        if (data.student) {
          setStudent(data.student);
          setReviews(data.reviews);
          setAuth(true);
        } else if (data.error === "Not authenticated.") {
          setAuth(false);
        } else {
          setError(data.error || "Failed to load student");
        }
      })
      .catch(() => setError("Failed to load student"));
  }, [userid]);

  const handleReview = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch(`/api/student/${userid}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rating, comment }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Review posted!");
        setReviews((prev) => [...prev, { rating, comment }]);
        setRating(0);
        setComment("");
      } else {
        setError(data.error || "Failed to post review");
      }
    } catch {
      setError("Failed to post review");
    }
    setLoading(false);
  };

  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!student) return <div>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>{student.name}</h2>
      <p>School: {student.school}</p>
      <p>Average Rating: {student.avg_rating}</p>
      <h3>Reviews</h3>
      <ul>
        {reviews.map((r, i) => (
          <li key={i}>
            <b>Rating:</b> {r.rating} <br />
            <b>Comment:</b> {r.comment}
          </li>
        ))}
      </ul>
      <h3>Post a Review</h3>
      {auth ? (
        <form onSubmit={handleReview}>
          <input type="number" min="1" max="5" value={rating} onChange={e => setRating(Number(e.target.value))} required placeholder="Rating (1-5)" disabled={loading} />
          <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Comment" required disabled={loading} />
          <button type="submit" disabled={loading}>{loading ? "Submitting..." : "Submit"}</button>
        </form>
      ) : (
        <div style={{ color: "#888", marginTop: 8 }}>
          Please <span style={{ color: "#2563eb", cursor: "pointer" }} onClick={() => navigate('/login')}>log in</span> to post a review.
        </div>
      )}
      {success && <div style={{ color: "green", marginTop: 8 }}>{success}</div>}
      {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
    </div>
  );
}

export default StudentProfile;

