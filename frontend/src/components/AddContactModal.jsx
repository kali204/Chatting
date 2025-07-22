import { useState } from "react";

export default function AddContactModal({ onClose, onUserAdded }) {
  const [search, setSearch] = useState("");
  const [result, setResult] = useState(null);
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  // Handles search for user by username or email
  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    setInfo("");
    try {
      const res = await fetch(
        `/api/users/search?query=${encodeURIComponent(search)}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (res.ok) {
        const user = await res.json();
        setResult(user && user.id ? user : null);
        setInfo(user && user.id ? "" : "No user found");
      } else {
        setResult(null);
        setInfo("Search failed");
      }
    } catch (e) {
      setResult(null);
      setInfo("Search failed");
    }
    setLoading(false);
  };

  // Handles sending a contact request
  const handleAdd = async () => {
    if (!result) return;
    setLoading(true);
    try {
      const res = await fetch("/api/contacts/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ contactId: result.id }),
      });
      if (res.ok) {
        setInfo("Contact request sent!");
        setResult(null);
        if (onUserAdded) onUserAdded();
      } else {
        setInfo("Failed to send request");
      }
    } catch (e) {
      setInfo("Failed to send request");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-96 relative flex flex-col items-center">
        <button
          className="absolute right-2 top-2 text-gray-500 text-lg"
          onClick={onClose}
        >
          ✕
        </button>
        <div className="w-14 h-14 bg-blue-100 flex items-center justify-center rounded-full text-2xl font-bold mb-4">
          +
        </div>
        <h2 className="font-bold text-2xl mb-4 text-blue-700 text-center">
          Add Contact
        </h2>
        <input
          className="w-full border rounded px-3 py-2 mb-2 focus:outline-blue-400"
          placeholder="Search username or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          disabled={loading}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSearch();
          }}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded mb-2 w-full"
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? "Searching..." : "Search"}
        </button>
        {result && (
          <div className="my-3 p-2 w-full bg-blue-50 rounded flex items-center justify-between">
            <span className="flex-1">
              {result.username}{" "}
              <span className="text-xs text-gray-400">({result.email})</span>
            </span>
            <button
              className="bg-green-600 text-white px-3 py-1 rounded"
              onClick={handleAdd}
              disabled={loading}
            >
              Send
            </button>
          </div>
        )}
        <div className="text-sm text-gray-700 my-2">{info}</div>
      </div>
    </div>
  );
}
