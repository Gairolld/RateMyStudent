const input = document.getElementById('searchInput');
const results = document.getElementById('searchResults');

input.addEventListener('input', async () => {

    const query = input.value.trim();
    if (!query) {
        results.style.display = 'none';
        return;
    }

    const res = await fetch(`/search?name=${encodeURIComponent(query)}`);
    const students = await res.json();
    results.innerHTML = '';
    students.forEach(s => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="/student/${s._id}">${s.name} - Avg: ${s.avg_rating || 0}</a>`;
        results.appendChild(li);
    });

    results.style.display = students.length ? 'block' : 'none';
});