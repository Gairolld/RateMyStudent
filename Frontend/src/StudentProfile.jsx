import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function StudentProfile({ LightMode }) {
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

  if (error) return <div style={{ color: "red", padding: 24 }}>{error}</div>;
  if (!student) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 24 }}>
      <div style={{
        background: LightMode ? "#f5f7fa" : "#23243a",
        borderRadius: 14,
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        padding: 32,
        marginBottom: 32
      }}>
        <h2 style={{ marginBottom: 8 }}>{student.name}</h2>
        <p style={{ margin: 0, color: "#666" }}>School: {student.school}</p>
        <p style={{ margin: "8px 0 0 0", color: "#666" }}>Average Rating: <b>{student.avg_rating}</b></p>
      </div>
      <h3 style={{ marginBottom: 12 }}>Reviews</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
        {reviews.length === 0 && <div style={{ color: "#888" }}>No reviews yet.</div>}
        {reviews.map((r, i) => (
          <div key={i} style={{
            background: LightMode ? "#fff" : "#18192b",
            borderRadius: 10,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            padding: 18,
            borderLeft: `6px solid ${r.rating >= 4 ? '#22c55e' : r.rating >= 2 ? '#facc15' : '#ef4444'}`
          }}>
            <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>Rating: {r.rating} / 5</div>
            <div style={{ color: "#444", fontSize: 15 }}>{r.comment}</div>
          </div>
        ))}
      </div>
      <h3 style={{ marginBottom: 10 }}>Post a Review</h3>
      {auth ? (
        <form onSubmit={handleReview} style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 400 }}>
          <input type="number" min="1" max="5" value={rating} onChange={e => setRating(Number(e.target.value))} required placeholder="Rating (1-5)" disabled={loading}
            style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16 }} />
          <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Comment" required disabled={loading}
            style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16 }} />
          <button type="submit" disabled={loading} style={{ padding: "10px 0", borderRadius: 6, background: "#2563eb", color: "#fff", fontWeight: 600, fontSize: 16, border: "none", cursor: "pointer" }}>{loading ? "Submitting..." : "Submit"}</button>
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

