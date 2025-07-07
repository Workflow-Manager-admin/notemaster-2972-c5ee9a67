import React, { useState, useEffect, useRef } from "react";
import "./App.css";

/**
 * Modern, minimal Notes App with CRUD and search.
 * Colors: primary (#1976d2), secondary (#ffffff), accent (#f50057)
 * Layout: header, left panel for notes list/search, main area for note editing/viewing.
 */

// Utilities for localStorage persistence
const STORAGE_KEY = "notesAppData_v1";
// PUBLIC_INTERFACE
function loadNotesFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}
// PUBLIC_INTERFACE
function saveNotesToStorage(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}
// PUBLIC_INTERFACE
function getInitialNotes() {
  const init = loadNotesFromStorage();
  if (Array.isArray(init)) return init;
  return [];
}

// PUBLIC_INTERFACE
function generateId() {
  // Simple unique ID (not for real prod use)
  return (
    Date.now().toString(36) +
    Math.random()
      .toString(36)
      .substring(2, 6)
  );
}

// PUBLIC_INTERFACE
function App() {
  // Notes state
  const [notes, setNotes] = useState(getInitialNotes);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(false);
  // The fields for the note being edited/created
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  // Theme (light only, but supports user override)
  const [theme] = useState("light");

  // Focus ref to textarea for UX
  const editorRef = useRef(null);

  // On mount, pick first note or none
  useEffect(() => {
    if (!selectedId && notes.length > 0) {
      setSelectedId(notes[0].id);
    }
  }, [notes, selectedId]);

  // Persist to localStorage whenever notes change
  useEffect(() => {
    saveNotesToStorage(notes);
  }, [notes]);

  // Select a note
  // PUBLIC_INTERFACE
  function handleSelectNote(id) {
    setSelectedId(id);
    setEditing(false);
  }

  // Create a new note
  // PUBLIC_INTERFACE
  function handleAddNote() {
    const newNote = {
      id: generateId(),
      title: "Untitled Note",
      body: "",
      created: Date.now(),
      updated: Date.now()
    };
    setNotes([newNote, ...notes]);
    setSelectedId(newNote.id);
    setEditing(true);
    setEditTitle(newNote.title);
    setEditBody(newNote.body);
    setTimeout(() => {
      if (editorRef.current) editorRef.current.focus();
    }, 0);
  }

  // Enter edit mode for current note
  // PUBLIC_INTERFACE
  function handleEditNote() {
    const note = notes.find((n) => n.id === selectedId);
    if (note) {
      setEditing(true);
      setEditTitle(note.title);
      setEditBody(note.body);
      setTimeout(() => {
        if (editorRef.current) editorRef.current.focus();
      }, 0);
    }
  }

  // Cancel editing
  // PUBLIC_INTERFACE
  function handleCancelEdit() {
    setEditing(false);
  }

  // Save the note (for new or edited)
  // PUBLIC_INTERFACE
  function handleSaveNote() {
    if (!editTitle.trim() && !editBody.trim()) {
      // Don't allow blank notes
      return;
    }
    setNotes((prev) =>
      prev.map((n) =>
        n.id === selectedId
          ? { ...n, title: editTitle, body: editBody, updated: Date.now() }
          : n
      )
    );
    setEditing(false);
  }

  // Delete current note
  // PUBLIC_INTERFACE
  function handleDeleteNote() {
    if (!selectedId) return;
    const idx = notes.findIndex((n) => n.id === selectedId);
    if (idx === -1) return;
    if (
      window.confirm(
        "Delete this note? This action cannot be undone."
      )
    ) {
      const updated = [...notes];
      updated.splice(idx, 1);
      setNotes(updated);
      if (updated.length > 0) {
        setSelectedId(updated[0].id);
      } else {
        setSelectedId("");
      }
      setEditing(false);
    }
  }

  // Update fields while editing
  const handleEditTitleChange = (e) => setEditTitle(e.target.value);
  const handleEditBodyChange = (e) => setEditBody(e.target.value);

  // PUBLIC_INTERFACE
  function handleSearchChange(e) {
    setSearch(e.target.value);
  }

  // Find note by id
  const selectedNote = notes.find((n) => n.id === selectedId);

  // Filter notes by search query (case-insensitive in title/body)
  const filteredNotes = search
    ? notes.filter(
        (note) =>
          note.title.toLowerCase().includes(search.toLowerCase()) ||
          note.body.toLowerCase().includes(search.toLowerCase())
      )
    : notes;

  // Date formatting
  function formatTimestamp(ts) {
    return new Date(ts).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short"
    });
  }

  // Modern accent and style
  useEffect(() => {
    document.body.style.background = "var(--bg-primary)";
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Render UI
  return (
    <div className="notes-app">
      <header className="notes-header">
        <span className="app-title">Notes</span>
        <div className="header-actions">
          <button
            className="note-add-btn"
            style={{ background: "#f50057" }}
            onClick={handleAddNote}
            aria-label="Add new note"
          >
            ＋ New
          </button>
        </div>
      </header>
      <div className="layout">
        <aside className="sidebar">
          <input
            className="search"
            value={search}
            onChange={handleSearchChange}
            type="search"
            placeholder="Search notes..."
            aria-label="Search notes"
          />
          <ul className="notes-list">
            {filteredNotes.length === 0 ? (
              <li className="notes-empty">No notes found.</li>
            ) : (
              filteredNotes.map((note) => (
                <li
                  key={note.id}
                  className={
                    "note-list-item" +
                    (note.id === selectedId ? " selected" : "")
                  }
                  onClick={() => handleSelectNote(note.id)}
                  tabIndex={0}
                  aria-label={`Select note "${note.title}"`}
                >
                  <span className="note-title">{note.title || <em>(untitled)</em>}</span>
                  <span className="note-date">
                    {formatTimestamp(note.updated)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </aside>
        <main className="main-area">
          {!selectedNote ? (
            <div className="empty-state">
              <p>No note selected.</p>
              <p>
                Click <span style={{ color: "#f50057" }}>＋ New</span> to create your first note!
              </p>
            </div>
          ) : editing ? (
            <div className="note-editor">
              <input
                className="note-title-edit"
                value={editTitle}
                onChange={handleEditTitleChange}
                placeholder="Title"
                aria-label="Note title"
                autoFocus
                maxLength={100}
              />
              <textarea
                ref={editorRef}
                className="note-body-edit"
                value={editBody}
                onChange={handleEditBodyChange}
                placeholder="Write your note..."
                aria-label="Note content"
              />
              <div className="note-actions">
                <button
                  className="btn-save"
                  onClick={handleSaveNote}
                  style={{ background: "#1976d2", color: "#fff" }}
                >
                  Save
                </button>
                <button
                  className="btn-cancel"
                  onClick={handleCancelEdit}
                  style={{ background: "none", color: "#1976d2" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="note-viewer">
              <div className="note-view-head">
                <h2 className="note-title-main">
                  {selectedNote.title || <em>(untitled)</em>}
                </h2>
                <span className="note-date">
                  {formatTimestamp(selectedNote.updated)}
                </span>
              </div>
              <div className="note-body-view">
                {selectedNote.body
                  ? selectedNote.body.split("\n").map((line, idx) => (
                      <div key={idx}>{line}</div>
                    ))
                  : <div className="empty-note">No content</div>
                }
              </div>
              <div className="note-actions right">
                <button
                  className="btn-edit"
                  style={{ background: "#1976d2", color: "#fff" }}
                  onClick={handleEditNote}
                >
                  Edit
                </button>
                <button
                  className="btn-delete"
                  style={{ background: "#f50057", color: "#fff" }}
                  onClick={handleDeleteNote}
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
      <footer className="footer">
        <span>
          Notemaster &mdash; Modern minimal notes app &copy; {new Date().getFullYear()}
        </span>
      </footer>
    </div>
  );
}

export default App;
