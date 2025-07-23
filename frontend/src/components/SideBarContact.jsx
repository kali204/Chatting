import ContactAvatar from "./ContactAvatar";

export default function SidebarContact({ user, active, onClick, lastMsg }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-lg transition ${
        active ? "bg-gray-100" : "hover:bg-gray-50"
      }`}
      style={{
        minHeight: "3.25rem",
        borderLeft: active ? "5px solid #4299e1" : "5px solid transparent",
      }}
    >
      <ContactAvatar
        username={user.username}
        id={user.id}
        avatarUrl={user.avatar_url}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <span className="font-semibold text-base text-gray-900">
          {user.username}
        </span>
        <span className="text-xs text-gray-400 truncate max-w-[140px]">
          {lastMsg || <>&nbsp;</>}
        </span>
      </div>
      

    </div>
  );
}
