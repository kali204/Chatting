export default function PendingRequests({ requests, contacts, onAccept }) {
  const acceptedIds = new Set(contacts.map((u) => u.id));
  if (!requests || requests.length === 0) return null;
  return (
    <div className="pt-4 pl-2">
      <h3 className="text-xs font-semibold text-gray-500 mb-2">
        Pending requests
      </h3>
      {requests
        .filter((u) => !acceptedIds.has(u.id))
        .map((u) => (
          <div
            key={`pending-${u.id}`}
            className="flex items-center justify-between mb-2 rounded-lg bg-yellow-100 px-3 py-2"
          >
            <span>{u.username}</span>
            <button
              className="px-3 py-1 text-xs bg-blue-500 text-white rounded font-medium"
              onClick={() => onAccept(u.id)}
            >
              Accept
            </button>
          </div>
        ))}
    </div>
  );
}
