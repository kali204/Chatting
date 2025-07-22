export default function MessageBubble({ msg, isSender }) {
  if (!msg) return null;
  const getUrl = (url) =>
    url && url.startsWith("/uploads") ? `http://localhost:5000${url}` : url;
  return (
    <div className={`flex ${isSender ? "justify-end" : ""}`}>
      <div
        className={`rounded-2xl px-5 py-2 mb-3 text-base whitespace-pre-line ${
          isSender
            ? "bg-blue-500 text-white rounded-br-md"
            : "bg-gray-100 text-black rounded-bl-md"
        }`}
        style={{ maxWidth: "65%" }}
      >
        {msg.type === "image" && (
          <img
            src={getUrl(msg.url)}
            alt={msg.filename || "img"}
            className="rounded-lg max-h-40 border mb-1"
            style={{ maxWidth: 220 }}
          />
        )}
        {msg.type === "audio" && (
          <audio
            controls
            src={getUrl(msg.url)}
            className="my-2"
            style={{ width: 180 }}
          />
        )}
        {msg.type === "file" && (
          <a
            href={getUrl(msg.url)}
            download={msg.filename}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-sm break-all"
          >
            {msg.filename || "Download file"}
          </a>
        )}
        {(msg.text || !msg.type) && <span>{msg.text}</span>}
      </div>
    </div>
  );
}
