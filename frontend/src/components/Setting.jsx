import { useState } from "react";

const tabList = [
  { key: "account", label: "Account" },
  { key: "privacy", label: "Privacy" },
  { key: "notifications", label: "Notifications" },
  { key: "appearance", label: "Appearance" },
];

export default function SettingsModal({ onClose, user, onUpdate }) {
  const [tab, setTab] = useState("account");
  const [form, setForm] = useState({
    username: user.username,
    about: user.about || "",
    lastSeenVisible: user.lastSeenVisible ?? true,
    darkMode: user.darkMode ?? false,
    notifications: user.notifications ?? true,
  });
  const [avatarPreview, setAvatarPreview] = useState(user.avatar_url);
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  // Upload avatar logic unchanged from your code
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    const res = await fetch("/api/profile/avatar", {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: formData,
    });
    const data = await res.json();
    if (data.url) {
      setAvatarPreview(data.url);
      setInfo("Avatar updated");
      if (onUpdate) onUpdate({ ...user, avatar_url: data.url });
    } else {
      setInfo("Upload failed");
    }
    setLoading(false);
  };

  // Save changes logic unchanged from your code
  const handleSave = async () => {
    setLoading(true);
    setInfo("");

    try {
      if (tab === "account") {
        const res = await fetch("/api/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            username: form.username,
            about: form.about,
            avatar_url: avatarPreview,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setInfo("Profile updated!");
          if (onUpdate) onUpdate({ ...user, ...form, avatar_url: avatarPreview });
        } else {
          setInfo(data.message || "Update failed");
        }
      } else if (tab === "privacy") {
        await fetch("/api/settings/privacy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ lastSeenVisible: form.lastSeenVisible }),
        });
        setInfo("Privacy settings updated");
      } else if (tab === "notifications") {
        await fetch("/api/settings/notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ notifications: form.notifications }),
        });
        setInfo("Notification settings updated");
      } else if (tab === "appearance") {
        await fetch("/api/settings/appearance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ darkMode: form.darkMode }),
        });
        setInfo("Appearance updated");
        if (form.darkMode) {
          document.body.classList.add("dark");
        } else {
          document.body.classList.remove("dark");
        }
      }
    } catch (error) {
      setInfo("An error occurred. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg relative overflow-hidden">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h2 className="font-semibold text-xl text-gray-800">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 focus:outline-none"
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        <div className="flex border-b divide-x divide-gray-300 text-sm font-medium text-center">
          {tabList.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              disabled={loading}
              className={`flex-1 px-4 py-3 hover:bg-gray-50 transition-colors ${
                tab === key
                  ? "border-b-4 border-blue-600 text-blue-600"
                  : "text-gray-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* === TAB PANELS === */}
        <div className="p-6 max-h-[400px] overflow-y-auto space-y-6">
          {tab === "account" && (
            <>
              <div className="flex items-center space-x-6">
                <label className="relative block w-20 h-20 rounded-full bg-gray-200 overflow-hidden cursor-pointer">
                  {avatarPreview ? (
                    <img
                      src={
                        avatarPreview.startsWith("/")
                          ? `http://localhost:5000${avatarPreview}`
                          : avatarPreview
                      }
                      alt="Profile avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl font-bold text-gray-400 flex justify-center items-center h-full">
                      {user.username[0]?.toUpperCase() || "U"}
                    </span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="opacity-0 absolute inset-0 cursor-pointer"
                    onChange={handlePhotoChange}
                    disabled={loading}
                  />
                </label>
                <button
                  disabled={loading || !avatarPreview}
                  onClick={() => {
                    setAvatarPreview(null);
                    fetch("/api/profile/avatar", {
                      method: "DELETE",
                      headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                      },
                    });
                  }}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition"
                >
                  Remove Photo
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">
                  Username
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={form.username}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, username: e.target.value }))
                  }
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">
                  About
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={form.about}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, about: e.target.value }))
                  }
                  disabled={loading}
                />
              </div>
              <button
                onClick={handleSave}
                className="w-full bg-blue-600 text-white rounded py-2 font-semibold mt-2 hover:bg-blue-700 transition disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              {info && (
                <p className="mt-2 text-sm text-center text-blue-600">{info}</p>
              )}
            </>
          )}

          {tab === "privacy" && (
            <>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.lastSeenVisible}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      lastSeenVisible: e.target.checked,
                    }))
                  }
                  disabled={loading}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span className="text-gray-800">Show my "Last Seen" to others</span>
              </label>
              <button
                onClick={handleSave}
                className="w-full bg-blue-600 text-white rounded py-2 font-semibold mt-4 hover:bg-blue-700 transition disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              {info && (
                <p className="mt-2 text-sm text-center text-blue-600">{info}</p>
              )}
            </>
          )}

          {tab === "notifications" && (
            <>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.notifications}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      notifications: e.target.checked,
                    }))
                  }
                  disabled={loading}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span className="text-gray-800">Enable notifications</span>
              </label>
              <button
                onClick={handleSave}
                className="w-full bg-blue-600 text-white rounded py-2 font-semibold mt-4 hover:bg-blue-700 transition disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              {info && (
                <p className="mt-2 text-sm text-center text-blue-600">{info}</p>
              )}
            </>
          )}

          {tab === "appearance" && (
            <>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.darkMode}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, darkMode: e.target.checked }))
                  }
                  disabled={loading}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span className="text-gray-800">Dark mode</span>
              </label>
              <button
                onClick={handleSave}
                className="w-full bg-blue-600 text-white rounded py-2 font-semibold mt-4 hover:bg-blue-700 transition disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              {info && (
                <p className="mt-2 text-sm text-center text-blue-600">{info}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
