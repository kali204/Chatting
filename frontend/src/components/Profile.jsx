import { useState, useEffect } from "react";

function ProfileModal({ user, onClose, onProfileUpdated }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [avatarFile, setAvatarFile] = useState(null);
  

  useEffect(() => {
    fetch("/api/profile", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => res.json())
      .then(setProfile)
      .finally(() => setLoading(false));
  }, []);

  const handleAvatarUpload = async e => {
    const file = e.target.files[0];
    setAvatarFile(file);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/profile/avatar", {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: formData
    });
    const data = await res.json();
    setProfile(prev => ({ ...prev, avatar_url: data.url }));
  };

  const handleSave = async () => {
    await fetch("/api/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({
        username: profile.username,
        about: profile.about,
        avatar_url: profile.avatar_url
      })
    });
    onProfileUpdated && onProfileUpdated(profile);
    onClose();
  };

  if (loading || !profile) return <div>Loading...</div>;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 w-96 relative flex flex-col items-center">
        <button className="absolute right-2 top-2 text-gray-500 text-lg" onClick={onClose}>
          ✕
        </button>
        <h2 className="font-bold text-2xl mb-4 text-blue-700 text-center">Edit Profile</h2>
        <label className="mb-4 cursor-pointer">
          <img
            src={profile.avatar_url ? `http://localhost:5000${profile.avatar_url}` : "/default-avatar.png"}
            alt="avatar"
            className="w-24 h-24 rounded-full object-cover border-4 border-blue-100 mx-auto mb-2"
          />
          <input type="file" className="hidden" onChange={handleAvatarUpload} />
          <div className="text-xs text-blue-500 text-center">Change avatar</div>
        </label>
        <input
          className="w-full border rounded px-3 py-2 mb-2"
          value={profile.username}
          onChange={e => setProfile(p => ({ ...p, username: e.target.value }))}
        />
        <textarea
          className="w-full border rounded px-3 py-2 mb-2"
          placeholder="About (e.g. Busy, Available...)"
          value={profile.about || ""}
          onChange={e => setProfile(p => ({ ...p, about: e.target.value }))}
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded mb-2 w-full" onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
}
export default ProfileModal;