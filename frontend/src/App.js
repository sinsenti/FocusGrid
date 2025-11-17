import React, { useEffect, useState } from "react";
import "./App.css";

function fmtDate(s) {
  return new Date(s).toLocaleString().replace(/:\d{2}\s/, " ");
}

function App() {
  const [category, setCategory] = useState("");
  const [minutes, setMinutes] = useState("");
  const [description, setDescription] = useState("");
  const [stats, setStats] = useState({ week: {}, month: {} });
  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [editCategory, setEditCategory] = useState("");
  const [editMinutes, setEditMinutes] = useState("");
  const [editDescription, setEditDescription] = useState("");

  function fetchStats() {
    fetch("/api/stats").then(res => res.json()).then(setStats);
    doFilter();
  }
  useEffect(() => { fetchStats(); }, []);

  function doFilter(val = search) {
    fetch(`/api/entries_filter?q=${encodeURIComponent(val)}`)
      .then(async res => {
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch {
          console.error("Non-JSON response:", text);
          return [];
        }
      })
      .then(setEntries);
  }

  function addEntry() {
    if (!category || !minutes) return;
    fetch("/api/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, minutes: parseInt(minutes, 10), description })
    }).then(() => {
      setCategory(""); setMinutes(""); setDescription("");
      fetchStats();
    });
  }

  function startEdit(e) {
    setEditId(e.id);
    setEditCategory(e.category);
    setEditMinutes(e.minutes);
    setEditDescription(e.description || "");
  }

  function saveEdit(id) {
    fetch(`/api/update/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: editCategory, minutes: parseInt(editMinutes, 10), description: editDescription
      })
    }).then(() => {
      setEditId(null);
      fetchStats();
    });
  }

  function cancelEdit() {
    setEditId(null);
  }

  function deleteAll() {
    if (!window.confirm("Delete ALL entries? This cannot be undone.")) return;
    fetch("/api/delete_all", { method: "POST" })
      .then(() => fetchStats());
  }

  return (
    <div id="tracker-root">
      <h2>Time Tracker</h2>
      <div className="inputrow">
        <label>Category*</label>
        <input placeholder="E.g., Study, Relax, Code..." value={category}
          onChange={e => setCategory(e.target.value)}
          autoFocus
        />
      </div>
      <div className="inputrow">
        <label>Minutes*</label>
        <input type="number" placeholder="e.g. 60" value={minutes}
          onChange={e => setMinutes(e.target.value)}
        />
      </div>
      <div className="inputrow">
        <label>Description</label>
        <input placeholder="Optional note" value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>
      <button onClick={addEntry}>Add Entry</button>
      <button onClick={deleteAll} style={{ marginLeft: 10, background: "#d22", color: "#fff" }}>
        Delete Everything
      </button>

      <div className="inputrow" style={{ marginTop: 15 }}>
        <label>Find Entry</label>
        <input placeholder="Search by category or description"
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            doFilter(e.target.value);
          }}
        />
      </div>

      <div className="section">
        <h3>This Week</h3>
        {Object.keys(stats.week).length === 0 ? <div className="entrydesc">No entries</div> :
          Object.entries(stats.week)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, mins]) =>
              <div className="stats-row" key={cat}>
                <span>{cat}</span><span>{(mins / 60).toFixed(2)} hrs</span>
              </div>
            )}
      </div>
      <div className="section">
        <h3>This Month</h3>
        {Object.keys(stats.month).length === 0 ? <div className="entrydesc">No entries</div> :
          Object.entries(stats.month)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, mins]) =>
              <div className="stats-row" key={cat}>
                <span>{cat}</span><span>{(mins / 60).toFixed(2)} hrs</span>
              </div>
            )}
      </div>
      <div className="section">
        <h3>Entries</h3>
        <ul>
          {entries.length === 0 ? <div className="entrydesc">No entries found.</div> : entries.map(e =>
            <li key={e.id} className="entryitem">
              {editId === e.id ? (
                <span>
                  <input value={editCategory} onChange={ev => setEditCategory(ev.target.value)} style={{ width: 60 }} />
                  <input type="number" value={editMinutes} onChange={ev => setEditMinutes(ev.target.value)} style={{ width: 52 }} />
                  <input value={editDescription} onChange={ev => setEditDescription(ev.target.value)} style={{ width: 90 }} />
                  <button onClick={() => saveEdit(e.id)} style={{ marginLeft: 4, padding: "2px 10px" }}>Save</button>
                  <button onClick={cancelEdit} style={{ marginLeft: 2, background: "#bbb" }}>Cancel</button>
                </span>
              ) : (
                <span>
                  <b>{e.category}:</b> <span>{e.minutes} mins</span>
                  {e.description ? <span className="entrydesc"> — {e.description}</span> : null}
                  <button onClick={() => startEdit(e)} style={{ marginLeft: 5, fontSize: "0.87em", padding: "2px 7px" }}>Edit</button>
                  <div className="timestamp">{fmtDate(e.timestamp)}</div>
                </span>
              )}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

export default App;
