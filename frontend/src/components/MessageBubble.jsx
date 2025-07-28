import './css/MessageBubble.css';

export default function MessageBubble({ msg, isSender }) {
  if (!msg) return null;
  
  const getUrl = (url) =>
    url && url.startsWith("/uploads") ? `http://localhost:5000${url}` : url;

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`message-wrapper ${isSender ? 'sender' : 'receiver'}`}>
      <div className={`message-bubble ${isSender ? 'bubble-sender' : 'bubble-receiver'}`}>
        {/* Media Content */}
        {msg.type === "image" && (
          <div className="media-container">
            <img
              src={getUrl(msg.url)}
              alt={msg.filename || "Image"}
              className="message-image"
              loading="lazy"
            />
            <div className="image-overlay">
              <button className="download-btn" title="Download">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {msg.type === "audio" && (
          <div className="audio-container">
            <div className="audio-player">
              <button className="play-btn">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
              <audio
                controls
                src={getUrl(msg.url)}
                className="audio-element"
              />
              <div className="audio-waveform">
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
              </div>
            </div>
          </div>
        )}

        {msg.type === "file" && (
          <div className="file-container">
            <div className="file-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <div className="file-info">
              <span className="file-name">{msg.filename || "Unknown file"}</span>
              <span className="file-size">PDF Document</span>
            </div>
            <a
              href={getUrl(msg.url)}
              download={msg.filename}
              target="_blank"
              rel="noopener noreferrer"
              className="download-link"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
            </a>
          </div>
        )}

        {/* Text Content */}
        {(msg.text || !msg.type) && (
          <div className="message-text">
            {msg.text}
          </div>
        )}

        {/* Message Info */}
        <div className="message-info">
          <span className="message-time">{formatTime(msg.timestamp)}</span>
          {isSender && (
            <div className="message-status">
              <svg className="status-icon delivered" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
