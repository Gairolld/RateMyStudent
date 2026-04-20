import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login({ setAuth, LightMode }) {
  const [isSignup, setIsSignup] = useState(false);
  // Login state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  // Signup state
  const [signupForm, setSignupForm] = useState({ username: "", password: "", role: "student", full_name: "", school: "" });
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const navigate = useNavigate();
  const textColor = LightMode ? "#111" : "#f3f4f6";
  const helperTextColor = LightMode ? "#333" : "#d1d5db";

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        const meRes = await fetch("/api/me", { credentials: "include" });
        const meData = await meRes.json();
        setAuth({
          loggedIn: true,
          studentId: meData?.student_id || null,
          userId: meData?.user_id || null,
          role: meData?.role || null,
        });
        navigate(meData?.role === "admin" ? "/admin" : "/");
      } else {
        setLoginError(data.error || "Login failed");
      }
    } catch {
      setLoginError("Login failed");
    }
    setLoginLoading(false);
  };

  // Signup handler
  const handleSignupChange = (e) => {
    setSignupForm({ ...signupForm, [e.target.name]: e.target.value });
  };
  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupError("");
    setSignupSuccess("");
    setSignupLoading(true);
    try {
      const res = await fetch("/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(signupForm),
      });
      const data = await res.json();
      if (data.success) {
        setAuth({
          loggedIn: true,
          studentId: data.student_id || null,
          userId: data.user_id || null,
          role: data.role || null,
        });
        setSignupSuccess("Signup successful! Redirecting to home...");
        setTimeout(() => {
          navigate("/");
        }, 1500);
      } else {
        setSignupError(data.error || "Signup failed");
      }
    } catch {
      setSignupError("Signup failed");
    }
    setSignupLoading(false);
  };

  return (
    <div style={{ padding: 20, maxWidth: 400, margin: "0 auto", color: textColor, position: "relative" }}>
      {!isSignup ? (
        <>
          <h2 style={{ color: textColor }}>Login</h2>
          <form onSubmit={handleLogin}>
            <input
              name="username"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              disabled={loginLoading}
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={loginLoading}
            />
            <button type="submit" disabled={loginLoading}>{loginLoading ? "Logging in..." : "Login"}</button>
          </form>
          {loginError && <div style={{ color: "red", marginTop: 8 }}>{loginError}</div>}
          <div style={{ marginTop: 16, color: helperTextColor }}>
            Don't have an account? <span style={{ color: "#2563eb", cursor: "pointer" }} onClick={() => setIsSignup(true)}>Sign up here</span>.
          </div>
        </>
      ) : (
        <>
          <h2 style={{ color: textColor }}>Sign Up</h2>
          <form onSubmit={handleSignup}>
            <input name="username" placeholder="Username" value={signupForm.username} onChange={handleSignupChange} required disabled={signupLoading} />
            <input name="password" type="password" placeholder="Password" value={signupForm.password} onChange={handleSignupChange} required disabled={signupLoading} />
            <select name="role" value={signupForm.role} onChange={handleSignupChange} required disabled={signupLoading}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
            <input name="full_name" placeholder="Full Name" value={signupForm.full_name} onChange={handleSignupChange} disabled={signupLoading} />
            <input name="school" placeholder="School" value={signupForm.school} onChange={handleSignupChange} disabled={signupLoading} />
            <button type="submit" disabled={signupLoading}>{signupLoading ? "Signing up..." : "Sign Up"}</button>
          </form>
          {signupError && <div style={{ color: "red", marginTop: 8 }}>{signupError}</div>}
          {signupSuccess && <div style={{ color: "green", marginTop: 8 }}>{signupSuccess}</div>}
          <div style={{ marginTop: 16, color: helperTextColor }}>
            Already have an account? <span style={{ color: "#2563eb", cursor: "pointer" }} onClick={() => setIsSignup(false)}>Log in here</span>.
          </div>
        </>
      )}
    </div>
  );
}

export default Login;

