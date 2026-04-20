import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login({ setAuth, LightMode, setLightMode }) {
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
  const textColor = LightMode ? "#18181b" : "#f9fafb";
  const helperTextColor = LightMode ? "#374151" : "#d1d5db";

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch("/api/login", {
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
      const res = await fetch("/api/signup", {
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: LightMode ? 'linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%)' : 'linear-gradient(135deg, #23272f 0%, #181c22 100%)',
      transition: 'background 0.3s',
    }}>
      <div style={{
        padding: 40,
        maxWidth: 420,
        width: '100%',
        margin: '0 auto',
        color: textColor,
        background: LightMode ? 'rgba(255, 255, 255, 0.99)' : 'rgba(31, 41, 55, 0.99)',
        borderRadius: 18,
        boxShadow: '0 12px 32px rgba(0,0,0,0.13)',
        backdropFilter: 'blur(20px)',
        position: 'relative',
        border: LightMode ? '1.5px solid #e5e7eb' : '1.5px solid #374151',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        animation: 'fadeInUp 0.7s cubic-bezier(.23,1.01,.32,1)'
      }}>
        <div style={{ marginBottom: 24 }}>
           <img src="/favicon.svg" alt="logo" style={{ width: 54, height: 54, borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }} />
        </div>
        {!isSignup ? (
          <>
            <h2 style={{ color: textColor, fontWeight: 800, fontSize: 28, marginBottom: 18, letterSpacing: 1 }}>Login</h2>
            <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  name="username"
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  disabled={loginLoading}
                  style={inputStyle(LightMode)}
                />
              </div>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  name="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loginLoading}
                  style={inputStyle(LightMode)}
                />
              </div>
              <button type="submit" disabled={loginLoading} style={buttonStyle(LightMode)}>{loginLoading ? 'Logging in...' : 'Login'}</button>
            </form>
            {loginError && <div style={{ color: 'red', marginTop: 8 }}>{loginError}</div>}
            <div style={{ marginTop: 18, color: helperTextColor, fontSize: 15 }}>
              Don't have an account? <span style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 600 }} onClick={() => setIsSignup(true)}>Sign up here</span>.
            </div>
          </>
        ) : (
          <>
            <h2 style={{ color: textColor, fontWeight: 800, fontSize: 28, marginBottom: 18, letterSpacing: 1 }}>Sign Up</h2>
            <form onSubmit={handleSignup} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <input name="username" placeholder="Username" value={signupForm.username} onChange={handleSignupChange} required disabled={signupLoading} style={inputStyle(LightMode)} />
              </div>
              <div style={{ position: 'relative', width: '100%' }}>
                <input name="password" type="password" placeholder="Password" value={signupForm.password} onChange={handleSignupChange} required disabled={signupLoading} style={inputStyle(LightMode)} />
              </div>
              <div style={{ position: 'relative', width: '100%' }}>
                <input name="full_name" placeholder="Full Name" value={signupForm.full_name} onChange={handleSignupChange} disabled={signupLoading} style={inputStyle(LightMode)} />
              </div>
              <div style={{ position: 'relative', width: '100%' }}>
                <input name="school" placeholder="School" value={signupForm.school} onChange={handleSignupChange} disabled={signupLoading} style={inputStyle(LightMode)} />
              </div>
              <div style={{ position: 'relative', width: '100%' }}>
                <select name="role" value={signupForm.role} onChange={handleSignupChange} required disabled={signupLoading} style={{...inputStyle(LightMode), appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', paddingRight: 32, backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'16\' height=\'16\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M4 6l4 4 4-4\' stroke=\'%236366f1\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', cursor: 'pointer'}}>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
              <button type="submit" disabled={signupLoading} style={buttonStyle(LightMode)}>{signupLoading ? 'Signing up...' : 'Sign Up'}</button>
            </form>
            {signupError && <div style={{ color: 'red', marginTop: 8 }}>{signupError}</div>}
            {signupSuccess && <div style={{ color: 'green', marginTop: 8 }}>{signupSuccess}</div>}
            <div style={{ marginTop: 18, color: helperTextColor, fontSize: 15 }}>
              Already have an account? <span style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 600 }} onClick={() => setIsSignup(false)}>Log in here</span>.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;
// input styles with text color for dark/light
const inputStyle = (LightMode) => ({
  width: '320px',
  maxWidth: '100%',
  padding: '13px 16px',
  fontSize: 16,
  borderRadius: 9,
  border: LightMode ? '1.5px solid #c7d2fe' : '1.5px solid #374151',
  background: LightMode ? 'rgba(243,244,255,0.95)' : 'rgba(31,41,55,0.93)',
  color: LightMode ? '#23272f' : '#f3f4f6',
  marginBottom: 0,
  outline: 'none',
  boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
  transition: 'border 0.2s, box-shadow 0.2s',
  fontWeight: 500,
  display: 'block',
  marginLeft: 'auto',
  marginRight: 'auto',
  caretColor: LightMode ? '#23272f' : '#f3f4f6',
  boxSizing: 'border-box',
});

const buttonStyle = (LightMode) => ({
  width: '320px',
  maxWidth: '100%',
  padding: '13px 0',
  fontSize: 17,
  background: LightMode ? 'linear-gradient(90deg, #6366f1 0%, #a78bfa 100%)' : 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)',
  color: LightMode ? '#fff' : '#fff',
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
});

const styleSheet = document.createElement('style');
styleSheet.innerHTML = `
@keyframes fadeInUp { from { opacity: 0; transform: translateY(32px); } to { opacity: 1; transform: none; } }
input::placeholder, select::placeholder {
  color: #a1a1aa;
  opacity: 1;
}
input, select {
  caret-color: #23272f;
}
.dark-mode input, .dark-mode select {
  color: #f3f4f6;
  caret-color: #f3f4f6;
}
.dark-mode input::placeholder, .dark-mode select::placeholder {
  color: #d1d5db;
}
`;
document.head.appendChild(styleSheet);
