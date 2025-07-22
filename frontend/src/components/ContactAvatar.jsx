const colors = [
  "bg-yellow-300", "bg-blue-300", "bg-pink-200",
  "bg-green-200", "bg-orange-200", "bg-teal-200"
];

export default function ContactAvatar({ username, id, avatarUrl, size = "w-11 h-11", font = "text-xl" }) {
  if (avatarUrl) {
    const url = avatarUrl.startsWith("/uploads")
      ? `http://localhost:5000${avatarUrl}`
      : avatarUrl;
    return (
      <img
        src={url}
        alt={username}
        className={`${size} rounded-full object-cover shadow`}
        style={{ minWidth: "2.75rem" }}
      />
    );
  }
  return (
    <div
      className={`flex items-center justify-center ${size} rounded-full ${colors[id % colors.length]} ${font} font-semibold shadow`}
      style={{ minWidth: "2.75rem" }}
    >
      {username ? username[0]?.toUpperCase() : "?"}
    </div>
  );
}
