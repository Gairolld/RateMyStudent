import { useNavigate } from "react-router-dom";

function SearchResults({ results, LightMode }) {
  const navigate = useNavigate();
  const textColor = LightMode ? "#111" : "#f3f4f6";
  const mutedColor = LightMode ? "#444" : "#d1d5db";
  const buttonStyle = {
    marginLeft: 10,
    padding: "6px 12px",
    borderRadius: 6,
    border: "none",
    background: LightMode ? "#2563eb" : "#3b82f6",
    color: "#fff",
    cursor: "pointer",
  };

  if (!results.length) return <div style={{ color: mutedColor }}>No students found.</div>;
  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ color: textColor }}>Search Results</h3>
      <ul>
        {results.map((student) => (
          <li key={student._id} style={{ color: textColor }}>
            <span>{student.name} ({student.school})</span>
            <button onClick={() => navigate(`/student/${student._id}`)} style={buttonStyle}>View Profile</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SearchResults;

