import ContactAvatar from "./ContactAvatar";
import './css/SidebarContact.css';

export default function SidebarContact({ user, active, onClick, lastMsg }) {
  return (
    <div
      onClick={onClick}
      className={`sidebar-contact ${active ? 'active' : ''}`}
    >
      <div className="contact-indicator"></div>
      
      <div className="contact-content">
        <div className="avatar-wrapper">
          <ContactAvatar
            username={user.username}
            id={user.id}
            avatarUrl={user.avatar_url}
          />
          <div className="online-status"></div>
        </div>
        
        <div className="contact-info">
          <div className="contact-header">
            <span className="username">{user.username}</span>
            <span className="timestamp">2m</span>
          </div>
          <div className="last-message">
            {lastMsg || <span className="no-message">No messages yet</span>}
          </div>
        </div>
      </div>
      
      <div className="hover-glow"></div>
    </div>
  );
}
