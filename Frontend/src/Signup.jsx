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
      const res = await fetch("/api/signup", {
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'linear-gradient(135deg, #23272f 0%, #181c22 100%)'
        : 'linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%)',
      transition: 'background 0.3s',
    }}>
      <div style={{
        padding: 40,
        maxWidth: 420,
        width: '100%',
        margin: '0 auto',
        color: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#f9fafb' : '#23272f',
        background: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'rgba(31, 41, 55, 0.99)' : 'rgba(255, 255, 255, 0.99)',
        borderRadius: 18,
        boxShadow: '0 12px 32px rgba(0,0,0,0.13)',
        backdropFilter: 'blur(20px)',
        position: 'relative',
        border: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? '1.5px solid #374151' : '1.5px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        animation: 'fadeInUp 0.7s cubic-bezier(.23,1.01,.32,1)'
      }}>
        <div style={{ marginBottom: 24 }}>
          <img src="/favicon.svg" alt="logo" style={{ width: 54, height: 54, borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }} />
        </div>
        <h2 style={{ fontWeight: 800, fontSize: 28, marginBottom: 18, letterSpacing: 1 }}>Sign Up</h2>
        <form onSubmit={handleSubmit} style={{ width: 320, display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input name="username" placeholder="Username" value={form.username} onChange={handleChange} required disabled={loading} style={inputStyle} />
          </div>
          <div style={{ position: 'relative', width: '100%' }}>
            <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required disabled={loading} style={inputStyle} />
          </div>
          <div style={{ position: 'relative', width: '100%' }}>
            <input name="full_name" placeholder="Full Name" value={form.full_name} onChange={handleChange} disabled={loading} style={inputStyle} />
          </div>
          <div style={{ position: 'relative', width: '100%' }}>
            <input name="school" placeholder="School" value={form.school} onChange={handleChange} disabled={loading} style={inputStyle} />
          </div>
          <div style={{ position: 'relative', width: '100%' }}>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              required
              disabled={loading}
              style={{
                  ...inputStyle,
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='16' height='16' fill='none' stroke='%236366f1' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C%2Fsvg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 16px center',
                  backgroundSize: '18px 18px',
                  paddingRight: 40,
                  cursor: 'pointer',
                }}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
          <button type="submit" disabled={loading} style={buttonStyle}>{loading ? "Signing up..." : "Sign Up"}</button>
        </form>
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
        {success && <div style={{ color: 'green', marginTop: 8 }}>{success}</div>}
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '13px 20px',
  fontSize: 16,
  borderRadius: 9,
  border: '1.5px solid #c7d2fe',
  background: 'rgba(243,244,255,0.95)',
  color: '#23272f',
  marginBottom: 0,
  outline: 'none',
  boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
  transition: 'border 0.2s, box-shadow 0.2s',
  fontWeight: 500,
  display: 'block',
  marginLeft: 'auto',
  marginRight: 'auto',
  boxSizing: 'border-box',
};

const buttonStyle = {
  width: '100%',
  padding: '13px 20px',
  fontSize: 17,
  background: 'linear-gradient(90deg, #6366f1 0%, #a78bfa 100%)',
  background: 'linear-gradient(90deg, #6366f1 0%, #a78bfa 100%)',
  color: '#fff',
  border: 'none',
  borderRadius: 9,
  cursor: 'pointer',
  fontWeight: 700,
  marginTop: 6,
  boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
  transition: 'background 0.18s, box-shadow 0.18s',
  display: 'block',
  marginLeft: 'auto',
  marginRight: 'auto',
  boxSizing: 'border-box',
};

// add fade animation
const styleSheet = document.createElement('style');
styleSheet.innerHTML = `@keyframes fadeInUp { from { opacity: 0; transform: translateY(32px); } to { opacity: 1; transform: none; } }`;
document.head.appendChild(styleSheet);

export default Signup;