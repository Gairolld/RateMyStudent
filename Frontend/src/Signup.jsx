import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Signup() {
  const [form, setForm] = useState({ username: "", password: "", role: "student", full_name: "", school: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Signup successful! Redirecting to login...");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setError(data.error || "Signup failed");
      }
    } catch (err) {
      setError("Signup failed");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <input name="username" placeholder="Username" value={form.username} onChange={handleChange} required disabled={loading} />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required disabled={loading} />
        <select name="role" value={form.role} onChange={handleChange} required disabled={loading}>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
        </select>
        <input name="full_name" placeholder="Full Name" value={form.full_name} onChange={handleChange} disabled={loading} />
        <input name="school" placeholder="School" value={form.school} onChange={handleChange} disabled={loading} />
        <button type="submit" disabled={loading}>{loading ? "Signing up..." : "Sign Up"}</button>
      </form>
      {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
      {success && <div style={{ color: "green", marginTop: 8 }}>{success}</div>}
    </div>
  );
}

export default Signup;

