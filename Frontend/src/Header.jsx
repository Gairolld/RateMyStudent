import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function Header({ onSearch, query, setQuery, LightMode, setLightMode, auth, handleLogout, myStudentId, myUserId, myRole, searchResults, searching }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const [inputWidth, setInputWidth] = useState(0);

  useEffect(() => {
    if (inputRef.current) {
      setInputWidth(inputRef.current.offsetWidth);
    }
  }, [query, LightMode]);

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
    <header style={{
      background: LightMode ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "linear-gradient(135deg, #2d3748 0%, #1a202c 100%)",
      color: "#fff",
      padding: "20px 0 10px 0",
      marginBottom: 30,
      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      position: "sticky",
      top: 0,
      zIndex: 1000
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        maxWidth: 900,
        margin: "0 auto",
        padding: "0 20px"
      }}>
        <h1 style={{ cursor: "pointer", fontWeight: 700, fontSize: 32, letterSpacing: 1 }} onClick={() => navigate("/")}>RateMyStudent</h1>
        <div style={{ display: "flex", alignItems: "center" }}>
          <button
            onClick={() => setLightMode(!LightMode)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              fontSize: "14px",
              backgroundColor: LightMode ? "#1a1a2e" : "#fff",
              color: LightMode ? "#fff" : "#1a1a2e",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "0.2s",
              marginRight: "12px"
            }}
          >
            {LightMode ? "🌙 Dark" : "☀️ Light"}
          </button>
          {auth && auth.loggedIn ? (
            <>
              {myStudentId && (
                <button onClick={() => navigate(`/student/${myStudentId}`)} style={buttonStyle}>Profile</button>
              )}
              {myRole === "teacher" && myUserId && (
                <button onClick={() => navigate(`/teacher/${myUserId}`)} style={buttonStyle}>Profile</button>
              )}
              {myRole === "admin" && (
                <button onClick={() => navigate(`/admin`)} style={buttonStyle}>Profile</button>
              )}
              <button onClick={handleLogout} style={{ ...buttonStyle, background: "#ef4444" }}>Logout</button>
            </>
          ) : (
            location.pathname !== "/login" && (
              <button onClick={() => navigate("/login") } style={buttonStyle}>Login</button>
            )
          )}
        </div>
      </div>
       {showSearch && auth && auth.loggedIn && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 18, position: "relative" }}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Find a Student"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setShowDropdown(true)}
            onBlur={handleBlur}
            style={{
              padding: "12px",
              fontSize: "16px",
              width: "320px",
              borderRadius: 8,
              border: "1px solid rgba(255, 255, 255, 0.3)",
              marginRight: 8,
              color: "#fff",
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)"
            }}
            autoComplete="off"
          />
          {showDropdown && query.trim() && (
            <div
              ref={dropdownRef}
              style={{
                position: "absolute",
                left: "50%",
                top: 48,
                transform: "translateX(-50%)",
                width: inputWidth || 320,
                background: "rgba(255, 255, 255, 0.95)",
                color: "#111",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                borderRadius: 12,
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                zIndex: 2000,
                maxHeight: 320,
                overflowY: "auto",
                backdropFilter: "blur(20px)"
              }}
            >
              {searching ? (
                <div style={{ padding: 16, textAlign: "center" }}>Searching...</div>
              ) : searchResults && searchResults.length > 0 ? (
                searchResults.slice(0, 8).map((student) => (
                  <div
                    key={student._id}
                    onMouseDown={() => handleResultClick(student._id)}
                    style={{
                      padding: "12px 18px",
                      cursor: "pointer",
                      borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
                      fontWeight: 500,
                      fontSize: 16,
                      background: "none",
                      transition: "background 0.2s"
                    }}
                    onMouseEnter={(e) => e.target.style.background = "rgba(0, 0, 0, 0.05)"}
                    onMouseLeave={(e) => e.target.style.background = "none"}
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
    </header>
  );
}

const buttonStyle = {
  padding: "10px 20px",
  fontSize: "16px",
  background: "rgba(255, 255, 255, 0.2)",
  color: "#fff",
  border: "1px solid rgba(255, 255, 255, 0.3)",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 500,
  marginLeft: 8,
  transition: "all 0.2s",
};

buttonStyle[':hover'] = {
  background: "rgba(255, 255, 255, 0.3)",
  borderColor: "rgba(255, 255, 255, 0.5)",
};

export default Header;
