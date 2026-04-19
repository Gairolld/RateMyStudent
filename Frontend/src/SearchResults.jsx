import { useNavigate } from "react-router-dom";

function SearchResults({ results }) {
  const navigate = useNavigate();
  if (!results.length) return <div>No students found.</div>;
  return (
    <div style={{ padding: 20 }}>
      <h3>Search Results</h3>
      <ul>
        {results.map((student) => (
          <li key={student._id}>
            <span>{student.name} ({student.school})</span>
            <button onClick={() => navigate(`/student/${student._id}`)} style={{ marginLeft: 10 }}>View Profile</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SearchResults;

