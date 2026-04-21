import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiHome } from "react-icons/fi";

function Header({ onSearch, query, setQuery, LightMode, setLightMode, auth, handleLogout, myStudentId, myUserId, myRole, searchResults, searching }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const [inputWidth, setInputWidth] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    if (inputRef.current) {
      setInputWidth(inputRef.current.offsetWidth);
    }
  }, [query, LightMode]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showSearch = location.pathname !== "/login";

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setShowDropdown(true);
  };

  const handleResultClick = (studentId) => {
    setShowDropdown(false);
    setQuery("");
    navigate(`/student/${studentId}`);
  };

  const handleBlur = (e) => {
    setTimeout(() => setShowDropdown(false), 120);
  };

  return (
    <header style={headerStyle(LightMode)}>
      <nav style={navStyleFlex}>
        <div style={leftNavStyleFlex}>
          <button
            aria-label="Home"
            style={homeButtonStyle}
            onClick={() => navigate("/")}
          >
            <FiHome size={26} style={{ margin: 0, verticalAlign: "middle", display: "block" }} />
          </button>
          {windowWidth >= 1056 && (
            <span
              style={{
                fontWeight: 800,
                fontSize: 28,
                letterSpacing: 1,
                marginLeft: 24,
                cursor: "pointer",
                fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
                color: LightMode ? "#f9fafb" : "#f9fafb",
                textShadow: LightMode ? "0 2px 8px rgba(0,0,0,0.13)" : "0 2px 8px rgba(0,0,0,0.22)"
              }}
              onClick={() => navigate("/")}
            >
              RateMyStudent
            </span>
          )}
        </div>
        <div style={centerNavStyleFlex}>
          {showSearch && auth && auth.loggedIn && (
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 320 }}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Find a Student"
                value={query}
                onChange={handleInputChange}
                onFocus={() => setShowDropdown(true)}
                onBlur={handleBlur}
                style={{ ...searchInputStyle, width: 320, fontSize: 16, marginRight: 0 }}
                autoComplete="off"
              />
              {showDropdown && query.trim() && (
                <div
                  ref={dropdownRef}
                  style={dropdownStyle(inputWidth)}
                >
                  {searching ? (
                    <div style={{ padding: 16, textAlign: "center" }}>Searching...</div>
                  ) : searchResults && searchResults.length > 0 ? (
                    searchResults.slice(0, 8).map((student) => (
                      <div
                        key={student._id}
                        onMouseDown={() => handleResultClick(student._id)}
                        style={dropdownItemStyle}
                        onMouseEnter={e => e.target.style.background = "rgba(0, 0, 0, 0.05)"}
                        onMouseLeave={e => e.target.style.background = "none"}
                      >
                        {student.name} <span style={{ color: LightMode ? "#666" : "#d1d5db", fontWeight: 400, fontSize: 14 }}>({student.school})</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: 16, color: "#666", textAlign: "center" }}>No students found.</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <div style={rightNavStyleFlex}>
          {windowWidth >= 1056 && (
            <button
              onClick={() => setLightMode(!LightMode)}
              style={lightModeButtonStyleWide(LightMode)}
            >
              <span style={{ marginRight: 8 }}>{LightMode ? "🌙" : "☀️"}</span>
              <span>{LightMode ? "Dark" : "Light"}</span>
            </button>
          )}
          {auth && auth.loggedIn ? (
            <>
              {myStudentId && (
                <button onClick={() => navigate(`/student/${myStudentId}`)} style={navButtonStyle}>Profile</button>
              )}
              {myRole === "teacher" && myUserId && (
                <button onClick={() => navigate(`/teacher/${myUserId}`)} style={navButtonStyle}>Profile</button>
              )}
              {myRole === "admin" && (
                <button onClick={() => navigate(`/admin`)} style={navButtonStyle}>Profile</button>
              )}
              <button onClick={handleLogout} style={{ ...navButtonStyle, background: "#ef4444", color: "#fff" }}>Logout</button>
            </>
          ) : (
            location.pathname !== "/login" && (
              <button onClick={() => navigate("/login") } style={navButtonStyle}>Login</button>
            )
          )}
        </div>
      </nav>
    </header>
  );
}


const headerStyle = (LightMode) => ({
  background: LightMode ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "linear-gradient(135deg, #23272f 0%, #181c22 100%)",
  color: "#fff",
  padding: "0 0 10px 0",
  marginBottom: 0,
  boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
  position: "sticky",
  top: 0,
  zIndex: 1000,
  borderBottomLeftRadius: 0,
  borderBottomRightRadius: 0,
  transition: "background 0.3s"
});


const navStyleFlex = {
  display: "flex",
  alignItems: "center",
  width: "100%",
  padding: "10px 24px 0 24px",
  minHeight: 56,
};

const leftNavStyleFlex = {
  display: "flex",
  alignItems: "center",
  flex: "0 1 auto",
  minWidth: 0,
  paddingLeft: 48,
};

const centerNavStyleFlex = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "1 1 0%",
  minWidth: 0,
};

const rightNavStyleFlex = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  flex: "0 1 auto",
  minWidth: 0,
  gap: 16,
  paddingRight: 48,
};

const lightModeButtonStyleWide = (LightMode) => ({
  display: "flex",
  alignItems: "center",
  flexDirection: "row",
  padding: "9px 28px",
  fontSize: "16px",
  backgroundColor: LightMode ? "#1a1a2e" : "#fff",
  color: LightMode ? "#fff" : "#1a1a2e",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  transition: "0.2s",
  marginRight: "0px",
  marginLeft: "48px",
  fontWeight: 600,
  boxShadow: LightMode ? "0 1px 4px rgba(0,0,0,0.13)" : "0 1px 4px rgba(0,0,0,0.07)"
});

const homeButtonStyle = {
  background: "rgba(255,255,255,0.12)",
  border: "none",
  borderRadius: 10,
  padding: 0,
  width: 40,
  height: 40,
  aspectRatio: '1 / 1',
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  transition: "background 0.2s, box-shadow 0.2s",
  outline: "none"
};

const navButtonStyle = {
  padding: "9px 20px",
  fontSize: "16px",
  background: "rgba(255, 255, 255, 0.18)",
  color: "#f9fafb",
  border: "1px solid rgba(255, 255, 255, 0.22)",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 500,
  marginLeft: 10,
  marginRight: 0,
  transition: "all 0.18s",
  boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
};

const lightModeButtonStyle = (LightMode) => ({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px 16px",
  fontSize: "15px",
  backgroundColor: LightMode ? "#1a1a2e" : "#fff",
  color: LightMode ? "#fff" : "#1a1a2e",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  transition: "0.2s",
  marginRight: "12px",
  fontWeight: 600,
  boxShadow: LightMode ? "0 1px 4px rgba(0,0,0,0.13)" : "0 1px 4px rgba(0,0,0,0.07)"
});

const searchInputStyle = {
  padding: "9px 16px",
  fontSize: "16px",
  width: "320px",
  borderRadius: 8,
  border: "1.5px solid rgba(255, 255, 255, 0.32)",
  marginRight: 8,
  color: "#18181b",
  background: "rgba(255, 255, 255, 0.97)",
  backdropFilter: "blur(10px)",
  outline: "none",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  transition: "border 0.2s, box-shadow 0.2s",
  height: "38px",
  boxSizing: "border-box"
};

const dropdownStyle = (inputWidth) => ({
  position: "absolute",
  left: "50%",
  top: 48,
  transform: "translateX(-50%)",
  width: inputWidth || 320,
  background: "rgba(255, 255, 255, 0.97)",
  color: "#18181b",
  border: "1px solid rgba(255, 255, 255, 0.3)",
  borderRadius: 14,
  boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
  zIndex: 2000,
  maxHeight: 320,
  overflowY: "auto",
  backdropFilter: "blur(20px)"
});

const dropdownItemStyle = {
  padding: "13px 20px",
  cursor: "pointer",
  borderBottom: "1px solid rgba(0, 0, 0, 0.07)",
  fontWeight: 500,
  fontSize: 16,
  background: "none",
  transition: "background 0.18s"
};


export default Header;
